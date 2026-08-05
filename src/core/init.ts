/**
 * Init Command
 *
 * Sets up OpenSpec with Agent Skills and /opsx:* slash commands.
 * This is the unified setup command that replaces both the old init and experimental commands.
 */

import path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import * as fs from 'fs';
import { createRequire } from 'module';
import { FileSystemUtils } from '../utils/file-system.js';
import { classifyOpenSpecDir, readProjectConfig, storePointerProblem } from './project-config.js';
import { findRepoPlanningRootSync } from './planning-home.js';
import { getSkillReferenceTransformer, getTransformerForTool } from '../utils/command-references.js';
import {
  AI_TOOLS,
  OPENSPEC_DIR_NAME,
  AIToolOption,
  resolveToolIdAlias,
} from './config.js';
import { PALETTE } from './styles/palette.js';
import { isInteractive } from '../utils/interactive.js';
import { serializeConfig } from './config-prompts.js';
import {
  generateCommands,
  CommandAdapterRegistry,
  CANONICAL_INVOCATION,
  formatCommandInvocation,
} from './command-generation/index.js';
import {
  detectLegacyArtifacts,
  cleanupLegacyArtifacts,
  formatCleanupSummary,
  formatDeferredGlobalPromptSummary,
  formatDetectionSummary,
  getLegacyGlobalPromptMatches,
  omitGlobalLegacyPromptFiles,
  pickGlobalLegacyPromptFiles,
  type LegacyDetectionResult,
} from './legacy-cleanup.js';
import {
  SKILL_NAMES,
  MANAGED_COMMANDS,
  getToolsWithSkillsDir,
  getToolSkillStatus,
  getToolStates,
  getSkillTemplates,
  getCommandContents,
  generateSkillContent,
  type ToolSkillStatus,
} from './shared/index.js';
import { getGlobalConfig, type Delivery, type Profile } from './global-config.js';
import {
  getProfileWorkflows,
  CORE_WORKFLOWS,
  REGISTERED_WORKFLOWS,
} from './profiles.js';
import { resolveEffectiveProfile, validateCliProfileOverride, type EffectiveProfile } from './effective-profile.js';
import { getAvailableTools } from './available-tools.js';
import { getCommandDescriptorForWorkflow } from './templates/command-descriptors.js';
import { WORKFLOW_TO_SKILL_DIR } from './profile-sync-drift.js';
import { migrateIfNeeded, migrateLegacyToolDirs, describeLegacyMigration, keptInPlaceNotice, hasMovableContent, scanInstalledWorkflows as scanInstalledWorkflowsShared } from './migration.js';
import {
  resolveCommandSurfaceCapability,
  resolveCommandInvocation,
  shouldGenerateCommandsForTool,
  shouldGenerateSkillsForTool,
  shouldReconcileCommandFilesForTool,
  shouldRemoveSkillsForTool,
} from './command-surface.js';

const require = createRequire(import.meta.url);
const { version: OPENSPEC_VERSION } = require('../../package.json');

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------

const DEFAULT_SCHEMA = 'spec-driven';

const PROGRESS_SPINNER = {
  interval: 80,
  frames: ['░░░', '▒░░', '▒▒░', '▒▒▒', '▓▒▒', '▓▓▒', '▓▓▓', '▒▓▓', '░▒▓'],
};

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

type InitCommandOptions = {
  tools?: string;
  force?: boolean;
  interactive?: boolean;
  profile?: string;
  /** Commander's --no-animation flag: false disables the welcome animation. */
  animation?: boolean;
};

/**
 * Holds the global Codex prompt matches that must wait until replacement skills
 * are generated before cleanup can continue.
 */
type DeferredLegacyCleanup = {
  detection: LegacyDetectionResult;
};

// -----------------------------------------------------------------------------
// Init Command Class
// -----------------------------------------------------------------------------

export class InitCommand {
  private readonly toolsArg?: string;
  private readonly force: boolean;
  private readonly interactiveOption?: boolean;
  private readonly profileOverride?: string;
  private readonly animation: boolean;
  /**
   * The effective workflow profile resolved once per run (CLI override →
   * project config → global config → core fallback) and reused by every
   * step that reads profile state, so generation, config persistence, and
   * result output can never disagree about the profile.
   */
  private effectiveProfile: EffectiveProfile | null = null;

  constructor(options: InitCommandOptions = {}) {
    this.toolsArg = options.tools;
    this.force = options.force ?? false;
    this.interactiveOption = options.interactive;
    this.profileOverride = options.profile;
    this.animation = options.animation ?? true;
  }

