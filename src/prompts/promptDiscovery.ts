import * as vscode from 'vscode';

/**
 * Discovers prompt files in the workspace
 */
export class PromptDiscovery {
    /**
     * Find the startup prompt file based on conventions
     * Priority:
     * 1. startup.prompt.md in workspace root
     * 2. .github/prompts/startup.prompt.md
     * 3. .vscode/startup.prompt.md
     * 4. First *.prompt.md found in workspace
     */
    async findStartupPrompt(): Promise<vscode.Uri | undefined> {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            return undefined;
        }

        // Check priority locations
        const priorityPaths = [
            'startup.prompt.md',
            '.github/prompts/startup.prompt.md',
            '.vscode/startup.prompt.md'
        ];

        for (const relativePath of priorityPaths) {
            const uri = vscode.Uri.joinPath(workspaceFolder.uri, relativePath);
            if (await this.fileExists(uri)) {
                return uri;
            }
        }

        // Fall back to first prompt file found
        const allPromptFiles = await this.findAllPromptFiles();
        return allPromptFiles[0];
    }

    /**
     * Find all prompt files in the workspace
     */
    async findAllPromptFiles(): Promise<vscode.Uri[]> {
        const config = vscode.workspace.getConfiguration('copilotPromptHooks');
        const pattern = config.get<string>('promptFilePattern', '**/*.prompt.md');

        const files = await vscode.workspace.findFiles(
            pattern,
            '**/node_modules/**',
            100 // Limit to prevent performance issues
        );

        return files;
    }

    /**
     * Check if a prompt file exists at the given path
     */
    async findPromptByPath(relativePath: string): Promise<vscode.Uri | undefined> {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            return undefined;
        }

        const uri = vscode.Uri.joinPath(workspaceFolder.uri, relativePath);
        if (await this.fileExists(uri)) {
            return uri;
        }

        return undefined;
    }

    /**
     * Check if a file exists
     */
    private async fileExists(uri: vscode.Uri): Promise<boolean> {
        try {
            await vscode.workspace.fs.stat(uri);
            return true;
        } catch {
            return false;
        }
    }
}
