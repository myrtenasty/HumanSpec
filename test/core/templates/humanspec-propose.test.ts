import path from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  generateSkillContent,
  getCommandContents,
  getCommandTemplates,
  getSkillTemplates,
} from '../../../src/core/shared/skill-generation.js';
import { getCommandDescriptorForWorkflow } from '../../../src/core/templates/command-descriptors.js';
import {
  getHumanspecProposeCommandTemplate,
  getHumanspecProposeSkillTemplate,
} from '../../../src/core/templates/skill-templates.js';
import {
  PROJECT_DOC_TEMPLATES,
  resolveProjectDocPath,
} from '../../../src/core/templates/project-docs.js';
import {
  HUMANSPEC_CHANGE_SIZING_GUIDANCE,
  HUMANSPEC_FIT_REPORT_GUIDANCE,
  HUMANSPEC_SIZING_CRITERIA,
} from '../../../src/core/templates/workflows/humanspec-shared.js';
import { getChangeDir, type PlanningHome } from '../../../src/core/planning-home.js';

const skill = getHumanspecProposeSkillTemplate();
const command = getHumanspecProposeCommandTemplate();
const bodies: Array<[string, string]> = [
  ['skill', skill.instructions],
  ['command', command.content],
];

function executableNewChangeCommands(body: string): string[] {
  return body
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('openspec new change '));
}

