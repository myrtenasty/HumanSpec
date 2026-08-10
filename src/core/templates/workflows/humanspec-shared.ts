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

Before any workflow needs project context, run
\`openspec humanspec context inspect --json\` (and preserve a selected
\`--store <id>\`). Its versioned envelope is the public source of truth: read
\`planningHome\`, then each \`data.documents\` entry's logical id, resolved
path, classification, marker/template version, template, and issues. The
roadmap keeps candidate slices under \`# 候选切片\` as
\`- [ ] slice: <change-name> — <learning focus>\`; archive creates
\`# 已归档切片\` records as \`- [x] archived: <change-name> — <outcome>
(feedback: pending|complete)\`. Learner feedback uses only the registered
\`gap:\`, \`mastered:\`, and \`review:\` records in their named sections.

Read them before planning, proposing, coaching, verifying, or archiving, and
consult the relevant document whenever the learner's context matters. They are
living records: the learner owns their content, and the AI never fabricates
personal reflections. After the project-local bootstrap, \`humanspec-init\`
creates the initial documents. Later HumanSpec workflows may refresh them only
within their declared write boundaries and with explicit learner confirmation;
treat missing documents as "not yet initialized" rather than assuming their
content.`;

/**
 * Stable criteria for deciding whether a HumanSpec practice slice fits the
 * learner and the current learning path. These are deliberately structured
 * data rather than duplicated prose: the IDs are testable and the rendered
 * guidance is shared verbatim by propose and next.
 */
export interface HumanSpecSizingCriterion {
  readonly id: string;
  readonly label: string;
  readonly guidance: string;
}

export const HUMANSPEC_SIZING_CRITERIA = [
  {
    id: 'outcome',
    label: 'One observable outcome',
    guidance: 'Name one user or downstream-system behavior that can be observed when the slice is complete.',
  },
  {
    id: 'goals-concepts',
    label: 'One goal and supporting concepts',
    guidance: 'Choose one primary learning goal and no more than two supporting concepts.',
  },
  {
    id: 'tasks',
    label: 'Independently verifiable tasks',
    guidance: 'Plan two to five dependency-ordered tasks that are independently understandable and verifiable; do not add filler to reach the range.',
  },
  {
    id: 'evidence',
    label: 'One completion evidence',
    guidance: 'State one clear completion evidence that demonstrates the observable outcome rather than a vague sense of completion.',
  },
  {
    id: 'budget',
    label: 'Configured session budget',
    guidance: 'Fit the complete practice and evidence plan, not only implementation, within the learner\'s configured session budget.',
  },
  {
    id: 'platforms',
    label: 'Framework and infrastructure load',
    guidance: 'Identify whether the slice introduces multiple independent frameworks, infrastructure components, or business capabilities; split those into independently verifiable slices.',
  },
  {
    id: 'unfamiliar-concepts',
    label: 'Unfamiliar prerequisite concepts',
    guidance: 'Identify multiple unfamiliar core concepts required before the first task and reduce or sequence them when they would overload this learner.',
  },
  {
    id: 'whole-system-scope',
    label: 'Whole-module or whole-system scope',
    guidance: 'Reject wording such as completing an entire module or system when it cannot be narrowed to one independently observable behavior.',
  },
  {
    id: 'learner-experience',
    label: 'Learner experience',
    guidance: 'Use the learner\'s recorded experience and goals to choose a meaningful slice; never infer personal experience or substitute a generic level.',
  },
  {
    id: 'cognitive-load',
    label: 'Cognitive load',
    guidance: 'Consider the combined novelty, dependencies, ambiguity, and design effort for this learner instead of using file counts, line counts, or a numeric score.',
  },
  {
    id: 'roadmap-impact',
    label: 'Roadmap learning-path impact',
    guidance: 'For a request outside the confirmed roadmap, report whether accepting it preserves, interrupts, replaces, or extends the active learning path before confirmation.',
  },
] as const satisfies readonly HumanSpecSizingCriterion[];

export type HumanSpecSizingCriterionId = (typeof HUMANSPEC_SIZING_CRITERIA)[number]['id'];

export const HUMANSPEC_SIZING_CRITERION_IDS = HUMANSPEC_SIZING_CRITERIA.map(
  ({ id }) => id
) as HumanSpecSizingCriterionId[];

/**
 * Render the shared sizing guidance. Keeping this renderer pure makes the
 * contract easy to test without turning contextual learner judgment into a
 * deterministic size score.
 */
export function renderHumanspecSizingGuidance(
  criteria: readonly HumanSpecSizingCriterion[] = HUMANSPEC_SIZING_CRITERIA
): string {
  const renderedCriteria = criteria
    .map(({ id, label, guidance }) => `- [${id}] **${label}:** ${guidance}`)
    .join('\\n');

  return `**Shared HumanSpec change-sizing contract (v1)**

Evaluate every candidate against every criterion below and retain the criterion
ID with the learner-facing evidence. This is contextual judgment, not a
numeric score: never use file counts, line counts, fixed weights, or a hidden
threshold to decide fit.

${renderedCriteria}

A candidate is **fit** only when the evidence supports every applicable
criterion. If any criterion is violated or the evidence is missing, classify it
as **oversized or unresolved**, explain the context, and refine the slice before
creating or selecting it.`;
}

