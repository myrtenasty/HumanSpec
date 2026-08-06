/**
 * HumanSpec Shared Template Content
 *
 * One shared rule embedded in every HumanSpec workflow template: the human
 * learner writes the application and test implementation code. AI activity is
 * limited to the workflow's declared planning, explanation, inspection,
 * diagnosis, review, hint, verification-record, or archival responsibility.
 *
 * Each workflow module composes this boundary with its own responsibility and
 * write boundary (see the individual humanspec-*.ts modules).
 */

/**
 * The shared implementation-ownership rule. Embedded verbatim in every
 * HumanSpec skill and command template so generated artifacts stay honest
 * about who writes implementation code.
 */
export const HUMANSPEC_IMPLEMENTATION_BOUNDARY = `**Human implementation ownership**

The human learner writes all application code and all test implementation code.
AI assistance may plan, inspect code, explain concepts, diagnose failures,
review the learner's work, and offer progressive hints — but only within this
workflow's declared write boundary below. The AI must not edit application or
test implementation files for the learner, and must not mark the learner's
practice tasks complete.`;

/**
 * The shared project-context reading convention. Embedded in every HumanSpec
 * skill and command template so all workflows read the project's HumanSpec
 * documents from one defined source instead of hardcoding their own paths.
 *
 * Phrased honestly: the documents exist as registered templates and the
 * workflows consult them when present; generating and refreshing them is the
 * job of later HumanSpec roadmap changes.
 */
export const HUMANSPEC_PROJECT_DOCS = `**Project context documents**

HumanSpec projects keep three living documents under \`openspec/\`:

- \`openspec/project.md\` — the project goal, target users, tech stack,
  constraints, and completion criteria
- \`openspec/roadmap.md\` — milestones and candidate practice slices
- \`openspec/learner.md\` — the learner's experience, learning goals, session
  time budget, hint preference, and knowledge gaps

Read them before planning, proposing, coaching, verifying, or archiving, and
consult the relevant document whenever the learner's context matters. They are
living records: the learner owns their content, and the AI never fabricates
personal reflections. Later HumanSpec roadmap changes will generate and
refresh these documents; until then, treat missing documents as "not yet
initialized" rather than assuming their content.`;

/**
 * Per-workflow write boundaries, matching the initial HumanSpec template
 * contract (see the humanspec-workflow-profile spec):
 *
 * - init: project planning documents
 * - next: routing and guidance only
 * - propose: change planning artifacts
 * - coach: no implementation writes
 * - verify: review output and the reserved AI verification area of learning.md
 * - archive: specifications, planning records, and archive paths
 * - explore: no implementation writes
 */
export const HUMANSPEC_WRITE_BOUNDARIES: Record<string, string> = {
  'humanspec-init': `Write boundary: this workflow writes project planning documents only
(e.g. openspec/config.yaml) and the project's learning setup. It does not write
application or test implementation code.`,
  'humanspec-next': `Write boundary: this workflow provides routing and guidance only. It selects
the next change to work on and guides the learner to it; it does not write
application, test, or planning artifacts for the learner.`,
  'humanspec-propose': `Write boundary: this workflow writes change planning artifacts only
(proposal, specs, learning plan under openspec/changes/<name>/). It does not
write application or test implementation code.`,
  'humanspec-coach': `Write boundary: this workflow makes no implementation writes. It inspects,
explains, diagnoses, and hints while the learner writes the code.`,
  'humanspec-verify': `Write boundary: this workflow writes review output and the reserved AI verification area of learning.md only. It does not edit the
learner's application or test code.`,
  'humanspec-archive': `Write boundary: this workflow writes specifications, planning records, and
archive paths only (syncing specs and moving the change under
openspec/changes/archive/). It does not write application or test code.`,
  'humanspec-explore': `Write boundary: this workflow makes no implementation writes. It investigates
and clarifies a problem so the learner can decide what to practice next.`,
};
