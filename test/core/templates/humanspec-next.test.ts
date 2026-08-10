import * as fs from 'node:fs';
import * as os from 'node:os';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  getHumanspecNextCommandTemplate,
  getHumanspecNextSkillTemplate,
} from '../../../src/core/templates/skill-templates.js';
import {
  HUMANSPEC_CHANGE_SIZING_GUIDANCE,
  HUMANSPEC_FIT_REPORT_GUIDANCE,
  HUMANSPEC_IMPLEMENTATION_BOUNDARY,
  HUMANSPEC_PROJECT_DOCS,
  HUMANSPEC_SIZING_CRITERIA,
} from '../../../src/core/templates/workflows/humanspec-shared.js';
import {
  generateSkillContent,
  getCommandContents,
  getSkillTemplates,
} from '../../../src/core/shared/skill-generation.js';
import { getCommandDescriptorForWorkflow } from '../../../src/core/templates/command-descriptors.js';
import {
  CommandAdapterRegistry,
  generateCommand,
} from '../../../src/core/command-generation/index.js';
import {
  PROJECT_DOC_TEMPLATES,
  resolveProjectDocPath,
} from '../../../src/core/templates/project-docs.js';
import {
  getChangeDir,
  resolveCurrentPlanningHomeSync,
  type PlanningHome,
} from '../../../src/core/planning-home.js';

const skill = getHumanspecNextSkillTemplate();
const command = getHumanspecNextCommandTemplate();
const bodies: Array<[string, string]> = [
  ['skill', skill.instructions],
  ['command', command.content],
];

function normalized(body: string): string {
  return body.replace(/\s+/g, ' ');
}

