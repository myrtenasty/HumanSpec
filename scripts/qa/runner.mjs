#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { promises as fs, readFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { assertSuccessfulCommand } from './process.mjs';
import { createSandbox } from './sandbox.mjs';
import { runCommand } from './process.mjs';
import { installPackedArtifact, preparePackedArtifact, resolveNpmInvocation } from './package.mjs';
import { selectScenarios, SCENARIOS, QA_TIERS } from './registry.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const sourceCliPath = path.join(repoRoot, 'bin', 'openspec.js');
const packageManifest = JSON.parse(readFileSync(path.join(repoRoot, 'package.json'), 'utf8'));

function printHelp() {
  console.log(`Usage: node scripts/qa/runner.mjs [options]

Options:
  --tier <fast|smoke|capstone>  Select the registered deterministic tier (default: smoke)
  --scenario <id,...>           Run selected stable scenario IDs
  --keep-artifacts              Retain successful scenario sandboxes
  --artifact-dir <path>         Copy diagnostics to this directory on failures
  --tarball <path>              Reuse an exact npm tarball instead of packing
  --list                        List registered scenarios without running them
  --help                        Show this help
`);
}

function parseArgs(argv) {
  const options = {
    tier: 'smoke',
    ids: [],
    keepArtifacts: false,
    artifactDirectory: undefined,
    tarball: process.env.OPENSPEC_QA_TARBALL,
    list: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--') continue;
    if (arg === '--help' || arg === '-h') { options.help = true; continue; }
    if (arg === '--list') { options.list = true; continue; }
    if (arg === '--keep-artifacts') { options.keepArtifacts = true; continue; }
    if (arg === '--tier') { options.tier = argv[++index]; continue; }
    if (arg.startsWith('--tier=')) { options.tier = arg.slice('--tier='.length); continue; }
    if (arg === '--scenario') { options.ids.push(...String(argv[++index] ?? '').split(',').filter(Boolean)); continue; }
    if (arg.startsWith('--scenario=')) { options.ids.push(...arg.slice('--scenario='.length).split(',').filter(Boolean)); continue; }
    if (arg === '--artifact-dir') { options.artifactDirectory = argv[++index]; continue; }
    if (arg.startsWith('--artifact-dir=')) { options.artifactDirectory = arg.slice('--artifact-dir='.length); continue; }
    if (arg === '--tarball') { options.tarball = argv[++index]; continue; }
    if (arg.startsWith('--tarball=')) { options.tarball = arg.slice('--tarball='.length); continue; }
    throw new Error(`Unknown option ${arg}. Use --help.`);
  }
  return options;
}

async function ensureBuilt({ force = false } = {}) {
  if (!force) {
    try {
      await fs.access(path.join(repoRoot, 'dist', 'cli', 'index.js'));
      return;
    } catch {}
  }
  const result = await runCommand(process.execPath, [path.join(repoRoot, 'build.js')], {
    cwd: repoRoot,
    env: { ...process.env, OPENSPEC_TELEMETRY: '0', OPEN_SPEC_INTERACTIVE: '0' },
    timeoutMs: 180_000,
  });
  assertSuccessfulCommand(result, 'build before QA');
}

async function artifactFromTarball(tarballPath) {
  const absolute = path.resolve(tarballPath);
  const buffer = await fs.readFile(absolute);
  return {
    tarball: absolute,
    filename: path.basename(absolute),
    integrity: `sha512-${createHash('sha512').update(buffer).digest('base64')}`,
    sha512: createHash('sha512').update(buffer).digest('base64'),
    size: buffer.length,
    packageName: packageManifest.name,
    version: packageManifest.version,
    packageManifest,
    source: 'ci-artifact',
  };
}

async function prepareArtifact(options, requiresPacked) {
  if (!requiresPacked) return null;
  if (options.tarball) {
    const artifact = await artifactFromTarball(options.tarball);
    console.log(`Reusing packed artifact: ${artifact.tarball} (${artifact.integrity})`);
    return artifact;
  }
  const outputDirectory = options.artifactDirectory
    ? path.join(path.resolve(options.artifactDirectory), 'package')
    : undefined;
  const artifact = await preparePackedArtifact({ repoRoot, outputDirectory });
  await fs.writeFile(
    path.join(outputDirectory ?? path.dirname(artifact.tarball), 'artifact.json'),
    `${JSON.stringify({ ...artifact, packageManifest: undefined }, null, 2)}\n`,
    'utf8'
  );
  console.log(`Packed artifact: ${artifact.tarball} (${artifact.integrity})`);
  return artifact;
}

