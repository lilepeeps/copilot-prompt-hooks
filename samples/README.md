# Sample Copilot Prompt Hooks Configuration

This folder contains example files demonstrating how to use the **Copilot Prompt Hooks** extension.

## Files

| File | Purpose |
|------|---------|
| `startup.prompt.md` | A prompt that runs automatically when the workspace opens |
| `.vscode/copilot-hooks.json` | Configuration file that defines which hooks run and when |
| `.github/prompts/folder-scan.prompt.md` | A prompt that runs when new folders are added |

## Quick Start

1. Copy `startup.prompt.md` to your project root
2. Copy `.vscode/copilot-hooks.json` to your project's `.vscode` folder
3. Open your project in VS Code - the startup prompt will run automatically!

## Hook Events

| Event | When It Fires |
|-------|---------------|
| `SessionStart` | VS Code opens or the workspace loads |
| `FolderOpen` | A new folder is added to the workspace |
| `PreChat` | Before a chat message is sent (future) |
| `PostChat` | After a chat response is received (future) |

## Prompt File Locations

The extension looks for startup prompts in this order:

1. `startup.prompt.md` (workspace root)
2. `.github/prompts/startup.prompt.md`
3. `.vscode/startup.prompt.md`
4. First `*.prompt.md` file found

## Configuration Options

Edit `.vscode/copilot-hooks.json` to customize:

```json
{
    "hooks": {
        "SessionStart": [
            {
                "hooks": [
                    {
                        "type": "prompt",
                        "promptFile": "path/to/your/prompt.md",
                        "timeout": 30000,
                        "description": "What this hook does"
                    }
                ]
            }
        ]
    }
}
```

## Tips

- Use `agent: agent` in the prompt frontmatter for autonomous tasks
- Keep startup prompts focused - they run every time you open VS Code
- Use descriptive filenames like `daily-standup.prompt.md` or `code-review.prompt.md`