  async execute(targetPath: string): Promise<void> {
    const projectPath = path.resolve(targetPath);
    const openspecDir = OPENSPEC_DIR_NAME;
    const openspecPath = path.join(projectPath, openspecDir);

    // Validation happens silently in the background
    const extendMode = await this.validate(projectPath, openspecPath);

    // Pointer guard (slice 3.2): a config-only openspec/ with a store:
    // declaration is externalized planning, not a root to extend — and a
    // subdirectory of such a repo must not silently grow a nested root.
    // Refuse before legacy cleanup, migration, or prompts touch anything.
    // In extend mode the walk finds projectPath itself; otherwise it
    // finds the nearest ancestor root (so pointer-repo subdirectories
    // refuse exactly where a normal command would resolve the pointer).
    const guardRoot = findRepoPlanningRootSync(projectPath);
    if (guardRoot) {
      const { hasPlanningShape, pointer } = classifyOpenSpecDir(guardRoot);
      if (!hasPlanningShape) {
        if (pointer.malformed) {
          throw new Error(
            `The store declaration in ${pointer.filePath} is invalid (` +
              storePointerProblem(pointer.malformed) +
              `). Fix or remove the store: line before running openspec init.`
          );
        }
        if (pointer.value !== undefined) {
          throw new Error(
            `This repo's planning is externalized to store '${pointer.value}' (${pointer.filePath}). ` +
              `Remove the store: line first to convert this repo to a local OpenSpec root.`
          );
        }
      }
    }

    // Check for legacy artifacts and handle cleanup
    const deferredLegacyCleanup = await this.handleLegacyCleanup(projectPath, extendMode);

    // Migrate OpenSpec-managed skills left in renamed tool directories
    // (e.g. .kimi -> .kimi-code) before detection so they stay recognized.
    migrateLegacyToolDirs(projectPath);

    // Detect available tools in the project (task 7.1)
    const detectedTools = getAvailableTools(projectPath);

    // Migration check: migrate existing projects to profile system (task 7.3)
    if (extendMode) {
      migrateIfNeeded(projectPath, detectedTools);
    }

    // Validate profile override early so invalid values fail before tool setup.
    // The resolved effective profile (CLI → project config → global → core)
    // is computed here, before any artifact write or deletion, so an invalid
    // selection can never leave partial output behind.
    this.resolveProfileOverride();
    this.effectiveProfile = resolveEffectiveProfile({
      cliProfile: this.resolveProfileOverride(),
      projectConfig: readProjectConfig(projectPath),
      globalConfig: getGlobalConfig(),
    });

    // Show animated welcome screen (interactive mode only)
    const canPrompt = this.canPromptInteractively();
    if (canPrompt) {
      const { showWelcomeScreen } = await import('../ui/welcome-screen.js');
      await showWelcomeScreen(this.getActiveWorkflows(), { animate: this.animation });
    }

    // Get tool states before processing
    const toolStates = getToolStates(projectPath);

    // Get tool selection (pass detected tools for pre-selection)
    const selectedToolIds = await this.getSelectedTools(toolStates, extendMode, detectedTools, projectPath);

    // Validate selected tools
    const validatedTools = this.validateTools(selectedToolIds, toolStates);

    // Selecting a renamed tool is consent to leave its former directory:
    // init is about to write the current one, and leaving OpenSpec content
    // behind would give the user two installs of the same tool.
    for (const migration of migrateLegacyToolDirs(
      projectPath,
      validatedTools.map((tool) => tool.value)
    )) {
      if (hasMovableContent(migration)) {
        console.log(chalk.dim(`Migrated ${describeLegacyMigration(migration)}: ${migration.from} → ${migration.to}`));
      }
      const kept = keptInPlaceNotice(migration);
      if (kept) console.log(chalk.dim(kept));
    }

    // Create directory structure and config
    await this.createDirectoryStructure(openspecPath, extendMode);

    // Generate skills and commands for each tool
    const results = await this.generateSkillsAndCommands(projectPath, validatedTools);

    // Legacy cleanup was deferred to avoid interfering with skill/command generation;
    // now that outputs are written, finalize the cleanup (e.g. remove stale files).
    if (deferredLegacyCleanup) {
      await this.finalizeDeferredLegacyCleanup(projectPath, deferredLegacyCleanup);
    }

    // Create config.yaml if needed
    const configStatus = await this.createConfig(openspecPath, extendMode);

    // Display success message
    this.displaySuccessMessage(projectPath, validatedTools, results, configStatus);
  }

  // ═══════════════════════════════════════════════════════════
  // VALIDATION & SETUP
  // ═══════════════════════════════════════════════════════════

  private async validate(
    projectPath: string,
    openspecPath: string
  ): Promise<boolean> {
    const extendMode = await FileSystemUtils.directoryExists(openspecPath);

    // Check write permissions
    if (!(await FileSystemUtils.ensureWritePermissions(projectPath))) {
      throw new Error(`Insufficient permissions to write to ${projectPath}`);
    }
    return extendMode;
  }

  private canPromptInteractively(): boolean {
    if (this.interactiveOption === false) return false;
    if (this.toolsArg !== undefined) return false;
    return isInteractive({ interactive: this.interactiveOption });
  }

  private resolveProfileOverride(): Profile | undefined {
    return validateCliProfileOverride(this.profileOverride);
  }

  /**
   * Resolves the workflows the effective profile installs, so onboarding output
   * only mentions commands that will actually exist.
   */
  private getActiveWorkflows(): string[] {
    const effective = this.getEffectiveProfile();
    return [...effective.workflows];
  }

  /**
   * Returns the effective profile resolved at the start of execute(), or
   * re-resolves on demand for callers that run outside execute() (tests).
   */
  private getEffectiveProfile(): EffectiveProfile {
    if (this.effectiveProfile !== null) {
      return this.effectiveProfile;
    }
    return resolveEffectiveProfile({
      cliProfile: this.resolveProfileOverride(),
      globalConfig: getGlobalConfig(),
    });
  }

  // ═══════════════════════════════════════════════════════════
  // LEGACY CLEANUP
  // ═══════════════════════════════════════════════════════════

