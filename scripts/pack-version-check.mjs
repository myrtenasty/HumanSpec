#!/usr/bin/env node
// Guard that the exact npm tarball exposes the package metadata, executable
// mappings, registered schemas/workflow surfaces, and project-document assets.

import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { assertPackageBinAssets, assertRequiredPackageAssets } from './package-content.mjs';
import {
  normalizeBinMappings,
  parsePackResult,
  resolveInstalledBinPaths,
  resolveInstalledPackageRoot,
  runNpmSync,
  runExecutableSync,
} from './qa/package.mjs';

function log(message) {
  if (process.env.CI) return;
  console.log(message);
}

export function run(command, args = [], options = {}) {
  return runExecutableSync(command, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], ...options });
}

export function npmPack(options = {}) {
  const output = runNpmSync(['pack', '--json', '--silent'], options);
  return parsePackResult(output);
}

export function parseEnvelope(output, expectedOperation) {
  let envelope;
  try {
    envelope = JSON.parse(output);
  } catch (error) {
    throw new Error(`Packed ${expectedOperation} output was not valid JSON: ${String(error)}.`);
  }
  if (envelope.operation !== expectedOperation) {
    throw new Error(`Packed context operation expected ${expectedOperation}, received ${String(envelope.operation)}.`);
  }
  return envelope;
}

function assertVersionOutput(packageName, expected, actual) {
  if (actual !== expected) {
    throw new Error(
      `Packed ${packageName} CLI version mismatch: expected ${expected}, got ${actual}. ` +
      'Ensure the dist is built and the CLI reads version from package.json.'
    );
  }
}

export function assertPackedContextOperations(packageRoot, work, binPath) {
  const projectRoot = path.join(work, 'packed-context-project');
  const openspecRoot = path.join(projectRoot, 'openspec');
  const templateRoot = path.join(packageRoot, 'dist', 'core', 'templates', 'project-docs');
  mkdirSync(path.join(openspecRoot, 'changes', 'archive', '2026-01-01-packed-context-change'), { recursive: true });
  writeFileSync(path.join(openspecRoot, 'config.yaml'), 'schema: spec-driven\n');
  for (const fileName of ['project.md', 'roadmap.md', 'learner.md']) {
    copyFileSync(path.join(templateRoot, fileName), path.join(openspecRoot, fileName));
  }
  writeFileSync(
    path.join(openspecRoot, 'changes', 'archive', '2026-01-01-packed-context-change', 'learning.md'),
    [
      '## AI 验证记录',
      '<!-- humanspec:learning-feedback:start version=1 -->',
      '- learning-status: complete',
      '- mastered: Packed public context runtime',
      '<!-- humanspec:learning-feedback:end -->',
      '',
    ].join('\n')
  );

  const invoke = (args) => run(process.execPath, [binPath, ...args], { cwd: projectRoot });
  const inspect = parseEnvelope(invoke(['humanspec', 'context', 'inspect', '--json']), 'inspect');
  if (inspect.status !== 'ready' || inspect.data?.documents?.length !== 3) {
    throw new Error('Packed inspect did not expose the three registered templates.');
  }

  const next = parseEnvelope(invoke(['humanspec', 'context', 'next', '--json']), 'next');
  if (!['ready', 'empty'].includes(next.status)) {
    throw new Error(`Packed next returned unexpected status: ${String(next.status)}.`);
  }

  const plan = parseEnvelope(
    invoke(['humanspec', 'context', 'feedback-plan', '--change', 'packed-context-change', '--json']),
    'feedback-plan'
  );
  if (plan.status !== 'ready' || !plan.data?.plan) {
    throw new Error('Packed feedback-plan did not produce a ready plan.');
  }
  const planPath = path.join(projectRoot, 'feedback-plan.json');
  writeFileSync(planPath, JSON.stringify(plan));

  const applied = parseEnvelope(
    invoke(['humanspec', 'context', 'feedback-apply', '--plan', planPath, '--yes', '--json']),
    'feedback-apply'
  );
  if (applied.status !== 'complete') {
    throw new Error(`Packed feedback-apply returned unexpected status: ${String(applied.status)}.`);
  }

  const reconciled = parseEnvelope(
    invoke(['humanspec', 'context', 'feedback-reconcile', '--change', 'packed-context-change', '--json']),
    'feedback-reconcile'
  );
  if (reconciled.status !== 'already-applied') {
    throw new Error(`Packed feedback-reconcile returned unexpected status: ${String(reconciled.status)}.`);
  }
}

export function readRepositoryManifest(repoRoot) {
  return JSON.parse(readFileSync(path.join(repoRoot, 'package.json'), 'utf8'));
}

export function resolvePrimaryBin(binPaths, packageManifest) {
  const mappings = normalizeBinMappings(packageManifest.bin);
  const preferred = Object.prototype.hasOwnProperty.call(mappings, 'openspec') ? 'openspec' : Object.keys(mappings)[0];
  if (!preferred || !binPaths[preferred]) throw new Error('Package metadata did not declare an executable bin mapping.');
  return binPaths[preferred];
}

export function main({ repoRoot = process.cwd() } = {}) {
  const repositoryManifest = readRepositoryManifest(repoRoot);
  const expected = repositoryManifest.version;
  const packageName = repositoryManifest.name;
  let work;
  let tgzPath;

  try {
    log(`Packing ${packageName}@${expected}...`);
    const packed = npmPack({ cwd: repoRoot });
    tgzPath = path.resolve(repoRoot, packed.filename);
    log(`Created: ${tgzPath}`);

    work = mkdtempSync(path.join(os.tmpdir(), 'openspec-pack-check-'));
    log(`Temp dir: ${work}`);
    writeFileSync(
      path.join(work, 'package.json'),
      JSON.stringify({ name: 'pack-check', private: true }, null, 2)
    );

    const env = {
      ...process.env,
      OPENSPEC_TELEMETRY: '0',
      OPEN_SPEC_INTERACTIVE: '0',
      npm_config_loglevel: 'silent',
      npm_config_audit: 'false',
      npm_config_fund: 'false',
      npm_config_progress: 'false',
    };
    runNpmSync(['install', tgzPath, '--silent', '--no-audit', '--no-fund', '--no-package-lock'], { cwd: work, env });

    const packageRoot = resolveInstalledPackageRoot(work, packageName);
    const installedManifest = JSON.parse(readFileSync(path.join(packageRoot, 'package.json'), 'utf8'));
    if (installedManifest.name !== packageName) {
      throw new Error(`Installed package identity mismatch: expected ${packageName}, got ${String(installedManifest.name)}.`);
    }
    assertRequiredPackageAssets(packageRoot);
    assertPackageBinAssets(packageRoot, installedManifest);
    const binPaths = resolveInstalledBinPaths(packageRoot, installedManifest);
    const primaryBin = resolvePrimaryBin(binPaths, installedManifest);
    const actual = run(process.execPath, [primaryBin, '--version'], { cwd: work }).trim();
    assertVersionOutput(packageName, expected, actual);

    assertPackedContextOperations(packageRoot, work, primaryBin);
    log('Version, metadata, asset, and packed context checks passed.');
  } finally {
    if (work) {
      try { rmSync(work, { recursive: true, force: true }); } catch {}
    }
    if (tgzPath) {
      try { rmSync(tgzPath, { force: true }); } catch {}
    }
  }
}

if (process.argv[1]?.endsWith('pack-version-check.mjs')) {
  try {
    main();
    console.log('✅ pack-version-check: OK');
  } catch (error) {
    console.error(`❌ pack-version-check: ${error?.message ?? String(error)}`);
    process.exit(1);
  }
}
