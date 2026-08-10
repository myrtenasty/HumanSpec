import { afterEach, describe, expect, it } from 'vitest';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { getGlobalDataDir, registerStore } from '../../src/core/index.js';
import { createOpenSpecRoot } from '../helpers/openspec-fixtures.js';
import { runCLI } from '../helpers/run-cli.js';

const roots: string[] = [];

async function createHumanSpecProject(): Promise<string> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'humanspec-context-cli-'));
  roots.push(root);
  createOpenSpecRoot(root);
  const docsDirectory = path.join(root, 'openspec');
  const sourceDirectory = path.join(process.cwd(), 'src', 'core', 'templates', 'project-docs');
  await fs.mkdir(docsDirectory, { recursive: true });
  for (const id of ['project', 'roadmap', 'learner'] as const) {
    await fs.copyFile(path.join(sourceDirectory, `${id}.md`), path.join(docsDirectory, `${id}.md`));
  }
  return root;
}

async function createArchivedEvidence(root: string, changeName: string): Promise<void> {
  const archive = path.join(root, 'openspec', 'changes', 'archive', `2026-01-01-${changeName}`);
  await fs.mkdir(archive, { recursive: true });
  await fs.writeFile(
    path.join(archive, 'learning.md'),
    [
      '## AI 验证记录',
      '- Learning-result assessment: learning complete',
      '### Mastered topics',
      '- Public feedback runtime',
    ].join('\n'),
    'utf8'
  );
}

afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => fs.rm(root, { recursive: true, force: true })));
});

