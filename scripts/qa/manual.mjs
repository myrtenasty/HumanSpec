#!/usr/bin/env node

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const CHECKLIST_PATH = path.join(repoRoot, 'docs', 'humanspec-teaching-checklist.md');
export const FIXTURE_PATH = path.join(repoRoot, 'scripts', 'qa', 'fixtures', 'humanspec', 'fixture.json');

export const CHECKLIST_RESULT_FIELDS = Object.freeze([
  'tool',
  'model',
  'modelVersion',
  'platform',
  'packedArtifact',
  'fixtureRevision',
  'disposition',
  'reviewer',
  'date',
  'evidenceNotes',
]);

const VALID_DISPOSITIONS = new Set(['pass', 'fail']);

export async function readFixtureRevision() {
  return (JSON.parse(await fs.readFile(FIXTURE_PATH, 'utf8'))).revision;
}

export function validateChecklistResult(result) {
  const missing = CHECKLIST_RESULT_FIELDS.filter((field) => result?.[field] === undefined || result[field] === '');
  if (missing.length > 0) return { valid: false, missing };
  if (!VALID_DISPOSITIONS.has(result.disposition)) return { valid: false, missing: [], invalidDisposition: result.disposition };
  return { valid: true, missing: [] };
}

export function resolveManualStatus(result, { fixtureRevision, artifactVersion } = {}) {
  if (!result) return 'not-run';
  const validation = validateChecklistResult(result);
  if (!validation.valid) return 'stale';
  if (result.fixtureRevision !== fixtureRevision || !String(result.packedArtifact).includes(String(artifactVersion))) return 'stale';
  return result.disposition === 'pass' ? 'current-pass' : 'current-fail';
}

async function readResult(resultPath) {
  if (!resultPath) return null;
  try { return JSON.parse(await fs.readFile(resultPath, 'utf8')); } catch (error) {
    throw new Error(`Manual checklist result is not valid JSON: ${String(error?.message ?? error)}`);
  }
}

function printUsage() {
  console.log(`Usage: pnpm qa:manual [--result <path>]\n\nThe command identifies the versioned HumanSpec teaching checklist.\nIt does not execute model-dependent teaching scenarios.`);
}

async function main(argv = process.argv.slice(2)) {
  let resultPath;
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === '--') continue;
    if (argv[index] === '--help' || argv[index] === '-h') { printUsage(); return 0; }
    if (argv[index] === '--result') resultPath = argv[++index];
    else if (argv[index]?.startsWith('--result=')) resultPath = argv[index].slice('--result='.length);
    else throw new Error(`Unknown option ${argv[index]}. Use --help.`);
  }
  const packageManifest = JSON.parse(await fs.readFile(path.join(repoRoot, 'package.json'), 'utf8'));
  const fixtureRevision = await readFixtureRevision();
  const result = await readResult(resultPath);
  const status = resolveManualStatus(result, { fixtureRevision, artifactVersion: packageManifest.version });
  console.log(`HumanSpec teaching checklist: ${path.relative(repoRoot, CHECKLIST_PATH)}`);
  console.log(`Manual/model status: ${status}`);
  console.log('This is qualitative evidence, not deterministic automation; CI does not infer a pass from this command.');
  if (resultPath) console.log(`Result record: ${path.resolve(resultPath)}`);
  console.log(`Expected fixture revision: ${fixtureRevision}`);
  return status === 'current-fail' ? 1 : 0;
}

if (process.argv[1]?.endsWith('manual.mjs')) {
  main().then((code) => { process.exitCode = code; }).catch((error) => {
    console.error(`Manual checklist status failed: ${String(error?.message ?? error)}`);
    process.exitCode = 1;
  });
}

export { main };
