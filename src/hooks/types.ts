/**
 * Types for the Copilot Prompt Hooks configuration
 * Inspired by Claude Code's Hooks feature
 */

/**
 * Hook event types supported by the extension
 */
export type HookEventName = 
    | 'SessionStart'      // When VS Code opens/loads the workspace
    | 'PreChat'           // Before a chat message is sent (future)
    | 'PostChat'          // After a chat response is received (future)
    | 'FolderOpen';       // When a new folder is added to workspace

/**
 * Types of hooks that can be executed
 */
export type HookType = 'prompt' | 'command';

/**
 * A single hook definition
 */
export interface Hook {
    /** Type of hook - 'prompt' runs a prompt file, 'command' runs a shell command */
    type: HookType;
    /** Path to the prompt file (relative to workspace root) - for type: 'prompt' */
    promptFile?: string;
    /** Shell command to execute - for type: 'command' */
    command?: string;
    /** Optional timeout in milliseconds (default: 30000) */
    timeout?: number;
    /** Optional description of what this hook does */
    description?: string;
}

/**
 * A hook matcher that can contain multiple hooks
 */
export interface HookMatcher {
    /** Optional matcher pattern (for future use with tool-specific hooks) */
    matcher?: string;
    /** Array of hooks to execute when this matcher is triggered */
    hooks: Hook[];
}

/**
 * The hooks configuration structure
 */
export interface HooksConfig {
    /** JSON schema reference */
    $schema?: string;
    /** Hooks organized by event name */
    hooks: {
        [K in HookEventName]?: HookMatcher[];
    };
}

/**
 * Result of executing a hook
 */
export interface HookExecutionResult {
    /** Whether the hook executed successfully */
    success: boolean;
    /** Error message if the hook failed */
    error?: string;
    /** Output from the hook (if any) */
    output?: string;
    /** Time taken to execute in milliseconds */
    duration: number;
}

/**
 * Workspace consent status
 */
export type ConsentStatus = 'granted' | 'denied' | 'pending';

/**
 * Stored consent data for a workspace
 */
export interface WorkspaceConsent {
    /** The consent status */
    status: ConsentStatus;
    /** When the consent was last updated */
    timestamp: number;
    /** Hash of the hooks config when consent was given (to detect changes) */
    configHash?: string;
}
