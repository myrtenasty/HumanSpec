/**
 * HumanSpec Propose Workflow Template
 *
 * Turns initialized HumanSpec project and learner context into one
 * learner-confirmed, human-sized practice change. Propose owns planning
 * artifacts only; the learner owns application and test implementation.
 */

import type { SkillTemplate, CommandTemplate } from '../types.js';
import {
  HUMANSPEC_IMPLEMENTATION_BOUNDARY,
  HUMANSPEC_PROJECT_DOCS,
  HUMANSPEC_WRITE_BOUNDARIES,
} from './humanspec-shared.js';
import { STORE_SELECTION_GUIDANCE } from './store-selection.js';

const RESPONSIBILITY = `Turn initialized HumanSpec project and learner context into exactly one
learner-confirmed, human-sized practice change. Read the registered project,
roadmap, and learner documents before planning; then create the
human-learning planning artifacts for the confirmed slice. The learner, not
this workflow, implements the application and test code.`;

const STEPS = `**Steps**

1. **Resolve context before planning**: run
   \`openspec humanspec context inspect --json\` with the selected-root or
   store flags before asking for or drafting a change. Use its versioned
   \`planningHome\` and \`data.documents\` entries as the public source of
   truth for the three registered document targets, classifications, templates,
   and issues; do not infer another \`project.md\`, \`roadmap.md\`, or
   \`learner.md\` destination.

   Classify each path as valid HumanSpec, missing, malformed/invalid, or
   existing unmarked user content. A marker alone is not enough: check the
   registered frontmatter, required headings, and parseable roadmap and learner
   records. If a document or a value required for sizing is missing, malformed,
   unmarked, or still deferred, identify it and give a concrete next action:
   recommend \`/humanspec:init\` for missing or malformed project setup, ask the
   learner to preserve/convert/stop for unmarked content, or ask the learner to
   supply or explicitly resolve the missing value. Do not create a change while
   a required context blocker remains, and never invent learner experience,
   goals, availability, or preferences.

2. **Clarify one practice outcome**: ask what the learner wants to practice,
   then compare it with the project goal and constraints, the roadmap's
   candidate slices, the learner's learning goals, and the configured session
   budget. Ask the learner to confirm one observable outcome for a user or
   downstream system, one primary learning goal, up to two supporting concepts,
   and the evidence that will demonstrate completion. Treat learner-provided
   answers as authoritative; do not infer personal facts from the project.

3. **Size the plan explicitly**: produce one outcome, one primary learning goal,
   no more than two supporting concepts, and two to five independently
   understandable and verifiable practice tasks in dependency order. Every task must fit the learner's configured session budget and name its completion evidence. The complete task set, not just the implementation task, must fit
   that budget. Do not add filler tasks to satisfy the count; revise the slice
   instead.

4. **Split oversized requests before creating anything**: treat multiple independent outcomes, more than five tasks, a request over the
   session budget, or a long architecture/design effort as too large. Explain the
   reason and present a bounded set of candidate slices. Each candidate must
   have one observable outcome, one primary learning focus, at most two
   supporting concepts, and a two-to-five-task evidence plan that fits the
   session budget. Candidates are conversation-only planning output: do not
   create a change directory, update the roadmap, or run \`openspec new change\`
   for them. Ask the learner to select at most one candidate, revise the request,
   or stop; do not proceed until one slice is explicitly selected.

5. **Preview and confirm exactly one plan**: before any change command, show a
   preview containing the selected planning-home/root, resolved context paths,
   change name, observable outcome, primary goal, supporting concepts, session
   budget, task list with independent evidence, scope, and the behavior-delta
   decision (delta specs or \`skip_specs\`). Ask for explicit learner
   confirmation of this one plan. A rejection leaves change artifacts unchanged
   and allows revision, another candidate, or stopping. Never infer consent and
   never create more than one change from a single propose conversation.

6. **Create the confirmed human-learning change**: only after confirmation run:
   \`\`\`bash
   openspec new change "<name>" --schema human-learning
   \`\`\`
   Keep any selected-store flag on this and every supported follow-up command.
   Read the returned planning home and change path; do not assume the nearest
   repository or hardcode a path. Then use \`openspec status --change "<name>" --json\` and the schema's authoritative artifact instructions to create
   only the confirmed change's planning artifacts.

7. **Choose the schema artifact path honestly**:
   - For a behavioral practice, write \`proposal.md\`, the applicable
     \`specs/**/*.md\` delta specifications with observable scenarios, and
     \`learning.md\` with the confirmed two-to-five unchecked practice tasks.
   - For a non-behavioral practice, set the schema's explicit
     \`skip_specs: true\` declaration in the change's \`.openspec.yaml\`, do not
     synthesize or create a delta spec, and write \`proposal.md\` and
     \`learning.md\`. Use the schema instructions rather than inventing a
     parallel artifact sequence.

   The selected plan is the only plan that may create artifacts. Keep every
   learner task unchecked (\`- [ ]\`) and leave the learner's reflection fields
   for the learner. If creation or artifact instructions fail, report the
   concrete error and stop rather than creating a second change or guessing.

8. **Gate the implementation handoff on before-practice reflection**: after
   planning artifacts exist, inspect \`learning.md\` and the \`## 开始前\` section.
   If the learner's own pre-practice reflection is empty or still only a
   template comment, identify it as the next required learner action. Do not
   call the plan ready for implementation or coaching, and do not fill the
   reflection yourself. Once the learner has completed that reflection, hand
   off to the human implementation phase and identify \`/humanspec:coach\` as an
   optional assistance route. This handoff does not mark any practice task
   complete or transfer implementation ownership to AI.

9. **Keep the write boundary visible**: propose may create only the named
   human-learning planning artifacts for the one confirmed change (and the
   schema-required \`skip_specs\` metadata declaration when applicable). It
   never writes application source files, test implementation files, roadmap or
   learner history, or learner-completed task checkboxes. Do not implement the
   change, run a different implementation workflow, or create additional change
   directories as a side effect.`;

