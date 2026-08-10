---
name: humanspec-init
description: Initialize a HumanSpec project with the human-owned implementation workflow profile
allowed-tools: Bash(openspec:*)
license: MIT
compatibility: Requires openspec CLI.
metadata:
  author: openspec
  version: "1.0"
---

Initialize a HumanSpec project after the external project-local CLI bootstrap.
Inspect the effective HumanSpec profile and registered workflow surfaces, then
conduct a learner-confirmed conversation that creates or safely reviews
project.md, roadmap.md, and learner.md under the project's openspec/ directory.
Keep implementation ownership with the learner, keep initialization
project-local, and never bootstrap or regenerate the profile from this
workflow.

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

Write boundary: project planning documents only: this workflow writes only the three
confirmed HumanSpec project planning documents under openspec/. The external CLI bootstrap's config,
registered workflow surfaces, skills, and commands are read-only prerequisites;
this workflow never creates, updates, or regenerates them. It does not write
application source, test implementation, or change artifacts.

**HumanSpec initialization contract**

Initialization is a project-local conversation that runs only after the
external project-local CLI bootstrap has installed the HumanSpec profile and
registered workflow surfaces. It inspects that prerequisite and creates or
explicitly preserves the initial HumanSpec project context; it does not run or
repeat bootstrap and does not create an implementation change.

**Registered documents and required structure**

Run `openspec humanspec context inspect --json` before drafting or writing.
Use its versioned `data.documents` entries as the public source of truth for
each logical document's resolved target path, current classification, and
registered template. Preserve a selected `--store <id>`, and do not infer a
second destination from the caller's current directory:

- `openspec/project.md`: preserve the `humanspec-project` marker and the
  sections `# 项目目标`, `# 目标用户`, `# 技术栈`, `# 约束`, and
  `# 完成标准`.
- `openspec/roadmap.md`: preserve the `humanspec-roadmap` marker and the
  `# 里程碑`, `## 里程碑 1`, and `# 候选切片` sections. Candidate entries
  must remain parseable as `- [ ] slice: <change-name> — <learning focus>`.
- `openspec/learner.md`: preserve the `humanspec-learner` marker and the
  `# 已有经验`, `# 学习目标`, `# 单次时间预算`, `# 提示偏好`,
  `# 已暴露的知识缺口`, `# 已掌握内容`, and `# 建议复习项` sections. Keep
  the machine-readable records parseable as `- [ ] gap: <description>`,
  `- [ ] mastered: <topic>`, and `- [ ] review: <topic>`.

Retain the registered frontmatter and required headings when rendering. Do not
invent alternate `.yaml`/`.yml` document destinations or create duplicate
platform-specific paths.

**Ownership and deferred values**

The learner owns the project facts, learner profile, milestone priority, and
final document content. AI may draft and explain the proposal, but must not
invent personal experience, learning goals, time availability, or hint
preferences. If a value is unknown or the learner chooses to defer it, record
an explicit placeholder such as `[deferred: learner to decide]` in the
appropriate section and list it as unresolved for later review.

Initialization may write only the three confirmed project-planning documents
above. The CLI bootstrap's `openspec/config.yaml` and generated skill/command
surfaces are external prerequisites: init inspects them but never creates,
updates, or regenerates them. Application source files and test implementation
files remain learner-owned and outside this workflow's write boundary. Never
run `openspec new change`, create a change directory, or write a change
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
unresolved blocker with a concrete next action. Recommend `/humanspec-next`
only when all three documents are valid HumanSpec documents and the learner has
confirmed the result.

This initialization contract does not implement or claim adaptive routing,
reflection gates, or learning-history updates. Learning-aware archive feedback
is owned by the separate `humanspec-archive` workflow and is available only
when its verification, preview, confirmation, and retry gates are followed.

**Steps**

1. **Inspect the external bootstrap prerequisite (read-only)**: confirm the
   project root and inspect the existing project-local
   `openspec/config.yaml`; do not execute, repeat, simulate, or delegate
   `openspec init` from inside this workflow. The CLI bootstrap is required
   before this conversation can create project context documents.

   If the config or generated surfaces are missing or inconsistent, stop before
   document planning and every write. Report the observed prerequisite failure
   and show this actionable repair command for the learner to run **outside
   this workflow**:

   `openspec init --profile humanspec --tools <tool-ids>`

   The learner may instead run `openspec init` interactively and select the
   HumanSpec profile. Do not replace the external repair with a global
   installation or run it on the learner's behalf.

2. **Validate the effective profile and registered surfaces**: confirm that
   `openspec/config.yaml` resolves to `profile: humanspec`, that every
   explicitly registered HumanSpec workflow surface (init, next, propose,
   coach, verify, archive, explore) is present under the selected planning
   home, and that no public `openspec-apply-change` or
   `humanspec-apply` surface is exposed. This is read-only prerequisite
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
   items, for example `[deferred: learner to decide]`. Never infer personal
   experience, goals, availability, or preferences.

5. **Propose the first learning direction**: ask the learner to confirm an
   initial milestone direction, expected outcome, learning focus, and observable
   completion evidence. Offer a small set of candidate practice slices for
   confirmation. Each candidate must use the registered roadmap grammar:
   `- [ ] slice: <change-name> — <learning focus>`. Keep these as proposals
   only. Never run `openspec new change`, create
   `openspec/changes/<name>/`, or otherwise create a change directory during
   initialization.

6. **Render a proposed document set**: use the registered project-document
   templates, markers, headings, and list grammars. Put project facts in
   `project.md`, the confirmed milestone and candidate slices in
   `roadmap.md`, and learner context in `learner.md`. Preserve every
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
   bootstrap's `openspec/config.yaml`, generated skills or commands, application
   source, test implementation files, or change artifacts. Preserve rejected files and
   preserve unmarked files when the learner chooses the preserve option. If an
   unmarked file is encountered, explicitly offer preserve, convert, or stop;
   conversion or replacement always requires confirmation.

9. **Re-read and report readiness**: re-read all three paths, verify the
   registered frontmatter markers, required headings, and parseable roadmap and
   learner entries. Report each resolved document path, its final state, the
   learner's responsibility for application and test implementation, and every
   unresolved blocker with a concrete next action. Report the project as ready
   and recommend `/humanspec-next` only when all three documents are valid
   HumanSpec documents and the learner has confirmed the result.

**Output**

Summarize the prerequisite inspection (config location, effective profile,
explicitly registered generated tool surfaces, and public-apply absence)
separately from the document result. If it fails, output
`bootstrap-not-ready`, the observed failure, the external repair command, and the explicit statement
that no config, generated surface, or project planning document was written.
List the resolved paths for
`openspec/project.md`, `openspec/roadmap.md`, and `openspec/learner.md`,
their states (created, preserved, updated, converted, or blocked), and any
unresolved values or file blockers. State that the learner writes application
and test implementation files. Recommend `/humanspec-next` only for a valid,
confirmed ready context.

Report the responsibility handoff explicitly: init owns project-context
inspection and confirmed document creation/review; next owns routing; propose
owns planning artifacts; coach owns progressive assistance; verify owns
software/learning assessment; and archive owns canonical synchronization and
confirmed feedback reconciliation. Do not claim that a sibling workflow is
unavailable merely because init does not perform its responsibility. Init does
not create changes or write implementation code.
