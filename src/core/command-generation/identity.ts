/**
 * Command Identity
 *
 * A generated command's family and action, kept separate so the command
 * family (`opsx`, `humanspec`, ...) never has to be folded into the command
 * ID. Every adapter projects the same identity to its own path and
 * invocation spelling; `opsx` remains the default so existing OpenSpec
 * output is unchanged when no namespace is declared.
 */

import type { CommandContent } from './types.js';

/**
 * The command-family identity of one generated command.
 */
export interface CommandIdentity {
  /** Command family, e.g. `opsx` or `humanspec`. */
  namespace: string;
  /** Command action, e.g. `explore` or `propose`. */
  id: string;
}

/**
 * The namespace a command resolves to when `CommandContent.namespace` is
 * omitted. Kept as the published default so every existing OpenSpec command
 * keeps its current path and invocation.
 */
export const DEFAULT_COMMAND_NAMESPACE = 'opsx';

/**
 * A namespace is one lowercase kebab-case path segment: lowercase letters,
 * digits, and hyphens, never starting or ending with a hyphen. Anything else
 * — empty values, `\` or `/` separators, `.`/`..` traversal tokens,
 * underscores, spaces, uppercase — is rejected before an adapter can turn it
 * into a filesystem path.
 */
const NAMESPACE_SEGMENT = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Validates a command namespace before it reaches any adapter path
 * construction.
 *
 * @param namespace - The namespace to validate
 * @returns An error message identifying the invalid namespace, or undefined
 *          when the namespace is valid
 */
export function validateCommandNamespace(namespace: string): string | undefined {
  if (namespace.length === 0) {
    return 'command namespace must not be empty';
  }
  if (namespace.includes('/') || namespace.includes('\\')) {
    return `invalid command namespace "${namespace}": must be a single path segment without separators`;
  }
  if (namespace === '.' || namespace === '..') {
    return `invalid command namespace "${namespace}": traversal segments are not allowed`;
  }
  if (!NAMESPACE_SEGMENT.test(namespace)) {
    return `invalid command namespace "${namespace}": must be a lowercase kebab-case segment`;
  }
  return undefined;
}

/**
 * Resolves the identity of a command: omitted namespaces default to
 * `DEFAULT_COMMAND_NAMESPACE`, and the resolved namespace is validated so
 * generation fails before a path is constructed or written.
 *
 * @param content - The command content
 * @returns The resolved command identity
 * @throws When the resolved namespace is invalid
 */
export function resolveCommandIdentity(content: CommandContent): CommandIdentity {
  const namespace = content.namespace ?? DEFAULT_COMMAND_NAMESPACE;
  const validationError = validateCommandNamespace(namespace);
  if (validationError !== undefined) {
    throw new Error(validationError);
  }
  return { namespace, id: content.id };
}
