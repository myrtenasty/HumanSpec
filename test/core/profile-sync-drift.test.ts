import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import {
  hasProjectConfigDrift,
  hasToolProfileOrDeliveryDrift,
  WORKFLOW_TO_SKILL_DIR,
} from '../../src/core/profile-sync-drift.js';
import { CORE_WORKFLOWS, HUMANSPEC_WORKFLOWS } from '../../src/core/profiles.js';
import { CommandAdapterRegistry } from '../../src/core/command-generation/index.js';
import { getCommandDescriptorForWorkflow } from '../../src/core/templates/command-descriptors.js';

function writeSkill(projectDir: string, workflowId: string): void {
  const skillDirName = WORKFLOW_TO_SKILL_DIR[workflowId as keyof typeof WORKFLOW_TO_SKILL_DIR];
  const skillPath = path.join(projectDir, '.claude', 'skills', skillDirName, 'SKILL.md');
  fs.mkdirSync(path.dirname(skillPath), { recursive: true });
  fs.writeFileSync(skillPath, `name: ${skillDirName}\n`);
}

function writeCommand(projectDir: string, workflowId: string): void {
  const adapter = CommandAdapterRegistry.get('claude');
  if (!adapter) throw new Error('Claude adapter unavailable in test environment');
  const descriptor = getCommandDescriptorForWorkflow(workflowId);
  if (!descriptor) throw new Error(`Missing command descriptor for ${workflowId}`);
  const cmdPath = adapter.getFilePath(descriptor);
  const fullPath = path.isAbsolute(cmdPath) ? cmdPath : path.join(projectDir, cmdPath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, `# ${workflowId}\n`);
}

function setupCoreSkills(projectDir: string): void {
  for (const workflow of CORE_WORKFLOWS) {
    writeSkill(projectDir, workflow);
  }
}

function setupCoreCommands(projectDir: string): void {
  for (const workflow of CORE_WORKFLOWS) {
    writeCommand(projectDir, workflow);
  }
}

function setupHumanSpecSkills(projectDir: string): void {
  for (const workflow of HUMANSPEC_WORKFLOWS) {
    writeSkill(projectDir, workflow);
  }
}

function setupHumanSpecCommands(projectDir: string): void {
  for (const workflow of HUMANSPEC_WORKFLOWS) {
    writeCommand(projectDir, workflow);
  }
}

describe('profile sync drift detection', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'openspec-profile-sync-drift-test-'));
    fs.mkdirSync(path.join(tempDir, 'openspec'), { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('detects drift for skills-only delivery when commands still exist', () => {
    setupCoreSkills(tempDir);
    setupCoreCommands(tempDir);

    const hasDrift = hasProjectConfigDrift(tempDir, CORE_WORKFLOWS, 'skills');
    expect(hasDrift).toBe(true);
  });

  it('detects drift for commands-only delivery when skills still exist', () => {
    setupCoreCommands(tempDir);
    setupCoreSkills(tempDir);

    const hasDrift = hasProjectConfigDrift(tempDir, CORE_WORKFLOWS, 'commands');
    expect(hasDrift).toBe(true);
  });

  it('detects drift when required profile workflow files are missing', () => {
    writeSkill(tempDir, 'explore');

    const hasDrift = hasProjectConfigDrift(tempDir, CORE_WORKFLOWS, 'both');
    expect(hasDrift).toBe(true);
  });

  it('returns false when project files match core profile and delivery', () => {
    setupCoreSkills(tempDir);
    setupCoreCommands(tempDir);

    const hasDrift = hasProjectConfigDrift(tempDir, CORE_WORKFLOWS, 'both');
    expect(hasDrift).toBe(false);
  });

  it('detects drift when extra workflows are installed for both delivery', () => {
    setupCoreSkills(tempDir);
    setupCoreCommands(tempDir);
    writeSkill(tempDir, 'new');
    writeCommand(tempDir, 'new');

    const hasDrift = hasProjectConfigDrift(tempDir, CORE_WORKFLOWS, 'both');
    expect(hasDrift).toBe(true);
  });

  it('returns false when HumanSpec skills and commands are complete', () => {
    setupHumanSpecSkills(tempDir);
    setupHumanSpecCommands(tempDir);

    expect(hasProjectConfigDrift(tempDir, HUMANSPEC_WORKFLOWS, 'both')).toBe(false);
  });

  it('detects a missing HumanSpec command by workflow identity', () => {
    setupHumanSpecSkills(tempDir);
    setupHumanSpecCommands(tempDir);
    const descriptor = getCommandDescriptorForWorkflow('humanspec-propose')!;
    const relative = CommandAdapterRegistry.get('claude')!.getFilePath(descriptor);
    fs.unlinkSync(path.join(tempDir, relative));

    expect(hasProjectConfigDrift(tempDir, HUMANSPEC_WORKFLOWS, 'both')).toBe(true);
  });

  it('detects missing HumanSpec commands in commands-only delivery', () => {
    expect(
      hasToolProfileOrDeliveryDrift(tempDir, 'claude', HUMANSPEC_WORKFLOWS, 'commands')
    ).toBe(true);
  });

  it('keeps colliding OpenSpec and HumanSpec action ids separated by workflow identity', () => {
    setupHumanSpecSkills(tempDir);
    setupHumanSpecCommands(tempDir);
    writeCommand(tempDir, 'propose');

    expect(hasProjectConfigDrift(tempDir, HUMANSPEC_WORKFLOWS, 'both')).toBe(true);
  });
});
