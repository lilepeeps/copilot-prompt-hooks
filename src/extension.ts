import * as vscode from 'vscode';
import { HooksManager } from './hooks/hooksManager';
import { ConsentManager } from './consent/consentManager';
import { PromptRunner } from './prompts/promptRunner';
import { PromptDiscovery } from './prompts/promptDiscovery';
import { PromptScaffolder } from './prompts/promptScaffolder';

let hooksManager: HooksManager | undefined;

export async function activate(context: vscode.ExtensionContext): Promise<void> {
    console.log('Copilot Prompt Hooks extension is activating...');

    const config = vscode.workspace.getConfiguration('copilotPromptHooks');
    const enabled = config.get<boolean>('enabled', true);

    if (!enabled) {
        console.log('Copilot Prompt Hooks is disabled in settings');
        return;
    }

    // Initialize managers
    const consentManager = new ConsentManager(context);
    const promptDiscovery = new PromptDiscovery();
    const promptRunner = new PromptRunner();
    const promptScaffolder = new PromptScaffolder();
    hooksManager = new HooksManager(context, consentManager, promptDiscovery, promptRunner);

    // Register commands
    registerCommands(context, hooksManager, promptScaffolder, promptDiscovery, promptRunner, consentManager);

    // Run startup hooks if workspace is open
    if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
        await hooksManager.runStartupHooks();
    }

    // Watch for workspace folder changes
    context.subscriptions.push(
        vscode.workspace.onDidChangeWorkspaceFolders(async (event) => {
            if (event.added.length > 0 && hooksManager) {
                await hooksManager.runStartupHooks();
            }
        })
    );

    console.log('Copilot Prompt Hooks extension is now active');
}

function registerCommands(
    context: vscode.ExtensionContext,
    hooksManager: HooksManager,
    promptScaffolder: PromptScaffolder,
    promptDiscovery: PromptDiscovery,
    promptRunner: PromptRunner,
    consentManager: ConsentManager
): void {
    // Run prompt command
    context.subscriptions.push(
        vscode.commands.registerCommand('copilot-prompt-hooks.runPrompt', async () => {
            const config = vscode.workspace.getConfiguration('copilotPromptHooks');
            const promptPath = config.get<string>('startupPromptPath', '');
            
            if (promptPath) {
                const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
                if (workspaceFolder) {
                    const uri = vscode.Uri.joinPath(workspaceFolder.uri, promptPath);
                    await promptRunner.runPromptFile(uri);
                }
            } else {
                const promptFile = await promptDiscovery.findStartupPrompt();
                if (promptFile) {
                    await promptRunner.runPromptFile(promptFile);
                } else {
                    vscode.window.showWarningMessage('No prompt file found. Would you like to create one?', 'Create').then(async (selection) => {
                        if (selection === 'Create') {
                            await vscode.commands.executeCommand('copilot-prompt-hooks.createStartupPrompt');
                        }
                    });
                }
            }
        })
    );

    // Select and run prompt command
    context.subscriptions.push(
        vscode.commands.registerCommand('copilot-prompt-hooks.selectAndRunPrompt', async () => {
            const promptFiles = await promptDiscovery.findAllPromptFiles();
            
            if (promptFiles.length === 0) {
                vscode.window.showWarningMessage('No prompt files found in workspace.');
                return;
            }

            const items = promptFiles.map(uri => ({
                label: vscode.workspace.asRelativePath(uri),
                uri: uri
            }));

            const selected = await vscode.window.showQuickPick(items, {
                placeHolder: 'Select a prompt file to run'
            });

            if (selected) {
                await promptRunner.runPromptFile(selected.uri);
            }
        })
    );

    // Configure hooks command
    context.subscriptions.push(
        vscode.commands.registerCommand('copilot-prompt-hooks.configureHooks', async () => {
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
            if (!workspaceFolder) {
                vscode.window.showErrorMessage('No workspace folder open');
                return;
            }

            const hooksConfigUri = vscode.Uri.joinPath(workspaceFolder.uri, '.vscode', 'copilot-hooks.json');
            
            try {
                await vscode.workspace.fs.stat(hooksConfigUri);
            } catch {
                // File doesn't exist, create it with default content
                const defaultConfig = {
                    "$schema": "./copilot-hooks.schema.json",
                    "hooks": {
                        "SessionStart": [
                            {
                                "hooks": [
                                    {
                                        "type": "prompt",
                                        "promptFile": "startup.prompt.md"
                                    }
                                ]
                            }
                        ]
                    }
                };
                
                const content = new TextEncoder().encode(JSON.stringify(defaultConfig, null, 2));
                await vscode.workspace.fs.writeFile(hooksConfigUri, content);
            }

            const doc = await vscode.workspace.openTextDocument(hooksConfigUri);
            await vscode.window.showTextDocument(doc);
        })
    );

    // Create startup prompt command
    context.subscriptions.push(
        vscode.commands.registerCommand('copilot-prompt-hooks.createStartupPrompt', async () => {
            await promptScaffolder.createStartupPrompt();
        })
    );

    // Reset workspace consent command
    context.subscriptions.push(
        vscode.commands.registerCommand('copilot-prompt-hooks.resetWorkspaceConsent', async () => {
            await consentManager.resetConsent();
            vscode.window.showInformationMessage('Workspace consent has been reset. You will be prompted again on next startup.');
        })
    );
}

export function deactivate(): void {
    hooksManager = undefined;
    console.log('Copilot Prompt Hooks extension is now deactivated');
}

