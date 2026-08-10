/**
 * HumanSpec Coach Workflow Template
 *
 * Coaches the learner while they implement: inspect, explain, diagnose, and
 * hint — never write the code. This is the read-only companion to the
 * learner's implementation session.
 */

import type { SkillTemplate, CommandTemplate } from '../types.js';
import {
  HUMANSPEC_HINT_EVIDENCE_GUIDANCE,
  HUMANSPEC_IMPLEMENTATION_BOUNDARY,
  HUMANSPEC_PROJECT_DOCS,
  HUMANSPEC_RESPONSIBILITY_GUIDANCE,
  HUMANSPEC_WRITE_BOUNDARIES,
} from './humanspec-shared.js';
import { STORE_SELECTION_GUIDANCE } from './store-selection.js';

const RESPONSIBILITY = `Coach the human learner through one selected HumanSpec practice change. Ground
coaching in the selected change's current practice task, learning contract,
completion evidence, project context, and learner-reported evidence. Inspect,
explain, diagnose, and offer progressive hints, but never take ownership of
application or test implementation.`;

const STEPS = `**Steps**

1. **Select exactly one practice change**

   If the learner names a change, use that exact name and announce it. If the
   learner is resuming, treat the learner-recorded change and task in the
   stuck-state notes as a candidate, but verify it against current status. If
   no change is clear, run:

   \`\`\`bash
   openspec list --json
   \`\`\`

   If there is exactly one active change, announce it before continuing. If
   there are multiple active changes, list the relevant choices and ask the
   learner to select one; never choose the first, newest, or most recently
   modified change silently. If there are no active changes, explain that a
   practice change is required and point to /humanspec:propose. A malformed,
   missing, or archived named change is a blocker, not permission to guess.

2. **Resolve the structured planning state**

   For the selected change, run:

   \`\`\`bash
   openspec status --change "<name>" --json
   \`\`\`

   Parse \`schemaName\`, \`planningHome\`, \`changeRoot\`, \`actionContext\`,
   and the artifact paths from the response. Then read the structured apply
   instructions without performing an implementation apply loop:

   \`\`\`bash
   openspec instructions apply --change "<name>" --json
   \`\`\`

   Use its \`contextFiles\`, \`state\`, \`progress\`, \`tasks\`, and dynamic
   \`instruction\` to identify the current practice task: the first learner
   task whose \`done\` value is false. Preserve the task id and exact
   description. If the state is \`blocked\`, report the missing artifact or
   context and stop task-specific coaching. If every task is complete, point to
   /humanspec:verify instead of inventing another task.

   Read every concrete path listed in \`contextFiles\` and use the artifact
   content as the source for the learning contract, current task, and
   completion evidence. For a HumanSpec practice, confirm that the learning
   artifact contains \`本次学习契约\`, \`实践任务\`, and the learner-owned
   \`卡住时的记录\` section. Do not assume artifact names or reconstruct a
   task from a directory name. Treat the CLI's \`context\` as required project
   instruction input and \`operationGuidance\` as optional additive advice;
   keep both separate from status, tasks, paths, and completion evidence.

3. **Check context readiness before diagnosing**

   Run \`openspec humanspec context inspect --json\` with the selected-root or
   store flags before giving task-specific guidance. Use its versioned
   \`planningHome\` and \`data.documents\` entries as the public source of
   truth for readable registered document targets, classifications, templates,
   and issues. Never infer another project, roadmap, or learner destination.
   The selected change and every context file must remain beneath the same
   reported planning home.

   Confirm that the project, roadmap, and learner documents are readable and
   valid, that the selected change is unique, that the learning artifact has a
   current task, and that the learning contract and completion evidence are
   present. If any context is missing, malformed, contradictory, or ambiguous,
   name the exact blocker and ask the learner to select, repair, or complete it
   before giving a task-specific hint. Never silently switch changes or invent
   a task, learning goal, completion criterion, or learner preference.

4. **Collect learner evidence before diagnosis**

   Before explaining why something is wrong, ask for the smallest useful
   account of the learner's **attempted approach**, **observed output or
   behavior**, **current hypothesis**, and **smallest hint requested**. Keep the
   learner's report distinct from the coach's explanation. Read-only inspection
   may include the relevant application code, test code, error output, logs,
   data flow, and completion evidence, but do not claim a root cause without an
   observation. If the learner has not supplied an attempt or observation, ask
   for the smallest useful code excerpt, command output, failing test, or
   reproduction detail first.

   When evidence is available, identify the contradiction or missing evidence,
   explain the underlying concept in terms of the current task and learning
   goal, and propose one learner-run diagnostic step. State what observation
   would confirm the hypothesis and what observation would reject it. The
   learner runs the experiment and reports back; the coach does not silently
   fix the result.

5. **Use learner-controlled progressive hints**

   Apply the shared hint-level and learner-owned evidence contract above. Every
   substantive response must begin with exactly \`Hint level: Level 1\`,
   \`Hint level: Level 2\`, or \`Hint level: Level 3\`, explain the reasoning,
   state one next self-directed learner action, and remind the learner to
   record the level actually used. Keep the learner's requested level separate
   from the level the coach actually provides and from the level the learner
   later records. Start with the least revealing useful level and escalate one
   level at a time only after the learner explicitly asks for more specificity
   or confirms that the current hint did not unblock them:

   - **Level 1 — concept and checking questions:** explain the relevant concept
     and ask checking questions. Do not name a concrete implementation location,
     symbol, or copyable code.
   - **Level 2 — targeted orientation:** after an explicit escalation request,
     point to relevant modules, symbols, data flow, or observable evidence and
     explain how to inspect them. Do not supply the implementation or a full
     test.
   - **Level 3 — bounded guidance:** after another explicit escalation request
     or confirmation that level two was insufficient, give only a bounded
     pseudocode fragment, API shape, or local example for the immediate next
     step. Keep it incomplete and diagnostic; it must not become a complete,
     copy-ready application or test solution, patch, or end-to-end algorithm.

   A request for a complete solution does not authorize implementation. Remain
   within level three, explain that the learner owns the implementation, and
   offer a smaller diagnostic question or self-directed next action. Never jump
   directly from an unspecific request to level two or three.

6. **Preserve learner ownership and read-only boundaries**

   This coach makes no file writes. If the learner asks the coach to record
   hint use, stuck evidence, or reflection content, explicitly refuse the write:
   the learner must record the requested and used levels and their own episode.
   Provide the concise field shape only; never claim the record was written.
   The learner writes application code and
   test implementation, records \`开始前\`, \`卡住时的记录\`, and \`完成后\`
   reflections, and marks practice-task checkboxes. Do not edit application or
   test files, learning reflections, planning artifacts, or task checkboxes;
   do not append a coaching transcript or fabricate learner evidence. Explain
   the existing stuck-state format so the learner can record the attempted
   approach, observation, hypothesis, and requested hint themselves. Running
   read-only status, instruction, code, test, or error inspection is allowed;
   running an implementation workflow or writing a proposed fix is not.

   If the learner says a task is complete, ask them to record any missing
   evidence or reflection themselves, leave the checkbox unchanged, and direct
   them to /humanspec:verify. Verification, not coaching, decides whether the
   completion evidence is sufficient.

7. **Resume from learner-authored context without switching silently**

   On an interrupted session, re-run the selected change's status and apply
   instruction lookup, then re-read the learning artifact and its \`卡住时的记录\`
   entries. Recover only a single change and task when the notes identify them,
   along with the learner's attempted approach, observed evidence, hypothesis,
   and requested hint level. Summarize the recovered context before continuing
   and preserve the learner's implementation approach and last requested level.
   If the notes are absent, stale, or identify multiple changes or tasks, ask
   the learner to select or restate the context instead of switching silently.
   Conversation history is not durable state, and the coach never writes resume
   notes on the learner's behalf.

8. **Wrap up without claiming later workflows**

   Summarize the selected change and task, the learner's evidence and
   discoveries, the hint level used, the reasoning, unresolved questions, and
   the learner's next action. If all practice tasks are learner-reported as
   complete, suggest /humanspec:verify. This workflow does not implement a
   public apply command, write a session database, persist chat transcripts,
   write reflections, mark tasks complete, provide adaptive routing, run
   reflection gates, update the roadmap, or provide learning-aware archive
   behavior.`;

