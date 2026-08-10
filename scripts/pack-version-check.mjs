#!/usr/bin/env node
// Guard: Ensure the packed tarball's CLI `--version` matches package.json.
//
// Notes:
// - We intentionally use `npm pack` (not pnpm) because `npm pack --json` is
//   consistently supported and returns the tarball metadata we need. The
//   project uses pnpm for install/publish, but this guard only needs to pack
//   locally and verify the installed CLI output.
// - `npm pack` triggers the package's `prepare` script (build), and
//   `changeset publish` triggers `prepublishOnly` (also builds here). This
//   means an explicit build is not strictly necessary for the guard.

import { execFileSync, execSync } from 'child_process';
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import path from 'path';

import { assertRequiredPackageAssets } from './package-content.mjs';

const npmCommand = 'npm';

function log(msg) {
  if (process.env.CI) return; // keep CI logs quiet by default
  console.log(msg);
}

function quoteForWindowsCmd(value) {
  return `"${String(value).replace(/["^&|<>()]/g, '^$&').replace(/%/g, '%%')}"`;
}

function run(cmd, args, opts = {}) {
  const options = { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'pipe'], ...opts };
  // Node cannot directly execute a .cmd script reliably. Use one quoted
  // command string on Windows rather than shell:true with a separate args
  // array, which emits a Node deprecation warning.
  if (process.platform === 'win32' && cmd === npmCommand) {
    const command = [cmd, ...args.map(quoteForWindowsCmd)].join(' ');
    return execSync(command, options);
  }
  return execFileSync(cmd, args, options);
}

function npmPack() {
  try {
    const jsonOut = run(npmCommand, ['pack', '--json', '--silent']);
    // npm runs this package's prepare script before producing the JSON. Keep
    // the trailing JSON array rather than assuming stdout contains only JSON.
    const json = jsonOut.match(/(\[\s*\{[\s\S]*\}\s*\])\s*$/u)?.[1] ?? jsonOut;
    const arr = JSON.parse(json);
    if (Array.isArray(arr) && arr.length > 0) {
      const last = arr[arr.length - 1];
      const file = (last && typeof last === 'object' && last.filename) || (typeof last === 'string' ? last : null);
      if (file) return String(file).trim();
    }
    // Unexpected JSON shape or empty array; fallback to plain output
    const out = run(npmCommand, ['pack', '--silent']).trim();
    const lines = out.split(/\r?\n/);
    return lines[lines.length - 1].trim();
  } catch (e) {
    // Fallback for environments not supporting --json
    const out = run(npmCommand, ['pack', '--silent']).trim();
    const lines = out.split(/\r?\n/);
    return lines[lines.length - 1].trim();
  }
}

function parseEnvelope(output, expectedOperation) {
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

function assertPackedContextOperations(packageRoot, work) {
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
      '- Learning-result assessment: learning complete',
      '### Mastered topics',
      '- Packed public context runtime',
      '',
    ].join('\n')
  );

  const packedCli = path.join(packageRoot, 'bin', 'openspec.js');
  const invoke = (args) => run(process.execPath, [packedCli, ...args], { cwd: projectRoot });
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

function main() {
  const pkg = JSON.parse(readFileSync(path.join(process.cwd(), 'package.json'), 'utf-8'));
  const expected = pkg.version;

  let work;
  let tgzPath;

  try {
    log(`Packing @fission-ai/openspec@${expected}...`);
    const filename = npmPack();
    tgzPath = path.resolve(filename);
    log(`Created: ${tgzPath}`);

    work = mkdtempSync(path.join(tmpdir(), 'openspec-pack-check-'));
    log(`Temp dir: ${work}`);

    // Make a tiny project
    writeFileSync(
      path.join(work, 'package.json'),
      JSON.stringify({ name: 'pack-check', private: true }, null, 2)
    );

    // Try to avoid noisy output and speed up
    const env = {
      ...process.env,
      npm_config_loglevel: 'silent',
      npm_config_audit: 'false',
      npm_config_fund: 'false',
      npm_config_progress: 'false',
    };

    // Install the tarball
    run(npmCommand, ['install', tgzPath, '--silent', '--no-audit', '--no-fund'], { cwd: work, env });

    const packageRoot = path.join(work, 'node_modules', '@fission-ai', 'openspec');
    assertRequiredPackageAssets(packageRoot);

    // Run the installed CLI via Node to avoid bin resolution/platform issues
    const binRel = path.join('node_modules', '@fission-ai', 'openspec', 'bin', 'openspec.js');
    const actual = run(process.execPath, [binRel, '--version'], { cwd: work }).trim();

    if (actual !== expected) {
      throw new Error(
        `Packed CLI version mismatch: expected ${expected}, got ${actual}. ` +
          'Ensure the dist is built and the CLI reads version from package.json.'
      );
    }

    assertPackedContextOperations(packageRoot, work);
    log('Version and packed context operation checks passed.');
  } finally {
    // Always attempt cleanup
    if (work) {
      try { rmSync(work, { recursive: true, force: true }); } catch {}
    }
    if (tgzPath) {
      try { rmSync(tgzPath, { force: true }); } catch {}
    }
  }
}

try {
  main();
  console.log('✅ pack-version-check: OK');
} catch (err) {
  console.error(`❌ pack-version-check: ${err.message}`);
  process.exit(1);
}