  /**
   * Cleans repo-local legacy artifacts immediately and defers global Codex prompt
   * cleanup until replacement skills have been installed.
   */
  private async handleLegacyCleanup(projectPath: string, extendMode: boolean): Promise<DeferredLegacyCleanup | null> {
    // Detect legacy artifacts
    const detection = await detectLegacyArtifacts(projectPath);

    if (!detection.hasLegacyArtifacts) {
      return null; // No legacy artifacts found
    }

    const immediateDetection = omitGlobalLegacyPromptFiles(detection);

    // Show what was detected
    const immediateSummary = formatDetectionSummary(immediateDetection);
    if (immediateSummary) {
      console.log();
      console.log(immediateSummary);
      console.log();
    }

    // Show which global prompts are deferred — they'll only be removed once
    // the corresponding replacement skills are installed during generation.
    const deferredSummary = formatDeferredGlobalPromptSummary(detection);
    if (deferredSummary) {
      console.log(deferredSummary);
      console.log();
    }

    const canPrompt = this.canPromptInteractively();

    if (this.force || !canPrompt) {
      // --force flag or non-interactive mode: proceed with cleanup automatically.
      // Legacy slash commands are 100% OpenSpec-managed, and config file cleanup
      // only removes markers (never deletes files), so auto-cleanup is safe.
      await this.performImmediateLegacyCleanup(projectPath, detection);
      return detection.globalSlashCommandFiles.length > 0 ? { detection } : null;
    }

    // Interactive mode: prompt for confirmation
    const { confirm } = await import('@inquirer/prompts');
    const shouldCleanup = await confirm({
      message: 'Upgrade and clean up legacy files?',
      default: true,
    });

    if (!shouldCleanup) {
      console.log(chalk.dim('Initialization cancelled.'));
      console.log(chalk.dim('Run with --force to skip this prompt, or manually remove legacy files.'));
      process.exit(0);
    }

    await this.performImmediateLegacyCleanup(projectPath, detection);
    return detection.globalSlashCommandFiles.length > 0 ? { detection } : null;
  }

  /**
   * Applies the safe subset of legacy cleanup that does not depend on newly
   * generated Codex skills.
   */
  private async performImmediateLegacyCleanup(
    projectPath: string,
    detection: LegacyDetectionResult
  ): Promise<void> {
    const immediateDetection = omitGlobalLegacyPromptFiles(detection);
    if (!immediateDetection.hasLegacyArtifacts) {
      return;
    }

    await this.performLegacyCleanup(projectPath, immediateDetection);
  }

  /**
   * Removes only the legacy global Codex prompts whose workflows now have
   * replacement skills in the project.
   */
  private async finalizeDeferredLegacyCleanup(
    projectPath: string,
    deferredCleanup: DeferredLegacyCleanup
  ): Promise<void> {
    const availableCodexWorkflows = await this.getInstalledWorkflowsForTool(projectPath, 'codex');
    const removableMatches = getLegacyGlobalPromptMatches(deferredCleanup.detection)
      .filter((prompt) => prompt.workflowIds.every((workflowId) => availableCodexWorkflows.has(workflowId)));

    if (removableMatches.length > 0) {
      await this.performLegacyCleanup(
        projectPath,
        pickGlobalLegacyPromptFiles(
          deferredCleanup.detection,
          removableMatches.map((prompt) => prompt.path)
        )
      );
    }

    const blockedMatches = getLegacyGlobalPromptMatches(deferredCleanup.detection)
      .filter((prompt) => !removableMatches.some((match) => match.path === prompt.path));

    if (blockedMatches.length > 0) {
      console.log(chalk.yellow('Preserved deferred global prompts without replacement skills:'));
      for (const prompt of blockedMatches) {
        console.log(chalk.dim(`  - ${prompt.toolId}: ${prompt.path}`));
      }
      console.log();
    }
  }

  /**
   * Reads the currently installed workflow IDs for a single tool from the
   * generated skill layout on disk.
   */
  private async getInstalledWorkflowsForTool(projectPath: string, toolId: string): Promise<Set<string>> {
    const tool = AI_TOOLS.find((candidate) => candidate.value === toolId);
    if (!tool) {
      return new Set<string>();
    }

    return new Set(scanInstalledWorkflowsShared(projectPath, [tool]));
  }

  private async performLegacyCleanup(projectPath: string, detection: LegacyDetectionResult): Promise<void> {
    const spinner = ora('Cleaning up legacy files...').start();

    const result = await cleanupLegacyArtifacts(projectPath, detection);

    spinner.succeed('Legacy files cleaned up');

    const summary = formatCleanupSummary(result);
    if (summary) {
      console.log();
      console.log(summary);
    }

    console.log();
  }

  // ═══════════════════════════════════════════════════════════
  // TOOL SELECTION
  // ═══════════════════════════════════════════════════════════

