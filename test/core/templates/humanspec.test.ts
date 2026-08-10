import { describe, it, expect } from 'vitest';

import {
  getHumanspecInitSkillTemplate,
  getHumanspecNextSkillTemplate,
  getHumanspecProposeSkillTemplate,
  getHumanspecCoachSkillTemplate,
  getHumanspecVerifySkillTemplate,
  getHumanspecArchiveSkillTemplate,
  getHumanspecExploreSkillTemplate,
  getHumanspecInitCommandTemplate,
  getHumanspecNextCommandTemplate,
  getHumanspecProposeCommandTemplate,
  getHumanspecCoachCommandTemplate,
  getHumanspecVerifyCommandTemplate,
  getHumanspecArchiveCommandTemplate,
  getHumanspecExploreCommandTemplate,
} from '../../../src/core/templates/skill-templates.js';
import {
  HUMANSPEC_IMPLEMENTATION_BOUNDARY,
  HUMANSPEC_PROJECT_DOCS,
  HUMANSPEC_RESPONSIBILITY_GUIDANCE,
} from '../../../src/core/templates/workflows/humanspec-shared.js';

const SKILL_FACTORIES: Array<[string, () => { name: string; instructions: string }]> = [
  ['humanspec-init', getHumanspecInitSkillTemplate],
  ['humanspec-next', getHumanspecNextSkillTemplate],
  ['humanspec-propose', getHumanspecProposeSkillTemplate],
  ['humanspec-coach', getHumanspecCoachSkillTemplate],
  ['humanspec-verify', getHumanspecVerifySkillTemplate],
  ['humanspec-archive', getHumanspecArchiveSkillTemplate],
  ['humanspec-explore', getHumanspecExploreSkillTemplate],
];

const COMMAND_FACTORIES: Array<[string, () => { name: string; content: string }]> = [
  ['humanspec-init', getHumanspecInitCommandTemplate],
  ['humanspec-next', getHumanspecNextCommandTemplate],
  ['humanspec-propose', getHumanspecProposeCommandTemplate],
  ['humanspec-coach', getHumanspecCoachCommandTemplate],
  ['humanspec-verify', getHumanspecVerifyCommandTemplate],
  ['humanspec-archive', getHumanspecArchiveCommandTemplate],
  ['humanspec-explore', getHumanspecExploreCommandTemplate],
];

const FORBIDDEN_INTERNAL_CONTEXT_IDENTIFIERS = [
  'PROJECT_DOC_TEMPLATES',
  'getProjectDocTemplate',
  'resolveProjectDocPath',
  'detectHumanSpecDocType',
  'readProjectDocumentFeedbackContext',
  'resolveNextRoadmapContext',
  'planArchiveFeedback',
  'applyArchiveFeedback',
  'reconcileArchiveFeedback',
] as const;

