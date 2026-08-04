import { describe, it, expect } from 'vitest';
import path from 'path';
import { generateCommand, generateCommands } from '../../../src/core/command-generation/generator.js';
import { claudeAdapter } from '../../../src/core/command-generation/adapters/claude.js';
import { cursorAdapter } from '../../../src/core/command-generation/adapters/cursor.js';
import {
  DEFAULT_COMMAND_NAMESPACE,
  resolveCommandIdentity,
  validateCommandNamespace,
} from '../../../src/core/command-generation/identity.js';
import type { CommandContent, ToolCommandAdapter } from '../../../src/core/command-generation/types.js';

describe('command-generation/generator', () => {
  const sampleContent: CommandContent = {
    id: 'explore',
    name: 'OpenSpec Explore',
    description: 'Enter explore mode',
    category: 'Workflow',
    tags: ['workflow'],
    body: 'Command body here.',
  };

  describe('generateCommand', () => {
    it('should generate command with path and content using Claude adapter', () => {
      const result = generateCommand(sampleContent, claudeAdapter);

      expect(result.path).toContain('.claude');
      expect(result.path).toContain('explore.md');
      expect(result.fileContent).toContain('name: "OpenSpec Explore"');
      expect(result.fileContent).toContain('Command body here.');
    });

    it('should generate command for Cursor adapter', () => {
      const result = generateCommand(sampleContent, cursorAdapter);

      expect(result.path).toContain('.cursor');
      expect(result.path).toContain('opsx-explore.md');
      expect(result.fileContent).toContain('name: "/opsx-explore"');
      expect(result.fileContent).toContain('id: "opsx-explore"');
      expect(result.fileContent).toContain('Command body here.');
    });

    it('should use command id for path', () => {
      const content: CommandContent = { ...sampleContent, id: 'custom-cmd' };
      const result = generateCommand(content, claudeAdapter);

      expect(result.path).toContain('custom-cmd.md');
    });

    it('should work with custom adapter', () => {
      const customAdapter: ToolCommandAdapter = {
        toolId: 'custom',
        getFilePath: (identity) => path.join('.custom', identity.namespace, `${identity.id}.txt`),
        formatFile: (content) => `# ${content.name}\n\n${content.body}`,
      };

      const result = generateCommand(sampleContent, customAdapter);

      expect(result.path).toBe(path.join('.custom', 'opsx', 'explore.txt'));
      expect(result.fileContent).toBe('# OpenSpec Explore\n\nCommand body here.');
    });
  });

  describe('generateCommands', () => {
    it('should generate multiple commands', () => {
      const contents: CommandContent[] = [
        { ...sampleContent, id: 'explore', name: 'Explore' },
        { ...sampleContent, id: 'new', name: 'New' },
        { ...sampleContent, id: 'apply', name: 'Apply' },
      ];

      const results = generateCommands(contents, claudeAdapter);

      expect(results).toHaveLength(3);
      expect(results[0].path).toContain('explore.md');
      expect(results[1].path).toContain('new.md');
      expect(results[2].path).toContain('apply.md');
    });

    it('should return empty array for empty input', () => {
      const results = generateCommands([], claudeAdapter);
      expect(results).toEqual([]);
    });

    it('should preserve order of input', () => {
      const contents: CommandContent[] = [
        { ...sampleContent, id: 'c', name: 'C' },
        { ...sampleContent, id: 'a', name: 'A' },
        { ...sampleContent, id: 'b', name: 'B' },
      ];

      const results = generateCommands(contents, claudeAdapter);

      expect(results[0].path).toContain('c.md');
      expect(results[1].path).toContain('a.md');
      expect(results[2].path).toContain('b.md');
    });

    it('should generate each command independently', () => {
      const contents: CommandContent[] = [
        { id: 'a', name: 'A', description: 'DA', category: 'C1', tags: ['t1'], body: 'B1' },
        { id: 'b', name: 'B', description: 'DB', category: 'C2', tags: ['t2'], body: 'B2' },
      ];

      const results = generateCommands(contents, claudeAdapter);

      expect(results[0].fileContent).toContain('name: "A"');
      expect(results[0].fileContent).toContain('B1');
      expect(results[0].fileContent).not.toContain('name: "B"');

      expect(results[1].fileContent).toContain('name: "B"');
      expect(results[1].fileContent).toContain('B2');
      expect(results[1].fileContent).not.toContain('name: "A"');
    });

    it('should generate commands with mixed namespaces using each command\u2019s own identity', () => {
      const contents: CommandContent[] = [
        { ...sampleContent, id: 'explore', name: 'Explore' },
        {
          ...sampleContent,
          id: 'propose',
          namespace: 'humanspec',
          name: 'HumanSpec Propose',
          body: 'Start with /humanspec:propose.',
        },
        { ...sampleContent, id: 'apply', name: 'Apply' },
      ];

      const results = generateCommands(contents, cursorAdapter);

      expect(results).toHaveLength(3);
      expect(results[0].path).toBe(path.join('.cursor', 'commands', 'opsx-explore.md'));
      // The humanspec command is projected with its own namespace and ID,
      // while its neighbors stay in the opsx family.
      expect(results[1].path).toBe(path.join('.cursor', 'commands', 'humanspec-propose.md'));
      expect(results[1].fileContent).toContain('/humanspec-propose');
      expect(results[2].path).toBe(path.join('.cursor', 'commands', 'opsx-apply.md'));
    });
  });

  describe('identity resolution', () => {
    it('defaults an omitted namespace to opsx', () => {
      expect(resolveCommandIdentity({ id: 'explore', name: 'n', description: 'd', category: 'c', tags: [], body: 'b' }))
        .toEqual({ namespace: DEFAULT_COMMAND_NAMESPACE, id: 'explore' });
      expect(resolveCommandIdentity({ ...sampleContent })).toEqual({
        namespace: 'opsx',
        id: 'explore',
      });
    });

    it('keeps an explicit namespace', () => {
      expect(resolveCommandIdentity({ ...sampleContent, namespace: 'humanspec' })).toEqual({
        namespace: 'humanspec',
        id: 'explore',
      });
    });

    it('resolves the namespace before any adapter path is constructed', () => {
      const customAdapter: ToolCommandAdapter = {
        toolId: 'custom',
        getFilePath: (identity) => {
          throw new Error(`getFilePath must not run for invalid namespaces: ${identity.namespace}`);
        },
        formatFile: (content) => content.body,
      };
      for (const invalid of ['', 'foo/bar', 'foo\\bar', '.', '..', 'Foo', 'foo_bar', '-foo', 'foo-', 'foo--bar', 'foo bar']) {
        expect(() => generateCommand({ ...sampleContent, namespace: invalid }, customAdapter), invalid).toThrow(
          /command namespace|invalid command namespace/
        );
      }
    });

    it('generates the expected humanspec path for a namespaced command', () => {
      const result = generateCommand({ ...sampleContent, id: 'propose', namespace: 'humanspec' }, claudeAdapter);
      expect(result.path).toBe(path.join('.claude', 'commands', 'humanspec', 'propose.md'));
    });

    it('keeps every existing OpenSpec path and invocation text when namespace is omitted', () => {
      // Parity: omitting the namespace must be byte-for-byte equivalent to
      // declaring opsx, for the path, the file content, and every invocation
      // spelling — so existing OpenSpec generated output never changes.
      const adapters = [claudeAdapter, cursorAdapter];
      for (const adapter of adapters) {
        const omitted = generateCommand(sampleContent, adapter);
        const explicit = generateCommand({ ...sampleContent, namespace: 'opsx' }, adapter);
        expect(omitted, adapter.toolId).toEqual(explicit);
      }

      // The pre-namespace spellings hold across every invocation shape.
      const claude = generateCommand(sampleContent, claudeAdapter);
      expect(claude.path).toBe(path.join('.claude', 'commands', 'opsx', 'explore.md'));
      expect(claude.fileContent).toContain('Command body here.');

      const cursor = generateCommand(sampleContent, cursorAdapter);
      expect(cursor.path).toBe(path.join('.cursor', 'commands', 'opsx-explore.md'));
      expect(cursor.fileContent).toContain('name: "/opsx-explore"');
      expect(cursor.fileContent).toContain('id: "opsx-explore"');
    });
  });

  describe('validateCommandNamespace', () => {
    it('accepts lowercase kebab-case segments', () => {
      for (const valid of ['opsx', 'humanspec', 'acme-tools', 'a1', '1a', 'a-b-c']) {
        expect(validateCommandNamespace(valid), valid).toBeUndefined();
      }
    });

    it('rejects empty values', () => {
      expect(validateCommandNamespace('')).toMatch(/must not be empty/);
    });

    it('rejects path separators', () => {
      expect(validateCommandNamespace('foo/bar')).toMatch(/separators/);
      expect(validateCommandNamespace('foo\\bar')).toMatch(/separators/);
    });

    it('rejects traversal segments', () => {
      expect(validateCommandNamespace('.')).toMatch(/traversal/);
      expect(validateCommandNamespace('..')).toMatch(/traversal/);
    });

    it('rejects non-kebab-case values and identifies the namespace', () => {
      for (const invalid of ['Foo', 'foo_bar', '-foo', 'foo-', 'foo--bar', 'foo bar', 'foo.bar']) {
        const error = validateCommandNamespace(invalid);
        expect(error, invalid).toMatch(/invalid command namespace/);
        expect(error, invalid).toContain(invalid);
      }
    });
  });
});