const OUTPUT = `**Output**

Report the selected planning home, resolved project-document paths and their
readiness, the single confirmed change name, its observable outcome, primary
learning goal, supporting concepts, session budget, task count, completion
evidence, and the planning artifacts written. State whether the change uses
behavioral delta specs or the explicit \`skip_specs\` path. If the plan was
rejected, oversized, blocked, or awaiting before-practice reflection, report
that state and the learner's concrete next action; do not claim a change was
created or ready when it was not.

After planning, distinguish an empty before-practice reflection from a ready
handoff. Only a learner-completed reflection permits the handoff to human
implementation, with \`/humanspec:coach\` offered as optional assistance. Do
not claim adaptive \`humanspec-next\`, learning-aware verification, or
learning-aware archive behavior; those later HumanSpec roadmap workflows are
outside this propose contract.`;

const CONTENT = `${RESPONSIBILITY}

${STORE_SELECTION_GUIDANCE}

${HUMANSPEC_PROJECT_DOCS}

${HUMANSPEC_IMPLEMENTATION_BOUNDARY}

${HUMANSPEC_WRITE_BOUNDARIES['humanspec-propose']}

${STEPS}

${OUTPUT}`;

export function getHumanspecProposeSkillTemplate(): SkillTemplate {
  return {
    name: 'humanspec-propose',
    description: 'Propose one confirmed, human-sized HumanSpec practice change',
    instructions: CONTENT,
    license: 'MIT',
    compatibility: 'Requires openspec CLI.',
    metadata: { author: 'openspec', version: '1.0' },
  };
}

export function getHumanspecProposeCommandTemplate(): CommandTemplate {
  return {
    name: 'HUMANSPEC: Propose',
    description: 'Propose one confirmed, human-sized HumanSpec practice change',
    category: 'Workflow',
    tags: ['workflow', 'humanspec', 'propose'],
    content: CONTENT,
  };
}
