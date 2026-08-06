/**
 * HumanSpec Init Workflow Template
 *
 * Initializes the project's HumanSpec learning setup: it runs the project-local
 * CLI bootstrap, conducts the project and learner context conversation, and
 * safely creates or reviews the three HumanSpec project documents. It does not
 * implement the later routing, verification, or learning-history behavior.
 */

import type { SkillTemplate, CommandTemplate } from '../types.js';
import {
  HUMANSPEC_IMPLEMENTATION_BOUNDARY,
  HUMANSPEC_INITIALIZATION_GUIDANCE,
  HUMANSPEC_PROJECT_DOCS,
  HUMANSPEC_WRITE_BOUNDARIES,
} from './humanspec-shared.js';
import { STORE_SELECTION_GUIDANCE } from './store-selection.js';

const INLINE_CODE = '`';
const CODE_FENCE = '```';

const RESPONSIBILITY = `Initialize a HumanSpec project: run the project-local openspec bootstrap,
confirm the HumanSpec workflow profile, then conduct a learner-confirmed
conversation that creates or safely reviews project.md, roadmap.md, and
learner.md under the project's openspec/ directory. Keep implementation
ownership with the learner and keep initialization project-local.`;

const STEPS = `**Steps**

1. **Bootstrap the project-local profile**: confirm the project directory and
   the AI tools to configure, then run:

   ${CODE_FENCE}bash
   openspec init --profile humanspec --tools <tool-ids>
   ${CODE_FENCE}

   (or run ${INLINE_CODE}openspec init${INLINE_CODE} interactively and select the HumanSpec profile).
   This CLI bootstrap is required before this conversation creates project
   context documents. Do not replace it with a global installation.

2. **Verify the bootstrap**: confirm that ${INLINE_CODE}openspec/config.yaml${INLINE_CODE} records
   ${INLINE_CODE}profile: humanspec${INLINE_CODE} and that the generated skill directories are
   ${INLINE_CODE}humanspec-<action>${INLINE_CODE} (init, next, propose, coach, verify, archive,
   explore) with no ${INLINE_CODE}openspec-apply-change${INLINE_CODE} skill. If bootstrap failed,
   stop and report the concrete CLI error before discussing document writes.

3. **Resolve and classify the project context before writing**: resolve the
   current project root and the three registered document paths using the
   shared initialization contract. Read every path before drafting content.
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
   only the affected registered project documents and, when needed, the CLI
   bootstrap's ${INLINE_CODE}openspec/config.yaml${INLINE_CODE}. Never write application source,
   test implementation files, or change artifacts. Preserve rejected files and
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

Summarize the bootstrap (config location, effective profile, and generated tool
surfaces) separately from the document result. List the resolved paths for
${INLINE_CODE}openspec/project.md${INLINE_CODE}, ${INLINE_CODE}openspec/roadmap.md${INLINE_CODE}, and ${INLINE_CODE}openspec/learner.md${INLINE_CODE},
their states (created, preserved, updated, converted, or blocked), and any
unresolved values or file blockers. State that the learner writes application
and test implementation files. Recommend ${INLINE_CODE}/humanspec:next${INLINE_CODE} only for a valid,
confirmed ready context.

Be explicit that this workflow does not claim adaptive routing, reflection
gates, learning-history updates, or learning-aware archive behavior. Those later
HumanSpec roadmap behaviors are not implemented yet. It also does not create
changes or write implementation code; those responsibilities remain outside
initialization.`;

const CONTENT = `${RESPONSIBILITY}

${STORE_SELECTION_GUIDANCE}

${HUMANSPEC_PROJECT_DOCS}

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
