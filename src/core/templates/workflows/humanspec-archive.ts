/**
 * HumanSpec Archive Workflow Template
 *
 * Archives one verified practice change through the canonical OpenSpec archive
 * operation, then applies explicitly confirmed, retry-safe learning feedback.
 */

import type { SkillTemplate, CommandTemplate } from '../types.js';
import {
  HUMANSPEC_IMPLEMENTATION_BOUNDARY,
  HUMANSPEC_PROJECT_DOCS,
  HUMANSPEC_WRITE_BOUNDARIES,
} from './humanspec-shared.js';
import { STORE_SELECTION_GUIDANCE } from './store-selection.js';

const RESPONSIBILITY = `Archive exactly one completed HumanSpec practice change and reconcile its
verified learning outcome with the registered roadmap and learner documents.
This workflow gates a normal archive on software and learning evidence, reuses
the canonical OpenSpec archive operation, previews every project-document
feedback record, and never creates the next change.`;

const STEPS = `**Steps**

1. **Resolve exactly one complete practice context before any write**

   If the learner names a change, use that exact name and announce it. If no
   name is supplied, run:

   \`\`\`bash
   openspec list --json
   \`\`\`

   Select the only active change when exactly one exists; otherwise show every
   candidate and ask the learner to choose one. Never choose by recency,
   directory order, or a historical archive record. For the selected change,
   run the structured lookups below and read every concrete path they return:

   \`\`\`bash
   openspec status --change "<name>" --json
   openspec instructions apply --change "<name>" --json
   \`\`\`

   Keep \`schemaName\`, \`planningHome\`, \`changeRoot\`, \`actionContext\`,
   \`artifactPaths\`, \`contextFiles\`, \`state\`, \`progress\`, \`tasks\`,
   and \`instruction\` separate from the optional \`context\` and
   \`operationGuidance\`. Treat the latter as required project facts and
   advisory guidance respectively, never as proof that a gate passed. If this
   is a retry for an already archived outcome, resolve the exact archived
   change path and read its archived \`learning.md\`; do not select an active
   change or invoke canonical archive again.

   Run \`openspec humanspec context inspect --json\` with the same selected-root
   or store flags. Its versioned envelope is the public source of truth for the
   planning home and registered project, roadmap, and learner targets,
   classifications, template versions, and parse issues. A missing, unreadable,
   malformed, unmarked, duplicated, or ambiguous document is an exact blocker:
   report its logical id, resolved path, issue, and one repair action. Do not
   guess a sibling file or write any document.

2. **Apply the normal verification and learning gates**

   Read the latest bounded version-1 learning-feedback result in the selected
   learning artifact. Its overall verification disposition and its
   \`learning-status\` are separate: a normal archive is ready only when the
   overall disposition is \`pass\` and \`learning-status: complete\`, every
   practice task is checked, \`## 开始前\` and \`## 完成后\` contain substantive
   learner-authored evidence, every recorded stuck episode has an attempted
   approach, observation, hypothesis, and requested hint, and every required
   software check has sufficient reproducible evidence.

   Inspect each blocker as an independently actionable result: retain its
   contract reference, observed evidence, consequence, and bounded learner
   next step. Report every missing, failed, or inconclusive item by that
   evidence. Do not write positive mastery, completed-slice, or adaptive
   records while a gate is incomplete. Empty feedback categories add no
   learner record, and only a complete learning status may replay mastered
   records; supported gaps and review items remain useful for incomplete or
   inconclusive results.

   A learner may explicitly choose a **forced archive** despite a reported
   gate failure. Show the exact gates being bypassed, ask for a separate,
   explicit confirmation, and label the outcome \`learning incomplete\` or
   \`learning evidence inconclusive\`. Forced archive does not invent a
   reflection, change a learner checkbox, or record mastery for an unverified
   topic. It still uses the canonical archive operation and still requires a
   separate feedback preview confirmation.

3. **Keep feedback planning separate from the archive gate**

   First obtain the learner's explicit confirmation for the normal or forced
   archive gate. Do not draft a private feedback plan or rewrite a project
   document before canonical archive succeeds. The archive result is the only
   source of the archived evidence used by the public feedback plan.

4. **Use the canonical archive operation exactly once**

   After the normal or separately confirmed forced gates pass, invoke the
   existing OpenSpec operation in structured non-interactive mode, carrying the
   selected-root/store flags from the earlier lookups:

   \`\`\`bash
   openspec archive "<name>" --json --yes
   \`\`\`

   This is the canonical OpenSpec operation. Do not implement a second move,
   validation, date naming, or specification synchronization algorithm. The JSON result is the source of truth for the
   archived path and specification outcome. If validation, delta-spec sync, or
   the move fails, report the concrete error and the state that remains active;
   do not touch roadmap or learner documents and do not claim feedback was
   archived. Do not rerun this operation during feedback reconciliation.

5. **Create, confirm, and apply the public feedback plan**

   Only after the canonical archive succeeds, run:

   \`\`\`bash
   openspec humanspec context feedback-plan --change "<name>" --json
   \`\`\`

   Preserve selected-root or store flags and present the versioned result's
   \`data.plan\` to the learner: it enumerates the exact bound document paths,
   byte preconditions, proposed records, issues, and pending state. Ask for a
   separate explicit learner confirmation. If it is declined or omitted, do not
   apply the plan and do not describe feedback as complete. After confirmation,
   save the complete plan envelope to a temporary file (or provide it on stdin)
   and run:

   \`\`\`bash
   openspec humanspec context feedback-apply --plan <path|-> --yes --json
   \`\`\`

   Report its written and pending documents exactly. Do not implement direct
   file replacement, recompute a plan, or bypass \`--yes\`.

6. **Retry reconciliation without repeating archive**

   If the public result reports pending feedback, run:

   \`\`\`bash
   openspec humanspec context feedback-reconcile --change "<name>" --json
   \`\`\`

   Preserve selected-root or store flags. This public operation reconstructs
   typed mastered, gap, and review records from canonical archived evidence,
   reports already-applied records without duplicates, and must never re-infer
   an outcome from narrative text, rerun specification synchronization, move
   the change a second time, or create a new planning artifact. Route
   \`humanspec-next\` to reconciliation while feedback remains pending.

7. **Keep the next action explicit and singular**

   When feedback is complete, report exactly one next action through
   \`/humanspec:next\` or \`/humanspec:propose\`. When feedback is pending,
   report exactly one reconciliation action. This workflow must never run
   \`openspec new change\`, create a change directory, or auto-propose the
   next slice.

   workflow.`;