async function runOneScenario(scenario, options, artifact) {
  const sandbox = await createSandbox({
    prefix: `openspec-qa-${scenario.id}-`,
    artifactDirectory: options.artifactDirectory ? path.resolve(options.artifactDirectory) : undefined,
  });
  const commands = [];
  const before = await sandbox.snapshot(scenario.snapshotPaths ?? []);
  const context = {
    repoRoot,
    packageName: packageManifest.name,
    packageVersion: packageManifest.version,
    packageManifest,
    scenario,
    sandbox,
    projectRoot: sandbox.project,
    cliPath: sourceCliPath,
    artifact,
    installed: null,
    installedCli: null,
    get npmInvocation() { return resolveNpmInvocation({ env: sandbox.environment }); },
    async run(command, args = [], commandOptions = {}) {
      const result = await runCommand(command, args, {
        cwd: commandOptions.cwd ?? sandbox.project,
        env: commandOptions.env ?? sandbox.environment,
        timeoutMs: commandOptions.timeoutMs ?? scenario.timeoutMs ?? 30_000,
        input: commandOptions.input,
      });
      commands.push(result);
      const commandIndex = String(commands.length).padStart(2, '0');
      const commandDir = path.join(sandbox.diagnostics, 'commands');
      await fs.mkdir(commandDir, { recursive: true });
      await fs.writeFile(path.join(commandDir, `${commandIndex}.json`), `${JSON.stringify(result, null, 2)}\n`, 'utf8');
      await fs.writeFile(path.join(commandDir, `${commandIndex}.stdout`), result.stdout, 'utf8');
      await fs.writeFile(path.join(commandDir, `${commandIndex}.stderr`), result.stderr, 'utf8');
      return result;
    },
    async cli(args, commandOptions = {}) {
      return context.run(process.execPath, [sourceCliPath, ...args], commandOptions);
    },
    async installPacked() {
      if (!artifact) throw new Error('This scenario did not receive a packed artifact.');
      context.installed = await installPackedArtifact({
        artifact,
        workspace: sandbox.project,
        env: sandbox.environment,
      });
      context.packageName = context.installed.packageManifest.name;
      context.packageVersion = context.installed.packageManifest.version;
      context.installedCli = context.installed.bins.openspec ?? Object.values(context.installed.bins)[0];
      return context.installed;
    },
    async installedCliRun(args, commandOptions = {}) {
      if (!context.installedCli) await context.installPacked();
      const packageRoot = path.resolve(context.installed.packageRoot);
      const cliPath = path.resolve(context.installedCli);
      if (!cliPath.startsWith(`${packageRoot}${path.sep}`)) {
        throw new Error(`Refusing to run a CLI outside the installed package root: ${cliPath}`);
      }
      return context.run(process.execPath, [cliPath, ...args], commandOptions);
    },
    async snapshot(extraPaths = []) {
      return sandbox.snapshot(extraPaths);
    },
  };

  try {
    await scenario.run(context);
    const after = await sandbox.snapshot(scenario.snapshotPaths ?? []);
    if (options.keepArtifacts) {
      await sandbox.retainDiagnostics({ scenario: scenario.id, status: 'passed', before, after, commands });
    }
    await sandbox.cleanup({ keep: options.keepArtifacts });
    return { scenario: scenario.id, status: 'passed', diagnostics: options.keepArtifacts ? sandbox.diagnostics : null };
  } catch (error) {
    const after = await sandbox.snapshot(scenario.snapshotPaths ?? []);
    const diagnostics = await sandbox.retainDiagnostics({
      scenario: scenario.id,
      status: 'failed',
      error: String(error?.stack ?? error),
      before,
      after,
      commands,
    });
    // Failure diagnostics intentionally retain the temporary root. The
    // manifest points at it, while artifactDirectory receives command/state
    // evidence that CI can upload without exposing the host filesystem.
    return { scenario: scenario.id, status: 'failed', error, diagnostics, root: sandbox.root };
  }
}

function listScenarios() {
  for (const scenario of SCENARIOS) {
    console.log(`${scenario.id}\t${scenario.tier.join(',')}\t${scenario.description}`);
  }
}

async function main(argv = process.argv.slice(2)) {
  const options = parseArgs(argv);
  if (options.help) { printHelp(); return 0; }
  if (options.list) { listScenarios(); return 0; }
  if (options.artifactDirectory) await fs.mkdir(path.resolve(options.artifactDirectory), { recursive: true });

  const scenarios = selectScenarios({ tier: options.tier, ids: options.ids });
  if (scenarios.length === 0) {
    console.log(`No registered ${options.tier} scenarios are supported on ${process.platform}.`);
    return 0;
  }
  const requiresPacked = scenarios.some((scenario) => scenario.requiresPackedArtifact);
  await ensureBuilt({ force: requiresPacked && !options.tarball });
  const artifact = await prepareArtifact(options, requiresPacked);

  console.log(`QA tier: ${options.tier} (${scenarios.length} scenario${scenarios.length === 1 ? '' : 's'})`);
  const results = [];
  for (const scenario of scenarios) {
    console.log(`\n▶ ${scenario.id}: ${scenario.description}`);
    const result = await runOneScenario(scenario, options, artifact);
    results.push(result);
    if (result.status === 'passed') {
      console.log(`✓ ${scenario.id}` + (result.diagnostics ? ` (artifacts: ${result.diagnostics})` : ''));
    } else {
      console.error(`✗ ${scenario.id}: ${String(result.error?.message ?? result.error)}`);
      console.error(`  diagnostics: ${result.diagnostics}`);
      console.error(`  sandbox retained at: ${result.root}`);
    }
  }

  const failed = results.filter((result) => result.status === 'failed');
  console.log(`\nQA summary: ${results.length - failed.length}/${results.length} scenarios passed.`);
  if (failed.length > 0) {
    console.error(`Failed scenarios: ${failed.map((result) => result.scenario).join(', ')}`);
    return 1;
  }
  return 0;
}

if (import.meta.url === `file://${process.argv[1]?.replaceAll('\\', '/')}` || process.argv[1]?.endsWith('runner.mjs')) {
  main().then((code) => { process.exitCode = code; }).catch((error) => {
    console.error(`QA runner failed: ${String(error?.stack ?? error)}`);
    process.exitCode = 1;
  });
}

export { main, parseArgs, selectScenarios, repoRoot };
