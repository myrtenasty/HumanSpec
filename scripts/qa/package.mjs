import { createHash } from 'node:crypto';
import { execFileSync, execSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { createReadStream, promises as fs, readFileSync, statSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { assertRequiredPackageAssets } from '../package-content.mjs';

function isNpmScript(value) {
  return /(?:^|[\\/])npm(?:-cli)?(?:\.(?:c|m)?js|\.cmd)?$/iu.test(value);
}

/**
 * Resolves npm from the active Node/npm installation. pnpm's npm_execpath is
 * deliberately ignored: it is the package manager's launcher, not npm.
 */
export function resolveNpmInvocation({ env = process.env, platform = process.platform } = {}) {
  const active = env.npm_execpath;
  if (active && isNpmScript(active)) {
    if (/\.(?:c|m)?js$/iu.test(active)) {
      return { command: env.npm_node_execpath || process.execPath, prefix: [active], source: 'npm_execpath' };
    }
    return { command: active, prefix: [], source: 'npm_execpath' };
  }
  return {
    command: platform === 'win32' ? 'npm.cmd' : 'npm',
    prefix: [],
    source: 'platform-fallback',
  };
}

export function quoteWindowsArg(value) {
  const text = String(value);
  return `"${text.replace(/(["^&|<>()%])/gu, '^$1').replace(/%/gu, '%%')}"`;
}

export function buildWindowsCommand(command, args = []) {
  return [quoteWindowsArg(command), ...args.map(quoteWindowsArg)].join(' ');
}

function resolveWindowsCommandPath(command, env = process.env) {
  if (process.platform !== 'win32' || !/^(?:npm|npm\.cmd)$/iu.test(command)) return command;
  try {
    const locations = execFileSync('where.exe', ['npm.cmd'], { encoding: 'utf8', env })
      .split(/\r?\n/u)
      .map((value) => value.trim())
      .filter(Boolean);
    return locations.find((candidate) => /npm\.cmd$/iu.test(candidate)) ?? command;
  } catch {
    return command;
  }
}

export function runExecutableSync(command, args = [], options = {}) {
  const opts = { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], ...options };
  const executable = resolveWindowsCommandPath(command, opts.env ?? process.env);
  if (process.platform === 'win32' && /\.(?:cmd|bat)$/iu.test(executable)) {
    return execSync(buildWindowsCommand(executable, args), opts);
  }
  return execFileSync(executable, args, opts);
}

export function parseJsonTail(output) {
  const raw = String(output).trim();
  try {
    return JSON.parse(raw);
  } catch {
    const candidates = [
      raw.match(/(\[\s*\{[\s\S]*\}\s*\])\s*$/u)?.[1],
      raw.match(/(\{[\s\S]*\})\s*$/u)?.[1],
    ].filter(Boolean);
    for (const candidate of candidates) {
      try { return JSON.parse(candidate); } catch {}
    }
    throw new Error(`Expected JSON output, received:\n${raw}`);
  }
}

export function parsePackResult(output) {
  const parsed = parseJsonTail(output);
  const item = Array.isArray(parsed) ? parsed.at(-1) : parsed;
  const filename = typeof item === 'string' ? item : item?.filename;
  if (!filename) throw new Error('npm pack output did not include a tarball filename.');
  return {
    filename: String(filename).trim(),
    integrity: item?.integrity ?? null,
    shasum: item?.shasum ?? null,
    package: item?.package ?? null,
    raw: parsed,
  };
}

export function runNpmSync(args, options = {}) {
  const invocation = resolveNpmInvocation({ env: options.env ?? process.env });
  return runExecutableSync(invocation.command, [...invocation.prefix, ...args], options);
}

export function readPackageManifest(packageRoot) {
  return JSON.parse(readFileSync(path.join(packageRoot, 'package.json'), 'utf8'));
}

export function normalizeBinMappings(bin) {
  if (typeof bin === 'string') return { openspec: bin };
  if (bin && typeof bin === 'object' && !Array.isArray(bin)) return { ...bin };
  return {};
}

/** Resolves a package root by Node's package resolution, not node_modules layout. */
export function resolveInstalledPackageRoot(workspace, packageName) {
  const requireFromWorkspace = createRequire(path.join(workspace, 'package.json'));
  const entry = requireFromWorkspace.resolve(packageName);
  let directory = path.dirname(entry);
  while (true) {
    const manifestPath = path.join(directory, 'package.json');
    try {
      const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
      if (manifest.name === packageName) return directory;
    } catch {}
    const parent = path.dirname(directory);
    if (parent === directory) break;
    directory = parent;
  }
  throw new Error(`Resolved ${packageName} but could not locate its package root.`);
}

export function resolveInstalledBinPaths(packageRoot, packageManifest) {
  return Object.fromEntries(
    Object.entries(normalizeBinMappings(packageManifest.bin)).map(([name, target]) => [
      name,
      path.resolve(packageRoot, String(target)),
    ])
  );
}

export function packageSha512(filePath) {
  return new Promise((resolve, reject) => {
    const hash = createHash('sha512');
    const stream = createReadStream(filePath);
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(hash.digest('base64')));
  });
}

