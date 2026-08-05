/**
 * Skill Generation Utilities
 *
 * Shared utilities for generating skill and command files.
 */

import {
  getExploreSkillTemplate,
  getNewChangeSkillTemplate,
  getContinueChangeSkillTemplate,
  getApplyChangeSkillTemplate,
  getUpdateChangeSkillTemplate,
  getFfChangeSkillTemplate,
  getSyncSpecsSkillTemplate,
  getArchiveChangeSkillTemplate,
  getBulkArchiveChangeSkillTemplate,
  getVerifyChangeSkillTemplate,
  getOnboardSkillTemplate,
  getOpsxProposeSkillTemplate,
  getOpsxExploreCommandTemplate,
  getOpsxNewCommandTemplate,
  getOpsxContinueCommandTemplate,
  getOpsxApplyCommandTemplate,
  getOpsxUpdateCommandTemplate,
  getOpsxFfCommandTemplate,
  getOpsxSyncCommandTemplate,
  getOpsxArchiveCommandTemplate,
  getOpsxBulkArchiveCommandTemplate,
  getOpsxVerifyCommandTemplate,
  getOpsxOnboardCommandTemplate,
  getOpsxProposeCommandTemplate,
  getHumanspecInitSkillTemplate,
  getHumanspecNextSkillTemplate,
  getHumanspecProposeSkillTemplate,
  getHumanspecCoachSkillTemplate,
  getHumanspecVerifySkillTemplate,
  getHumanspecArchiveSkillTemplate,
  getHumanspecExploreSkillTemplate,
  getHumanspecInitCommandTemplate,
  getHumanspecNextCommandTemplate,
  getHumanspecProposeCommandTemplate,
  getHumanspecCoachCommandTemplate,
  getHumanspecVerifyCommandTemplate,
  getHumanspecArchiveCommandTemplate,
  getHumanspecExploreCommandTemplate,
  type SkillTemplate,
} from '../templates/skill-templates.js';
import type { CommandContent } from '../command-generation/index.js';
import { OPENSPEC_CLI_ALLOWED_TOOLS } from './allowed-tools.js';
import { DEFAULT_COMMAND_NAMESPACE } from '../command-generation/identity.js';

/**
 * Skill template with directory name and workflow ID mapping.
 */
export interface SkillTemplateEntry {
  template: SkillTemplate;
  dirName: string;
  workflowId: string;
  /**
   * Command family the template's command references belong to (e.g.
   * 'humanspec'); omitted values resolve to the OpenSpec default. Reference
   * rewriting uses this so generated skills never advertise a spelling
   * different from the files registered for the same family.
   */
  namespace?: string;
}

/**
 * Command template with workflow, command-ID, and namespace mapping.
 */
export interface CommandTemplateEntry {
  template: ReturnType<typeof getOpsxExploreCommandTemplate>;
  /** Command action ID (e.g. 'propose', 'init'). */
  id: string;
  /** Command family (e.g. 'humanspec'); omitted values resolve to the OpenSpec default. */
  namespace?: string;
  /** Workflow this command serves (e.g. 'humanspec-propose'). */
  workflowId: string;
}

/**
 * Gets skill templates with their directory names, optionally filtered by workflow IDs.
 *
 * @param workflowFilter - If provided, only return templates whose workflowId is in this array
 */
export function getSkillTemplates(workflowFilter?: readonly string[]): SkillTemplateEntry[] {
  const all: SkillTemplateEntry[] = [
    { template: getExploreSkillTemplate(), dirName: 'openspec-explore', workflowId: 'explore' },
    { template: getNewChangeSkillTemplate(), dirName: 'openspec-new-change', workflowId: 'new' },
    { template: getContinueChangeSkillTemplate(), dirName: 'openspec-continue-change', workflowId: 'continue' },
    { template: getApplyChangeSkillTemplate(), dirName: 'openspec-apply-change', workflowId: 'apply' },
    { template: getUpdateChangeSkillTemplate(), dirName: 'openspec-update-change', workflowId: 'update' },
    { template: getFfChangeSkillTemplate(), dirName: 'openspec-ff-change', workflowId: 'ff' },
    { template: getSyncSpecsSkillTemplate(), dirName: 'openspec-sync-specs', workflowId: 'sync' },
    { template: getArchiveChangeSkillTemplate(), dirName: 'openspec-archive-change', workflowId: 'archive' },
    { template: getBulkArchiveChangeSkillTemplate(), dirName: 'openspec-bulk-archive-change', workflowId: 'bulk-archive' },
    { template: getVerifyChangeSkillTemplate(), dirName: 'openspec-verify-change', workflowId: 'verify' },
    { template: getOnboardSkillTemplate(), dirName: 'openspec-onboard', workflowId: 'onboard' },
    { template: getOpsxProposeSkillTemplate(), dirName: 'openspec-propose', workflowId: 'propose' },
    // HumanSpec workflow registrations. These stay in the current explicit
    // list until `unify-template-generation-pipeline` migrates them into a
    // single workflow manifest; parity tests keep this list aligned with
    // profile membership, SKILL_NAMES, command descriptors, detection,
    // onboarding, drift, and cleanup.
    { template: getHumanspecInitSkillTemplate(), dirName: 'humanspec-init', workflowId: 'humanspec-init', namespace: 'humanspec' },
    { template: getHumanspecNextSkillTemplate(), dirName: 'humanspec-next', workflowId: 'humanspec-next', namespace: 'humanspec' },
    { template: getHumanspecProposeSkillTemplate(), dirName: 'humanspec-propose', workflowId: 'humanspec-propose', namespace: 'humanspec' },
    { template: getHumanspecCoachSkillTemplate(), dirName: 'humanspec-coach', workflowId: 'humanspec-coach', namespace: 'humanspec' },
    { template: getHumanspecVerifySkillTemplate(), dirName: 'humanspec-verify', workflowId: 'humanspec-verify', namespace: 'humanspec' },
    { template: getHumanspecArchiveSkillTemplate(), dirName: 'humanspec-archive', workflowId: 'humanspec-archive', namespace: 'humanspec' },
    { template: getHumanspecExploreSkillTemplate(), dirName: 'humanspec-explore', workflowId: 'humanspec-explore', namespace: 'humanspec' },
  ];

  if (!workflowFilter) return all;

  const filterSet = new Set(workflowFilter);
  return all.filter(entry => filterSet.has(entry.workflowId));
}

