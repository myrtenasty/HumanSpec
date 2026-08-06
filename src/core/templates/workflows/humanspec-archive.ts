/**
 * HumanSpec Archive Workflow Template
 *
 * Archives a completed HumanSpec practice change: syncs specs, records the
 * learning outcome, and moves the change under openspec/changes/archive/.
 * Learning-aware archive behavior is a later roadmap change and is NOT
 * claimed here.
 */

import type { SkillTemplate, CommandTemplate } from '../types.js';
import {
  HUMANSPEC_IMPLEMENTATION_BOUNDARY,
  HUMANSPEC_PROJECT_DOCS,
  HUMANSPEC_WRITE_BOUNDARIES,
} from './humanspec-shared.js';
import { STORE_SELECTION_GUIDANCE } from './store-selection.js';

const RESPONSIBILITY = `Archive a completed HumanSpec practice change: sync the change's delta specs
into the main specs, ensure the learning record is complete, and move the
change under openspec/changes/archive/.`;

const STEPS = `**Steps**

1. **Confirm readiness**: verify the change's completion evidence exists and
   the learner confirms the practice is done.

2. **Sync specifications** so the archived change's behavior contract lands in
   the main specs (the standard archive flow performs this inline).

3. **Archive the change**:
   \`\`\`bash
   openspec archive --change "<name>" --yes
   \`\`\`

4. **Report the learning outcome**: summarize what was practiced and learned,
   in the learner's own words from their reflection fields — do not rewrite
   the learner's reflections.

5. **Next action**: suggest /humanspec:next to choose the following change.`;

export function getHumanspecArchiveSkillTemplate(): SkillTemplate {
  return {
    name: 'humanspec-archive',
    description: 'Archive a completed HumanSpec practice change (specs, records, archive path)',
    instructions: `${RESPONSIBILITY}

${STORE_SELECTION_GUIDANCE}

${HUMANSPEC_PROJECT_DOCS}

${HUMANSPEC_IMPLEMENTATION_BOUNDARY}

${HUMANSPEC_WRITE_BOUNDARIES['humanspec-archive']}

${STEPS}

**Output**

Summarize: specs synced, change archived to openspec/changes/archive/<name>/,
and the learning outcome reported. Do not claim that the roadmap updates
itself or that archiving adapts to learning history — those are later roadmap
changes.`,
    license: 'MIT',
    compatibility: 'Requires openspec CLI.',
    metadata: { author: 'openspec', version: '1.0' },
  };
}

export function getHumanspecArchiveCommandTemplate(): CommandTemplate {
  return {
    name: 'HUMANSPEC: Archive',
    description: 'Archive a completed HumanSpec practice change',
    category: 'Workflow',
    tags: ['workflow', 'humanspec', 'archive'],
    content: `${RESPONSIBILITY}

${STORE_SELECTION_GUIDANCE}

${HUMANSPEC_PROJECT_DOCS}

${HUMANSPEC_IMPLEMENTATION_BOUNDARY}

${HUMANSPEC_WRITE_BOUNDARIES['humanspec-archive']}

${STEPS}

**Output**

Summarize: specs synced, change archived to openspec/changes/archive/<name>/,
and the learning outcome reported. Do not claim that the roadmap updates
itself or that archiving adapts to learning history — those are later roadmap
changes.`,
  };
}
