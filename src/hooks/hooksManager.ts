import * as vscode from 'vscode';
import { HooksConfig, HookEventName, HookMatcher, HookExecutionResult } from './types';
import { ConsentManager } from '../consent/consentManager';
import { PromptDiscovery } from '../prompts/promptDiscovery';
import { PromptRunner } from '../prompts/promptRunner';

/**
 * Track if we've run in THIS extension host process (resets on each F5/reload)
 */
let sessionRanThisProcess = false;

/**
 * Manages the lifecycle and execution of hooks
 */
export class HooksManager {
    private hooksConfig: HooksConfig | undefined;

    constructor(
        private readonly context: vscode.ExtensionContext,
        private readonly consentManager: ConsentManager,
        private readonly promptDiscovery: PromptDiscovery,
        private readonly promptRunner: PromptRunner
    ) {}

    /**
     * Run hooks for the SessionStart event
     */
    async runStartupHooks(): Promise<void> {
        const config = vscode.workspace.getConfiguration('copilotPromptHooks');
        const runOncePerSession = config.get<boolean>('runOncePerSession', true);

        // Check if we've already run this session (uses module-level variable that resets on reload)
        if (runOncePerSession && sessionRanThisProcess) {
            console.log('Copilot Prompt Hooks: Already ran this session, skipping');
            return;
        }

        // Check consent
        const requireConsent = config.get<boolean>('requireConsent', true);
        if (requireConsent) {
            const hasConsent = await this.consentManager.checkAndRequestConsent();
            if (!hasConsent) {
                console.log('Copilot Prompt Hooks: User denied consent, skipping');
                return;
            }
        }

        // Load hooks configuration
        await this.loadHooksConfig();

        // Get delay from settings
        const delay = config.get<number>('autoRunDelay', 2000);

        // Wait for the specified delay to ensure VS Code is fully loaded
        await new Promise(resolve => setTimeout(resolve, delay));

        // Run SessionStart hooks
        await this.runHooksForEvent('SessionStart');

        // Mark session as ran
        if (runOncePerSession) {
            sessionRanThisProcess = true;
        }
    }

    /**
     * Run all hooks for a specific event
     */
    async runHooksForEvent(eventName: HookEventName): Promise<HookExecutionResult[]> {
        const results: HookExecutionResult[] = [];

        // Try hooks from config file first
        if (this.hooksConfig?.hooks[eventName]) {
            for (const matcher of this.hooksConfig.hooks[eventName]!) {
                const matcherResults = await this.runHookMatcher(matcher);
                results.push(...matcherResults);
            }
        }

        // If no config file hooks, fall back to settings-based startup prompt
        if (eventName === 'SessionStart' && results.length === 0) {
            const result = await this.runFallbackStartupPrompt();
            if (result) {
                results.push(result);
            }
        }

        return results;
    }

    /**
     * Run all hooks in a matcher
     */
    private async runHookMatcher(matcher: HookMatcher): Promise<HookExecutionResult[]> {
        const results: HookExecutionResult[] = [];

        for (const hook of matcher.hooks) {
            const startTime = Date.now();

            try {
                if (hook.type === 'prompt' && hook.promptFile) {
                    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
                    if (workspaceFolder) {
                        const promptUri = vscode.Uri.joinPath(workspaceFolder.uri, hook.promptFile);
                        await this.promptRunner.runPromptFile(promptUri);
                        results.push({
                            success: true,
                            duration: Date.now() - startTime
                        });
                    }
                } else if (hook.type === 'command' && hook.command) {
                    // Command execution (for future enhancement)
                    console.log(`Copilot Prompt Hooks: Command hooks not yet implemented: ${hook.command}`);
                    results.push({
                        success: false,
                        error: 'Command hooks not yet implemented',
                        duration: Date.now() - startTime
                    });
                }
            } catch (error) {
                results.push({
                    success: false,
                    error: error instanceof Error ? error.message : String(error),
                    duration: Date.now() - startTime
                });
            }
        }

        return results;
    }

    /**
     * Run the fallback startup prompt based on settings
     */
    private async runFallbackStartupPrompt(): Promise<HookExecutionResult | undefined> {
        const startTime = Date.now();

        try {
            const config = vscode.workspace.getConfiguration('copilotPromptHooks');
            const promptPath = config.get<string>('startupPromptPath', '');

            let promptUri: vscode.Uri | undefined;

            if (promptPath) {
                const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
                if (workspaceFolder) {
                    promptUri = vscode.Uri.joinPath(workspaceFolder.uri, promptPath);
                }
            } else {
                promptUri = await this.promptDiscovery.findStartupPrompt();
            }

            if (promptUri) {
                await this.promptRunner.runPromptFile(promptUri);
                return {
                    success: true,
                    duration: Date.now() - startTime
                };
            } else {
                // No prompt file found - offer to create one
                this.offerToCreateStartupPrompt();
            }
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error),
                duration: Date.now() - startTime
            };
        }

        return undefined;
    }

    /**
     * Offer to create a startup prompt file
     */
    private offerToCreateStartupPrompt(): void {
        vscode.window.showInformationMessage(
            'No startup prompt file found. Would you like to create one?',
            'Create startup.prompt.md',
            'Not now'
        ).then(async selection => {
            if (selection === 'Create startup.prompt.md') {
                await vscode.commands.executeCommand('copilot-prompt-hooks.createStartupPrompt');
            }
        });
    }

    /**
     * Load hooks configuration from .vscode/copilot-hooks.json
     */
    private async loadHooksConfig(): Promise<void> {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            return;
        }

        const configUri = vscode.Uri.joinPath(workspaceFolder.uri, '.vscode', 'copilot-hooks.json');

        try {
            const configData = await vscode.workspace.fs.readFile(configUri);
            const configText = new TextDecoder().decode(configData);
            this.hooksConfig = JSON.parse(configText) as HooksConfig;
            console.log('Copilot Prompt Hooks: Loaded hooks configuration');
        } catch {
            // Config file doesn't exist or is invalid - this is fine
            this.hooksConfig = undefined;
        }
    }

    /**
     * Reset the session ran flag (useful for testing)
     */
    resetSessionFlag(): void {
        sessionRanThisProcess = false;
    }
}
