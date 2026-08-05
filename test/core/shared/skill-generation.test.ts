import { describe, it, expect } from 'vitest';
import {
  getSkillTemplates,
  getCommandTemplates,
  getCommandContents,
  generateSkillContent,
} from '../../../src/core/shared/skill-generation.js';

describe('skill-generation', () => {
  describe('getSkillTemplates', () => {
    it('should return all 19 skill templates (12 OpenSpec + 7 HumanSpec)', () => {
      const templates = getSkillTemplates();
      expect(templates).toHaveLength(19);
    });

    it('should have unique directory names', () => {
      const templates = getSkillTemplates();
      const dirNames = templates.map(t => t.dirName);
      const uniqueDirNames = new Set(dirNames);
      expect(uniqueDirNames.size).toBe(templates.length);
    });

    it('should include all expected skills', () => {
      const templates = getSkillTemplates();
      const dirNames = templates.map(t => t.dirName);

      expect(dirNames).toContain('openspec-explore');
      expect(dirNames).toContain('openspec-new-change');
      expect(dirNames).toContain('openspec-continue-change');
      expect(dirNames).toContain('openspec-apply-change');
      expect(dirNames).toContain('openspec-update-change');
      expect(dirNames).toContain('openspec-ff-change');
      expect(dirNames).toContain('openspec-sync-specs');
      expect(dirNames).toContain('openspec-archive-change');
      expect(dirNames).toContain('openspec-bulk-archive-change');
      expect(dirNames).toContain('openspec-verify-change');
      expect(dirNames).toContain('openspec-onboard');
      expect(dirNames).toContain('openspec-propose');
      expect(dirNames).toContain('humanspec-init');
      expect(dirNames).toContain('humanspec-next');
      expect(dirNames).toContain('humanspec-propose');
      expect(dirNames).toContain('humanspec-coach');
      expect(dirNames).toContain('humanspec-verify');
      expect(dirNames).toContain('humanspec-archive');
      expect(dirNames).toContain('humanspec-explore');
    });

    it('should have valid template structure', () => {
      const templates = getSkillTemplates();

      for (const { template, dirName, workflowId } of templates) {
        expect(template.name).toBeTruthy();
        expect(template.description).toBeTruthy();
        expect(template.instructions).toBeTruthy();
        expect(dirName).toBeTruthy();
        expect(workflowId).toBeTruthy();
      }
    });

    it('should have unique workflow IDs', () => {
      const templates = getSkillTemplates();
      const ids = templates.map(t => t.workflowId);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(templates.length);
    });

    it('should filter by workflow IDs when provided', () => {
      const filtered = getSkillTemplates(['propose', 'explore', 'apply', 'archive']);
      expect(filtered).toHaveLength(4);
      const ids = filtered.map(t => t.workflowId);
      expect(ids).toContain('propose');
      expect(ids).toContain('explore');
      expect(ids).toContain('apply');
      expect(ids).toContain('archive');
      expect(ids).not.toContain('new');
      expect(ids).not.toContain('ff');
    });

    it('should return all templates when filter is undefined', () => {
      const all = getSkillTemplates();
      const noFilter = getSkillTemplates(undefined);
      expect(noFilter).toHaveLength(all.length);
    });

    it('should return empty array when filter matches nothing', () => {
      const filtered = getSkillTemplates(['nonexistent']);
      expect(filtered).toHaveLength(0);
    });

    it('should return single template when filter has one workflow', () => {
      const filtered = getSkillTemplates(['propose']);
      expect(filtered).toHaveLength(1);
      expect(filtered[0].workflowId).toBe('propose');
      expect(filtered[0].dirName).toBe('openspec-propose');
    });
  });

  describe('getCommandTemplates', () => {
    it('should return all 19 command templates (12 OpenSpec + 7 HumanSpec)', () => {
      const templates = getCommandTemplates();
      expect(templates).toHaveLength(19);
    });

    it('should have unique workflow IDs', () => {
      const templates = getCommandTemplates();
      const workflowIds = templates.map(t => t.workflowId);
      const uniqueWorkflowIds = new Set(workflowIds);
      expect(uniqueWorkflowIds.size).toBe(templates.length);
    });

    it('should include all expected commands', () => {
      const templates = getCommandTemplates();
      const ids = templates.map(t => t.id);

      expect(ids).toContain('explore');
      expect(ids).toContain('new');
      expect(ids).toContain('continue');
      expect(ids).toContain('apply');
      expect(ids).toContain('update');
      expect(ids).toContain('ff');
      expect(ids).toContain('sync');
      expect(ids).toContain('archive');
      expect(ids).toContain('bulk-archive');
      expect(ids).toContain('verify');
      expect(ids).toContain('onboard');
      expect(ids).toContain('propose');
      // HumanSpec command actions (namespace humanspec)
      expect(ids).toContain('init');
      expect(ids).toContain('next');
      expect(ids).toContain('coach');
    });

    it('should mark HumanSpec command templates with the humanspec namespace', () => {
      const templates = getCommandTemplates();
      const humanSpecEntries = templates.filter((t) => t.namespace === 'humanspec');
      expect(humanSpecEntries.map((t) => t.workflowId).sort()).toEqual([
        'humanspec-archive',
        'humanspec-coach',
        'humanspec-explore',
        'humanspec-init',
        'humanspec-next',
        'humanspec-propose',
        'humanspec-verify',
      ]);
    });

    it('should filter by workflow IDs when provided', () => {
      const filtered = getCommandTemplates(['propose', 'explore', 'apply', 'archive']);
      expect(filtered).toHaveLength(4);
      const ids = filtered.map(t => t.id);
      expect(ids).toContain('propose');
      expect(ids).toContain('explore');
      expect(ids).toContain('apply');
      expect(ids).toContain('archive');
      expect(ids).not.toContain('new');
      expect(ids).not.toContain('ff');
    });

    it('should return all templates when filter is undefined', () => {
      const all = getCommandTemplates();
      const noFilter = getCommandTemplates(undefined);
      expect(noFilter).toHaveLength(all.length);
    });

    it('should return empty array when filter matches nothing', () => {
      const filtered = getCommandTemplates(['nonexistent']);
      expect(filtered).toHaveLength(0);
    });
  });

  describe('getCommandContents', () => {
    it('should return all 19 command contents', () => {
      const contents = getCommandContents();
      expect(contents).toHaveLength(19);
    });

    it('should have valid content structure', () => {
      const contents = getCommandContents();

      for (const content of contents) {
        expect(content.id).toBeTruthy();
        expect(content.name).toBeTruthy();
        expect(content.description).toBeTruthy();
        expect(content.body).toBeTruthy();
      }
    });

    it('should have matching command IDs with command templates', () => {
      const templates = getCommandTemplates();
      const contents = getCommandContents();

      // Command action IDs may collide across namespaces (propose, verify,
      // archive, explore exist in both opsx and humanspec), so key the
      // comparison by namespace + action ID rather than raw IDs.
      const templateKeyed = templates.map((t) => `${t.namespace ?? 'opsx'}:${t.id}`).sort();
      const contentKeyed = contents.map((c) => `${c.namespace ?? 'opsx'}:${c.id}`).sort();
      expect(contentKeyed).toEqual(templateKeyed);
      expect(contents).toHaveLength(templates.length);
    });

    it('should filter by workflow IDs when provided', () => {
      const filtered = getCommandContents(['propose', 'explore']);
      expect(filtered).toHaveLength(2);
      const ids = filtered.map(c => c.id);
      expect(ids).toContain('propose');
      expect(ids).toContain('explore');
      expect(ids).not.toContain('new');
    });

    it('should return all contents when filter is undefined', () => {
      const all = getCommandContents();
      const noFilter = getCommandContents(undefined);
      expect(noFilter).toHaveLength(all.length);
    });
  });

  describe('generateSkillContent', () => {
    it('should generate valid YAML frontmatter', () => {
      const template = {
        name: 'test-skill',
        description: 'Test description',
        instructions: 'Test instructions',
        license: 'MIT',
        compatibility: 'Test compatibility',
        metadata: {
          author: 'test-author',
          version: '2.0',
        },
      };

      const content = generateSkillContent(template, '0.23.0');

      expect(content).toMatch(/^---\n/);
      expect(content).toContain('name: test-skill');
      expect(content).toContain('description: Test description');
      expect(content).toContain('license: MIT');
      expect(content).toContain('compatibility: Test compatibility');
      expect(content).toContain('author: test-author');
      expect(content).toContain('version: "2.0"');
      expect(content).toContain('generatedBy: "0.23.0"');
      expect(content).toContain('Test instructions');
    });

    it('should use default values for optional fields', () => {
      const template = {
        name: 'minimal-skill',
        description: 'Minimal description',
        instructions: 'Minimal instructions',
      };

      const content = generateSkillContent(template, '0.24.0');

      expect(content).toContain('license: MIT');
      expect(content).toContain('compatibility: Requires openspec CLI.');
      expect(content).toContain('author: openspec');
      expect(content).toContain('version: "1.0"');
      expect(content).toContain('generatedBy: "0.24.0"');
    });

    it('should embed the provided version in generatedBy field', () => {
      const template = {
        name: 'version-test',
        description: 'Test version embedding',
        instructions: 'Instructions',
      };

      const content1 = generateSkillContent(template, '0.23.0');
      expect(content1).toContain('generatedBy: "0.23.0"');

      const content2 = generateSkillContent(template, '1.0.0');
      expect(content2).toContain('generatedBy: "1.0.0"');

      const content3 = generateSkillContent(template, '0.24.0-beta.1');
      expect(content3).toContain('generatedBy: "0.24.0-beta.1"');
    });

    it('should end frontmatter with separator and blank line', () => {
      const template = {
        name: 'test',
        description: 'Test',
        instructions: 'Body content',
      };

      const content = generateSkillContent(template, '0.23.0');

      expect(content).toMatch(/---\n\nBody content\n$/);
    });

    it('should apply transformInstructions callback when provided', () => {
      const template = {
        name: 'transform-test',
        description: 'Test transform callback',
        instructions: 'Use /opsx:new to start and /opsx:apply to implement.',
      };

      const transformer = (text: string) => text.replace(/\/opsx:/g, '/opsx-');
      const content = generateSkillContent(template, '0.23.0', transformer);

      expect(content).toContain('/opsx-new');
      expect(content).toContain('/opsx-apply');
      expect(content).not.toContain('/opsx:new');
      expect(content).not.toContain('/opsx:apply');
    });

    it('should not transform instructions when callback is undefined', () => {
      const template = {
        name: 'no-transform-test',
        description: 'Test without transform',
        instructions: 'Use /opsx:new to start.',
      };

      const content = generateSkillContent(template, '0.23.0', undefined);

      expect(content).toContain('/opsx:new');
    });

    it('should support custom transformInstructions logic', () => {
      const template = {
        name: 'custom-transform',
        description: 'Test custom transform',
        instructions: 'Some PLACEHOLDER text here.',
      };

      const customTransformer = (text: string) => text.replace('PLACEHOLDER', 'REPLACED');
      const content = generateSkillContent(template, '0.23.0', customTransformer);

      expect(content).toContain('Some REPLACED text here.');
      expect(content).not.toContain('PLACEHOLDER');
    });
  });
});
