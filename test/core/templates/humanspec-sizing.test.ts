import { describe, expect, it } from 'vitest';

import {
  HUMANSPEC_CHANGE_SIZING_CONTRACT,
  HUMANSPEC_CHANGE_SIZING_GUIDANCE,
  HUMANSPEC_FIT_REPORT_FIELDS,
  HUMANSPEC_SIZING_CRITERIA,
  HUMANSPEC_SIZING_CRITERION_IDS,
  renderHumanspecFitReportGuidance,
  renderHumanspecSizingGuidance,
} from '../../../src/core/templates/workflows/humanspec-shared.js';

const REQUIRED_CRITERION_IDS = [
  'outcome',
  'goals-concepts',
  'tasks',
  'evidence',
  'budget',
  'platforms',
  'unfamiliar-concepts',
  'whole-system-scope',
  'learner-experience',
  'cognitive-load',
  'roadmap-impact',
] as const;

describe('HumanSpec shared sizing contract', () => {
  it('keeps the criterion IDs stable and complete', () => {
    expect(HUMANSPEC_CHANGE_SIZING_CONTRACT).toBe(HUMANSPEC_SIZING_CRITERIA);
    expect(HUMANSPEC_SIZING_CRITERIA).toHaveLength(REQUIRED_CRITERION_IDS.length);
    expect(new Set(HUMANSPEC_SIZING_CRITERION_IDS).size).toBe(REQUIRED_CRITERION_IDS.length);
    expect([...HUMANSPEC_SIZING_CRITERION_IDS]).toEqual([...REQUIRED_CRITERION_IDS]);

    for (const criterion of HUMANSPEC_SIZING_CRITERIA) {
      expect(criterion.id).toBeTruthy();
      expect(criterion.label).toBeTruthy();
      expect(criterion.guidance).toBeTruthy();
    }
  });

  it('renders every criterion without introducing a numeric or file-count score', () => {
    const rendered = renderHumanspecSizingGuidance();

    expect(rendered).toBe(HUMANSPEC_CHANGE_SIZING_GUIDANCE);
    expect(rendered).toContain('not a\nnumeric score');
    expect(rendered).toContain('file counts');
    expect(rendered).not.toMatch(/(?:score|classification)\s*[:=]\s*\d+/iu);

    for (const criterion of HUMANSPEC_SIZING_CRITERIA) {
      expect(rendered).toContain(`[${criterion.id}]`);
      expect(rendered).toContain(criterion.label);
      expect(rendered).toContain(criterion.guidance);
    }
  });

  it('renders one shared auditable fit/oversized report shape', () => {
    const rendered = renderHumanspecFitReportGuidance();

    expect(HUMANSPEC_FIT_REPORT_FIELDS).toEqual([
      'classification',
      'context',
      'criterion-evidence',
      'violated-criteria',
      'completion-evidence',
      'roadmap-impact',
      'next-action',
    ]);
    for (const field of HUMANSPEC_FIT_REPORT_FIELDS) {
      expect(rendered).toContain(field);
    }
    expect(rendered).toContain('`fit` or `oversized`');
    expect(rendered).toContain('preserve');
    expect(rendered).toContain('interrupt');
    expect(rendered).toContain('replace');
    expect(rendered).toContain('extend');
    expect(rendered).toContain('which context or criterion changed');
  });
});
