#!/usr/bin/env node

import { execFileSync } from 'child_process';
import { copyFileSync, existsSync, mkdirSync, rmSync } from 'fs';
import { createRequire } from 'module';
import path from 'path';

const require = createRequire(import.meta.url);

/**
 * The complete, explicit set of HumanSpec project-document runtime assets.
 * Keep this list in the build boundary so package contents do not depend on a
 * glob or on source files being available after installation.
 */
const PROJECT_DOCUMENT_ASSET_MANIFEST = Object.freeze([
  {
    id: 'project',
    source: path.join('src', 'core', 'templates', 'project-docs', 'project.md'),
    destination: path.join('dist', 'core', 'templates', 'project-docs', 'project.md'),
  },
  {
    id: 'roadmap',
    source: path.join('src', 'core', 'templates', 'project-docs', 'roadmap.md'),
    destination: path.join('dist', 'core', 'templates', 'project-docs', 'roadmap.md'),
  },
  {
    id: 'learner',
    source: path.join('src', 'core', 'templates', 'project-docs', 'learner.md'),
    destination: path.join('dist', 'core', 'templates', 'project-docs', 'learner.md'),
  },
]);

function copyProjectDocumentAssets() {
  for (const asset of PROJECT_DOCUMENT_ASSET_MANIFEST) {
    if (!existsSync(asset.source)) {
      throw new Error(`Missing registered HumanSpec template source asset: ${asset.source}`);
    }
    mkdirSync(path.dirname(asset.destination), { recursive: true });
    copyFileSync(asset.source, asset.destination);
  }
}

const runTsc = (args = []) => {
  const tscPath = require.resolve('typescript/bin/tsc');
  execFileSync(process.execPath, [tscPath, ...args], { stdio: 'inherit' });
};

console.log('🔨 Building OpenSpec...\n');

// Clean dist directory
if (existsSync('dist')) {
  console.log('Cleaning dist directory...');
  rmSync('dist', { recursive: true, force: true });
}

// Run TypeScript compiler (use local version explicitly)
console.log('Compiling TypeScript...');
try {
  runTsc(['--version']);
  runTsc();
  console.log('Copying registered HumanSpec template assets...');
  copyProjectDocumentAssets();
  console.log('\n✅ Build completed successfully!');
} catch (error) {
  console.error('\n❌ Build failed!');
  process.exit(1);
}
