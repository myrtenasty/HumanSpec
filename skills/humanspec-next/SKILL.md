---
name: humanspec-next
description: Route the learner to one deterministic next HumanSpec action
allowed-tools: Bash(openspec:*)
license: MIT
compatibility: Requires openspec CLI.
metadata:
  author: openspec
  version: "1.0"
---

Resolve one reliable next HumanSpec action from the project's structured
context and the selected change's lifecycle state, including post-archive
feedback reconciliation. Read the registered project documents and OpenSpec
JSON outputs, make uncertainty visible, and report one bounded handoff while
preserving the learner's ownership of implementation and learning evidence.

**Store selection:** If the user names a store (a store is a standalone OpenSpec repo registered on this machine) or the work lives in one, run `openspec store list --json` to discover registered store ids, then pass `--store <id>` on the commands that read or write specs and changes (`new change`, `status`, `instructions`, `list`, `show`, `validate`, `archive`, `doctor`, `context`, `view`, `humanspec context inspect`, `humanspec context next`, `humanspec context feedback-plan`, `humanspec context feedback-apply`, `humanspec context feedback-reconcile`). Other commands do not take the flag. Hints printed by commands already carry the flag; keep it on follow-ups. Without a store, commands act on the nearest local `openspec/` root.

**Project context documents**

HumanSpec projects keep three living documents under `openspec/`:

- `openspec/project.md` — the project goal, target users, tech stack,
  constraints, and completion criteria
- `openspec/roadmap.md` — milestones and candidate practice slices
- `openspec/learner.md` — the learner's experience, learning goals, session
  time budget, hint preference, and knowledge gaps

Before any workflow needs project context, run
`openspec humanspec context inspect --json` (and preserve a selected
`--store <id>`). Its versioned envelope is the public source of truth: read
`planningHome`, then each `data.documents` entry's logical id, resolved
path, classification, marker/template version, template, and issues. The
roadmap keeps candidate slices under `# 候选切片` as
`- [ ] slice: <change-name> — <learning focus>`; archive creates
`# 已归档切片` records as `- [x] archived: <change-name> — <outcome>
(feedback: pending|complete)`. Learner feedback uses only the registered
`gap:`, `mastered:`, and `review:` records in their named sections.

Read them before planning, proposing, coaching, verifying, or archiving, and
consult the relevant document whenever the learner's context matters. They are
living records: the learner owns their content, and the AI never fabricates
personal reflections. After the project-local bootstrap, `humanspec-init`
creates the initial documents. Later HumanSpec workflows may refresh them only
within their declared write boundaries and with explicit learner confirmation;
treat missing documents as "not yet initialized" rather than assuming their
content.

**HumanSpec responsibility and handoffs**

- **init** creates or reviews the three project-context documents after the external bootstrap prerequisite is ready, then hands off to **next**.
- **next** routes one deterministic next action from structured project, roadmap, learner, and change state; it does not perform the handoff automatically.
- **propose** turns one learner-confirmed slice into planning artifacts and gates the before-practice handoff.
- **coach** assists the learner with evidence-first explanations and progressive hints while the learner writes implementation and test code.
- **verify** assesses software and learning evidence, records the latest bounded verification result, and hands off a passing result to **archive**.
- **archive** synchronizes the confirmed change and reconciles explicitly confirmed roadmap and learner feedback, then hands back to **next**.

Each handoff is a learner-facing recommendation with one next action; no
workflow claims responsibility owned by a sibling workflow.

**Human implementation ownership**

The human learner writes all application code and all test implementation code.
AI assistance may plan, inspect code, explain concepts, diagnose failures,
review the learner's work, and offer progressive hints — but only within this
workflow's declared write boundary below. The AI must not edit application or
test implementation files for the learner, and must not mark the learner's
practice tasks complete.

Write boundary: this workflow provides routing and bounded planning guidance. It
may continue the existing artifact-authoring protocol for one explicitly
resolved planning artifact at its concrete output path, after re-checking
structured status. It never writes application or test implementation, learner
task checkboxes, learner reflections, verification records, roadmap updates, or
adaptive archive feedback.

**Steps**

**Shared HumanSpec change-sizing contract (v1)**

