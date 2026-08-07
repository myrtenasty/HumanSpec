import { afterEach, describe, expect, it } from 'vitest';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
  applyArchiveFeedback,
  planArchiveFeedback,
  resolveProjectDocumentPaths,
} from '../../src/core/templates/project-doc-feedback.js';
import { getHumanspecArchiveSkillTemplate } from '../../src/core/templates/skill-templates.js';
import { createOpenSpecRoot, writeSpec } from '../helpers/openspec-fixtures.js';
import { runCLI } from '../helpers/run-cli.js';

const roots: string[] = [];

async function copyProjectDocuments(root: string): Promise<ReturnType<typeof resolveProjectDocumentPaths>> {
  const paths = resolveProjectDocumentPaths(root);
  const sourceDir = path.join(process.cwd(), 'src', 'core', 'templates', 'project-docs');
  await fs.mkdir(path.dirname(paths.project), { recursive: true });
  for (const id of ['project', 'roadmap', 'learner'] as const) {
    await fs.copyFile(path.join(sourceDir, `${id}.md`), paths[id]);
  }
  return paths;
}

afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => fs.rm(root, { recursive: true, force: true })));
});

describe('HumanSpec archive-feedback journeys', () => {
  it('archives through canonical spec sync/move, then completes confirmed feedback once', async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'humanspec-journey-'));
    roots.push(root);
    createOpenSpecRoot(root);
    const paths = await copyProjectDocuments(root);
    const changeName = 'archive-feedback-journey';
    const changeDir = path.join(root, 'openspec', 'changes', changeName);
    await fs.mkdir(path.join(changeDir, 'specs', 'journey'), { recursive: true });
    await fs.writeFile(
      path.join(changeDir, 'proposal.md'),
      '# Archive feedback journey\n\n## Why\nA bounded practice journey.\n\n## What Changes\n- Add journey behavior.\n\n## Capabilities\n\n### New Capabilities\n- journey\n\n## Impact\n- Tests.\n'
    );
    await fs.writeFile(path.join(changeDir, 'design.md'), '# Design\n\nThe journey is bounded.\n');
    await fs.writeFile(path.join(changeDir, 'tasks.md'), '- [x] 1.1 Complete the learner task\n');
    await fs.writeFile(
      path.join(changeDir, 'specs', 'journey', 'spec.md'),
      '## Purpose\nA journey capability for validating archive feedback.\n\n## ADDED Requirements\n\n### Requirement: Journey outcome\nThe system SHALL preserve the verified journey outcome.\n\n#### Scenario: Outcome is archived\n- **WHEN** the learner completes the journey\n- **THEN** the outcome is available in the archived record\n'
    );
    const roadmap = await fs.readFile(paths.roadmap, 'utf8');
    await fs.writeFile(
      paths.roadmap,
      roadmap.replace('- [ ] slice: <change-name> — <学习重点>', `- [ ] slice: ${changeName} — archive feedback`),
      'utf8'
    );
    writeSpec(
      root,
      'baseline',
      '# baseline Specification\n\n## Purpose\nA baseline capability.\n\n## Requirements\n\n### Requirement: Baseline behavior\nThe system SHALL remain available.\n\n#### Scenario: Baseline is available\n- **WHEN** a user requests it\n- **THEN** it is available\n'
    );

    const archived = await runCLI(['archive', changeName, '--yes', '--json'], { cwd: root });
    expect(archived.exitCode, archived.stderr).toBe(0);
    expect(await fs.stat(changeDir).catch(() => null)).toBeNull();
    const archiveRoot = path.join(root, 'openspec', 'changes', 'archive');
    const archiveEntries = await fs.readdir(archiveRoot);
    expect(archiveEntries.some((entry) => entry.includes(changeName))).toBe(true);
    expect(await fs.readFile(path.join(root, 'openspec', 'specs', 'journey', 'spec.md'), 'utf8')).toContain('Journey outcome');

    const plan = await planArchiveFeedback({
      projectRoot: root,
      changeName,
      outcome: 'learning complete',
      evidence: {
        learningAssessment: 'learning complete',
        masteredTopics: ['Archive feedback boundaries'],
        gaps: ['Retry reconciliation'],
        reviewItems: ['Retry reconciliation'],
      },
    });
    expect(plan.status).toBe('ready');
    const applied = await applyArchiveFeedback(plan);
    expect(applied.status).toBe('complete');
    expect((await fs.readFile(paths.roadmap, 'utf8')).match(new RegExp(`archived: ${changeName} .*feedback: complete`))).toHaveLength(1);
    const learner = await fs.readFile(paths.learner, 'utf8');
    expect(learner).toContain('- [ ] mastered: Archive feedback boundaries');
    expect(learner).toContain('- [ ] gap: Retry reconciliation');
    expect(learner).toContain('- [ ] review: Retry reconciliation');
    expect(getHumanspecArchiveSkillTemplate().instructions).toContain('/humanspec:next');
  });

  it('blocks incomplete context before any feedback write', async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'humanspec-blocked-'));
    roots.push(root);
    createOpenSpecRoot(root);
    const paths = await copyProjectDocuments(root);
    const before = await fs.readFile(paths.roadmap, 'utf8');
    await fs.rm(paths.learner);
    const plan = await planArchiveFeedback({ projectRoot: root, changeName: 'missing-context' });
    expect(plan.status).toBe('blocked');
    expect(plan.issues.some((item) => item.code === 'missing' && item.document === 'learner')).toBe(true);
    expect(await fs.readFile(paths.roadmap, 'utf8')).toBe(before);
  });

  it('leaves project feedback untouched when canonical archive validation fails', async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'humanspec-archive-failure-'));
    roots.push(root);
    createOpenSpecRoot(root);
    const paths = await copyProjectDocuments(root);
    const changeName = 'invalid-canonical-archive';
    const changeDir = path.join(root, 'openspec', 'changes', changeName);
    await fs.mkdir(path.join(changeDir, 'specs', 'broken'), { recursive: true });
    await fs.writeFile(
      path.join(changeDir, 'specs', 'broken', 'spec.md'),
      '# Broken - Changes\n\n## ADDED Requirements\n\n### Requirement: Broken behavior\n\nThe system will do something.\n',
      'utf8'
    );
    const beforeRoadmap = await fs.readFile(paths.roadmap, 'utf8');
    const beforeLearner = await fs.readFile(paths.learner, 'utf8');

    const archived = await runCLI(['archive', changeName, '--yes', '--json'], { cwd: root });

    expect(archived.exitCode).not.toBe(0);
    expect(archived.stdout).toContain('"archive": null');
    expect(await fs.stat(changeDir).catch(() => null)).not.toBeNull();
    expect(await fs.readFile(paths.roadmap, 'utf8')).toBe(beforeRoadmap);
    expect(await fs.readFile(paths.learner, 'utf8')).toBe(beforeLearner);
  });
});
