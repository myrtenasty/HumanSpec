import { promises as fs } from 'node:fs';

export function assert(condition, message) {
  if (!condition) throw new Error(message);
}

export function assertExit(result, expected = 0) {
  assert(
    !result.timedOut && result.exitCode === expected,
    `${result.commandLine} expected exit ${expected}, received ${result.timedOut ? 'timeout' : String(result.exitCode)}.\n` +
      [result.stderr.trim(), result.stdout.trim()].filter(Boolean).join('\n')
  );
  return result;
}

export function assertContains(value, expected, label = 'output') {
  assert(
    String(value).includes(expected),
    `${label} did not contain ${JSON.stringify(expected)}.\nActual:\n${String(value)}`
  );
}

export function assertNotContains(value, unexpected, label = 'output') {
  assert(
    !String(value).includes(unexpected),
    `${label} unexpectedly contained ${JSON.stringify(unexpected)}.\nActual:\n${String(value)}`
  );
}

export function assertJsonOutput(result, label = result.commandLine) {
  assertExit(result, 0);
  try {
    return JSON.parse(result.stdout);
  } catch (error) {
    throw new Error(`${label} did not produce JSON on stdout: ${String(error)}\n${result.stdout}`);
  }
}

export async function assertFileExists(target, label = target) {
  try {
    await fs.access(target);
  } catch {
    throw new Error(`Expected ${label} to exist at ${target}.`);
  }
  return target;
}

export async function assertFileMissing(target, label = target) {
  try {
    await fs.access(target);
  } catch (error) {
    if (error?.code === 'ENOENT') return;
  }
  throw new Error(`Expected ${label} not to exist at ${target}.`);
}

export async function readJson(target) {
  return JSON.parse(await fs.readFile(target, 'utf8'));
}

export async function countLinesContaining(target, text) {
  const content = await fs.readFile(target, 'utf8');
  return content.split(/\r?\n/u).filter((line) => line.includes(text)).length;
}
