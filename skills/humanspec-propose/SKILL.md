---
name: humanspec-propose
description: Propose one confirmed, human-sized HumanSpec practice change
allowed-tools: Bash(openspec:*)
license: MIT
compatibility: Requires openspec CLI.
metadata:
  author: openspec
  version: "1.0"
---

Turn initialized HumanSpec project and learner context into exactly one
learner-confirmed, human-sized practice change. Read the registered project,
roadmap, and learner documents before planning; then create the
human-learning planning artifacts for the confirmed slice. The learner, not
this workflow, implements the application and test code.

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

Write boundary: this workflow writes change planning artifacts only
(proposal, specs, learning plan under openspec/changes/<name>/). It does not
write application or test implementation code.

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

1. **Resolve context before planning**: run
   `openspec humanspec context inspect --json` with the selected-root or
   store flags before asking for or drafting a change. Use its versioned
   `planningHome` and `data.documents` entries as the public source of
   truth for the three registered document targets, classifications, templates,
   and issues; do not infer another `project.md`, `roadmap.md`, or
   `learner.md` destination.

   Classify each path as valid HumanSpec, missing, malformed/invalid, or
   existing unmarked user content. A marker alone is not enough: check the
   registered frontmatter, required headings, and parseable roadmap and learner
   records. If a document or a value required for sizing is missing, malformed,
   unmarked, or still deferred, identify it and give a concrete next action:
   recommend `/humanspec-init` for missing or malformed project setup, ask the
   learner to preserve/convert/stop for unmarked content, or ask the learner to
   supply or explicitly resolve the missing value. Do not create a change while
   a required context blocker remains, and never invent learner experience,
   goals, availability, or preferences.

2. **Clarify one practice outcome**: ask what the learner wants to practice,
   then compare it with the project goal and constraints, the roadmap's
   candidate slices, the learner's learning goals, and the configured session
   budget. Ask the learner to confirm one observable outcome for a user or
   downstream system, one primary learning goal, up to two supporting concepts,
   and the evidence that will demonstrate completion. Treat learner-provided
   answers as authoritative; do not infer personal facts from the project. If
   the request is not represented by the confirmed roadmap, do not reject it
   solely for being new: report whether accepting it would **preserve**,
   **interrupt**, **replace**, or **extend** the active learning path and ask
   for that impact decision before confirmation.

3. **Size the plan explicitly with the shared contract**: evaluate every
   criterion in the shared sizing block above and include its ID and evidence
   in the fit/oversized report. A fit plan still has one outcome, one primary
   learning goal, at most two supporting concepts, two to five independently
   understandable and verifiable practice tasks in dependency order, one clear
   completion evidence, and a complete task set that fits the configured budget.
   Do not add filler tasks; revise the slice when any criterion is unresolved.

4. **Split oversized requests before creating anything**: classify a request as
   oversized or unresolved when any shared criterion is violated, including
   multiple independent outcomes, multiple frameworks or infrastructure
   components, multiple unfamiliar core concepts, whole-module/system wording,
   missing single completion evidence, excessive cognitive load, or a plan over
   the session budget. Show the violated criterion IDs and a bounded set of
   smaller independently verifiable candidate slices. Candidates are conversation-only planning output: do not create a change directory or update the roadmap; do not run `openspec new change` for them. Present a bounded set of candidate slices; ask the learner to select at most one candidate, refine
   the request, or stop; do not proceed
   until one slice is explicitly selected.

5. **Preview and confirm exactly one plan**: before any change command, show a
   preview containing the selected planning-home/root, resolved context paths,
   change name, the shared fit/oversized report, observable outcome, primary
   goal, supporting concepts, session budget, task list with independent
   evidence, scope, roadmap impact, and the behavior-delta decision (delta
   specs or `skip_specs`). Ask for explicit learner confirmation of this one
   plan. A rejection leaves change artifacts unchanged
   and allows revision, another candidate, or stopping. Never infer consent and
   never create more than one change from a single propose conversation.

6. **Create the confirmed human-learning change**: only after confirmation run:
   ```bash
   openspec new change "<name>" --schema human-learning
   ```
   Keep any selected-store flag on this and every supported follow-up command.
   Read the returned planning home and change path; do not assume the nearest
   repository or hardcode a path. Then use `openspec status --change "<name>" --json` and the schema's authoritative artifact instructions to create
   only the confirmed change's planning artifacts.

7. **Choose the schema artifact path honestly**:
   - For a behavioral practice, write `proposal.md`, the applicable
     `specs/**/*.md` delta specifications with observable scenarios, and
     `learning.md` with the confirmed two-to-five unchecked practice tasks.
   - For a non-behavioral practice, set the schema's explicit
     `skip_specs: true` declaration in the change's `.openspec.yaml`, do not
     synthesize or create a delta spec, and write `proposal.md` and
     `learning.md`. Use the schema instructions rather than inventing a
     parallel artifact sequence.

   The selected plan is the only plan that may create artifacts. Keep every
   learner task unchecked (`- [ ]`) and leave the learner's reflection fields
   for the learner. If creation or artifact instructions fail, report the
   concrete error and stop rather than creating a second change or guessing.

8. **Gate the implementation handoff on before-practice reflection**: after
   planning artifacts exist, inspect `learning.md` and the `## 开始前` section.
   If the learner's own pre-practice reflection is empty or still only a
   template comment, identify it as the next required learner action. Do not
   call the plan ready for implementation or coaching, and do not fill the
   reflection yourself. Once the learner has completed that reflection, hand
   off to the human implementation phase and identify `/humanspec-coach` as an
   optional assistance route. This handoff does not mark any practice task
   complete or transfer implementation ownership to AI.

9. **Keep the write boundary visible**: propose may create only the named
   human-learning planning artifacts for the one confirmed change (and the
   schema-required `skip_specs` metadata declaration when applicable). It
   never writes application source files, test implementation files, roadmap or
   learner history, or learner-completed task checkboxes. Do not implement the
   change, run a different implementation workflow, or create additional change
   directories as a side effect.

**Output**

Report the selected planning home, resolved project-document paths and their
readiness, the single confirmed change name, its shared fit/oversized report,
roadmap impact, observable outcome, primary learning goal, supporting concepts,
session budget, task count, completion evidence, and the planning artifacts
written. State whether the change uses behavioral delta specs or the explicit
`skip_specs` path. If the plan was
rejected, oversized, blocked, or awaiting before-practice reflection, report
that state and the learner's concrete next action; do not claim a change was
created or ready when it was not.

After planning, distinguish an empty before-practice reflection from a ready
handoff. Only a learner-completed reflection permits the handoff to human
implementation, with `/humanspec-coach` offered as optional assistance. Do
not claim adaptive `humanspec-next`, learning-aware verification, or
learning-aware archive behavior; those later HumanSpec roadmap workflows are
outside this propose contract.
