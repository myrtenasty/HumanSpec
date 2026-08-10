import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';

/**
 * Environment keys that are safe and useful to retain in QA diagnostics.
 * Secrets and unrelated host configuration are intentionally omitted.
 */
export const QA_ENVIRONMENT_KEYS = Object.freeze([
  'PATH',
  'PATHEXT',
  'SystemRoot',
  'ComSpec',
  'WINDIR',
  'HOME',
  'USERPROFILE',
  'HOMEDRIVE',
  'HOMEPATH',
  'APPDATA',
  'LOCALAPPDATA',
  'XDG_CONFIG_HOME',
  'XDG_DATA_HOME',
  'XDG_STATE_HOME',
  'XDG_CACHE_HOME',
  'npm_execpath',
  'npm_node_execpath',
  'COREPACK_HOME',
  'NODE_OPTIONS',
  'OPENSPEC_TELEMETRY',
  'OPEN_SPEC_INTERACTIVE',
  'TZ',
  'LANG',
  'LC_ALL',
  'CI',
]);

function redactEnvironmentValue(key, value) {
  if (value === undefined) return undefined;
  if (/token|secret|password|key/i.test(key)) return '<redacted>';
  return value;
}

/** Returns the allowlisted environment portion stored in scenario diagnostics. */
export function selectEnvironment(env = process.env) {
  return Object.fromEntries(
    QA_ENVIRONMENT_KEYS
      .filter((key) => env[key] !== undefined)
      .map((key) => [key, redactEnvironmentValue(key, env[key])])
  );
}

export function formatCommand(command, args = []) {
  return [command, ...args]
    .map((part) => {
      const value = String(part);
      return /[\s"']/u.test(value)
        ? `"${value.replace(/"/gu, '\\\"')}"`
        : value;
    })
    .join(' ');
}

function terminateProcessTree(child) {
  if (!child.pid) return;
  if (process.platform === 'win32') {
    const killer = spawn(
      process.env.ComSpec || 'cmd.exe',
      ['/d', '/s', '/c', 'taskkill', '/pid', String(child.pid), '/t', '/f'],
      { stdio: 'ignore', windowsHide: true }
    );
    killer.on('error', () => child.kill('SIGKILL'));
    return;
  }

  try {
    process.kill(-child.pid, 'SIGTERM');
  } catch {
    child.kill('SIGTERM');
  }
}

/**
 * Launches one child process without a shell and captures every observable
 * process boundary needed by a QA scenario.
 */
export function runCommand(command, args = [], options = {}) {
  const {
    cwd,
    env = process.env,
    input,
    timeoutMs = 30_000,
    windowsHide = true,
  } = options;

  return new Promise((resolve) => {
    const startedAt = Date.now();
    let stdout = '';
    let stderr = '';
    let timedOut = false;
    let settled = false;
    let timer;

    const child = spawn(command, args, {
      cwd,
      env,
      shell: false,
      windowsHide,
      stdio: ['pipe', 'pipe', 'pipe'],
      detached: process.platform !== 'win32',
    });

    child.stdout?.setEncoding('utf8');
    child.stderr?.setEncoding('utf8');
    child.stdout?.on('data', (chunk) => { stdout += chunk; });
    child.stderr?.on('data', (chunk) => { stderr += chunk; });

    const finish = (result) => {
      if (settled) return;
      settled = true;
      if (timer) clearTimeout(timer);
      resolve({
        command,
        args: [...args],
        commandLine: formatCommand(command, args),
        cwd,
        environment: selectEnvironment(env),
        stdout,
        stderr,
        exitCode: result.exitCode ?? null,
        signal: result.signal ?? null,
        timedOut,
        durationMs: Date.now() - startedAt,
        error: result.error ? String(result.error.message ?? result.error) : undefined,
      });
    };

    child.once('error', (error) => finish({ error }));
    child.once('close', (exitCode, signal) => finish({ exitCode, signal }));

    if (input !== undefined && child.stdin) {
      child.stdin.write(input);
      child.stdin.end();
    } else {
      child.stdin?.end();
    }

    timer = setTimeout(() => {
      timedOut = true;
      terminateProcessTree(child);
      // A process tree can take a moment to close on Windows. The close event
      // remains authoritative, while this fallback keeps a stuck child from
      // holding the runner forever.
      void delay(500).then(() => {
        if (!settled) {
          try { child.kill('SIGKILL'); } catch {}
          finish({ exitCode: null, signal: 'SIGTERM' });
        }
      });
    }, timeoutMs);
  });
}

export function assertSuccessfulCommand(result, label = result.commandLine) {
  if (result.timedOut || result.exitCode !== 0) {
    const detail = [result.stderr.trim(), result.stdout.trim()].filter(Boolean).join('\n');
    throw new Error(
      `${label} failed with ${result.timedOut ? 'a timeout' : `exit code ${String(result.exitCode)}`}` +
        (detail ? `:\n${detail}` : '')
    );
  }
  return result;
}