/**
 * Gets command templates with their IDs, optionally filtered by workflow IDs.
 *
 * @param workflowFilter - If provided, only return templates whose id is in this array
 */
export function getCommandTemplates(workflowFilter?: readonly string[]): CommandTemplateEntry[] {
  const all: CommandTemplateEntry[] = [
    { template: getOpsxExploreCommandTemplate(), id: 'explore', workflowId: 'explore' },
    { template: getOpsxNewCommandTemplate(), id: 'new', workflowId: 'new' },
    { template: getOpsxContinueCommandTemplate(), id: 'continue', workflowId: 'continue' },
    { template: getOpsxApplyCommandTemplate(), id: 'apply', workflowId: 'apply' },
    { template: getOpsxUpdateCommandTemplate(), id: 'update', workflowId: 'update' },
    { template: getOpsxFfCommandTemplate(), id: 'ff', workflowId: 'ff' },
    { template: getOpsxSyncCommandTemplate(), id: 'sync', workflowId: 'sync' },
    { template: getOpsxArchiveCommandTemplate(), id: 'archive', workflowId: 'archive' },
    { template: getOpsxBulkArchiveCommandTemplate(), id: 'bulk-archive', workflowId: 'bulk-archive' },
    { template: getOpsxVerifyCommandTemplate(), id: 'verify', workflowId: 'verify' },
    { template: getOpsxOnboardCommandTemplate(), id: 'onboard', workflowId: 'onboard' },
    { template: getOpsxProposeCommandTemplate(), id: 'propose', workflowId: 'propose' },
    // HumanSpec command registrations: the `humanspec` command family with
    // action IDs init, next, propose, coach, verify, archive, explore. Each
    // entry's workflowId links the command to its profile workflow so
    // generation filters and cleanup stay explicit.
    { template: getHumanspecInitCommandTemplate(), id: 'init', namespace: 'humanspec', workflowId: 'humanspec-init' },
    { template: getHumanspecNextCommandTemplate(), id: 'next', namespace: 'humanspec', workflowId: 'humanspec-next' },
    { template: getHumanspecProposeCommandTemplate(), id: 'propose', namespace: 'humanspec', workflowId: 'humanspec-propose' },
    { template: getHumanspecCoachCommandTemplate(), id: 'coach', namespace: 'humanspec', workflowId: 'humanspec-coach' },
    { template: getHumanspecVerifyCommandTemplate(), id: 'verify', namespace: 'humanspec', workflowId: 'humanspec-verify' },
    { template: getHumanspecArchiveCommandTemplate(), id: 'archive', namespace: 'humanspec', workflowId: 'humanspec-archive' },
    { template: getHumanspecExploreCommandTemplate(), id: 'explore', namespace: 'humanspec', workflowId: 'humanspec-explore' },
  ];

  if (!workflowFilter) return all;

  const filterSet = new Set(workflowFilter);
  return all.filter(entry => filterSet.has(entry.workflowId));
}

/**
 * Converts command templates to CommandContent array, optionally filtered by workflow IDs.
 *
 * @param workflowFilter - If provided, only return contents whose id is in this array
 */
export function getCommandContents(workflowFilter?: readonly string[]): CommandContent[] {
  const commandTemplates = getCommandTemplates(workflowFilter);
  return commandTemplates.map(({ template, id, namespace }) => ({
    id,
    ...(namespace !== undefined ? { namespace } : {}),
    name: template.name,
    description: template.description,
    category: template.category,
    tags: template.tags,
    body: template.content,
  }));
}

/**
 * Generates skill file content with YAML frontmatter.
 *
 * @param template - The skill template
 * @param generatedByVersion - The OpenSpec version to embed in the file
 * @param transformInstructions - Optional callback to transform the instructions content
 */
export function generateSkillContent(
  template: SkillTemplate,
  generatedByVersion: string,
  transformInstructions?: (instructions: string) => string
): string {
  const instructions = transformInstructions
    ? transformInstructions(template.instructions)
    : template.instructions;

  return `---
name: ${template.name}
description: ${template.description}
allowed-tools: ${OPENSPEC_CLI_ALLOWED_TOOLS}
license: ${template.license || 'MIT'}
compatibility: ${template.compatibility || 'Requires openspec CLI.'}
metadata:
  author: ${template.metadata?.author || 'openspec'}
  version: "${template.metadata?.version || '1.0'}"
  generatedBy: "${generatedByVersion}"
---

${instructions}
`;
}
