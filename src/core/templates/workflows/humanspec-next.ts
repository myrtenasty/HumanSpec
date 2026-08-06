/**
 * HumanSpec Next Workflow Template
 *
 * Routes the learner to the next practice change. Current responsibility is
 * routing and guidance only: it selects the change to work on and hands the
 * learner to /humanspec:propose or /humanspec:coach. Adaptive routing and
 * attention-cost-aware sequencing are later roadmap behaviors and are NOT
 * claimed here.
 */

import type { SkillTemplate, CommandTemplate } from '../types.js';
import {
  HUMANSPEC_IMPLEMENTATION_BOUNDARY,
  HUMANSPEC_PROJECT_DOCS,
  HUMANSPEC_WRITE_BOUNDARIES,
} from './humanspec-shared.js';
import { STORE_SELECTION_GUIDANCE } from './store-selection.js';

const RESPONSIBILITY = `Route the learner to the next HumanSpec practice change: inspect the active
changes under openspec/changes/, identify the one change the learner should
work on next, and guide them to it.`;

const STEPS = `**Steps**

1. **List the current changes**:
   \`\`\`bash
   openspec list --json
   \`\`\`

2. **Choose the next change**: prefer the single active change the learner is
   already working on; otherwise pick the smallest open change that fits the
   learner's practice goal.

3. **Guide the learner**: state which change to work on and why, then point to
   /humanspec:coach (while implementing) or /humanspec:propose (to start a new
   change). Do not create, edit, or delete change artifacts yourself.`;

export function getHumanspecNextSkillTemplate(): SkillTemplate {
  return {
    name: 'humanspec-next',
    description: 'Route the learner to the next HumanSpec practice change',
    instructions: `${RESPONSIBILITY}

${STORE_SELECTION_GUIDANCE}

${HUMANSPEC_PROJECT_DOCS}

${HUMANSPEC_IMPLEMENTATION_BOUNDARY}

${HUMANSPEC_WRITE_BOUNDARIES['humanspec-next']}

${STEPS}

**Output**

Name the chosen change, the reason in one line, and the next action
(/humanspec:coach or /humanspec:propose). This workflow provides routing and
guidance only — it does not adapt the roadmap or re-sequence changes based on
learning history yet.`,
    license: 'MIT',
    compatibility: 'Requires openspec CLI.',
    metadata: { author: 'openspec', version: '1.0' },
  };
}

export function getHumanspecNextCommandTemplate(): CommandTemplate {
  return {
    name: 'HUMANSPEC: Next',
    description: 'Route the learner to the next HumanSpec practice change',
    category: 'Workflow',
    tags: ['workflow', 'humanspec', 'next'],
    content: `${RESPONSIBILITY}

${STORE_SELECTION_GUIDANCE}

${HUMANSPEC_PROJECT_DOCS}

${HUMANSPEC_IMPLEMENTATION_BOUNDARY}

${HUMANSPEC_WRITE_BOUNDARIES['humanspec-next']}

${STEPS}

**Output**

Name the chosen change, the reason in one line, and the next action
(/humanspec:coach or /humanspec:propose). This workflow provides routing and
guidance only — it does not adapt the roadmap or re-sequence changes based on
learning history yet.`,
  };
}
