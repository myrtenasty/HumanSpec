import { describe, expect, it } from 'vitest';

import {
  CHECKLIST_RESULT_FIELDS,
  resolveManualStatus,
  validateChecklistResult,
} from '../../scripts/qa/manual.mjs';

function result(overrides: Record<string, unknown> = {}) {
  return {
    tool: 'human-review',
    model: 'human-review',
    modelVersion: '2026-08',
    platform: 'linux',
    packedArtifact: '@fission-ai/openspec@1.7.0 sha512-abc',
    fixtureRevision: 'fixture-v1',
    disposition: 'pass',
    reviewer: 'qa',
    date: '2026-08-10',
    evidenceNotes: 'evidence',
    ...overrides,
  };
}

describe('manual HumanSpec checklist status', () => {
  it('defines the complete portable result record', () => {
    expect(CHECKLIST_RESULT_FIELDS).toEqual([
      'tool', 'model', 'modelVersion', 'platform', 'packedArtifact',
      'fixtureRevision', 'disposition', 'reviewer', 'date', 'evidenceNotes',
    ]);
    expect(validateChecklistResult(result())).toEqual({ valid: true, missing: [] });
  });

  it('distinguishes not-run, current pass/fail, and stale evidence', () => {
    expect(resolveManualStatus(null, { fixtureRevision: 'fixture-v1', artifactVersion: '1.7.0' })).toBe('not-run');
    expect(resolveManualStatus(result(), { fixtureRevision: 'fixture-v1', artifactVersion: '1.7.0' })).toBe('current-pass');
    expect(resolveManualStatus(result({ disposition: 'fail' }), { fixtureRevision: 'fixture-v1', artifactVersion: '1.7.0' })).toBe('current-fail');
    expect(resolveManualStatus(result({ fixtureRevision: 'old' }), { fixtureRevision: 'fixture-v1', artifactVersion: '1.7.0' })).toBe('stale');
    expect(resolveManualStatus(result({ packedArtifact: '@fission-ai/openspec@1.6.0' }), { fixtureRevision: 'fixture-v1', artifactVersion: '1.7.0' })).toBe('stale');
  });
});
