import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';

// Constants
export const GLOBAL_CONFIG_DIR_NAME = 'openspec';
export const GLOBAL_CONFIG_FILE_NAME = 'config.json';
export const GLOBAL_DATA_DIR_NAME = 'openspec';

// TypeScript types
export type Profile = 'core' | 'humanspec' | 'custom';
export type Delivery = 'both' | 'skills' | 'commands';

const VALID_PROFILES: readonly Profile[] = ['core', 'humanspec', 'custom'];

// TypeScript interfaces
export interface GlobalConfig {
  featureFlags?: Record<string, boolean>;
  profile?: Profile;
  delivery?: Delivery;
  workflows?: string[];
  /**
   * Machine-level fallback store id, consulted during root resolution only
   * when no --store flag, local root, or project-level store: pointer resolves.
   */
  defaultStore?: string;
  /** Workset opener rows (slice 7.1); hand-edited, validated on use. */
  openers?: unknown;
}

const DEFAULT_CONFIG: GlobalConfig = {
  featureFlags: {},
  profile: 'core',
  delivery: 'both',
};

/**
 * Gets the global configuration directory path following XDG Base Directory Specification.
 *
 * - All platforms: $XDG_CONFIG_HOME/openspec/ if XDG_CONFIG_HOME is set
 * - Unix/macOS fallback: ~/.config/openspec/
 * - Windows fallback: %APPDATA%/openspec/
 */
export function getGlobalConfigDir(): string {
  // XDG_CONFIG_HOME takes precedence on all platforms when explicitly set
  const xdgConfigHome = process.env.XDG_CONFIG_HOME;
  if (xdgConfigHome) {
    return path.join(xdgConfigHome, GLOBAL_CONFIG_DIR_NAME);
  }

  const platform = os.platform();

  if (platform === 'win32') {
    // Windows: use %APPDATA%
    const appData = process.env.APPDATA;
    if (appData) {
      return path.join(appData, GLOBAL_CONFIG_DIR_NAME);
    }
    // Fallback for Windows if APPDATA is not set
    return path.join(os.homedir(), 'AppData', 'Roaming', GLOBAL_CONFIG_DIR_NAME);
  }

  // Unix/macOS fallback: ~/.config
  return path.join(os.homedir(), '.config', GLOBAL_CONFIG_DIR_NAME);
}

/**
 * Gets the global data directory path following XDG Base Directory Specification.
 * Used for user data like schema overrides.
 *
 * - All platforms: $XDG_DATA_HOME/openspec/ if XDG_DATA_HOME is set
 * - Unix/macOS fallback: ~/.local/share/openspec/
 * - Windows fallback: %LOCALAPPDATA%/openspec/
 */
export interface GlobalDataDirOptions {
  env?: NodeJS.ProcessEnv;
  platform?: NodeJS.Platform;
  homedir?: string;
}

function joinGlobalDataPath(platform: NodeJS.Platform, ...segments: string[]): string {
  return platform === 'win32'
    ? path.win32.join(...segments)
    : path.posix.join(...segments);
}

export function getGlobalDataDir(options: GlobalDataDirOptions = {}): string {
  const env = options.env ?? process.env;
  const platform = options.platform ?? os.platform();

  // XDG_DATA_HOME takes precedence on all platforms when explicitly set
  const xdgDataHome = env.XDG_DATA_HOME;
  if (xdgDataHome) {
    return joinGlobalDataPath(platform, xdgDataHome, GLOBAL_DATA_DIR_NAME);
  }

  const homedir = options.homedir ?? os.homedir();

  if (platform === 'win32') {
    // Windows: use %LOCALAPPDATA%
    const localAppData = env.LOCALAPPDATA;
    if (localAppData) {
      return joinGlobalDataPath(platform, localAppData, GLOBAL_DATA_DIR_NAME);
    }
    // Fallback for Windows if LOCALAPPDATA is not set
    return joinGlobalDataPath(platform, homedir, 'AppData', 'Local', GLOBAL_DATA_DIR_NAME);
  }

  // Unix/macOS fallback: ~/.local/share
  return joinGlobalDataPath(platform, homedir, '.local', 'share', GLOBAL_DATA_DIR_NAME);
}

/**
 * Gets the path to the global config file.
 */
export function getGlobalConfigPath(): string {
  return path.join(getGlobalConfigDir(), GLOBAL_CONFIG_FILE_NAME);
}

/**
 * Loads the global configuration from disk.
 * Returns default configuration if file doesn't exist or is invalid.
 * Merges loaded config with defaults to ensure new fields are available.
 */
export interface GlobalConfigLoadResult {
  config: GlobalConfig;
  /** Whether a valid profile was explicitly configured on disk. */
  hasConfiguredProfile: boolean;
}

/**
 * Loads global configuration while retaining whether its profile came from the
 * file or from the core default. Callers that report profile provenance use
 * this rather than treating materialized defaults as user configuration.
 */
export function getGlobalConfigWithSource(): GlobalConfigLoadResult {
  const configPath = getGlobalConfigPath();

  try {
    if (!fs.existsSync(configPath)) {
      return { config: { ...DEFAULT_CONFIG }, hasConfiguredProfile: false };
    }

    const content = fs.readFileSync(configPath, 'utf-8');
    const parsed = JSON.parse(content);
    const hasConfiguredProfile = VALID_PROFILES.includes(parsed.profile);

    // Merge with defaults (loaded values take precedence)
    const merged: GlobalConfig = {
      ...DEFAULT_CONFIG,
      ...parsed,
      featureFlags: {
        ...DEFAULT_CONFIG.featureFlags,
        ...(parsed.featureFlags || {})
      }
    };

    if (parsed.profile === undefined) {
      merged.profile = DEFAULT_CONFIG.profile;
    } else if (!hasConfiguredProfile) {
      console.warn(
        `Warning: Invalid profile "${String(parsed.profile)}" in ${configPath}, using "${DEFAULT_CONFIG.profile}"`
      );
      merged.profile = DEFAULT_CONFIG.profile;
    }
    if (parsed.delivery === undefined) {
      merged.delivery = DEFAULT_CONFIG.delivery;
    }

    return { config: merged, hasConfiguredProfile };
  } catch (error) {
    if (error instanceof SyntaxError) {
      console.error(`Warning: Invalid JSON in ${configPath}, using defaults`);
    }
    return { config: { ...DEFAULT_CONFIG }, hasConfiguredProfile: false };
  }
}

export function getGlobalConfig(): GlobalConfig {
  return getGlobalConfigWithSource().config;
}

/**
 * Saves the global configuration to disk.
 * Creates the config directory if it doesn't exist.
 */
export function saveGlobalConfig(config: GlobalConfig): void {
  const configDir = getGlobalConfigDir();
  const configPath = getGlobalConfigPath();

  // Create directory if it doesn't exist
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }

  fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n', 'utf-8');
}
