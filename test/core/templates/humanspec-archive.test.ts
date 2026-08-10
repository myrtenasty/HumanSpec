import { describe, expect, it } from 'vitest';

import {
  getHumanspecArchiveCommandTemplate,
  getHumanspecArchiveSkillTemplate,
} from '../../../src/core/templates/skill-templates.js';
import {
  HUMANSPEC_IMPLEMENTATION_BOUNDARY,
  HUMANSPEC_PROJECT_DOCS,
  HUMANSPEC_WRITE_BOUNDARIES,
} from '../../../src/core/templates/workflows/humanspec-shared.js';
import { getCommandContents, getSkillTemplates, generateSkillContent } from '../../../src/core/shared/skill-generation.js';

const skill = getHumanspecArchiveSkillTemplate();
const command = getHumanspecArchiveCommandTemplate();
const bodies: Array<[string, string]> = [
  ['skill', skill.instructions],
  ['command', command.content],
];

function normalized(value: string): string {
  return value.replace(/\s+/gu, ' ');
}

describe('HumanSpec archive workflow templates', () => {
  it('projects one identical skill and command contract', () => {
    expect(skill.instructions).toBe(command.content);
    expect(skill.name).toBe('humanspec-archive');
    expect(command.name).toBe('HUMANSPEC: Archive');
    expect(command.tags).toEqual(['workflow', 'humanspec', 'archive']);
    for (const [label, body] of bodies) {
      expect(body, label).toContain(HUMANSPEC_IMPLEMENTATION_BOUNDARY);
      expect(body, label).toContain(HUMANSPEC_PROJECT_DOCS);
      expect(body, label).toContain(HUMANSPEC_WRITE_BOUNDARIES['humanspec-archive']);
    }
  });

  it('contains context, verification, forced-archive, and canonical-operation gates', () => {
    for (const [label, body] of bodies) {
      const text = normalized(body);
      for (const marker of [
        'openspec list --json',
        'openspec status --change "<name>" --json',
        'openspec instructions apply --change "<name>" --json',
        'openspec humanspec context inspect --json',
        'versioned envelope',
        'public source of truth',
        'template versions',
        'parse issues',
        'latest single verification result',
        'learning complete',
        'substantive learner-authored evidence',
        'forced archive',
        'separate, explicit confirmation',
        'does not invent a reflection',
        'openspec archive "<name>" --json --yes',
        'canonical OpenSpec operation',
      ]) {
        expect(text, `${label}: ${marker}`).toContain(marker);
      }
    }
  });

  it('contains preview confirmation, pending reconciliation, and ownership boundaries', () => {
    for (const [label, body] of bodies) {
      const text = normalized(body);
      for (const marker of [
        '# 已归档切片',
        'feedback: pending|complete',
        'gap:',
        'mastered:',
        'review:',
        'byte preconditions',
        'exact bound document paths',
        'Ask for a separate explicit learner confirmation',
        'feedback-apply --plan <path|-> --yes --json',
        'pending state',
        'Retry reconciliation',
        'never rerun specification synchronization',
        'never writes application or test implementation',
        'never run `openspec new change`',
        'exactly one next action',
      ]) {
        expect(text, `${label}: ${marker}`).toContain(marker);
      }
      expect(text, label).toContain('application code, test implementation, task checkboxes, and reflection text');
      expect(text, label).toContain('/humanspec:next');
      expect(text, label).toContain('/humanspec:propose');
    }
  });

  it('covers blocking and forced journeys without unauthorized writes', () => {
    for (const [label, body] of bodies) {
      const text = normalized(body);
      for (const marker of [
        'missing, unreadable, malformed, unmarked, duplicated, or ambiguous document',
        'incomplete',
        'failed, or inconclusive',
        'do not write positive mastery',
        'If it is declined or omitted, do not apply the plan',
        'do not touch roadmap or learner documents',
        'does not invent a reflection',
        'never writes application or test implementation',
      ]) {
        expect(text, `${label}: ${marker}`).toContain(marker);
      }
    }
  });

  it('keeps generated projections and store/path guidance aligned', () => {
    const skillEntries = getSkillTemplates(['humanspec-archive']);
    const commandEntries = getCommandContents(['humanspec-archive']);
    expect(skillEntries).toHaveLength(1);
    expect(commandEntries).toHaveLength(1);
    expect(commandEntries[0].body).toBe(skillEntries[0].template.instructions);
    const generated = generateSkillContent(skillEntries[0].template, 'TEST');
    expect(generated).toContain('allowed-tools: Bash(openspec:*)');
    expect(generated).toContain('feedback: pending');
  });
});
