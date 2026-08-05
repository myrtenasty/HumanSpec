import { DEFAULT_COMMAND_NAMESPACE, type CommandIdentity } from '../command-generation/identity.js';
import type { RegisteredWorkflowId } from '../profiles.js';
import {
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
  getHumanspecInitCommandTemplate,
  getHumanspecNextCommandTemplate,
  getHumanspecProposeCommandTemplate,
  getHumanspecCoachCommandTemplate,
  getHumanspecVerifyCommandTemplate,
  getHumanspecArchiveCommandTemplate,
  getHumanspecExploreCommandTemplate,
  type CommandTemplate,
} from './skill-templates.js';

/**
 * Canonical registration for one generated workflow command.
 *
 * This deliberately stops short of the planned WorkflowManifest while keeping
 * every command projection on one source of truth.
 */
export interface WorkflowCommandDescriptor extends CommandIdentity {
  /** Workflow selected by profiles and used by drift/cleanup decisions. */
  workflowId: RegisteredWorkflowId;
  /** Skill directory used when a tool invokes the workflow through skills. */
  skillDirName: string;
  /** Lazily creates the tool-agnostic command template. */
  templateFactory: () => CommandTemplate;
}

export const COMMAND_DESCRIPTORS: readonly WorkflowCommandDescriptor[] = [
  { workflowId: 'explore', namespace: DEFAULT_COMMAND_NAMESPACE, id: 'explore', skillDirName: 'openspec-explore', templateFactory: getOpsxExploreCommandTemplate },
  { workflowId: 'new', namespace: DEFAULT_COMMAND_NAMESPACE, id: 'new', skillDirName: 'openspec-new-change', templateFactory: getOpsxNewCommandTemplate },
  { workflowId: 'continue', namespace: DEFAULT_COMMAND_NAMESPACE, id: 'continue', skillDirName: 'openspec-continue-change', templateFactory: getOpsxContinueCommandTemplate },
  { workflowId: 'apply', namespace: DEFAULT_COMMAND_NAMESPACE, id: 'apply', skillDirName: 'openspec-apply-change', templateFactory: getOpsxApplyCommandTemplate },
  { workflowId: 'update', namespace: DEFAULT_COMMAND_NAMESPACE, id: 'update', skillDirName: 'openspec-update-change', templateFactory: getOpsxUpdateCommandTemplate },
  { workflowId: 'ff', namespace: DEFAULT_COMMAND_NAMESPACE, id: 'ff', skillDirName: 'openspec-ff-change', templateFactory: getOpsxFfCommandTemplate },
  { workflowId: 'sync', namespace: DEFAULT_COMMAND_NAMESPACE, id: 'sync', skillDirName: 'openspec-sync-specs', templateFactory: getOpsxSyncCommandTemplate },
  { workflowId: 'archive', namespace: DEFAULT_COMMAND_NAMESPACE, id: 'archive', skillDirName: 'openspec-archive-change', templateFactory: getOpsxArchiveCommandTemplate },
  { workflowId: 'bulk-archive', namespace: DEFAULT_COMMAND_NAMESPACE, id: 'bulk-archive', skillDirName: 'openspec-bulk-archive-change', templateFactory: getOpsxBulkArchiveCommandTemplate },
  { workflowId: 'verify', namespace: DEFAULT_COMMAND_NAMESPACE, id: 'verify', skillDirName: 'openspec-verify-change', templateFactory: getOpsxVerifyCommandTemplate },
  { workflowId: 'onboard', namespace: DEFAULT_COMMAND_NAMESPACE, id: 'onboard', skillDirName: 'openspec-onboard', templateFactory: getOpsxOnboardCommandTemplate },
  { workflowId: 'propose', namespace: DEFAULT_COMMAND_NAMESPACE, id: 'propose', skillDirName: 'openspec-propose', templateFactory: getOpsxProposeCommandTemplate },
  { workflowId: 'humanspec-init', namespace: 'humanspec', id: 'init', skillDirName: 'humanspec-init', templateFactory: getHumanspecInitCommandTemplate },
  { workflowId: 'humanspec-next', namespace: 'humanspec', id: 'next', skillDirName: 'humanspec-next', templateFactory: getHumanspecNextCommandTemplate },
  { workflowId: 'humanspec-propose', namespace: 'humanspec', id: 'propose', skillDirName: 'humanspec-propose', templateFactory: getHumanspecProposeCommandTemplate },
  { workflowId: 'humanspec-coach', namespace: 'humanspec', id: 'coach', skillDirName: 'humanspec-coach', templateFactory: getHumanspecCoachCommandTemplate },
  { workflowId: 'humanspec-verify', namespace: 'humanspec', id: 'verify', skillDirName: 'humanspec-verify', templateFactory: getHumanspecVerifyCommandTemplate },
  { workflowId: 'humanspec-archive', namespace: 'humanspec', id: 'archive', skillDirName: 'humanspec-archive', templateFactory: getHumanspecArchiveCommandTemplate },
  { workflowId: 'humanspec-explore', namespace: 'humanspec', id: 'explore', skillDirName: 'humanspec-explore', templateFactory: getHumanspecExploreCommandTemplate },
];

const DESCRIPTOR_BY_WORKFLOW = new Map(
  COMMAND_DESCRIPTORS.map((descriptor) => [descriptor.workflowId, descriptor] as const)
);

export function getCommandDescriptorForWorkflow(
  workflowId: string
): WorkflowCommandDescriptor | undefined {
  return DESCRIPTOR_BY_WORKFLOW.get(workflowId as RegisteredWorkflowId);
}
