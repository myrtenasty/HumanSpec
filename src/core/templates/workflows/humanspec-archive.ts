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

   Resolve \`project\`, \`roadmap\`, and \`learner\` only through the named
   project-document registry (\`PROJECT_DOC_TEMPLATES\`,
   \`getProjectDocTemplate\`, \`resolveProjectDocPath\`, and
   \`detectHumanSpecDocType\`). Build every path with \`path.join()\` or
   \`path.resolve()\`, including Windows drive-letter roots. Validate the
   registered frontmatter, every required heading, the candidate-slice grammar,
   the archived-record grammar, and the learner record sections. A missing,
   unreadable, malformed, unmarked, duplicated, or ambiguous anchor is an
   exact blocker: report its logical document id, resolved path, line/heading,
   and one repair action. Do not guess a sibling file or write any document.

2. **Apply the normal verification and learning gates**

   Read the latest single verification result in the selected learning
   artifact. A normal archive is ready only when its overall disposition is
   \`pass\`, its learning-result assessment is \`learning complete\`, every
   practice task is checked, \`## 开始前\` and \`## 完成后\` contain substantive
   learner-authored evidence, every recorded stuck episode has an attempted
   approach, observation, hypothesis, and requested hint, and every required
   software check has sufficient reproducible evidence. Report each missing,
   failed, or inconclusive item by its exact evidence and do not write positive
   mastery, completed-slice, or adaptive records while a gate is incomplete.

   A learner may explicitly choose a **forced archive** despite a reported
   gate failure. Show the exact gates being bypassed, ask for a separate,
   explicit confirmation, and label the outcome \`learning incomplete\` or
   \`learning evidence inconclusive\`. Forced archive does not invent a
   reflection, change a learner checkbox, or record mastery for an unverified
   topic. It still uses the canonical archive operation and still requires a
   separate feedback preview confirmation.

3. **Build and show the archive/feedback preview without writing**

   Use the project-document feedback planner to produce one in-memory plan.
   Resolve the exact roadmap candidate by exact change name; remove only that
   line, leave unrelated candidates untouched, and create or reuse the named
   \`# 已归档切片\` section with exactly one deterministic record:

   \`\`\`
   - [x] archived: <change-name> — <outcome> (feedback: pending|complete)
   \`\`\`

   Propose learner \`gap:\`, \`mastered:\`, and \`review:\` records only from
   explicit learner evidence and the latest verification record. normalize
   topics for duplicate detection, preserve their original wording, and never
   rewrite \`开始前\`, \`卡住时的记录\`, or \`完成后\`. Show the resolved path,
   exact old/new lines, duplicate/already-applied records, conflicts, line
   ending style, and every preserved unrelated section for both documents.

   Confirmation is separate at both decision points: first confirm the
   permitted archive, then after canonical archive succeeds show the final
   roadmap and learner feedback preview and ask for explicit confirmation.
   A rejected preview leaves the affected document unchanged and keeps the
   feedback loop pending; it is not a completed learning outcome.

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

5. **Apply confirmed feedback with an explicit pending state**

   Only after the canonical archive succeeds and the learner confirms the
   feedback preview, use per-document atomic same-directory replacement in
   this order:

   - write the roadmap archived record as \`feedback: pending\`;
   - write only missing learner gap/mastered/review records;
   - replace that exact roadmap record's state with \`feedback: complete\`.

   Re-read each file before replacement and preserve its detected LF or CRLF
   style. If any write fails, report the archived path, the exact document,
   error, and \`feedback: pending\`; leave unrelated content unchanged and
   provide the retry reconciliation action. A conflict, malformed structure,
   duplicate record, or ambiguous anchor blocks that document rather than
   overwriting learner-authored content.

6. **Retry reconciliation without repeating archive**

   A later archive-feedback attempt accepts the exact archived change/path,
   re-reads its archived learning outcome and the registered project documents,
   and applies only missing records. It recognizes matching \`feedback: pending\`
   and \`feedback: complete\` records, reports already-applied records without
   duplicating them, and surfaces conflicting edits. Reconciliation must never
   rerun specification synchronization, move the change a second time, or
   create a new planning artifact. Route \`humanspec-next\` to reconciliation
   while any registered feedback remains pending.

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
  software checks, and every bypass explicitly named for a forced archive;
- **Archive result:** canonical command/result, specification synchronization
  outcome, and final archive path, or the concrete failure with no feedback
  claim;
- **Feedback preview/result:** exact roadmap slice and archived record,
  learner gap/mastered/review records, duplicate/conflict decisions, preserved
  content, LF/CRLF handling, and \`pending\` or \`complete\` reconciliation
  state;
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
