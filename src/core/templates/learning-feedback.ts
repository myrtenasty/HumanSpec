/**
 * Canonical, replayable learning feedback written by the HumanSpec verify
 * workflow. The bounded region is deliberately small: learner-owned Markdown
 * stays outside it, while archive/reconciliation can read typed evidence
 * without reinterpreting narrative text.
 */

export const LEARNING_FEEDBACK_VERSION = 1 as const;
export const LEARNING_FEEDBACK_START_MARKER =
  '<!-- humanspec:learning-feedback:start version=1 -->';
export const LEARNING_FEEDBACK_END_MARKER = '<!-- humanspec:learning-feedback:end -->';

export type LearningFeedbackStatus = 'complete' | 'incomplete' | 'inconclusive';
export type LearningFeedbackRecordKind = 'mastered' | 'gap' | 'review';

export interface LearningFeedbackRecord {
  kind: LearningFeedbackRecordKind;
  /** Learner-facing text; identity normalization never replaces this value. */
  topic: string;
}

export interface LearningFeedback {
  version: typeof LEARNING_FEEDBACK_VERSION;
  status: LearningFeedbackStatus;
  records: readonly LearningFeedbackRecord[];
}

export type LearningFeedbackValidationIssueCode =
  | 'malformed-marker'
  | 'unknown-version'
  | 'missing-status'
  | 'duplicate-status'
  | 'invalid-status'
  | 'malformed-record'
  | 'unknown-record-type'
  | 'empty-topic'
  | 'mastery-without-complete-status';

export interface LearningFeedbackValidationIssue {
  code: LearningFeedbackValidationIssueCode;
  message: string;
  /** One-based source line, when the issue came from parsed Markdown. */
  line?: number;
}

export interface LearningFeedbackRegion {
  /** Zero-based inclusive line positions in the containing Markdown document. */
  startLine: number;
  endLine: number;
  version: string;
}

export interface ParsedLearningFeedback {
  /** Present only when the latest bounded region is complete and valid. */
  feedback?: LearningFeedback;
  /** Present when at least one bounded feedback region was found. */
  region?: LearningFeedbackRegion;
  issues: LearningFeedbackValidationIssue[];
}

const START_MARKER_PATTERN = /^<!--\s*humanspec:learning-feedback:start\s+version=([^\s>]+)\s*-->$/u;
const START_MARKER_PREFIX = /^<!--\s*humanspec:learning-feedback:start\b/u;
const END_MARKER_PATTERN = /^<!--\s*humanspec:learning-feedback:end\s*-->$/u;
const STATUS_PATTERN = /^-\s+learning-status:\s*(.*?)\s*$/u;
const RECORD_PATTERN = /^-\s+(mastered|gap|review):\s*(.*?)\s*$/u;
const LABELLED_RECORD_PATTERN = /^-\s+([\p{L}][\p{L}\p{N}\s-]*):/u;
const NON_TOPIC_PLACEHOLDER_PATTERN = /^(?:<\s*)?(?:none|no\s+(?:items?|records?|topics?)|n\/a|null)(?:\s*>)?$/iu;

function issue(
  code: LearningFeedbackValidationIssueCode,
  message: string,
  line?: number
): LearningFeedbackValidationIssue {
  return { code, message, ...(line === undefined ? {} : { line }) };
}

function lineEndingFor(content: string): '\n' | '\r\n' {
  return content.includes('\r\n') ? '\r\n' : '\n';
}

function isLearningFeedbackStatus(value: string): value is LearningFeedbackStatus {
  return value === 'complete' || value === 'incomplete' || value === 'inconclusive';
}

function isLearningFeedbackRecordKind(value: string): value is LearningFeedbackRecordKind {
  return value === 'mastered' || value === 'gap' || value === 'review';
}

