import { promises as fs } from 'node:fs';
import path from 'node:path';

import {
  detectHumanSpecDocType,
  getProjectDocTemplate,
  resolveProjectDocPath,
  type ProjectDocId,
  type ProjectDocSectionDescriptor,
} from './project-docs.js';

/** A structured issue that prevents the planner from guessing at a document. */
export interface ProjectDocumentFeedbackIssue {
  code:
    | 'missing'
    | 'unreadable'
    | 'unmarked'
    | 'malformed'
    | 'duplicated'
    | 'ambiguous'
    | 'conflict';
  document: ProjectDocId;
  message: string;
  anchor?: string;
  line?: number;
}

export type ProjectDocumentFeedbackStatus =
  | 'missing'
  | 'unreadable'
  | 'unmarked'
  | 'malformed'
  | 'valid';

export interface ProjectDocumentFeedbackAnalysis {
  id: ProjectDocId;
  path: string;
  status: ProjectDocumentFeedbackStatus;
  content?: string;
  lineEnding: '\n' | '\r\n';
  requiredHeadings: readonly ProjectDocSectionDescriptor[];
  issues: ProjectDocumentFeedbackIssue[];
  headings: Record<string, number>;
  candidates: RoadmapCandidateRecord[];
  archivedRecords: ArchivedRoadmapRecord[];
  learnerRecords: LearnerFeedbackRecord[];
}

export interface RoadmapCandidateRecord {
  kind: 'candidate-slice';
  changeName: string;
  learningFocus: string;
  checked: boolean;
  line: number;
  raw: string;
}

export interface ArchivedRoadmapRecord {
  kind: 'archived-slice';
  changeName: string;
  outcome: string;
  feedback: 'pending' | 'complete';
  checked: boolean;
  line: number;
  raw: string;
}

export type LearnerFeedbackKind = 'gap' | 'mastered' | 'review';

export interface LearnerFeedbackRecord {
  kind: LearnerFeedbackKind;
  topic: string;
  normalizedTopic: string;
  checked: boolean;
  line?: number;
  raw?: string;
}

export interface LearnerFeedbackEvidence {
  /** Explicitly verified topics; these are accepted only for learning-complete evidence. */
  mastered?: readonly string[];
  masteredTopics?: readonly string[];
  /** Explicit knowledge gaps identified by the learner or verification record. */
  gaps?: readonly string[];
  knowledgeGaps?: readonly string[];
  /** Explicit items that should be revisited later. */
  review?: readonly string[];
  reviewItems?: readonly string[];
  /** Latest verification assessment, when available. */
  learningAssessment?: string;
  learningResultAssessment?: string;
  /** A verification record from which only explicit feedback records are extracted. */
  verificationRecord?: string;
  latestVerification?: string | {
    learningAssessment?: string;
    learningResultAssessment?: string;
    mastered?: readonly string[];
    masteredTopics?: readonly string[];
    gaps?: readonly string[];
    knowledgeGaps?: readonly string[];
    review?: readonly string[];
    reviewItems?: readonly string[];
    [key: string]: unknown;
  };
}

export interface LearnerFeedbackProposal {
  records: LearnerFeedbackRecord[];
  duplicates: LearnerFeedbackRecord[];
  conflicts: ProjectDocumentFeedbackIssue[];
}

export interface ArchiveFeedbackPlanInput {
  projectRoot?: string;
  changeName: string;
  /** The stable outcome text used in the archived roadmap record. */
  outcome?: string;
  milestoneOutcome?: string;
  /** The reported canonical archive destination used during reconciliation. */
  archivedPath?: string;
  archivedLearningContent?: string;
  /** Evidence from the learner and the latest verification record. */
  evidence?: LearnerFeedbackEvidence;
  learningEvidence?: LearnerFeedbackEvidence;
  verificationRecord?: string;
  /** Direct contents are useful for pure tests and callers with pre-read files. */
  documents?: Partial<Record<ProjectDocId, string | { path?: string; content: string }>>;
  projectContent?: string;
  roadmapContent?: string;
  learnerContent?: string;
}

export type ArchiveFeedbackPlanStatus = 'ready' | 'blocked' | 'already-applied';

export interface ArchiveFeedbackDocumentPlan {
  id: ProjectDocId;
  path: string;
  before: string;
  /** Roadmap content after the first write, with feedback still pending. */
  pendingContent?: string;
  /** Roadmap content after learner feedback has been written. */
  completeContent?: string;
  /** Learner content after the confirmed records are inserted. */
  proposedContent?: string;
  changed: boolean;
}

export interface ArchiveFeedbackPlan {
  changeName: string;
  status: ArchiveFeedbackPlanStatus;
  ready: boolean;
  alreadyApplied: boolean;
  issues: ProjectDocumentFeedbackIssue[];
  documents: Partial<Record<ProjectDocId, ArchiveFeedbackDocumentPlan>>;
  analyses: Partial<Record<ProjectDocId, ProjectDocumentFeedbackAnalysis>>;
  archivedRecord?: ArchivedRoadmapRecord;
  learnerRecords: LearnerFeedbackRecord[];
  duplicateLearnerRecords: LearnerFeedbackRecord[];
  archivedOutcome: string;
  feedbackState: 'pending' | 'complete';
}

export interface ArchiveFeedbackApplyOptions {
  /** Injectable for tests and callers that need to report a write failure. */
  atomicWrite?: (filePath: string, content: string) => Promise<void>;
  /** Explicitly reject the preview without changing either document. */
  confirmed?: boolean;
}

export interface ArchiveFeedbackApplyResult {
  status: 'complete' | 'pending' | 'blocked' | 'already-applied' | 'conflict';
  feedbackState: 'pending' | 'complete';
  archivedChange: string;
  writtenDocuments: ProjectDocId[];
  pendingDocuments: ProjectDocId[];
  issues: ProjectDocumentFeedbackIssue[];
  reconciliationRequired: boolean;
  nextAction: string;
}

export interface NextRoadmapContext {
  status: 'blocked' | 'reconciliation' | 'ready' | 'empty';
  issues: ProjectDocumentFeedbackIssue[];
  candidates: RoadmapCandidateRecord[];
  archivedChangeNames: string[];
  pendingFeedback: ArchivedRoadmapRecord[];
  learnerRecords: LearnerFeedbackRecord[];
}

