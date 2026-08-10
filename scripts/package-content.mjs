import { existsSync } from 'node:fs';
import path from 'node:path';

/** Explicit schema registrations shipped in the public package. */
export const REQUIRED_SCHEMA_ASSETS = Object.freeze([
  {
    id: 'spec-driven',
    schema: path.join('schemas', 'spec-driven', 'schema.yaml'),
    templates: ['proposal.md', 'spec.md', 'design.md', 'tasks.md'],
  },
  {
    id: 'human-learning',
    schema: path.join('schemas', 'human-learning', 'schema.yaml'),
    templates: ['proposal.md', 'spec.md', 'learning.md'],
  },
]);

/**
 * Explicit workflow-surface registrations. The source registry maps workflow
 * IDs to these generated module filenames; a package check must name each
 * surface rather than treating any matching file as sufficient.
 */
export const REQUIRED_WORKFLOW_ASSETS = Object.freeze([
  ['propose', 'propose'],
  ['explore', 'explore'],
  ['new', 'new-change'],
  ['continue', 'continue-change'],
  ['apply', 'apply-change'],
  ['update', 'update-change'],
  ['ff', 'ff-change'],
  ['sync', 'sync-specs'],
  ['archive', 'archive-change'],
  ['bulk-archive', 'bulk-archive-change'],
  ['verify', 'verify-change'],
  ['onboard', 'onboard'],
  ['humanspec-init', 'humanspec-init'],
  ['humanspec-next', 'humanspec-next'],
  ['humanspec-propose', 'humanspec-propose'],
  ['humanspec-coach', 'humanspec-coach'],
  ['humanspec-verify', 'humanspec-verify'],
  ['humanspec-archive', 'humanspec-archive'],
  ['humanspec-explore', 'humanspec-explore'],
].map(([id, file]) => Object.freeze({
  id,
  path: path.join('dist', 'core', 'templates', 'workflows', `${file}.js`),
})));

/** Project-document files copied to dist by the build manifest. */
export const REQUIRED_PROJECT_DOCUMENT_ASSETS = Object.freeze([
  ['project', 'project.md'],
  ['roadmap', 'roadmap.md'],
  ['learner', 'learner.md'],
].map(([id, file]) => Object.freeze({
  id,
  path: path.join('dist', 'core', 'templates', 'project-docs', file),
})));

function schemaAssets() {
  return REQUIRED_SCHEMA_ASSETS.flatMap((entry) => [
    entry.schema,
    ...entry.templates.map((template) => path.join('schemas', entry.id, 'templates', template)),
  ]);
}

/**
 * Every named release asset. This list is intentionally composed from the
 * explicit schema, workflow, and project-document registries above; it never
 * discovers a directory with a glob.
 */
export const REQUIRED_PACKAGE_ASSETS = Object.freeze([
  path.join('bin', 'openspec.js'),
  path.join('dist', 'cli', 'index.js'),
  ...schemaAssets(),
  ...REQUIRED_WORKFLOW_ASSETS.map((entry) => entry.path),
  ...REQUIRED_PROJECT_DOCUMENT_ASSETS.map((entry) => entry.path),
]);

export function normalizePackageBinMappings(bin) {
  if (typeof bin === 'string') return { openspec: bin };
  if (bin && typeof bin === 'object' && !Array.isArray(bin)) return { ...bin };
  return {};
}

/** Verifies all explicit package paths and names the first missing one. */
export function assertRequiredPackageAssets(packageRoot) {
  for (const asset of REQUIRED_PACKAGE_ASSETS) {
    const assetPath = path.join(packageRoot, asset);
    if (!existsSync(assetPath)) {
      throw new Error(`Missing required packed asset: ${asset}`);
    }
  }
}

/** Verifies every metadata-declared executable target in a packed package. */
export function assertPackageBinAssets(packageRoot, packageManifest) {
  for (const [name, target] of Object.entries(normalizePackageBinMappings(packageManifest?.bin))) {
    const asset = path.relative(packageRoot, path.resolve(packageRoot, String(target)));
    const targetPath = path.resolve(packageRoot, String(target));
    if (!asset || asset.startsWith('..') || path.isAbsolute(asset) || !existsSync(targetPath)) {
      throw new Error(`Missing package bin mapping: ${name} -> ${String(target)}`);
    }
  }
}
