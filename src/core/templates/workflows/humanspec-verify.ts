/**
 * HumanSpec Verify Workflow Template
 *
 * Verifies one practice change as both a software contract and a learning
 * practice. Verification records its result in the reserved AI area of
 * learning.md, but never takes ownership of implementation or reflection.
 */

import type { SkillTemplate, CommandTemplate } from '../types.js';
import {
  HUMANSPEC_IMPLEMENTATION_BOUNDARY,
  HUMANSPEC_PROJECT_DOCS,
  HUMANSPEC_RESPONSIBILITY_GUIDANCE,
  HUMANSPEC_VERIFY_REPORT_GUIDANCE,
  HUMANSPEC_WRITE_BOUNDARIES,
} from './humanspec-shared.js';
import { STORE_SELECTION_GUIDANCE } from './store-selection.js';

const RESPONSIBILITY = `Verify exactly one HumanSpec practice change as both a software contract and
an observable learning practice. Resolve the selected change, its structured
status and apply context, the registered project context, practice evidence,
and reproducible completion evidence before reporting a result. Review the
learner's work without taking ownership of implementation, tests, reflections,
or task choices; record only the latest verification result in the reserved
AI verification area of learning.md.`;

const STEPS = `**Steps**

${HUMANSPEC_VERIFY_REPORT_GUIDANCE}

1. **Select exactly one change before reviewing evidence**

   If the learner names a change, use that exact name and announce it. If no
   change is named, run:

   \`\`\`bash
   openspec list --json
   \`\`\`

   Resolve the active changes from the structured response. If exactly one
   active change is available, announce that selection. If multiple active
   changes match, list the choices and ask the learner to select one; never
   choose the first, newest, or most recently modified change silently. If no
   active change exists, point to /humanspec:propose. A named change that is
   missing, malformed, archived, or ambiguous is a blocker. Do not inspect
   implementation evidence or write learning.md until one change is
   unambiguous.

2. **Resolve structured change and project context**

   For the selected change, run:

   \`\`\`bash
   openspec status --change "<name>" --json
   \`\`\`

   Parse and retain the CLI's \`schemaName\`, \`planningHome\`, \`changeRoot\`,
   \`actionContext\`, and \`artifactPaths\`. Then obtain the internal,
   structured apply context without performing a public implementation apply:

   \`\`\`bash
   openspec instructions apply --change "<name>" --json
   \`\`\`

   Parse \`contextFiles\`, \`state\`, \`progress\`, \`tasks\`, and the
   dynamic \`instruction\`. Treat the CLI \`context\` as required project
   instruction input and \`operationGuidance\` as optional additive advice;
   keep both separate from status, paths, task completion, and evidence. They
   guide the review but are not proof that a task or requirement passed. If
   the instruction state is \`blocked\`, report the missing artifact or
   context and stop before judging completion. If all tasks are complete,
   continue the review rather than inventing a task.

   Read every concrete path returned under \`contextFiles\`; do not assume
   artifact names or reconstruct a contract from a directory name. Before
   reviewing application or test evidence, run
   \`openspec humanspec context inspect --json\` with the selected-root or
   store flags. Use its versioned \`planningHome\` and \`data.documents\`
   entries as the public source of truth for the registered project, roadmap,
   and learner paths, classifications, templates, and issues. Confirm each
   document is readable and valid beneath that planning home. A missing,
   malformed, unmarked, contradictory, or unreadable document is an exact
   context blocker: ask the learner to select, repair, or complete it and do
   not report the change as verified.

3. **Gate on learner-owned practice evidence**

   In the selected change's learning artifact, locate these exact level-two
   sections once each: \`## 开始前\`, \`## 实践任务\`,
   \`## 卡住时的记录\`, \`## 完成后\`, and \`## AI 验证记录\`. Missing or
   duplicated named headings are blockers; never guess a section boundary or
   create a replacement heading. Inspect the task checklist and reflection
   bodies before reviewing software evidence.

   - Every practice-task checkbox under \`## 实践任务\` must be checked
     (\`- [x]\`) for the learning gate to pass. Report every unchecked task
     (\`- [ ]\`) by its exact id and description. Verification never checks
     a box or changes its description.
   - \`## 开始前\` and \`## 完成后\` must contain substantive,
     learner-authored reflection. Whitespace, the registered template
     comments, the known prompts such as \`<!-- 人类学习者填写：... -->\`,
     copied questions, or AI-written filler are not learner evidence;
     template-only content does not count as evidence. Do not treat the
     learning contract or the AI record itself as the learner's reflection.
   - \`## 卡住时的记录\` is not a required episode when it contains only its
     registered placeholder and no learner-recorded stuck episode. When the
     learner records an episode, each episode must distinguish the learner's
     attempted approach, observation, hypothesis, and requested hint. A
     partial episode is a blocking evidence gap. Verification does not fill,
     summarize, or rewrite any learner reflection.

   Any unchecked task, empty or template-only \`开始前\`/\`完成后\` section,
   or incomplete recorded stuck episode is a blocking finding. It prevents a
   learning-complete result even when the implementation or tests appear to
   work. Leave the learner-owned sections and task checkboxes byte-for-byte
   unchanged.

4. **Map observable, scope, and constraint contracts to reproducible evidence**

   Read the selected proposal's observable outcome, completion evidence,
   included scope, explicitly excluded scope, and constraints. Record each
   source as a concrete reference, such as
   \`proposal.md: ## Included Scope, bullet 2\` or
   \`proposal.md: ## Constraints, bullet 1\`. Then review every applicable
   delta-spec requirement and scenario (or the explicit
   no-behavior-delta/\`skip_specs\` declaration), the learner's implementation
   evidence, and each relevant project check declared by the project or
   change.

   For every assessed item, use a table with the contract reference, expected
   outcome, evidence observed, reproduction or review step, remaining gap, and
   exactly one disposition: \`pass\`, \`fail\`, or \`inconclusive\`.

   - **Proposal outcome and included scope:** compare every promised outcome
     and in-scope item with a reproducible implementation demonstration.
   - **Excluded scope and constraints:** confirm the implementation has not
     introduced excluded behavior, dependencies, or design, and establish each
     relevant constraint with concrete evidence. Missing inspection access or
     an unavailable required check is an evidence gap, not a pass.
   - **Delta requirements and scenarios:** assess each applicable requirement
     and each WHEN/THEN scenario, including changed, added, removed, or
     renamed behavior. A skipped behavior delta is not permission to invent
     requirements.
   - **Implementation evidence:** inspect the learner's application and test
     implementation and run only checks the learner approves. A file existing,
     a task checkbox being checked, or a plausible description alone is never
     sufficient evidence.
   - **Project checks:** run available declared checks when approved; ask the
     learner to run an unavailable or environment-specific check. Mark it
     \`inconclusive\` until the missing reproduction or confirmation is supplied.

   A required item is software-passing only when its evidence is reproducible
   and sufficient. Keep software evidence separate from learning evidence: a
   passing test does not prove that the learner completed the practice.

5. **Assign independent software and learning dispositions**

   The overall verification disposition is \`pass\`, \`fail\`, or
   \`inconclusive\`; the learning status is separately \`complete\`,
   \`incomplete\`, or \`inconclusive\`. A software pass does not make learning
   complete. Set learning status to \`complete\` only when every required
   learner-evidence gate is complete; use \`incomplete\` for known missing or
   failed learning evidence and \`inconclusive\` when that evidence cannot be
   established.

   Report the three independent categories from the shared verification
   guidance: **blockers**, non-blocking **suggestions**, and **follow-up
   learning**. Follow-up learning is allowed to be empty when the evidence
   supports no additional item; do not invent a topic. Every blocker must
   contain all four fields: **contract reference**, **observed evidence**,
   **consequence**, and one bounded **learner next step**. For example, an
   excluded-scope violation cites the proposal statement and changed dependency,
   explains why it blocks verification, and asks the learner to remove or
   justify that one dependency. Do not substitute one global next action for
   per-blocker evidence.

   The overall disposition is \`pass\` only when the context is ready, every
   practice task and required learner reflection passes, every recorded stuck
   episode is complete, all required software evidence passes, and relevant
   checks are sufficient. Otherwise report \`fail\` for a demonstrated
   violation or \`inconclusive\` when evidence cannot be reproduced. A failed
   or inconclusive task-specific review directs the learner to
   /humanspec:coach; a passing review recommends /humanspec:archive. Do not
   execute archive, sync specifications, update the roadmap, or update learner
   history.

   **No complete solution in failure feedback:** when verification is failing
   or inconclusive, explain the evidence and consequence and give one bounded
   learner action. Never provide a complete copy-ready implementation, patch,
   test suite, end-to-end algorithm, or ready-to-apply fix, even when the
   learner asks for it. Direct implementation back to the learner or to
   progressive coaching. A local example is allowed only when it is incomplete,
   bounded to the missing evidence shape, and cannot be pasted to implement the
   affected behavior.

6. **Update only the reserved AI verification section**

   Before any write, count exact level-two headings named \`## AI 验证记录\` in
   the selected learning.md. If the heading is missing or appears more than
   once, report a blocker and make no write; do not append a guessed section or
   merge ambiguous boundaries. When exactly one heading exists, preserve that
   heading and replace only its bounded version-1 feedback region. Preserve
   every byte outside that region.

   Render one latest canonical feedback region with this stable shape:

   \`\`\`markdown
   <!-- humanspec:learning-feedback:start version=1 -->
   - learning-status: complete | incomplete | inconclusive
   - mastered: <evidence-supported topic>
   - gap: <evidence-supported topic>
   - review: <evidence-supported topic>
   <!-- humanspec:learning-feedback:end -->
   \`\`\`

   Typed records may repeat. Emit no line for an empty category: never write
   \`<none>\`, \`none\`, or another placeholder as a topic. Emit \`mastered\`
   records only when \`learning-status: complete\`; failing or inconclusive
   verification may still write supported \`gap\` and \`review\` records.
   In the surrounding review output, retain the overall disposition, gate
   table, source references, and each independently actionable blocker.

   On a retry, replace the prior bounded feedback region with the new single
   latest result; do not append a second result or retain stale duplicate
   records. This write may touch only the named \`AI 验证记录\` region. It must
   preserve application code, test implementation code, \`开始前\`,
   \`卡住时的记录\`, \`完成后\`, the learning contract, every practice-task
   checkbox and description, and all other files byte-for-byte. The workflow
   may report review output in the response, but it may not write those
   learner-owned areas.

   Keep the existing \`humanspec-verify\` workflow identity and \`humanspec\`
   namespace, use the existing internal \`openspec instructions apply\`
   protocol, and retain the shared human-implementation boundary. This is not
   a new public \`apply\` workflow and it does not implement adaptive
   \`humanspec-next\`, learning-aware archive feedback, archive behavior,
   roadmap mutation, specification synchronization, or learner-history
   updates.`;

