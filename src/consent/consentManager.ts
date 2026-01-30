import * as vscode from 'vscode';
import * as crypto from 'crypto';
import { ConsentStatus, WorkspaceConsent } from '../hooks/types';

/**
 * Manages user consent for auto-running hooks in workspaces
 */
export class ConsentManager {
    private static readonly CONSENT_KEY_PREFIX = 'copilotPromptHooks.consent.';

    constructor(private readonly context: vscode.ExtensionContext) {}

    /**
     * Check if consent has been granted for the current workspace
     * If consent is pending, prompt the user
     */
    async checkAndRequestConsent(): Promise<boolean> {
        const workspaceId = this.getWorkspaceId();
        if (!workspaceId) {
            return false;
        }

        const consent = this.getConsent(workspaceId);

        if (consent?.status === 'granted') {
            // Check if hooks config has changed since consent was given
            const currentHash = await this.getHooksConfigHash();
            if (consent.configHash && currentHash !== consent.configHash) {
                // Config changed, need to re-consent
                return this.requestConsent(workspaceId);
            }
            return true;
        }

        if (consent?.status === 'denied') {
            // User previously denied, don't ask again this session
            return false;
        }

        // No consent record or pending, ask user
        return this.requestConsent(workspaceId);
    }

    /**
     * Request consent from the user
     */
    private async requestConsent(workspaceId: string): Promise<boolean> {
        const workspaceName = vscode.workspace.workspaceFolders?.[0]?.name || 'this workspace';
        
        const selection = await vscode.window.showInformationMessage(
            `Copilot Prompt Hooks wants to auto-run a prompt file when opening "${workspaceName}". Allow?`,
            {
                modal: false,
                detail: 'This will run a .prompt.md file automatically when this workspace opens. You can change this in settings.'
            },
            'Allow',
            'Allow Always',
            'Deny',
            'Configure'
        );

        switch (selection) {
            case 'Allow':
            case 'Allow Always':
                await this.setConsent(workspaceId, 'granted');
                return true;
            
            case 'Deny':
                await this.setConsent(workspaceId, 'denied');
                return false;
            
            case 'Configure':
                await vscode.commands.executeCommand('copilot-prompt-hooks.configureHooks');
                return false;
            
            default:
                // User dismissed the dialog
                return false;
        }
    }

    /**
     * Reset consent for the current workspace
     */
    async resetConsent(): Promise<void> {
        const workspaceId = this.getWorkspaceId();
        if (workspaceId) {
            await this.context.workspaceState.update(
                ConsentManager.CONSENT_KEY_PREFIX + workspaceId,
                undefined
            );
        }
    }

    /**
     * Get consent status for a workspace
     */
    private getConsent(workspaceId: string): WorkspaceConsent | undefined {
        return this.context.workspaceState.get<WorkspaceConsent>(
            ConsentManager.CONSENT_KEY_PREFIX + workspaceId
        );
    }

    /**
     * Set consent status for a workspace
     */
    private async setConsent(workspaceId: string, status: ConsentStatus): Promise<void> {
        const configHash = await this.getHooksConfigHash();
        
        const consent: WorkspaceConsent = {
            status,
            timestamp: Date.now(),
            configHash
        };

        await this.context.workspaceState.update(
            ConsentManager.CONSENT_KEY_PREFIX + workspaceId,
            consent
        );
    }

    /**
     * Get a unique identifier for the current workspace
     */
    private getWorkspaceId(): string | undefined {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            return undefined;
        }

        // Use a hash of the workspace path as the ID
        return crypto.createHash('sha256')
            .update(workspaceFolder.uri.fsPath)
            .digest('hex')
            .substring(0, 16);
    }

    /**
     * Get a hash of the current hooks configuration
     * Used to detect when config changes and re-request consent
     */
    private async getHooksConfigHash(): Promise<string | undefined> {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            return undefined;
        }

        const configUri = vscode.Uri.joinPath(workspaceFolder.uri, '.vscode', 'copilot-hooks.json');

        try {
            const configData = await vscode.workspace.fs.readFile(configUri);
            return crypto.createHash('sha256')
                .update(configData)
                .digest('hex')
                .substring(0, 16);
        } catch {
            return undefined;
        }
    }
}
