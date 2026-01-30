<!-- Custom instructions for Copilot in this project -->

## Project Overview

This is a VS Code extension called "Copilot Prompt Hooks" that auto-runs Copilot prompt files (`.prompt.md`) when a workspace opens. It brings the "Hooks" concept from Claude Code to VS Code.

## Architecture

- `src/extension.ts` - Main extension entry point, registers commands and initializes managers
- `src/hooks/` - Hooks management and configuration types
  - `hooksManager.ts` - Orchestrates hook execution on lifecycle events
  - `types.ts` - TypeScript types for hooks configuration
- `src/prompts/` - Prompt file handling
  - `promptDiscovery.ts` - Finds prompt files in the workspace
  - `promptRunner.ts` - Executes prompt files via Copilot commands
  - `promptScaffolder.ts` - Creates new prompt files from templates
- `src/consent/` - User consent management
  - `consentManager.ts` - Handles first-run consent flow
- `schemas/` - JSON schemas for configuration files

## Key Design Decisions

1. **Command Fallback**: The `promptRunner` tries multiple Copilot command IDs since the exact command may vary by VS Code version
2. **Consent Flow**: Users must explicitly allow auto-running prompts per workspace (like VS Code's `folderOpen` tasks)
3. **Configuration Layers**: Settings via VS Code settings, plus optional `.vscode/copilot-hooks.json` for advanced control
4. **Session Tracking**: Uses `globalState` to track if startup hooks already ran this session

## Development

- Run `npm run compile` to build
- Press F5 to launch Extension Development Host
- Commands are prefixed with `copilot-prompt-hooks.`
