/**
 * HumanSpec Init Workflow Template
 *
 * Initializes the project's HumanSpec learning setup after the external
 * project-local CLI bootstrap, inspects the registered surfaces, conducts the
 * project and learner context conversation, and safely creates or reviews the
 * three HumanSpec project documents.
 */

import type { SkillTemplate, CommandTemplate } from '../types.js';
import {
  HUMANSPEC_IMPLEMENTATION_BOUNDARY,
  HUMANSPEC_INITIALIZATION_GUIDANCE,
  HUMANSPEC_PROJECT_DOCS,
  HUMANSPEC_RESPONSIBILITY_GUIDANCE,
  HUMANSPEC_WRITE_BOUNDARIES,
} from './humanspec-shared.js';
import { STORE_SELECTION_GUIDANCE } from './store-selection.js';

const INLINE_CODE = '`';

const RESPONSIBILITY = `Initialize a HumanSpec project after the external project-local CLI bootstrap.
Inspect the effective HumanSpec profile and registered workflow surfaces, then
conduct a learner-confirmed conversation that creates or safely reviews
project.md, roadmap.md, and learner.md under the project's openspec/ directory.
Keep implementation ownership with the learner, keep initialization
project-local, and never bootstrap or regenerate the profile from this
workflow.`;

const STEPS = `**Steps**

1. **Inspect the external bootstrap prerequisite (read-only)**: confirm the
   project root and inspect the existing project-local
   ${INLINE_CODE}openspec/config.yaml${INLINE_CODE}; do not execute, repeat, simulate, or delegate
   ${INLINE_CODE}openspec init${INLINE_CODE} from inside this workflow. The CLI bootstrap is required
   before this conversation can create project context documents.

   If the config or generated surfaces are missing or inconsistent, stop before
   document planning and every write. Report the observed prerequisite failure
   and show this actionable repair command for the learner to run **outside
   this workflow**:

   ${INLINE_CODE}openspec init --profile humanspec --tools <tool-ids>${INLINE_CODE}

   The learner may instead run ${INLINE_CODE}openspec init${INLINE_CODE} interactively and select the
   HumanSpec profile. Do not replace the external repair with a global
   installation or run it on the learner's behalf.

2. **Validate the effective profile and registered surfaces**: confirm that
   ${INLINE_CODE}openspec/config.yaml${INLINE_CODE} resolves to ${INLINE_CODE}profile: humanspec${INLINE_CODE}, that every
   explicitly registered HumanSpec workflow surface (init, next, propose,
   coach, verify, archive, explore) is present under the selected planning
   home, and that no public ${INLINE_CODE}openspec-apply-change${INLINE_CODE} or
   ${INLINE_CODE}humanspec-apply${INLINE_CODE} surface is exposed. This is read-only prerequisite
   inspection: init must not update config, regenerate skills/commands, or
   repair surfaces. If any check fails, report the exact missing or conflicting
   registration and stop before document planning/writes.

3. **Resolve and classify the project context before writing**: only after
   the bootstrap/profile/surface checks pass, run the public context inspection
   and confirm its planning home contains all three explicitly registered
   document entries. Resolve the current project root and those registered
   document paths using the shared initialization contract. Read every path
   before drafting content.
   Classify each as missing, valid HumanSpec, malformed/invalid HumanSpec, or
   existing unmarked user content. Also report the aggregate project state as
   fresh, partial, or blocked. Do not treat file existence alone as permission
   to replace content.

4. **Interview for project context**: ask the learner for each of these values,
   one group at a time:
   - project goal and target users;
   - technology stack and project constraints;
   - observable completion criteria;
   - learner experience and current learning goals;
   - available session time budget; and
   - preferred coaching and hint style.

   For any value the learner does not know or explicitly defers, record an
   explicit deferred placeholder in the proposed document and in the unresolved
   items, for example ${INLINE_CODE}[deferred: learner to decide]${INLINE_CODE}. Never infer personal
   experience, goals, availability, or preferences.

5. **Propose the first learning direction**: ask the learner to confirm an
   initial milestone direction, expected outcome, learning focus, and observable
   completion evidence. Offer a small set of candidate practice slices for
   confirmation. Each candidate must use the registered roadmap grammar:
   ${INLINE_CODE}- [ ] slice: <change-name> — <learning focus>${INLINE_CODE}. Keep these as proposals
   only. Never run ${INLINE_CODE}openspec new change${INLINE_CODE}, create
   ${INLINE_CODE}openspec/changes/<name>/${INLINE_CODE}, or otherwise create a change directory during
   initialization.

6. **Render a proposed document set**: use the registered project-document
   templates, markers, headings, and list grammars. Put project facts in
   ${INLINE_CODE}project.md${INLINE_CODE}, the confirmed milestone and candidate slices in
   ${INLINE_CODE}roadmap.md${INLINE_CODE}, and learner context in ${INLINE_CODE}learner.md${INLINE_CODE}. Preserve every
   existing section and every value not supplied in this run. For a valid
   existing document, propose no update unless the learner has supplied a new
   value or explicitly requested a refresh. For malformed or unmarked files,
   show the repair or conversion proposal instead of silently replacing them.

7. **Preview and confirm before any write**: show a per-document table with the
   resolved path, current state, proposed action (create, update, preserve,
   convert, or blocked), and relevant differences. Ask for explicit learner
   confirmation for each affected create, update, or conversion. A bare summary
   or an inferred consent is not enough. If the learner rejects an update or
   conversion, leave that file byte-for-byte unchanged, report it as preserved,
   and continue without claiming a fully refreshed context.

8. **Write only the confirmed planning documents**: after confirmation, write
   only the affected registered project documents. Never write the external CLI
   bootstrap's ${INLINE_CODE}openspec/config.yaml${INLINE_CODE}, generated skills or commands, application
   source, test implementation files, or change artifacts. Preserve rejected files and
   preserve unmarked files when the learner chooses the preserve option. If an
   unmarked file is encountered, explicitly offer preserve, convert, or stop;
   conversion or replacement always requires confirmation.

9. **Re-read and report readiness**: re-read all three paths, verify the
   registered frontmatter markers, required headings, and parseable roadmap and
   learner entries. Report each resolved document path, its final state, the
   learner's responsibility for application and test implementation, and every
   unresolved blocker with a concrete next action. Report the project as ready
   and recommend ${INLINE_CODE}/humanspec:next${INLINE_CODE} only when all three documents are valid
   HumanSpec documents and the learner has confirmed the result.`;

