import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { UpdateCommand } from '../../src/core/update.js';
import { FileSystemUtils } from '../../src/utils/file-system.js';
import type { GlobalConfig } from '../../src/core/global-config.js';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';

// Mock global config module to isolate tests from the machine's actual config
const mockState = {
  config: {
    featureFlags: {},
    profile: 'core' as const,
    delivery: 'both' as const,
  } as GlobalConfig,
};

vi.mock('../../src/core/global-config.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/core/global-config.js')>();
  return {
    ...actual,
    getGlobalConfig: () => ({ ...mockState.config }),
    saveGlobalConfig: vi.fn(),
  };
});

function setMockConfig(config: GlobalConfig): void {
  mockState.config = config;
}

function resetMockConfig(): void {
  mockState.config = { featureFlags: {}, profile: 'core', delivery: 'both' };
}

async function exists(p: string): Promise<boolean> {
  return FileSystemUtils.fileExists(p);
}

async function writeSkill(dirName: string): Promise<void> {
  const skillFile = path.join(testDir, '.claude', 'skills', dirName, 'SKILL.md');
  await fs.mkdir(path.dirname(skillFile), { recursive: true });
  await fs.writeFile(skillFile, `name: ${dirName}\n`);
}

async function writeCommand(relative: string): Promise<void> {
  const fullPath = path.join(testDir, relative);
  await fs.mkdir(path.dirname(fullPath), { recursive: true });
  await fs.writeFile(fullPath, '# managed\n');
}

async function writeProjectConfig(content: string): Promise<void> {
  await fs.mkdir(path.join(testDir, 'openspec'), { recursive: true });
  await fs.writeFile(path.join(testDir, 'openspec', 'config.yaml'), content, 'utf-8');
}

const HUMANSPEC_SKILLS = [
  'humanspec-init',
  'humanspec-next',
  'humanspec-propose',
  'humanspec-coach',
  'humanspec-verify',
  'humanspec-archive',
  'humanspec-explore',
];

let testDir: string;

