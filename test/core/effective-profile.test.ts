import { describe, it, expect } from 'vitest';

import {
  resolveEffectiveProfile,
  validateCliProfileOverride,
} from '../../src/core/effective-profile.js';
import { CORE_WORKFLOWS, HUMANSPEC_WORKFLOWS } from '../../src/core/profiles.js';
import type { GlobalConfig } from '../../src/core/global-config.js';
import type { ProjectConfig } from '../../src/core/project-config.js';

const globalCore: GlobalConfig = { featureFlags: {}, profile: 'core', delivery: 'both' };
const globalHumanSpec: GlobalConfig = { featureFlags: {}, profile: 'humanspec', delivery: 'both' };
const globalCustom: GlobalConfig = {
  featureFlags: {},
  profile: 'custom',
  delivery: 'both',
  workflows: ['propose', 'verify'],
};
const projectHumanSpec: ProjectConfig = { schema: 'human-learning', profile: 'humanspec' };
const projectCustom: ProjectConfig = {
  schema: 'human-learning',
  profile: 'custom',
  workflows: ['humanspec-init', 'humanspec-next'],
};

describe('resolveEffectiveProfile', () => {
  it('falls back to core when nothing supplies a profile', () => {
    const effective = resolveEffectiveProfile({ globalConfig: undefined });
    expect(effective.profile).toBe('core');
    expect(effective.workflows).toEqual(CORE_WORKFLOWS);
    expect(effective.source).toBe('default');
  });

  it('uses the global profile and reports its source', () => {
    const effective = resolveEffectiveProfile({ globalConfig: globalHumanSpec });
    expect(effective.profile).toBe('humanspec');
    expect(effective.workflows).toEqual(HUMANSPEC_WORKFLOWS);
    expect(effective.source).toBe('global');
  });

  it('lets the project profile override the global profile', () => {
    const effective = resolveEffectiveProfile({
      projectConfig: projectHumanSpec,
      globalConfig: globalCore,
    });
    expect(effective.profile).toBe('humanspec');
    expect(effective.workflows).toEqual(HUMANSPEC_WORKFLOWS);
    expect(effective.source).toBe('project');
  });

  it('uses project custom workflows for a project custom profile', () => {
    const effective = resolveEffectiveProfile({
      projectConfig: projectCustom,
      globalConfig: globalCore,
    });
    expect(effective.profile).toBe('custom');
    expect(effective.workflows).toEqual(['humanspec-init', 'humanspec-next']);
    expect(effective.source).toBe('project');
  });

  it('lets the CLI override win over project and global config', () => {
    const effective = resolveEffectiveProfile({
      cliProfile: 'humanspec',
      projectConfig: projectHumanSpec,
      globalConfig: globalCore,
    });
    expect(effective.profile).toBe('humanspec');
    expect(effective.workflows).toEqual(HUMANSPEC_WORKFLOWS);
    expect(effective.source).toBe('cli');
  });

  it('consults project workflows for a custom CLI override before global workflows', () => {
    const effective = resolveEffectiveProfile({
      cliProfile: 'custom',
      projectConfig: projectCustom,
      globalConfig: globalCustom,
    });
    expect(effective.profile).toBe('custom');
    expect(effective.workflows).toEqual(['humanspec-init', 'humanspec-next']);
    expect(effective.source).toBe('cli');
  });

  it('falls back to global workflows for a custom CLI override without project workflows', () => {
    const effective = resolveEffectiveProfile({
      cliProfile: 'custom',
      globalConfig: globalCustom,
    });
    expect(effective.workflows).toEqual(['propose', 'verify']);
  });

  it('keeps the global custom selection when the project declares no profile', () => {
    const effective = resolveEffectiveProfile({ globalConfig: globalCustom });
    expect(effective.profile).toBe('custom');
    expect(effective.workflows).toEqual(['propose', 'verify']);
    expect(effective.source).toBe('global');
  });

  it('ignores a project config without a profile field', () => {
    const effective = resolveEffectiveProfile({
      projectConfig: { schema: 'spec-driven' },
      globalConfig: globalHumanSpec,
    });
    expect(effective.profile).toBe('humanspec');
    expect(effective.source).toBe('global');
  });
});

describe('validateCliProfileOverride', () => {
  it('accepts core, humanspec, and custom', () => {
    expect(validateCliProfileOverride('core')).toBe('core');
    expect(validateCliProfileOverride('humanspec')).toBe('humanspec');
    expect(validateCliProfileOverride('custom')).toBe('custom');
  });

  it('returns undefined when no override is supplied', () => {
    expect(validateCliProfileOverride(undefined)).toBeUndefined();
  });

  it('throws on unknown profile names', () => {
    expect(() => validateCliProfileOverride('apply')).toThrow(/Available profiles: core, humanspec, custom/);
  });
});
