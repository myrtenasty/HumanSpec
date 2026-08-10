import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { selectEnvironment } from './process.mjs';

/**
 * Explicitly registered tool roots. The sandbox itself owns the project root,
 * so a scenario can create only the tool directories it is testing without
 * inheriting any host-level installation.
 */
export const REGISTERED_AI_TOOL_DIRECTORIES = Object.freeze([
  '.amazon-q',
  '.antigravity',
  '.auggie',
  '.bob',
  '.claude',
  '.cline',
  '.codebuddy',
  '.continue',
  '.costrict',
  '.crush',
  '.cursor',
  '.devin',
  '.factory',
  '.gemini',
  '.github',
  '.iflow',
  '.junie',
  '.kilocode',
  '.kiro',
  '.lingma',
  '.opencode',
  '.pi',
  '.qoder',
  '.qwen',
  '.roo',
  '.trae',
  '.windsurf',
  '.zcode',
]);

const POSIX_LOCALE = 'C.UTF-8';

function sha256(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

async function describePath(target) {
  try {
    const stats = await fs.lstat(target);
    if (stats.isDirectory()) {
      const entries = (await fs.readdir(target, { withFileTypes: true }))
        .map((entry) => entry.name)
        .sort();
      return { path: target, exists: true, type: 'directory', entries };
    }
    const content = await fs.readFile(target);
    return {
      path: target,
      exists: true,
      type: stats.isFile() ? 'file' : 'other',
      size: stats.size,
      sha256: sha256(content),
    };
  } catch (error) {
    if (error?.code === 'ENOENT') return { path: target, exists: false };
    return { path: target, exists: false, error: String(error?.message ?? error) };
  }
}

/** Captures only explicitly named paths and their immediate directory entries. */
export async function snapshotPaths(paths) {
  return Promise.all([...new Set(paths)].map((target) => describePath(target)));
}

export function buildSandboxEnvironment(baseEnv, directories) {
  const env = { ...baseEnv };
  const home = directories.home;
  env.HOME = home;
  env.USERPROFILE = home;
  env.HOMEDRIVE = path.parse(home).root || env.HOMEDRIVE;
  env.HOMEPATH = path.relative(env.HOMEDRIVE || path.parse(home).root, home) || env.HOMEPATH;
  env.APPDATA = directories.config;
  env.LOCALAPPDATA = directories.data;
  env.XDG_CONFIG_HOME = directories.config;
  env.XDG_DATA_HOME = directories.data;
  env.XDG_STATE_HOME = directories.state;
  env.XDG_CACHE_HOME = directories.cache;
  env.OPENSPEC_TELEMETRY = '0';
  env.OPEN_SPEC_INTERACTIVE = '0';
  env.CI = env.CI || '1';
  env.TZ = 'UTC';
  env.LANG = env.LANG || POSIX_LOCALE;
  env.LC_ALL = env.LC_ALL || POSIX_LOCALE;
  env.NO_COLOR = '1';
  return env;
}

/**
 * Creates the isolated project and user state for one scenario. The returned
 * root is never shared by scenarios, even when they use the same packed
 * tarball.
 */
export async function createSandbox(options = {}) {
  const {
    prefix = 'openspec-qa-',
    baseDirectory,
    baseEnv = process.env,
    artifactDirectory,
  } = options;

  const root = await fs.mkdtemp(path.join(baseDirectory ?? os.tmpdir(), prefix));
  const directories = {
    root,
    project: path.join(root, 'project'),
    home: path.join(root, 'home'),
    config: path.join(root, 'config'),
    data: path.join(root, 'data'),
    state: path.join(root, 'state'),
    cache: path.join(root, 'cache'),
    diagnostics: artifactDirectory ? path.join(artifactDirectory, path.basename(root)) : path.join(root, 'diagnostics'),
  };

  await Promise.all(Object.values(directories).map((directory) => fs.mkdir(directory, { recursive: true })));

  const environment = buildSandboxEnvironment(baseEnv, directories);
  const manifest = {
    schemaVersion: 1,
    root,
    project: directories.project,
    directories,
    registeredToolDirectories: REGISTERED_AI_TOOL_DIRECTORIES,
    environment: selectEnvironment(environment),
  };
  await fs.writeFile(path.join(directories.diagnostics, 'sandbox.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

  return {
    ...directories,
    environment,
    manifest,
    async snapshot(extraPaths = []) {
      return snapshotPaths([
        directories.project,
        directories.home,
        directories.config,
        directories.data,
        directories.state,
        directories.cache,
        ...extraPaths,
      ]);
    },
    async retainDiagnostics(payload = {}) {
      await fs.mkdir(directories.diagnostics, { recursive: true });
      await fs.writeFile(
        path.join(directories.diagnostics, 'failure.json'),
        `${JSON.stringify({ ...manifest, ...payload }, null, 2)}\n`,
        'utf8'
      );
      return directories.diagnostics;
    },
    async cleanup({ keep = false } = {}) {
      if (!keep) await fs.rm(root, { recursive: true, force: true });
    },
  };
}
