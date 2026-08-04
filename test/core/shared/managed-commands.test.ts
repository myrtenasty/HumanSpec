import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import {
  MANAGED_COMMANDS,
  COMMAND_IDS,
} from '../../../src/core/shared/tool-detection.js';
import { CommandAdapterRegistry } from '../../../src/core/command-generation/index.js';
import { hasToolProfileOrDeliveryDrift, WORKFLOW_TO_SKILL_DIR } from '../../../src/core/profile-sync-drift.js';
import { CORE_WORKFLOWS } from '../../../src/core/profiles.js';

describe('managed command descriptors', () => {
  it('carries an explicit namespace and id for every managed command', () => {
    expect(MANAGED_COMMANDS).toHaveLength(COMMAND_IDS.length);
    for (const descriptor of MANAGED_COMMANDS) {
      expect(descriptor.namespace).toBe('opsx');
      expect(COMMAND_IDS).toContain(descriptor.id);
    }
  });

  it('mirrors COMMAND_IDS in order', () => {
    expect(MANAGED_COMMANDS.map((d) => d.id)).toEqual([...COMMAND_IDS]);
  });

  it('enumerates exactly the registered namespace/ID adapter paths', () => {
    // Cleanup and detection must enumerate paths from the descriptor list,
    // never from filename globs: an unregistered namespace must not appear
    // among the paths OpenSpec manages.
    const adapter = CommandAdapterRegistry.get('claude')!;
    const managedPaths = MANAGED_COMMANDS.map((d) => adapter.getFilePath(d));

    for (const id of COMMAND_IDS) {
      expect(managedPaths).toContain(path.join('.claude', 'commands', 'opsx', `${id}.md`));
    }
    expect(managedPaths).toHaveLength(COMMAND_IDS.length);
    expect(managedPaths.some((p) => p.includes('humanspec'))).toBe(false);
  });

  it('projects every registered descriptor to an opsx path for every adapter', () => {
    for (const adapter of CommandAdapterRegistry.getAll()) {
      for (const descriptor of MANAGED_COMMANDS) {
        const filePath = adapter.getFilePath(descriptor);
        // Every adapter carries the opsx family in its path: as a directory
        // segment for namespaced adapters or as the filename prefix for flat
        // adapters — exactly the two shapes invocation.ts classifies.
        expect(filePath, `${adapter.toolId} ${descriptor.id}`).toMatch(/(?:\/|\\)opsx(?:-|[/\\]|$)/);
      }
    }
  });
});

describe('cleanup safety around managed command paths', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'openspec-managed-commands-test-'));
    fs.mkdirSync(path.join(tempDir, 'openspec'), { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  function writeSkill(workflowId: string): void {
    const dirName = WORKFLOW_TO_SKILL_DIR[workflowId as keyof typeof WORKFLOW_TO_SKILL_DIR];
    const skillPath = path.join(tempDir, '.claude', 'skills', dirName, 'SKILL.md');
    fs.mkdirSync(path.dirname(skillPath), { recursive: true });
    fs.writeFileSync(skillPath, `name: ${dirName}\n`);
  }

  function writeManagedCommand(workflowId: string): void {
    const adapter = CommandAdapterRegistry.get('claude')!;
    const cmdPath = adapter.getFilePath({ namespace: 'opsx', id: workflowId });
    const fullPath = path.isAbsolute(cmdPath) ? cmdPath : path.join(tempDir, cmdPath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, `# ${workflowId}\n`);
  }

  function writeFileUnder(relative: string): void {
    const fullPath = path.join(tempDir, relative);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, '# user file\n');
  }

  function setupCoreSkills(): void {
    for (const workflow of CORE_WORKFLOWS) {
      writeSkill(workflow);
    }
  }

  it('flags a command file at a registered namespace/ID path for reconciliation', () => {
    setupCoreSkills();
    writeManagedCommand('propose');
    expect(hasToolProfileOrDeliveryDrift(tempDir, 'claude', CORE_WORKFLOWS, 'skills')).toBe(true);
  });

  it('preserves a file in an unregistered namespace', () => {
    setupCoreSkills();
    // Same command id, humanspec family: not in the managed descriptor list,
    // so cleanup must leave it alone and it must not look like drift.
    writeFileUnder(path.join('.claude', 'commands', 'humanspec', 'propose.md'));
    expect(hasToolProfileOrDeliveryDrift(tempDir, 'claude', CORE_WORKFLOWS, 'skills')).toBe(false);
  });

  it('preserves a similarly named user file with an unregistered id', () => {
    setupCoreSkills();
    writeFileUnder(path.join('.claude', 'commands', 'opsx', 'user-apply.md'));
    writeFileUnder(path.join('.claude', 'commands', 'opsx', 'propose-notes.md'));
    expect(hasToolProfileOrDeliveryDrift(tempDir, 'claude', CORE_WORKFLOWS, 'skills')).toBe(false);
  });

  it('preserves user files that merely sit beside a managed directory', () => {
    setupCoreSkills();
    writeFileUnder(path.join('.claude', 'commands', 'opsx', 'README.md'));
    expect(hasToolProfileOrDeliveryDrift(tempDir, 'claude', CORE_WORKFLOWS, 'skills')).toBe(false);
  });

  it('still flags each registered namespace/ID path individually', () => {
    setupCoreSkills();
    for (const workflow of CORE_WORKFLOWS) {
      writeManagedCommand(workflow);
    }
    // Every registered path triggers reconciliation...
    expect(hasToolProfileOrDeliveryDrift(tempDir, 'claude', CORE_WORKFLOWS, 'skills')).toBe(true);
    // ...and an unregistered namespace next to them changes nothing.
    writeFileUnder(path.join('.claude', 'commands', 'humanspec', 'propose.md'));
    expect(hasToolProfileOrDeliveryDrift(tempDir, 'claude', CORE_WORKFLOWS, 'skills')).toBe(true);
  });
});