describe('HumanSpec propose workflow templates', () => {
  it('projects one shared propose contract to skill and command surfaces', () => {
    expect(skill.instructions).toBe(command.content);

    const skillEntry = getSkillTemplates(['humanspec-propose'])[0];
    const commandEntry = getCommandTemplates(['humanspec-propose'])[0];
    expect(skillEntry?.template.instructions).toBe(commandEntry?.template.content);
    expect(getCommandContents(['humanspec-propose'])[0]?.body).toBe(command.content);

    const generatedSkill = generateSkillContent(skill, 'test');
    expect(generatedSkill).toContain(command.content);
    expect(getCommandDescriptorForWorkflow('humanspec-propose')?.id).toBe('propose');
  });

  it('guards context readiness and learner-owned context facts', () => {
    for (const [label, body] of bodies) {
      expect(body, label).toContain('openspec humanspec context inspect --json');
      expect(body, label).toContain('data.documents');
      expect(body, label).toContain('public source of truth');
      for (const state of [
        'valid HumanSpec',
        'missing',
        'malformed/invalid',
        'unmarked user content',
      ]) {
        expect(body, `${label}: ${state}`).toContain(state);
      }
      expect(body, label).toContain('Do not create a change while');
      expect(body, label).toContain('concrete next action');
      expect(body, label).toContain('/humanspec:init');
      expect(body, label).toContain('supply or explicitly resolve');
      expect(body, label).toContain('never invent learner experience');
    }
  });

  it('states the shared complete human-sizing policy and independent evidence', () => {
    for (const [label, body] of bodies) {
      expect(body, label).toContain(HUMANSPEC_CHANGE_SIZING_GUIDANCE);
      expect(body, label).toContain(HUMANSPEC_FIT_REPORT_GUIDANCE);
      expect(body, label).toContain('one observable outcome');
      expect(body, label).toContain('one primary learning goal');
      expect(body, label).toContain('no more than two supporting concepts');
      expect(body, label).toContain('two to five');
      expect(body, label).toContain('independently');
      expect(body, label).toContain('configured session budget');
      expect(body, label).toContain('completion evidence');
      for (const criterion of HUMANSPEC_SIZING_CRITERIA) {
        expect(body, `${label}: ${criterion.id}`).toContain(`[${criterion.id}]`);
      }
    }
  });

  it('requires bounded candidate slices for oversized or multi-outcome requests', () => {
    for (const [label, body] of bodies) {
      expect(body, label).toContain('multiple independent outcomes');
      expect(body, label).toContain('multiple frameworks or infrastructure');
      expect(body, label).toContain('multiple unfamiliar core concepts');
      expect(body, label).toContain('whole-module/system');
      expect(body, label).toContain('missing single completion evidence');
      expect(body, label).toContain('cognitive load');
      expect(body, label).toContain('bounded set of candidate slices');
      expect(body, label).toContain('conversation-only planning output');
      expect(body, label).toContain('select at most one candidate');
      expect(body, label).toContain('never create more than one change');
      expect(body, label).toContain('update the roadmap');
    }
  });

  it('reports roadmap-external impact before confirmation', () => {
    for (const [label, body] of bodies) {
      expect(body, label).toContain('not represented by the confirmed roadmap');
      expect(body, label).toContain('preserve');
      expect(body, label).toContain('interrupt');
      expect(body, label).toContain('replace');
      expect(body, label).toContain('extend');
      expect(body, label).toContain('before confirmation');
    }
  });

  it('gates creation, artifact selection, and before-practice handoff', () => {
    for (const [label, body] of bodies) {
      expect(body, label).toContain('explicit learner confirmation');
      expect(body, label).toContain('openspec new change "<name>" --schema human-learning');
      expect(body, label).toContain('skip_specs: true');
      expect(body, label).toContain('do not\n     synthesize or create a delta spec');
      expect(body, label).toContain('## 开始前');
      expect(body, label).toContain('template comment');
      expect(body, label).toContain('not\n   call the plan ready');
      expect(body, label).toContain('/humanspec:coach');
      expect(body, label).toContain('does not mark any practice task');

      const commandLines = executableNewChangeCommands(body);
      expect(commandLines, label).toHaveLength(1);
      expect(body.indexOf('explicit learner confirmation'), label).toBeLessThan(
        body.indexOf('openspec new change "<name>" --schema human-learning')
      );
    }
  });

  it('preserves the implementation write boundary and later-workflow limits', () => {
    for (const [label, body] of bodies) {
      expect(body, label).toContain('proposal, specs, learning plan under openspec/changes/<name>/');
      expect(body, label).toContain('application source files');
      expect(body, label).toContain('test implementation files');
      expect(body, label).toContain('learner-completed task checkboxes');
      expect(body, label).not.toMatch(/(?:implements|provides|runs|updates)[^\n]*adaptive routing/i);
      expect(body, label).not.toMatch(/(?:implements|provides|runs|updates)[^\n]*learning-aware (?:verification|archive)/i);
    }
  });

  it('covers fit, split, non-behavioral, and rejected workflow outcomes', () => {
    const cases = [
      {
        name: 'fits one session',
        required: ['Size the plan explicitly', 'Preview and confirm exactly one plan'],
      },
      {
        name: 'must be split',
        required: ['Split oversized requests before creating anything', 'bounded set of candidate slices'],
      },
      {
        name: 'non-behavioral practice',
        required: ['behavior-delta', 'skip_specs: true', 'do not\n     synthesize or create a delta spec'],
      },
      {
        name: 'rejected plan',
        required: ['A rejection leaves change artifacts unchanged', 'revision, another candidate, or stopping'],
      },
    ];

    for (const scenario of cases) {
      for (const [label, body] of bodies) {
        for (const phrase of scenario.required) {
          expect(body, `${scenario.name} / ${label}: ${phrase}`).toContain(phrase);
        }
      }
    }

    expect(executableNewChangeCommands(skill.instructions)).toHaveLength(1);
  });

  it('resolves registered documents and the selected planning home with platform-safe paths', () => {
    const nativeRoot = path.resolve(path.parse(process.cwd()).root, 'tmp', 'humanspec-native');
    const nativeOpenspec = path.join(nativeRoot, 'openspec');
    const nativeHome: PlanningHome = {
      kind: 'repo',
      root: nativeRoot,
      changesDir: path.join(nativeOpenspec, 'changes'),
      defaultSchema: 'human-learning',
    };

    expect(getChangeDir(nativeHome, 'practice-slice')).toBe(
      path.join(nativeOpenspec, 'changes', 'practice-slice')
    );
    for (const document of PROJECT_DOC_TEMPLATES) {
      expect(resolveProjectDocPath(nativeRoot, document.id)).toBe(
        path.join(nativeOpenspec, document.fileName)
      );
    }

    const windowsRoot = path.win32.resolve('C:', 'tmp', 'humanspec-windows');
    const windowsOpenspec = path.win32.join(windowsRoot, 'openspec');
    const windowsChanges = path.win32.join(windowsOpenspec, 'changes');
    expect(path.win32.join(windowsChanges, 'practice-slice')).toBe(
      path.win32.join(windowsRoot, 'openspec', 'changes', 'practice-slice')
    );
    for (const document of PROJECT_DOC_TEMPLATES) {
      expect(path.win32.join(windowsOpenspec, document.fileName)).toBe(
        path.win32.join(windowsRoot, 'openspec', document.fileName)
      );
    }

    const posixRoot = path.posix.resolve('/tmp', 'humanspec-posix');
    const posixOpenspec = path.posix.join(posixRoot, 'openspec');
    expect(path.posix.join(posixOpenspec, 'changes', 'practice-slice')).toBe(
      path.posix.join(posixRoot, 'openspec', 'changes', 'practice-slice')
    );
  });
});