const OUTPUT = `**Output**

Use this response shape:

- **Selected context:** planning home, one change, schema, current task, and
  the learning goal/completion evidence used.
- **Evidence:** the learner's attempted approach, observation, and hypothesis;
  say when any item is missing rather than filling it in.
- **Hint level:** start the substantive response with exactly \`Hint level: Level 1\`,
  \`Hint level: Level 2\`, or \`Hint level: Level 3\`; state why this level is
  appropriate and why escalation did or did not occur.
- **Requested versus used:** report the learner's requested level separately
  from the level provided and remind the learner to record the level actually
  used in their own stuck evidence.
- **Reasoning and next action:** the concept or diagnosis, one learner-run
  check or experiment, and the next self-directed action.
- **Ownership/status:** confirm that the learner retains code, test,
  reflection, and checkbox ownership; report blockers or readiness for
  /humanspec:verify without changing artifacts.

If context is not ready, output the exact blocker and the learner's concrete
selection or repair action instead of task-specific coaching.`;

const CONTENT = `${RESPONSIBILITY}

${STORE_SELECTION_GUIDANCE}

${HUMANSPEC_PROJECT_DOCS}

${HUMANSPEC_RESPONSIBILITY_GUIDANCE}

${HUMANSPEC_HINT_EVIDENCE_GUIDANCE}

${HUMANSPEC_IMPLEMENTATION_BOUNDARY}

${HUMANSPEC_WRITE_BOUNDARIES['humanspec-coach']}

${STEPS}

${OUTPUT}`;

export function getHumanspecCoachSkillTemplate(): SkillTemplate {
  return {
    name: 'humanspec-coach',
    description: 'Coach the learner through implementation with hints and diagnosis (no code writes)',
    instructions: CONTENT,
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
    content: CONTENT,
  };
}
