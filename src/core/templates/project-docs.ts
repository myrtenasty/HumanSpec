import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * HumanSpec project context document registry.
 *
 * The HumanSpec learning loop is grounded in three project-level living
 * documents under the project's openspec/ directory: project.md (goals and
 * constraints), roadmap.md (milestones and candidate practice slices), and
 * learner.md (learner state). Their templates live in this package's
 * templates/project-docs/ directory and are registered here by name, so every
 * consumer (workflow templates, cleanup detection, tests) resolves them from
 * one constant list instead of hardcoding paths.
 *
 * The frontmatter `type:` marker each document carries doubles as the
 * recognition feature that keeps legacy-cleanup from reporting a HumanSpec
 * project.md as an obsolete upstream artifact.
 */

/**
 * Directory (relative to src/core/templates/) holding the project document
 * templates.
 */
export const PROJECT_DOC_TEMPLATES_DIR = 'project-docs';

export type ProjectDocId = 'project' | 'roadmap' | 'learner';

/** The stable lifecycle values accepted by roadmap milestone status records. */
export const ROADMAP_MILESTONE_STATUSES = ['planned', 'active', 'completed', 'paused'] as const;

export type RoadmapMilestoneStatus = typeof ROADMAP_MILESTONE_STATUSES[number];

/** A named heading that a registered project document must preserve. */
export interface ProjectDocSectionDescriptor {
  /** Stable name used by feedback planners and tests. */
  id: string;
  /** Exact Markdown heading, including its level marker. */
  heading: string;
  /** Heading level used when resolving the section body. */
  level: 1 | 2;
}

/** A named machine-readable record grammar in a registered document. */
export interface ProjectDocRecordDescriptor {
  /** Stable name used by feedback planners and tests. */
  id: string;
  /** Section heading that owns this record grammar. */
  sectionHeading: string;
  /** Literal record prefix, such as `slice:` or `mastered:`. */
  prefix: string;
  /** Human-readable record kind. */
  kind: 'candidate-slice' | 'archived-slice' | 'gap' | 'mastered' | 'review';
}

export interface RoadmapMilestoneStatusDescriptor {
  /** Stable name used by roadmap analysis and feedback plans. */
  id: 'milestone-status';
  /** Exact list-item prefix used inside each milestone section. */
  prefix: 'status:';
  /** The only lifecycle values accepted by the registered grammar. */
  values: readonly RoadmapMilestoneStatus[];
}

export interface ProjectDocFeedbackDescriptors {
  /** The optional section created after the first confirmed archive. */
  archiveSection: ProjectDocSectionDescriptor;
  /** The exact lifecycle grammar used by roadmap milestone sections. */
  milestoneStatus: RoadmapMilestoneStatusDescriptor;
  /** The roadmap candidate grammar used for exact change-name lookup. */
  candidateSlice: ProjectDocRecordDescriptor;
  /** The explicit pending-feedback state marker used during reconciliation. */
  pendingFeedback: {
    id: 'pending-feedback';
    marker: 'feedback: pending';
    completeMarker: 'feedback: complete';
  };
  /** The archived record grammar and its pending/complete state marker. */
  archivedSlice: ProjectDocRecordDescriptor & {
    pendingMarker: string;
    completeMarker: string;
  };
  /** The three learner-owned feedback record grammars. */
  learnerRecords: readonly [
    ProjectDocRecordDescriptor,
    ProjectDocRecordDescriptor,
    ProjectDocRecordDescriptor,
  ];
}

export interface ProjectDocTemplate {
  /** Stable identifier used by consumers and tests. */
  id: ProjectDocId;
  /** File name inside PROJECT_DOC_TEMPLATES_DIR. */
  fileName: string;
  /** Value of the frontmatter `type:` marker this document carries. */
  markerType: string;
  /** Required headings for structural validation. */
  requiredHeadings: readonly ProjectDocSectionDescriptor[];
  /** Registered archive-feedback anchors, when this document owns them. */
  feedback?: ProjectDocFeedbackDescriptors;
}

const PROJECT_SECTIONS = {
  project: [
    { id: 'project-goal', heading: '# 项目目标', level: 1 },
    { id: 'target-users', heading: '# 目标用户', level: 1 },
    { id: 'technology-stack', heading: '# 技术栈', level: 1 },
    { id: 'constraints', heading: '# 约束', level: 1 },
    { id: 'completion-criteria', heading: '# 完成标准', level: 1 },
  ],
  roadmap: [
    { id: 'milestones', heading: '# 里程碑', level: 1 },
    { id: 'milestone-1', heading: '## 里程碑 1', level: 2 },
    { id: 'candidate-slices', heading: '# 候选切片', level: 1 },
  ],
  learner: [
    { id: 'experience', heading: '# 已有经验', level: 1 },
    { id: 'learning-goals', heading: '# 学习目标', level: 1 },
    { id: 'session-budget', heading: '# 单次时间预算', level: 1 },
    { id: 'hint-preference', heading: '# 提示偏好', level: 1 },
    { id: 'knowledge-gaps', heading: '# 已暴露的知识缺口', level: 1 },
    { id: 'mastered-topics', heading: '# 已掌握内容', level: 1 },
    { id: 'review-items', heading: '# 建议复习项', level: 1 },
  ],
} as const satisfies Record<ProjectDocId, readonly ProjectDocSectionDescriptor[]>;

