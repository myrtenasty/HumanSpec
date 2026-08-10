import { describe, expect, it } from 'vitest';

import {
  getHumanspecInitCommandTemplate,
  getHumanspecInitSkillTemplate,
} from '../../../src/core/templates/skill-templates.js';
import {
  HUMANSPEC_INITIALIZATION_GUIDANCE,
  HUMANSPEC_RESPONSIBILITY_GUIDANCE,
} from '../../../src/core/templates/workflows/humanspec-shared.js';

const skill = getHumanspecInitSkillTemplate();
const command = getHumanspecInitCommandTemplate();
const bodies: Array<[string, string]> = [
  ['skill', skill.instructions],
  ['command', command.content],
];

describe('HumanSpec initialization workflow templates', () => {
  it('keeps the skill and command initialization contracts identical', () => {
    expect(skill.instructions).toBe(command.content);

    for (const [label, body] of bodies) {
      expect(body, label).toContain(HUMANSPEC_INITIALIZATION_GUIDANCE);
      expect(body, label).toContain('external project-local CLI bootstrap');
      expect(body, label).toContain('read-only');
      expect(body, label).toContain('openspec init --profile humanspec --tools <tool-ids>');
      expect(body, label).toContain('outside this workflow');
      expect(body, label).toContain('Preview and confirm before any write');
      expect(body, label).toContain('The human learner writes all application code');
      expect(body, label).toContain(HUMANSPEC_RESPONSIBILITY_GUIDANCE);
      expect(body, label).not.toContain('HumanSpec roadmap behaviors are not implemented yet');
    }
  });

  it('covers fresh-project context collection, milestone proposals, and ready handoff', () => {
    const requiredFields = [
      'project goal and target users',
      'technology stack and project constraints',
      'observable completion criteria',
      'learner experience and current learning goals',
      'available session time budget',
      'preferred coaching and hint style',
      'initial milestone direction',
      'expected outcome',
      'learning focus',
      'observable completion evidence',
    ];

    for (const [label, body] of bodies) {
      const normalized = body.replace(/\s+/g, ' ');
      for (const field of requiredFields) {
        expect(normalized, `${label}: ${field}`).toContain(field);
      }
      for (const marker of [
        'humanspec-project',
        'humanspec-roadmap',
        'humanspec-learner',
        'openspec/project.md',
        'openspec/roadmap.md',
        'openspec/learner.md',
      ]) {
        expect(body, `${label}: ${marker}`).toContain(marker);
      }
      expect(body, label).toContain('recommend `/humanspec:next` only when all three documents are valid');
      expect(body, label).toContain('all three documents are valid HumanSpec documents');
    }
  });

  it('describes missing and partial projects without rewriting valid documents', () => {
    for (const [label, body] of bodies) {
      expect(body, label).toContain('missing');
      expect(body, label).toContain('partial');
      expect(body, label).toContain('offer to create only the missing documents');
      expect(body, label).toContain('A valid existing document is not');
      expect(body, label).toContain('Preserve every');
      expect(body, label).toContain('value not supplied');
    }
  });

  it('requires explicit repeat-run rejection and unmarked-file resolution', () => {
    for (const [label, body] of bodies) {
      expect(body, label).toContain('byte-for-byte unchanged');
      expect(body, label).toContain('explicitly offer preserve, convert, or stop');
      expect(body, label).toContain('existing unmarked user content');
      expect(body, label).toContain('never permission to overwrite');
      expect(body, label).toContain('Require explicit learner confirmation');
      expect(body, label).toContain('context was fully refreshed');
    }
  });

  it('retains the roadmap and learner record grammars without creating changes', () => {
    for (const [label, body] of bodies) {
      expect(body, label).toContain('- [ ] slice: <change-name> — <learning focus>');
      expect(body, label).toContain('- [ ] gap: <description>');
      expect(body, label).toContain('- [ ] mastered: <topic>');
      expect(body, label).toContain('- [ ] review: <topic>');
      expect(body, label).toContain('Never run `openspec new change`');
      expect(body, label).toContain('create a change directory');
    }
  });

  it('uses the public inspection contract for registered paths and markers', () => {
    for (const [label, body] of bodies) {
      expect(body, label).toContain('openspec humanspec context inspect --json');
      expect(body, label).toContain('data.documents');
      expect(body, label).toContain('registered template');
      expect(body, label).toContain('invent alternate `.yaml`/`.yml` document destinations');
    }
  });

  it('covers first-init, partial, repeat, unmarked, rejected, and no-repeat cases', () => {
    const cases = [
      ['first-init', ['fresh', 'missing', 'create']],
      ['partial-doc', ['partial', 'offer to create only the missing documents']],
      ['valid-repeat', ['valid existing document', 'preserve']],
      ['unmarked-file', ['existing unmarked user content', 'preserve, convert, or stop']],
      ['rejected-update', ['byte-for-byte unchanged', 'context was fully refreshed']],
      ['no-repeat-bootstrap', ['never bootstrap or regenerate', 'read-only prerequisite']],
    ] as const;

    for (const [label, body] of bodies) {
      for (const [scenario, markers] of cases) {
        for (const marker of markers) {
          expect(body, `${label}: ${scenario}: ${marker}`).toContain(marker);
        }
      }
      expect(body, `${label}: must not contain a runnable bootstrap line`).not.toMatch(
        /^\s*openspec init(?:\s|$)/imu
      );
      expect(body, `${label}: failed bootstrap must stop before writes`).toContain(
        'no config, generated surface, or project planning document was written'
      );
    }
  });
});
