import { describe, it, expect } from 'vitest';

import {
  HUMANSPEC_WORKFLOWS,
  getProfileWorkflows,
  REGISTERED_WORKFLOWS,
} from '../../src/core/profiles.js';
import { getSkillTemplates, getCommandTemplates } from '../../src/core/shared/skill-generation.js';
import { SKILL_NAMES, MANAGED_COMMANDS } from '../../src/core/shared/tool-detection.js';
import { WORKFLOW_TO_SKILL_DIR } from '../../src/core/profile-sync-drift.js';
import { getOnboardingCommands } from '../../src/core/onboarding-commands.js';
import { transformToSkillReferences, transformCommandInvocations } from '../../src/utils/command-references.js';
import { getInvocationForAdapter, CommandAdapterRegistry } from '../../src/core/command-generation/index.js';

const HUMANSPEC_SET = new Set<string>(HUMANSPEC_WORKFLOWS);
const EXPECTED_SEVEN = [...HUMANSPEC_WORKFLOWS].sort();

function expectSameSeven(actual: Iterable<string>, label: string): void {
  expect([...new Set(actual)].sort(), label).toEqual(EXPECTED_SEVEN);
}

describe('HumanSpec registration parity', () => {
  it('profile membership enumerates exactly the seven HumanSpec workflows', () => {
    expect([...getProfileWorkflows('humanspec')].sort()).toEqual(EXPECTED_SEVEN);
    expect(HUMANSPEC_WORKFLOWS).toHaveLength(7);
  });

  it('the humanspec profile contains no apply workflow', () => {
    const workflows = getProfileWorkflows('humanspec');
    expect(workflows).not.toContain('apply');
    expect(workflows).not.toContain('humanspec-apply');
    expect(REGISTERED_WORKFLOWS).not.toContain('humanspec-apply');
  });

  it('skill template projections enumerate exactly the seven HumanSpec workflows', () => {
    const projected = getSkillTemplates()
      .filter((entry) => HUMANSPEC_SET.has(entry.workflowId))
      .map((entry) => entry.workflowId);
    expectSameSeven(projected, 'getSkillTemplates');

    const dirNames = getSkillTemplates()
      .filter((entry) => HUMANSPEC_SET.has(entry.workflowId))
      .map((entry) => entry.dirName);
    expect(dirNames.sort()).toEqual(
      HUMANSPEC_WORKFLOWS.map((workflow) => `humanspec-${workflow.replace('humanspec-', '')}`).sort()
    );
  });

  it('SKILL_NAMES enumerates exactly the seven HumanSpec skill directories', () => {
    const projected = SKILL_NAMES.filter((name) => name.startsWith('humanspec-'));
    expect(projected.sort()).toEqual(
      HUMANSPEC_WORKFLOWS.map((workflow) => workflow).sort()
    );
  });

  it('WORKFLOW_TO_SKILL_DIR maps exactly the seven HumanSpec workflows', () => {
    expectSameSeven(
      Object.keys(WORKFLOW_TO_SKILL_DIR).filter((key) => HUMANSPEC_SET.has(key)),
      'WORKFLOW_TO_SKILL_DIR'
    );
    for (const workflow of HUMANSPEC_WORKFLOWS) {
      expect(WORKFLOW_TO_SKILL_DIR[workflow]).toBe(workflow);
    }
  });

  it('command descriptors enumerate exactly the seven HumanSpec commands in the humanspec namespace', () => {
    const humanSpecDescriptors = MANAGED_COMMANDS.filter((d) => d.namespace === 'humanspec');
    expect(humanSpecDescriptors).toHaveLength(7);
    expectSameSeven(
      humanSpecDescriptors.map((d) => d.workflowId),
      'MANAGED_COMMANDS'
    );
    const actions = humanSpecDescriptors.map((d) => d.id).sort();
    expect(actions).toEqual(
      HUMANSPEC_WORKFLOWS.map((w) => w.replace('humanspec-', '')).sort()
    );
    // No apply command is registered in the humanspec family.
    expect(humanSpecDescriptors.some((d) => d.id === 'apply')).toBe(false);
  });

  it('command template projections enumerate exactly the seven HumanSpec workflows', () => {
    const entries = getCommandTemplates().filter((entry) => entry.namespace === 'humanspec');
    expectSameSeven(entries.map((entry) => entry.workflowId), 'getCommandTemplates');
    for (const entry of entries) {
      expect(entry.id).toBe(entry.workflowId.replace('humanspec-', ''));
    }
  });

  it('onboarding enumerates exactly the seven HumanSpec workflows', () => {
    const projected = getOnboardingCommands([...HUMANSPEC_WORKFLOWS]);
    expectSameSeven(projected.map((entry) => entry.workflow), 'onboarding');
    // Onboarding hints spell the canonical humanspec command form.
    for (const entry of projected) {
      expect(entry.command).toMatch(/^\/humanspec:[a-z-]+$/);
    }
  });

  it('the reference rewriter projects commands generically and skills from descriptors', () => {
    // Command surfaces can project any valid action in the declared family;
    // skill references remain limited to explicitly registered descriptors.
    const flat = getInvocationForAdapter(CommandAdapterRegistry.get('cursor')!);
    for (const workflow of HUMANSPEC_WORKFLOWS) {
      const action = workflow.replace('humanspec-', '');
      expect(transformCommandInvocations(`/humanspec:${action}`, flat, 'humanspec'), action).toBe(
        `/humanspec-${action}`
      );
      expect(transformToSkillReferences(`/humanspec:${action}`, 'humanspec'), action).toBe(
        `/humanspec-${action}`
      );
    }
    expect(transformCommandInvocations('/humanspec:apply', flat, 'humanspec')).toBe(
      '/humanspec-apply'
    );
    expect(transformToSkillReferences('/humanspec:apply', 'humanspec')).toBe(
      '/humanspec:apply'
    );
  });

  it('registers every HumanSpec workflow in the explicit registered list', () => {
    for (const workflow of HUMANSPEC_WORKFLOWS) {
      expect(REGISTERED_WORKFLOWS).toContain(workflow);
    }
  });
});
