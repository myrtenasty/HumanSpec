/**
 * Onboarding command hints.
 *
 * The commands shown to a user after setup must be limited to the workflows
 * their profile actually installs, otherwise we advertise slash commands that
 * were correctly never generated.
 *
 * This module decides WHICH hints to show. How each one is spelled for a given
 * tool — command, skill, or a tool-specific skill prefix — is decided by
 * src/utils/command-references.ts at the call site.
 */

import type { CommandIdentity } from './command-generation/identity.js';
import {
  CANONICAL_INVOCATION,
  formatCommandInvocation,
} from './command-generation/invocation.js';
import { getCommandDescriptorForWorkflow } from './templates/command-descriptors.js';
import type { WorkflowId } from './profiles.js';

export type OnboardingCommand = {
  workflow: WorkflowId;
  identity: CommandIdentity;
  skillDirName: string;
  command: string;
  description: string;
};

/**
 * Longest description the welcome screen can render. It shows these beside a
 * 24-column art column and only animates at MIN_WIDTH (60) columns or wider; a
 * longer line wraps, and the animation's cursor-up count assumes unwrapped
 * lines. See src/ui/welcome-screen.ts.
 */
export const DESCRIPTION_BUDGET = 17;

/**
 * Ordered onboarding hints. Each entry is shown only when its workflow is
 * installed, so the list follows the change lifecycle: start, then build,
 * then implement. HumanSpec workflows follow the practice lifecycle: init,
 * next, propose, coach, verify, archive, explore.
 */
function defineOnboardingCommand(
  workflow: WorkflowId,
  description: string
): OnboardingCommand {
  const descriptor = getCommandDescriptorForWorkflow(workflow);
  if (!descriptor) {
    throw new Error(`Missing command descriptor for onboarding workflow "${workflow}"`);
  }

  const identity = { namespace: descriptor.namespace, id: descriptor.id };
  return {
    workflow,
    identity,
    skillDirName: descriptor.skillDirName,
    command: formatCommandInvocation(CANONICAL_INVOCATION, identity.id, identity.namespace),
    description,
  };
}

const ONBOARDING_COMMANDS: readonly OnboardingCommand[] = [
  defineOnboardingCommand('propose', 'Start a change'),
  defineOnboardingCommand('new', 'Scaffold a change'),
  defineOnboardingCommand('continue', 'Next artifact'),
  defineOnboardingCommand('apply', 'Implement tasks'),
  defineOnboardingCommand('humanspec-init', 'Set up project'),
  defineOnboardingCommand('humanspec-next', 'Pick a change'),
  defineOnboardingCommand('humanspec-propose', 'Start a change'),
  defineOnboardingCommand('humanspec-coach', 'Get coaching'),
  defineOnboardingCommand('humanspec-verify', 'Verify work'),
  defineOnboardingCommand('humanspec-archive', 'Archive change'),
  defineOnboardingCommand('humanspec-explore', 'Explore ideas'),
];

/**
 * Returns the onboarding hints for the installed workflows, in lifecycle order.
 * Returns an empty array when none of the onboarding workflows are installed.
 */
export function getOnboardingCommands(
  workflows: readonly string[]
): OnboardingCommand[] {
  const installed = new Set(workflows);
  return ONBOARDING_COMMANDS.filter((entry) => installed.has(entry.workflow));
}
