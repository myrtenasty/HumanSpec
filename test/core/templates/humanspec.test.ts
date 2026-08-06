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
import { HUMANSPEC_IMPLEMENTATION_BOUNDARY, HUMANSPEC_PROJECT_DOCS } from '../../../src/core/templates/workflows/humanspec-shared.js';

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

  it('declares the initial write boundaries honestly', () => {
    const boundaries: Record<string, string> = {
      'humanspec-init': 'project planning documents only',
      'humanspec-next': 'routing and guidance only',
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

  it('does not claim later roadmap behaviors as already implemented', () => {
    const laterBehaviors = [
      'reflection gate',
      'adaptive routing',
      'learning-aware archive',
      'learner profile',
      'roadmap updates itself',
    ];
    for (const [id, factory] of SKILL_FACTORIES) {
      const instructions = factory().instructions;
      for (const behavior of laterBehaviors) {
        expect(instructions, `${id}: must not claim "${behavior}"`).not.toMatch(
          new RegExp(`(implements|provides|runs|updates) .*${behavior}`, 'i')
        );
      }
      // Honest templates say what is NOT there yet.
      expect(instructions, id).toMatch(
        /later[^\n]*roadmap|not[\s\S]{0,100}yet|does not[\s\S]{0,100}yet/i
      );
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
