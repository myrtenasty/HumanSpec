/**
 * Profile System
 *
 * Defines workflow profiles that control which workflows are installed.
 * Profiles determine WHICH workflows; delivery (in global config) determines HOW.
 */

import type { Profile } from './global-config.js';

/**
 * Core workflows included in the 'core' profile.
 * These provide the streamlined experience for new users.
 */
export const CORE_WORKFLOWS = ['propose', 'explore', 'apply', 'update', 'sync', 'archive'] as const;

/**
 * All available workflows in the system.
 */
export const ALL_WORKFLOWS = [
  'propose',
  'explore',
  'new',
  'continue',
  'apply',
  'update',
  'ff',
  'sync',
  'archive',
  'bulk-archive',
  'verify',
  'onboard',
] as const;

/**
 * Workflows in the named `humanspec` profile, in lifecycle order:
 * initialize the project practice, route the next change, propose a change,
 * coach the learner, verify the outcome, archive the change, and explore.
 *
 * The `humanspec` profile deliberately contains neither `apply` nor a
 * `humanspec-apply` workflow: HumanSpec projects are human-implemented, so
 * the user-invocable implementation workflow is not installed while the
 * internal `openspec instructions apply` protocol stays available.
 */
export const HUMANSPEC_WORKFLOWS = [
  'humanspec-init',
  'humanspec-next',
  'humanspec-propose',
  'humanspec-coach',
  'humanspec-verify',
  'humanspec-archive',
  'humanspec-explore',
] as const;

export type HumanSpecWorkflowId = (typeof HUMANSPEC_WORKFLOWS)[number];

/**
 * Every workflow the system can register, OpenSpec and HumanSpec alike.
 * This is the explicit validation list shared by profile resolution, project
 * config parsing, custom workflow selection, cleanup, and detection: a value
 * that is not in this list is not a registered workflow. It stays in sync
 * with the generated projections through the HumanSpec parity tests and can
 * later be replaced by a single workflow manifest
 * (`unify-template-generation-pipeline`) without changing the entries.
 */
export const REGISTERED_WORKFLOWS = [...ALL_WORKFLOWS, ...HUMANSPEC_WORKFLOWS] as const;

export type RegisteredWorkflowId = (typeof REGISTERED_WORKFLOWS)[number];

export type WorkflowId = RegisteredWorkflowId;
export type CoreWorkflowId = (typeof CORE_WORKFLOWS)[number];

/**
 * The three named workflow profiles. `custom` uses an explicit workflow
 * selection; `core` and `humanspec` are fixed presets.
 */
export const PROFILE_NAMES: readonly Profile[] = ['core', 'humanspec', 'custom'];

/**
 * True when the value is one of the named workflow profiles.
 */
export function isValidProfileName(value: string): value is Profile {
  return (PROFILE_NAMES as readonly string[]).includes(value);
}

/**
 * True when the value is an explicitly registered workflow ID, OpenSpec or
 * HumanSpec. Used instead of filename patterns wherever a selection must be
 * validated (project config `workflows`, generation filters, cleanup).
 */
export function isRegisteredWorkflow(value: string): value is RegisteredWorkflowId {
  return (REGISTERED_WORKFLOWS as readonly string[]).includes(value);
}

/**
 * Filters a workflow selection down to explicitly registered workflow IDs,
 * preserving order.
 */
export function toRegisteredWorkflows(workflows: readonly string[]): RegisteredWorkflowId[] {
  return workflows.filter(isRegisteredWorkflow);
}

/**
 * Resolves which workflows should be active for a given profile configuration.
 *
 * - 'core' profile always returns CORE_WORKFLOWS
 * - 'humanspec' profile always returns HUMANSPEC_WORKFLOWS
 * - 'custom' profile returns the provided customWorkflows, or empty array if not provided
 */
export function getProfileWorkflows(
  profile: Profile,
  customWorkflows?: string[]
): readonly string[] {
  if (profile === 'humanspec') {
    return HUMANSPEC_WORKFLOWS;
  }
  if (profile === 'custom') {
    return customWorkflows ?? [];
  }
  return CORE_WORKFLOWS;
}
