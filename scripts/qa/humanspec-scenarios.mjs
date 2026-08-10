import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  assert,
  assertContains,
  assertExit,
  assertFileExists,
  assertFileMissing,
  assertJsonOutput,
  countLinesContaining,
} from './assertions.mjs';

const fixtureRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures', 'humanspec');

async function loadFixture() {
  return JSON.parse(await fs.readFile(path.join(fixtureRoot, 'fixture.json'), 'utf8'));
}

async function copyFixture(ctx) {
  await fs.cp(path.join(fixtureRoot, 'openspec'), path.join(ctx.projectRoot, 'openspec'), { recursive: true });
  return loadFixture();
}

function assertInstalledRuntime(ctx) {
  const binPath = ctx.installed?.bins?.openspec ?? Object.values(ctx.installed?.bins ?? {})[0];
  assert(Boolean(binPath), 'Packed package did not expose a bin mapping.');
  const normalizedBin = path.resolve(binPath).toLocaleLowerCase();
  const normalizedPackage = path.resolve(ctx.installed.packageRoot).toLocaleLowerCase();
  const normalizedRepo = path.resolve(ctx.repoRoot).toLocaleLowerCase();
  assert(normalizedBin.startsWith(`${normalizedPackage}${path.sep}`), 'Capstone did not use a bin inside the installed package root.');
  assert(!normalizedBin.startsWith(`${normalizedRepo}${path.sep}`), 'Capstone resolved the repository source/dist CLI instead of the installed package.');
  assert(!normalizedBin.includes(`${path.sep}src${path.sep}`) && !normalizedBin.includes(`${path.sep}dist${path.sep}`) || normalizedBin.startsWith(`${normalizedPackage}${path.sep}`), 'Capstone imported a repository source/dist path.');
  return binPath;
}

async function bootstrap(ctx) {
  await copyFixture(ctx);
  await ctx.installPacked();
  ctx.installedCli = assertInstalledRuntime(ctx);
  const init = await ctx.installedCliRun(['init', '.', '--profile', 'humanspec', '--tools', 'none', '--no-animation']);
  assertExit(init);
  const inspect = assertJsonOutput(
    await ctx.installedCliRun(['humanspec', 'context', 'inspect', '--json']),
    'packed context inspect'
  );
  assert(inspect.status === 'ready', `Packed context inspect was ${String(inspect.status)}.`);
  assert(inspect.data?.documents?.length === 3, 'Packed context inspect did not expose all three project documents.');
  for (const document of inspect.data.documents) {
    assert(
      String(document.templatePath).toLocaleLowerCase().includes(path.join('node_modules', ctx.packageName).toLocaleLowerCase()),
      `Template ${document.id} was not resolved from the installed package.`
    );
  }
  const next = assertJsonOutput(
    await ctx.installedCliRun(['humanspec', 'context', 'next', '--json']),
    'packed initial next context'
  );
  assert(next.status === 'ready', `Packed fixture did not resolve an initial next context: ${String(next.status)}.`);
  return inspect;
}

async function archiveAndPlan(ctx, fixture, candidateName) {
  const archiveResult = assertJsonOutput(
    await ctx.installedCliRun(['archive', fixture.changeName, '--yes', '--json']),
    'packed canonical archive'
  );
  assert(archiveResult.archive?.change === fixture.changeName, 'Canonical archive did not identify the fixture change.');
  await assertFileMissing(
    path.join(ctx.projectRoot, 'openspec', 'changes', fixture.changeName),
    'active packed fixture change'
  );

  const archiveRoot = path.join(ctx.projectRoot, 'openspec', 'changes', 'archive');
  const entries = (await fs.readdir(archiveRoot)).filter((entry) => entry.endsWith(fixture.changeName));
  assert(entries.length === 1, `Expected one canonical archive entry, found ${entries.length}.`);
  const archivedPath = path.join(archiveRoot, entries[0]);
  await assertFileExists(path.join(archivedPath, 'learning.md'), 'archived learning evidence');

  const adaptive = JSON.stringify({
    milestone: { identity: '1', status: 'completed' },
    candidate: { changeName: candidateName, learningFocus: 'Practice the packed public runtime boundary' },
    evidenceReferences: ['mastered: Packed public runtime boundary', 'gap: Feedback interruption recovery'],
  });
  const planEnvelope = assertJsonOutput(
    await ctx.installedCliRun([
      'humanspec', 'context', 'feedback-plan', '--change', fixture.changeName, '--adaptive', adaptive, '--json',
    ]),
    'packed feedback plan'
  );
  assert(planEnvelope.status === 'ready', `Packed feedback plan was ${String(planEnvelope.status)}.`);
  assert(planEnvelope.data?.plan?.candidate?.changeName === candidateName, 'Feedback plan lost the learner-confirmed candidate.');
  const planPath = path.join(ctx.projectRoot, 'feedback-plan.json');
  await fs.writeFile(planPath, `${JSON.stringify(planEnvelope, null, 2)}\n`, 'utf8');
  return { planEnvelope, planPath, archivedPath };
}

async function applyPlan(ctx, planPath, extraArgs = []) {
  const result = assertJsonOutput(
    await ctx.installedCliRun(['humanspec', 'context', 'feedback-apply', '--plan', planPath, '--yes', ...extraArgs, '--json']),
    'packed feedback apply'
  );
  assert(result.status === 'complete', `Packed feedback apply was ${String(result.status)}.`);
  return result;
}