const ROADMAP_FEEDBACK: ProjectDocFeedbackDescriptors = {
  archiveSection: { id: 'archived-slices', heading: '# 已归档切片', level: 1 },
  milestoneStatus: {
    id: 'milestone-status',
    prefix: 'status:',
    values: ROADMAP_MILESTONE_STATUSES,
  },
  candidateSlice: {
    id: 'candidate-slice',
    sectionHeading: '# 候选切片',
    prefix: 'slice:',
    kind: 'candidate-slice',
  },
  pendingFeedback: {
    id: 'pending-feedback',
    marker: 'feedback: pending',
    completeMarker: 'feedback: complete',
  },
  archivedSlice: {
    id: 'archived-slice',
    sectionHeading: '# 已归档切片',
    prefix: 'archived:',
    kind: 'archived-slice',
    pendingMarker: 'feedback: pending',
    completeMarker: 'feedback: complete',
  },
  learnerRecords: [
    {
      id: 'knowledge-gap',
      sectionHeading: '# 已暴露的知识缺口',
      prefix: 'gap:',
      kind: 'gap',
    },
    {
      id: 'mastered-topic',
      sectionHeading: '# 已掌握内容',
      prefix: 'mastered:',
      kind: 'mastered',
    },
    {
      id: 'review-item',
      sectionHeading: '# 建议复习项',
      prefix: 'review:',
      kind: 'review',
    },
  ],
};

/**
 * The three HumanSpec project context documents, registered by name.
 * Template files live under templates/project-docs/<fileName>.
 *
 * Feedback anchors are part of the registry rather than free-form workflow
 * text so every consumer resolves the same logical sections and record
 * grammar. The archive section is deliberately optional in the initial
 * roadmap template: it is created only after a learner confirms feedback.
 */
export const PROJECT_DOC_TEMPLATES: readonly ProjectDocTemplate[] = [
  {
    id: 'project',
    fileName: 'project.md',
    markerType: 'humanspec-project',
    requiredHeadings: PROJECT_SECTIONS.project,
  },
  {
    id: 'roadmap',
    fileName: 'roadmap.md',
    markerType: 'humanspec-roadmap',
    requiredHeadings: PROJECT_SECTIONS.roadmap,
    feedback: ROADMAP_FEEDBACK,
  },
  {
    id: 'learner',
    fileName: 'learner.md',
    markerType: 'humanspec-learner',
    requiredHeadings: PROJECT_SECTIONS.learner,
    feedback: ROADMAP_FEEDBACK,
  },
] as const;

/** Stable aliases for callers that want the named feedback descriptors. */
export const PROJECT_DOC_FEEDBACK_DESCRIPTORS = {
  roadmap: {
    archiveSection: ROADMAP_FEEDBACK.archiveSection,
    milestoneStatus: ROADMAP_FEEDBACK.milestoneStatus,
    candidateSlice: ROADMAP_FEEDBACK.candidateSlice,
    pendingFeedback: ROADMAP_FEEDBACK.pendingFeedback,
    archivedSlice: ROADMAP_FEEDBACK.archivedSlice,
  },
  learner: {
    records: ROADMAP_FEEDBACK.learnerRecords,
    learnerRecords: ROADMAP_FEEDBACK.learnerRecords,
    gap: ROADMAP_FEEDBACK.learnerRecords[0],
    mastered: ROADMAP_FEEDBACK.learnerRecords[1],
    review: ROADMAP_FEEDBACK.learnerRecords[2],
  },
} as const;

export const ROADMAP_ARCHIVE_SECTION = ROADMAP_FEEDBACK.archiveSection;
export const ROADMAP_MILESTONE_STATUS = ROADMAP_FEEDBACK.milestoneStatus;
export const ROADMAP_CANDIDATE_SLICE = ROADMAP_FEEDBACK.candidateSlice;
export const ROADMAP_PENDING_FEEDBACK = ROADMAP_FEEDBACK.pendingFeedback;
export const ROADMAP_ARCHIVED_SLICE = ROADMAP_FEEDBACK.archivedSlice;
export const LEARNER_FEEDBACK_RECORDS = ROADMAP_FEEDBACK.learnerRecords;
export const LEARNER_GAP_RECORD = ROADMAP_FEEDBACK.learnerRecords[0];
export const LEARNER_MASTERED_RECORD = ROADMAP_FEEDBACK.learnerRecords[1];
export const LEARNER_REVIEW_RECORD = ROADMAP_FEEDBACK.learnerRecords[2];