describe('HumanSpec next workflow templates', () => {
  it('keeps the skill and namespaced command on one canonical router contract', () => {
    expect(skill.instructions).toBe(command.content);
    expect(skill.name).toBe('humanspec-next');
    expect(command.name).toBe('HUMANSPEC: Next');
    expect(command.category).toBe('Workflow');
    expect(command.tags).toEqual(['workflow', 'humanspec', 'next']);

    for (const [label, body] of bodies) {
      expect(body, label).toContain(HUMANSPEC_IMPLEMENTATION_BOUNDARY);
      expect(body, label).toContain(HUMANSPEC_PROJECT_DOCS);
      expect(body, label).toContain(HUMANSPEC_CHANGE_SIZING_GUIDANCE);
      expect(body, label).toContain(HUMANSPEC_FIT_REPORT_GUIDANCE);
      for (const criterion of HUMANSPEC_SIZING_CRITERIA) {
        expect(body, `${label}: ${criterion.id}`).toContain(`[${criterion.id}]`);
      }
      expect(body, label).toContain(
        'Write boundary: this workflow provides routing and bounded planning guidance'
      );
      expect(body, label).toContain('one explicitly');
      expect(body, label).toContain('planning artifact');
    }
  });

  it('reads every structured source before selecting a state', () => {
    for (const [label, body] of bodies) {
      const text = normalized(body);
      for (const marker of [
        'openspec list --json',
        'openspec status --change "<name>" --json',
        'openspec instructions <artifact-id> --change "<name>" --json',
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
        'tracks',
        'instruction',
        'openspec humanspec context inspect --json',
        'openspec humanspec context next --json',
        'versioned envelope',
        'data.documents',
        '`blocked`, `reconciliation`, `ready`, and `empty`',
        'parsed candidates',
        'active milestone',
        'empty reason code',
        'package-internal helpers',
        'project',
        'roadmap',
        'learner',
        'evidence',
        'blockers',
      ]) {
        expect(text, `${label}: ${marker}`).toContain(marker);
      }

      expect(text, label).toContain('read every concrete path returned under `contextFiles`');
      expect(text, label).toContain('context` is required project instruction input');
      expect(text, label).toContain('operationGuidance` is advisory');
      expect(text, label).toContain('do not replace them with a directory scan');
    }
  });

  it('pins the deterministic project-to-archive precedence and all learner handoffs', () => {
    const expectedStates = [
      'project context is missing, malformed, unmarked, or unresolved',
      'more than one active change can be resumed',
      'no active change has a confirmed roadmap slice',
      'the selected change has a next uncompleted planning artifact',
      'planning is complete and a learner-owned practice task remains',
      'practice tasks are complete but a required learner reflection remains',
      'learner evidence is ready but verification is absent, failed, or blocked',
      'verification has a passing disposition and archive is the next handoff',
    ];

    for (const [label, body] of bodies) {
      const text = normalized(body);
      let previous = -1;
      for (const state of expectedStates) {
        const position = text.indexOf(state);
        expect(position, `${label}: ${state}`).toBeGreaterThan(previous);
        previous = position;
      }

      for (const handoff of [
        '/humanspec:init',
        '/humanspec:propose',
        '/humanspec:coach',
        '/humanspec:verify',
        '/humanspec:archive',
      ]) {
        expect(text, `${label}: ${handoff}`).toContain(handoff);
      }
      for (const state of [
        'project-not-ready',
        'choice-required',
        'roadmap-propose',
        'planning',
        'practice',
        'reflection',
        'verify',
        'archive',
      ]) {
        expect(text, `${label}: normalized ${state}`).toContain(state);
      }
      expect(text, label).toContain('more than one candidate remains plausible');
      expect(text, label).toContain('classification is `fit`');
      expect(text, label).toContain('`oversized` or `unresolved`');
      expect(text, label).toContain('learner-confirmed refinement or propose splitting');
      expect(text, label).toContain('no-confirmed-candidate');
      expect(text, label).toContain('intentionally has no confirmed candidate');
      expect(text, label).toContain('exactly one recommended next action');
      expect(text, label).toContain('Reason');
      expect(text, label).toContain('Evidence');
      expect(text, label).toContain('Blockers');
      expect(text, label).toContain('Ownership boundary');
    }
  });

  it('covers roadmap, planning, practice, reflection, verification, and archive recovery', () => {
    const scenarios: Array<[string, string]> = [
      ['no active change', 'no active change'],
      ['incomplete artifact', 'next uncompleted planning artifact'],
      ['practice task', 'first learner task whose `done` value is false'],
      ['reflection', 'required learner reflection remains'],
      ['verify', 'route to `/humanspec:verify`'],
      ['archive', 'Route to `/humanspec:archive`'],
      ['paused resume', 'paused change is resumed at the first unresolved state'],
      ['manual conflict', 'structured status, artifact contents, learning evidence, or validation disagree'],
      ['failed verification', 'failed, inconclusive, or reports a blocking inconsistency'],
    ];

    for (const [name, marker] of scenarios) {
      for (const [label, body] of bodies) {
        expect(normalized(body), `${name} / ${label}`).toContain(marker);
      }
    }

    for (const [label, body] of bodies) {
      const text = normalized(body);
      expect(text, label).toContain('Preserve propose\'s explicit confirmation gate');
      expect(text, label).toContain('never run `openspec new change`');
      expect(text, label).toContain('Never choose the first, newest, smallest, or most recently modified change silently');
      expect(text, label).toContain('do no routing for an unchosen change');
      expect(text, label).toContain('Do not delete, overwrite, or silently normalize learner files');
      expect(text, label).toContain('report a race as already complete');
      expect(text, label).toContain('Template comments, empty sections');
      expect(text, label).toContain('Do not infer a pass from a file existing');
    }
  });

  it('keeps next idempotent and outside learner-owned records', () => {
    for (const [label, body] of bodies) {
      const text = normalized(body);
      for (const boundary of [
        'Repeated runs with no state change return the same selected change',
        'do not create duplicate changes, artifacts, tasks, reflections, verification records, or implementation edits',
        'Next never writes application or test implementation',
        'learner task checkboxes',
        'learner reflections',
        'verification records',
        'roadmap updates',
        'adaptive archive feedback',
        'only possible write is the one concrete planning artifact explicitly authorized',
        'if that boundary is not explicit, remain read-only and hand off',
        'Do not claim roadmap mutation, learner-history updates, adaptive routing',
      ]) {
        expect(text, `${label}: ${boundary}`).toContain(boundary);
      }
    }
  });

  it('projects equivalent content through the skill and namespaced command registries', () => {
    const skillEntries = getSkillTemplates(['humanspec-next']);
    const commandEntries = getCommandContents(['humanspec-next']);

    expect(skillEntries).toHaveLength(1);
    expect(commandEntries).toHaveLength(1);
    expect(skillEntries[0]).toMatchObject({
      dirName: 'humanspec-next',
      workflowId: 'humanspec-next',
      namespace: 'humanspec',
    });
    expect(commandEntries[0]).toMatchObject({
      id: 'next',
      namespace: 'humanspec',
      name: 'HUMANSPEC: Next',
    });
    expect(commandEntries[0].body).toBe(skillEntries[0].template.instructions);
    expect(getCommandDescriptorForWorkflow('humanspec-next')?.id).toBe('next');

    const generated = generateSkillContent(skillEntries[0].template, 'TEST');
    expect(generated).toContain(skillEntries[0].template.instructions);
    expect(generated).toContain('name: humanspec-next');
    expect(generated).toContain('allowed-tools: Bash(openspec:*)');
    expect(generated).toContain('choice-required');
    expect(generated).toContain('/humanspec:archive');

    const adapter = CommandAdapterRegistry.get('claude');
    expect(adapter).toBeDefined();
    const generatedCommand = generateCommand(commandEntries[0], adapter!);
    expect(generatedCommand.fileContent).toContain('choice-required');
    expect(generatedCommand.fileContent).toContain('/humanspec:archive');
    expect(generatedCommand.fileContent).toContain('adaptive archive feedback');
  });

  it('routes pending archived feedback before selecting a new candidate', () => {
    for (const [label, body] of bodies) {
      const text = normalized(body);
      for (const marker of [
        'an archived outcome has `feedback: pending` reconciliation',
        'use the `reconciliation` result',
        'openspec humanspec context feedback-reconcile --change "<name>" --json',
        'Do not select a roadmap candidate or re-propose the archived change',
        'archived-change exclusion',
        '`mastered:`, `gap:`, and `review:` records',
        '`feedback: complete`',
        'Normalized state',
        '`reconciliation`',
      ]) {
        expect(text, `${label}: ${marker}`).toContain(marker);
      }
    }
  });

  it('resolves registered documents and planning-home paths on each platform', () => {
    const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'openspec-humanspec-next-'));
    const changeName = 'practice-next-paths';
    const changeDir = path.join(projectRoot, 'openspec', 'changes', changeName);
    fs.mkdirSync(changeDir, { recursive: true });

    const planningHome: PlanningHome = resolveCurrentPlanningHomeSync({
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

    const windowsRoot = path.win32.resolve('C:', 'workspace', 'humanspec-next');
    const windowsPlanningHome: PlanningHome = {
      kind: 'repo',
      root: windowsRoot,
      changesDir: path.win32.join(windowsRoot, 'openspec', 'changes'),
      defaultSchema: 'human-learning',
    };
    expect(getChangeDir(windowsPlanningHome, changeName)).toBe(
      path.win32.join(windowsPlanningHome.root, 'openspec', 'changes', changeName)
    );
    for (const document of PROJECT_DOC_TEMPLATES) {
      expect(path.win32.join(windowsRoot, 'openspec', document.fileName)).toBe(
        path.win32.join(windowsRoot, 'openspec', document.fileName)
      );
      expect(path.win32.basename(resolveProjectDocPath(windowsRoot, document.id))).toBe(
        document.fileName
      );
    }

    expect(path.win32.dirname(getChangeDir(windowsPlanningHome, changeName))).toBe(
      path.win32.join(windowsRoot, 'openspec', 'changes')
    );
    expect(path.win32.isAbsolute(windowsRoot)).toBe(true);
    const posixRoot = path.posix.resolve('/tmp', 'humanspec-next');
    expect(path.posix.join(posixRoot, 'openspec', 'changes', changeName)).toBe(
      path.posix.join('/tmp', 'humanspec-next', 'openspec', 'changes', changeName)
    );

    fs.rmSync(projectRoot, { recursive: true, force: true });
  });
});