export const humanspecScenarios = Object.freeze([
  {
    id: 'humanspec-packed-happy-path',
    description: 'Runs the deterministic HumanSpec loop through a freshly packed and installed binary.',
    tier: ['smoke', 'capstone'],
    platforms: ['linux', 'darwin', 'win32'],
    requiresPackedArtifact: true,
    timeoutMs: 180_000,
    async run(ctx) {
      const fixture = await loadFixture();
      await bootstrap(ctx);
      const { planPath } = await archiveAndPlan(ctx, fixture, fixture.candidateName);
      await applyPlan(ctx, planPath);
      const next = assertJsonOutput(
        await ctx.installedCliRun(['humanspec', 'context', 'next', '--json']),
        'packed next context after feedback'
      );
      assert(next.status === 'ready', `Packed happy path next context was ${String(next.status)}.`);
      assert(next.data?.activeMilestone === null, 'Packed happy path did not persist completed milestone state.');
      assert(next.data?.candidates?.some((candidate) => candidate.changeName === fixture.candidateName), 'Packed happy path lost the confirmed next candidate.');
      await assertFileMissing(path.join(ctx.projectRoot, 'openspec', 'changes', fixture.candidateName), 'confirmed candidate change directory');
      const reconciled = assertJsonOutput(
        await ctx.installedCliRun(['humanspec', 'context', 'feedback-reconcile', '--change', fixture.changeName, '--json']),
        'packed already-applied reconciliation'
      );
      assert(reconciled.status === 'already-applied', `Repeated packed reconciliation was ${String(reconciled.status)}.`);
    },
  },
  {
    id: 'humanspec-packed-feedback-reconcile',
    description: 'Recovers archive feedback after a simulated interrupted project-document write and remains duplicate-free.',
    tier: ['smoke', 'capstone'],
    platforms: ['linux', 'darwin', 'win32'],
    requiresPackedArtifact: true,
    timeoutMs: 180_000,
    async run(ctx) {
      const fixture = await loadFixture();
      await bootstrap(ctx);
      const { archivedPath } = await archiveAndPlan(ctx, fixture, fixture.candidateName);
      // Simulate the only durable part of an interruption: canonical archive
      // succeeded, roadmap has the pending marker, and learner feedback has
      // not yet been written. Reconciliation must use archived learning.md.
      const roadmapPath = path.join(ctx.projectRoot, 'openspec', 'roadmap.md');
      const roadmap = await fs.readFile(roadmapPath, 'utf8');
      await fs.writeFile(
        roadmapPath,
        `${roadmap}\n# 已归档切片\n\n- [x] archived: ${fixture.changeName} — complete (feedback: pending)\n`,
        'utf8'
      );
      await assertFileExists(path.join(archivedPath, 'learning.md'), 'interruption archive evidence');
      const first = assertJsonOutput(
        await ctx.installedCliRun(['humanspec', 'context', 'feedback-reconcile', '--change', fixture.changeName, '--json']),
        'packed interruption reconciliation'
      );
      assert(['complete', 'already-applied'].includes(first.status), `Interruption reconciliation was ${String(first.status)}.`);
      const second = assertJsonOutput(
        await ctx.installedCliRun(['humanspec', 'context', 'feedback-reconcile', '--change', fixture.changeName, '--json']),
        'packed repeated interruption reconciliation'
      );
      assert(['complete', 'already-applied'].includes(second.status), `Repeated interruption reconciliation was ${String(second.status)}.`);
      const learnerPath = path.join(ctx.projectRoot, 'openspec', 'learner.md');
      assert(await countLinesContaining(learnerPath, 'mastered: Packed public runtime boundary') === 1, 'Repeated reconciliation duplicated mastered evidence.');
      assert(await countLinesContaining(learnerPath, 'gap: Feedback interruption recovery') === 1, 'Repeated reconciliation duplicated gap evidence.');
      assert(await countLinesContaining(learnerPath, 'review: Candidate rejection routing') === 1, 'Repeated reconciliation duplicated review evidence.');
      const finalRoadmap = await fs.readFile(roadmapPath, 'utf8');
      assert(finalRoadmap.split(/\r?\n/u).filter((line) => line.includes(`archived: ${fixture.changeName}`)).length === 1, 'Repeated reconciliation duplicated the archived roadmap record.');
    },
  },
  {
    id: 'humanspec-packed-rejected-candidate',
    description: 'Applies archive and learner evidence while rejecting the only proposed next candidate.',
    tier: ['smoke', 'capstone'],
    platforms: ['linux', 'darwin', 'win32'],
    requiresPackedArtifact: true,
    timeoutMs: 180_000,
    async run(ctx) {
      const fixture = await loadFixture();
      await bootstrap(ctx);
      const { planPath } = await archiveAndPlan(ctx, fixture, fixture.rejectedCandidateName);
      await applyPlan(ctx, planPath, ['--reject-candidate']);
      const next = assertJsonOutput(
        await ctx.installedCliRun(['humanspec', 'context', 'next', '--json']),
        'packed rejected-candidate next context'
      );
      assert(next.status === 'empty', `Rejected candidate next context was ${String(next.status)}.`);
      assert(next.data?.emptyReason === 'no-confirmed-candidate', 'Rejected candidate did not report an intentional empty roadmap.');
      assert(!next.data?.candidates?.some((candidate) => candidate.changeName === fixture.rejectedCandidateName), 'Rejected candidate remained in the roadmap.');
      await assertFileMissing(path.join(ctx.projectRoot, 'openspec', 'changes', fixture.rejectedCandidateName), 'rejected candidate change directory');
    },
  },
]);
