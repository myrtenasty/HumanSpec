/**
 * Effective Profile Resolution
 *
 * One precedence rule for the workflow profile a project actually uses:
 *
 *   explicit CLI override > project config profile/workflows
 *       > global config profile/workflows > core fallback
 *
 * Init, update, profile drift, detection, and result summaries all consume
 * this resolver so a project that declares its own profile (e.g. `humanspec`)
 * keeps that choice even when the machine-level global config says something
 * else. The resolver reports the source of the effective profile so UIs can
 * explain why a project override wins over the global preset.
 */

import type { GlobalConfig, Profile } from './global-config.js';
import type { ProjectConfig } from './project-config.js';
import { isValidProfileName, getProfileWorkflows } from './profiles.js';

/**
 * Where the effective profile came from, in precedence order.
 */
export type EffectiveProfileSource = 'cli' | 'project' | 'global' | 'default';

export interface EffectiveProfile {
  profile: Profile;
  workflows: readonly string[];
  source: EffectiveProfileSource;
}

export interface ResolveEffectiveProfileInput {
  /** Explicit CLI override (`--profile`), already validated by the caller. */
  cliProfile?: Profile;
  /** Project config, as read by readProjectConfig; null when absent. */
  projectConfig?: ProjectConfig | null;
  /** Global config, as read by getGlobalConfig. */
  globalConfig?: GlobalConfig;
}

/**
 * Validates a raw `--profile` value before it reaches the resolver, so an
 * invalid CLI override fails before any artifact is written or deleted.
 *
 * @returns The validated profile, or an error message identifying the invalid value
 */
export function validateCliProfileOverride(value: string | undefined): Profile | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (isValidProfileName(value)) {
    return value;
  }
  throw new Error(
    `Invalid profile "${value}". Available profiles: core, humanspec, custom`
  );
}

/**
 * Resolves the effective workflow profile with one precedence rule.
 *
 * - CLI override wins over everything; a `custom` CLI override consults the
 *   project workflows first, then the global workflows, for its selection.
 * - A valid project config profile wins over the global config.
 * - A valid global profile is used next.
 * - Otherwise the `core` fallback applies.
 */
export function resolveEffectiveProfile(
  options: ResolveEffectiveProfileInput
): EffectiveProfile {
  const { cliProfile, projectConfig, globalConfig } = options;

  if (cliProfile !== undefined) {
    return {
      profile: cliProfile,
      workflows: getProfileWorkflows(
        cliProfile,
        projectConfig?.workflows ?? globalConfig?.workflows
      ),
      source: 'cli',
    };
  }

  if (projectConfig?.profile !== undefined) {
    return {
      profile: projectConfig.profile,
      workflows: getProfileWorkflows(projectConfig.profile, projectConfig.workflows),
      source: 'project',
    };
  }

  if (globalConfig?.profile !== undefined) {
    return {
      profile: globalConfig.profile,
      workflows: getProfileWorkflows(globalConfig.profile, globalConfig.workflows),
      source: 'global',
    };
  }

  return {
    profile: 'core',
    workflows: getProfileWorkflows('core'),
    source: 'default',
  };
}
