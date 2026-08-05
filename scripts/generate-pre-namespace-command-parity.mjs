#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, mkdirSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const SOURCE_REVISION = '9c4021fa59ca87114ef91947e927937b406c0004';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const revision = process.argv[2] ?? SOURCE_REVISION;
const tempRoot = mkdtempSync(path.join(tmpdir(), 'openspec-command-parity-'));
const sourceDir = path.join(tempRoot, 'source');
const archivePath = path.join(tempRoot, 'source.tar');

function hashVector(values) {
  const hash = createHash('sha256');
  for (const value of values) {
    const bytes = Buffer.from(value, 'utf8');
    const length = Buffer.allocUnsafe(4);
    length.writeUInt32BE(bytes.length);
    hash.update(length);
    hash.update(bytes);
  }
  return hash.digest('hex');
}

try {
  mkdirSync(sourceDir, { recursive: true });
  execFileSync('git', ['archive', '--format=tar', '-o', archivePath, revision], {
    cwd: root,
    stdio: ['ignore', 'ignore', 'inherit'],
  });
  const tarArgs = process.platform === 'win32'
    ? ['--force-local', '-xf', archivePath, '-C', sourceDir]
    : ['-xf', archivePath, '-C', sourceDir];
  execFileSync('tar', tarArgs, {
    stdio: ['ignore', 'ignore', 'inherit'],
  });

  if (process.env.PARITY_REUSE_NODE_MODULES === '1' && existsSync(path.join(root, 'node_modules'))) {
    symlinkSync(path.join(root, 'node_modules'), path.join(sourceDir, 'node_modules'), 'junction');
  } else {
    execFileSync('corepack', ['pnpm', 'install', '--frozen-lockfile'], {
      cwd: sourceDir,
      stdio: ['ignore', 'ignore', 'inherit'],
    });
  }

  execFileSync('node', ['build.js'], {
    cwd: sourceDir,
    stdio: ['ignore', 'ignore', 'inherit'],
  });

  const shared = await import(pathToFileURL(path.join(sourceDir, 'dist/core/shared/skill-generation.js')));
  const generation = await import(pathToFileURL(path.join(sourceDir, 'dist/core/command-generation/index.js')));
  const invocation = await import(pathToFileURL(path.join(sourceDir, 'dist/core/command-generation/invocation.js')));

  const commands = shared.getCommandContents();
  const adapters = generation.CommandAdapterRegistry.getAll()
    .slice()
    .sort((a, b) => a.toolId.localeCompare(b.toolId));
  const records = {};

  for (const adapter of adapters) {
    const generated = commands.map((content) => generation.generateCommand(content, adapter));
    const invocations = commands.map((content) =>
      invocation.formatCommandInvocation(
        invocation.getInvocationForAdapter(adapter),
        content.id
      )
    );
    records[adapter.toolId] = {
      pathVectorSha256: hashVector(
        generated.map((command) => command.path.split(path.sep).join('/'))
      ),
      invocationVectorSha256: hashVector(invocations),
      fileContentVectorSha256: hashVector(generated.map((command) => command.fileContent)),
    };
  }

  const fixture = {
    schemaVersion: 1,
    sourceRevision: revision,
    algorithm: 'sha256',
    encoding: 'utf8',
    framing: 'u32be-byte-length-followed-by-bytes',
    pathNormalization: 'native separators converted to /',
    commands: commands.map((command) => command.id),
    adapters: records,
  };

  process.stdout.write(`${JSON.stringify(fixture, null, 2)}\n`);
} finally {
  rmSync(tempRoot, { recursive: true, force: true });
}
