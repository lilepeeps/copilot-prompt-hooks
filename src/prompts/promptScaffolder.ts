import * as vscode from 'vscode';

/**
 * Prompt file templates for scaffolding
 */
interface PromptTemplate {
    name: string;
    description: string;
    filename: string;
    content: string;
}

const PROMPT_TEMPLATES: PromptTemplate[] = [
    {
        name: 'Daily Standup',
        description: 'Load project context and prepare for daily work',
        filename: 'startup.prompt.md',
        content: `---
mode: agent
description: Daily startup routine - load project context
---

# Good morning! Let's get started.

Please help me get oriented for today's work:

1. **Check recent changes**: Look at recent commits or modified files to understand what was worked on last
2. **Review open tasks**: Check for any TODO comments, open issues, or work in progress
3. **Summarize current state**: Give me a brief overview of the project's current state

After reviewing, suggest what I should focus on today.
`
    },
    {
        name: 'Project Context',
        description: 'Load and understand the project structure',
        filename: 'startup.prompt.md',
        content: `---
mode: agent  
description: Load project context on workspace open
---

# Project Context Loader

Please analyze this workspace and provide:

1. **Project Overview**: What type of project is this? (language, framework, purpose)
2. **Key Files**: Identify the main entry points and important configuration files
3. **Dependencies**: List the key dependencies and their purposes
4. **Architecture**: Describe the high-level architecture

Keep the summary concise but informative.
`
    },
    {
        name: 'Code Review Prep',
        description: 'Prepare for reviewing code changes',
        filename: 'startup.prompt.md',
        content: `---
mode: agent
description: Prepare for code review
---

# Code Review Preparation

Please help me prepare for code review:

1. **Check for uncommitted changes**: Are there any modified files that need attention?
2. **Review recent commits**: Summarize the last few commits
3. **Identify potential issues**: Look for common code quality issues
4. **Suggest improvements**: Note any obvious improvements or refactoring opportunities

Focus on actionable feedback.
`
    },
    {
        name: 'Blank Template',
        description: 'Empty prompt file to customize',
        filename: 'startup.prompt.md',
        content: `---
mode: agent
description: Custom startup prompt
---

# Startup Prompt

<!-- Add your custom startup instructions here -->

`
    }
];

/**
 * Scaffolds new prompt files
 */
export class PromptScaffolder {
    /**
     * Create a startup prompt file with user-selected template
     */
    async createStartupPrompt(): Promise<vscode.Uri | undefined> {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            vscode.window.showErrorMessage('No workspace folder open');
            return undefined;
        }

        // Let user choose a template
        const templateItems = PROMPT_TEMPLATES.map(t => ({
            label: t.name,
            description: t.description,
            template: t
        }));

        const selected = await vscode.window.showQuickPick(templateItems, {
            placeHolder: 'Select a template for your startup prompt',
            title: 'Create Startup Prompt'
        });

        if (!selected) {
            return undefined;
        }

        // Let user choose location
        const locationItems = [
            { label: 'Workspace Root', path: '' },
            { label: '.github/prompts folder', path: '.github/prompts' },
            { label: '.vscode folder', path: '.vscode' }
        ];

        const locationSelection = await vscode.window.showQuickPick(locationItems, {
            placeHolder: 'Where should the prompt file be created?',
            title: 'Select Location'
        });

        if (!locationSelection) {
            return undefined;
        }

        // Create the file
        const targetDir = locationSelection.path 
            ? vscode.Uri.joinPath(workspaceFolder.uri, locationSelection.path)
            : workspaceFolder.uri;
        
        const targetUri = vscode.Uri.joinPath(targetDir, selected.template.filename);

        // Check if file already exists
        try {
            await vscode.workspace.fs.stat(targetUri);
            const overwrite = await vscode.window.showWarningMessage(
                `${selected.template.filename} already exists. Overwrite?`,
                'Overwrite',
                'Cancel'
            );
            if (overwrite !== 'Overwrite') {
                return undefined;
            }
        } catch {
            // File doesn't exist, create directory if needed
            if (locationSelection.path) {
                try {
                    await vscode.workspace.fs.createDirectory(targetDir);
                } catch {
                    // Directory might already exist
                }
            }
        }

        // Write the file
        const content = new TextEncoder().encode(selected.template.content);
        await vscode.workspace.fs.writeFile(targetUri, content);

        // Open the file
        const doc = await vscode.workspace.openTextDocument(targetUri);
        await vscode.window.showTextDocument(doc);

        vscode.window.showInformationMessage(
            `Created ${vscode.workspace.asRelativePath(targetUri)}. This prompt will run automatically when you open this workspace.`
        );

        return targetUri;
    }

    /**
     * Create a hooks configuration file
     */
    async createHooksConfig(): Promise<vscode.Uri | undefined> {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            vscode.window.showErrorMessage('No workspace folder open');
            return undefined;
        }

        const vscodeFolderUri = vscode.Uri.joinPath(workspaceFolder.uri, '.vscode');
        const configUri = vscode.Uri.joinPath(vscodeFolderUri, 'copilot-hooks.json');

        // Check if file already exists
        try {
            await vscode.workspace.fs.stat(configUri);
            const doc = await vscode.workspace.openTextDocument(configUri);
            await vscode.window.showTextDocument(doc);
            return configUri;
        } catch {
            // File doesn't exist, create it
        }

        // Ensure .vscode folder exists
        try {
            await vscode.workspace.fs.createDirectory(vscodeFolderUri);
        } catch {
            // Folder might already exist
        }

        const defaultConfig = {
            "$schema": "./copilot-hooks.schema.json",
            "hooks": {
                "SessionStart": [
                    {
                        "hooks": [
                            {
                                "type": "prompt",
                                "promptFile": "startup.prompt.md",
                                "description": "Run startup prompt when workspace opens"
                            }
                        ]
                    }
                ]
            }
        };

        const content = new TextEncoder().encode(JSON.stringify(defaultConfig, null, 2));
        await vscode.workspace.fs.writeFile(configUri, content);

        const doc = await vscode.workspace.openTextDocument(configUri);
        await vscode.window.showTextDocument(doc);

        vscode.window.showInformationMessage('Created hooks configuration file');

        return configUri;
    }
}