const OUTPUT = `**Output**

Use this response shape:

- **Selected context:** planning home, exactly one change, schema, current
  task progress, concrete context files, the three project documents, and the
  learning contract/completion evidence used.
- **Learning gate:** each task and the \`开始前\`, \`卡住时的记录\`, and
  \`完成后\` dispositions; identify template-only or missing evidence without
  editing it.
- **Software and contract evidence:** proposal outcome, included scope,
  excluded scope, constraints, each delta requirement/scenario, implementation
  evidence, and relevant project checks; cite each concrete source reference
  and mark it pass, fail, or inconclusive with reproduction details.
- **Disposition:** overall pass, fail, or inconclusive and the separate
  learning status. Report separate **blockers**, non-blocking **suggestions**,
  and **follow-up learning** (which may be empty). For every blocker, include
  its contract reference, observed evidence, consequence, and one bounded
  learner next step; suggestions remain non-blocking.
- **No-complete-solution boundary:** on a failing or inconclusive result,
  report evidence, consequence, and one bounded learner action; refuse complete
  patches, test suites, copy-ready fixes, and end-to-end solutions. A local
  example must remain incomplete and bounded.
- **Verification record and ownership:** confirm that exactly one bounded
  version-1 feedback region was replaced only when its heading was unambiguous,
  and that application code, tests, reflections, and task checkboxes were
  preserved byte-for-byte. On failure or inconclusive evidence, point to
  /humanspec:coach; on pass, recommend /humanspec:archive without running it.

If context is not ready, output the exact selection or repair blocker instead
of task-specific findings or a verified result. Verification does not provide
adaptive /humanspec:next behavior or learning-aware archive feedback.`;

const CONTENT = `${RESPONSIBILITY}

${STORE_SELECTION_GUIDANCE}

${HUMANSPEC_PROJECT_DOCS}

${HUMANSPEC_RESPONSIBILITY_GUIDANCE}

${HUMANSPEC_IMPLEMENTATION_BOUNDARY}

${HUMANSPEC_WRITE_BOUNDARIES['humanspec-verify']}

${STEPS}

${OUTPUT}`;

export function getHumanspecVerifySkillTemplate(): SkillTemplate {
  return {
    name: 'humanspec-verify',
    description: 'Verify one HumanSpec practice change against software and learning evidence',
    instructions: CONTENT,
    license: 'MIT',
    compatibility: 'Requires openspec CLI.',
    metadata: { author: 'openspec', version: '1.0' },
  };
}

export function getHumanspecVerifyCommandTemplate(): CommandTemplate {
  return {
    name: 'HUMANSPEC: Verify',
    description: 'Verify one HumanSpec practice change against software and learning evidence',
    category: 'Workflow',
    tags: ['workflow', 'humanspec', 'verify'],
    content: CONTENT,
  };
}
