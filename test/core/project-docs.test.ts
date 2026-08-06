import { describe, it, expect } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import {
  PROJECT_DOC_TEMPLATES,
  PROJECT_DOC_TEMPLATES_DIR,
  extractFrontmatterBlock,
  detectHumanSpecDocType,
  resolveProjectDocPath,
} from '../../src/core/templates/project-docs.js';

/**
 * Resolves the package's templates/project-docs/ directory from the test file
 * location using path.join semantics (cross-platform, no hardcoded separators).
 */
function getProjectDocsDir(): string {
  const testFileDir = path.dirname(fileURLToPath(import.meta.url));
  return path.join(testFileDir, '..', '..', 'src', 'core', 'templates', PROJECT_DOC_TEMPLATES_DIR);
}

describe('project context document templates', () => {
  it('registers exactly the three project context documents by name', () => {
    expect(PROJECT_DOC_TEMPLATES.map((t) => t.id)).toEqual(['project', 'roadmap', 'learner']);
    expect(PROJECT_DOC_TEMPLATES.map((t) => t.fileName)).toEqual(['project.md', 'roadmap.md', 'learner.md']);
  });

  it('every registered template file exists on disk', async () => {
    const dir = getProjectDocsDir();
    for (const template of PROJECT_DOC_TEMPLATES) {
      const filePath = path.join(dir, template.fileName);
      const content = await fs.readFile(filePath, 'utf-8');
      expect(content.length, `${template.fileName} should not be empty`).toBeGreaterThan(0);
    }
  });

  it('every template frontmatter marker matches its registered marker', async () => {
    const dir = getProjectDocsDir();
    for (const template of PROJECT_DOC_TEMPLATES) {
      const filePath = path.join(dir, template.fileName);
      const content = await fs.readFile(filePath, 'utf-8');
      const detected = detectHumanSpecDocType(content);
      expect(detected, `${template.fileName} should be recognized as ${template.id}`).toBe(template.id);
    }
  });

  it('detectHumanSpecDocType reads only the frontmatter block', () => {
    const content = `# Not frontmatter\n\ntype: humanspec-project\n`;
    expect(detectHumanSpecDocType(content)).toBeNull();

    const marked = `---\ntype: humanspec-project\nversion: 1\n---\n\n# 项目目标\n`;
    expect(detectHumanSpecDocType(marked)).toBe('project');

    const otherType = `---\ntype: humanspec-roadmap\nversion: 1\n---\n`;
    expect(detectHumanSpecDocType(otherType)).toBe('roadmap');

    // The marker must be an exact top-level type: line, not prose or nested YAML.
    const prose = `---\nnote: humanspec-project is not a type\n---\n`;
    expect(detectHumanSpecDocType(prose)).toBeNull();

    const nested = `---\nmetadata:\n  type: humanspec-project\n---\n`;
    expect(detectHumanSpecDocType(nested)).toBeNull();

    const indented = `---\n type: humanspec-project\n---\n`;
    expect(detectHumanSpecDocType(indented)).toBeNull();

    const crlf = `---\r\ntype: humanspec-project\r\n---\r\n`;
    expect(detectHumanSpecDocType(crlf)).toBe('project');
  });

  it('extractFrontmatterBlock returns null for malformed or missing blocks', () => {
    expect(extractFrontmatterBlock('no frontmatter')).toBeNull();
    expect(extractFrontmatterBlock('---\nunclosed')).toBeNull();
    expect(extractFrontmatterBlock('')).toBeNull();
    expect(extractFrontmatterBlock('---\ntype: humanspec-project\n---')).toBe('type: humanspec-project');
  });

  it('resolves template and document paths with platform-appropriate joining', () => {
    const dir = getProjectDocsDir();
    const projectRoot = path.join(path.parse(process.cwd()).root, 'tmp', 'humanspec-project');

    for (const template of PROJECT_DOC_TEMPLATES) {
      const templatePath = path.join(dir, template.fileName);
      const documentPath = resolveProjectDocPath(projectRoot, template.id);

      // path.join normalizes separators on every platform; the join itself is
      // what we assert (no hardcoded '/' or '\' anywhere in the resolution).
      expect(path.isAbsolute(templatePath)).toBe(true);
      expect(templatePath.endsWith(template.fileName)).toBe(true);
      expect(documentPath).toBe(path.join(projectRoot, 'openspec', template.fileName));
    }
  });
});
