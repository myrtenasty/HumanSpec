/**
 * Command Generator
 *
 * Functions for generating command files using tool adapters.
 */

import type { CommandContent, ToolCommandAdapter, GeneratedCommand } from './types.js';
import { getInvocationForAdapter, needsInvocationRewrite } from './invocation.js';
import { resolveCommandIdentity } from './identity.js';
import { transformCommandInvocations } from '../../utils/command-references.js';

/**
 * Generate a single command file using the provided adapter.
 *
 * Command bodies are authored with `/<namespace>:<id>` references for the
 * command's own family (default `opsx`). Tools whose command files are
 * invoked by filename register `/<namespace>-<id>` instead, and Amazon Q
 * surfaces them in its prompt library as `@<namespace>-<id>`, so the body is
 * rewritten to the form that tool answers to before the adapter formats it.
 * References to a different namespace are left unchanged. Doing the rewrite
 * here rather than per adapter keeps every tool in step (#727, #1307);
 * adapters stay pure formatters.
 *
 * The identity is resolved (namespace defaults to `opsx`) and validated
 * before any adapter path is constructed, so an invalid namespace fails
 * generation before a path is resolved or written.
 *
 * @param content - The tool-agnostic command content
 * @param adapter - The tool-specific adapter
 * @returns Generated command with path and file content
 */
export function generateCommand(
  content: CommandContent,
  adapter: ToolCommandAdapter
): GeneratedCommand {
  const identity = resolveCommandIdentity(content);
  const invocation = getInvocationForAdapter(adapter, identity.namespace);
  const resolvedContent = {
    ...content,
    namespace: identity.namespace,
    body: needsInvocationRewrite(invocation)
      ? transformCommandInvocations(content.body, invocation, identity.namespace)
      : content.body,
  };

  return {
    path: adapter.getFilePath(identity),
    fileContent: adapter.formatFile(resolvedContent),
  };
}

/**
 * Generate multiple command files using the provided adapter.
 * @param contents - Array of tool-agnostic command contents
 * @param adapter - The tool-specific adapter
 * @returns Array of generated commands with paths and file contents
 */
export function generateCommands(
  contents: CommandContent[],
  adapter: ToolCommandAdapter
): GeneratedCommand[] {
  return contents.map((content) => generateCommand(content, adapter));
}
