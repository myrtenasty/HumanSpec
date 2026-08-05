/**
 * HumanSpec Init Workflow Template
 *
 * Initializes the project's HumanSpec learning setup: it resolves the project
 * practice context, persists the project workflow profile, and generates the
 * HumanSpec workflow surfaces for the selected tools. This template does NOT
 * implement the later roadmap's learner-profile and roadmap generation
 * behavior — those remain in their named follow-up changes.
 */

import type { SkillTemplate, CommandTemplate } from '../types.js';
import {
  HUMANSPEC_IMPLEMENTATION_BOUNDARY,
  HUMANSPEC_WRITE_BOUNDARIES,
} from './humanspec-shared.js';
import { STORE_SELECTION_GUIDANCE } from './store-selection.js';

const RESPONSIBILITY = `Initialize a HumanSpec project: set up the openspec/ planning structure, persist
the project's workflow profile (openspec/config.yaml), and generate the
HumanSpec workflow skills/commands for the selected AI tools.`;

const STEPS = `**Steps**

1. **Resolve the project intent**: confirm the project directory, the human
   learner's practice goal, and the tools to configure. Run:

   \`\`\`bash
   openspec init --profile humanspec --tools <tool-ids>
   \`\`\`

   (or run \`openspec init\` interactively and select the HumanSpec profile).

2. **Verify the setup**: confirm that \`openspec/config.yaml\` records
   \`profile: humanspec\` and that the generated skill directories are
   \`humanspec-<action>\` (init, next, propose, coach, verify, archive,
   explore) with no \`openspec-apply-change\` skill.

3. **Hand over to the learner**: point the learner at /humanspec:next to pick
   the first practice change.`;

export function getHumanspecInitSkillTemplate(): SkillTemplate {
  return {
    name: 'humanspec-init',
    description: 'Initialize a HumanSpec project with the human-owned implementation workflow profile',
    instructions: `${RESPONSIBILITY}

${STORE_SELECTION_GUIDANCE}

${HUMANSPEC_IMPLEMENTATION_BOUNDARY}

${HUMANSPEC_WRITE_BOUNDARIES['humanspec-init']}

${STEPS}

**Output**

Summarize what was initialized: the config location, the effective profile,
the generated tool surfaces, and the first suggested action
(\`/humanspec:next\`). Do not claim that learner-profile generation or
roadmap creation exists yet — those are later HumanSpec roadmap changes.`,
    license: 'MIT',
    compatibility: 'Requires openspec CLI.',
    metadata: { author: 'openspec', version: '1.0' },
  };
}

export function getHumanspecInitCommandTemplate(): CommandTemplate {
  return {
    name: 'HUMANSPEC: Init',
    description: 'Initialize a HumanSpec project (human-owned implementation workflows)',
    category: 'Workflow',
    tags: ['workflow', 'humanspec', 'init'],
    content: `${RESPONSIBILITY}

${STORE_SELECTION_GUIDANCE}

${HUMANSPEC_IMPLEMENTATION_BOUNDARY}

${HUMANSPEC_WRITE_BOUNDARIES['humanspec-init']}

${STEPS}

**Output**

Summarize what was initialized: the config location, the effective profile,
the generated tool surfaces, and the first suggested action
(\`/humanspec:next\`). Do not claim that learner-profile generation or
roadmap creation exists yet — those are later HumanSpec roadmap changes.`,
  };
}
