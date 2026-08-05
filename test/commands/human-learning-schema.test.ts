import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import { runCLI } from '../helpers/run-cli.js';
import { FileSystemUtils } from '../../src/utils/file-system.js';

describe('human-learning built-in schema', () => {
  let projectRoot: string;
  let changesDir: string;

  const canonical = (targetPath: string): string =>
    FileSystemUtils.canonicalizeExistingPath(targetPath);

  beforeEach(async () => {
    projectRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'openspec-human-learning-'));
    changesDir = path.join(projectRoot, 'openspec', 'changes');
    await fs.mkdir(changesDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(projectRoot, { recursive: true, force: true });
  });

  async function createLearningChange(
    name: string,
    options: { skipSpecs?: boolean } = {}
  ): Promise<string> {
    const changeDir = path.join(changesDir, name);
    await fs.mkdir(changeDir, { recursive: true });
    await fs.writeFile(
      path.join(changeDir, '.openspec.yaml'),
      ['schema: human-learning', ...(options.skipSpecs ? ['skip_specs: true'] : []), ''].join(
        '\n'
      ),
      'utf-8'
    );
    return changeDir;
  }

  async function readStatus(name: string): Promise<any> {
    const result = await runCLI(['status', '--change', name, '--json'], {
      cwd: projectRoot,
    });
    expect(result.exitCode, result.stderr).toBe(0);
    return JSON.parse(result.stdout);
  }

  it('is discovered as a package schema and can bind a new change', async () => {
    const discovery = await runCLI(['schemas', '--json'], { cwd: projectRoot });
    expect(discovery.exitCode, discovery.stderr).toBe(0);

    const schema = JSON.parse(discovery.stdout).find(
      (candidate: { name: string }) => candidate.name === 'human-learning'
    );
    expect(schema).toMatchObject({
      name: 'human-learning',
      source: 'package',
      artifacts: ['proposal', 'specs', 'learning'],
    });

    const created = await runCLI(
      ['new', 'change', 'practice-routing', '--schema', 'human-learning', '--json'],
      { cwd: projectRoot }
    );
    expect(created.exitCode, created.stderr).toBe(0);
    expect(JSON.parse(created.stdout).change.schema).toBe('human-learning');

    const metadataPath = path.join(changesDir, 'practice-routing', '.openspec.yaml');
    await expect(fs.readFile(metadataPath, 'utf-8')).resolves.toContain(
      'schema: human-learning'
    );
    await expect(readStatus('practice-routing')).resolves.toMatchObject({
      schemaName: 'human-learning',
      applyRequires: ['learning'],
    });
  });

  it('progresses from proposal through specs to learning and completion', async () => {
    const changeName = 'practice-sequence';
    const changeDir = await createLearningChange(changeName);

    let status = await readStatus(changeName);
    expect(status.artifacts.map(({ id, status: artifactStatus }: any) => [id, artifactStatus])).toEqual(
      [
        ['proposal', 'ready'],
        ['specs', 'blocked'],
        ['learning', 'blocked'],
      ]
    );

    await fs.writeFile(path.join(changeDir, 'proposal.md'), '## Observable Outcome\n\nRouting works.\n');
    status = await readStatus(changeName);
    expect(status.artifacts.map(({ status: artifactStatus }: any) => artifactStatus)).toEqual([
      'done',
      'ready',
      'blocked',
    ]);

    const specPath = path.join(changeDir, 'specs', 'routing', 'spec.md');
    await fs.mkdir(path.dirname(specPath), { recursive: true });
    await fs.writeFile(specPath, '## ADDED Requirements\n');
    status = await readStatus(changeName);
    expect(status.artifacts.map(({ status: artifactStatus }: any) => artifactStatus)).toEqual([
      'done',
      'done',
      'ready',
    ]);

    await fs.writeFile(path.join(changeDir, 'learning.md'), '## 实践任务\n\n- [ ] 1. Practice\n');
    status = await readStatus(changeName);
    expect(status.isComplete).toBe(true);
    expect(status.artifacts.map(({ status: artifactStatus }: any) => artifactStatus)).toEqual([
      'done',
      'done',
      'done',
    ]);
  });

  it('skips specs without synthesizing a file and unlocks learning after proposal', async () => {
    const changeName = 'practice-refactor';
    const changeDir = await createLearningChange(changeName, { skipSpecs: true });
    await fs.writeFile(path.join(changeDir, 'proposal.md'), '## Observable Outcome\n\nNo behavior delta.\n');

    const status = await readStatus(changeName);
    expect(status.artifacts.map(({ id, status: artifactStatus }: any) => [id, artifactStatus])).toEqual(
      [
        ['proposal', 'done'],
        ['specs', 'skipped'],
        ['learning', 'ready'],
      ]
    );
    await expect(fs.access(path.join(changeDir, 'specs'))).rejects.toMatchObject({
      code: 'ENOENT',
    });
  });

  it('returns ownership-aware templates and tracks ordered practice tasks from learning.md', async () => {
    const changeName = 'practice-instructions';
    const changeDir = await createLearningChange(changeName);
    await fs.writeFile(path.join(changeDir, 'proposal.md'), '## Observable Outcome\n\nRouting works.\n');
    const specPath = path.join(changeDir, 'specs', 'routing', 'spec.md');
    await fs.mkdir(path.dirname(specPath), { recursive: true });
    await fs.writeFile(specPath, '## ADDED Requirements\n');

    const proposalResult = await runCLI(
      ['instructions', 'proposal', '--change', changeName, '--json'],
      { cwd: projectRoot }
    );
    const proposal = JSON.parse(proposalResult.stdout);
    expect(proposal.instruction).toContain('one observable outcome');
    expect(proposal.instruction).toContain('included and explicitly excluded');
    expect(proposal.instruction).toContain('Completion Evidence');
    expect(proposal.instruction).toContain('multiple independent outcomes');

    const specsResult = await runCLI(
      ['instructions', 'specs', '--change', changeName, '--json'],
      { cwd: projectRoot }
    );
    const specs = JSON.parse(specsResult.stdout);
    expect(specs.instruction).toContain('testable WHEN/THEN scenarios');
    expect(specs.instruction).toContain('skip_specs: true');
    expect(specs.instruction).toContain('no observable behavior contract');

    const learningResult = await runCLI(
      ['instructions', 'learning', '--change', changeName, '--json'],
      { cwd: projectRoot }
    );
    const learning = JSON.parse(learningResult.stdout);
    expect(learning.instruction).toContain('one primary learning goal');
    expect(learning.instruction).toContain('no more than two supporting concepts');
    expect(learning.instruction).toContain('two to five independently verifiable practice tasks');
    expect(learning.instruction).toContain('human learner owns');
    for (const heading of [
      '本次学习契约',
      '开始前',
      '实践任务',
      '卡住时的记录',
      '完成后',
      'AI 验证记录',
    ]) {
      expect(learning.template).toContain(`## ${heading}`);
    }
    expect(learning.template).toContain('- [ ] 1.');

    const learningPath = path.join(changeDir, 'learning.md');
    await fs.writeFile(
      learningPath,
      [
        '## 实践任务',
        '',
        '- [x] 1. Inspect the existing behavior',
        '- [ ] 2. Implement the focused change',
        '- [ ] 3. Verify the observable outcome',
        '',
      ].join('\n')
    );

    const applyResult = await runCLI(
      ['instructions', 'apply', '--change', changeName, '--json'],
      { cwd: projectRoot }
    );
    expect(applyResult.exitCode, applyResult.stderr).toBe(0);
    const apply = JSON.parse(applyResult.stdout);
    const expectedLearningPath = canonical(learningPath);
    expect(apply).toMatchObject({
      schemaName: 'human-learning',
      applyRequires: ['learning'],
      tracks: expectedLearningPath,
      state: 'ready',
      progress: { total: 3, complete: 1, remaining: 2 },
      tasks: [
        { id: '1', description: '1. Inspect the existing behavior', done: true },
        { id: '2', description: '2. Implement the focused change', done: false },
        { id: '3', description: '3. Verify the observable outcome', done: false },
      ],
    });
    expect(apply.contextFiles.learning).toEqual([expectedLearningPath]);
    expect(apply.instruction).toContain('human learner writes all application and test');
    expect(apply.instruction).toContain('progressive hints');
    expect(apply.instruction).toContain('must not edit');
    await expect(fs.access(path.join(changeDir, 'tasks.md'))).rejects.toMatchObject({
      code: 'ENOENT',
    });
  });

  it('keeps the internal apply protocol available in a humanspec-profile project (no public apply)', async () => {
    // A HumanSpec project declares `profile: humanspec` and therefore never
    // receives a user-invocable apply workflow. The internal
    // `openspec instructions apply` protocol must remain available so coach,
    // next, verify, and archive can reuse structured context and task
    // progress (humanspec-workflow-profile spec: internal apply protocol).
    await fs.writeFile(
      path.join(projectRoot, 'openspec', 'config.yaml'),
      'schema: human-learning\nprofile: humanspec\n',
      'utf-8'
    );

    const changeName = 'internal-apply-protocol';
    const changeDir = await createLearningChange(changeName);
    await fs.writeFile(
      path.join(changeDir, 'proposal.md'),
      '# Proposal\n\n## Why\nPractice a focused change.\n',
      'utf-8'
    );
    const learningPath = path.join(changeDir, 'learning.md');
    await fs.writeFile(
      learningPath,
      ['## 实践任务', '', '- [x] 1. First task done', '- [ ] 2. Second task pending', ''].join(
        '\n'
      )
    );

    const applyResult = await runCLI(
      ['instructions', 'apply', '--change', changeName, '--json'],
      { cwd: projectRoot }
    );
    expect(applyResult.exitCode, applyResult.stderr).toBe(0);
    const apply = JSON.parse(applyResult.stdout);
    expect(apply).toMatchObject({
      schemaName: 'human-learning',
      applyRequires: ['learning'],
      state: 'ready',
      progress: { total: 2, complete: 1, remaining: 1 },
    });
    expect(apply.tasks[0]).toMatchObject({ id: '1', done: true });
    expect(apply.tasks[1]).toMatchObject({ id: '2', done: false });
    // The schema's apply instruction still carries the human-implementation
    // boundary even though no public apply workflow is installed.
    expect(apply.instruction).toContain('human learner writes all application and test');
  });
});
