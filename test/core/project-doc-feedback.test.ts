import { afterEach, describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
  PROJECT_DOC_FEEDBACK_DESCRIPTORS,
  PROJECT_DOC_TEMPLATES,
  analyzeProjectDocument,
  applyArchiveFeedback,
  findPendingArchiveFeedback,
  normalizeFeedbackTopic,
  planArchiveFeedback,
  proposeLearnerFeedbackRecords,
  reconcileArchiveFeedback,
  resolveNextRoadmapContext,
  resolveProjectDocumentPaths,
} from '../../src/core/templates/project-docs.js';

const templateDir = path.join(process.cwd(), 'src', 'core', 'templates', 'project-docs');
const tempDirs: string[] = [];

async function fixture(name: 'project' | 'roadmap' | 'learner'): Promise<string> {
  return fs.readFile(path.join(templateDir, `${name}.md`), 'utf8');
}

async function projectFixture(): Promise<{ root: string; paths: ReturnType<typeof resolveProjectDocumentPaths> }> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'humanspec-feedback-'));
  tempDirs.push(root);
  const paths = resolveProjectDocumentPaths(root);
  await fs.mkdir(path.dirname(paths.project), { recursive: true });
  for (const id of PROJECT_DOC_TEMPLATES.map((template) => template.id)) {
    await fs.writeFile(paths[id], await fixture(id), 'utf8');
  }
  return { root, paths };
}

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((directory) => fs.rm(directory, { recursive: true, force: true })));
});