/**
 * Looks up a registered project context document by its stable id.
 */
export function getProjectDocTemplate(id: ProjectDocId): ProjectDocTemplate {
  const template = PROJECT_DOC_TEMPLATES.find((candidate) => candidate.id === id);
  if (!template) {
    throw new Error(`Unknown HumanSpec project document id: ${id}`);
  }
  return template;
}

/** A registered runtime asset was absent from the current package build. */
export class ProjectDocTemplateAssetError extends Error {
  readonly id: ProjectDocId;
  readonly assetPath: string;

  constructor(id: ProjectDocId, assetPath: string, cause?: unknown) {
    super(`Registered HumanSpec ${id} template asset is unavailable at ${assetPath}.`);
    this.name = 'ProjectDocTemplateAssetError';
    this.id = id;
    this.assetPath = assetPath;
    if (cause !== undefined) {
      (this as Error & { cause?: unknown }).cause = cause;
    }
  }
}

/**
 * Resolves one explicitly registered template beside this runtime module.
 * The build copies these named files to the matching dist directory; this
 * deliberately never falls back to discovery or an unrelated source tree.
 */
export function resolveProjectDocTemplateAssetPath(id: ProjectDocId): string {
  const moduleDirectory = path.dirname(fileURLToPath(import.meta.url));
  return path.join(moduleDirectory, PROJECT_DOC_TEMPLATES_DIR, getProjectDocTemplate(id).fileName);
}

/** Reads the exact bytes of an explicitly registered template asset. */
export async function readProjectDocTemplateBytes(id: ProjectDocId): Promise<Buffer> {
  const assetPath = resolveProjectDocTemplateAssetPath(id);
  try {
    return await fs.readFile(assetPath);
  } catch (error) {
    throw new ProjectDocTemplateAssetError(id, assetPath, error);
  }
}

/** Reads one explicitly registered UTF-8 project-document template. */
export async function readProjectDocTemplate(id: ProjectDocId): Promise<string> {
  return (await readProjectDocTemplateBytes(id)).toString('utf8');
}

/**
 * Resolves a registered context document beneath a project's openspec directory.
 *
 * @param projectRoot - Root directory of the target project
 * @param id - Stable registered document id
 * @returns Platform-appropriate absolute or project-relative path, matching projectRoot
 */
export function resolveProjectDocPath(projectRoot: string, id: ProjectDocId): string {
  return path.join(projectRoot, 'openspec', getProjectDocTemplate(id).fileName);
}

function normalizeLineEnding(line: string): string {
  return line.endsWith('\r') ? line.slice(0, -1) : line;
}

/**
 * Extracts a document's leading YAML frontmatter block.
 *
 * The block starts at a first line that is exactly `---` and ends at the next
 * line that is exactly `---`. Returns the block content (without the fence
 * lines), or null when the document has no well-formed frontmatter block.
 *
 * @param content - Full document content
 * @returns The frontmatter block text, or null when absent
 */
export function extractFrontmatterBlock(content: string): string | null {
  const openingLineEnd = content.indexOf('\n');
  if (openingLineEnd === -1 || normalizeLineEnding(content.slice(0, openingLineEnd)) !== '---') {
    return null;
  }

  const frontmatterStart = openingLineEnd + 1;
  let lineStart = frontmatterStart;
  while (lineStart <= content.length) {
    const lineEnd = content.indexOf('\n', lineStart);
    const end = lineEnd === -1 ? content.length : lineEnd;
    if (normalizeLineEnding(content.slice(lineStart, end)) === '---') {
      const frontmatterEnd = lineStart > frontmatterStart && content[lineStart - 1] === '\n'
        ? lineStart - 1
        : lineStart;
      return content.slice(frontmatterStart, frontmatterEnd);
    }
    if (lineEnd === -1) {
      break;
    }
    lineStart = lineEnd + 1;
  }
  return null;
}

/**
 * Detects whether a document is a HumanSpec project context document and, if
 * so, which one.
 *
 * Reads only the leading frontmatter block and compares each `type:` line
 * explicitly against the registered marker values (no free-text scanning of
 * the document body, no regex).
 *
 * @param content - Full document content
 * @returns The matching template id ('project' | 'roadmap' | 'learner'), or
 *   null when the document carries no registered HumanSpec marker
 */
export function detectHumanSpecDocType(content: string): ProjectDocId | null {
  const frontmatter = extractFrontmatterBlock(content);
  if (frontmatter === null) {
    return null;
  }
  for (const line of frontmatter.split('\n')) {
    const normalizedLine = normalizeLineEnding(line);
    for (const template of PROJECT_DOC_TEMPLATES) {
      if (normalizedLine === `type: ${template.markerType}`) {
        return template.id;
      }
    }
  }
  return null;
}

// The planner lives in its own module to keep registry metadata lightweight,
// while this facade keeps all project-document operations discoverable from the
// original registry import path.
export * from './project-doc-feedback.js';
export * from './learning-feedback.js';