Evaluate every candidate against every criterion below and retain the criterion
ID with the learner-facing evidence. This is contextual judgment, not a
numeric score: never use file counts, line counts, fixed weights, or a hidden
threshold to decide fit.

- [outcome] **One observable outcome:** Name one user or downstream-system behavior that can be observed when the slice is complete.\n- [goals-concepts] **One goal and supporting concepts:** Choose one primary learning goal and no more than two supporting concepts.\n- [tasks] **Independently verifiable tasks:** Plan two to five dependency-ordered tasks that are independently understandable and verifiable; do not add filler to reach the range.\n- [evidence] **One completion evidence:** State one clear completion evidence that demonstrates the observable outcome rather than a vague sense of completion.\n- [budget] **Configured session budget:** Fit the complete practice and evidence plan, not only implementation, within the learner's configured session budget.\n- [platforms] **Framework and infrastructure load:** Identify whether the slice introduces multiple independent frameworks, infrastructure components, or business capabilities; split those into independently verifiable slices.\n- [unfamiliar-concepts] **Unfamiliar prerequisite concepts:** Identify multiple unfamiliar core concepts required before the first task and reduce or sequence them when they would overload this learner.\n- [whole-system-scope] **Whole-module or whole-system scope:** Reject wording such as completing an entire module or system when it cannot be narrowed to one independently observable behavior.\n- [learner-experience] **Learner experience:** Use the learner's recorded experience and goals to choose a meaningful slice; never infer personal experience or substitute a generic level.\n- [cognitive-load] **Cognitive load:** Consider the combined novelty, dependencies, ambiguity, and design effort for this learner instead of using file counts, line counts, or a numeric score.\n- [roadmap-impact] **Roadmap learning-path impact:** For a request outside the confirmed roadmap, report whether accepting it preserves, interrupts, replaces, or extends the active learning path before confirmation.

A candidate is **fit** only when the evidence supports every applicable
criterion. If any criterion is violated or the evidence is missing, classify it
as **oversized or unresolved**, explain the context, and refine the slice before
creating or selecting it.

**Shared fit/oversized report**

Use this exact report shape for a candidate:
- **Classification:** `fit` or `oversized` (field: `classification`; never call a candidate fitting without the evidence)
- **Context:** project goal, active milestone, learner experience/goals, session budget, and request source (field: `context`)
- **Criterion evidence:** one concise observation for each shared criterion ID (field: `criterion-evidence`)
- **Violated criteria:** the IDs that make the candidate oversized or unresolved, or `none` (field: `violated-criteria`)
- **Completion evidence:** the one observable check that will prove the outcome (field: `completion-evidence`)
- **Roadmap impact:** `preserve`, `interrupt`, `replace`, or `extend` the confirmed learning path (or `not-applicable` for an existing confirmed slice; field: `roadmap-impact`)
- **Learner decision / next action:** confirm this slice, refine it, or choose a bounded alternative (field: `next-action`); never silently select or create an oversized candidate

Do not replace this report with a numeric score, file-count rule, or generic
fit label. The learner must be able to see which context or criterion changed
if propose and next ever produce different classifications.

For roadmap impact, the choices are preserve, interrupt, replace, or extend;
use not-applicable only when the request is already a confirmed slice.

1. **Resolve the selected planning root and project context first**: follow the
   store-selection rules above, then run
   `openspec humanspec context inspect --json` with the same selected-root or
   store flags. Its versioned envelope reports the planning home and every
   registered document's resolved path, classification, marker/template version,
   and parse issues. If inspection is ready, run
   `openspec humanspec context next --json`. Its public result distinguishes
   `blocked`, `reconciliation`, `ready`, and `empty`, and returns the
   parsed candidates, archived changes, pending feedback, active milestone
   details, typed learner records, and an explicit empty reason code used for
   that decision. Do not reconstruct those results with package-internal
   helpers or a directory scan.

   If any document is missing, malformed, unmarked, or unresolved, stop before
   selecting a change. Report the affected logical document id and resolved
   path, the evidence for the readiness blocker, and one concrete repair or
   clarification. Hand off to `/humanspec-init` for initialization issues or
   ask the learner to preserve, convert, or stop for unmarked content. Do not
   choose a change from incomplete project context.

