# Copilot Prompt Hooks

Auto-run Copilot prompt files when your workspace opens — bringing Claude Code's "Hooks" concept to VS Code and GitHub Copilot.

## Features

- **Auto-run prompts on workspace open**: Automatically execute a `.prompt.md` file when VS Code opens your workspace
- **User consent flow**: First-run notification asks permission before auto-running prompts (like VS Code's `folderOpen` tasks)
- **Command fallback**: Tries multiple Copilot command APIs to maximize compatibility
- **Prompt scaffolding**: Create starter prompt files from templates (Daily Standup, Project Context, Code Review Prep)
- **Hooks configuration**: Configure hooks via `.vscode/copilot-hooks.json` for more control

## Quick Start

1. Install the extension
2. Open a workspace
3. Run **"Copilot Hooks: Create Startup Prompt File"** from the Command Palette
4. Select a template and location
5. The prompt will auto-run next time you open this workspace

## Extension Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `copilotPromptHooks.enabled` | `true` | Enable auto-running prompt files on workspace open |
| `copilotPromptHooks.startupPromptPath` | `""` | Path to the prompt file (relative to workspace root). If empty, searches for `startup.prompt.md` |
| `copilotPromptHooks.autoRunDelay` | `2000` | Delay (ms) before auto-running prompt after workspace opens |
| `copilotPromptHooks.runOncePerSession` | `true` | Only run the startup prompt once per VS Code session |
| `copilotPromptHooks.requireConsent` | `true` | Require user consent before auto-running prompts in a new workspace |
| `copilotPromptHooks.promptFilePattern` | `**/*.prompt.md` | Glob pattern for discovering prompt files |

## Commands

| Command | Description |
|---------|-------------|
| **Copilot Hooks: Run Prompt File** | Run the configured startup prompt |
| **Copilot Hooks: Select and Run Prompt File** | Pick from all prompt files in workspace |
| **Copilot Hooks: Create Startup Prompt File** | Create a new prompt file from templates |
| **Copilot Hooks: Configure Hooks** | Open/create the hooks configuration file |
| **Copilot Hooks: Reset Workspace Consent** | Reset consent to be prompted again |

## Hooks Configuration

For advanced control, create `.vscode/copilot-hooks.json`:

```json
{
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
}
```

## Prompt File Discovery

The extension searches for startup prompts in this order:

1. `startup.prompt.md` in workspace root
2. `.github/prompts/startup.prompt.md`
3. `.vscode/startup.prompt.md`
4. First `*.prompt.md` found in workspace

## Inspiration

This extension brings the "Hooks" concept from [Claude Code](https://docs.anthropic.com/en/docs/claude-code/hooks) to VS Code and GitHub Copilot, enabling lifecycle-based automation for AI-assisted development.

## Requirements

- VS Code 1.108.1 or later
- GitHub Copilot extension (recommended)

## Known Limitations

- The exact Copilot command for running prompts may vary by VS Code version; the extension tries multiple fallbacks
- Currently only supports `SessionStart` hooks; `PreChat`/`PostChat` hooks are planned for future versions

## Release Notes

### 0.0.1

Initial release with:
- Auto-run prompts on workspace open
- User consent flow
- Prompt file scaffolding with templates
- Hooks configuration via JSON file



* Split the editor (`Cmd+\` on macOS or `Ctrl+\` on Windows and Linux).
* Toggle preview (`Shift+Cmd+V` on macOS or `Shift+Ctrl+V` on Windows and Linux).
* Press `Ctrl+Space` (Windows, Linux, macOS) to see a list of Markdown snippets.

## For more information

* [Visual Studio Code's Markdown Support](http://code.visualstudio.com/docs/languages/markdown)
* [Markdown Syntax Reference](https://help.github.com/articles/markdown-basics/)

**Enjoy!**
