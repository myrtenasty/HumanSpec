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

Initialize a HumanSpec project: run the project-local openspec bootstrap,
confirm the HumanSpec workflow profile, then conduct a learner-confirmed
conversation that creates or safely reviews project.md, roadmap.md, and
learner.md under the project's openspec/ directory. Keep implementation
ownership with the learner and keep initialization project-local.

**Store selection:** If the user names a store (a store is a standalone OpenSpec repo registered on this machine) or the work lives in one, run `openspec store list --json` to discover registered store ids, then pass `--store <id>` on the commands that read or write specs and changes (`new change`, `status`, `instructions`, `list`, `show`, `validate`, `archive`, `doctor`, `context`, `view`). Other commands do not take the flag. Hints printed by commands already carry the flag; keep it on follow-ups. Without a store, commands act on the nearest local `openspec/` root.

**Project context documents**

HumanSpec projects keep three living documents under `openspec/`:

- `openspec/project.md` — the project goal, target users, tech stack,
  constraints, and completion criteria
- `openspec/roadmap.md` — milestones and candidate practice slices
- `openspec/learner.md` — the learner's experience, learning goals, session
  time budget, hint preference, and knowledge gaps

Read them before planning, proposing, coaching, verifying, or archiving, and
consult the relevant document whenever the learner's context matters. They are
living records: the learner owns their content, and the AI never fabricates
personal reflections. After the project-local bootstrap, `humanspec-init`
creates the initial documents. Later HumanSpec workflows may refresh them only
within their declared write boundaries and with explicit learner confirmation;
treat missing documents as "not yet initialized" rather than assuming their
content.

**Human implementation ownership**

The human learner writes all application code and all test implementation code.
AI assistance may plan, inspect code, explain concepts, diagnose failures,
review the learner's work, and offer progressive hints — but only within this
workflow's declared write boundary below. The AI must not edit application or
test implementation files for the learner, and must not mark the learner's
practice tasks complete.

Write boundary: this workflow writes project planning documents only: the three
HumanSpec documents under openspec/ and the CLI bootstrap's openspec/config.yaml.
It does not write application source, test implementation, or change artifacts.

**HumanSpec initialization contract**

Initialization is a project-local conversation that runs after
`openspec init --profile humanspec` has bootstrapped the profile and generated
the workflow surfaces. It creates or explicitly preserves the initial HumanSpec
project context; it does not create an implementation change.

**Registered documents and required structure**

Use the existing named HumanSpec project-document registry
(`PROJECT_DOC_TEMPLATES`, `getProjectDocTemplate`,
`resolveProjectDocPath`, and `detectHumanSpecDocType`) as the source of
truth. Resolve each destination from the current project root with the
platform-aware path helpers (`path.join()`/`path.resolve()`) and use only
these registered destinations:

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

Initialization may write only the three project-planning documents above (and
the CLI bootstrap's `openspec/config.yaml`). Application source files and
test implementation files remain learner-owned and outside this workflow's
write boundary. Never run `openspec new change`, create a change directory,
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
unresolved blocker with a concrete next action. Recommend `/humanspec-next`
only when all three documents are valid HumanSpec documents and the learner has
confirmed the result.

This initialization contract does not implement or claim adaptive routing,
reflection gates, learning-history updates, or learning-aware archive behavior.
Those later workflow behaviors remain outside this initialization change.

**Steps**

1. **Bootstrap the project-local profile**: confirm the project directory and
   the AI tools to configure, then run:

   ```bash
   openspec init --profile humanspec --tools <tool-ids>
   ```

   (or run `openspec init` interactively and select the HumanSpec profile).
   This CLI bootstrap is required before this conversation creates project
   context documents. Do not replace it with a global installation.

2. **Verify the bootstrap**: confirm that `openspec/config.yaml` records
   `profile: humanspec` and that the generated skill directories are
   `humanspec-<action>` (init, next, propose, coach, verify, archive,
   explore) with no `openspec-apply-change` skill. If bootstrap failed,
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
   only the affected registered project documents and, when needed, the CLI
   bootstrap's `openspec/config.yaml`. Never write application source,
   test implementation files, or change artifacts. Preserve rejected files and
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

Summarize the bootstrap (config location, effective profile, and generated tool
surfaces) separately from the document result. List the resolved paths for
`openspec/project.md`, `openspec/roadmap.md`, and `openspec/learner.md`,
their states (created, preserved, updated, converted, or blocked), and any
unresolved values or file blockers. State that the learner writes application
and test implementation files. Recommend `/humanspec-next` only for a valid,
confirmed ready context.

Be explicit that this workflow does not claim adaptive routing, reflection
gates, learning-history updates, or learning-aware archive behavior. Those later
HumanSpec roadmap behaviors are not implemented yet. It also does not create
changes or write implementation code; those responsibilities remain outside
initialization.