2. **Collect structured change state**: run the following read-only lookups for
   the resolved root (preserving any selected-root or store flags):

   `openspec list --json`

   For each candidate that may be resumed, run
   `openspec status --change "<name>" --json`. Read the returned
   `schemaName`, `planningHome`, `changeRoot`, `actionContext`,
   and `artifactPaths` as structured state; do not replace them with a
   directory scan. After one change is explicitly selected, run
   `openspec instructions apply --change "<name>" --json` and read every
   concrete path returned under `contextFiles`. Use its `state`,
   `progress`, `tasks`, `tracks`, and `instruction` fields to
   identify the practice state. When an artifact is the next planning step,
   obtain its id from the status artifact graph and run
   `openspec instructions <artifact-id> --change "<name>" --json`; use its
   `resolvedOutputPath`, dependencies, and authoritative `instruction`
   rather than guessing a filename. The apply `context` is required
   project instruction input and `operationGuidance` is advisory; keep
   both separate from status, task progress, evidence, and blockers.

3. **Apply the fixed precedence, with ambiguity as an overlay**. Evaluate
   these states in exactly this order:

   1. project context is missing, malformed, unmarked, or unresolved;
   2. more than one active change can be resumed, or structured status,
      artifact files, learning evidence, or validation results conflict;
   3. an archived outcome has `feedback: pending` reconciliation;
   4. no active change has a confirmed roadmap slice;
   5. the selected change has a next uncompleted planning artifact;
   6. planning is complete and a learner-owned practice task remains;
   7. practice tasks are complete but a required learner reflection remains;
   8. learner evidence is ready but verification is absent, failed, or blocked;
   9. verification has a passing disposition and archive is the next handoff.

   Do not let a later passing result hide an earlier missing prerequisite. A
   pending archived outcome is checked before selecting any new candidate. A
   paused change is resumed at the first unresolved state only after the
   learner explicitly selects it.

4. **Resolve pending feedback, no-change, and ambiguous states without guessing**:

   - With no active change, use the `reconciliation` result from
     `openspec humanspec context next --json` to identify the pending archived
     change. Run `openspec humanspec context feedback-reconcile --change "<name>" --json`
     for that one change, preserving selected-root or store flags. Do not select
     a roadmap candidate or re-propose the archived change until reconciliation
     is complete.
   - For a `ready` result, use only its returned parseable candidate slices,
     archived-change exclusion, and learner records. Evaluate each remaining
     candidate against every criterion in the shared sizing block and render
     the complete fit/oversized report with criterion IDs and evidence. Name
     one remaining slice only when its classification is `fit`, explain its
     fit using the returned active milestone and durable `mastered:`, `gap:`,
     and `review:` records, and hand off the unchanged candidate identity to
     `/humanspec-propose`. If more than one candidate remains plausible,
     present the bounded alternatives with their reports and require the
     learner to select one; never silently choose. Preserve propose's explicit
     confirmation gate: never run
     `openspec new change`, create a change directory, or create artifacts
     from this route without that confirmation.
   - If any candidate is `oversized` or `unresolved` under the shared
     contract, do not describe it as fitting or select it silently. Show the
     violated criterion IDs and route to learner-confirmed refinement or propose
     splitting into smaller slices. Do not create the oversized
     candidate, update the roadmap, or choose a replacement without the
     learner's explicit decision.
   - For an `empty` result with `no-confirmed-candidate`, report that the
     roadmap intentionally has no confirmed candidate after archive or learner
     rejection. Invite the learner to explore or explicitly propose a direction,
     but do not re-propose the archived change, invent a new direction, write a
     placeholder, or create a change.
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
     `resolvedOutputPath`; never write a glob, infer a path, or recreate a
     completed artifact. Re-read status afterward and report a race as already
     complete. If the apply instruction is `blocked`, report the missing
     artifact and use the existing artifact-authoring workflow instead of
     advancing to practice. If all required planning artifacts are complete,
     continue to the next state rather than recreating one.
   - **Practice**: when planning is complete and apply `progress.remaining`
     is positive, name the first learner task whose `done` value is false.
     Route to `/humanspec-coach` when help is wanted, or state the task as
     the learner's next action. Never mark its checkbox, rewrite its wording,
     or edit application or test implementation.
   - **Reflection**: after all practice tasks are complete, inspect the
     learner-owned reflection sections in the registered learning artifact,
     including `## 开始前`, `## 卡住时的记录`, and `## 完成后` when
     required by the learning contract. Template comments, empty sections,
     and a partial stuck record without an attempted approach, observation,
     hypothesis, and requested hint are not learner evidence. Ask for the one
     named missing reflection section; do not route to verify or archive and do
     not fill, summarize, or rewrite it.
   - **Verification**: once practice and required reflections contain
     substantive learner evidence, inspect the latest verification disposition
     from the learning artifact and review output. If verification is absent
     and evidence is ready, route to `/humanspec-verify`. If it is failed,
     inconclusive, or reports a blocking inconsistency, name that blocker and
     route to `/humanspec-coach` for another learner attempt (or to verify
     when the evidence is ready for a retry). Do not infer a pass from a file
     existing or from an unrelated passing test.
   - **Archive**: only an explicit passing verification disposition reaches
     this state. Route to `/humanspec-archive`; do not execute archive and
     do not claim that the roadmap, learner feedback, or adaptive archive
     records have already been updated.
   - **Post-archive feedback**: a confirmed `feedback: pending` record is a
     reconciliation prerequisite, not an empty roadmap and not a new change.
     The archive workflow must confirm the roadmap and learner records before
     next may explain or select a later candidate.

