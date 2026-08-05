/**
 * Command Reference Utilities
 *
 * Utilities for transforming command references to tool-specific formats.
 */

// Type-only imports: a value import would close a module cycle
// (command-generation imports this file). Callers resolve the concrete
// capability and invocation style and pass them in.
import type { CommandSurfaceCapability } from '../core/command-surface.js';
import type { CommandInvocation } from '../core/command-generation/invocation.js';
// Value import of a pure, dependency-free helper: invocation.ts imports only
// `path` and a type, so this does not close the cycle the note above guards.
import {
  formatCommandInvocation,
  needsInvocationRewrite,
} from '../core/command-generation/invocation.js';
import { DEFAULT_COMMAND_NAMESPACE } from '../core/command-generation/identity.js';

/**
 * Rewrites the canonical `/<namespace>:<command>` references that command
 * bodies and skill templates are authored with into the form one tool
 * actually registers — `/<namespace>-<command>` for tools that name the
 * command by filename, `@<namespace>-<command>` for Amazon Q's prompt
 * library. Only references belonging to the given namespace family are
 * rewritten; references to other namespaces are left unchanged unless the
 * caller supplies their own descriptor.
 *
 * Only known command ids are rewritten, matching how
 * `transformToSkillReferences` leaves unrecognized references alone, so a
 * mistyped or invented `/<namespace>:<something>` is left as written rather
 * than silently reshaped into a command that does not exist either.
 *
 * @param text - The text containing command references
 * @param invocation - The tool's invocation, from resolveCommandInvocation()
 * @param namespace - The command family whose references to rewrite,
 *        defaulting to the OpenSpec default
 * @returns Text with command references spelled the tool's way
 *
 * @example
 * transformCommandInvocations('/opsx:new', { style: 'flat', prefix: '/' }) // '/opsx-new'
 * transformCommandInvocations('/opsx:new', { style: 'flat', prefix: '@' }) // '@opsx-new'
 * transformCommandInvocations('/humanspec:propose', { style: 'flat', prefix: '/' }, 'humanspec') // '/humanspec-propose'
 */
export function transformCommandInvocations(
  text: string,
  invocation: CommandInvocation,
  namespace: string = DEFAULT_COMMAND_NAMESPACE
): string {
  const escapedNamespace = namespace.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return text.replace(
    new RegExp(`\\/${escapedNamespace}:([a-z-]+)`, 'g'),
    (match, commandId: string) =>
      skillNameForCommand(namespace, commandId) !== undefined
        ? formatCommandInvocation(invocation, commandId, namespace)
        : match
  );
}

/**
 * Maps OpenSpec command short names to their skill names.
 * Keep in sync with WORKFLOW_TO_SKILL_DIR, which exists in both
 * src/core/profile-sync-drift.ts (exported) and src/core/init.ts (local copy).
 */
const COMMAND_TO_SKILL_NAME: Record<string, string> = {
  'explore': 'openspec-explore',
  'new': 'openspec-new-change',
  'continue': 'openspec-continue-change',
  'apply': 'openspec-apply-change',
  'update': 'openspec-update-change',
  'ff': 'openspec-ff-change',
  'sync': 'openspec-sync-specs',
  'archive': 'openspec-archive-change',
  'bulk-archive': 'openspec-bulk-archive-change',
  'verify': 'openspec-verify-change',
  'onboard': 'openspec-onboard',
  'propose': 'openspec-propose',
};

/**
 * Maps HumanSpec command action names to their skill names. Keyed by the
 * action ID (`init`, `next`, ...) and used only when rewriting references
 * in the `humanspec` namespace, so the `propose` action maps to the
 * humanspec-propose skill rather than the OpenSpec one.
 */
const HUMANSPEC_COMMAND_TO_SKILL_NAME: Record<string, string> = {
  'init': 'humanspec-init',
  'next': 'humanspec-next',
  'propose': 'humanspec-propose',
  'coach': 'humanspec-coach',
  'verify': 'humanspec-verify',
  'archive': 'humanspec-archive',
  'explore': 'humanspec-explore',
};

function skillNameForCommand(namespace: string, commandId: string): string | undefined {
  return namespace === 'humanspec'
    ? HUMANSPEC_COMMAND_TO_SKILL_NAME[commandId]
    : COMMAND_TO_SKILL_NAME[commandId];
}

/**
 * Tools whose skill invocation uses a non-default prefix. The default is `/`
 * (e.g. `/openspec-propose`); Kimi Code invokes skills as `/skill:<name>` and
 * Codex CLI as `$<name>` — a `/<name>` form Codex does not recognize
 * (see docs/supported-tools.md).
 */
const SKILL_INVOCATION_PREFIX: Record<string, string> = {
  kimi: '/skill:',
  codex: '$',
};

function replaceCommandsWithSkillReferences(
  text: string,
  prefix: string,
  namespace: string = DEFAULT_COMMAND_NAMESPACE
): string {
  const escapedNamespace = namespace.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return text.replace(new RegExp(`\\/${escapedNamespace}:([a-z-]+)`, 'g'), (match, commandId: string) => {
    const skillName = skillNameForCommand(namespace, commandId);
    return skillName === undefined ? match : `${prefix}${skillName}`;
  });
}

