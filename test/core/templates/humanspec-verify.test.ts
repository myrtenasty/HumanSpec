import { afterEach, describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import {
  getHumanspecVerifyCommandTemplate,
  getHumanspecVerifySkillTemplate,
} from '../../../src/core/templates/skill-templates.js';
import {
  generateSkillContent,
  getCommandContents,
  getSkillTemplates,
} from '../../../src/core/shared/skill-generation.js';
import {
  HUMANSPEC_IMPLEMENTATION_BOUNDARY,
  HUMANSPEC_PROJECT_DOCS,
} from '../../../src/core/templates/workflows/humanspec-shared.js';
import {
  PROJECT_DOC_TEMPLATES,
  resolveProjectDocPath,
} from '../../../src/core/templates/project-docs.js';
import {
  getChangeDir,
  resolveCurrentPlanningHomeSync,
} from '../../../src/core/planning-home.js';

const skill = getHumanspecVerifySkillTemplate();
const command = getHumanspecVerifyCommandTemplate();
const bodies: Array<[string, string]> = [
  ['skill', skill.instructions],
  ['command', command.content],
];

function normalized(body: string): string {
  return body.replace(/\s+/g, ' ');
}

function sectionBody(markdown: string, heading: string): string {
  const headingStart = markdown.indexOf(heading);
  if (headingStart === -1) return '';
  const bodyStart = headingStart + heading.length;
  const nextHeading = markdown.indexOf('\n## ', bodyStart);
  return markdown.slice(bodyStart, nextHeading === -1 ? markdown.length : nextHeading);
}

function hasLearnerEvidence(markdown: string, heading: string): boolean {
  return sectionBody(markdown, heading)
    .replace(/<!--[\s\S]*?-->/g, '')
    .trim().length > 0;
}

/** A fixture-level model of the exact reserved-section replacement contract. */
function replaceVerificationBody(markdown: string, record: string): string {
  const heading = '## AI 验证记录';
  const occurrences = markdown.split('\n').filter((line) => line === heading).length;
  if (occurrences !== 1) {
    throw new Error('AI 验证记录 heading is missing or duplicated');
  }

  const headingStart = markdown.indexOf(heading);
  const bodyStart = headingStart + heading.length;
  const nextHeading = markdown.indexOf('\n## ', bodyStart);
  const suffix = nextHeading === -1 ? '' : markdown.slice(nextHeading);
  return `${markdown.slice(0, bodyStart)}\n${record}${suffix}`;
}

const TEMPLATE_ONLY_LEARNING_ARTIFACT = [
  '## 开始前',
  '',
  '<!-- 人类学习者填写：我目前如何理解这个问题？我预期哪里最难？ -->',
  '',
  '## 实践任务',
  '',
  '- [ ] 1. <!-- practice task and its verification evidence -->',
  '',
  '## 卡住时的记录',
  '',
  '<!-- 人类学习者填写：已尝试的方法、观察到的证据、当前假设、需要的最小提示。 -->',
  '',
  '## 完成后',
  '',
  '<!-- 人类学习者填写：学到了什么？原有理解发生了什么变化？下次会怎么做？ -->',
  '',
  '## AI 验证记录',
  '',
  '<!-- 仅供 AI 在人类完成实现后填写：验证步骤、观察结果、剩余风险。 -->',
  '',
].join('\n');

const LEARNER_OWNED_LEARNING_ARTIFACT = [
  '## 开始前',
  '',
  '我理解请求会经过校验，但还不清楚边界错误在哪里。',
  '',
  '## 实践任务',
  '',
  '- [x] 1. Reproduce the validation result',
  '',
  '## 卡住时的记录',
  '',
  '- attempted approach: inspected the request boundary',
  '- observation: the response omitted the required field',
  '- hypothesis: the parser drops the field before validation',
  '- requested hint: point to the smallest diagnostic check',
  '',
  '## 完成后',
  '',
  '我学会先确认数据流，再决定应该在哪一层修正它。',
  '',
  '## AI 验证记录',
  '',
  'old verification result',
  '',
].join('\n');

describe('HumanSpec verify workflow templates', () => {
  const tempDirs: string[] = [];

  afterEach(() => {
    for (const tempDir of tempDirs.splice(0)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('keeps the skill and namespaced command on one canonical verify contract', () => {
    expect(skill.instructions).toBe(command.content);
    expect(skill.name).toBe('humanspec-verify');
    expect(command.name).toBe('HUMANSPEC: Verify');
    expect(command.category).toBe('Workflow');
    expect(command.tags).toEqual(['workflow', 'humanspec', 'verify']);

    for (const [label, body] of bodies) {
      expect(body, label).toContain(HUMANSPEC_IMPLEMENTATION_BOUNDARY);
      expect(body, label).toContain(HUMANSPEC_PROJECT_DOCS);
      expect(body, label).toContain(
        'Write boundary: this workflow writes review output and the reserved AI verification area of learning.md only'
      );
    }
  });

  it('resolves one structured change and all registered project context before evidence', () => {
    for (const [label, body] of bodies) {
      const text = normalized(body);
      for (const marker of [
        'openspec list --json',
        'openspec status --change "<name>" --json',
        'openspec instructions apply --change "<name>" --json',
        'schemaName',
        'planningHome',
        'changeRoot',
        'actionContext',
        'artifactPaths',
        'contextFiles',
        'state',
        'progress',
        'tasks',
        'openspec humanspec context inspect --json',
        'data.documents',
        'public source of truth',
        'classifications',
        'templates',
        'issues',
        'project',
        'roadmap',
        'learner',
      ]) {
        expect(text, `${label}: ${marker}`).toContain(marker);
      }

      expect(text.indexOf('Select exactly one change'), label).toBeGreaterThanOrEqual(0);
      expect(text.indexOf('Select exactly one change'), label).toBeLessThan(
        text.indexOf('Gate on learner-owned practice evidence')
      );
      expect(text, label).toContain('multiple active changes');
      expect(text, label).toContain('never choose the first, newest, or most recently modified change silently');
      expect(text, label).toContain('If the instruction state is `blocked`');
      expect(text, label).toContain('Read every concrete path returned under `contextFiles`');
      expect(text, label).toContain('Before reviewing application or test evidence');
      expect(text, label).toContain('not proof that a task or requirement passed');
    }
  });

  it('gates learning completion on tasks, reflections, and recorded stuck evidence', () => {
    for (const [label, body] of bodies) {
      const text = normalized(body);
      for (const marker of [
        '## 开始前',
        '## 实践任务',
        '## 卡住时的记录',
        '## 完成后',
        '## AI 验证记录',
        'Every practice-task checkbox',
        '`- [x]`',
        '`- [ ]`',
        'substantive, learner-authored reflection',
        'template-only',
        'attempted approach, observation, hypothesis, and requested hint',
        'partial episode is a blocking evidence gap',
        'byte-for-byte unchanged',
      ]) {
        expect(text, `${label}: ${marker}`).toContain(marker);
      }
      expect(text, label).toContain('does not count as evidence');
      expect(text, label).toContain('even when the implementation or tests appear to work');
      expect(text, label).toContain('Verification does not fill, summarize, or rewrite any learner reflection');
    }
  });

  it('requires a three-way contract evidence disposition', () => {
    for (const [label, body] of bodies) {
      const text = normalized(body);
      for (const marker of [
        'proposal\'s observable outcome',
        'completion evidence',
        'delta-spec requirement and scenario',
        'implementation evidence',
        'relevant project check',
        '`pass`, `fail`, or `inconclusive`',
        'A file existing',
        'cannot be reproduced',
        'Blocking findings',
        'Non-blocking suggestions',
        'Learner-owned next action',
      ]) {
        expect(text, `${label}: ${marker}`).toContain(marker);
      }
      expect(text, label).toContain('a passing test does not prove that the learner completed the practice');
      expect(text, label).toContain('required item is software-passing only when its evidence is reproducible');
    }
  });

  it('defines an idempotent reserved-section update and ownership boundary', () => {
    for (const [label, body] of bodies) {
      const text = normalized(body);
      for (const marker of [
        'count exact level-two headings named `## AI 验证记录`',
        'missing or appears more than once',
        'make no write',
        'replace only its body',
        'next level-two heading or end of file',
        'one latest-result record',
        '### Latest result',
        'Overall disposition: pass | fail | inconclusive',
        'Learning-result assessment:',
        '### Gate dispositions',
        '### Contract evidence',
        '### Blocking findings',
        '### Suggestions',
        '### Next learner action',
        'On a retry, replace the prior AI-owned body',
        'do not append a second result',
        'application code, test implementation code',
        'every practice-task checkbox and description',
        'Keep the existing `humanspec-verify` workflow identity',
        'internal `openspec instructions apply` protocol',
        'not a new public `apply` workflow',
      ]) {
        expect(text, `${label}: ${marker}`).toContain(marker);
      }
    }
  });

  it('routes dispositions without claiming later workflows', () => {
    for (const [label, body] of bodies) {
      const text = normalized(body);
      expect(text, label).toContain('directs the learner to /humanspec:coach');
      expect(text, label).toContain('passing review recommends /humanspec:archive');
      expect(text, label).toContain('Do not execute archive');
      expect(text, label).toContain('adaptive `humanspec-next`');
      expect(text, label).toContain('learning-aware archive feedback');
      expect(text, label).toContain('roadmap mutation');
      expect(text, label).toContain('learner-history updates');
      expect(text, label).toContain('Verification does not provide adaptive /humanspec:next behavior');
    }
  });

  it('proves template-only reflections are not learner evidence', () => {
    expect(hasLearnerEvidence(TEMPLATE_ONLY_LEARNING_ARTIFACT, '## 开始前')).toBe(false);
    expect(hasLearnerEvidence(TEMPLATE_ONLY_LEARNING_ARTIFACT, '## 完成后')).toBe(false);
    expect(hasLearnerEvidence(LEARNER_OWNED_LEARNING_ARTIFACT, '## 开始前')).toBe(true);
    expect(hasLearnerEvidence(LEARNER_OWNED_LEARNING_ARTIFACT, '## 完成后')).toBe(true);
    expect(sectionBody(TEMPLATE_ONLY_LEARNING_ARTIFACT, '## 实践任务')).toContain('- [ ] 1.');
    expect(sectionBody(LEARNER_OWNED_LEARNING_ARTIFACT, '## 实践任务')).toContain('- [x] 1.');
  });

  it('preserves learner-owned content across reserved-section retries', () => {
    const firstRecord = [
      '### Latest result',
      '- Selected change: practice-slice',
      '- Overall disposition: inconclusive',
      '',
      '### Blocking findings',
      '- The build check needs learner reproduction.',
    ].join('\n');
    const secondRecord = [
      '### Latest result',
      '- Selected change: practice-slice',
      '- Overall disposition: pass',
      '',
      '### Blocking findings',
      '- none',
    ].join('\n');

    const afterFirst = replaceVerificationBody(LEARNER_OWNED_LEARNING_ARTIFACT, firstRecord);
    const afterSecond = replaceVerificationBody(afterFirst, secondRecord);
    const learnerOwnedBefore = LEARNER_OWNED_LEARNING_ARTIFACT
      .replace(/\n## AI 验证记录[\s\S]*$/u, '');
    const learnerOwnedAfter = afterSecond.replace(/\n## AI 验证记录[\s\S]*$/u, '');

    expect(learnerOwnedAfter).toBe(learnerOwnedBefore);
    expect(afterSecond).toContain(secondRecord);
    expect(afterSecond).not.toContain(firstRecord);
    expect(afterSecond.match(/### Latest result/g)).toHaveLength(1);
    expect(() => replaceVerificationBody(
      `${LEARNER_OWNED_LEARNING_ARTIFACT}\n\n## AI 验证记录`,
      secondRecord
    )).toThrow(/missing or duplicated/);
  });

  it('projects equivalent skill and command content through the registries', () => {
    const skillEntries = getSkillTemplates(['humanspec-verify']);
    const commandEntries = getCommandContents(['humanspec-verify']);

    expect(skillEntries).toHaveLength(1);
    expect(commandEntries).toHaveLength(1);
    expect(skillEntries[0]).toMatchObject({
      dirName: 'humanspec-verify',
      workflowId: 'humanspec-verify',
      namespace: 'humanspec',
    });
    expect(commandEntries[0]).toMatchObject({
      id: 'verify',
      namespace: 'humanspec',
      name: 'HUMANSPEC: Verify',
    });
    expect(commandEntries[0].body).toBe(skillEntries[0].template.instructions);

    const generated = generateSkillContent(skillEntries[0].template, 'TEST');
    expect(generated).toContain(skillEntries[0].template.instructions);
    expect(generated).toContain('name: humanspec-verify');
    expect(generated).toContain('allowed-tools: Bash(openspec:*)');
    expect(generated).toContain('## AI 验证记录');
  });

  it('resolves the same logical change and context paths with platform-aware helpers', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'openspec-humanspec-verify-'));
    tempDirs.push(tempDir);
    const projectRoot = path.resolve(tempDir, 'project');
    const changeName = 'practice-verify-paths';
    const changeDir = path.join(projectRoot, 'openspec', 'changes', changeName);
    fs.mkdirSync(changeDir, { recursive: true });

    const planningHome = resolveCurrentPlanningHomeSync({
      startPath: changeDir,
      allowImplicitRepoRoot: false,
    });
    expect(planningHome.root).toBe(fs.realpathSync.native(projectRoot));
    expect(getChangeDir(planningHome, changeName)).toBe(
      path.join(planningHome.root, 'openspec', 'changes', changeName)
    );

    for (const document of PROJECT_DOC_TEMPLATES) {
      expect(resolveProjectDocPath(planningHome.root, document.id)).toBe(
        path.join(planningHome.root, 'openspec', document.fileName)
      );
    }

    const windowsRoot = path.win32.resolve('C:', 'workspace', 'humanspec-project');
    const windowsChangeDir = path.win32.join(
      windowsRoot,
      'openspec',
      'changes',
      changeName
    );
    expect(path.win32.basename(windowsChangeDir)).toBe(changeName);
    expect(path.win32.dirname(windowsChangeDir)).toBe(
      path.win32.join(windowsRoot, 'openspec', 'changes')
    );
    for (const document of PROJECT_DOC_TEMPLATES) {
      const windowsDocumentPath = path.win32.join(
        windowsRoot,
        'openspec',
        document.fileName
      );
      expect(path.win32.dirname(windowsDocumentPath)).toBe(
        path.win32.join(windowsRoot, 'openspec')
      );
      expect(path.win32.basename(windowsDocumentPath)).toBe(document.fileName);
    }
  });
});
