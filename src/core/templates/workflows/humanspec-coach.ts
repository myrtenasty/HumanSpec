/**
 * HumanSpec Coach Workflow Template
 *
 * Coaches the learner while they implement: inspect, explain, diagnose, and
 * hint — never write the code. This is the read-only companion to the
 * learner's implementation session.
 */

import type { SkillTemplate, CommandTemplate } from '../types.js';
import {
  HUMANSPEC_IMPLEMENTATION_BOUNDARY,
  HUMANSPEC_PROJECT_DOCS,
  HUMANSPEC_WRITE_BOUNDARIES,
} from './humanspec-shared.js';
import { STORE_SELECTION_GUIDANCE } from './store-selection.js';

const RESPONSIBILITY = `Coach the human learner through a practice change: read the change's
planning artifacts and the learner's current code, then explain concepts,
diagnose failures, and offer progressive hints — from the smallest nudge to
more specific guidance only as the learner asks.`;

const STEPS = `**Steps**

1. **Read the change context**:
   \`\`\`bash
   openspec status --change "<name>" --json
   \`\`\`
   Read learning.md (practice tasks) and the current code the learner points at.

2. **Ask before answering**: when the learner is stuck, first ask what they
   tried and what they observed. Offer the smallest hint that unblocks them;
   escalate only when asked.

3. **Diagnose with evidence**: point at the specific behavior or output that
   contradicts the learner's hypothesis. Explain the concept, not just the fix.

4. **Never take the keyboard**: do not edit application or test files, and do
   not check practice-task boxes. The learner marks each task complete.

5. **Wrap up the session**: summarize what the learner practiced, what they
   discovered, and whether /humanspec:verify is ready.`;

export function getHumanspecCoachSkillTemplate(): SkillTemplate {
  return {
    name: 'humanspec-coach',
    description: 'Coach the learner through implementation with hints and diagnosis (no code writes)',
    instructions: `${RESPONSIBILITY}

${STORE_SELECTION_GUIDANCE}

${HUMANSPEC_PROJECT_DOCS}

${HUMANSPEC_IMPLEMENTATION_BOUNDARY}

${HUMANSPEC_WRITE_BOUNDARIES['humanspec-coach']}

${STEPS}

**Output**

Summarize the session: what was practiced, the learner's discoveries, and the
next action (/humanspec:verify when the learner says the tasks are done). This
workflow does not record reflections for the learner and does not run any
reflection gates yet.`,
    license: 'MIT',
    compatibility: 'Requires openspec CLI.',
    metadata: { author: 'openspec', version: '1.0' },
  };
}

export function getHumanspecCoachCommandTemplate(): CommandTemplate {
  return {
    name: 'HUMANSPEC: Coach',
    description: 'Coach the learner with progressive hints (read-only)',
    category: 'Workflow',
    tags: ['workflow', 'humanspec', 'coach'],
    content: `${RESPONSIBILITY}

${STORE_SELECTION_GUIDANCE}

${HUMANSPEC_PROJECT_DOCS}

${HUMANSPEC_IMPLEMENTATION_BOUNDARY}

${HUMANSPEC_WRITE_BOUNDARIES['humanspec-coach']}

${STEPS}

**Output**

Summarize the session: what was practiced, the learner's discoveries, and the
next action (/humanspec:verify when the learner says the tasks are done). This
workflow does not record reflections for the learner and does not run any
reflection gates yet.`,
  };
}