export const HUMANSPEC_CHANGE_SIZING_GUIDANCE = renderHumanspecSizingGuidance();
// Short aliases keep the shared contract discoverable to template consumers.
export const HUMANSPEC_SIZING_GUIDANCE = HUMANSPEC_CHANGE_SIZING_GUIDANCE;
export const HUMANSPEC_CHANGE_SIZING_CONTRACT = HUMANSPEC_SIZING_CRITERIA;

export type HumanSpecFitClassification = 'fit' | 'oversized';
export type HumanSpecRoadmapImpact = 'preserve' | 'interrupt' | 'replace' | 'extend' | 'not-applicable';

export interface HumanSpecFitReport {
  readonly classification: HumanSpecFitClassification;
  readonly context: string;
  readonly criterionEvidence: Readonly<Partial<Record<HumanSpecSizingCriterionId, string>>>;
  readonly violatedCriteria: readonly HumanSpecSizingCriterionId[];
  readonly completionEvidence: string;
  readonly roadmapImpact: HumanSpecRoadmapImpact;
  readonly nextAction: string;
}

export const HUMANSPEC_FIT_REPORT_FIELDS = [
  'classification',
  'context',
  'criterion-evidence',
  'violated-criteria',
  'completion-evidence',
  'roadmap-impact',
  'next-action',
] as const;

/**
 * The same report shape is embedded in both learner-facing workflows. It
 * makes a fit/oversized decision auditable without making the decision
 * numeric or automatically selecting a candidate.
 */
export function renderHumanspecFitReportGuidance(): string {
  return `**Shared fit/oversized report**

Use this exact report shape for a candidate:
- **Classification:** \`fit\` or \`oversized\` (field: \`classification\`; never call a candidate fitting without the evidence)
- **Context:** project goal, active milestone, learner experience/goals, session budget, and request source (field: \`context\`)
- **Criterion evidence:** one concise observation for each shared criterion ID (field: \`criterion-evidence\`)
- **Violated criteria:** the IDs that make the candidate oversized or unresolved, or \`none\` (field: \`violated-criteria\`)
- **Completion evidence:** the one observable check that will prove the outcome (field: \`completion-evidence\`)
- **Roadmap impact:** \`preserve\`, \`interrupt\`, \`replace\`, or \`extend\` the confirmed learning path (or \`not-applicable\` for an existing confirmed slice; field: \`roadmap-impact\`)
- **Learner decision / next action:** confirm this slice, refine it, or choose a bounded alternative (field: \`next-action\`); never silently select or create an oversized candidate

Do not replace this report with a numeric score, file-count rule, or generic
fit label. The learner must be able to see which context or criterion changed
if propose and next ever produce different classifications.`;
}

export const HUMANSPEC_FIT_REPORT_GUIDANCE = `${renderHumanspecFitReportGuidance()}

For roadmap impact, the choices are preserve, interrupt, replace, or extend;
use not-applicable only when the request is already a confirmed slice.`;

/**
 * Stable responsibility and handoff language shared by the HumanSpec
 * workflows. It describes ownership rather than a historical implementation
 * status, so one workflow cannot imply that another is globally unavailable.
 */
export const HUMANSPEC_RESPONSIBILITY_GUIDANCE = `**HumanSpec responsibility and handoffs**

- **init** creates or reviews the three project-context documents after the external bootstrap prerequisite is ready, then hands off to **next**.
- **next** routes one deterministic next action from structured project, roadmap, learner, and change state; it does not perform the handoff automatically.
- **propose** turns one learner-confirmed slice into planning artifacts and gates the before-practice handoff.
- **coach** assists the learner with evidence-first explanations and progressive hints while the learner writes implementation and test code.
- **verify** assesses software and learning evidence, records the latest bounded verification result, and hands off a passing result to **archive**.
- **archive** synchronizes the confirmed change and reconciles explicitly confirmed roadmap and learner feedback, then hands back to **next**.

Each handoff is a learner-facing recommendation with one next action; no
workflow claims responsibility owned by a sibling workflow.`;

/**
 * Shared coaching evidence language. The coach may explain the record shape,
 * but the learner remains the author of the durable hint-use evidence.
 */
export const HUMANSPEC_HINT_EVIDENCE_GUIDANCE = `**Hint level and learner-owned evidence**

Every substantive coaching response begins with exactly one visible label:
\`Hint level: Level 1\`, \`Hint level: Level 2\`, or \`Hint level: Level 3\`.
Keep these fields distinct:

- **Requested hint level:** the level the learner asked for, if any.
- **Used hint level:** the level of help the learner actually used; only the
  learner records or confirms this after trying the hint.

End the response with a reminder: **Record the hint level actually used in your
own stuck evidence if this becomes part of the episode.** The coach never
writes, edits, or claims that learner evidence, hint-use records, or reflection
text. If asked to update those records, refuse the write and show only the
field shape for the learner to copy and complete themselves.`;

