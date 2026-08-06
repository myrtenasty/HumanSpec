import path from 'path';

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

export interface ProjectDocTemplate {
  /** Stable identifier used by consumers and tests. */
  id: ProjectDocId;
  /** File name inside PROJECT_DOC_TEMPLATES_DIR. */
  fileName: string;
  /** Value of the frontmatter `type:` marker this document carries. */
  markerType: string;
}

/**
 * The three HumanSpec project context documents, registered by name.
 * Template files live under templates/project-docs/<fileName>.
 */
export const PROJECT_DOC_TEMPLATES: readonly ProjectDocTemplate[] = [
  { id: 'project', fileName: 'project.md', markerType: 'humanspec-project' },
  { id: 'roadmap', fileName: 'roadmap.md', markerType: 'humanspec-roadmap' },
  { id: 'learner', fileName: 'learner.md', markerType: 'humanspec-learner' },
] as const;

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