/** Packs once and returns the exact tarball plus integrity metadata. */
export async function preparePackedArtifact({ repoRoot = process.cwd(), outputDirectory } = {}) {
  const targetDirectory = outputDirectory ?? await fs.mkdtemp(path.join(os.tmpdir(), 'openspec-qa-package-'));
  await fs.mkdir(targetDirectory, { recursive: true });
  const packageManifest = JSON.parse(await fs.readFile(path.join(repoRoot, 'package.json'), 'utf8'));
  const output = runNpmSync(['pack', '--json', '--silent', '--ignore-scripts'], { cwd: repoRoot });
  const pack = parsePackResult(output);
  const sourceTarball = path.resolve(repoRoot, pack.filename);
  const tarball = path.join(targetDirectory, path.basename(sourceTarball));
  await fs.copyFile(sourceTarball, tarball);
  if (path.resolve(sourceTarball) !== path.resolve(tarball)) {
    await fs.rm(sourceTarball, { force: true });
  }
  const buffer = await fs.readFile(tarball);
  const sha512 = createHash('sha512').update(buffer).digest('base64');
  const integrity = pack.integrity ?? `sha512-${sha512}`;
  return {
    tarball,
    filename: path.basename(tarball),
    integrity,
    sha512,
    size: statSync(tarball).size,
    packageName: packageManifest.name,
    version: packageManifest.version,
    packageManifest,
    source: repoRoot,
  };
}

export async function installPackedArtifact({ artifact, workspace, env = process.env } = {}) {
  const manifestPath = path.join(workspace, 'package.json');
  try {
    await fs.access(manifestPath);
  } catch {
    await fs.writeFile(manifestPath, `${JSON.stringify({ name: 'openspec-qa-fixture', private: true }, null, 2)}\n`, 'utf8');
  }
  runNpmSync(
    ['install', artifact.tarball, '--silent', '--no-audit', '--no-fund', '--no-package-lock'],
    { cwd: workspace, env: { ...env, npm_config_loglevel: 'silent', npm_config_progress: 'false' } }
  );
  const packageRoot = resolveInstalledPackageRoot(workspace, artifact.packageName);
  const installedManifest = readPackageManifest(packageRoot);
  const bins = resolveInstalledBinPaths(packageRoot, installedManifest);
  assertRequiredPackageAssets(packageRoot);
  for (const [name, binPath] of Object.entries(bins)) {
    try { await fs.access(binPath); } catch { throw new Error(`Installed bin mapping ${name} is missing at ${binPath}.`); }
  }
  return { packageRoot, packageManifest: installedManifest, bins };
}
