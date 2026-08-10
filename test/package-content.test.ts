import { afterEach, describe, expect, it } from 'vitest';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
  REQUIRED_PACKAGE_ASSETS,
  assertRequiredPackageAssets,
} from '../scripts/package-content.mjs';

const roots: string[] = [];

async function completePackageRoot(): Promise<string> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'openspec-package-content-'));
  roots.push(root);
  for (const asset of REQUIRED_PACKAGE_ASSETS) {
    const target = path.join(root, asset);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, 'asset', 'utf8');
  }
  return root;
}

afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => fs.rm(root, { recursive: true, force: true })));
});

describe('required package contents', () => {
  it('accepts every registered schema, template, and runtime entry', async () => {
    const root = await completePackageRoot();
    expect(() => assertRequiredPackageAssets(root)).not.toThrow();
  });

  it.each([
    path.join('schemas', 'spec-driven', 'schema.yaml'),
    path.join('dist', 'core', 'templates', 'project-docs', 'roadmap.md'),
    path.join('dist', 'cli', 'index.js'),
  ])('names a missing registered asset exactly: %s', async (asset) => {
    const root = await completePackageRoot();
    await fs.rm(path.join(root, asset));
    expect(() => assertRequiredPackageAssets(root)).toThrow(`Missing required packed asset: ${asset}`);
  });
});