  private async getSelectedTools(
    toolStates: Map<string, ToolSkillStatus>,
    extendMode: boolean,
    detectedTools: AIToolOption[],
    projectPath: string
  ): Promise<string[]> {
    // Check for --tools flag first
    const nonInteractiveSelection = this.resolveToolsArg();
    if (nonInteractiveSelection !== null) {
      return nonInteractiveSelection;
    }

    const validTools = getToolsWithSkillsDir();
    const detectedToolIds = new Set(detectedTools.map((t) => t.value));
    const configuredToolIds = new Set(
      [...toolStates.entries()]
        .filter(([, status]) => status.configured)
        .map(([toolId]) => toolId)
    );
    const shouldPreselectDetected = !extendMode && configuredToolIds.size === 0;
    const canPrompt = this.canPromptInteractively();

    // Non-interactive mode: use detected tools as fallback (task 7.8)
    if (!canPrompt) {
      if (detectedToolIds.size > 0) {
        return [...detectedToolIds];
      }
      throw new Error(
        `No tools detected and no --tools flag provided. Valid tools:\n  ${validTools.join('\n  ')}\n\nUse --tools all, --tools none, or --tools claude,cursor,...`
      );
    }

    if (validTools.length === 0) {
      throw new Error(
        `No tools available for skill generation.`
      );
    }

    // Interactive mode: show searchable multi-select
    const { searchableMultiSelect } = await import('../prompts/searchable-multi-select.js');

    // Build choices: pre-select configured tools; keep detected tools visible but unselected.
    const sortedChoices = validTools
      .map((toolId) => {
        const tool = AI_TOOLS.find((t) => t.value === toolId);
        const status = toolStates.get(toolId);
        const configured = status?.configured ?? false;
        const detected = detectedToolIds.has(toolId);

        return {
          name: tool?.name || toolId,
          value: toolId,
          configured,
          detected: detected && !configured,
          preSelected: configured || (shouldPreselectDetected && detected && !configured),
        };
      })
      .sort((a, b) => {
        // Configured tools first, then detected (not configured), then everything else.
        if (a.configured && !b.configured) return -1;
        if (!a.configured && b.configured) return 1;
        if (a.detected && !b.detected) return -1;
        if (!a.detected && b.detected) return 1;
        return 0;
      });

    const configuredNames = validTools
      .filter((toolId) => configuredToolIds.has(toolId))
      .map((toolId) => AI_TOOLS.find((t) => t.value === toolId)?.name || toolId);

    if (configuredNames.length > 0) {
      console.log(`OpenSpec configured: ${configuredNames.join(', ')} (pre-selected)`);
    }

    const detectedOnlyNames = detectedTools
      .filter((tool) => !configuredToolIds.has(tool.value))
      .map((tool) => tool.name);

    if (detectedOnlyNames.length > 0) {
      const detectionLabel = shouldPreselectDetected
        ? 'pre-selected for first-time setup'
        : 'not pre-selected';
      console.log(`Detected tool directories: ${detectedOnlyNames.join(', ')} (${detectionLabel})`);
    }

    const selectedTools = await searchableMultiSelect({
      message: `Select tools to set up (${validTools.length} available)`,
      pageSize: 15,
      choices: sortedChoices,
      validate: (selected: string[]) => selected.length > 0 || 'Select at least one tool',
    });

    if (selectedTools.length === 0) {
      throw new Error('At least one tool must be selected');
    }

    return selectedTools;
  }

  private resolveToolsArg(): string[] | null {
    if (typeof this.toolsArg === 'undefined') {
      return null;
    }

    const raw = this.toolsArg.trim();
    if (raw.length === 0) {
      throw new Error(
        'The --tools option requires a value. Use "all", "none", or a comma-separated list of tool IDs.'
      );
    }

    const availableTools = getToolsWithSkillsDir();
    const availableSet = new Set(availableTools);
    const availableList = ['all', 'none', ...availableTools].join(', ');

    const lowerRaw = raw.toLowerCase();
    if (lowerRaw === 'all') {
      return availableTools;
    }

    if (lowerRaw === 'none') {
      return [];
    }

    const tokens = raw
      .split(',')
      .map((token) => token.trim())
      .filter((token) => token.length > 0);

    if (tokens.length === 0) {
      throw new Error(
        'The --tools option requires at least one tool ID when not using "all" or "none".'
      );
    }

    // Retired ids resolve to their current tool, so a rebrand does not break
    // an existing `--tools windsurf` in someone's setup script.
    const normalizedTokens = tokens.map((token) => resolveToolIdAlias(token.toLowerCase()));

    if (normalizedTokens.some((token) => token === 'all' || token === 'none')) {
      throw new Error('Cannot combine reserved values "all" or "none" with specific tool IDs.');
    }

    const invalidTokens = tokens.filter(
      (_token, index) => !availableSet.has(normalizedTokens[index])
    );

    if (invalidTokens.length > 0) {
      throw new Error(
        `Invalid tool(s): ${invalidTokens.join(', ')}. Available values: ${availableList}`
      );
    }

    // Deduplicate while preserving order
    const deduped: string[] = [];
    for (const token of normalizedTokens) {
      if (!deduped.includes(token)) {
        deduped.push(token);
      }
    }

    return deduped;
  }

  private validateTools(
    toolIds: string[],
    toolStates: Map<string, ToolSkillStatus>
  ): Array<{ value: string; name: string; skillsDir: string; wasConfigured: boolean }> {
    const validatedTools: Array<{ value: string; name: string; skillsDir: string; wasConfigured: boolean }> = [];

    for (const toolId of toolIds) {
      const tool = AI_TOOLS.find((t) => t.value === toolId);
      if (!tool) {
        const validToolIds = getToolsWithSkillsDir();
        throw new Error(
          `Unknown tool '${toolId}'. Valid tools:\n  ${validToolIds.join('\n  ')}`
        );
      }

      if (!tool.skillsDir) {
        const validToolsWithSkills = getToolsWithSkillsDir();
        throw new Error(
          `Tool '${toolId}' does not support skill generation.\nTools with skill generation support:\n  ${validToolsWithSkills.join('\n  ')}`
        );
      }

      const preState = toolStates.get(tool.value);
      validatedTools.push({
        value: tool.value,
        name: tool.name,
        skillsDir: tool.skillsDir,
        wasConfigured: preState?.configured ?? false,
      });
    }

    return validatedTools;
  }

