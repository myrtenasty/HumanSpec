/**
 * Command Invocation
 *
 * How a tool spells a command has two parts, and only one of them
 * can be read off the file the adapter writes:
 *
 * - The *name* comes from the file. `.../commands/opsx/<id>.md` is namespaced
 *   by its directory, so the tool registers `opsx:<id>` (Claude Code, Gemini,
 *   Crush, ...). `.../commands/opsx-<id>.md` names the command with the
 *   filename, so the tool registers `opsx-<id>` (Cursor, GitHub Copilot,
 *   OpenCode, ...).
 * - The *prefix* is the tool's own and cannot be derived. Almost every tool
 *   uses `/`; Amazon Q loads these files into its prompt library, which is
 *   invoked with `@` (`@opsx-propose`), so its adapter declares that prefix.
 *
 * Deriving the name from `getFilePath` keeps generated cross-references and
 * onboarding hints in step with the files OpenSpec actually writes. A
 * hand-maintained list drifted before: only OpenCode was rewritten when the
 * hyphen form was introduced (#727), and Cursor still advertised `/opsx:`
 * commands its palette never registered (#1307). Carrying the prefix as
 * adapter metadata rather than inferring it keeps the one tool that does not
 * use a slash from being advertised as if it did.
 */

import path from 'path';
import type { ToolCommandAdapter } from './types.js';
import { DEFAULT_COMMAND_NAMESPACE, type CommandIdentity } from './identity.js';

export type CommandInvocationStyle = 'namespaced' | 'flat';

/**
 * Everything needed to spell one of a tool's commands.
 */
export interface CommandInvocation {
  /** How the command file names the command. */
  style: CommandInvocationStyle;
  /** What the user types before the name, e.g. `/` or Amazon Q's `@`. */
  prefix: string;
}

/** The form these docs, command bodies, and skill templates are authored in. */
export const CANONICAL_INVOCATION: CommandInvocation = { style: 'namespaced', prefix: '/' };

/**
 * Classifies a generated command file by the name the tool will answer to.
 *
 * The test is the filename, not the directory: a `<namespace>-` prefix means
 * the filename is the command, so the tool registers `<namespace>-<id>`.
 * Every other shape is treated as namespaced, which is what the
 * `<namespace>/<id>.*` adapters need. An adapter that neither prefixes the
 * filename nor nests under the namespace directory would land here too —
 * none does, and the registry-wide test in invocation.test.ts fails if one
 * appears.
 *
 * @param commandFilePath - Path returned by an adapter's `getFilePath`
 * @param namespace - The resolved namespace of the command the path names
 * @param commandId - When supplied, the resolved action ID used to distinguish
 *        an exact flat filename from a similarly prefixed namespaced filename
 * @returns 'flat' when the filename carries the exact `<namespace>-<id>` name,
 *          otherwise 'namespaced'
 */
export function getInvocationStyleForPath(
  commandFilePath: string,
  namespace: string = DEFAULT_COMMAND_NAMESPACE,
  commandId?: string
): CommandInvocationStyle {
  const basename = path.basename(commandFilePath);
  const flatName = commandId === undefined ? `${namespace}-` : `${namespace}-${commandId}`;
  const isFlat = commandId === undefined
    ? basename.startsWith(flatName)
    : basename === flatName || basename.startsWith(`${flatName}.`);
  return isFlat ? 'flat' : 'namespaced';
}

/**
 * Resolves how a tool's generated commands are invoked: the name from the
 * files its adapter writes, the prefix from the adapter's own declaration.
 *
 * @param adapter - The tool-specific command adapter
 * @param identity - The resolved identity whose actual path determines style
 * @returns The invocation for that generated command identity
 */
export function getInvocationForAdapter(
  adapter: ToolCommandAdapter,
  identity: CommandIdentity = { namespace: DEFAULT_COMMAND_NAMESPACE, id: 'explore' }
): CommandInvocation {
  return {
    style: getInvocationStyleForPath(
      adapter.getFilePath(identity),
      identity.namespace,
      identity.id
    ),
    prefix: adapter.invocationPrefix ?? CANONICAL_INVOCATION.prefix,
  };
}

/**
 * Spells one command the way the tool registers it.
 *
 * @param invocation - The tool's invocation, from getInvocationForAdapter()
 * @param commandId - The command identifier (e.g. 'apply')
 * @param namespace - The command's namespace, defaulting to the OpenSpec
 *        default so existing spellings stay `/opsx:*`
 * @returns What the user types, e.g. `/opsx:apply`, `/opsx-apply`,
 *          `@opsx-apply`, `/humanspec:propose`, `@humanspec-propose`
 */
export function formatCommandInvocation(
  invocation: CommandInvocation,
  commandId: string,
  namespace: string = DEFAULT_COMMAND_NAMESPACE
): string {
  const separator = invocation.style === 'namespaced' ? ':' : '-';
  return `${invocation.prefix}${namespace}${separator}${commandId}`;
}

/**
 * Whether a tool's invocation differs from the canonical `/opsx:<id>` that
 * command bodies and skill templates are authored in — that is, whether
 * generated text has to be rewritten for that tool at all.
 */
export function needsInvocationRewrite(invocation: CommandInvocation): boolean {
  return (
    invocation.style !== CANONICAL_INVOCATION.style ||
    invocation.prefix !== CANONICAL_INVOCATION.prefix
  );
}