/**
 * Transforms command references to skill references using the default `/`
 * invocation prefix. Converts `/<namespace>:<command>` patterns to
 * `/openspec-<skill>` (or `/humanspec-<skill>`) so that generated skills do
 * not reference commands that were never generated. Used for channels that
 * are not tied to one tool (e.g. the skills.sh distribution); tool-targeted
 * generation should go through getSkillReferenceTransformer instead.
 *
 * Unknown command references are left unchanged.
 *
 * @param text - The text containing command references
 * @param namespace - The command family whose references to transform,
 *        defaulting to the OpenSpec default
 * @returns Text with command references transformed to skill references
 *
 * @example
 * transformToSkillReferences('/opsx:apply') // returns '/openspec-apply-change'
 * transformToSkillReferences('/humanspec:propose', 'humanspec') // returns '/humanspec-propose'
 */
export function transformToSkillReferences(
  text: string,
  namespace: string = DEFAULT_COMMAND_NAMESPACE
): string {
  return replaceCommandsWithSkillReferences(text, '/', namespace);
}

/**
 * Returns the skill-reference transformer for a specific tool, honoring the
 * tool's documented skill invocation syntax (e.g. Kimi Code's
 * `/skill:openspec-propose`). Falls back to the default `/openspec-*` form.
 *
 * @param toolId - The AI tool identifier (e.g. 'kimi', 'vibe')
 * @param namespace - The command family whose references to transform,
 *        defaulting to the OpenSpec default
 * @returns A transformer converting `/<namespace>:*` references to skill invocations
 */
export function getSkillReferenceTransformer(
  toolId: string,
  namespace: string = DEFAULT_COMMAND_NAMESPACE
): (text: string) => string {
  const prefix = SKILL_INVOCATION_PREFIX[toolId];
  if (prefix === undefined) {
    if (namespace === DEFAULT_COMMAND_NAMESPACE) {
      // Keep the shared function identity so callers can compare transformers.
      return transformToSkillReferences;
    }
    return (text: string) => transformToSkillReferences(text, namespace);
  }
  return (text: string) => replaceCommandsWithSkillReferences(text, prefix, namespace);
}

/**
 * Selects the command-reference transformer for a skill generation target.
 *
 * Skill references are used whenever the tool ends up without `/opsx:*`
 * commands — because delivery is skills-only, because the tool has no command
 * surface at all (capability 'none', e.g. Kimi Code or Mistral Vibe), or
 * because the tool invokes skills directly and OpenSpec generates no command
 * files for it (capability 'skills-invocable', i.e. Codex) — so those skills
 * never point at commands that were not generated.
 *
 * When commands are generated, the spelling follows the tool's invocation: a
 * `flat` adapter names the command by filename (`.cursor/commands/opsx-apply.md`
 * → `/opsx-apply`), a `namespaced` adapter puts it in an `opsx/` directory
 * (`.claude/commands/opsx/apply.md` → `/opsx:apply`), and a non-slash prefix
 * wraps it further (`.amazonq/prompts/opsx-apply.md` → `@opsx-apply`). Passing
 * the invocation in keeps this module free of a hand-maintained tool list —
 * the list drifted and left 16 tools advertising commands their palettes never
 * registered (#727, #1307).
 *
 * Devin is the one tool that takes skill references even though its commands
 * are generated: only Devin Desktop reads `.devin/workflows/`, so a workflow
 * reference is dead text for anyone on Devin Local, while the `/openspec-*`
 * skills work on both agents. Under commands-only delivery there are no Devin
 * skills to point at, so it falls through to the invocation rewrite below and
 * gets the `/opsx-<id>` form its workflow filenames register.
 *
 * @param toolId - The AI tool identifier (e.g. 'claude', 'opencode', 'pi')
 * @param delivery - The configured delivery mode
 * @param capability - The tool's command surface capability
 * @param invocation - How the tool's generated commands are invoked, from
 *        resolveCommandInvocation(); undefined for tools with no command
 *        adapter. Required rather than optional so a caller that forgets it
 *        fails to compile instead of silently getting the canonical form.
 * @param namespace - The command family whose references the transformer
 *        rewrites, defaulting to the OpenSpec default; generated skills and
 *        onboarding hints reuse the same namespace-aware invocation
 *        formatter as generateCommand so a tool never advertises a spelling
 *        different from the file it registers.
 * @returns The transformer to pass to generateSkillContent, or undefined when
 *          the tool already answers to the canonical `/opsx:<id>`
 */
export function getTransformerForTool(
  toolId: string,
  delivery: 'both' | 'skills' | 'commands',
  capability: CommandSurfaceCapability,
  invocation: CommandInvocation | undefined,
  namespace: string = DEFAULT_COMMAND_NAMESPACE
): ((text: string) => string) | undefined {
  if (delivery === 'skills' || capability !== 'adapter-backed') {
    return getSkillReferenceTransformer(toolId, namespace);
  }
  if (toolId === 'devin' && delivery === 'both') {
    return getSkillReferenceTransformer(toolId, namespace);
  }
  if (invocation !== undefined && needsInvocationRewrite(invocation)) {
    return (text: string) => transformCommandInvocations(text, invocation, namespace);
  }
  return undefined;
}