describe('UpdateCommand humanspec profile', () => {
  let updateCommand: UpdateCommand;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(async () => {
    originalEnv = { ...process.env };
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'openspec-update-hs-'));
    process.env.CODEX_HOME = path.join(testDir, 'codex-home');
    await fs.mkdir(path.join(testDir, 'openspec'), { recursive: true });
    updateCommand = new UpdateCommand();
    resetMockConfig();
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(async () => {
    process.env = originalEnv;
    vi.restoreAllMocks();
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it('project humanspec profile overrides global core and installs humanspec artifacts only', async () => {
    setMockConfig({ featureFlags: {}, profile: 'core', delivery: 'both' });
    await writeProjectConfig('schema: human-learning\nprofile: humanspec\n');
    await writeSkill('openspec-apply-change'); // stale core artifact from an earlier install

    await updateCommand.execute(testDir);

    for (const skill of HUMANSPEC_SKILLS) {
      expect(await exists(path.join(testDir, '.claude', 'skills', skill, 'SKILL.md')), skill).toBe(true);
    }
    // The stale core apply skill was removed as a deselected registered artifact.
    expect(await exists(path.join(testDir, '.claude', 'skills', 'openspec-apply-change', 'SKILL.md'))).toBe(false);
    // The humanspec profile installs no apply workflow and no opsx commands.
    expect(await exists(path.join(testDir, '.claude', 'skills', 'openspec-propose', 'SKILL.md'))).toBe(false);
    expect(await exists(path.join(testDir, '.claude', 'commands', 'opsx', 'apply.md'))).toBe(false);
  });

  it('legacy project without a profile field keeps the global fallback and does not mutate config', async () => {
    setMockConfig({ featureFlags: {}, profile: 'core', delivery: 'both' });
    await writeProjectConfig('schema: spec-driven\n');
    const before = await fs.readFile(path.join(testDir, 'openspec', 'config.yaml'), 'utf-8');
    await writeSkill('openspec-propose');

    await updateCommand.execute(testDir);

    expect(await exists(path.join(testDir, '.claude', 'skills', 'openspec-apply-change', 'SKILL.md'))).toBe(true);
    const after = await fs.readFile(path.join(testDir, 'openspec', 'config.yaml'), 'utf-8');
    expect(after).toBe(before);
  });

  it('switching core → humanspec removes only registered unselected artifacts and preserves user files', async () => {
    setMockConfig({ featureFlags: {}, profile: 'core', delivery: 'both' });
    await writeProjectConfig('schema: human-learning\nprofile: humanspec\n');

    // Simulated prior core install: all six core skills and six opsx commands.
    for (const dirName of [
      'openspec-propose',
      'openspec-explore',
      'openspec-apply-change',
      'openspec-update-change',
      'openspec-sync-specs',
      'openspec-archive-change',
    ]) {
      await writeSkill(dirName);
    }
    for (const id of ['propose', 'explore', 'apply', 'update', 'sync', 'archive']) {
      await writeCommand(path.join('.claude', 'commands', 'opsx', `${id}.md`));
    }
    // User-authored files that must survive:
    // - a similarly named user skill directory (not a registered managed path)
    await writeSkill('openspec-apply-change-backup');
    // - a user file beside the managed skill directories (the managed dir
    //   itself is OpenSpec's exact registered removal target)
    const userNote = path.join(testDir, '.claude', 'skills', 'user-notes.md');
    await fs.mkdir(path.dirname(userNote), { recursive: true });
    await fs.writeFile(userNote, 'user notes\n');
    // - a user-authored sibling inside a registered skill directory
    const managedSibling = path.join(testDir, '.claude', 'skills', 'openspec-apply-change', 'notes.md');
    await fs.writeFile(managedSibling, 'user notes inside managed directory\n');
    // - an unregistered namespace command next to the managed ones
    await writeCommand(path.join('.claude', 'commands', 'mycompany', 'apply.md'));
    // - a file outside the selected tool roots
    await writeCommand(path.join('.other-tool', 'opsx-apply.md'));

    await updateCommand.execute(testDir);

    // Desired humanspec artifacts exist.
    expect(await exists(path.join(testDir, '.claude', 'skills', 'humanspec-init', 'SKILL.md'))).toBe(true);
    expect(await exists(path.join(testDir, '.claude', 'commands', 'humanspec', 'propose.md'))).toBe(true);
    // Registered unselected OpenSpec artifacts removed.
    expect(await exists(path.join(testDir, '.claude', 'skills', 'openspec-apply-change', 'SKILL.md'))).toBe(false);
    expect(await exists(path.join(testDir, '.claude', 'skills', 'openspec-propose', 'SKILL.md'))).toBe(false);
    expect(await exists(path.join(testDir, '.claude', 'commands', 'opsx', 'apply.md'))).toBe(false);
    expect(await exists(path.join(testDir, '.claude', 'commands', 'opsx', 'propose.md'))).toBe(false);
    // User files preserved.
    expect(await exists(path.join(testDir, '.claude', 'skills', 'openspec-apply-change-backup', 'SKILL.md'))).toBe(true);
    expect(await exists(userNote)).toBe(true);
    expect(await exists(managedSibling)).toBe(true);
    expect(await exists(path.join(testDir, '.claude', 'commands', 'mycompany', 'apply.md'))).toBe(true);
    expect(await exists(path.join(testDir, '.other-tool', 'opsx-apply.md'))).toBe(true);
  });

  it('switching humanspec → core restores core artifacts and removes only registered humanspec paths', async () => {
    setMockConfig({ featureFlags: {}, profile: 'core', delivery: 'both' });
    await writeProjectConfig('schema: spec-driven\nprofile: core\n');

    // Simulated prior humanspec install.
    for (const dirName of HUMANSPEC_SKILLS) {
      await writeSkill(dirName);
    }
    for (const id of ['init', 'next', 'propose', 'coach', 'verify', 'archive', 'explore']) {
      await writeCommand(path.join('.claude', 'commands', 'humanspec', `${id}.md`));
    }
    // A user file that sits beside the managed humanspec skill dirs.
    const userNote = path.join(testDir, '.claude', 'skills', 'user-notes.md');
    await fs.mkdir(path.dirname(userNote), { recursive: true });
    await fs.writeFile(userNote, 'user notes\n');

    await updateCommand.execute(testDir);

    // Core artifacts restored.
    expect(await exists(path.join(testDir, '.claude', 'skills', 'openspec-propose', 'SKILL.md'))).toBe(true);
    expect(await exists(path.join(testDir, '.claude', 'skills', 'openspec-apply-change', 'SKILL.md'))).toBe(true);
    expect(await exists(path.join(testDir, '.claude', 'commands', 'opsx', 'apply.md'))).toBe(true);
    // Registered humanspec artifacts removed.
    expect(await exists(path.join(testDir, '.claude', 'skills', 'humanspec-init', 'SKILL.md'))).toBe(false);
    expect(await exists(path.join(testDir, '.claude', 'commands', 'humanspec', 'propose.md'))).toBe(false);
    // User file beside a removed managed skill directory is preserved.
    expect(await exists(userNote)).toBe(true);
  });
  it('is idempotent: a second update after sync reports no drift and rewrites nothing', async () => {
    setMockConfig({ featureFlags: {}, profile: 'core', delivery: 'both' });
    await writeProjectConfig('schema: human-learning\nprofile: humanspec\n');
    await writeSkill('openspec-propose'); // stale artifact to force the first sync

    const consoleSpy = vi.spyOn(console, 'log');
    await updateCommand.execute(testDir);
    expect(await exists(path.join(testDir, '.claude', 'skills', 'openspec-propose', 'SKILL.md'))).toBe(false);

    // Second update: everything is in sync; the skill files must not be rewritten.
    const proposeSkill = path.join(testDir, '.claude', 'skills', 'humanspec-propose', 'SKILL.md');
    const before = await fs.readFile(proposeSkill, 'utf-8');
    consoleSpy.mockClear();
    await updateCommand.execute(testDir);
    const after = await fs.readFile(proposeSkill, 'utf-8');
    expect(after).toBe(before);

    const calls = consoleSpy.mock.calls.map((call) => call.map(String).join(' '));
    expect(calls.some((line) => line.includes('up to date'))).toBe(true);
    consoleSpy.mockRestore();
  });

  it('reconciles mixed tools: humanspec skills for a skill tool and humanspec commands for a command tool', async () => {
    setMockConfig({ featureFlags: {}, profile: 'core', delivery: 'both' });
    await writeProjectConfig('schema: human-learning\nprofile: humanspec\n');

    // claude (adapter-backed) and kimi (skill-only, adapterless).
    for (const dirName of ['openspec-propose']) {
      const skillFile = path.join(testDir, '.claude', 'skills', dirName, 'SKILL.md');
      await fs.mkdir(path.dirname(skillFile), { recursive: true });
      await fs.writeFile(skillFile, `name: ${dirName}\n`);
    }
    const kimiSkillFile = path.join(testDir, '.kimi-code', 'skills', 'openspec-propose', 'SKILL.md');
    await fs.mkdir(path.dirname(kimiSkillFile), { recursive: true });
    await fs.writeFile(kimiSkillFile, 'name: openspec-propose\n');

    await updateCommand.execute(testDir);

    expect(await exists(path.join(testDir, '.claude', 'skills', 'humanspec-propose', 'SKILL.md'))).toBe(true);
    expect(await exists(path.join(testDir, '.claude', 'commands', 'humanspec', 'propose.md'))).toBe(true);
    expect(await exists(path.join(testDir, '.kimi-code', 'skills', 'humanspec-propose', 'SKILL.md'))).toBe(true);
    // Kimi has no command adapter: no humanspec commands for it.
    const kimiCommands = path.join(testDir, '.kimi-code', 'commands');
    let hasCommands = false;
    try {
      const entries = await fs.readdir(kimiCommands);
      hasCommands = entries.length > 0;
    } catch {
      hasCommands = false;
    }
    expect(hasCommands).toBe(false);
  });

  it('keeps delivery-only and command-surface dimensions independent of profile membership', async () => {
    // delivery=skills on a humanspec project: skills are generated, and the
    // registered humanspec command files are reconciled away (delivery), while
    // profile membership still selects exactly the seven workflows.
    setMockConfig({ featureFlags: {}, profile: 'core', delivery: 'skills' });
    await writeProjectConfig('schema: human-learning\nprofile: humanspec\n');
    await writeCommand(path.join('.claude', 'commands', 'humanspec', 'propose.md'));

    await updateCommand.execute(testDir);

    expect(await exists(path.join(testDir, '.claude', 'skills', 'humanspec-propose', 'SKILL.md'))).toBe(true);
    expect(await exists(path.join(testDir, '.claude', 'commands', 'humanspec', 'propose.md'))).toBe(false);
    expect(await exists(path.join(testDir, '.claude', 'skills', 'openspec-apply-change', 'SKILL.md'))).toBe(false);
  });
});
