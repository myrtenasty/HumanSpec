/**
 * HumanSpec Explore Workflow Template
 *
 * Explores a problem before the learner commits to practicing it: investigate,
 * clarify, and sketch options — with no implementation writes.
 */

import type { SkillTemplate, CommandTemplate } from '../types.js';
import {
  HUMANSPEC_IMPLEMENTATION_BOUNDARY,
  HUMANSPEC_WRITE_BOUNDARIES,
} from './humanspec-shared.js';
import { STORE_SELECTION_GUIDANCE } from './store-selection.js';

const RESPONSIBILITY = `Explore a problem the learner is considering: investigate the codebase and
the question, clarify what is known and unknown, and outline practice options
with their sizes — without writing any implementation.`;

const STEPS = `**Steps**

1. **Frame the question**: restate the learner's question and what they hope
   to practice by working on it.

2. **Investigate read-only**: read the relevant code, docs, and any open
   changes. Use \`openspec explore\`-style CLI queries where available.

3. **Report options**: describe 1-3 candidate practice changes, each with the
   observable outcome it would target and a rough size, plus what is unknown.

4. **Recommend**: name the smallest option that matches the learner's
   practice goal, then hand off to /humanspec:propose.`;

export function getHumanspecExploreSkillTemplate(): SkillTemplate {
  return {
    name: 'humanspec-explore',
    description: 'Explore a problem and outline HumanSpec practice options (read-only)',
    instructions: `${RESPONSIBILITY}

${STORE_SELECTION_GUIDANCE}

${HUMANSPEC_IMPLEMENTATION_BOUNDARY}

${HUMANSPEC_WRITE_BOUNDARIES['humanspec-explore']}

${STEPS}

**Output**

Summarize: the question restated, what the investigation found, the practice
options with sizes, and the recommended next action (/humanspec:propose). This
workflow does not create or modify changes, specs, or code. Adaptive roadmap
planning and learning-history sequencing are later roadmap changes and are
not claimed here.`,
    license: 'MIT',
    compatibility: 'Requires openspec CLI.',
    metadata: { author: 'openspec', version: '1.0' },
  };
}

export function getHumanspecExploreCommandTemplate(): CommandTemplate {
  return {
    name: 'HUMANSPEC: Explore',
    description: 'Explore a problem and outline practice options (read-only)',
    category: 'Workflow',
    tags: ['workflow', 'humanspec', 'explore'],
    content: `${RESPONSIBILITY}

${STORE_SELECTION_GUIDANCE}

${HUMANSPEC_IMPLEMENTATION_BOUNDARY}

${HUMANSPEC_WRITE_BOUNDARIES['humanspec-explore']}

${STEPS}

**Output**

Summarize: the question restated, what the investigation found, the practice
options with sizes, and the recommended next action (/humanspec:propose). This
workflow does not create or modify changes, specs, or code. Adaptive roadmap
planning and learning-history sequencing are later roadmap changes and are
not claimed here.`,
  };
}
