import { describe, it, expect } from 'vitest';
import type { CommandContent, ToolCommandAdapter, GeneratedCommand } from '../../../src/core/command-generation/types.js';

describe('command-generation/types', () => {
  describe('CommandContent interface', () => {
    it('should allow creating valid command content', () => {
      const content: CommandContent = {
        id: 'explore',
        name: 'OpenSpec Explore',
        description: 'Enter explore mode for thinking',
        category: 'Workflow',
        tags: ['workflow', 'explore'],
        body: 'This is the command body content.',
      };

      expect(content.id).toBe('explore');
      expect(content.namespace).toBeUndefined();
      expect(content.name).toBe('OpenSpec Explore');
      expect(content.description).toBe('Enter explore mode for thinking');
      expect(content.category).toBe('Workflow');
      expect(content.tags).toEqual(['workflow', 'explore']);
      expect(content.body).toBe('This is the command body content.');
    });

    it('should allow an explicit namespace', () => {
      const content: CommandContent = {
        id: 'propose',
        namespace: 'humanspec',
        name: 'HumanSpec Propose',
        description: 'Propose a change',
        category: 'HumanSpec',
        tags: [],
        body: 'Body',
      };
      expect(content.namespace).toBe('humanspec');
    });

    it('should allow empty tags array', () => {
      const content: CommandContent = {
        id: 'test',
        name: 'Test',
        description: 'Test command',
        category: 'Test',
        tags: [],
        body: 'Body',
      };

      expect(content.tags).toEqual([]);
    });
  });

  describe('ToolCommandAdapter interface contract', () => {
    it('should implement adapter with getFilePath and formatFile', () => {
      const mockAdapter: ToolCommandAdapter = {
        toolId: 'test-tool',
        getFilePath(identity: { namespace: string; id: string }): string {
          return `.test/${identity.namespace}/${identity.id}.md`;
        },
        formatFile(content: CommandContent): string {
          return `---\nname: ${content.name}\n---\n\n${content.body}\n`;
        },
      };

      expect(mockAdapter.toolId).toBe('test-tool');
      expect(mockAdapter.getFilePath({ namespace: 'opsx', id: 'explore' })).toBe('.test/opsx/explore.md');

      const content: CommandContent = {
        id: 'test',
        name: 'Test Command',
        description: 'Desc',
        category: 'Cat',
        tags: [],
        body: 'Body content',
      };

      const formatted = mockAdapter.formatFile(content);
      expect(formatted).toContain('name: Test Command');
      expect(formatted).toContain('Body content');
    });
  });

  describe('GeneratedCommand interface', () => {
    it('should represent generated command output', () => {
      const generated: GeneratedCommand = {
        path: '.claude/commands/opsx/explore.md',
        fileContent: '---\nname: Test\n---\n\nBody\n',
      };

      expect(generated.path).toBe('.claude/commands/opsx/explore.md');
      expect(generated.fileContent).toContain('name: Test');
    });
  });
});