  // ═══════════════════════════════════════════════════════════
  // DIRECTORY STRUCTURE
  // ═══════════════════════════════════════════════════════════

  private async createDirectoryStructure(openspecPath: string, extendMode: boolean): Promise<void> {
    if (extendMode) {
      // In extend mode, just ensure directories exist without spinner
      const directories = [
        openspecPath,
        path.join(openspecPath, 'specs'),
        path.join(openspecPath, 'changes'),
        path.join(openspecPath, 'changes', 'archive'),
      ];

      for (const dir of directories) {
        await FileSystemUtils.createDirectory(dir);
      }
      return;
    }

    const spinner = this.startSpinner('Creating OpenSpec structure...');

    const directories = [
      openspecPath,
      path.join(openspecPath, 'specs'),
      path.join(openspecPath, 'changes'),
      path.join(openspecPath, 'changes', 'archive'),
    ];

    for (const dir of directories) {
      await FileSystemUtils.createDirectory(dir);
    }

    spinner.stopAndPersist({
      symbol: PALETTE.white('▌'),
      text: PALETTE.white('OpenSpec structure created'),
    });
  }

  // ═══════════════════════════════════════════════════════════
  // SKILL & COMMAND GENERATION
  // ═══════════════════════════════════════════════════════════

  /**
   * Generates skill files and slash commands for each selected tool,
   * honoring the configured delivery mode (skills, commands, or both).
   *
   * @param projectPath - Absolute path to the project root
   * @param tools - Selected tools with their skill directory metadata
   * @returns Created, refreshed, and failed tools plus removed artifact counts
   */
  private async generateSkillsAndCommands(
    projectPath: string,
    tools: Array<{ value: string; name: string; skillsDir: string; wasConfigured: boolean }>
  ): Promise<{
    createdTools: typeof tools;
    refreshedTools: typeof tools;
    failedTools: Array<{ name: string; error: Error }>;
    commandsSkipped: string[];
    skillsInvocableCommandSkips: string[];
    removedCommandCount: number;
    removedSkillCount: number;
  }> {
    const createdTools: typeof tools = [];
    const refreshedTools: typeof tools = [];
    const failedTools: Array<{ name: string; error: Error }> = [];
    const commandsSkipped: string[] = [];
    const skillsInvocableCommandSkips: string[] = [];
    let removedCommandCount = 0;
    let removedSkillCount = 0;

    // Resolve the effective profile (CLI override → project config → global
    // config → core) and delivery once; every artifact generated below follows
    // exactly this workflow set.
    const effective = this.getEffectiveProfile();
    const profile: Profile = effective.profile;
    const delivery: Delivery = getGlobalConfig().delivery ?? 'both';
    const workflows = effective.workflows;

    // Get skill and command templates filtered by profile workflows
    const deliveryIncludesCommands = delivery !== 'skills';
    const skillTemplates = getSkillTemplates(workflows);
    const commandContents = getCommandContents(workflows);

    // Process each tool
    for (const tool of tools) {
      const spinner = ora(`Setting up ${tool.name}...`).start();

      try {
        const shouldGenerateSkills = shouldGenerateSkillsForTool(tool.value, delivery);
        const shouldGenerateCommands = shouldGenerateCommandsForTool(tool.value, delivery);

        // Generate skill files if the selected delivery and tool capability allow skills
        if (shouldGenerateSkills) {
          // Use tool-specific skillsDir
          const skillsDir = path.join(projectPath, tool.skillsDir, 'skills');

          // Create skill directories and SKILL.md files
          for (const { template, dirName, namespace, workflowId } of skillTemplates) {
            const skillDir = path.join(skillsDir, dirName);
            const skillFile = path.join(skillDir, 'SKILL.md');

            // Generate SKILL.md content with YAML frontmatter including generatedBy.
            // The template's command namespace (humanspec for HumanSpec entries)
            // drives reference rewriting so the skill never advertises a spelling
            // different from the files registered for the same family.
            const transformer = getTransformerForTool(
              tool.value,
              delivery,
              resolveCommandSurfaceCapability(tool.value),
              resolveCommandInvocation(tool.value, getCommandDescriptorForWorkflow(workflowId)),
              namespace
            );
            const skillContent = generateSkillContent(template, OPENSPEC_VERSION, transformer);

            // Write the skill file
            await FileSystemUtils.writeFile(skillFile, skillContent);
          }
        }
        if (shouldRemoveSkillsForTool(tool.value, delivery)) {
          const skillsDir = path.join(projectPath, tool.skillsDir, 'skills');
          removedSkillCount += await this.removeSkillDirs(skillsDir);
        }

        // Generate commands if delivery includes commands
        if (shouldGenerateCommands) {
          const adapter = CommandAdapterRegistry.get(tool.value);
          if (adapter) {
            const generatedCommands = generateCommands(commandContents, adapter);

            for (const cmd of generatedCommands) {
              const commandFile = path.isAbsolute(cmd.path) ? cmd.path : path.join(projectPath, cmd.path);
              await FileSystemUtils.writeFile(commandFile, cmd.fileContent);
            }
          }
        } else if (deliveryIncludesCommands) {
          if (resolveCommandSurfaceCapability(tool.value) === 'skills-invocable') {
            skillsInvocableCommandSkips.push(tool.value);
          } else {
            commandsSkipped.push(tool.value);
          }
        }
        if (shouldReconcileCommandFilesForTool(tool.value, delivery)) {
          removedCommandCount += await this.removeCommandFiles(projectPath, tool.value);
        }

        spinner.succeed(`Setup complete for ${tool.name}`);

        if (tool.wasConfigured) {
          refreshedTools.push(tool);
        } else {
          createdTools.push(tool);
        }
      } catch (error) {
        spinner.fail(`Failed for ${tool.name}`);
        failedTools.push({ name: tool.name, error: error as Error });
      }
    }

    return {
      createdTools,
      refreshedTools,
      failedTools,
      commandsSkipped,
      skillsInvocableCommandSkips,
      removedCommandCount,
      removedSkillCount,
    };
  }

