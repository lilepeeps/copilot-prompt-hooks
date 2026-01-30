import * as vscode from 'vscode';

/**
 * Known Copilot prompt command IDs to try
 */
const PROMPT_COMMANDS = [
    'workbench.action.chat.run.prompt.current',  // VS Code built-in
    'github.copilot.runPromptFile',              // GitHub Copilot extension
    'workbench.action.chat.run.prompt',          // Run prompt picker
];

/**
 * Handles running prompt files through Copilot
 */
export class PromptRunner {
    private workingCommand: string | undefined;

    /**
     * Run a prompt file
     */
    async runPromptFile(promptUri: vscode.Uri): Promise<void> {
        console.log(`Copilot Prompt Hooks: Running prompt file: ${promptUri.fsPath}`);

        // First, open the prompt file
        const document = await vscode.workspace.openTextDocument(promptUri);
        await vscode.window.showTextDocument(document, {
            preview: false,
            preserveFocus: false
        });

        // Give VS Code a moment to register the active editor
        await new Promise(resolve => setTimeout(resolve, 500));

        // Try to run the prompt using available commands
        const success = await this.executePromptCommand(promptUri);

        if (!success) {
            // If no command worked, show a helpful message
            const action = await vscode.window.showWarningMessage(
                'Could not auto-run the prompt. The prompt file is now open - you can run it manually.',
                'Open Chat',
                'Dismiss'
            );

            if (action === 'Open Chat') {
                await vscode.commands.executeCommand('workbench.action.chat.open');
            }
        }
    }

    /**
     * Try to execute the prompt using available commands
     */
    private async executePromptCommand(promptUri: vscode.Uri): Promise<boolean> {
        // If we already know a working command, try it first
        if (this.workingCommand) {
            try {
                await vscode.commands.executeCommand(this.workingCommand, promptUri);
                console.log(`Copilot Prompt Hooks: Successfully ran prompt using ${this.workingCommand}`);
                return true;
            } catch {
                // Command stopped working, clear it and try others
                this.workingCommand = undefined;
            }
        }

        // Try each known command
        for (const commandId of PROMPT_COMMANDS) {
            if (await this.tryCommand(commandId, promptUri)) {
                this.workingCommand = commandId;
                return true;
            }
        }

        return false;
    }

    /**
     * Try to execute a specific command
     */
    private async tryCommand(commandId: string, promptUri: vscode.Uri): Promise<boolean> {
        try {
            // Check if the command exists
            const commands = await vscode.commands.getCommands(true);
            if (!commands.includes(commandId)) {
                console.log(`Copilot Prompt Hooks: Command not available: ${commandId}`);
                return false;
            }

            // Try to execute the command
            await vscode.commands.executeCommand(commandId, promptUri);
            console.log(`Copilot Prompt Hooks: Successfully executed: ${commandId}`);
            return true;
        } catch (error) {
            console.log(`Copilot Prompt Hooks: Failed to execute ${commandId}: ${error}`);
            return false;
        }
    }

    /**
     * Get list of available prompt-related commands (for debugging)
     */
    async getAvailablePromptCommands(): Promise<string[]> {
        const allCommands = await vscode.commands.getCommands(true);
        return allCommands.filter(cmd => 
            cmd.includes('prompt') || 
            cmd.includes('chat') ||
            cmd.includes('copilot')
        );
    }
}
