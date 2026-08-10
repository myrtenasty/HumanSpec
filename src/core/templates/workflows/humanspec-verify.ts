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

4. **Map the contract to reproducible evidence**

   Review the selected proposal's observable outcome and completion evidence,
   every applicable delta-spec requirement and scenario (or the explicit
   no-behavior-delta/\`skip_specs\` declaration), the learner's implementation
   evidence, and each relevant project check declared by the project or
   change. For every assessed item, use a table with the expected outcome,
   evidence observed, reproduction or review step, remaining gap, and exactly
   one disposition: \`pass\`, \`fail\`, or \`inconclusive\`.

   - **Proposal outcome:** compare the claimed user or downstream outcome with
     the implementation and a reproducible demonstration.
   - **Delta requirements and scenarios:** assess each applicable requirement
     and each WHEN/THEN scenario, including changed, added, removed, or
     renamed behavior. A skipped behavior delta is not permission to invent
     requirements.
   - **Implementation evidence:** inspect the learner's application and test
     implementation and run only checks the learner approves. A file existing,
     a task checkbox being checked, or a plausible description alone is never
     sufficient evidence.
   - **Project checks:** read the declared test, lint, build, or other relevant
     checks. Run available checks when approved; ask the learner to run an
     unavailable or environment-specific check. Mark it \`inconclusive\` until
     the missing reproduction or confirmation is supplied rather than turning
     an unavailable check into a pass.

   A required item is software-passing only when its evidence is reproducible
   and sufficient. Keep software evidence separate from learning evidence: a
   passing test does not prove that the learner completed the practice.

5. **Assign dispositions and route the result**

   Report findings in three groups:

   - **Blocking findings:** context blockers, unchecked tasks, missing or
     template-only reflections, incomplete stuck episodes, failed required
     requirements, or required evidence/checks that remain inconclusive.
   - **Non-blocking suggestions:** useful hardening, follow-up tests, or
     optional explanations that do not invalidate the selected contract.
   - **Learner-owned next action:** one concrete action that closes the most
     important gap, such as recording a missing reflection, reproducing a
     check, or correcting the implementation. Do not perform that action for
     the learner.

   The overall disposition is \`pass\` only when the context is ready, every
   practice task and required learner reflection passes, every recorded stuck
   episode is complete, all required software evidence passes, and relevant
   checks are sufficient. Otherwise report \`fail\` for a demonstrated
   violation or \`inconclusive\` when evidence cannot be reproduced, and name
   the exact missing evidence. A failed or inconclusive task-specific review
   directs the learner to /humanspec:coach; a passing review recommends
   /humanspec:archive. Do not execute archive, sync specifications, update the
   roadmap, or update learner history.

6. **Update only the reserved AI verification section**

   Before any write, count exact level-two headings named \`## AI 验证记录\` in
   the selected learning.md. If the heading is missing or appears more than
   once, report a blocker and make no write; do not append a guessed section or
   merge ambiguous boundaries. When exactly one heading exists, preserve that
   heading and replace only its body, from the end of that heading to the next
   level-two heading or end of file. Preserve every byte outside that body.

   The replacement body must contain one latest-result record with this stable
   shape (use the learner's language for evidence, but keep the dispositions
   explicit):

   \`\`\`markdown
   ### Latest result
   - Selected change: <name>
   - Overall disposition: pass | fail | inconclusive
   - Learning-result assessment: learning complete | learning incomplete | learning evidence inconclusive
   - Verified at: <timestamp>

   ### Context reviewed
   - Status/instruction context and concrete artifact paths:
   - Registered project documents:

   ### Gate dispositions
   - Practice-task checklist:
   - 开始前:
   - 卡住时的记录:
   - 完成后:

   ### Contract evidence
   - Proposal outcome:
   - Delta requirements and scenarios:
   - Implementation evidence:
   - Relevant project checks:

   ### Blocking findings
   - <none or each blocker with evidence and severity>

   ### Suggestions
   - <none or each non-blocking suggestion>

   ### Next learner action
   - <one concrete action, or the archive recommendation after a pass>
   \`\`\`

   On a retry, replace the prior AI-owned body with the new single latest
   result; do not append a second result or retain stale duplicate findings.
   This write may touch only the named \`AI 验证记录\` body. It must preserve
   application code, test implementation code, \`开始前\`,
   \`卡住时的记录\`, \`完成后\`, the learning contract, every practice-task
   checkbox and description, and all other files. The workflow may report
   review output in the response, but it may not write those learner-owned
   areas.

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
- **Software evidence:** proposal outcome, each delta requirement/scenario,
  implementation evidence, and relevant project checks, each marked pass,
  fail, or inconclusive with reproduction details.
- **Disposition:** overall pass, fail, or inconclusive; separate blockers from
  suggestions and state one learner-owned next action.
- **Verification record and ownership:** confirm that exactly one reserved
  \`AI 验证记录\` body was replaced only when its heading was unambiguous, and
  that application code, tests, reflections, and task checkboxes were
  preserved. On failure or inconclusive evidence, point to /humanspec:coach;
  on pass, recommend /humanspec:archive without running it.

If context is not ready, output the exact selection or repair blocker instead
of task-specific findings or a verified result. Verification does not provide
adaptive /humanspec:next behavior or learning-aware archive feedback.`;

const CONTENT = `${RESPONSIBILITY}

${STORE_SELECTION_GUIDANCE}

${HUMANSPEC_PROJECT_DOCS}

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