/**
 * Shared verification categories keep human-readable findings aligned with
 * the canonical typed learning-feedback region.
 */
export const HUMANSPEC_VERIFY_REPORT_GUIDANCE = `**Verification finding categories**

Every verification report has three separate categories:

- **Blockers:** evidence-backed failures or missing evidence that prevent the
  requested disposition. Each blocker includes its contract reference,
  observed evidence, consequence, and one bounded learner next step.
- **Suggestions:** non-blocking implementation or review improvements. A
  suggestion never changes a pass/fail gate into a blocker.
- **Follow-up learning:** evidence-grounded concepts to revisit or review
  after this practice. follow-up learning is allowed to be empty; report \`none identified\`
  when the evidence supports no additional learning item and do not invent a
  topic.

Persist only the canonical version-1 typed feedback region in \`## AI 验证记录\`.
Map follow-up learning to supported \`review:\` records, keep \`gap:\` records
for supported gaps, and emit \`mastered:\` only for complete learning evidence.
The categories are distinct from the learner's reflections and from the
software disposition.`;

/**
 * The shared initialization contract. The skill and command surfaces compose
 * this block verbatim so their document paths, structure, ownership, safe
 * repeat-run behavior, and readiness rules cannot drift apart.
 */
export const HUMANSPEC_INITIALIZATION_GUIDANCE = `**HumanSpec initialization contract**

Initialization is a project-local conversation that runs only after the
external project-local CLI bootstrap has installed the HumanSpec profile and
registered workflow surfaces. It inspects that prerequisite and creates or
explicitly preserves the initial HumanSpec project context; it does not run or
repeat bootstrap and does not create an implementation change.

**Registered documents and required structure**

Run \`openspec humanspec context inspect --json\` before drafting or writing.
Use its versioned \`data.documents\` entries as the public source of truth for
each logical document's resolved target path, current classification, and
registered template. Preserve a selected \`--store <id>\`, and do not infer a
second destination from the caller's current directory:

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

Initialization may write only the three confirmed project-planning documents
above. The CLI bootstrap's \`openspec/config.yaml\` and generated skill/command
surfaces are external prerequisites: init inspects them but never creates,
updates, or regenerates them. Application source files and test implementation
files remain learner-owned and outside this workflow's write boundary. Never
run \`openspec new change\`, create a change directory, or write a change
artifact during initialization.

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
reflection gates, or learning-history updates. Learning-aware archive feedback
is owned by the separate \`humanspec-archive\` workflow and is available only
when its verification, preview, confirmation, and retry gates are followed.`;

/**
 * Per-workflow write boundaries, matching the initial HumanSpec template
 * contract (see the humanspec-workflow-profile spec):
 *
 * - init: project planning documents
 * - next: routing and one bounded planning-artifact handoff
 * - propose: change planning artifacts
 * - coach: no implementation writes
 * - verify: review output and the reserved AI verification area of learning.md
 * - archive: specifications, planning records, archive paths, and explicitly
 *   confirmed roadmap and learner feedback records
 * - explore: no implementation writes
 */
export const HUMANSPEC_WRITE_BOUNDARIES: Record<string, string> = {
  'humanspec-init': `Write boundary: project planning documents only: this workflow writes only the three
confirmed HumanSpec project planning documents under openspec/. The external CLI bootstrap's config,
registered workflow surfaces, skills, and commands are read-only prerequisites;
this workflow never creates, updates, or regenerates them. It does not write
application source, test implementation, or change artifacts.`,
  'humanspec-next': `Write boundary: this workflow provides routing and bounded planning guidance. It
may continue the existing artifact-authoring protocol for one explicitly
resolved planning artifact at its concrete output path, after re-checking
structured status. It never writes application or test implementation, learner
task checkboxes, learner reflections, verification records, roadmap updates, or
adaptive archive feedback.`,
  'humanspec-propose': `Write boundary: this workflow writes change planning artifacts only
(proposal, specs, learning plan under openspec/changes/<name>/). It does not
write application or test implementation code.`,
  'humanspec-coach': `Write boundary: this workflow makes no implementation writes. It inspects,
explains, diagnoses, and hints while the learner writes the code.`,
  'humanspec-verify': `Write boundary: this workflow writes review output and the reserved AI verification area of learning.md only. It does not edit the
learner's application or test code.`,
  'humanspec-archive': `Write boundary: this workflow writes specifications, planning records, and
archive paths through the canonical archive operation, plus only the exact
roadmap slice and learner gap/mastered/review records the learner explicitly
confirms after the archive succeeds. It uses atomic same-directory document
replacement and preserves unrelated learner-authored content. It never writes
application or test implementation, learner task checkboxes, or learner
reflection sections.`,
  'humanspec-explore': `Write boundary: this workflow makes no implementation writes. It investigates
and clarifies a problem so the learner can decide what to practice next.`,
};
