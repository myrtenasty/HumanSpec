import { afterEach, describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import {
  getHumanspecCoachCommandTemplate,
  getHumanspecCoachSkillTemplate,
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

const skill = getHumanspecCoachSkillTemplate();
const command = getHumanspecCoachCommandTemplate();
const bodies: Array<[string, string]> = [
  ['skill', skill.instructions],
  ['command', command.content],
];

function normalized(body: string): string {
  return body.replace(/\s+/g, ' ');
}

describe('HumanSpec coach workflow templates', () => {
  const tempDirs: string[] = [];

  afterEach(() => {
    for (const tempDir of tempDirs.splice(0)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('keeps the skill and namespaced command on one canonical coaching contract', () => {
    expect(skill.instructions).toBe(command.content);
    expect(skill.name).toBe('humanspec-coach');
    expect(command.name).toBe('HUMANSPEC: Coach');
    expect(command.category).toBe('Workflow');
    expect(command.tags).toEqual(['workflow', 'humanspec', 'coach']);

    for (const [label, body] of bodies) {
      expect(body, label).toContain(HUMANSPEC_IMPLEMENTATION_BOUNDARY);
      expect(body, label).toContain(HUMANSPEC_PROJECT_DOCS);
      expect(body, label).toContain('Write boundary: this workflow makes no implementation writes');
    }
  });

  it('resolves one change and current task from structured status and instruction output', () => {
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
        'contextFiles',
        'state',
        'progress',
        'tasks',
        'the first learner task whose `done` value is false',
        '本次学习契约',
        '实践任务',
        '卡住时的记录',
      ]) {
        expect(text, `${label}: ${marker}`).toContain(marker);
      }

      expect(text, label).toContain('multiple active changes');
      expect(text, label).toContain('ask the learner to select one');
      expect(text, label).toContain('never choose the first, newest, or most recently modified change silently');
      expect(text, label).toContain('If the state is `blocked`');
      expect(text, label).toContain('If every task is complete');
      expect(text, label).toContain('Never silently switch changes or invent a task');
      expect(text, label).toContain("the CLI's `context` as required project instruction input");
      expect(text, label).toContain('`operationGuidance` as optional additive advice');
    }
  });

  it('orders progressive hints from least revealing to bounded level three', () => {
    for (const [label, body] of bodies) {
      const text = normalized(body);
      const levelOne = text.indexOf('Level 1 — concept and checking questions');
      const levelTwo = text.indexOf('Level 2 — targeted orientation');
      const levelThree = text.indexOf('Level 3 — bounded guidance');

      expect(levelOne, `${label}: level one`).toBeGreaterThan(-1);
      expect(levelTwo, `${label}: level two`).toBeGreaterThan(levelOne);
      expect(levelThree, `${label}: level three`).toBeGreaterThan(levelTwo);
      expect(text, label).toContain('Every coaching response must label its level');
      expect(text, label).toContain('escalate one level at a time only after the learner explicitly asks');
      expect(text, label).toContain('concept and checking questions');
      expect(text, label).toContain('modules, symbols, data flow');
      expect(text, label).toContain('pseudocode fragment, API shape, or local example');
      expect(text, label).toContain('must not become a complete, copy-ready application or test solution');
      expect(text, label).toContain('A request for a complete solution does not authorize implementation');
    }
  });

  it('requires evidence-first diagnosis and an actionable learner experiment', () => {
    for (const [label, body] of bodies) {
      const text = normalized(body);
      for (const evidence of [
        'attempted approach',
        'observed output or behavior',
        'current hypothesis',
        'smallest hint requested',
        'smallest useful code excerpt',
        'failing test',
        'learner-run diagnostic step',
        'confirm the hypothesis',
        'reject it',
      ]) {
        expect(text, `${label}: ${evidence}`).toContain(evidence);
      }
      expect(text, label).toContain('do not claim a root cause without an observation');
      expect(text, label).toContain('explain the underlying concept in terms of the current task');
    }
  });

  it('preserves implementation, reflection, checkbox, and resume ownership', () => {
    for (const [label, body] of bodies) {
      const text = normalized(body);
      for (const boundary of [
        'This coach makes no file writes',
        'Do not edit application or test files',
        'learning reflections',
        'task checkboxes',
        'do not append a coaching transcript',
        '卡住时的记录',
        'attempted approach, observation, hypothesis, and requested hint',
        're-run the selected change\'s status and apply instruction lookup',
        'preserve the learner\'s implementation approach and last requested level',
        'ask the learner to select or restate the context instead of switching silently',
        'Conversation history is not durable state',
        '/humanspec:verify',
      ]) {
        expect(text, `${label}: ${boundary}`).toContain(boundary);
      }
    }
  });

  it('keeps explicit non-goals out of the implementation boundary', () => {
    for (const [label, body] of bodies) {
      const text = normalized(body);
      for (const nonGoal of [
        'public apply command',
        'session database',
        'persist chat transcripts',
        'write reflections',
        'mark tasks complete',
        'adaptive routing',
        'reflection gates',
        'update the roadmap',
        'learning-aware archive behavior',
      ]) {
        expect(text, `${label}: ${nonGoal}`).toContain(nonGoal);
      }
    }
  });

  it('projects the same coach content through registered skill and command factories', () => {
    const skillEntries = getSkillTemplates(['humanspec-coach']);
    const commandEntries = getCommandContents(['humanspec-coach']);

    expect(skillEntries).toHaveLength(1);
    expect(commandEntries).toHaveLength(1);
    expect(skillEntries[0]).toMatchObject({
      dirName: 'humanspec-coach',
      workflowId: 'humanspec-coach',
      namespace: 'humanspec',
    });
    expect(commandEntries[0]).toMatchObject({
      id: 'coach',
      namespace: 'humanspec',
      name: 'HUMANSPEC: Coach',
    });
    expect(commandEntries[0].body).toBe(skillEntries[0].template.instructions);

    const generated = generateSkillContent(skillEntries[0].template, 'TEST');
    expect(generated).toContain(skillEntries[0].template.instructions);
    expect(generated).toContain('name: humanspec-coach');
    expect(generated).toContain('allowed-tools: Bash(openspec:*)');
    expect(commandEntries[0].body).toContain(HUMANSPEC_IMPLEMENTATION_BOUNDARY);
  });

  it('resolves the same logical change and context paths with platform-aware helpers', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'openspec-humanspec-coach-'));
    tempDirs.push(tempDir);
    const projectRoot = path.resolve(tempDir, 'project');
    const changeName = 'practice-coach-paths';
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
