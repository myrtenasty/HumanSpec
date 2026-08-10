import { afterEach, describe, expect, it } from 'vitest';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { buildWindowsCommand, resolveNpmInvocation } from '../../scripts/qa/package.mjs';
import { formatCommand, runCommand, selectEnvironment } from '../../scripts/qa/process.mjs';
import { buildSandboxEnvironment, createSandbox, snapshotPaths } from '../../scripts/qa/sandbox.mjs';

const roots: string[] = [];

afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => fs.rm(root, { recursive: true, force: true })));
});

describe('portable QA runner foundations', () => {
  it('keeps only the selected diagnostic environment keys', () => {
    const selected = selectEnvironment({ PATH: 'toolchain', API_TOKEN: 'secret', unrelated: 'host' });
    expect(selected).toEqual({ PATH: 'toolchain' });
  });

  it('builds quoted native Windows process commands without POSIX shell syntax', () => {
    const command = buildWindowsCommand('C:\\Program Files\\nodejs\\npm.cmd', [
      'pack',
      'C:\\QA fixtures\\package.tgz',
    ]);
    expect(command).toContain('"C:\\Program Files\\nodejs\\npm.cmd"');
    expect(command).toContain('"C:\\QA fixtures\\package.tgz"');
    expect(formatCommand('node', ['C:\\QA fixtures\\script.mjs'])).toContain('"C:\\QA fixtures\\script.mjs"');
  });

  it('uses the active npm script when it is an npm launcher and ignores pnpm launcher values', () => {
    expect(resolveNpmInvocation({
      platform: 'win32',
      env: { npm_execpath: 'C:\\node\\npm-cli.js', npm_node_execpath: 'C:\\node\\node.exe' },
    })).toEqual({ command: 'C:\\node\\node.exe', prefix: ['C:\\node\\npm-cli.js'], source: 'npm_execpath' });
    expect(resolveNpmInvocation({ platform: 'win32', env: { npm_execpath: 'C:\\pnpm\\pnpm.cjs' } })).toMatchObject({
      command: 'npm.cmd', prefix: [], source: 'platform-fallback',
    });
  });

  it('isolates POSIX paths and cleans the sandbox by default', async () => {
    const base = await fs.mkdtemp(path.join(os.tmpdir(), 'openspec-qa-test-'));
    roots.push(base);
    const sandbox = await createSandbox({ baseDirectory: base, baseEnv: { PATH: 'path' } });
    expect(sandbox.environment.HOME).toBe(sandbox.home);
    expect(sandbox.environment.XDG_CONFIG_HOME).toBe(sandbox.config);
    const snapshot = await snapshotPaths([sandbox.project, sandbox.config]);
    expect(snapshot).toEqual(expect.arrayContaining([
      expect.objectContaining({ path: sandbox.project, exists: true, type: 'directory' }),
      expect.objectContaining({ path: sandbox.config, exists: true, type: 'directory' }),
    ]));
    const root = sandbox.root;
    await sandbox.cleanup();
    await expect(fs.access(root)).rejects.toMatchObject({ code: 'ENOENT' });
  });

  it('maps Windows-style environment roots without touching the host home', () => {
    const environment = buildSandboxEnvironment({ PATH: 'native' }, {
      home: 'C:\\qa\\home',
      config: 'C:\\qa\\config',
      data: 'C:\\qa\\data',
      state: 'C:\\qa\\state',
      cache: 'C:\\qa\\cache',
    });
    expect(environment.HOME).toBe('C:\\qa\\home');
    expect(environment.USERPROFILE).toBe('C:\\qa\\home');
    expect(environment.XDG_CACHE_HOME).toBe('C:\\qa\\cache');
    expect(environment.OPENSPEC_TELEMETRY).toBe('0');
  });

  it('captures stdout, stderr, exit status, and timeout deterministically', async () => {
    const result = await runCommand(process.execPath, ['-e', 'console.log("out"); console.error("err")'], {
      timeoutMs: 5_000,
      env: { ...process.env, OPENSPEC_TELEMETRY: '0' },
    });
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('out');
    expect(result.stderr).toContain('err');
    const timedOut = await runCommand(process.execPath, ['-e', 'setTimeout(() => {}, 10_000)'], { timeoutMs: 50 });
    expect(timedOut.timedOut).toBe(true);
  }, 10_000);
});