6. **Keep repeated routing and ownership boundaries explicit**: every
   invocation re-reads the structured state before deciding. Repeated runs with
   no state change return the same selected change, normalized state, evidence,
   blocker, and one next action. They do not create duplicate changes,
   artifacts, tasks, reflections, verification records, or implementation edits
   or feedback records. A pending archived outcome always routes to the same
   reconciliation target until its record changes to `feedback: complete`.
   Next never writes application or test implementation, learner task
   checkboxes, learner reflections, verification records, roadmap updates, or
   adaptive archive feedback. Its only possible write is the one concrete
   planning artifact explicitly authorized by the current artifact instruction;
   if that boundary is not explicit, remain read-only and hand off.

7. **Produce a stable routing report** with exactly one recommended action:

   - **Project**: resolved root and readiness of `project`, `roadmap`, and
     `learner`;
   - **Selected change**: one name, or `none` when context is not ready, a
     choice is required, or the roadmap handoff is selected;
   - **Normalized state**: one of `project-not-ready`,
     `choice-required`, `reconciliation`, `roadmap-propose`,
     `planning`, `practice`, `reflection`, `verify`, or `archive`;
   - **Recommended next action**: exactly one registered HumanSpec handoff or
     one named artifact-authoring action;
   - **Reason**: one short explanation tied to the precedence;
   - **Evidence**: the commands, registered paths, active milestone, candidate
     fit, typed learner records, status fields, progress, reflection result, or
     verification result used for the decision;
   - **Blockers**: `none` or the concrete unresolved/conflicting evidence;
   - **Ownership boundary**: state what next may guide or write and what
     remains learner-owned.

   Report an explicit no-selection result for readiness and ambiguity blockers.
   Next remains read-only for roadmap and learner feedback: it may report the
   confirmed post-archive state and route reconciliation, but only
   `humanspec-archive` applies those explicitly confirmed records. Do not
   claim roadmap mutation, learner-history updates, adaptive routing, or
   completed feedback before archive confirms it.

**Output**

Return the stable routing report described in step 7. It must identify the
resolved project context, selected change or explicit no-selection result,
normalized state, exactly one recommended next action, the short reason,
evidence, blockers, and ownership boundary. For a planning handoff, include
the one artifact id and concrete resolved output path. For a learner handoff,
name the task or reflection section and the registered HumanSpec action
(`/humanspec-init`, `/humanspec-propose`, `/humanspec-coach`,
`/humanspec-verify`, or `/humanspec-archive`). For reconciliation,
include the exact archived change and pending document; for a later candidate,
include the shared fit/oversized report, archived-slice exclusion, and the
updated milestone/mastered/gap/review evidence used for the fit. If a
candidate is oversized or unresolved, include its violated criterion IDs and
the learner-confirmed refinement or split action instead of selecting it.
