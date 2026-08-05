/**
 * HumanSpec Verify Workflow Template
 *
 * Verifies a practice change: reviews the learner's implementation against
 * the change's completion evidence and records the verification result in
 * the reserved AI area of learning.md. It does not fix the code.
 */

import type { SkillTemplate, CommandTemplate } from '../types.js';
import {
  HUMANSPEC_IMPLEMENTATION_BOUNDARY,
  HUMANSPEC_WRITE_BOUNDARIES,
} from './humanspec-shared.js';
import { STORE_SELECTION_GUIDANCE } from './store-selection.js';

const RESPONSIBILITY = `Verify a HumanSpec practice change: check the learner's implementation against
the proposal's completion evidence, run the verification steps the learner
approves, and record the outcome in the reserved AI verification area of
learning.md.`;

const STEPS = `**Steps**

1. **Read the contract**:
   \`\`\`bash
   openspec status --change "<name>" --json
   \`\`\`
   Read proposal.md (observable outcome, completion evidence), specs, and
   learning.md (practice tasks, the learner's reflection fields).

2. **Verify evidence**: confirm each practice task the learner marked complete
   has the claimed evidence — a test, a demonstration, or a review trail the
   learner can reproduce. Ask the learner to run anything you cannot run.

3. **Report findings**: state what passes, what fails, and what is
   inconclusive — in the learner's terms, with the specific evidence.

4. **Record the result**: append the verification record to the reserved AI
   verification area of learning.md only. Do not edit the learner's
   reflections, code, or tests.

5. **Next action**: if the change passes, suggest /humanspec:archive; if not,
   route back to /humanspec:coach with the specific gap.`;

export function getHumanspecVerifySkillTemplate(): SkillTemplate {
  return {
    name: 'humanspec-verify',
    description: 'Verify a HumanSpec practice change against its completion evidence',
    instructions: `${RESPONSIBILITY}

${STORE_SELECTION_GUIDANCE}

${HUMANSPEC_IMPLEMENTATION_BOUNDARY}

${HUMANSPEC_WRITE_BOUNDARIES['humanspec-verify']}

${STEPS}

**Output**

Summarize: evidence checked, pass/fail per task, the verification record
written to learning.md, and the next action (/humanspec:archive or
/humanspec:coach). This workflow does not gate archiving on learning
reflection quality yet — that gate belongs to a later roadmap change.`,
    license: 'MIT',
    compatibility: 'Requires openspec CLI.',
    metadata: { author: 'openspec', version: '1.0' },
  };
}

export function getHumanspecVerifyCommandTemplate(): CommandTemplate {
  return {
    name: 'HUMANSPEC: Verify',
    description: 'Verify a HumanSpec practice change against its evidence',
    category: 'Workflow',
    tags: ['workflow', 'humanspec', 'verify'],
    content: `${RESPONSIBILITY}

${STORE_SELECTION_GUIDANCE}

${HUMANSPEC_IMPLEMENTATION_BOUNDARY}

${HUMANSPEC_WRITE_BOUNDARIES['humanspec-verify']}

${STEPS}

**Output**

Summarize: evidence checked, pass/fail per task, the verification record
written to learning.md, and the next action (/humanspec:archive or
/humanspec:coach). This workflow does not gate archiving on learning
reflection quality yet — that gate belongs to a later roadmap change.`,
  };
}
