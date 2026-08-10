import { existsSync } from 'fs';
import path from 'path';

/**
 * Explicit public runtime assets that every published OpenSpec package must
 * contain. This list intentionally does not discover files from globs: a
 * missing registered template, schema, or executable entry names itself.
 */
export const REQUIRED_PACKAGE_ASSETS = Object.freeze([
  path.join('bin', 'openspec.js'),
  path.join('dist', 'cli', 'index.js'),
  path.join('schemas', 'spec-driven', 'schema.yaml'),
  path.join('schemas', 'human-learning', 'schema.yaml'),
  path.join('dist', 'core', 'templates', 'project-docs', 'project.md'),
  path.join('dist', 'core', 'templates', 'project-docs', 'roadmap.md'),
  path.join('dist', 'core', 'templates', 'project-docs', 'learner.md'),
]);

export function assertRequiredPackageAssets(packageRoot) {
  for (const asset of REQUIRED_PACKAGE_ASSETS) {
    const assetPath = path.join(packageRoot, asset);
    if (!existsSync(assetPath)) {
      throw new Error(`Missing required packed asset: ${asset}`);
    }
  }
}
