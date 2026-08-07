/**
 * HumanSpec Next Workflow Template
 *
 * Resolves one deterministic next action from the HumanSpec project and
 * learning state. The workflow routes and gives bounded planning guidance;
 * the learner owns implementation, practice records, and reflections.
 */

import type { SkillTemplate, CommandTemplate } from '../types.js';
import {
  HUMANSPEC_IMPLEMENTATION_BOUNDARY,
  HUMANSPEC_PROJECT_DOCS,
  HUMANSPEC_WRITE_BOUNDARIES,
} from './humanspec-shared.js';
import { STORE_SELECTION_GUIDANCE } from './store-selection.js';

const RESPONSIBILITY = `Resolve one reliable next HumanSpec action from the project's structured
context and the selected change's lifecycle state. Read the registered project
documents and OpenSpec JSON outputs, make uncertainty visible, and report one
bounded handoff while preserving the learner's ownership of implementation and
learning evidence.`;

const STEPS = `**Steps**

1. **Resolve the selected planning root and project context first**: follow the
   store-selection rules above. Use the root and planning-home values returned
   by the CLI, and resolve the three registered HumanSpec document destinations
   through \`PROJECT_DOC_TEMPLATES\`, \`getProjectDocTemplate\`,
   \`resolveProjectDocPath\`, and \`detectHumanSpecDocType\`. Build paths with
   \`path.join()\` or \`path.resolve()\`; never concatenate separators or
   infer a second document location. Read the registered \`project\`,
   \`roadmap\`, and \`learner\` documents and classify each as valid
   HumanSpec, missing, malformed/invalid, or unmarked user content. A marker
   alone is not enough: check the registered frontmatter, required headings,
   and parseable roadmap and learner records.

   If any document is missing, malformed, unmarked, or unresolved, stop before
   selecting a change. Report the affected logical document id and resolved
   path, the evidence for the readiness blocker, and one concrete repair or
   clarification. Hand off to \`/humanspec:init\` for initialization issues or
   ask the learner to preserve, convert, or stop for unmarked content. Do not
   choose a change from incomplete project context.

2. **Collect structured change state**: run the following read-only lookups for
   the resolved root (preserving any selected-root or store flags):

   \`openspec list --json\`

   For each candidate that may be resumed, run
   \`openspec status --change "<name>" --json\`. Read the returned
   \`schemaName\`, \`planningHome\`, \`changeRoot\`, \`actionContext\`,
   and \`artifactPaths\` as structured state; do not replace them with a
   directory scan. After one change is explicitly selected, run
   \`openspec instructions apply --change "<name>" --json\` and read every
   concrete path returned under \`contextFiles\`. Use its \`state\`,
   \`progress\`, \`tasks\`, \`tracks\`, and \`instruction\` fields to
   identify the practice state. When an artifact is the next planning step,
   obtain its id from the status artifact graph and run
   \`openspec instructions <artifact-id> --change "<name>" --json\`; use its
   \`resolvedOutputPath\`, dependencies, and authoritative \`instruction\`
   rather than guessing a filename. The apply \`context\` is required
   project instruction input and \`operationGuidance\` is advisory; keep
   both separate from status, task progress, evidence, and blockers.

3. **Apply the fixed precedence, with ambiguity as an overlay**. Evaluate
   these states in exactly this order:

   1. project context is missing, malformed, unmarked, or unresolved;
   2. more than one active change can be resumed, or structured status,
      artifact files, learning evidence, or validation results conflict;
   3. no active change has a confirmed roadmap slice;
   4. the selected change has a next uncompleted planning artifact;
   5. planning is complete and a learner-owned practice task remains;
   6. practice tasks are complete but a required learner reflection remains;
   7. learner evidence is ready but verification is absent, failed, or blocked;
   8. verification has a passing disposition and archive is the next handoff.

   Do not let a later passing result hide an earlier missing prerequisite.
   A paused change is resumed at the first unresolved state only after the
   learner explicitly selects it.

4. **Resolve no-change and ambiguous states without guessing**:

   - With no active change, read the roadmap's parseable candidate slices and
     learner context, name one fitting slice, explain the fit, and hand off to
     \`/humanspec:propose\`. Preserve propose's explicit confirmation gate:
     never run \`openspec new change\`, create a change directory, or create
     artifacts from this route without that confirmation.
   - With multiple resumable changes, show each name, planning progress, first
     unresolved state, and last known evidence. Ask the learner to choose
     exactly one of continue, pause, or return to the roadmap. Never choose the
     first, newest, smallest, or most recently modified change silently, and do
     no routing for an unchosen change.
   - If structured status, artifact contents, learning evidence, or validation
     disagree, report each conflicting source and propose one concrete inspection or
     repair action. Do not delete, overwrite, or silently normalize learner
     files. A failed validation is a blocker, not permission to guess.

5. **Route the selected change through planning, practice, reflection,
   verification, and archive**:

   - **Planning**: if the status artifact graph names a missing artifact,
     identify its artifact id, dependencies, and resolved output location, then
     continue or hand off to that artifact's authoritative instruction. Re-read
     status immediately before any authorized planning write and verify the
     artifact is still missing. A single invocation may guide or create only
     that one explicitly resolved planning artifact, at its concrete
     \`resolvedOutputPath\`; never write a glob, infer a path, or recreate a
     completed artifact. Re-read status afterward and report a race as already
     complete. If the apply instruction is \`blocked\`, report the missing
     artifact and use the existing artifact-authoring workflow instead of
     advancing to practice. If all required planning artifacts are complete,
     continue to the next state rather than recreating one.
   - **Practice**: when planning is complete and apply \`progress.remaining\`
     is positive, name the first learner task whose \`done\` value is false.
     Route to \`/humanspec:coach\` when help is wanted, or state the task as
     the learner's next action. Never mark its checkbox, rewrite its wording,
     or edit application or test implementation.
   - **Reflection**: after all practice tasks are complete, inspect the
     learner-owned reflection sections in the registered learning artifact,
     including \`## 开始前\`, \`## 卡住时的记录\`, and \`## 完成后\` when
     required by the learning contract. Template comments, empty sections,
     and a partial stuck record without an attempted approach, observation,
     hypothesis, and requested hint are not learner evidence. Ask for the one
     named missing reflection section; do not route to verify or archive and do
     not fill, summarize, or rewrite it.
   - **Verification**: once practice and required reflections contain
     substantive learner evidence, inspect the latest verification disposition
     from the learning artifact and review output. If verification is absent
     and evidence is ready, route to \`/humanspec:verify\`. If it is failed,
     inconclusive, or reports a blocking inconsistency, name that blocker and
     route to \`/humanspec:coach\` for another learner attempt (or to verify
     when the evidence is ready for a retry). Do not infer a pass from a file
     existing or from an unrelated passing test.
   - **Archive**: only an explicit passing verification disposition reaches
     this state. Route to \`/humanspec:archive\`; do not execute archive and
     do not claim that the roadmap, learner feedback, or adaptive archive
     records have already been updated.

6. **Keep repeated routing and ownership boundaries explicit**: every
   invocation re-reads the structured state before deciding. Repeated runs with
   no state change return the same selected change, normalized state, evidence,
   blocker, and one next action. They do not create duplicate changes,
   artifacts, tasks, reflections, verification records, or implementation
   edits. Next never writes application or test implementation, learner task
   checkboxes, learner reflections, verification records, roadmap updates, or
   adaptive archive feedback. Its only possible write is the one concrete
   planning artifact explicitly authorized by the current artifact instruction;
   if that boundary is not explicit, remain read-only and hand off.

7. **Produce a stable routing report** with exactly one recommended action:

   - **Project**: resolved root and readiness of \`project\`, \`roadmap\`, and
     \`learner\`;
   - **Selected change**: one name, or \`none\` when context is not ready, a
     choice is required, or the roadmap handoff is selected;
   - **Normalized state**: one of \`project-not-ready\`,
     \`choice-required\`, \`roadmap-propose\`, \`planning\`,
     \`practice\`, \`reflection\`, \`verify\`, or \`archive\`;
   - **Recommended next action**: exactly one registered HumanSpec handoff or
     one named artifact-authoring action;
   - **Reason**: one short explanation tied to the precedence;
   - **Evidence**: the commands, registered paths, status fields, progress,
     reflection result, or verification result used for the decision;
   - **Blockers**: \`none\` or the concrete unresolved/conflicting evidence;
   - **Ownership boundary**: state what next may guide or write and what
     remains learner-owned.

   Report an explicit no-selection result for readiness and ambiguity blockers.
   Do not claim roadmap mutation, learner-history updates, adaptive routing, or
   learning-aware archive behavior; those belong to later workflows.`;

