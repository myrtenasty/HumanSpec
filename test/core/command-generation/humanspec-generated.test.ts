import { describe, it, expect } from 'vitest';
import path from 'node:path';

import { generateCommand, CommandAdapterRegistry } from '../../../src/core/command-generation/index.js';
import { getCommandContents, getSkillTemplates, generateSkillContent } from '../../../src/core/shared/skill-generation.js';
import { HUMANSPEC_WORKFLOWS, getProfileWorkflows } from '../../../src/core/profiles.js';
import { getTransformerForTool, transformToSkillReferences } from '../../../src/utils/command-references.js';
import { resolveCommandSurfaceCapability, resolveCommandInvocation } from '../../../src/core/command-surface.js';

const HUMANSPEC_ACTIONS = HUMANSPEC_WORKFLOWS.map((workflow) => workflow.replace('humanspec-', ''));

const NAMESPACED_TOOLS = ['claude', 'codebuddy', 'crush', 'gemini', 'lingma', 'qoder', 'zcode'];
const FLAT_TOOLS = ['cursor', 'opencode', 'pi', 'qwen', 'bob', 'oh-my-pi', 'junie', 'roocode'];

describe('HumanSpec generated output', () => {
  it('projects exactly the seven humanspec commands for the profile', () => {
    const contents = getCommandContents(getProfileWorkflows('humanspec'));
    expect(contents).toHaveLength(7);
    expect(contents.map((c) => c.id).sort()).toEqual([...HUMANSPEC_ACTIONS].sort());
    expect(contents.every((c) => c.namespace === 'humanspec')).toBe(true);
  });

  it('projects /humanspec:<action> for every namespaced adapter', () => {
    const contents = getCommandContents(getProfileWorkflows('humanspec'));
    for (const toolId of NAMESPACED_TOOLS) {
      const adapter = CommandAdapterRegistry.get(toolId)!;
      for (const action of HUMANSPEC_ACTIONS) {
        const { path: filePath, fileContent } = generateCommand(
          contents.find((c) => c.id === action)!,
          adapter
        );
        // The humanspec family nests under a `humanspec` directory segment
        // (adapter roots and extensions vary, e.g. .gemini/*.toml).
        const segments = filePath.split(/[\\/]/);
        expect(segments, `${toolId} ${action}`).toContain('humanspec');
        expect(path.basename(filePath), `${toolId} ${action}`).toMatch(
          new RegExp(`^${action}\\.`)
        );
        // Namespaced adapters keep the colon form for the humanspec family.
        expect(fileContent, `${toolId} ${action}`).toMatch(/\/humanspec:[a-z-]+/);
        expect(fileContent, `${toolId} ${action}`).not.toMatch(/\/humanspec-[a-z-]+/);
      }
    }
  });

  it('projects /humanspec-<action> flat command files for every flat adapter', () => {
    const contents = getCommandContents(getProfileWorkflows('humanspec'));
    for (const toolId of FLAT_TOOLS) {
      const adapter = CommandAdapterRegistry.get(toolId)!;
      for (const action of HUMANSPEC_ACTIONS) {
        const { path: filePath, fileContent } = generateCommand(
          contents.find((c) => c.id === action)!,
          adapter
        );
        expect(path.basename(filePath), `${toolId} ${action}`).toBe(`humanspec-${action}.md`);
        // Flat adapters rewrite the family's references to the hyphen form.
        expect(fileContent, `${toolId} ${action}`).toMatch(/\/humanspec-[a-z-]+/);
        expect(fileContent, `${toolId} ${action}`).not.toMatch(/\/humanspec:[a-z-]+/);
      }
    }
  });

  it('projects @humanspec-<action> for Amazon Q', () => {
    const adapter = CommandAdapterRegistry.get('amazon-q')!;
    const contents = getCommandContents(getProfileWorkflows('humanspec'));
    for (const action of HUMANSPEC_ACTIONS) {
      const { path: filePath, fileContent } = generateCommand(
        contents.find((c) => c.id === action)!,
        adapter
      );
      expect(path.basename(filePath), action).toBe(`humanspec-${action}.md`);
      expect(fileContent, action).toMatch(/@humanspec-[a-z-]+/);
      expect(fileContent, action).not.toMatch(/\/humanspec:[a-z-]+/);
    }
  });

  it('generates skills-invocable HumanSpec names for Codex and Kimi Code', () => {
    const templates = getSkillTemplates(getProfileWorkflows('humanspec'));
    expect(templates).toHaveLength(7);
    for (const { template, dirName, namespace } of templates) {
      // Codex CLI invokes skills as $<name>.
      const codexTransformer = getTransformerForTool(
        'codex',
        'both',
        resolveCommandSurfaceCapability('codex'),
        resolveCommandInvocation('codex'),
        namespace
      );
      const codexContent = generateSkillContent(template, '0.0.0', codexTransformer);
      expect(codexContent, dirName).toMatch(/\$humanspec-[a-z-]+/);
      expect(codexContent, dirName).not.toMatch(/\/humanspec:[a-z-]+/);
      // Kimi Code invokes skills as /skill:<name>.
      const kimiTransformer = getTransformerForTool(
        'kimi',
        'both',
        resolveCommandSurfaceCapability('kimi'),
        resolveCommandInvocation('kimi'),
        namespace
      );
      const kimiContent = generateSkillContent(template, '0.0.0', kimiTransformer);
      expect(kimiContent, dirName).toMatch(/\/skill:humanspec-[a-z-]+/);
      expect(kimiContent, dirName).not.toMatch(/\/humanspec:[a-z-]+/);
    }
  });

  it('generates exactly seven humanspec skill directories for the profile', () => {
    const workflows = getProfileWorkflows('humanspec');
    const skillTemplates = getSkillTemplates(workflows);
    expect(skillTemplates).toHaveLength(7);
    expect(skillTemplates.map((t) => t.dirName).sort()).toEqual(
      HUMANSPEC_WORKFLOWS.map((w) => w).sort()
    );
    expect(skillTemplates.map((t) => t.workflowId).sort()).toEqual(
      HUMANSPEC_WORKFLOWS.map((w) => w).sort()
    );
  });

  it('skills.sh distribution spells humanspec skills in the /humanspec-<action> skill form', () => {
    // Mirrors the generator's composed transformer (opsx + humanspec
    // families), which the committed skills/ tree is produced with.
    const toSkillReferences = (text: string): string =>
      transformToSkillReferences(transformToSkillReferences(text, 'humanspec'));
    const templates = getSkillTemplates(getProfileWorkflows('humanspec'));
    for (const { template, dirName } of templates) {
      const content = generateSkillContent(template, 'skills.sh', toSkillReferences);
      expect(content, dirName).toMatch(/\/humanspec-[a-z-]+/);
      expect(content, dirName).not.toMatch(/\/humanspec:[a-z-]+/);
    }
  });
});