describe('humanspec context CLI', () => {
  it('emits exactly one versioned inspect envelope on stdout', async () => {
    const root = await createHumanSpecProject();
    const result = await runCLI(['humanspec', 'context', 'inspect', '--json'], { cwd: root });

    expect(result.exitCode, result.stderr).toBe(0);
    const envelope = JSON.parse(result.stdout);
    expect(envelope).toMatchObject({
      version: 1,
      operation: 'inspect',
      status: 'ready',
      issues: [],
    });
    expect(envelope.data.documents.map((document: { id: string }) => document.id)).toEqual([
      'project',
      'roadmap',
      'learner',
    ]);
    for (const document of envelope.data.documents as Array<{ id: string; template: string; path: string; classification: string }>) {
      expect(document.template).toContain('---');
      expect(document.path).toBe(path.join(envelope.planningHome.path, 'openspec', `${document.id}.md`));
      expect(document.classification).toBe('valid');
    }
  });

  it('inspects CRLF project documents without changing unrelated Markdown', async () => {
    const root = await createHumanSpecProject();
    for (const id of ['project', 'roadmap', 'learner'] as const) {
      const target = path.join(root, 'openspec', `${id}.md`);
      const content = await fs.readFile(target, 'utf8');
      await fs.writeFile(target, `${content.replace(/\n/g, '\r\n')}\r\n## Unrelated note\r\nPreserve this.\r\n`, 'utf8');
    }

    const result = await runCLI(['humanspec', 'context', 'inspect', '--json'], { cwd: root });
    expect(result.exitCode, result.stderr).toBe(0);
    expect(JSON.parse(result.stdout).data.documents.map((document: { classification: string }) => document.classification)).toEqual([
      'valid',
      'valid',
      'valid',
    ]);
    const roadmap = await fs.readFile(path.join(root, 'openspec', 'roadmap.md'), 'utf8');
    expect(roadmap).toContain('\r\n## Unrelated note\r\nPreserve this.\r\n');
    expect(roadmap.replace(/\r\n/g, '')).not.toContain('\n');
  });

  it('maps empty, ready, reconciliation, and blocked next-context states', async () => {
    const root = await createHumanSpecProject();
    const roadmapPath = path.join(root, 'openspec', 'roadmap.md');
    const learnerPath = path.join(root, 'openspec', 'learner.md');

    const empty = await runCLI(['humanspec', 'context', 'next', '--json'], { cwd: root });
    expect(empty.exitCode, empty.stderr).toBe(0);
    expect(JSON.parse(empty.stdout)).toMatchObject({ operation: 'next', status: 'empty' });

    const roadmap = await fs.readFile(roadmapPath, 'utf8');
    await fs.writeFile(
      roadmapPath,
      roadmap.replace(
        '- [ ] slice: <change-name> — <学习重点>\n- [ ] slice: <change-name> — <学习重点>',
        '- [ ] slice: next-context-change — public runtime'
      ),
      'utf8'
    );
    const ready = await runCLI(['humanspec', 'context', 'next', '--json'], { cwd: root });
    expect(ready.exitCode, ready.stderr).toBe(0);
    expect(JSON.parse(ready.stdout)).toMatchObject({
      operation: 'next',
      status: 'ready',
      data: { candidates: [{ changeName: 'next-context-change' }] },
    });

    await fs.appendFile(
      roadmapPath,
      '\n# 已归档切片\n\n- [x] archived: interrupted-change — incomplete (feedback: pending)\n',
      'utf8'
    );
    const reconciliation = await runCLI(['humanspec', 'context', 'next', '--json'], { cwd: root });
    expect(reconciliation.exitCode).not.toBe(0);
    expect(JSON.parse(reconciliation.stdout)).toMatchObject({ operation: 'next', status: 'reconciliation' });

    await fs.rm(learnerPath);
    const blocked = await runCLI(['humanspec', 'context', 'next', '--json'], { cwd: root });
    expect(blocked.exitCode).not.toBe(0);
    expect(JSON.parse(blocked.stdout)).toMatchObject({ operation: 'next', status: 'blocked' });
  });

  it('plans, confirms, applies from stdin, and reconciles canonical archive feedback', async () => {
    const root = await createHumanSpecProject();
    const changeName = 'public-feedback-change';
    await createArchivedEvidence(root, changeName);
    const roadmapPath = path.join(root, 'openspec', 'roadmap.md');
    const learnerPath = path.join(root, 'openspec', 'learner.md');
    const planPath = path.join(root, 'feedback-plan.json');

    const preview = await runCLI(
      ['humanspec', 'context', 'feedback-plan', '--change', changeName, '--json'],
      { cwd: root }
    );
    expect(preview.exitCode, preview.stderr).toBe(0);
    const previewEnvelope = JSON.parse(preview.stdout);
    expect(previewEnvelope).toMatchObject({
      version: 1,
      operation: 'feedback-plan',
      status: 'ready',
      data: { plan: { changeName, planningHome: expect.any(String) } },
    });
    await fs.writeFile(planPath, preview.stdout, 'utf8');

    const beforeRoadmap = await fs.readFile(roadmapPath, 'utf8');
    const beforeLearner = await fs.readFile(learnerPath, 'utf8');
    const unconfirmed = await runCLI(
      ['humanspec', 'context', 'feedback-apply', '--plan', planPath, '--json'],
      { cwd: root }
    );
    expect(unconfirmed.exitCode).not.toBe(0);
    expect(JSON.parse(unconfirmed.stdout)).toMatchObject({
      operation: 'feedback-apply',
      status: 'blocked',
      issues: [{ code: 'confirmation_required' }],
    });
    expect(await fs.readFile(roadmapPath, 'utf8')).toBe(beforeRoadmap);
    expect(await fs.readFile(learnerPath, 'utf8')).toBe(beforeLearner);

    const applied = await runCLI(
      ['humanspec', 'context', 'feedback-apply', '--plan', '-', '--yes', '--json'],
      { cwd: root, input: preview.stdout }
    );
    expect(applied.exitCode, applied.stderr).toBe(0);
    expect(JSON.parse(applied.stdout)).toMatchObject({
      operation: 'feedback-apply',
      status: 'complete',
      data: { result: { writtenDocuments: expect.arrayContaining(['roadmap', 'learner']) } },
    });
    expect(await fs.readFile(roadmapPath, 'utf8')).toContain(`archived: ${changeName}`);
    expect(await fs.readFile(learnerPath, 'utf8')).toContain('mastered: Public feedback runtime');

    const reconciled = await runCLI(
      ['humanspec', 'context', 'feedback-reconcile', '--change', changeName, '--json'],
      { cwd: root }
    );
    expect(reconciled.exitCode, reconciled.stderr).toBe(0);
    expect(JSON.parse(reconciled.stdout)).toMatchObject({
      operation: 'feedback-reconcile',
      status: 'already-applied',
    });
  });

  it('rejects malformed and stale plans before writing either document', async () => {
    const root = await createHumanSpecProject();
    const changeName = 'stale-feedback-change';
    await createArchivedEvidence(root, changeName);
    const roadmapPath = path.join(root, 'openspec', 'roadmap.md');
    const learnerPath = path.join(root, 'openspec', 'learner.md');
    const planPath = path.join(root, 'feedback-plan.json');
    const malformedPath = path.join(root, 'malformed-plan.json');

    const preview = await runCLI(
      ['humanspec', 'context', 'feedback-plan', '--change', changeName, '--json'],
      { cwd: root }
    );
    expect(preview.exitCode, preview.stderr).toBe(0);
    await fs.writeFile(planPath, preview.stdout, 'utf8');
    await fs.appendFile(roadmapPath, '\nLearner-authored change after preview.\n', 'utf8');
    const staleRoadmap = await fs.readFile(roadmapPath, 'utf8');
    const beforeLearner = await fs.readFile(learnerPath, 'utf8');

    const stale = await runCLI(
      ['humanspec', 'context', 'feedback-apply', '--plan', planPath, '--yes', '--json'],
      { cwd: root }
    );
    expect(stale.exitCode).not.toBe(0);
    expect(JSON.parse(stale.stdout)).toMatchObject({
      operation: 'feedback-apply',
      status: 'conflict',
      issues: expect.arrayContaining([expect.objectContaining({ code: 'precondition_conflict' })]),
    });
    expect(await fs.readFile(roadmapPath, 'utf8')).toBe(staleRoadmap);
    expect(await fs.readFile(learnerPath, 'utf8')).toBe(beforeLearner);

    await fs.writeFile(
      malformedPath,
      JSON.stringify({
        version: 1,
        operation: 'feedback-plan',
        data: {
          plan: {
            changeName,
            planningHome: root,
            status: 'ready',
            ready: true,
            alreadyApplied: false,
            documents: {},
            issues: [],
          },
        },
      }),
      'utf8'
    );
    const malformed = await runCLI(
      ['humanspec', 'context', 'feedback-apply', '--plan', malformedPath, '--yes', '--json'],
      { cwd: root }
    );
    expect(malformed.exitCode).not.toBe(0);
    expect(JSON.parse(malformed.stdout)).toMatchObject({
      operation: 'feedback-apply',
      status: 'error',
      issues: [{ code: 'invalid_plan' }],
    });
    expect(await fs.readFile(roadmapPath, 'utf8')).toBe(staleRoadmap);
    expect(await fs.readFile(learnerPath, 'utf8')).toBe(beforeLearner);
  });

  it('uses a selected store without reading the caller project and reports invalid stores', async () => {
    const storeRoot = await createHumanSpecProject();
    const workspace = await fs.mkdtemp(path.join(os.tmpdir(), 'humanspec-public-root-'));
    roots.push(workspace);
    const env = {
      XDG_DATA_HOME: path.join(workspace, 'data'),
      XDG_CONFIG_HOME: path.join(workspace, 'config'),
      OPEN_SPEC_INTERACTIVE: '0',
      OPENSPEC_TELEMETRY: '0',
    };
    await registerStore({
      id: 'humanspec-public-root',
      localPath: storeRoot,
      globalDataDir: getGlobalDataDir({ env }),
    });
    const scratch = path.join(workspace, 'scratch');
    await fs.mkdir(scratch, { recursive: true });

    const selected = await runCLI(
      ['humanspec', 'context', 'inspect', '--store', 'humanspec-public-root', '--json'],
      { cwd: scratch, env }
    );
    expect(selected.exitCode, selected.stderr).toBe(0);
    const envelope = JSON.parse(selected.stdout);
    expect(envelope).toMatchObject({
      operation: 'inspect',
      status: 'ready',
      planningHome: { source: 'store', storeId: 'humanspec-public-root' },
    });
    expect(envelope.data.documents).toHaveLength(3);
    for (const document of envelope.data.documents as Array<{ id: string; path: string }>) {
      expect(document.path).toBe(path.join(envelope.planningHome.path, 'openspec', `${document.id}.md`));
    }

    const invalid = await runCLI(
      ['humanspec', 'context', 'inspect', '--store', 'not-a-registered-store', '--json'],
      { cwd: scratch, env }
    );
    expect(invalid.exitCode).not.toBe(0);
    expect(JSON.parse(invalid.stdout)).toMatchObject({
      operation: 'inspect',
      status: 'error',
      issues: [{ code: 'invalid_store' }],
    });
  });

  it('emits one parseable error envelope and exits non-zero for rootless input', async () => {
    const rootless = await fs.mkdtemp(path.join(os.tmpdir(), 'humanspec-context-rootless-'));
    roots.push(rootless);
    const result = await runCLI(['humanspec', 'context', 'inspect', '--json'], { cwd: rootless });

    expect(result.exitCode).not.toBe(0);
    const envelope = JSON.parse(result.stdout);
    expect(envelope.operation).toBe('inspect');
    expect(envelope.status).toBe('error');
    expect(envelope.issues[0].code).toBe('planning_home_not_found');
  });

  it('reports invalid feedback command input as a structured failure', async () => {
    const root = await createHumanSpecProject();
    const result = await runCLI(['humanspec', 'context', 'feedback-plan', '--json'], { cwd: root });

    expect(result.exitCode).not.toBe(0);
    const envelope = JSON.parse(result.stdout);
    expect(envelope).toMatchObject({ version: 1, operation: 'feedback-plan', status: 'error' });
    expect(envelope.issues[0].code).toBe('invalid_input');

    const noArchive = await runCLI(
      ['humanspec', 'context', 'feedback-plan', '--change', 'not-archived', '--json'],
      { cwd: root }
    );
    expect(noArchive.exitCode).not.toBe(0);
    expect(JSON.parse(noArchive.stdout)).toMatchObject({
      operation: 'feedback-plan',
      status: 'error',
      issues: [{ code: 'archive_not_found' }],
    });
  });
});
