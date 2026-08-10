import { afterEach, describe, expect, it } from 'vitest';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
  buildWindowsCommand,
  normalizeBinMappings,
  parsePackResult,
  resolveInstalledBinPaths,
  resolveInstalledPackageRoot,
  resolveNpmInvocation,
} from '../../scripts/qa/package.mjs';
import { assertPackageBinAssets } from '../../scripts/package-content.mjs';

const roots: string[] = [];

afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => fs.rm(root, { recursive: true, force: true })));
});

async function installedFixture(packageName: string, bin: Record<string, string>) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'openspec-pack-guard-'));
  roots.push(root);
  await fs.writeFile(path.join(root, 'package.json'), JSON.stringify({ name: 'consumer', private: true }), 'utf8');
  const packageRoot = path.join(root, 'node_modules', ...packageName.split('/'));
  await fs.mkdir(packageRoot, { recursive: true });
  await fs.writeFile(path.join(packageRoot, 'package.json'), JSON.stringify({ name: packageName, main: 'index.js', bin }), 'utf8');
  await fs.writeFile(path.join(packageRoot, 'index.js'), 'export {};\n', 'utf8');
  for (const target of Object.values(bin)) {
    const targetPath = path.join(packageRoot, target);
    await fs.mkdir(path.dirname(targetPath), { recursive: true });
    await fs.writeFile(targetPath, '#!/usr/bin/env node\n', 'utf8');
  }
  return { root, packageRoot };
}

describe('metadata-driven packed package guard helpers', () => {
  it.each(['@scope/tool', 'plain-tool'])('resolves a %s package without a hardcoded node_modules path', async (packageName) => {
    const fixture = await installedFixture(packageName, { primary: './bin/primary.js' });
    expect(resolveInstalledPackageRoot(fixture.root, packageName)).toBe(fixture.packageRoot);
  });

  it('normalizes string and multiple bin mappings and resolves every target', async () => {
    expect(normalizeBinMappings('./bin/openspec.js')).toEqual({ openspec: './bin/openspec.js' });
    const fixture = await installedFixture('multi-tool', {
      openspec: './bin/openspec.js',
      helper: './bin/helper.js',
    });
    const manifest = { name: 'multi-tool', bin: { openspec: './bin/openspec.js', helper: './bin/helper.js' } };
    expect(resolveInstalledBinPaths(fixture.packageRoot, manifest)).toEqual({
      openspec: path.join(fixture.packageRoot, 'bin', 'openspec.js'),
      helper: path.join(fixture.packageRoot, 'bin', 'helper.js'),
    });
    expect(() => assertPackageBinAssets(fixture.packageRoot, manifest)).not.toThrow();
  });

  it('parses CRLF npm pack output and retains integrity metadata', () => {
    const parsed = parsePackResult('notice\r\n[{"filename":"package.tgz","integrity":"sha512-abc","package":{"name":"plain-tool"}}]\r\n');
    expect(parsed).toMatchObject({ filename: 'package.tgz', integrity: 'sha512-abc' });
  });

  it('selects a Windows-safe npm fallback and quotes native process paths', () => {
    expect(resolveNpmInvocation({ platform: 'win32', env: {} })).toMatchObject({ command: 'npm.cmd' });
    expect(buildWindowsCommand('C:\\Program Files\\nodejs\\npm.cmd', ['pack', 'C:\\tmp\\a b.tgz']))
      .toBe('"C:\\Program Files\\nodejs\\npm.cmd" "pack" "C:\\tmp\\a b.tgz"');
  });
});
