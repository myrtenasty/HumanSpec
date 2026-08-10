import { describe, expect, it } from 'vitest';

import {
  LEARNING_FEEDBACK_END_MARKER,
  LEARNING_FEEDBACK_START_MARKER,
  LEARNING_FEEDBACK_VERSION,
  learningFeedbackRecordIdentity,
  parseLearningFeedback,
  renderLearningFeedbackRegion,
  replaceLearningFeedbackRegion,
} from '../../../src/core/templates/learning-feedback.js';

function region(lines: readonly string[]): string {
  return [LEARNING_FEEDBACK_START_MARKER, ...lines, LEARNING_FEEDBACK_END_MARKER].join('\n');
}

describe('canonical learning feedback', () => {
  it.each([
    ['complete', ['- mastered: Bounded parser', '- gap: Diagnostics', '- review: CRLF handling']],
    ['incomplete', ['- gap: Missing reflection', '- review: Revisit ownership']],
    ['inconclusive', ['- gap: Unavailable integration check']],
  ] as const)('parses a %s feedback result', (status, lines) => {
    const parsed = parseLearningFeedback(region([`- learning-status: ${status}`, ...lines]));

    expect(parsed.issues).toEqual([]);
    expect(parsed.feedback).toEqual({
      version: LEARNING_FEEDBACK_VERSION,
      status,
      records: lines.map((line) => {
        const [, kind, topic] = line.match(/- (mastered|gap|review): (.+)/u)!;
        return { kind, topic };
      }),
    });
  });

  it('preserves repeated typed records and makes duplicate identity explicit', () => {
    const parsed = parseLearningFeedback(region([
      '- learning-status: complete',
      '- mastered: Bounded parser',
      '- mastered: bounded   parser',
      '- review: Bounded parser',
    ]));

    expect(parsed.feedback?.records).toHaveLength(3);
    expect(learningFeedbackRecordIdentity(parsed.feedback!.records[0])).toBe(
      learningFeedbackRecordIdentity(parsed.feedback!.records[1])
    );
    expect(learningFeedbackRecordIdentity(parsed.feedback!.records[0])).not.toBe(
      learningFeedbackRecordIdentity(parsed.feedback!.records[2])
    );
  });

  it('omits empty categories and rejects placeholder topics or premature mastery', () => {
    const rendered = renderLearningFeedbackRegion({
      version: LEARNING_FEEDBACK_VERSION,
      status: 'complete',
      records: [{ kind: 'gap', topic: 'Uncertain edge case' }],
    });
    expect(rendered).not.toContain('mastered:');
    expect(rendered).not.toContain('review:');
    expect(() => renderLearningFeedbackRegion({
      version: LEARNING_FEEDBACK_VERSION,
      status: 'incomplete',
      records: [{ kind: 'mastered', topic: 'Must wait' }],
    })).toThrow(/Only learning-status: complete/u);

    const parsed = parseLearningFeedback(region([
      '- learning-status: complete',
      '- gap: <none>',
    ]));
    expect(parsed.feedback).toBeUndefined();
    expect(parsed.issues.map((item) => item.code)).toContain('empty-topic');
  });

  it('rejects malformed boundaries, unknown versions, and invalid typed lines without mining partial records', () => {
    const malformed = parseLearningFeedback([
      LEARNING_FEEDBACK_START_MARKER,
      '- learning-status: complete',
      '- mastered: Should not replay',
    ].join('\n'));
    expect(malformed.feedback).toBeUndefined();
    expect(malformed.issues.map((item) => item.code)).toContain('malformed-marker');

    const unknown = parseLearningFeedback([
      '<!-- humanspec:learning-feedback:start version=2 -->',
      '- learning-status: complete',
      '- mastered: Future record',
      LEARNING_FEEDBACK_END_MARKER,
    ].join('\n'));
    expect(unknown.feedback).toBeUndefined();
    expect(unknown.issues.map((item) => item.code)).toContain('unknown-version');

    const invalid = parseLearningFeedback(region([
      '- learning-status: incomplete',
      '- mastered: Must not replay',
      '- unknown: Also invalid',
    ]));
    expect(invalid.feedback).toBeUndefined();
    expect(invalid.issues.map((item) => item.code)).toEqual(
      expect.arrayContaining(['mastery-without-complete-status', 'unknown-record-type'])
    );
  });

  it('selects the latest complete canonical region, preserves CRLF, and changes no surrounding bytes', () => {
    const first = region(['- learning-status: complete', '- mastered: Old result']);
    const latest = region(['- learning-status: incomplete', '- gap: Current gap']);
    const content = ['## Before', 'Learner reflection', '## AI 验证记录', first, latest, '## After', 'Task text']
      .join('\r\n');
    const parsed = parseLearningFeedback(content);
    expect(parsed.feedback).toMatchObject({ status: 'incomplete', records: [{ kind: 'gap', topic: 'Current gap' }] });

    const replaced = replaceLearningFeedbackRegion(content, {
      version: LEARNING_FEEDBACK_VERSION,
      status: 'complete',
      records: [{ kind: 'mastered', topic: 'Recovered evidence' }],
    });
    expect(replaced.issues).toEqual([]);
    expect(replaced.content).toContain('\r\n- mastered: Recovered evidence\r\n');
    expect(replaced.content.slice(0, replaced.content.indexOf(LEARNING_FEEDBACK_START_MARKER))).toBe(
      content.slice(0, content.indexOf(LEARNING_FEEDBACK_START_MARKER))
    );
    expect(replaced.content).toContain('## After\r\nTask text');
  });
});