const OUTPUT = `**Output**

Return the stable routing report described in step 7. It must identify the
resolved project context, selected change or explicit no-selection result,
normalized state, exactly one recommended next action, the short reason,
evidence, blockers, and ownership boundary. For a planning handoff, include
the one artifact id and concrete resolved output path. For a learner handoff,
name the task or reflection section and the registered HumanSpec action
(\`/humanspec:init\`, \`/humanspec:propose\`, \`/humanspec:coach\`,
\`/humanspec:verify\`, or \`/humanspec:archive\`).`;

const CONTENT = `${RESPONSIBILITY}

${STORE_SELECTION_GUIDANCE}

${HUMANSPEC_PROJECT_DOCS}

${HUMANSPEC_IMPLEMENTATION_BOUNDARY}

${HUMANSPEC_WRITE_BOUNDARIES['humanspec-next']}

${STEPS}

${OUTPUT}`;

export function getHumanspecNextSkillTemplate(): SkillTemplate {
  return {
    name: 'humanspec-next',
    description: 'Route the learner to one deterministic next HumanSpec action',
    instructions: CONTENT,
    license: 'MIT',
    compatibility: 'Requires openspec CLI.',
    metadata: { author: 'openspec', version: '1.0' },
  };
}

export function getHumanspecNextCommandTemplate(): CommandTemplate {
  return {
    name: 'HUMANSPEC: Next',
    description: 'Route the learner to one deterministic next HumanSpec action',
    category: 'Workflow',
    tags: ['workflow', 'humanspec', 'next'],
    content: CONTENT,
  };
}