describe('HumanSpec workflow templates', () => {
  it('every skill template carries the shared human-implementation boundary', () => {
    for (const [id, factory] of SKILL_FACTORIES) {
      const template = factory();
      expect(template.instructions, id).toContain(HUMANSPEC_IMPLEMENTATION_BOUNDARY);
      expect(template.instructions, id).toContain(
        'The human learner writes all application code and all test implementation code'
      );
    }
  });

  it('every command template carries the shared human-implementation boundary', () => {
    for (const [id, factory] of COMMAND_FACTORIES) {
      const template = factory();
      expect(template.content, id).toContain(HUMANSPEC_IMPLEMENTATION_BOUNDARY);
      expect(template.content, id).toContain(
        'The human learner writes all application code and all test implementation code'
      );
    }
  });

  it('every skill template carries the shared project-context reading convention', () => {
    for (const [id, factory] of SKILL_FACTORIES) {
      const template = factory();
      expect(template.instructions, id).toContain(HUMANSPEC_PROJECT_DOCS);
      expect(template.instructions, id).toContain('openspec/project.md');
      expect(template.instructions, id).toContain('openspec/roadmap.md');
      expect(template.instructions, id).toContain('openspec/learner.md');
    }
  });

  it('every command template carries the shared project-context reading convention', () => {
    for (const [id, factory] of COMMAND_FACTORIES) {
      const template = factory();
      expect(template.content, id).toContain(HUMANSPEC_PROJECT_DOCS);
      expect(template.content, id).toContain('openspec/project.md');
      expect(template.content, id).toContain('openspec/roadmap.md');
      expect(template.content, id).toContain('openspec/learner.md');
    }
  });

  it('uses only public context commands across every HumanSpec delivery surface', () => {
    for (const [id, factory] of SKILL_FACTORIES) {
      const body = factory().instructions;
      expect(body, id).toContain('openspec humanspec context inspect --json');
      for (const identifier of FORBIDDEN_INTERNAL_CONTEXT_IDENTIFIERS) {
        expect(body, `${id}: ${identifier}`).not.toContain(identifier);
      }
    }
    for (const [id, factory] of COMMAND_FACTORIES) {
      const body = factory().content;
      expect(body, id).toContain('openspec humanspec context inspect --json');
      for (const identifier of FORBIDDEN_INTERNAL_CONTEXT_IDENTIFIERS) {
        expect(body, `${id}: ${identifier}`).not.toContain(identifier);
      }
    }

    for (const factory of [getHumanspecNextSkillTemplate, getHumanspecNextCommandTemplate]) {
      expect(factory().instructions ?? factory().content).toContain('openspec humanspec context next --json');
      expect(factory().instructions ?? factory().content).toContain('openspec humanspec context feedback-reconcile');
    }
    for (const factory of [getHumanspecArchiveSkillTemplate, getHumanspecArchiveCommandTemplate]) {
      const body = factory().instructions ?? factory().content;
      expect(body).toContain('openspec humanspec context feedback-plan');
      expect(body).toContain('openspec humanspec context feedback-apply');
      expect(body).toContain('openspec humanspec context feedback-reconcile');
    }
  });

  it('declares the initial write boundaries honestly', () => {
    const boundaries: Record<string, string> = {
      'humanspec-init': 'project planning documents only',
      'humanspec-next': 'routing and bounded planning guidance',
      'humanspec-propose': 'change planning artifacts only',
      'humanspec-coach': 'no implementation writes',
      'humanspec-verify': 'review output and the reserved AI verification area of learning.md',
      'humanspec-archive': 'specifications, planning records, and archive paths',
      'humanspec-explore': 'no implementation writes',
    };

    for (const [id, factory] of SKILL_FACTORIES) {
      const instructions = factory().instructions.replace(/\s+/g, ' ');
      expect(instructions, id).toContain('Write boundary');
      expect(instructions, id).toContain(boundaries[id]);
    }
    for (const [id, factory] of COMMAND_FACTORIES) {
      const content = factory().content.replace(/\s+/g, ' ');
      expect(content, id).toContain('Write boundary');
      expect(content, id).toContain(boundaries[id]);
    }
  });

  it('uses stable responsibility handoffs instead of historical feature status', () => {
    const laterBehaviors = [
      'reflection gate',
      'adaptive routing',
      'learning-aware archive',
      'learner profile',
      'roadmap updates itself',
    ];
    for (const [id, factory] of SKILL_FACTORIES) {
      const instructions = factory().instructions;
      expect(instructions, id).toContain(HUMANSPEC_RESPONSIBILITY_GUIDANCE);
      expect(instructions, id).not.toContain('not implemented yet');
      for (const behavior of laterBehaviors) {
        expect(instructions, `${id}: must not claim "${behavior}"`).not.toMatch(
          new RegExp(`(implements|provides|runs|updates) .*${behavior}`, 'i')
        );
      }
    }
    for (const [id, factory] of COMMAND_FACTORIES) {
      const content = factory().content;
      expect(content, id).toContain(HUMANSPEC_RESPONSIBILITY_GUIDANCE);
      expect(content, id).not.toContain('not implemented yet');
    }
  });

  it('identifies the current responsibility in the template name and description', () => {
    const descriptions: Record<string, string> = {
      'humanspec-init': /init/i,
      'humanspec-next': /next/i,
      'humanspec-propose': /propose/i,
      'humanspec-coach': /coach/i,
      'humanspec-verify': /verify/i,
      'humanspec-archive': /archive/i,
      'humanspec-explore': /explore/i,
    };
    for (const [id, factory] of SKILL_FACTORIES) {
      const template = factory();
      expect(template.name, id).toBe(id);
      expect(template.description, id).toMatch(descriptions[id]);
    }
  });

  it('never instructs the agent to implement code', () => {
    for (const [id, factory] of SKILL_FACTORIES) {
      expect(factory().instructions, id).not.toMatch(/write the (application|test) (code|files)/i);
      expect(factory().instructions, id).not.toMatch(/implement the (feature|change|tasks)/i);
    }
  });
});
