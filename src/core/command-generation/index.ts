/**
 * Command Generation Module
 *
 * Generic command generation system with tool-specific adapters.
 *
 * Usage:
 * ```typescript
 * import { generateCommands, CommandAdapterRegistry, type CommandContent } from './command-generation/index.js';
 *
 * const contents: CommandContent[] = [...];
 * const adapter = CommandAdapterRegistry.get('cursor');
 * if (adapter) {
 *   const commands = generateCommands(contents, adapter);
 *   // Write commands to disk
 * }
 * ```
 */

// Types
export type {
  CommandContent,
  ToolCommandAdapter,
  GeneratedCommand,
} from './types.js';

// Identity
export type { CommandIdentity } from './identity.js';
export {
  DEFAULT_COMMAND_NAMESPACE,
  validateCommandNamespace,
  resolveCommandIdentity,
} from './identity.js';

// Invocation
export {
  getInvocationForAdapter,
  getInvocationStyleForPath,
  formatCommandInvocation,
  needsInvocationRewrite,
  CANONICAL_INVOCATION,
} from './invocation.js';
export type { CommandInvocation, CommandInvocationStyle } from './invocation.js';

// Registry
export { CommandAdapterRegistry } from './registry.js';

// Generator functions
export { generateCommand, generateCommands } from './generator.js';

// Adapters (for direct access if needed)
export { claudeAdapter, cursorAdapter, devinAdapter } from './adapters/index.js';