const OUTPUT = `**Output**

Return a stable archive handoff report with:

- **Selected context:** one change or exact archived outcome, resolved planning
  root, schema, \`changeRoot\`/archive path, concrete context files, and the
  three registered project-document paths and classifications;
- **Gates:** task progress, reflection/stuck evidence, verification disposition,
  separate learning status, scope/constraint blockers with their contract
  reference/evidence/consequence/next step, software checks, and every bypass
  explicitly named for a forced archive;
- **Archive result:** canonical command/result, specification synchronization
  outcome, and final archive path, or the concrete failure with no feedback
  claim;
- **Feedback preview/result:** exact roadmap slice and archived record,
  version-1 canonical gap/mastered/review records, empty-category and mastery
  eligibility decisions, duplicate/conflict decisions, preserved content,
  LF/CRLF handling, and \`pending\` or \`complete\` reconciliation state;
- **Ownership boundary:** the human learner owns application code, test
  implementation, task checkboxes, and reflection text; archive may write only
  the canonical specification/archive result and explicitly confirmed
  roadmap/learner feedback records;
- **Next action:** exactly one \`/humanspec:archive\` reconciliation,
  \`/humanspec:next\`, or \`/humanspec:propose\` handoff. Do not create it
  automatically.`;

const CONTENT = `${RESPONSIBILITY}

${STORE_SELECTION_GUIDANCE}

${HUMANSPEC_PROJECT_DOCS}

${HUMANSPEC_IMPLEMENTATION_BOUNDARY}

${HUMANSPEC_WRITE_BOUNDARIES['humanspec-archive']}

${STEPS}

${OUTPUT}`;

export function getHumanspecArchiveSkillTemplate(): SkillTemplate {
  return {
    name: 'humanspec-archive',
    description: 'Archive one verified HumanSpec practice change and reconcile learning feedback',
    instructions: CONTENT,
    license: 'MIT',
    compatibility: 'Requires openspec CLI.',
    metadata: { author: 'openspec', version: '1.0' },
  };
}

export function getHumanspecArchiveCommandTemplate(): CommandTemplate {
  return {
    name: 'HUMANSPEC: Archive',
    description: 'Archive one verified HumanSpec practice change and reconcile learning feedback',
    category: 'Workflow',
    tags: ['workflow', 'humanspec', 'archive'],
    content: CONTENT,
  };
}