/** Returns a conservative logical identity while retaining the original display text. */
export function normalizeLearningFeedbackTopic(topic: string): string {
  return topic
    .normalize('NFKC')
    .replace(/[`*_]/gu, '')
    .replace(/\s+/gu, ' ')
    .trim()
    .replace(/[：:]+$/u, '')
    .replace(/[.!?。！？]+$/u, '')
    .trim()
    .toLocaleLowerCase();
}

/** Logical duplicate identity is record type plus normalized topic. */
export function learningFeedbackRecordIdentity(record: LearningFeedbackRecord): string {
  return `${record.kind}:${normalizeLearningFeedbackTopic(record.topic)}`;
}

/** Reject values that could turn an empty category into a learner topic. */
export function hasMeaningfulLearningFeedbackTopic(topic: string): boolean {
  const value = topic.trim();
  return value.length > 0
    && !/^<[^>]+>$/u.test(value)
    && !/^\[deferred:/iu.test(value)
    && !NON_TOPIC_PLACEHOLDER_PATTERN.test(value);
}

/** Validates a complete feedback value before rendering it into the AI-owned region. */
export function validateLearningFeedback(feedback: LearningFeedback): LearningFeedbackValidationIssue[] {
  const issues: LearningFeedbackValidationIssue[] = [];
  if (feedback.version !== LEARNING_FEEDBACK_VERSION) {
    issues.push(issue('unknown-version', `Unsupported learning-feedback version ${String(feedback.version)}.`));
  }
  if (!isLearningFeedbackStatus(feedback.status)) {
    issues.push(issue('invalid-status', `Unsupported learning-status ${JSON.stringify(feedback.status)}.`));
  }
  for (const record of feedback.records) {
    if (!isLearningFeedbackRecordKind(record.kind)) {
      issues.push(issue('unknown-record-type', `Unsupported learning-feedback record type ${JSON.stringify(record.kind)}.`));
      continue;
    }
    if (!hasMeaningfulLearningFeedbackTopic(record.topic)) {
      issues.push(issue('empty-topic', `${record.kind} records need a meaningful topic; omit an empty category instead.`));
    }
    if (record.kind === 'mastered' && feedback.status !== 'complete') {
      issues.push(issue('mastery-without-complete-status', 'Only learning-status: complete may emit mastered records.'));
    }
  }
  return issues;
}

/** Renders only the bounded version-1 grammar; categories without records emit no placeholder. */
export function renderLearningFeedbackRegion(
  feedback: LearningFeedback,
  lineEnding: '\n' | '\r\n' = '\n'
): string {
  const issues = validateLearningFeedback(feedback);
  if (issues.length > 0) {
    throw new Error(`Cannot render invalid learning feedback: ${issues.map((item) => item.message).join(' ')}`);
  }
  return [
    LEARNING_FEEDBACK_START_MARKER,
    `- learning-status: ${feedback.status}`,
    ...feedback.records.map((record) => `- ${record.kind}: ${record.topic.trim()}`),
    LEARNING_FEEDBACK_END_MARKER,
  ].join(lineEnding);
}

/**
 * Parses the latest bounded region. A future version is explicitly rejected
 * rather than falling back to an older result, preventing stale mastery replay.
 */
export function parseLearningFeedback(content: string): ParsedLearningFeedback {
  const lines = content.split(/\r?\n/u);
  const regions: LearningFeedbackRegion[] = [];
  const issues: LearningFeedbackValidationIssue[] = [];
  const claimedEndLines = new Set<number>();

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index].trim();
    if (!START_MARKER_PREFIX.test(line)) continue;
    const marker = line.match(START_MARKER_PATTERN);
    let endLine = -1;
    for (let candidate = index + 1; candidate < lines.length; candidate += 1) {
      if (END_MARKER_PATTERN.test(lines[candidate].trim())) {
        endLine = candidate;
        break;
      }
      if (START_MARKER_PREFIX.test(lines[candidate].trim())) break;
    }
    if (!marker || endLine === -1) {
      issues.push(issue(
        'malformed-marker',
        'Learning feedback must use one bounded start marker with version and a matching end marker.',
        index + 1
      ));
      continue;
    }
    claimedEndLines.add(endLine);
    regions.push({ startLine: index, endLine, version: marker[1] });
    index = endLine;
  }

  for (let index = 0; index < lines.length; index += 1) {
    if (END_MARKER_PATTERN.test(lines[index].trim()) && !claimedEndLines.has(index)) {
      issues.push(issue('malformed-marker', 'Learning feedback end marker has no matching start marker.', index + 1));
    }
  }

  const region = regions.at(-1);
  if (!region) return { issues };
  if (region.version !== String(LEARNING_FEEDBACK_VERSION)) {
    return {
      region,
      issues: [
        ...issues,
        issue('unknown-version', `Learning feedback version ${JSON.stringify(region.version)} is not supported.`, region.startLine + 1),
      ],
    };
  }

  const regionIssues: LearningFeedbackValidationIssue[] = [];
  let status: LearningFeedbackStatus | undefined;
  const records: LearningFeedbackRecord[] = [];
  for (let index = region.startLine + 1; index < region.endLine; index += 1) {
    const line = lines[index].trim();
    if (!line) continue;
    const statusMatch = line.match(STATUS_PATTERN);
    if (statusMatch) {
      if (status !== undefined) {
        regionIssues.push(issue('duplicate-status', 'Learning feedback may contain exactly one learning-status line.', index + 1));
      } else if (isLearningFeedbackStatus(statusMatch[1])) {
        status = statusMatch[1];
      } else {
        regionIssues.push(issue('invalid-status', `Unsupported learning-status ${JSON.stringify(statusMatch[1])}.`, index + 1));
      }
      continue;
    }
    const recordMatch = line.match(RECORD_PATTERN);
    if (recordMatch) {
      const kind = recordMatch[1] as LearningFeedbackRecordKind;
      const topic = recordMatch[2];
      if (!hasMeaningfulLearningFeedbackTopic(topic)) {
        regionIssues.push(issue('empty-topic', `${kind} records need a meaningful topic; omit an empty category instead.`, index + 1));
      } else {
        records.push({ kind, topic: topic.trim() });
      }
      continue;
    }
    const labelledMatch = line.match(LABELLED_RECORD_PATTERN);
    if (labelledMatch) {
      regionIssues.push(issue('unknown-record-type', `Unsupported learning-feedback record type ${JSON.stringify(labelledMatch[1])}.`, index + 1));
    } else {
      regionIssues.push(issue('malformed-record', 'Learning feedback contains a line outside the version-1 typed record grammar.', index + 1));
    }
  }
  if (status === undefined) {
    regionIssues.push(issue('missing-status', 'Learning feedback must contain one learning-status line.', region.startLine + 1));
  }
  if (status !== 'complete' && records.some((record) => record.kind === 'mastered')) {
    regionIssues.push(issue('mastery-without-complete-status', 'Only learning-status: complete may emit mastered records.', region.startLine + 1));
  }

  if (regionIssues.length > 0 || status === undefined) {
    return { region, issues: [...issues, ...regionIssues] };
  }
  return {
    region,
    feedback: { version: LEARNING_FEEDBACK_VERSION, status, records },
    issues,
  };
}

/** Preserves the surrounding Markdown and its existing line ending. */
export function replaceLearningFeedbackRegion(
  content: string,
  feedback: LearningFeedback
): { content: string; issues: LearningFeedbackValidationIssue[] } {
  const parsed = parseLearningFeedback(content);
  if (!parsed.region) {
    return {
      content,
      issues: [...parsed.issues, issue('malformed-marker', 'No bounded learning-feedback region was found to replace.')],
    };
  }
  const renderIssues = validateLearningFeedback(feedback);
  if (renderIssues.length > 0) return { content, issues: renderIssues };
  const lineEnding = lineEndingFor(content);
  const lines = content.split(/\r?\n/u);
  const replacement = renderLearningFeedbackRegion(feedback, lineEnding).split(lineEnding);
  return {
    content: [...lines.slice(0, parsed.region.startLine), ...replacement, ...lines.slice(parsed.region.endLine + 1)].join(lineEnding),
    issues: parsed.issues,
  };
}