  // ═══════════════════════════════════════════════════════════
  // CONFIG FILE
  // ═══════════════════════════════════════════════════════════

  private async createConfig(
    openspecPath: string,
    extendMode: boolean
  ): Promise<'created' | 'exists' | 'updated' | 'skipped'> {
    const configPath = path.join(openspecPath, 'config.yaml');
    const configYmlPath = path.join(openspecPath, 'config.yml');
    const configYamlExists = fs.existsSync(configPath);
    const configYmlExists = fs.existsSync(configYmlPath);
    const existingConfigPath = configYamlExists ? configPath : configYmlExists ? configYmlPath : null;

    const effective = this.getEffectiveProfile();

    if (existingConfigPath !== null) {
      // Extend mode with an explicit profile override: update only the
      // profile-related keys in the existing .yaml/.yml document, preserving
      // every other field, user-authored content, comments, and the file
      // extension. Without an explicit override the config is preserved
      // byte-for-byte — no project profile is added or changed.
      const cliOverride = this.resolveProfileOverride();
      if (cliOverride !== undefined) {
        try {
          const { parseDocument } = await import('yaml');
          const content = fs.readFileSync(existingConfigPath, 'utf-8');
          const doc = parseDocument(content);
          doc.set('profile', cliOverride);
          if (cliOverride === 'custom' && effective.workflows.length > 0) {
            doc.set('workflows', [...effective.workflows]);
          } else if (cliOverride !== 'custom') {
            // A named preset (core/humanspec) fully determines workflow
            // membership; drop any stale custom selection so the file does
            // not suggest a list the resolver will never consult.
            doc.delete('workflows');
          }
          await FileSystemUtils.writeFile(existingConfigPath, doc.toString());
          return 'updated';
        } catch {
          return 'skipped';
        }
      }
      return 'exists';
    }

    try {
      // New config: persist the resolved named profile alongside the schema
      // setting so init and update resolve the same effective workflow set
      // for this project. Custom selections also persist the workflow list.
      const yamlContent = serializeConfig({
        schema: DEFAULT_SCHEMA,
        profile: effective.profile,
        ...(effective.profile === 'custom' && effective.workflows.length > 0
          ? { workflows: [...effective.workflows] }
          : {}),
      });
      await FileSystemUtils.writeFile(configPath, yamlContent);
      return 'created';
    } catch {
      return 'skipped';
    }
  }

  // ═══════════════════════════════════════════════════════════
  // UI & OUTPUT
  // ═══════════════════════════════════════════════════════════

