import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Command } from 'commander';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';

vi.mock('@inquirer/prompts', () => ({
  select: vi.fn(),
  checkbox: vi.fn(),
  confirm: vi.fn(),
}));

async function runConfigCommand(args: string[]): Promise<void> {
  const { registerConfigCommand } = await import('../../src/commands/config.js');
  const program = new Command();
  registerConfigCommand(program);
  await program.parseAsync(['node', 'openspec', 'config', ...args]);
}

async function getPromptMocks(): Promise<{
  select: ReturnType<typeof vi.fn>;
  checkbox: ReturnType<typeof vi.fn>;
  confirm: ReturnType<typeof vi.fn>;
}> {
  const prompts = await import('@inquirer/prompts');
  return {
    select: prompts.select as unknown as ReturnType<typeof vi.fn>,
    checkbox: prompts.checkbox as unknown as ReturnType<typeof vi.fn>,
    confirm: prompts.confirm as unknown as ReturnType<typeof vi.fn>,
  };
}

describe('config profile humanspec', () => {
  let tempDir: string;
  let originalEnv: NodeJS.ProcessEnv;
  let originalCwd: string;
  let originalTTY: boolean | undefined;
  let originalExitCode: number | undefined;
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  function writeProjectConfig(profile: string): void {
    const configDir = path.join(tempDir, 'openspec');
    fs.mkdirSync(configDir, { recursive: true });
    fs.writeFileSync(path.join(configDir, 'config.yaml'), `schema: human-learning\nprofile: ${profile}\n`, 'utf-8');
  }

  beforeEach(() => {
    vi.resetModules();
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'openspec-config-humanspec-test-'));
    originalEnv = { ...process.env };
    originalCwd = process.cwd();
    originalTTY = (process.stdout as NodeJS.WriteStream & { isTTY?: boolean }).isTTY;
    originalExitCode = process.exitCode;
    process.env.XDG_CONFIG_HOME = tempDir;
    process.chdir(tempDir);
    (process.stdout as NodeJS.WriteStream & { isTTY?: boolean }).isTTY = true;
    process.exitCode = undefined;
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    process.env = originalEnv;
    process.chdir(originalCwd);
    (process.stdout as NodeJS.WriteStream & { isTTY?: boolean }).isTTY = originalTTY;
    process.exitCode = originalExitCode;
    fs.rmSync(tempDir, { recursive: true, force: true });
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    vi.clearAllMocks();
  });

  it('humanspec preset shortcut sets the exact profile and preserves delivery', async () => {
    const { saveGlobalConfig, getGlobalConfig } = await import('../../src/core/global-config.js');
    const { HUMANSPEC_WORKFLOWS } = await import('../../src/core/profiles.js');
    const { select, checkbox, confirm } = await getPromptMocks();

    saveGlobalConfig({ featureFlags: {}, profile: 'custom', delivery: 'skills', workflows: ['explore'] });
    await runConfigCommand(['profile', 'humanspec']);

    const config = getGlobalConfig();
    expect(config.profile).toBe('humanspec');
    expect(config.delivery).toBe('skills');
    expect(config.workflows).toEqual([...HUMANSPEC_WORKFLOWS]);
    expect(select).not.toHaveBeenCalled();
    expect(checkbox).not.toHaveBeenCalled();
    expect(confirm).not.toHaveBeenCalled();
  });

  it('preset changes use the effective-project apply prompt', async () => {
    const { saveGlobalConfig } = await import('../../src/core/global-config.js');
    const { confirm } = await getPromptMocks();

    fs.mkdirSync(path.join(tempDir, 'openspec'), { recursive: true });
    fs.writeFileSync(path.join(tempDir, 'openspec', 'config.yaml'), 'schema: spec-driven\n', 'utf-8');
    saveGlobalConfig({ featureFlags: {}, profile: 'core', delivery: 'both', workflows: ['propose', 'explore', 'apply', 'update', 'sync', 'archive'] });
    confirm.mockResolvedValueOnce(false);

    await runConfigCommand(['profile', 'humanspec']);

    expect(confirm).toHaveBeenCalledWith({ message: 'Apply changes to this project now?', default: true });
  });

  it('unknown preset is rejected', async () => {
    await runConfigCommand(['profile', 'apply']);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Unknown profile preset "apply". Available presets: core, humanspec')
    );
    expect(process.exitCode).toBe(1);
  });

  it('derives humanspec only from the exact seven-workflow set', async () => {
    const { deriveProfileFromWorkflowSelection } = await import('../../src/commands/config.js');
    const { HUMANSPEC_WORKFLOWS } = await import('../../src/core/profiles.js');

    expect(deriveProfileFromWorkflowSelection([...HUMANSPEC_WORKFLOWS])).toBe('humanspec');
    expect(deriveProfileFromWorkflowSelection([...HUMANSPEC_WORKFLOWS].reverse())).toBe('humanspec');
    expect(deriveProfileFromWorkflowSelection(HUMANSPEC_WORKFLOWS.slice(0, 6))).toBe('custom');
    expect(deriveProfileFromWorkflowSelection([...HUMANSPEC_WORKFLOWS, 'apply'])).toBe('custom');
    expect(deriveProfileFromWorkflowSelection(['propose', 'explore', 'apply', 'update', 'sync', 'archive'])).toBe('core');
    expect(deriveProfileFromWorkflowSelection([])).toBe('custom');
  });

  it('uses the specified change labels in the interactive action menu', async () => {
    const { select } = await getPromptMocks();
    select.mockResolvedValueOnce('keep');

    await runConfigCommand(['profile']);

    const [prompt] = select.mock.calls[0] as [{ choices: Array<{ name: string }> }];
    expect(prompt.choices.map((choice) => choice.name)).toEqual([
      'Change delivery and workflows',
      'Change delivery only',
      'Change workflows only',
      'Keep current settings (exit)',
    ]);
  });

  it('interactive selector with exactly the seven workflows saves the humanspec preset in lifecycle order', async () => {
    const { saveGlobalConfig, getGlobalConfig } = await import('../../src/core/global-config.js');
    const { HUMANSPEC_WORKFLOWS } = await import('../../src/core/profiles.js');
    const { select, checkbox, confirm } = await getPromptMocks();

    saveGlobalConfig({ featureFlags: {}, profile: 'core', delivery: 'both', workflows: ['propose', 'explore', 'apply', 'update', 'sync', 'archive'] });
    select.mockResolvedValueOnce('workflows');
    checkbox.mockResolvedValueOnce([...HUMANSPEC_WORKFLOWS]);
    confirm.mockResolvedValueOnce(false);

    await runConfigCommand(['profile']);

    const config = getGlobalConfig();
    expect(config.profile).toBe('humanspec');
    expect(config.workflows).toEqual([...HUMANSPEC_WORKFLOWS]);
  });

  it('shows the effective project override source in the summary header', async () => {
    const { saveGlobalConfig } = await import('../../src/core/global-config.js');
    const { select } = await getPromptMocks();

    writeProjectConfig('humanspec');
    saveGlobalConfig({ featureFlags: {}, profile: 'core', delivery: 'both', workflows: ['propose', 'explore', 'apply', 'update', 'sync', 'archive'] });
    select.mockResolvedValueOnce('keep');

    await runConfigCommand(['profile']);

    const allLogs = consoleLogSpy.mock.calls.map((args) => args.map(String).join(' '));
    expect(allLogs.some((line) => line.includes('Workflows: 7 selected (humanspec)'))).toBe(true);
    expect(allLogs.some((line) => line.includes('Profile source: project config'))).toBe(true);
    expect(allLogs.some((line) => line.includes('overrides the global profile'))).toBe(true);
  });

  it('global profile change under a project-declared profile does not prompt apply and explains the override', async () => {
    const { saveGlobalConfig, getGlobalConfig } = await import('../../src/core/global-config.js');
    const { select, checkbox, confirm } = await getPromptMocks();

    writeProjectConfig('humanspec');
    saveGlobalConfig({ featureFlags: {}, profile: 'core', delivery: 'both', workflows: ['propose', 'explore', 'apply', 'update', 'sync', 'archive'] });
    select.mockResolvedValueOnce('workflows');
    checkbox.mockResolvedValueOnce(['propose', 'explore']);

    await runConfigCommand(['profile']);

    expect(getGlobalConfig().profile).toBe('custom');
    expect(confirm).not.toHaveBeenCalled();
    const allLogs = consoleLogSpy.mock.calls.map((args) => args.map(String).join(' '));
    expect(allLogs.some((line) => line.includes('This project declares its own profile (humanspec'))).toBe(true);
    expect(allLogs.some((line) => line.includes('continues to determine this project'))).toBe(true);
  });

  it('delivery change still affects the project and is distinguished from the profile override', async () => {
    const { saveGlobalConfig, getGlobalConfig } = await import('../../src/core/global-config.js');
    const { select, confirm } = await getPromptMocks();

    writeProjectConfig('humanspec');
    saveGlobalConfig({ featureFlags: {}, profile: 'core', delivery: 'both', workflows: ['propose', 'explore', 'apply', 'update', 'sync', 'archive'] });
    select.mockResolvedValueOnce('delivery');
    select.mockResolvedValueOnce('skills');
    confirm.mockResolvedValueOnce(false);

    await runConfigCommand(['profile']);

    expect(getGlobalConfig().delivery).toBe('skills');
    // The delivery change reaches the project, so the apply prompt IS asked.
    expect(confirm).toHaveBeenCalledWith({ message: 'Apply changes to this project now?', default: true });
    const allLogs = consoleLogSpy.mock.calls.map((args) => args.map(String).join(' '));
    expect(allLogs.some((line) => line.includes('Delivery changes still affect this project.'))).toBe(true);
  });

  it('no-op under a project-declared profile warns using the project effective profile', async () => {
    const { saveGlobalConfig } = await import('../../src/core/global-config.js');
    const { select } = await getPromptMocks();

    writeProjectConfig('humanspec');
    saveGlobalConfig({ featureFlags: {}, profile: 'core', delivery: 'both', workflows: ['propose', 'explore', 'apply', 'update', 'sync', 'archive'] });
    // A humanspec project with only one humanspec skill is out of sync with
    // its own declared profile; the no-op warning must fire based on the
    // project effective profile even though the global profile is core.
    const humanspecSkillPath = path.join(tempDir, '.claude', 'skills', 'humanspec-init', 'SKILL.md');
    fs.mkdirSync(path.dirname(humanspecSkillPath), { recursive: true });
    fs.writeFileSync(humanspecSkillPath, 'name: humanspec-init\n', 'utf-8');
    select.mockResolvedValueOnce('keep');

    await runConfigCommand(['profile']);

    expect(consoleLogSpy).toHaveBeenCalledWith('No config changes.');
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Warning: Global config is not applied to this project.'));
  });
});