interface SectionRange {
  heading: string;
  level: number;
  start: number;
  end: number;
}

interface NormalizedDocument {
  lines: string[];
  newline: '\n' | '\r\n';
}

const ROADMAP_CANDIDATE_PATTERN = /^\s*-\s*\[([ xX])\]\s*slice:\s*(.+?)\s+—\s*(.+?)\s*$/u;
const ROADMAP_ARCHIVED_PATTERN = /^\s*-\s*\[([ xX])\]\s*archived:\s*(.+?)\s+—\s*(.+?)\s+\(feedback:\s*(pending|complete)\)\s*$/u;
const LEARNER_RECORD_PATTERN = /^\s*-\s*\[([ xX])\]\s*(gap|mastered|review):\s*(.+?)\s*$/u;
const HEADING_PATTERN = /^(#{1,6})\s+(.+?)\s*$/u;
const PLACEHOLDER_PATTERN = /^<[^>]+>$/u;

function normalizeLine(line: string): string {
  return line.endsWith('\r') ? line.slice(0, -1) : line;
}

function normalizeDocument(content: string): NormalizedDocument {
  const newline = content.includes('\r\n') ? '\r\n' : '\n';
  return {
    lines: content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n'),
    newline,
  };
}

function renderDocument(document: NormalizedDocument, lines: string[]): string {
  const rendered = lines.join(document.newline);
  return rendered;
}

function lineIsHeading(line: string): { level: number; heading: string } | null {
  const match = normalizeLine(line).match(HEADING_PATTERN);
  return match ? { level: match[1].length, heading: match[2] } : null;
}

function findHeadingLines(lines: readonly string[], heading: string): number[] {
  const matches: number[] = [];
  for (let index = 0; index < lines.length; index += 1) {
    if (normalizeLine(lines[index]).trimEnd() === heading) matches.push(index);
  }
  return matches;
}

function findSection(lines: readonly string[], descriptor: ProjectDocSectionDescriptor): SectionRange | null {
  const starts = findHeadingLines(lines, descriptor.heading);
  if (starts.length !== 1) return null;

  const start = starts[0];
  let end = lines.length;
  for (let index = start + 1; index < lines.length; index += 1) {
    const heading = lineIsHeading(lines[index]);
    if (heading && heading.level <= descriptor.level) {
      end = index;
      break;
    }
  }
  return { heading: descriptor.heading, level: descriptor.level, start, end };
}

function countHeadings(lines: readonly string[], headings: readonly ProjectDocSectionDescriptor[]): Record<string, number> {
  return Object.fromEntries(
    headings.map((descriptor) => [descriptor.heading, findHeadingLines(lines, descriptor.heading).length])
  );
}

function hasMeaningfulTopic(topic: string): boolean {
  const value = topic.trim();
  return value.length > 0 && !PLACEHOLDER_PATTERN.test(value) && !/^\[deferred:/iu.test(value);
}

/** Normalizes only identity syntax; the original learner text is preserved in output. */
export function normalizeFeedbackTopic(topic: string): string {
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

function issue(
  document: ProjectDocId,
  code: ProjectDocumentFeedbackIssue['code'],
  message: string,
  anchor?: string,
  line?: number
): ProjectDocumentFeedbackIssue {
  return { document, code, message, ...(anchor ? { anchor } : {}), ...(line !== undefined ? { line } : {}) };
}

function htmlCommentLines(lines: readonly string[]): boolean[] {
  const result: boolean[] = [];
  let inComment = false;
  for (const rawLine of lines) {
    const line = normalizeLine(rawLine);
    result.push(inComment || line.includes('<!--'));
    const opening = line.indexOf('<!--');
    const closing = line.indexOf('-->', opening === -1 ? 0 : opening + 4);
    if (!inComment && opening !== -1 && closing === -1) inComment = true;
    else if (inComment && closing !== -1) inComment = false;
  }
  return result;
}

function parseCandidateRecords(lines: readonly string[], section: SectionRange | null): {
  records: RoadmapCandidateRecord[];
  malformedLines: number[];
} {
  if (!section) return { records: [], malformedLines: [] };
  const records: RoadmapCandidateRecord[] = [];
  const malformedLines: number[] = [];
  const comments = htmlCommentLines(lines);
  for (let index = section.start + 1; index < section.end; index += 1) {
    if (comments[index]) continue;
    const line = normalizeLine(lines[index]);
    if (!line.includes('slice:')) continue;
    const match = line.match(ROADMAP_CANDIDATE_PATTERN);
    if (!match) {
      malformedLines.push(index);
      continue;
    }
    records.push({
      kind: 'candidate-slice',
      changeName: match[2].trim(),
      learningFocus: match[3].trim(),
      checked: match[1].toLowerCase() === 'x',
      line: index,
      raw: line,
    });
  }
  return { records, malformedLines };
}

function parseArchivedRecords(lines: readonly string[], section: SectionRange | null): {
  records: ArchivedRoadmapRecord[];
  malformedLines: number[];
} {
  if (!section) return { records: [], malformedLines: [] };
  const records: ArchivedRoadmapRecord[] = [];
  const malformedLines: number[] = [];
  const comments = htmlCommentLines(lines);
  for (let index = section.start + 1; index < section.end; index += 1) {
    if (comments[index]) continue;
    const line = normalizeLine(lines[index]);
    if (!line.includes('archived:')) continue;
    const match = line.match(ROADMAP_ARCHIVED_PATTERN);
    if (!match) {
      malformedLines.push(index);
      continue;
    }
    records.push({
      kind: 'archived-slice',
      changeName: match[2].trim(),
      outcome: match[3].trim(),
      checked: match[1].toLowerCase() === 'x',
      feedback: match[4] as 'pending' | 'complete',
      line: index,
      raw: line,
    });
  }
  return { records, malformedLines };
}

function parseLearnerRecords(lines: readonly string[], sections: readonly ProjectDocSectionDescriptor[]): {
  records: LearnerFeedbackRecord[];
  malformedLines: number[];
} {
  const records: LearnerFeedbackRecord[] = [];
  const malformedLines: number[] = [];
  const comments = htmlCommentLines(lines);
  const recordSections = new Map<LearnerFeedbackKind, ProjectDocSectionDescriptor>([
    ['gap', sections.find((section) => section.heading === '# 已暴露的知识缺口')!],
    ['mastered', sections.find((section) => section.heading === '# 已掌握内容')!],
    ['review', sections.find((section) => section.heading === '# 建议复习项')!],
  ]);

  for (const [kind, descriptor] of recordSections) {
    if (!descriptor) continue;
    const section = findSection(lines, descriptor);
    if (!section) continue;
    for (let index = section.start + 1; index < section.end; index += 1) {
      if (comments[index]) continue;
      const line = normalizeLine(lines[index]);
      if (!line.includes(`${kind}:`)) continue;
      const match = line.match(LEARNER_RECORD_PATTERN);
      if (!match || match[2] !== kind) {
        malformedLines.push(index);
        continue;
      }
      if (!hasMeaningfulTopic(match[3])) {
        if (!PLACEHOLDER_PATTERN.test(match[3].trim())) malformedLines.push(index);
        continue;
      }
      const topic = match[3].trim();
      records.push({
        kind,
        topic,
        normalizedTopic: normalizeFeedbackTopic(topic),
        checked: match[1].toLowerCase() === 'x',
        line: index,
        raw: line,
      });
    }
  }
  return { records, malformedLines };
}

function addDuplicateIssues(
  document: ProjectDocId,
  records: readonly { changeName?: string; normalizedTopic?: string; line?: number }[],
  label: string,
  issues: ProjectDocumentFeedbackIssue[]
): void {
  const seen = new Map<string, number>();
  for (const record of records) {
    const key = record.changeName ?? record.normalizedTopic;
    if (!key || PLACEHOLDER_PATTERN.test(key)) continue;
    const previous = seen.get(key);
    if (previous !== undefined) {
      issues.push(issue(document, 'ambiguous', `Duplicate ${label} anchor for ${JSON.stringify(key)}; choose one record before archiving.`, label, record.line));
    } else {
      seen.set(key, record.line ?? -1);
    }
  }
}

/**
 * Classifies one already-read registered document without scanning for
 * unregistered alternatives. A marker is never treated as sufficient: all
 * registered headings and record grammars are checked before the document is
 * considered valid.
 */
export function analyzeProjectDocument(
  id: ProjectDocId,
  content: string,
  documentPath = resolveProjectDocPath(process.cwd(), id)
): ProjectDocumentFeedbackAnalysis {
  const template = getProjectDocTemplate(id);
  const normalized = normalizeDocument(content);
  const issues: ProjectDocumentFeedbackIssue[] = [];
  const detected = detectHumanSpecDocType(content);
  const headings = countHeadings(normalized.lines, template.requiredHeadings);
  const candidates: RoadmapCandidateRecord[] = [];
  const archivedRecords: ArchivedRoadmapRecord[] = [];
  const learnerRecords: LearnerFeedbackRecord[] = [];

  if (detected === null) {
    issues.push(issue(id, 'unmarked', `Registered document ${documentPath} has no ${template.markerType} frontmatter marker.`));
    return {
      id,
      path: documentPath,
      status: 'unmarked',
      content,
      lineEnding: normalized.newline,
      requiredHeadings: template.requiredHeadings,
      issues,
      headings,
      candidates,
      archivedRecords,
      learnerRecords,
    };
  }

  if (detected !== id) {
    issues.push(issue(id, 'conflict', `Registered ${id} document is marked as ${detected}, not ${id}.`));
  }

  for (const descriptor of template.requiredHeadings) {
    const count = headings[descriptor.heading] ?? 0;
    if (count === 0) {
      issues.push(issue(id, 'malformed', `Required heading ${descriptor.heading} is missing.`, descriptor.heading));
    } else if (count > 1) {
      issues.push(issue(id, 'duplicated', `Required heading ${descriptor.heading} appears ${count} times; section boundaries are ambiguous.`, descriptor.heading));
    }
  }

  if (id === 'roadmap') {
    const candidateDescriptor = template.feedback?.candidateSlice.sectionHeading ?? '# 候选切片';
    const candidateSection = findSection(normalized.lines, {
      id: 'candidate-slices',
      heading: candidateDescriptor,
      level: 1,
    });
    const parsedCandidates = parseCandidateRecords(normalized.lines, candidateSection);
    candidates.push(...parsedCandidates.records);
    for (const line of parsedCandidates.malformedLines) {
      issues.push(issue(id, 'malformed', 'A roadmap entry mentions slice: but does not match the registered candidate grammar.', candidateDescriptor, line));
    }
    addDuplicateIssues(id, candidates, 'candidate slice', issues);

    const archiveHeading = template.feedback?.archiveSection.heading ?? '# 已归档切片';
    const archiveStarts = findHeadingLines(normalized.lines, archiveHeading);
    if (archiveStarts.length > 1) {
      issues.push(issue(id, 'duplicated', `Archive section ${archiveHeading} appears ${archiveStarts.length} times; feedback cannot choose a section.`, archiveHeading));
    }
    const archiveSection = archiveStarts.length === 1
      ? findSection(normalized.lines, { id: 'archived-slices', heading: archiveHeading, level: 1 })
      : null;
    const parsedArchived = parseArchivedRecords(normalized.lines, archiveSection);
    archivedRecords.push(...parsedArchived.records);
    for (const line of parsedArchived.malformedLines) {
      issues.push(issue(id, 'malformed', 'An archived roadmap entry mentions archived: but does not match the registered archive grammar.', archiveHeading, line));
    }
    addDuplicateIssues(id, archivedRecords, 'archived slice', issues);
  }

  if (id === 'learner') {
    const parsedLearner = parseLearnerRecords(normalized.lines, template.requiredHeadings);
    learnerRecords.push(...parsedLearner.records);
    for (const line of parsedLearner.malformedLines) {
      issues.push(issue(id, 'malformed', 'A learner feedback entry does not match the registered gap/mastered/review grammar.', '# 已暴露的知识缺口', line));
    }
    const seen = new Map<string, LearnerFeedbackRecord>();
    for (const record of learnerRecords) {
      const key = `${record.kind}:${record.normalizedTopic}`;
      const previous = seen.get(key);
      if (previous) {
        issues.push(issue(id, 'duplicated', `Duplicate ${record.kind} topic ${JSON.stringify(record.topic)}; feedback will not guess which record to keep.`, record.kind, record.line));
      } else {
        seen.set(key, record);
      }
    }
  }

  return {
    id,
    path: documentPath,
    status: issues.length === 0 ? 'valid' : 'malformed',
    content,
    lineEnding: normalized.newline,
    requiredHeadings: template.requiredHeadings,
    issues,
    headings,
    candidates,
    archivedRecords,
    learnerRecords,
  };
}

/** Resolves the three registered paths using the selected project root. */
function resolveFeedbackRoot(projectRoot: string): string {
  // `path.resolve()` is the native resolver for real project roots. The
  // win32 check keeps drive-letter roots deterministic in cross-platform unit
  // tests that model a Windows path while running on POSIX.
  if (path.isAbsolute(projectRoot) || path.win32.isAbsolute(projectRoot)) return projectRoot;
  return path.resolve(projectRoot);
}

function resolveFeedbackDocumentPath(projectRoot: string, id: ProjectDocId): string {
  const template = getProjectDocTemplate(id);
  if (path.win32.isAbsolute(projectRoot) && !path.isAbsolute(projectRoot)) {
    return path.win32.join(projectRoot, 'openspec', template.fileName);
  }
  return resolveProjectDocPath(projectRoot, id);
}

export function resolveProjectDocumentPaths(projectRoot: string): Record<ProjectDocId, string> {
  const root = resolveFeedbackRoot(projectRoot);
  return {
    project: resolveFeedbackDocumentPath(root, 'project'),
    roadmap: resolveFeedbackDocumentPath(root, 'roadmap'),
    learner: resolveFeedbackDocumentPath(root, 'learner'),
  };
}

export async function readProjectDocumentFeedbackContext(
  projectRoot: string,
  documents?: ArchiveFeedbackPlanInput['documents']
): Promise<{
  analyses: Partial<Record<ProjectDocId, ProjectDocumentFeedbackAnalysis>>;
  issues: ProjectDocumentFeedbackIssue[];
}> {
  const paths = resolveProjectDocumentPaths(projectRoot);
  const analyses: Partial<Record<ProjectDocId, ProjectDocumentFeedbackAnalysis>> = {};
  const issues: ProjectDocumentFeedbackIssue[] = [];

  for (const id of ['project', 'roadmap', 'learner'] as const) {
    const supplied = documents?.[id];
    const documentPath = typeof supplied === 'object' && supplied?.path
      ? supplied.path
      : paths[id];
    let content: string;
    if (typeof supplied === 'string') {
      content = supplied;
    } else if (supplied && typeof supplied === 'object') {
      content = supplied.content;
    } else {
      try {
        content = await fs.readFile(documentPath, 'utf8');
      } catch (error) {
        const code = (error as NodeJS.ErrnoException).code;
        const missing = code === 'ENOENT' || code === 'ENOTDIR';
        const documentIssue = issue(
          id,
          missing ? 'missing' : 'unreadable',
          missing
            ? `Registered ${id} document is missing at ${documentPath}.`
            : `Registered ${id} document could not be read at ${documentPath}: ${String(error)}.`
        );
        const template = getProjectDocTemplate(id);
        analyses[id] = {
          id,
          path: documentPath,
          status: missing ? 'missing' : 'unreadable',
          lineEnding: '\n',
          requiredHeadings: template.requiredHeadings,
          issues: [documentIssue],
          headings: {},
          candidates: [],
          archivedRecords: [],
          learnerRecords: [],
        };
        issues.push(documentIssue);
        continue;
      }
    }
    const analysis = analyzeProjectDocument(id, content, documentPath);
    analyses[id] = analysis;
    issues.push(...analysis.issues);
  }

  return { analyses, issues };
}

function explicitRecordsFromVerification(content: string): Partial<Record<LearnerFeedbackKind, string[]>> {
  const result: Partial<Record<LearnerFeedbackKind, string[]>> = {};
  let currentKind: LearnerFeedbackKind | null = null;
  for (const rawLine of content.split(/\r?\n/u)) {
    const line = rawLine.trim();
    const heading = line.match(/^#{2,4}\s+(?:verified\s+)?(mastered|gaps?|review(?:\s+items?)?)/iu);
    if (heading) {
      const value = heading[1].toLocaleLowerCase();
      currentKind = value.startsWith('mastered') ? 'mastered' : value.startsWith('gap') ? 'gap' : 'review';
      result[currentKind] ??= [];
      continue;
    }
    // A different verification subsection ends an explicit topic list. This
    // prevents bullets such as blocking findings or contract evidence from
    // being mistaken for mastery records.
    if (/^#{2,4}\s+/u.test(line)) {
      currentKind = null;
      continue;
    }
    const labelled = line.match(/^[-*]\s*(gap|mastered|review|knowledge\s+gap|review\s+item)s?\s*:\s*(.+)$/iu);
    if (labelled) {
      const label = labelled[1].toLocaleLowerCase();
      const kind: LearnerFeedbackKind = label.startsWith('mastered')
        ? 'mastered'
        : label.startsWith('gap') || label.startsWith('knowledge')
          ? 'gap'
          : 'review';
      result[kind] ??= [];
      result[kind]!.push(labelled[2].trim());
      continue;
    }
    if (currentKind && /^[-*]\s+/.test(line)) {
      const value = line.replace(/^[-*]\s+/u, '').trim();
      if (value) {
        result[currentKind] ??= [];
        result[currentKind]!.push(value);
      }
    }
  }
  return result;
}

function assessmentFromVerificationRecord(content: string | undefined): string | undefined {
  if (!content) return undefined;
  const match = content.match(/(?:learning-result assessment|learning assessment)\s*:\s*([^\r\n]+)/iu);
  return match?.[1]?.trim();
}

function assessmentIsLearningComplete(assessment: string | undefined): boolean {
  if (!assessment) return true;
  return /learning\s+complete(?!\s*incomplete)/iu.test(assessment)
    && !/learning\s+incomplete/iu.test(assessment)
    && !/inconclusive/iu.test(assessment);
}

function asEvidence(value: LearnerFeedbackEvidence | undefined): LearnerFeedbackEvidence {
  if (!value) return {};
  if (typeof value.latestVerification === 'object' && value.latestVerification !== null) {
    return {
      ...value,
      mastered: [...(value.mastered ?? []), ...(value.latestVerification.mastered ?? []), ...(value.latestVerification.masteredTopics ?? [])],
      masteredTopics: [...(value.masteredTopics ?? []), ...(value.latestVerification.masteredTopics ?? [])],
      gaps: [...(value.gaps ?? []), ...(value.latestVerification.gaps ?? []), ...(value.latestVerification.knowledgeGaps ?? [])],
      knowledgeGaps: [...(value.knowledgeGaps ?? []), ...(value.latestVerification.knowledgeGaps ?? [])],
      review: [...(value.review ?? []), ...(value.latestVerification.review ?? []), ...(value.latestVerification.reviewItems ?? [])],
      reviewItems: [...(value.reviewItems ?? []), ...(value.latestVerification.reviewItems ?? [])],
      learningAssessment: value.learningAssessment ?? value.latestVerification.learningAssessment ?? value.latestVerification.learningResultAssessment,
    };
  }
  if (typeof value.latestVerification === 'string') {
    const verificationRecord = [value.verificationRecord ?? '', value.latestVerification].filter(Boolean).join('\n');
    return {
      ...value,
      verificationRecord,
      learningAssessment: value.learningAssessment
        ?? value.learningResultAssessment
        ?? assessmentFromVerificationRecord(verificationRecord),
    };
  }
  return value;
}

/**
 * Builds learner records only from explicit evidence. Free-form reflection is
 * intentionally not mined for mastery: a passing check alone is not proof of
 * learning, and archive never rewrites reflection sections.
 */
export function proposeLearnerFeedbackRecords(
  evidenceInput: LearnerFeedbackEvidence = {},
  existingRecords: readonly LearnerFeedbackRecord[] = []
): LearnerFeedbackProposal {
  const evidence = asEvidence(evidenceInput);
  const extracted = evidence.verificationRecord
    ? explicitRecordsFromVerification(evidence.verificationRecord)
    : {};
  const assessment = evidence.learningAssessment
    ?? evidence.learningResultAssessment
    ?? assessmentFromVerificationRecord(evidence.verificationRecord);
  const candidates: Array<{ kind: LearnerFeedbackKind; topic: string }> = [
    ...((evidence.gaps ?? []).concat(evidence.knowledgeGaps ?? [], extracted.gap ?? [])).map((topic) => ({ kind: 'gap' as const, topic })),
    ...((evidence.review ?? []).concat(evidence.reviewItems ?? [], extracted.review ?? [])).map((topic) => ({ kind: 'review' as const, topic })),
  ];
  if (assessment !== undefined
    ? assessmentIsLearningComplete(assessment)
    : !evidence.verificationRecord) {
    candidates.push(
      ...((evidence.mastered ?? []).concat(evidence.masteredTopics ?? [], extracted.mastered ?? [])).map((topic) => ({ kind: 'mastered' as const, topic }))
    );
  }

  const records: LearnerFeedbackRecord[] = [];
  const duplicates: LearnerFeedbackRecord[] = [];
  const conflicts: ProjectDocumentFeedbackIssue[] = [];
  const seen = new Map<string, LearnerFeedbackRecord>();
  for (const candidate of candidates) {
    if (!hasMeaningfulTopic(candidate.topic)) continue;
    const topic = candidate.topic.trim();
    const normalizedTopic = normalizeFeedbackTopic(topic);
    const key = `${candidate.kind}:${normalizedTopic}`;
    const existing = existingRecords.find(
      (record) => record.kind === candidate.kind && record.normalizedTopic === normalizedTopic
    );
    const prior = seen.get(key);
    if (existing || prior) {
      duplicates.push(existing ?? prior!);
      continue;
    }
    const opposite = candidate.kind === 'mastered' ? 'gap' : candidate.kind === 'gap' ? 'mastered' : null;
    if (opposite && (existingRecords.some((record) => record.kind === opposite && record.normalizedTopic === normalizedTopic)
      || [...seen.values()].some((record) => record.kind === opposite && record.normalizedTopic === normalizedTopic))) {
      conflicts.push(issue('learner', 'conflict', `Topic ${JSON.stringify(topic)} is proposed as both ${candidate.kind} and ${opposite}; resolve the learner record manually.`, candidate.kind));
      continue;
    }
    const record: LearnerFeedbackRecord = {
      kind: candidate.kind,
      topic,
      normalizedTopic,
      checked: false,
    };
    records.push(record);
    seen.set(key, record);
  }
  return { records, duplicates, conflicts };
}

function recordLine(record: LearnerFeedbackRecord): string {
  return `- [ ] ${record.kind}: ${record.topic}`;
}

function appendToSection(content: string, descriptor: ProjectDocSectionDescriptor, additions: readonly string[]): string {
  if (additions.length === 0) return content;
  const document = normalizeDocument(content);
  const section = findSection(document.lines, descriptor);
  if (!section) return content;
  const insertion = section.end > section.start && document.lines[section.end - 1] === ''
    ? section.end - 1
    : section.end;
  document.lines.splice(insertion, 0, ...additions);
  return renderDocument(document, document.lines);
}

function removeCandidateLine(content: string, candidate: RoadmapCandidateRecord | undefined): string {
  if (!candidate) return content;
  const document = normalizeDocument(content);
  if (candidate.line < 0 || candidate.line >= document.lines.length) return content;
  const current = normalizeLine(document.lines[candidate.line]);
  const parsed = current.match(ROADMAP_CANDIDATE_PATTERN);
  if (!parsed || parsed[2].trim() !== candidate.changeName) return content;
  document.lines.splice(candidate.line, 1);
  return renderDocument(document, document.lines);
}

function createArchiveSection(content: string, record: string): string {
  const document = normalizeDocument(content);
  const hadFinalNewline = content.endsWith('\n') || content.endsWith('\r');
  const prefix = document.lines.length > 0 && document.lines[document.lines.length - 1] !== '' ? ['', ''] : [''];
  const addition = ['# 已归档切片', '', record];
  document.lines.splice(document.lines.length - (hadFinalNewline ? 1 : 0), 0, ...prefix, ...addition);
  if (hadFinalNewline && document.lines[document.lines.length - 1] !== '') document.lines.push('');
  return renderDocument(document, document.lines);
}

function replaceArchiveRecordState(content: string, record: ArchivedRoadmapRecord, state: 'pending' | 'complete'): string {
  const document = normalizeDocument(content);
  if (record.line < 0 || record.line >= document.lines.length) return content;
  const current = normalizeLine(document.lines[record.line]);
  const match = current.match(ROADMAP_ARCHIVED_PATTERN);
  if (!match || match[2].trim() !== record.changeName) return content;
  document.lines[record.line] = `${current.replace(/\(feedback:\s*(pending|complete)\)\s*$/u, `(feedback: ${state})`)}`;
  return renderDocument(document, document.lines);
}

function ensureArchiveRecord(content: string, recordLineText: string): string {
  const document = normalizeDocument(content);
  const template = getProjectDocTemplate('roadmap');
  const descriptor = template.feedback!.archiveSection;
  const section = findSection(document.lines, descriptor);
  if (!section) return createArchiveSection(content, recordLineText);
  const insertion = section.end > section.start && document.lines[section.end - 1] === ''
    ? section.end - 1
    : section.end;
  document.lines.splice(insertion, 0, recordLineText);
  return renderDocument(document, document.lines);
}

function archiveRecordLine(changeName: string, outcome: string, state: 'pending' | 'complete'): string {
  const safeChange = changeName.replace(/[\r\n]/gu, ' ').trim();
  const safeOutcome = outcome.replace(/[\r\n]/gu, ' ').trim() || 'incomplete';
  return `- [x] archived: ${safeChange} — ${safeOutcome} (feedback: ${state})`;
}

/**
 * Plans one archive feedback update. It performs no writes and refuses to
 * select a section or record when the registered structure is ambiguous.
 */
export async function planArchiveFeedback(input: ArchiveFeedbackPlanInput): Promise<ArchiveFeedbackPlan> {
  const projectRoot = input.projectRoot ?? process.cwd();
  const suppliedDocuments = {
    ...(input.documents ?? {}),
    ...(input.projectContent !== undefined ? { project: input.projectContent } : {}),
    ...(input.roadmapContent !== undefined ? { roadmap: input.roadmapContent } : {}),
    ...(input.learnerContent !== undefined ? { learner: input.learnerContent } : {}),
  };
  let archivedLearningContent = input.archivedLearningContent;
  let archivedLearningError: unknown;
  if (archivedLearningContent === undefined && input.archivedPath) {
    const archivedLearningPath = path.basename(input.archivedPath) === 'learning.md'
      ? input.archivedPath
      : path.join(input.archivedPath, 'learning.md');
    try {
      archivedLearningContent = await fs.readFile(archivedLearningPath, 'utf8');
    } catch (error) {
      archivedLearningError = error;
    }
  }
  const context = await readProjectDocumentFeedbackContext(projectRoot, suppliedDocuments);
  const issues = [...context.issues];
  if (archivedLearningError) {
    issues.push(issue(
      'learner',
      'unreadable',
      `Archived learning evidence could not be read from ${input.archivedPath}: ${String(archivedLearningError)}`
    ));
  }
  const documents: Partial<Record<ProjectDocId, ArchiveFeedbackDocumentPlan>> = {};
  const verificationRecords = [
    input.evidence?.verificationRecord,
    input.learningEvidence?.verificationRecord,
    input.verificationRecord,
    archivedLearningContent,
  ].filter((record): record is string => Boolean(record));
  const inputEvidence = {
    ...(input.evidence ?? {}),
    ...(input.learningEvidence ?? {}),
    ...(verificationRecords.length > 0 ? { verificationRecord: verificationRecords.join('\n') } : {}),
  };
  const analyses = context.analyses;
  const roadmap = analyses.roadmap;
  const learner = analyses.learner;
  const planAssessment = inputEvidence.learningAssessment
    ?? inputEvidence.learningResultAssessment
    ?? assessmentFromVerificationRecord(inputEvidence.verificationRecord);
  const hasExplicitLearningEvidence = Object.keys(inputEvidence).length > 0;
  const defaultComplete = planAssessment !== undefined
    ? assessmentIsLearningComplete(planAssessment)
    : hasExplicitLearningEvidence && !inputEvidence.verificationRecord;
  const archivedOutcome = (input.milestoneOutcome ?? input.outcome ?? (
    defaultComplete ? 'complete' : 'incomplete'
  )).replace(/[\r\n]/gu, ' ').trim() || 'incomplete';

  if (issues.length > 0 || !roadmap || !learner || roadmap.content === undefined || learner.content === undefined) {
    return {
      changeName: input.changeName,
      status: 'blocked',
      ready: false,
      alreadyApplied: false,
      issues,
      documents,
      analyses,
      learnerRecords: [],
      duplicateLearnerRecords: [],
      archivedOutcome,
      feedbackState: 'pending',
    };
  }

  const matchingArchived = roadmap.archivedRecords.filter((record) => record.changeName === input.changeName);
  if (matchingArchived.length > 1) {
    issues.push(issue('roadmap', 'ambiguous', `Multiple archived feedback records match ${JSON.stringify(input.changeName)}.`,'# 已归档切片'));
  }
  const matchingCandidates = roadmap.candidates.filter((record) => record.changeName === input.changeName);
  if (matchingCandidates.length > 1) {
    issues.push(issue('roadmap', 'ambiguous', `Multiple candidate slices match ${JSON.stringify(input.changeName)}; no exact line can be selected.`, '# 候选切片'));
  }
  if (issues.length > context.issues.length) {
    return {
      changeName: input.changeName,
      status: 'blocked',
      ready: false,
      alreadyApplied: false,
      issues,
      documents,
      analyses,
      learnerRecords: [],
      duplicateLearnerRecords: [],
      archivedOutcome,
      feedbackState: 'pending',
    };
  }

  const existingArchived = matchingArchived[0];
  const roadmapPending = existingArchived
    ? roadmap.content
    : ensureArchiveRecord(
      removeCandidateLine(roadmap.content, matchingCandidates[0]),
      archiveRecordLine(input.changeName, archivedOutcome, 'pending')
    );
  const pendingArchived = existingArchived ?? {
    kind: 'archived-slice' as const,
    changeName: input.changeName,
    outcome: archivedOutcome,
    feedback: 'pending' as const,
    checked: true,
    line: -1,
    raw: archiveRecordLine(input.changeName, archivedOutcome, 'pending'),
  };

  const existingLearnerRecords = learner.learnerRecords;
  const proposal = proposeLearnerFeedbackRecords(inputEvidence, existingLearnerRecords);
  issues.push(...proposal.conflicts);
  if (proposal.conflicts.length > 0) {
    return {
      changeName: input.changeName,
      status: 'blocked',
      ready: false,
      alreadyApplied: false,
      issues,
      documents,
      analyses,
      archivedRecord: existingArchived,
      learnerRecords: proposal.records,
      duplicateLearnerRecords: proposal.duplicates,
      archivedOutcome,
      feedbackState: 'pending',
    };
  }

  if (existingArchived?.feedback === 'complete' && proposal.records.length === 0) {
    return {
      changeName: input.changeName,
      status: 'already-applied',
      ready: true,
      alreadyApplied: true,
      issues,
      documents,
      analyses,
      archivedRecord: existingArchived,
      learnerRecords: [],
      duplicateLearnerRecords: proposal.duplicates,
      archivedOutcome: existingArchived.outcome,
      feedbackState: 'complete',
    };
  }

  const learnerContent = appendToLearnerSections(learner.content, proposal.records);
  const roadmapComplete = replaceArchiveRecordState(
    roadmapPending,
    existingArchived ?? {
      ...pendingArchived,
      line: findArchivedRecordLine(roadmapPending, input.changeName),
      raw: archiveRecordLine(input.changeName, archivedOutcome, 'pending'),
    },
    'complete'
  );
  documents.roadmap = {
    id: 'roadmap',
    path: roadmap.path,
    before: roadmap.content,
    pendingContent: roadmapPending,
    completeContent: roadmapComplete,
    changed: roadmapPending !== roadmap.content || roadmapComplete !== roadmapPending,
  };
  documents.learner = {
    id: 'learner',
    path: learner.path,
    before: learner.content,
    proposedContent: learnerContent,
    changed: learnerContent !== learner.content,
  };

  return {
    changeName: input.changeName,
    status: 'ready',
    ready: true,
    alreadyApplied: false,
    issues,
    documents,
    analyses,
    archivedRecord: existingArchived,
    learnerRecords: proposal.records,
    duplicateLearnerRecords: proposal.duplicates,
    archivedOutcome,
    feedbackState: 'pending',
  };
}

function findArchivedRecordLine(content: string, changeName: string): number {
  const document = normalizeDocument(content);
  for (let index = 0; index < document.lines.length; index += 1) {
    const match = normalizeLine(document.lines[index]).match(ROADMAP_ARCHIVED_PATTERN);
    if (match && match[2].trim() === changeName) return index;
  }
  return -1;
}

function appendToLearnerSections(content: string, records: readonly LearnerFeedbackRecord[]): string {
  let result = content;
  for (const kind of ['gap', 'mastered', 'review'] as const) {
    const additions = records.filter((record) => record.kind === kind).map(recordLine);
    if (additions.length === 0) continue;
    const descriptor: ProjectDocSectionDescriptor = {
      id: kind,
      heading: kind === 'gap' ? '# 已暴露的知识缺口' : kind === 'mastered' ? '# 已掌握内容' : '# 建议复习项',
      level: 1,
    };
    result = appendToSection(result, descriptor, additions);
  }
  return result;
}

async function defaultAtomicWrite(filePath: string, content: string): Promise<void> {
  const absolutePath = path.resolve(filePath);
  const directory = path.dirname(absolutePath);
  const temporaryPath = path.join(
    directory,
    `.${path.basename(absolutePath)}.${process.pid}.${Date.now()}.${Math.random().toString(36).slice(2)}.tmp`
  );
  try {
    await fs.writeFile(temporaryPath, content, 'utf8');
    await fs.rename(temporaryPath, absolutePath);
  } catch (error) {
    await fs.rm(temporaryPath, { force: true }).catch(() => undefined);
    throw error;
  }
}

async function writePlannedDocument(
  plan: ArchiveFeedbackDocumentPlan,
  content: string,
  atomicWrite: (filePath: string, content: string) => Promise<void>,
  writtenDocuments: ProjectDocId[],
  issues: ProjectDocumentFeedbackIssue[]
): Promise<boolean> {
  if (content === plan.before) return true;
  let current: string;
  try {
    current = await fs.readFile(plan.path, 'utf8');
  } catch (error) {
    issues.push(issue(plan.id, 'unreadable', `Cannot reconcile ${plan.id} before writing ${plan.path}: ${String(error)}.`));
    return false;
  }
  if (current !== plan.before) {
    issues.push(issue(plan.id, 'conflict', `The registered ${plan.id} document changed after planning; preserved the learner-authored edit.`, plan.path));
    return false;
  }
  try {
    await atomicWrite(plan.path, content);
    writtenDocuments.push(plan.id);
    return true;
  } catch (error) {
    issues.push(issue(plan.id, 'unreadable', `Atomic replacement of ${plan.path} failed: ${String(error)}.`, plan.path));
    return false;
  }
}

/** Applies the two-step pending/complete protocol without touching application files. */
export async function applyArchiveFeedback(
  plan: ArchiveFeedbackPlan,
  options: ArchiveFeedbackApplyOptions = {}
): Promise<ArchiveFeedbackApplyResult> {
  const writtenDocuments: ProjectDocId[] = [];
  const issues = [...plan.issues];
  if (plan.status === 'blocked' || !plan.ready) {
    return {
      status: 'blocked',
      feedbackState: 'pending',
      archivedChange: plan.changeName,
      writtenDocuments,
      pendingDocuments: ['roadmap', 'learner'],
      issues,
      reconciliationRequired: false,
      nextAction: 'Repair the reported project documents and re-run archive feedback.',
    };
  }
  if (plan.alreadyApplied || plan.status === 'already-applied') {
    return {
      status: 'already-applied',
      feedbackState: 'complete',
      archivedChange: plan.changeName,
      writtenDocuments,
      pendingDocuments: [],
      issues,
      reconciliationRequired: false,
      nextAction: 'Run /humanspec:next; no new change was created.',
    };
  }
  if (options.confirmed === false) {
    return {
      status: 'blocked',
      feedbackState: 'pending',
      archivedChange: plan.changeName,
      writtenDocuments: [],
      pendingDocuments: ['roadmap', 'learner'],
      issues,
      reconciliationRequired: false,
      nextAction: 'Feedback preview rejected; documents remain unchanged. Re-run the preview before reconciliation.',
    };
  }

  const roadmapPlan = plan.documents.roadmap;
  const learnerPlan = plan.documents.learner;
  if (!roadmapPlan || !learnerPlan || roadmapPlan.pendingContent === undefined || roadmapPlan.completeContent === undefined || learnerPlan.proposedContent === undefined) {
    const missing: ProjectDocId[] = [];
    if (!roadmapPlan) missing.push('roadmap');
    if (!learnerPlan) missing.push('learner');
    return {
      status: 'pending',
      feedbackState: 'pending',
      archivedChange: plan.changeName,
      writtenDocuments,
      pendingDocuments: missing.length > 0 ? missing : ['roadmap', 'learner'],
      issues: [...issues, issue('roadmap', 'malformed', 'Feedback plan has no complete registered document operations.')],
      reconciliationRequired: true,
      nextAction: 'Re-run archive feedback reconciliation against the archived outcome.',
    };
  }

  const atomicWrite = options.atomicWrite ?? defaultAtomicWrite;
  const roadmapPendingApplied = await writePlannedDocument(roadmapPlan, roadmapPlan.pendingContent, atomicWrite, writtenDocuments, issues);
  if (!roadmapPendingApplied) {
    return {
      status: issues.some((item) => item.code === 'conflict') ? 'conflict' : 'pending',
      feedbackState: 'pending',
      archivedChange: plan.changeName,
      writtenDocuments,
      pendingDocuments: ['roadmap', 'learner'],
      issues,
      reconciliationRequired: true,
      nextAction: 'Keep the archive path and repair or retry the roadmap feedback record before selecting new work.',
    };
  }

  const learnerApplied = await writePlannedDocument(learnerPlan, learnerPlan.proposedContent, atomicWrite, writtenDocuments, issues);
  if (!learnerApplied) {
    return {
      status: issues.some((item) => item.code === 'conflict') ? 'conflict' : 'pending',
      feedbackState: 'pending',
      archivedChange: plan.changeName,
      writtenDocuments,
      pendingDocuments: ['learner'],
      issues,
      reconciliationRequired: true,
      nextAction: 'Retry archive feedback reconciliation; the roadmap record remains feedback: pending.',
    };
  }

  const completePlan: ArchiveFeedbackDocumentPlan = {
    ...roadmapPlan,
    before: roadmapPlan.pendingContent,
  };
  const completeApplied = await writePlannedDocument(completePlan, roadmapPlan.completeContent, atomicWrite, writtenDocuments, issues);
  if (!completeApplied) {
    return {
      status: issues.some((item) => item.code === 'conflict') ? 'conflict' : 'pending',
      feedbackState: 'pending',
      archivedChange: plan.changeName,
      writtenDocuments,
      pendingDocuments: ['roadmap'],
      issues,
      reconciliationRequired: true,
      nextAction: 'Retry archive feedback reconciliation; the learner records are applied but the roadmap remains pending.',
    };
  }

  return {
    status: 'complete',
    feedbackState: 'complete',
    archivedChange: plan.changeName,
    writtenDocuments: [...new Set(writtenDocuments)],
    pendingDocuments: [],
    issues,
    reconciliationRequired: false,
    nextAction: 'Run /humanspec:next or /humanspec:propose; archive does not create the next change.',
  };
}

/** Re-plans and applies an already archived outcome; it never invokes archive. */
export async function reconcileArchiveFeedback(
  input: ArchiveFeedbackPlanInput,
  options: ArchiveFeedbackApplyOptions = {}
): Promise<ArchiveFeedbackApplyResult> {
  const plan = await planArchiveFeedback(input);
  return applyArchiveFeedback(plan, options);
}

/** Returns pending archived outcomes in a valid roadmap, in document order. */
export function findPendingArchiveFeedback(
  roadmapContent: string,
  documentPath = resolveProjectDocPath(process.cwd(), 'roadmap')
): ArchivedRoadmapRecord[] {
  const analysis = analyzeProjectDocument('roadmap', roadmapContent, documentPath);
  return analysis.archivedRecords.filter((record) => record.feedback === 'pending');
}

/**
 * Resolves the no-active-change portion of the next router from the same
 * registered grammars used by archive feedback. Pending feedback takes
 * precedence; otherwise unchecked candidates already represented in archive
 * history are excluded and the learner records are returned as routing
 * evidence.
 */
export function resolveNextRoadmapContext(
  roadmapContent: string,
  learnerContent: string,
  paths: { roadmapPath?: string; learnerPath?: string } = {}
): NextRoadmapContext {
  const roadmap = analyzeProjectDocument('roadmap', roadmapContent, paths.roadmapPath);
  const learner = analyzeProjectDocument('learner', learnerContent, paths.learnerPath);
  const issues = [...roadmap.issues, ...learner.issues];
  const archivedChangeNames = roadmap.archivedRecords.map((record) => record.changeName);
  const pendingFeedback = roadmap.archivedRecords.filter((record) => record.feedback === 'pending');

  if (issues.length > 0) {
    return {
      status: 'blocked',
      issues,
      candidates: [],
      archivedChangeNames,
      pendingFeedback,
      learnerRecords: learner.learnerRecords,
    };
  }
  if (pendingFeedback.length > 0) {
    return {
      status: 'reconciliation',
      issues,
      candidates: [],
      archivedChangeNames,
      pendingFeedback,
      learnerRecords: learner.learnerRecords,
    };
  }

  const archived = new Set(archivedChangeNames);
  const candidates = roadmap.candidates.filter(
    (candidate) => !candidate.checked
      && hasMeaningfulTopic(candidate.changeName)
      && hasMeaningfulTopic(candidate.learningFocus)
      && !archived.has(candidate.changeName)
  );
  return {
    status: candidates.length > 0 ? 'ready' : 'empty',
    issues,
    candidates,
    archivedChangeNames,
    pendingFeedback,
    learnerRecords: learner.learnerRecords,
  };
}

// Compatibility aliases make the planner discoverable from both the project-doc
// and archive-feedback vocabulary used by integrations.
export const classifyProjectDocument = analyzeProjectDocument;
export const validateProjectDocument = analyzeProjectDocument;
export const resolveRegisteredProjectDocuments = readProjectDocumentFeedbackContext;
export const createArchiveFeedbackPlan = planArchiveFeedback;
export const planProjectDocumentFeedback = planArchiveFeedback;
export const applyProjectDocumentFeedback = applyArchiveFeedback;
export const applyFeedbackPlan = applyArchiveFeedback;
export const reconcileProjectDocumentFeedback = reconcileArchiveFeedback;
export const reconcileFeedback = reconcileArchiveFeedback;
export const proposeLearnerRecords = proposeLearnerFeedbackRecords;