  private displaySuccessMessage(
    projectPath: string,
    tools: Array<{ value: string; name: string; skillsDir: string; wasConfigured: boolean }>,
    results: {
      createdTools: typeof tools;
      refreshedTools: typeof tools;
      failedTools: Array<{ name: string; error: Error }>;
      commandsSkipped: string[];
      skillsInvocableCommandSkips: string[];
      removedCommandCount: number;
      removedSkillCount: number;
    },
    configStatus: 'created' | 'exists' | 'updated' | 'skipped'
  ): void {
    console.log();
    console.log(chalk.bold('OpenSpec Setup Complete'));
    console.log();

    // Show created vs refreshed tools
    if (results.createdTools.length > 0) {
      console.log(`Created: ${results.createdTools.map((t) => t.name).join(', ')}`);
    }
    if (results.refreshedTools.length > 0) {
      console.log(`Refreshed: ${results.refreshedTools.map((t) => t.name).join(', ')}`);
    }

    // Show counts (respecting profile filter)
    const successfulTools = [...results.createdTools, ...results.refreshedTools];
    if (successfulTools.length > 0) {
      const effective = this.getEffectiveProfile();
      const delivery: Delivery = getGlobalConfig().delivery ?? 'both';
      const workflows = effective.workflows;
      const toolDirs = [...new Set(successfulTools.map((t) => t.skillsDir))].join(', ');
      const skillCount = successfulTools.some((tool) => shouldGenerateSkillsForTool(tool.value, delivery))
        ? getSkillTemplates(workflows).length
        : 0;
      const commandCount = successfulTools.some((tool) => shouldGenerateCommandsForTool(tool.value, delivery))
        ? getCommandContents(workflows).length
        : 0;
      if (skillCount > 0 && commandCount > 0) {
        console.log(`${skillCount} skills and ${commandCount} commands in ${toolDirs}/`);
      } else if (skillCount > 0) {
        console.log(`${skillCount} skills in ${toolDirs}/`);
      } else if (commandCount > 0) {
        console.log(`${commandCount} commands in ${toolDirs}/`);
      }
    }

    // Show failures
    if (results.failedTools.length > 0) {
      console.log(chalk.red(`Failed: ${results.failedTools.map((f) => `${f.name} (${f.error.message})`).join(', ')}`));
    }

    // Show skipped commands
    if (results.commandsSkipped.length > 0) {
      console.log(chalk.dim(`Commands skipped for: ${results.commandsSkipped.join(', ')} (no adapter)`));
    }
    if (results.skillsInvocableCommandSkips.length > 0) {
      console.log(chalk.dim(`Commands skipped for: ${results.skillsInvocableCommandSkips.join(', ')} (uses skills)`));
    }
    if (results.removedCommandCount > 0) {
      console.log(chalk.dim(`Removed: ${results.removedCommandCount} command files (delivery: skills)`));
    }
    if (results.removedSkillCount > 0) {
      console.log(chalk.dim(`Removed: ${results.removedSkillCount} skill directories (delivery: commands)`));
    }

    // Show manual setup notes for tools that need extra configuration
    for (const tool of successfulTools) {
      const setupNote = AI_TOOLS.find((t) => t.value === tool.value)?.setupNote;
      if (setupNote) {
        console.log(chalk.yellow(`Setup required for ${tool.name}: ${setupNote}`));
      }
    }

    // Effective profile summary: the profile, its source, and — for HumanSpec
    // projects — the tool-specific invocation forms the generated commands
    // answer to.
    const effective = this.getEffectiveProfile();
    const sourceLabel = effective.source === 'cli'
      ? 'CLI override'
      : effective.source === 'project'
        ? 'project config (openspec/config.yaml)'
        : effective.source === 'global'
          ? 'global config'
          : 'default (core)';
    console.log(`Profile: ${effective.profile} (source: ${sourceLabel})`);
    const activeDelivery: Delivery = getGlobalConfig().delivery ?? 'both';
    const toolsWithArtifacts = successfulTools.filter(
      (tool) =>
        shouldGenerateCommandsForTool(tool.value, activeDelivery) ||
        shouldGenerateSkillsForTool(tool.value, activeDelivery)
    );
    if (effective.profile === 'humanspec' && toolsWithArtifacts.length > 0) {
      const proposeDescriptor = getCommandDescriptorForWorkflow('humanspec-propose')!;
      const proposeCommand = formatCommandInvocation(
        CANONICAL_INVOCATION,
        proposeDescriptor.id,
        proposeDescriptor.namespace
      );
      const invocationForms = new Set(
        toolsWithArtifacts.map((tool) => {
          const transformer = getTransformerForTool(
            tool.value,
            activeDelivery,
            resolveCommandSurfaceCapability(tool.value),
            resolveCommandInvocation(tool.value, proposeDescriptor),
            proposeDescriptor.namespace
          );
          return transformer ? transformer(proposeCommand) : proposeCommand;
        })
      );
      console.log(
        `HumanSpec invocation: ${invocationForms.size === 1 ? [...invocationForms][0] : [...invocationForms].join(', ')} (propose a practice change)`
      );
    }

    // Config status
    if (configStatus === 'created') {
      console.log(`Config: openspec/config.yaml (schema: ${DEFAULT_SCHEMA}, profile: ${effective.profile})`);
    } else if (configStatus === 'updated') {
      const configYaml = path.join(projectPath, OPENSPEC_DIR_NAME, 'config.yaml');
      const configYml = path.join(projectPath, OPENSPEC_DIR_NAME, 'config.yml');
      const configName = fs.existsSync(configYaml) ? 'config.yaml' : fs.existsSync(configYml) ? 'config.yml' : 'config.yaml';
      console.log(`Config: openspec/${configName} (profile updated to ${effective.profile})`);
    } else if (configStatus === 'exists') {
      // Show actual filename (config.yaml or config.yml)
      const configYaml = path.join(projectPath, OPENSPEC_DIR_NAME, 'config.yaml');
      const configYml = path.join(projectPath, OPENSPEC_DIR_NAME, 'config.yml');
      const configName = fs.existsSync(configYaml) ? 'config.yaml' : fs.existsSync(configYml) ? 'config.yml' : 'config.yaml';
      console.log(`Config: openspec/${configName} (exists)`);
    } else {
      console.log(chalk.dim(`Config: skipped (non-interactive mode)`));
    }

    // Getting started (task 7.6: show propose if in profile; HumanSpec
    // projects are pointed at /humanspec:init instead of an implementation
    // workflow).
    const activeWorkflows = this.getActiveWorkflows();
    // When no tool got /opsx:* commands, point at the skill instead of a
    // command that does not exist.
    const commandsGenerated = successfulTools.some((tool) => shouldGenerateCommandsForTool(tool.value, activeDelivery));
    const skillsGenerated = successfulTools.some((tool) => shouldGenerateSkillsForTool(tool.value, activeDelivery));
    // Each hint line must be a usable instruction for the tool it serves.
    // Tools that generated commands are told the command name their files
    // answer to (/opsx:* when namespaced under opsx/, /opsx-* when the
    // filename is the command); tools that only got skills are told their
    // documented skill invocation (Kimi Code: /skill:openspec-*; Codex CLI:
    // $openspec-*; others: /openspec-*). Tools that got no artifacts are
    // covered by the configuration correction instead. When the selection
    // disagrees, print one line per distinct instruction, labeled with the
    // tools it applies to.
    const startHintLines = (workflowId: string): string[] => {
      const descriptor = getCommandDescriptorForWorkflow(workflowId);
      if (!descriptor) {
        throw new Error(`Missing command descriptor for start hint workflow "${workflowId}"`);
      }
      const command = formatCommandInvocation(
        CANONICAL_INVOCATION,
        descriptor.id,
        descriptor.namespace
      );
      const hintToTools = new Map<string, string[]>();
      for (const tool of successfulTools) {
        let hint: string;
        if (shouldGenerateCommandsForTool(tool.value, activeDelivery)) {
          const transformer = getTransformerForTool(
            tool.value,
            activeDelivery,
            resolveCommandSurfaceCapability(tool.value),
            resolveCommandInvocation(tool.value, descriptor),
            descriptor.namespace
          );
          hint = `Start your first change: ${transformer ? transformer(command) : command} "your idea"`;
        } else if (shouldGenerateSkillsForTool(tool.value, activeDelivery)) {
          hint = `Start your first change: ${getSkillReferenceTransformer(tool.value, descriptor.namespace)(command)} "your idea"`;
        } else {
          continue;
        }
        hintToTools.set(hint, [...(hintToTools.get(hint) ?? []), tool.name]);
      }
      if (hintToTools.size === 0) {
        return [`Start your first change: ${command} "your idea"`];
      }
      if (hintToTools.size === 1) {
        return [[...hintToTools.keys()][0]];
      }
      return [...hintToTools.entries()].map(([hint, toolNames]) => `${hint} (${toolNames.join(', ')})`);
    };
    const printStartHints = (workflowId: string): void => {
      console.log(chalk.bold('Getting started:'));
      for (const line of startHintLines(workflowId)) {
        console.log(`  ${line}`);
      }
    };
    console.log();
    // delivery=commands with tools that only support skills: those tools get
    // no artifacts at all, so print a per-tool configuration correction
    // rather than leave them with a dead (or missing) instruction — even
    // when other selected tools did get commands or skills.
    const zeroArtifactTools = successfulTools.filter(
      (tool) =>
        !shouldGenerateSkillsForTool(tool.value, activeDelivery) &&
        !shouldGenerateCommandsForTool(tool.value, activeDelivery)
    );
    if (zeroArtifactTools.length > 0) {
      const names = zeroArtifactTools.map((tool) => tool.name).join(', ');
      console.log(
        chalk.yellow(
          `No skills or commands were generated for ${names}: delivery is set to 'commands' but ` +
            `${zeroArtifactTools.length === 1 ? 'it supports' : 'they support'} only skills. ` +
            `Run 'openspec config set delivery both' to generate skills.`
        )
      );
    }
    if (successfulTools.length > 0 && !commandsGenerated && !skillsGenerated) {
      // Nothing was generated for any tool: the correction above is the
      // whole story, so don't advertise an invocation that doesn't exist.
    } else if (activeWorkflows.includes('humanspec-init')) {
      printStartHints('humanspec-init');
    } else if (activeWorkflows.includes('propose')) {
      printStartHints('propose');
    } else if (activeWorkflows.includes('new')) {
      printStartHints('new');
    } else {
      console.log("Done. Run 'openspec config profile' to configure your workflows.");
    }

    // Links
    console.log();
    console.log(`Learn more: ${chalk.cyan('https://github.com/Fission-AI/OpenSpec')}`);
    console.log(`Feedback:   ${chalk.cyan('https://github.com/Fission-AI/OpenSpec/issues')}`);

    // Restart instruction if any tools were configured and got a surface
    // (when nothing was generated there is nothing a restart would pick up);
    // only mention commands when commands were actually generated. Not "slash
    // commands": Amazon Q's generated files are prompt-library entries invoked
    // with @, so a restart line promising slash commands would be wrong for it.
    if ((results.createdTools.length > 0 || results.refreshedTools.length > 0) && (commandsGenerated || skillsGenerated)) {
      console.log();
      console.log(
        chalk.white(
          commandsGenerated
            ? 'Restart your IDE for the new commands to take effect.'
            : 'Restart your IDE for the new skills to take effect.'
        )
      );
    }

    console.log();
  }

