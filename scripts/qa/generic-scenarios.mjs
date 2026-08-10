import { promises as fs } from 'node:fs';
import path from 'node:path';

import {
  assert,
  assertContains,
  assertExit,
  assertFileExists,
  assertFileMissing,
  readJson,
} from './assertions.mjs';

const CLAUDE_SKILLS = path.join('.claude', 'skills');
const CLAUDE_COMMANDS = path.join('.claude', 'commands', 'opsx');

async function init(ctx, args = ['--tools', 'claude']) {
  const result = await ctx.cli(['init', '.', ...args, '--no-animation']);
  assertExit(result);
  assertContains(result.stdout, 'OpenSpec Setup Complete', 'init output');
  return result;
}

async function configureGlobal(ctx, key, value) {
  const result = await ctx.cli(['config', 'set', key, value]);
  assertExit(result);
}

async function writeGlobalConfig(ctx, value) {
  const target = path.join(ctx.sandbox.config, 'openspec', 'config.json');
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  return target;
}

async function assertCoreSurface(projectRoot) {
  await assertFileExists(path.join(projectRoot, 'openspec', 'config.yaml'), 'project config');
  await assertFileExists(path.join(projectRoot, CLAUDE_SKILLS, 'openspec-propose', 'SKILL.md'), 'propose skill');
  await assertFileExists(path.join(projectRoot, CLAUDE_COMMANDS, 'propose.md'), 'propose command');
}

export const genericScenarios = Object.freeze([
  {
    id: 'generic-init-detected-tool',
    description: 'Initializes a project non-interactively from an explicitly detected AI-tool directory.',
    tier: ['fast', 'smoke'],
    platforms: ['linux', 'darwin', 'win32'],
    timeoutMs: 45_000,
    async run(ctx) {
      await fs.mkdir(path.join(ctx.projectRoot, '.claude'), { recursive: true });
      await init(ctx, []);
      await assertCoreSurface(ctx.projectRoot);
      const config = await fs.readFile(path.join(ctx.projectRoot, 'openspec', 'config.yaml'), 'utf8');
      assert(config.includes('profile: core'), 'init did not persist the core profile in project config.');
      assert(config.includes('schema: spec-driven'), 'init did not persist the default schema.');
    },
  },
  {
    id: 'generic-unset-profile-migration',
    description: 'Migrates an existing generated surface when the legacy global profile is unset.',
    tier: ['fast', 'smoke'],
    platforms: ['linux', 'darwin', 'win32'],
    timeoutMs: 60_000,
    async run(ctx) {
      await init(ctx);
      await fs.writeFile(
        path.join(ctx.projectRoot, 'openspec', 'config.yaml'),
        'schema: spec-driven\n',
        'utf8'
      );
      await writeGlobalConfig(ctx, { delivery: 'both' });
      const result = await ctx.cli(['init', '.', '--tools', 'claude', '--no-animation']);
      assertExit(result);
      assertContains(result.stdout, 'Migrated: custom profile', 'migration output');
      const migrated = await readJson(path.join(ctx.sandbox.config, 'openspec', 'config.json'));
      assert(migrated.profile === 'custom', 'unset-profile migration did not select custom profile.');
      assert(Array.isArray(migrated.workflows) && migrated.workflows.includes('propose'), 'migration did not retain detected workflows.');
    },
  },
  {
    id: 'generic-delivery-both-to-skills',
    description: 'Synchronizes generated artifacts from both delivery to skills-only delivery.',
    tier: ['fast', 'smoke'],
    platforms: ['linux', 'darwin', 'win32'],
    timeoutMs: 60_000,
    async run(ctx) {
      await init(ctx);
      await assertFileExists(path.join(ctx.projectRoot, CLAUDE_COMMANDS, 'propose.md'));
      await configureGlobal(ctx, 'delivery', 'skills');
      const result = await ctx.cli(['update', '.', '--force']);
      assertExit(result);
      await assertFileExists(path.join(ctx.projectRoot, CLAUDE_SKILLS, 'openspec-propose', 'SKILL.md'));
      await assertFileMissing(path.join(ctx.projectRoot, CLAUDE_COMMANDS, 'propose.md'), 'skills-only command');
      assertContains(result.stdout, 'delivery: skills', 'skills cleanup output');
    },
  },
  {
    id: 'generic-delivery-both-to-commands',
    description: 'Synchronizes generated artifacts from both delivery to commands-only delivery.',
    tier: ['fast', 'smoke'],
    platforms: ['linux', 'darwin', 'win32'],
    timeoutMs: 60_000,
    async run(ctx) {
      await init(ctx);
      await assertFileExists(path.join(ctx.projectRoot, CLAUDE_SKILLS, 'openspec-propose', 'SKILL.md'));
      await configureGlobal(ctx, 'delivery', 'commands');
      const result = await ctx.cli(['update', '.', '--force']);
      assertExit(result);
      await assertFileExists(path.join(ctx.projectRoot, CLAUDE_COMMANDS, 'propose.md'), 'commands-only command');
      await assertFileMissing(path.join(ctx.projectRoot, CLAUDE_SKILLS, 'openspec-propose', 'SKILL.md'), 'commands-only skill');
      assertContains(result.stdout, 'delivery: commands', 'commands cleanup output');
    },
  },
  {
    id: 'generic-commands-only-update-and-new-tool',
    description: 'Reports an up-to-date commands-only install and identifies a newly appearing tool directory.',
    tier: ['fast', 'smoke'],
    platforms: ['linux', 'darwin', 'win32'],
    timeoutMs: 60_000,
    async run(ctx) {
      await init(ctx);
      await configureGlobal(ctx, 'delivery', 'commands');
      await ctx.cli(['update', '.', '--force']).then(assertExit);
      await fs.mkdir(path.join(ctx.projectRoot, '.cursor'), { recursive: true });
      const result = await ctx.cli(['update', '.']);
      assertExit(result);
      assertContains(result.stdout, 'All 1 tool(s) up to date', 'commands-only update output');
      assertContains(result.stdout, 'Detected new tool', 'new tool detection output');
      await assertFileExists(path.join(ctx.projectRoot, CLAUDE_COMMANDS, 'propose.md'));
    },
  },
  {
    id: 'generic-invalid-profile-override',
    description: 'Rejects an invalid profile before creating or changing project surfaces.',
    tier: ['fast', 'smoke'],
    platforms: ['linux', 'darwin', 'win32'],
    timeoutMs: 30_000,
    async run(ctx) {
      const result = await ctx.cli(['init', '.', '--tools', 'none', '--profile', 'not-a-profile', '--no-animation']);
      assert(result.exitCode !== 0, 'invalid profile override unexpectedly succeeded.');
      assertContains(`${result.stdout}\n${result.stderr}`, 'Invalid profile', 'invalid profile diagnostic');
      await assertFileMissing(path.join(ctx.projectRoot, 'openspec'), 'project root after invalid profile');
    },
  },
]);