describe('HumanSpec project-document feedback registry and planner', () => {
  it('registers named archive, candidate, pending, and learner-record descriptors', () => {
    expect(PROJECT_DOC_FEEDBACK_DESCRIPTORS.roadmap.archiveSection.heading).toBe('# 已归档切片');
    expect(PROJECT_DOC_FEEDBACK_DESCRIPTORS.roadmap.candidateSlice.prefix).toBe('slice:');
    expect(PROJECT_DOC_FEEDBACK_DESCRIPTORS.roadmap.pendingFeedback.marker).toBe('feedback: pending');
    expect(PROJECT_DOC_FEEDBACK_DESCRIPTORS.learner.records.map((record) => record.prefix)).toEqual([
      'gap:',
      'mastered:',
      'review:',
    ]);
  });

  it('classifies missing, unmarked, malformed, and valid registered documents', async () => {
    const roadmap = await fixture('roadmap');
    expect(analyzeProjectDocument('roadmap', roadmap).status).toBe('valid');
    expect(analyzeProjectDocument('roadmap', '# 候选切片\n').status).toBe('unmarked');
    expect(analyzeProjectDocument(
      'roadmap',
      roadmap.replace('# 候选切片', '# 候选切片\n- [ ] slice: broken')
    ).status).toBe('malformed');
    const duplicateHeading = roadmap.replace('# 候选切片', '# 候选切片\n\n# 候选切片');
    expect(analyzeProjectDocument('roadmap', duplicateHeading).issues.some((item) => item.code === 'duplicated')).toBe(true);
  });

  it('parses milestone lifecycle grammar, reports legacy inference, and blocks ambiguous states', async () => {
    const roadmap = await fixture('roadmap');
    const valid = analyzeProjectDocument('roadmap', roadmap);
    expect(valid.status).toBe('valid');
    expect(valid.activeMilestone).toMatchObject({ identity: '1', status: 'active', inferredStatus: null });

    const legacy = analyzeProjectDocument('roadmap', roadmap.replace('- status: active\n', ''));
    expect(legacy.status).toBe('valid');
    expect(legacy.activeMilestone).toMatchObject({ identity: '1', status: null, inferredStatus: 'active' });

    const secondMilestone = [
      '## 里程碑 2',
      '',
      '- status: active',
      '- 预期成果：',
      '',
      '# 候选切片',
    ].join('\n');
    const ambiguous = analyzeProjectDocument('roadmap', roadmap.replace('# 候选切片', secondMilestone));
    expect(ambiguous.status).toBe('malformed');
    expect(ambiguous.issues.some((item) => item.message.includes('at most one active milestone'))).toBe(true);

    const unsupported = analyzeProjectDocument('roadmap', roadmap.replace('status: active', 'status: future'));
    expect(unsupported.status).toBe('malformed');
    expect(unsupported.issues.some((item) => item.message.includes('unsupported status'))).toBe(true);
  });

  it('validates confirmed adaptive milestone and candidate effects without changing learner-owned text', async () => {
    const { root, paths } = await projectFixture();
    const plan = await planArchiveFeedback({
      projectRoot: root,
      changeName: 'completed-change',
      evidence: { learningAssessment: 'learning complete' },
      milestone: { identity: '1', status: 'completed' },
      candidate: {
        changeName: 'next-practice',
        learningFocus: 'Practice lifecycle validation',
        evidenceReferences: ['mastered lifecycle grammar'],
      },
    });

    expect(plan.status).toBe('ready');
    expect(plan.milestoneTransition).toMatchObject({ identity: '1', previousStatus: 'active', proposedStatus: 'completed' });
    expect(plan.candidateStatus).toBe('confirmed');
    expect(plan.documents.roadmap?.pendingContent).toContain('- status: completed');
    expect(plan.documents.roadmap?.pendingContent).toContain('slice: next-practice — Practice lifecycle validation');

    const invalidTransition = await planArchiveFeedback({
      projectRoot: root,
      changeName: 'invalid-transition',
      milestone: { identity: '1', status: 'planned' },
    });
    expect(invalidTransition.status).toBe('blocked');
    expect(invalidTransition.issues.some((item) => item.message.includes('cannot transition'))).toBe(true);

    const invalidCandidate = await planArchiveFeedback({
      projectRoot: root,
      changeName: 'invalid-candidate',
      candidate: { changeName: 'Not a change', learningFocus: 'valid focus' },
    });
    expect(invalidCandidate.status).toBe('blocked');
    expect(invalidCandidate.issues.some((item) => item.message.includes('not a valid change name'))).toBe(true);

    const sourceRoadmap = await fs.readFile(paths.roadmap, 'utf8');
    expect(sourceRoadmap).toContain('- status: active');
    expect(sourceRoadmap).not.toContain('next-practice');
  });

  it('handles confirmed, rejected, duplicate, archived, and conflicting adaptive candidates', async () => {
    const rejectedFixture = await projectFixture();
    const rejected = await planArchiveFeedback({
      projectRoot: rejectedFixture.root,
      changeName: 'rejected-source',
      milestone: { identity: '1', status: 'completed' },
      candidate: { changeName: 'next-practice', learningFocus: 'Practice lifecycle validation' },
      candidateDisposition: 'rejected',
    });
    expect(rejected.status).toBe('ready');
    expect(rejected.candidateStatus).toBe('rejected');
    expect(rejected.documents.roadmap?.pendingContent).not.toContain('slice: next-practice');
    const rejectedResult = await applyArchiveFeedback(rejected, { confirmed: true });
    expect(rejectedResult.candidateStatus).toBe('rejected');
    const rejectedRoadmap = await fs.readFile(rejectedFixture.paths.roadmap, 'utf8');
    expect(rejectedRoadmap).toContain('- status: completed');
    expect(rejectedRoadmap).not.toContain('slice: next-practice');

    const noProposal = await planArchiveFeedback({ projectRoot: rejectedFixture.root, changeName: 'no-proposal' });
    expect(noProposal.candidateStatus).toBe('not-proposed');

    const duplicateFixture = await projectFixture();
    const duplicateRoadmap = (await fs.readFile(duplicateFixture.paths.roadmap, 'utf8'))
      .replace('\n- [ ] slice: <change-name> — <学习重点>', '\n- [ ] slice: next-practice — Practice lifecycle validation');
    await fs.writeFile(duplicateFixture.paths.roadmap, duplicateRoadmap, 'utf8');
    const duplicate = await planArchiveFeedback({
      projectRoot: duplicateFixture.root,
      changeName: 'duplicate-source',
      candidate: { changeName: 'next-practice', learningFocus: 'Practice lifecycle validation' },
    });
    expect(duplicate.status).toBe('ready');
    expect(duplicate.documents.roadmap?.pendingContent?.match(/slice: next-practice/g)?.length).toBe(1);

    const conflict = await planArchiveFeedback({
      projectRoot: duplicateFixture.root,
      changeName: 'conflict-source',
      candidate: { changeName: 'next-practice', learningFocus: 'A conflicting focus' },
    });
    expect(conflict.status).toBe('blocked');
    expect(conflict.issues.some((item) => item.message.includes('conflicting learning focus'))).toBe(true);

    const archivedFixture = await projectFixture();
    await fs.appendFile(archivedFixture.paths.roadmap, '\n# 已归档切片\n\n- [x] archived: next-practice — complete (feedback: complete)\n', 'utf8');
    const archived = await planArchiveFeedback({
      projectRoot: archivedFixture.root,
      changeName: 'archived-source',
      candidate: { changeName: 'next-practice', learningFocus: 'Practice lifecycle validation' },
    });
    expect(archived.status).toBe('blocked');
    expect(archived.issues.some((item) => item.message.includes('already archived'))).toBe(true);
  });

  it('applies and reconciles confirmed adaptive effects without creating a change', async () => {
    const { root, paths } = await projectFixture();
    const plan = await planArchiveFeedback({
      projectRoot: root,
      changeName: 'adaptive-source',
      evidence: { learningAssessment: 'learning complete', masteredTopics: ['Lifecycle state'] },
      milestone: { identity: '1', status: 'completed' },
      candidate: { changeName: 'adaptive-next', learningFocus: 'Use adaptive feedback evidence' },
    });
    expect(plan.completedSlice).toBeUndefined();
    expect(plan.archivedRecord).toMatchObject({ changeName: 'adaptive-source', feedback: 'pending' });

    const applied = await applyArchiveFeedback(plan, { confirmed: true });
    expect(applied).toMatchObject({ status: 'complete', candidateStatus: 'confirmed', reconciliationRequired: false });
    const roadmap = await fs.readFile(paths.roadmap, 'utf8');
    expect(roadmap).toContain('- status: completed');
    expect(roadmap).toContain('slice: adaptive-next — Use adaptive feedback evidence');
    expect(roadmap).toContain('archived: adaptive-source');
    expect(await fs.readFile(paths.learner, 'utf8')).toContain('mastered: Lifecycle state');
    await expect(fs.stat(path.join(root, 'openspec', 'changes', 'adaptive-next'))).rejects.toMatchObject({ code: 'ENOENT' });

    const replayPlan = await planArchiveFeedback({
      projectRoot: root,
      changeName: 'adaptive-source',
      evidence: { learningAssessment: 'learning complete', masteredTopics: ['Lifecycle state'] },
      milestone: { identity: '1', status: 'completed' },
      candidate: { changeName: 'adaptive-next', learningFocus: 'Use adaptive feedback evidence' },
    });
    expect(replayPlan.status).toBe('already-applied');
    expect((await applyArchiveFeedback(replayPlan, { confirmed: true })).status).toBe('already-applied');
    const replay = await reconcileArchiveFeedback({
      projectRoot: root,
      changeName: 'adaptive-source',
      evidence: { learningAssessment: 'learning complete', masteredTopics: ['Lifecycle state'] },
    });
    expect(replay.status).toBe('already-applied');
    const replayRoadmap = await fs.readFile(paths.roadmap, 'utf8');
    expect(replayRoadmap.match(/slice: adaptive-next/g)?.length).toBe(1);
    expect(replayRoadmap.match(/archived: adaptive-source/g)?.length).toBe(1);
    expect((await fs.readFile(paths.learner, 'utf8')).match(/mastered: Lifecycle state/g)?.length).toBe(1);
  });

  it('reconciles an interrupted confirmed milestone and candidate write from pending roadmap evidence', async () => {
    const { root, paths } = await projectFixture();
    const plan = await planArchiveFeedback({
      projectRoot: root,
      changeName: 'interrupted-adaptive',
      evidence: { learningAssessment: 'learning complete', masteredTopics: ['Replay evidence'] },
      milestone: { identity: '1', status: 'completed' },
      candidate: { changeName: 'replayed-next', learningFocus: 'Replay confirmed feedback' },
    });
    let writes = 0;
    const interrupted = await applyArchiveFeedback(plan, {
      confirmed: true,
      atomicWrite: async (filePath, content) => {
        writes += 1;
        if (writes === 2) throw new Error('interrupted learner write');
        await fs.writeFile(filePath, content, 'utf8');
      },
    });
    expect(interrupted).toMatchObject({ status: 'pending', reconciliationRequired: true, candidateStatus: 'confirmed' });
    const pendingRoadmap = await fs.readFile(paths.roadmap, 'utf8');
    expect(pendingRoadmap).toContain('feedback: pending');
    expect(pendingRoadmap).toContain('slice: replayed-next — Replay confirmed feedback');

    const reconciled = await reconcileArchiveFeedback({
      projectRoot: root,
      changeName: 'interrupted-adaptive',
      evidence: { learningAssessment: 'learning complete', masteredTopics: ['Replay evidence'] },
    });
    expect(reconciled.status).toBe('complete');
    const finalRoadmap = await fs.readFile(paths.roadmap, 'utf8');
    expect(finalRoadmap).toContain('feedback: complete');
    expect(finalRoadmap.match(/slice: replayed-next/g)?.length).toBe(1);
    expect(finalRoadmap.match(/status: completed/g)?.length).toBe(1);
  });

  it('returns active milestone evidence and an intentional empty reason for a confirmed-empty roadmap', async () => {
    const roadmap = await fixture('roadmap');
    const learner = await fixture('learner');
    const empty = resolveNextRoadmapContext(roadmap, learner);
    expect(empty).toMatchObject({
      status: 'empty',
      emptyReason: 'no-confirmed-candidate',
      activeMilestone: { identity: '1', status: 'active' },
    });

    const readyRoadmap = roadmap.replace(
      '\n- [ ] slice: <change-name> — <学习重点>',
      '\n- [ ] slice: evidence-backed-next — Use mastered lifecycle evidence'
    );
    const ready = resolveNextRoadmapContext(readyRoadmap, learner);
    expect(ready.status).toBe('ready');
    expect(ready.activeMilestone).toMatchObject({ identity: '1', status: 'active' });
    expect(ready.candidates).toMatchObject([{ changeName: 'evidence-backed-next' }]);
  });

  it('matches one exact change name and preserves unrelated roadmap content', async () => {
    const { root, paths } = await projectFixture();
    const roadmap = (await fixture('roadmap'))
      .replace('- [ ] slice: <change-name> — <学习重点>', '- [ ] slice: target-change — parser boundaries')
      .replace('- [ ] slice: <change-name> — <学习重点>', '- [ ] slice: keep-change — unrelated focus');
    await fs.writeFile(paths.roadmap, roadmap, 'utf8');
    const plan = await planArchiveFeedback({
      projectRoot: root,
      changeName: 'target-change',
      outcome: 'learning complete',
      evidence: { learningAssessment: 'learning complete', masteredTopics: ['Parser boundaries'] },
    });

    expect(plan.status).toBe('ready');
    expect(plan.documents.roadmap?.pendingContent?.split(/\r?\n/u).some((line) => line.trimStart().startsWith('- [ ] slice: target-change'))).toBe(false);
    expect(plan.documents.roadmap?.pendingContent).toContain('slice: keep-change — unrelated focus');
    expect(plan.documents.roadmap?.pendingContent).toContain('feedback: pending');
  });

  it('proposes explicit learner records, normalizes duplicates, and does not mine reflection text', () => {
    expect(normalizeFeedbackTopic('  Parser **Boundaries**。 ')).toBe('parser boundaries');
    const proposal = proposeLearnerFeedbackRecords({
      learningAssessment: 'learning complete',
      masteredTopics: ['Parser Boundaries', ' parser boundaries '],
      gaps: ['Error recovery'],
      verificationRecord: 'The learner reflected on a different topic.\n- review: Parser Boundaries',
    });
    expect(proposal.records.map((record) => `${record.kind}:${record.topic}`)).toEqual([
      'gap:Error recovery',
      'review:Parser Boundaries',
      'mastered:Parser Boundaries',
    ]);
    expect(proposal.duplicates.length).toBe(1);
    expect(proposal.records.some((record) => record.topic.includes('reflected'))).toBe(false);

    const incomplete = proposeLearnerFeedbackRecords({
      learningAssessment: 'learning incomplete',
      masteredTopics: ['Must not become mastery'],
      gaps: ['Known gap'],
    });
    expect(incomplete.records.map((record) => record.kind)).toEqual(['gap']);
    const rawIncomplete = proposeLearnerFeedbackRecords({
      verificationRecord: [
        '- Learning-result assessment: learning incomplete',
        '### Mastered topics',
        '- Must not become mastery',
      ].join('\n'),
    });
    expect(rawIncomplete.records).toEqual([]);
  });

  it('prefers canonical feedback, reads explicitly typed legacy evidence, and rejects narrative-only mastery', () => {
    const canonical = [
      '<!-- humanspec:learning-feedback:start version=1 -->',
      '- learning-status: complete',
      '- mastered: Canonical parser boundary',
      '- gap: Canonical diagnostic gap',
      '<!-- humanspec:learning-feedback:end -->',
    ].join('\n');
    const canonicalProposal = proposeLearnerFeedbackRecords({
      learningAssessment: 'learning incomplete',
      masteredTopics: ['Ignored direct evidence'],
      verificationRecord: canonical,
    });
    expect(canonicalProposal.records.map((record) => `${record.kind}:${record.topic}`)).toEqual([
      'gap:Canonical diagnostic gap',
      'mastered:Canonical parser boundary',
    ]);

    const legacyProposal = proposeLearnerFeedbackRecords({
      verificationRecord: [
        '- Learning-result assessment: learning complete',
        '### Mastered topics',
        '- Explicit legacy mastery',
        '- review: Explicit legacy review',
      ].join('\n'),
    });
    expect(legacyProposal.records.map((record) => `${record.kind}:${record.topic}`)).toEqual([
      'review:Explicit legacy review',
      'mastered:Explicit legacy mastery',
    ]);

    const narrativeOnly = proposeLearnerFeedbackRecords({
      verificationRecord: 'Overall disposition: pass\nThe learner described feeling confident about parser boundaries.',
    });
    expect(narrativeOnly.records).toEqual([]);
  });

  it('fails closed for malformed canonical feedback rather than falling back to a narrative mastery claim', async () => {
    const { root } = await projectFixture();
    const plan = await planArchiveFeedback({
      projectRoot: root,
      changeName: 'malformed-canonical-evidence',
      archivedLearningContent: [
        '## AI 验证记录',
        '<!-- humanspec:learning-feedback:start version=1 -->',
        '- learning-status: complete',
        '- mastered: Must not be recovered',
      ].join('\n'),
    });

    expect(plan.status).toBe('blocked');
    expect(plan.issues.some((item) => item.code === 'malformed')).toBe(true);
    expect(plan.learnerRecords).toEqual([]);
  });

  it('models forced incomplete feedback, rejected previews, and later next routing', async () => {
    const { root, paths } = await projectFixture();
    const beforeRoadmap = await fs.readFile(paths.roadmap, 'utf8');
    const beforeLearner = await fs.readFile(paths.learner, 'utf8');
    const plan = await planArchiveFeedback({
      projectRoot: root,
      changeName: 'forced-incomplete-change',
      outcome: 'learning incomplete',
      evidence: {
        learningAssessment: 'learning incomplete',
        masteredTopics: ['Must not be recorded'],
        gaps: ['Forced archive gap'],
      },
    });
    expect(plan.status).toBe('ready');
    expect(plan.archivedOutcome).toBe('learning incomplete');
    expect(plan.learnerRecords.map((record) => record.kind)).toEqual(['gap']);

    const rejected = await applyArchiveFeedback(plan, { confirmed: false });
    expect(rejected.status).toBe('blocked');
    expect(rejected.nextAction).toContain('preview rejected');
    expect(await fs.readFile(paths.roadmap, 'utf8')).toBe(beforeRoadmap);
    expect(await fs.readFile(paths.learner, 'utf8')).toBe(beforeLearner);

    const forced = await applyArchiveFeedback(plan, { confirmed: true });
    expect(forced.status).toBe('complete');
    const forcedRoadmap = await fs.readFile(paths.roadmap, 'utf8');
    const forcedLearner = await fs.readFile(paths.learner, 'utf8');
    expect(forcedRoadmap).toContain('archived: forced-incomplete-change — learning incomplete (feedback: complete)');
    expect(forcedLearner).toContain('- [ ] gap: Forced archive gap');
    expect(forcedLearner).not.toContain('Must not be recorded');

    await fs.writeFile(
      paths.roadmap,
      forcedRoadmap.replace('# 候选切片\n', '# 候选切片\n- [ ] slice: later-change — use updated learner state\n'),
      'utf8'
    );
    const next = resolveNextRoadmapContext(
      await fs.readFile(paths.roadmap, 'utf8'),
      forcedLearner,
      { roadmapPath: paths.roadmap, learnerPath: paths.learner }
    );
    expect(next.status).toBe('ready');
    expect(next.candidates.map((candidate) => candidate.changeName)).toEqual(['later-change']);
    expect(next.archivedChangeNames).toEqual(['forced-incomplete-change']);
    expect(next.learnerRecords.some((record) => record.topic === 'Forced archive gap')).toBe(true);

    await fs.writeFile(paths.roadmap, (await fs.readFile(paths.roadmap, 'utf8')).replace('feedback: complete', 'feedback: pending'), 'utf8');
    const pending = resolveNextRoadmapContext(
      await fs.readFile(paths.roadmap, 'utf8'),
      forcedLearner,
      { roadmapPath: paths.roadmap, learnerPath: paths.learner }
    );
    expect(pending.status).toBe('reconciliation');
    expect(pending.candidates).toEqual([]);
  });

  it('writes pending then complete feedback atomically and reconciles an interrupted learner write', async () => {
    const { root, paths } = await projectFixture();
    const roadmapBefore = await fs.readFile(paths.roadmap, 'utf8');
    const plan = await planArchiveFeedback({
      projectRoot: root,
      changeName: 'interrupted-change',
      outcome: 'learning complete',
      evidence: { learningAssessment: 'learning complete', masteredTopics: ['Atomic feedback'] },
    });
    expect(plan.status).toBe('ready');

    const failed = await applyArchiveFeedback(plan, {
      confirmed: true,
      atomicWrite: async (filePath, content) => {
        if (filePath === paths.learner) throw new Error('simulated learner write failure');
        await fs.writeFile(filePath, content, 'utf8');
      },
    });
    expect(failed.status).toBe('pending');
    expect(failed.writtenDocuments).toEqual(['roadmap']);
    expect(failed.pendingDocuments).toEqual(['learner']);
    expect((await fs.readFile(paths.roadmap, 'utf8')).match(/feedback: pending/g)).toHaveLength(1);
    expect((await fs.readFile(paths.roadmap, 'utf8'))).not.toBe(roadmapBefore);
    expect((await fs.readFile(paths.learner, 'utf8'))).not.toContain('Atomic feedback');

    const reconciled = await reconcileArchiveFeedback({
      projectRoot: root,
      changeName: 'interrupted-change',
      evidence: { learningAssessment: 'learning complete', masteredTopics: ['Atomic feedback'] },
    });
    expect(reconciled.status).toBe('complete');
    expect(reconciled.writtenDocuments).toEqual(['learner', 'roadmap']);
    expect(reconciled.pendingDocuments).toEqual([]);
    expect((await fs.readFile(paths.roadmap, 'utf8')).match(/feedback: complete/g)).toHaveLength(1);
    expect((await fs.readFile(paths.learner, 'utf8'))).toContain('- [ ] mastered: Atomic feedback');
    expect(findPendingArchiveFeedback(await fs.readFile(paths.roadmap, 'utf8'))).toEqual([]);

    const archivedDir = path.join(root, 'openspec', 'changes', 'archive', '2026-01-01-interrupted-change');
    await fs.mkdir(archivedDir, { recursive: true });
    await fs.writeFile(
      path.join(archivedDir, 'learning.md'),
      [
        '## 本次学习契约',
        '- **主要学习目标：** Recover archived verification feedback',
        '',
        '## 开始前',
        'I can explain the original parser boundary.',
        '',
        '## 实践任务',
        '- [x] 1. Verify the bounded feedback region',
        '',
        '## 卡住时的记录',
        '- no stuck episode: not applicable for this focused verification',
        '',
        '## 完成后',
        'I can reimplement the parser without looking at the prior change.',
        '',
        '## AI 验证记录',
        '<!-- humanspec:learning-feedback:start version=1 -->',
        '- learning-status: complete',
        '- mastered: Archived evidence',
        '- gap: Archived follow-up gap',
        '- review: Archived review item',
        '<!-- humanspec:learning-feedback:end -->',
        '',
      ].join('\n'),
      'utf8'
    );
    await fs.writeFile(
      paths.learner,
      (await fs.readFile(paths.learner, 'utf8'))
        .replace('- [ ] mastered: Atomic feedback\n', '')
        .replace('- [ ] gap: Archived follow-up gap\n', '')
        .replace('- [ ] review: Archived review item\n', ''),
      'utf8'
    );
    const fromArchivedEvidence = await reconcileArchiveFeedback({
      projectRoot: root,
      changeName: 'interrupted-change',
      archivedPath: archivedDir,
    });
    expect(fromArchivedEvidence.status).toBe('complete');
    const reconciledLearner = await fs.readFile(paths.learner, 'utf8');
    expect(reconciledLearner).toContain('- [ ] mastered: Archived evidence');
    expect(reconciledLearner).toContain('- [ ] gap: Archived follow-up gap');
    expect(reconciledLearner).toContain('- [ ] review: Archived review item');

    const already = await reconcileArchiveFeedback({
      projectRoot: root,
      changeName: 'interrupted-change',
      archivedPath: archivedDir,
    });
    expect(already.status).toBe('already-applied');
    const repeatedLearner = await fs.readFile(paths.learner, 'utf8');
    expect(repeatedLearner.match(/mastered: Archived evidence/g)).toHaveLength(1);
    expect(repeatedLearner.match(/gap: Archived follow-up gap/g)).toHaveLength(1);
    expect(repeatedLearner.match(/review: Archived review item/g)).toHaveLength(1);
  });

  it('fails closed and validates every bound document before the first write', async () => {
    const { root, paths } = await projectFixture();
    const plan = await planArchiveFeedback({
      projectRoot: root,
      changeName: 'preflight-change',
      evidence: { learningAssessment: 'learning complete', masteredTopics: ['Preflight checks'] },
    });
    const roadmapPlan = plan.documents.roadmap!;
    const learnerPlan = plan.documents.learner!;
    expect(roadmapPlan.beforeSha256).toBe(createHash('sha256').update(await fs.readFile(paths.roadmap)).digest('hex'));
    expect(learnerPlan.beforeSha256).toBe(createHash('sha256').update(await fs.readFile(paths.learner)).digest('hex'));

    const beforeRoadmap = await fs.readFile(paths.roadmap, 'utf8');
    const beforeLearner = await fs.readFile(paths.learner, 'utf8');
    const omittedConfirmation = await applyArchiveFeedback(plan);
    expect(omittedConfirmation.status).toBe('blocked');
    expect(omittedConfirmation.issues.some((item) => item.code === 'confirmation-required')).toBe(true);
    expect(await fs.readFile(paths.roadmap, 'utf8')).toBe(beforeRoadmap);
    expect(await fs.readFile(paths.learner, 'utf8')).toBe(beforeLearner);

    const changedPath = {
      ...plan,
      documents: {
        ...plan.documents,
        learner: { ...learnerPlan, path: path.join(root, 'outside-registered-target.md') },
      },
    };
    const pathConflict = await applyArchiveFeedback(changedPath, { confirmed: true });
    expect(pathConflict.status).toBe('conflict');
    expect(pathConflict.writtenDocuments).toEqual([]);
    expect(await fs.readFile(paths.roadmap, 'utf8')).toBe(beforeRoadmap);
    expect(await fs.readFile(paths.learner, 'utf8')).toBe(beforeLearner);

    await fs.appendFile(paths.learner, '\nLearner edit after preview.\n', 'utf8');
    const staleConflict = await applyArchiveFeedback(plan, { confirmed: true });
    expect(staleConflict.status).toBe('conflict');
    expect(staleConflict.writtenDocuments).toEqual([]);
    expect(await fs.readFile(paths.roadmap, 'utf8')).toBe(beforeRoadmap);
    expect(await fs.readFile(paths.learner, 'utf8')).toContain('Learner edit after preview.');
  });

  it('reports atomic failures and concurrent learner edits instead of overwriting them', async () => {
    const { root, paths } = await projectFixture();
    const plan = await planArchiveFeedback({
      projectRoot: root,
      changeName: 'failure-change',
      evidence: { learningAssessment: 'learning complete', masteredTopics: ['Failure handling'] },
    });
    const failed = await applyArchiveFeedback(plan, {
      confirmed: true,
      atomicWrite: async () => { throw new Error('read-only'); },
    });
    expect(failed.status).toBe('pending');
    expect(failed.reconciliationRequired).toBe(true);
    expect(failed.pendingDocuments).toEqual(['roadmap', 'learner']);
    expect(await fs.readFile(paths.roadmap, 'utf8')).toBe(await fixture('roadmap'));

    const freshPlan = await planArchiveFeedback({
      projectRoot: root,
      changeName: 'conflict-change',
      evidence: { learningAssessment: 'learning complete', masteredTopics: ['Conflict handling'] },
    });
    await fs.appendFile(paths.learner, '\nLearner changed this while preview was open.\n');
    const conflict = await applyArchiveFeedback(freshPlan, { confirmed: true });
    expect(conflict.status).toBe('conflict');
    expect(await fs.readFile(paths.learner, 'utf8')).toContain('Learner changed this');
  });

  it('uses path.join destinations and preserves CRLF documents on Windows-style roots', async () => {
    const root = path.win32.resolve('C:', 'workspace', 'learner');
    const windowsPaths = resolveProjectDocumentPaths(root);
    for (const template of PROJECT_DOC_TEMPLATES) {
      expect(windowsPaths[template.id]).toBe(path.win32.join(root, 'openspec', template.fileName));
    }

    const roadmap = (await fixture('roadmap')).replace(/\n/g, '\r\n');
    const analysis = analyzeProjectDocument('roadmap', roadmap, path.win32.join(root, 'openspec', 'roadmap.md'));
    expect(analysis.status).toBe('valid');
    expect(analysis.lineEnding).toBe('\r\n');

    const fixtureProject = await projectFixture();
    for (const id of PROJECT_DOC_TEMPLATES.map((template) => template.id)) {
      const content = await fs.readFile(fixtureProject.paths[id], 'utf8');
      await fs.writeFile(fixtureProject.paths[id], content.replace(/\n/g, '\r\n'), 'utf8');
    }
    const unrelatedRoadmap = '\r\n## 保留的路线图笔记\r\nDo not rewrite this note.\r\n';
    const unrelatedLearner = '\r\n## 保留的学习者笔记\r\nDo not rewrite this note.\r\n';
    await fs.appendFile(fixtureProject.paths.roadmap, unrelatedRoadmap, 'utf8');
    await fs.appendFile(fixtureProject.paths.learner, unrelatedLearner, 'utf8');
    const plan = await planArchiveFeedback({
      projectRoot: fixtureProject.root,
      changeName: 'crlf-change',
      evidence: { learningAssessment: 'learning complete', masteredTopics: ['CRLF safety'] },
    });
    expect(plan.status).toBe('ready');
    expect(plan.documents.roadmap?.pendingContent).toContain('\r\n');
    expect(plan.documents.learner?.proposedContent).toContain('\r\n');
    const applied = await applyArchiveFeedback(plan, { confirmed: true });
    expect(applied.status).toBe('complete');
    const writtenRoadmap = await fs.readFile(fixtureProject.paths.roadmap, 'utf8');
    expect(writtenRoadmap).toContain('\r\n');
    expect(writtenRoadmap.replace(/\r\n/g, '')).not.toContain('\n');
    expect(writtenRoadmap).toContain(unrelatedRoadmap);
    expect(await fs.readFile(fixtureProject.paths.learner, 'utf8')).toContain(unrelatedLearner);

    const reconciled = await reconcileArchiveFeedback({
      projectRoot: fixtureProject.root,
      changeName: 'crlf-change',
      evidence: { learningAssessment: 'learning complete', masteredTopics: ['CRLF safety'] },
    });
    expect(reconciled.status).toBe('already-applied');
    expect(await fs.readFile(fixtureProject.paths.roadmap, 'utf8')).toContain(unrelatedRoadmap);
    expect(await fs.readFile(fixtureProject.paths.learner, 'utf8')).toContain(unrelatedLearner);
  });
});