  private startSpinner(text: string) {
    return ora({
      text,
      stream: process.stdout,
      color: 'gray',
      spinner: PROGRESS_SPINNER,
    }).start();
  }

  private async removeSkillDirs(skillsDir: string): Promise<number> {
    let removed = 0;

    for (const workflow of REGISTERED_WORKFLOWS) {
      const dirName = WORKFLOW_TO_SKILL_DIR[workflow];
      if (!dirName) continue;

      const skillDir = path.join(skillsDir, dirName);
      try {
        if (fs.existsSync(skillDir)) {
          await fs.promises.rm(skillDir, { recursive: true, force: true });
          removed++;
        }
      } catch {
        // Ignore errors
      }
    }

    return removed;
  }

  private async removeCommandFiles(projectPath: string, toolId: string): Promise<number> {
    let removed = 0;
    const adapter = CommandAdapterRegistry.get(toolId);
    if (!adapter) return 0;

    for (const descriptor of MANAGED_COMMANDS) {
      const cmdPath = adapter.getFilePath(descriptor);
      const fullPath = path.isAbsolute(cmdPath) ? cmdPath : path.join(projectPath, cmdPath);

      try {
        if (fs.existsSync(fullPath)) {
          await fs.promises.unlink(fullPath);
          removed++;
        }
      } catch {
        // Ignore errors
      }
    }

    return removed;
  }
}
