/**
 * HumanSpec Propose Workflow Template
 *
 * Proposes a HumanSpec practice change: creates the change planning artifacts
 * (proposal, optional delta specs, learning plan). The learner, not the AI,
 * implements the change afterwards. The full conversational propose behavior
 * of the later roadmap is NOT claimed here.
 */

import type { SkillTemplate, CommandTemplate } from '../types.js';
import {
  HUMANSPEC_IMPLEMENTATION_BOUNDARY,
  HUMANSPEC_PROJECT_DOCS,
  HUMANSPEC_WRITE_BOUNDARIES,
} from './humanspec-shared.js';
import { STORE_SELECTION_GUIDANCE } from './store-selection.js';

const RESPONSIBILITY = `Propose a small HumanSpec practice change: create the change under
openspec/changes/<name>/ with the human-learning schema artifacts — proposal,
optional delta specs, and the learning plan (learning.md) with practice tasks
the human learner will implement.`;

const STEPS = `**Steps**

1. **Understand the practice goal**: ask what the learner wants to practice
   (open-ended). Derive one observable outcome and a kebab-case change name.

2. **Create the change**:
   \`\`\`bash
   openspec new change "<name>" --schema human-learning
   \`\`\`

3. **Create the planning artifacts** by following the schema's artifact
   instructions (\`openspec instructions <artifact-id> --change "<name>" --json\`):
   - proposal.md: why, observable outcome, scope, constraints, completion evidence
   - specs/**/*.md when behavior contracts change (or skip_specs when they do not)
   - learning.md: one primary learning goal, at most two supporting concepts,
     and two to five practice tasks with checkboxes

4. **Keep the change small**: split before continuing if it needs a long
   design or contains multiple independent outcomes.

5. **Hand over**: tell the learner to implement the practice tasks and to use
   /humanspec:coach while working.`;

export function getHumanspecProposeSkillTemplate(): SkillTemplate {
  return {
    name: 'humanspec-propose',
    description: 'Propose a HumanSpec practice change with proposal, specs, and learning plan',
    instructions: `${RESPONSIBILITY}

${STORE_SELECTION_GUIDANCE}

${HUMANSPEC_PROJECT_DOCS}

${HUMANSPEC_IMPLEMENTATION_BOUNDARY}

${HUMANSPEC_WRITE_BOUNDARIES['humanspec-propose']}

${STEPS}

**Output**

Summarize the change: name, observable outcome, artifacts created, and the
first practice task. Do not claim that reflection gates or learning-history
adaptation exist — those are later roadmap changes.`,
    license: 'MIT',
    compatibility: 'Requires openspec CLI.',
    metadata: { author: 'openspec', version: '1.0' },
  };
}

export function getHumanspecProposeCommandTemplate(): CommandTemplate {
  return {
    name: 'HUMANSPEC: Propose',
    description: 'Propose a HumanSpec practice change (planning artifacts only)',
    category: 'Workflow',
    tags: ['workflow', 'humanspec', 'propose'],
    content: `${RESPONSIBILITY}

${STORE_SELECTION_GUIDANCE}

${HUMANSPEC_PROJECT_DOCS}

${HUMANSPEC_IMPLEMENTATION_BOUNDARY}

${HUMANSPEC_WRITE_BOUNDARIES['humanspec-propose']}

${STEPS}

**Output**

Summarize the change: name, observable outcome, artifacts created, and the
first practice task. Do not claim that reflection gates or learning-history
adaptation exist — those are later roadmap changes.`,
  };
}