const OUTPUT = `**Output**

Summarize the prerequisite inspection (config location, effective profile,
explicitly registered generated tool surfaces, and public-apply absence)
separately from the document result. If it fails, output
\`bootstrap-not-ready\`, the observed failure, the external repair command, and the explicit statement
that no config, generated surface, or project planning document was written.
List the resolved paths for
${INLINE_CODE}openspec/project.md${INLINE_CODE}, ${INLINE_CODE}openspec/roadmap.md${INLINE_CODE}, and ${INLINE_CODE}openspec/learner.md${INLINE_CODE},
their states (created, preserved, updated, converted, or blocked), and any
unresolved values or file blockers. State that the learner writes application
and test implementation files. Recommend ${INLINE_CODE}/humanspec:next${INLINE_CODE} only for a valid,
confirmed ready context.

Report the responsibility handoff explicitly: init owns project-context
inspection and confirmed document creation/review; next owns routing; propose
owns planning artifacts; coach owns progressive assistance; verify owns
software/learning assessment; and archive owns canonical synchronization and
confirmed feedback reconciliation. Do not claim that a sibling workflow is
unavailable merely because init does not perform its responsibility. Init does
not create changes or write implementation code.`;

const CONTENT = `${RESPONSIBILITY}

${STORE_SELECTION_GUIDANCE}

${HUMANSPEC_PROJECT_DOCS}

${HUMANSPEC_RESPONSIBILITY_GUIDANCE}

${HUMANSPEC_IMPLEMENTATION_BOUNDARY}

${HUMANSPEC_WRITE_BOUNDARIES['humanspec-init']}

${HUMANSPEC_INITIALIZATION_GUIDANCE}

${STEPS}

${OUTPUT}`;

export function getHumanspecInitSkillTemplate(): SkillTemplate {
  return {
    name: 'humanspec-init',
    description: 'Initialize a HumanSpec project with the human-owned implementation workflow profile',
    instructions: CONTENT,
    license: 'MIT',
    compatibility: 'Requires openspec CLI.',
    metadata: { author: 'openspec', version: '1.0' },
  };
}

export function getHumanspecInitCommandTemplate(): CommandTemplate {
  return {
    name: 'HUMANSPEC: Init',
    description: 'Initialize a HumanSpec project (human-owned implementation workflows)',
    category: 'Workflow',
    tags: ['workflow', 'humanspec', 'init'],
    content: CONTENT,
  };
}
