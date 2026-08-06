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
 * `humanspec-init` creates the initial documents after the project-local CLI
 * bootstrap. Later HumanSpec workflows may refresh them within their declared
 * write boundaries and with the learner's explicit confirmation.
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
personal reflections. After the project-local bootstrap, \`humanspec-init\`
creates the initial documents. Later HumanSpec workflows may refresh them only
within their declared write boundaries and with explicit learner confirmation;
treat missing documents as "not yet initialized" rather than assuming their
content.`;

/**
 * The shared initialization contract. The skill and command surfaces compose
 * this block verbatim so their document paths, structure, ownership, safe
 * repeat-run behavior, and readiness rules cannot drift apart.
 */
export const HUMANSPEC_INITIALIZATION_GUIDANCE = `**HumanSpec initialization contract**

Initialization is a project-local conversation that runs after
\`openspec init --profile humanspec\` has bootstrapped the profile and generated
the workflow surfaces. It creates or explicitly preserves the initial HumanSpec
project context; it does not create an implementation change.

**Registered documents and required structure**

Use the existing named HumanSpec project-document registry
(\`PROJECT_DOC_TEMPLATES\`, \`getProjectDocTemplate\`,
\`resolveProjectDocPath\`, and \`detectHumanSpecDocType\`) as the source of
truth. Resolve each destination from the current project root with the
platform-aware path helpers (\`path.join()\`/\`path.resolve()\`) and use only
these registered destinations:

- \`openspec/project.md\`: preserve the \`humanspec-project\` marker and the
  sections \`# 项目目标\`, \`# 目标用户\`, \`# 技术栈\`, \`# 约束\`, and
  \`# 完成标准\`.
- \`openspec/roadmap.md\`: preserve the \`humanspec-roadmap\` marker and the
  \`# 里程碑\`, \`## 里程碑 1\`, and \`# 候选切片\` sections. Candidate entries
  must remain parseable as \`- [ ] slice: <change-name> — <learning focus>\`.
- \`openspec/learner.md\`: preserve the \`humanspec-learner\` marker and the
  \`# 已有经验\`, \`# 学习目标\`, \`# 单次时间预算\`, \`# 提示偏好\`,
  \`# 已暴露的知识缺口\`, \`# 已掌握内容\`, and \`# 建议复习项\` sections. Keep
  the machine-readable records parseable as \`- [ ] gap: <description>\`,
  \`- [ ] mastered: <topic>\`, and \`- [ ] review: <topic>\`.

Retain the registered frontmatter and required headings when rendering. Do not
invent alternate \`.yaml\`/\`.yml\` document destinations or create duplicate
platform-specific paths.

**Ownership and deferred values**

The learner owns the project facts, learner profile, milestone priority, and
final document content. AI may draft and explain the proposal, but must not
invent personal experience, learning goals, time availability, or hint
preferences. If a value is unknown or the learner chooses to defer it, record
an explicit placeholder such as \`[deferred: learner to decide]\` in the
appropriate section and list it as unresolved for later review.

Initialization may write only the three project-planning documents above (and
the CLI bootstrap's \`openspec/config.yaml\`). Application source files and
test implementation files remain learner-owned and outside this workflow's
write boundary. Never run \`openspec new change\`, create a change directory,
or write a change artifact during initialization.

**Pre-write document classification**

Before drafting or writing, resolve and read all three registered paths and
classify each document as one of the following:

- **missing** — the path does not exist; it may be created after confirmation.
- **valid HumanSpec** — the registered marker and required section/list grammar
  are present; preserve it unless an explicit update is confirmed.
- **malformed/invalid HumanSpec** — a HumanSpec marker or intended template is
  present but its frontmatter, required headings, or parseable records are
  malformed; show the repair proposal and treat it as blocked until confirmed.
- **unmarked user content** — a file exists without the registered marker; it is
  a conflict, never permission to overwrite. Ask the learner to preserve it,
  explicitly convert it, or stop.

If only one or two documents are present, report the project as **partial** and
offer to create only the missing documents. A valid existing document is not
rewritten merely because initialization is being repeated.

**Preview, confirmation, and preservation**

Ask the project and learner questions first, then render a proposal from the
registered template structure. On a repeat run, preserve learner-authored
content and every value not supplied in the current answers. Show a per-document
preview that labels each action as create, update, preserve, convert, or
blocked, including the relevant proposed differences for existing files.

Require explicit learner confirmation for every affected create, update, or
conversion before writing anything. If the learner rejects an update or
conversion, leave that file byte-for-byte unchanged, report it as preserved,
and do not claim that the context was fully refreshed. Preserve an unmarked file
only when the learner chooses that option; it remains an unresolved blocker
until it is explicitly converted or replaced by the learner.

**Post-write readiness**

Re-read every destination after confirmed writes. Use the registered marker
detection and check the required headings and parseable list grammars. Report
the resolved paths for all three documents, each document's final state, the
learner's ownership of application and test implementation, and every
unresolved blocker with a concrete next action. Recommend \`/humanspec:next\`
only when all three documents are valid HumanSpec documents and the learner has
confirmed the result.

This initialization contract does not implement or claim adaptive routing,
reflection gates, learning-history updates, or learning-aware archive behavior.
Those later workflow behaviors remain outside this initialization change.`;

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
  'humanspec-init': `Write boundary: this workflow writes project planning documents only: the three
HumanSpec documents under openspec/ and the CLI bootstrap's openspec/config.yaml.
It does not write application source, test implementation, or change artifacts.`,
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
