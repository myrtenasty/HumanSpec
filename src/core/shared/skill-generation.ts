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
  getHumanspecInitSkillTemplate,
  getHumanspecNextSkillTemplate,
  getHumanspecProposeSkillTemplate,
  getHumanspecCoachSkillTemplate,
  getHumanspecVerifySkillTemplate,
  getHumanspecArchiveSkillTemplate,
  getHumanspecExploreSkillTemplate,
  type SkillTemplate,
  type CommandTemplate,
} from '../templates/skill-templates.js';
import { COMMAND_DESCRIPTORS } from '../templates/command-descriptors.js';
import { DEFAULT_COMMAND_NAMESPACE, type CommandContent } from '../command-generation/index.js';
import type { RegisteredWorkflowId } from '../profiles.js';
import { OPENSPEC_CLI_ALLOWED_TOOLS } from './allowed-tools.js';

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
  template: CommandTemplate;
  /** Command action ID (e.g. 'propose', 'init'). */
  id: string;
  /** Command family (e.g. 'humanspec'); omitted values resolve to the OpenSpec default. */
  namespace?: string;
  /** Workflow this command serves (e.g. 'humanspec-propose'). */
  workflowId: string;
}

const SKILL_TEMPLATE_FACTORIES: Record<RegisteredWorkflowId, () => SkillTemplate> = {
  explore: getExploreSkillTemplate,
  new: getNewChangeSkillTemplate,
  continue: getContinueChangeSkillTemplate,
  apply: getApplyChangeSkillTemplate,
  update: getUpdateChangeSkillTemplate,
  ff: getFfChangeSkillTemplate,
  sync: getSyncSpecsSkillTemplate,
  archive: getArchiveChangeSkillTemplate,
  'bulk-archive': getBulkArchiveChangeSkillTemplate,
  verify: getVerifyChangeSkillTemplate,
  onboard: getOnboardSkillTemplate,
  propose: getOpsxProposeSkillTemplate,
  'humanspec-init': getHumanspecInitSkillTemplate,
  'humanspec-next': getHumanspecNextSkillTemplate,
  'humanspec-propose': getHumanspecProposeSkillTemplate,
  'humanspec-coach': getHumanspecCoachSkillTemplate,
  'humanspec-verify': getHumanspecVerifySkillTemplate,
  'humanspec-archive': getHumanspecArchiveSkillTemplate,
  'humanspec-explore': getHumanspecExploreSkillTemplate,
};

/**
 * Gets skill templates while deriving workflow, directory, and namespace
 * metadata from the canonical command descriptors.
 */
export function getSkillTemplates(workflowFilter?: readonly string[]): SkillTemplateEntry[] {
  const filterSet = workflowFilter ? new Set(workflowFilter) : undefined;

  return COMMAND_DESCRIPTORS
    .filter((descriptor) => !filterSet || filterSet.has(descriptor.workflowId))
    .map((descriptor) => ({
      template: SKILL_TEMPLATE_FACTORIES[descriptor.workflowId](),
      dirName: descriptor.skillDirName,
      workflowId: descriptor.workflowId,
      ...(descriptor.namespace !== DEFAULT_COMMAND_NAMESPACE ? { namespace: descriptor.namespace } : {}),
    }));
}

/**
 * Gets command templates with their IDs, optionally filtered by workflow IDs.
 *
 * @param workflowFilter - If provided, only return templates whose id is in this array
 */
export function getCommandTemplates(workflowFilter?: readonly string[]): CommandTemplateEntry[] {
  const filterSet = workflowFilter ? new Set(workflowFilter) : undefined;

  return COMMAND_DESCRIPTORS
    .filter((descriptor) => !filterSet || filterSet.has(descriptor.workflowId))
    .map((descriptor) => ({
      template: descriptor.templateFactory(),
      id: descriptor.id,
      ...(descriptor.namespace !== DEFAULT_COMMAND_NAMESPACE ? { namespace: descriptor.namespace } : {}),
      workflowId: descriptor.workflowId,
    }));
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
