import { describe, expect, it } from 'vitest';

import {
  getHumanspecNextSkillTemplate,
  getHumanspecProposeSkillTemplate,
} from '../../../src/core/templates/skill-templates.js';
import {
  HUMANSPEC_CHANGE_SIZING_GUIDANCE,
  HUMANSPEC_FIT_REPORT_GUIDANCE,
  HUMANSPEC_SIZING_CRITERIA,
  type HumanSpecSizingCriterionId,
} from '../../../src/core/templates/workflows/humanspec-shared.js';

type CriterionEvidence = Record<HumanSpecSizingCriterionId, 'supported' | 'violated'>;

interface SizingFixture {
  name: string;
  evidence: CriterionEvidence;
  changedCriterion?: HumanSpecSizingCriterionId;
}

const ALL_SUPPORTED = Object.fromEntries(
  HUMANSPEC_SIZING_CRITERIA.map(({ id }) => [id, 'supported'])
) as CriterionEvidence;

const FIXTURES: SizingFixture[] = [
  {
    name: 'bounded slice',
    evidence: ALL_SUPPORTED,
  },
  {
    name: 'same context remains bounded',
    evidence: { ...ALL_SUPPORTED },
  },
  {
    name: 'platform load changes classification',
    evidence: { ...ALL_SUPPORTED, platforms: 'violated' },
    changedCriterion: 'platforms',
  },
];

function classify(evidence: CriterionEvidence): 'fit' | 'oversized' {
  return Object.values(evidence).every((state) => state === 'supported')
    ? 'fit'
    : 'oversized';
}

describe('HumanSpec propose/next sizing parity fixtures', () => {
  it('uses the exact same rendered sizing and report blocks', () => {
    const propose = getHumanspecProposeSkillTemplate().instructions;
    const next = getHumanspecNextSkillTemplate().instructions;

    expect(propose).toContain(HUMANSPEC_CHANGE_SIZING_GUIDANCE);
    expect(next).toContain(HUMANSPEC_CHANGE_SIZING_GUIDANCE);
    expect(propose).toContain(HUMANSPEC_FIT_REPORT_GUIDANCE);
    expect(next).toContain(HUMANSPEC_FIT_REPORT_GUIDANCE);
  });

  it('keeps identical context classifications identical and names changed context', () => {
    const propose = getHumanspecProposeSkillTemplate().instructions;
    const next = getHumanspecNextSkillTemplate().instructions;

    for (const fixture of FIXTURES) {
      const classification = classify(fixture.evidence);
      expect(classification, fixture.name).toBe(
        fixture.changedCriterion ? 'oversized' : 'fit'
      );
      expect(propose, fixture.name).toContain('**Classification:**');
      expect(next, fixture.name).toContain('**Classification:**');
      expect(propose, fixture.name).toContain(`\`${classification}\``);
      expect(next, fixture.name).toContain(`\`${classification}\``);

      if (fixture.changedCriterion) {
        expect(fixture.evidence[fixture.changedCriterion]).toBe('violated');
        expect(propose, fixture.name).toContain(fixture.changedCriterion);
        expect(next, fixture.name).toContain(fixture.changedCriterion);
      }
    }

    expect(classify(FIXTURES[0]!.evidence)).toBe(classify(FIXTURES[1]!.evidence));
    expect(classify(FIXTURES[0]!.evidence)).not.toBe(
      classify(FIXTURES[2]!.evidence)
    );
  });
});
