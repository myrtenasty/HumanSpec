---
name: humanspec-archive
description: Archive one verified HumanSpec practice change and reconcile learning feedback
allowed-tools: Bash(openspec:*)
license: MIT
compatibility: Requires openspec CLI.
metadata:
  author: openspec
  version: "1.0"
---

Archive exactly one completed HumanSpec practice change and reconcile its
verified learning outcome with the registered roadmap and learner documents.
This workflow gates a normal archive on software and learning evidence, reuses
the canonical OpenSpec archive operation, previews every project-document
feedback record, and never creates the next change.

**Store selection:** If the user names a store (a store is a standalone OpenSpec repo registered on this machine) or the work lives in one, run `openspec store list --json` to discover registered store ids, then pass `--store <id>` on the commands that read or write specs and changes (`new change`, `status`, `instructions`, `list`, `show`, `validate`, `archive`, `doctor`, `context`, `view`). Other commands do not take the flag. Hints printed by commands already carry the flag; keep it on follow-ups. Without a store, commands act on the nearest local `openspec/` root.

**Project context documents**

HumanSpec projects keep three living documents under `openspec/`:

- `openspec/project.md` — the project goal, target users, tech stack,
  constraints, and completion criteria
- `openspec/roadmap.md` — milestones and candidate practice slices
- `openspec/learner.md` — the learner's experience, learning goals, session
  time budget, hint preference, and knowledge gaps

The registered document descriptors are the source of truth for every path and
feedback anchor: `PROJECT_DOC_TEMPLATES`, `getProjectDocTemplate`,
`resolveProjectDocPath`, `detectHumanSpecDocType`, and the registered
archive-feedback descriptors. The roadmap keeps candidate slices under
`# 候选切片` as `- [ ] slice: <change-name> — <learning focus>`; archive
creates `# 已归档切片` records as `- [x] archived: <change-name> — <outcome>
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

**Human implementation ownership**

The human learner writes all application code and all test implementation code.
AI assistance may plan, inspect code, explain concepts, diagnose failures,
review the learner's work, and offer progressive hints — but only within this
workflow's declared write boundary below. The AI must not edit application or
test implementation files for the learner, and must not mark the learner's
practice tasks complete.

Write boundary: this workflow writes specifications, planning records, and
archive paths through the canonical archive operation, plus only the exact
roadmap slice and learner gap/mastered/review records the learner explicitly
confirms after the archive succeeds. It uses atomic same-directory document
replacement and preserves unrelated learner-authored content. It never writes
application or test implementation, learner task checkboxes, or learner
reflection sections.

**Steps**

1. **Resolve exactly one complete practice context before any write**

   If the learner names a change, use that exact name and announce it. If no
   name is supplied, run:

   ```bash
   openspec list --json
   ```

   Select the only active change when exactly one exists; otherwise show every
   candidate and ask the learner to choose one. Never choose by recency,
   directory order, or a historical archive record. For the selected change,
   run the structured lookups below and read every concrete path they return:

   ```bash
   openspec status --change "<name>" --json
   openspec instructions apply --change "<name>" --json
   ```

   Keep `schemaName`, `planningHome`, `changeRoot`, `actionContext`,
   `artifactPaths`, `contextFiles`, `state`, `progress`, `tasks`,
   and `instruction` separate from the optional `context` and
   `operationGuidance`. Treat the latter as required project facts and
   advisory guidance respectively, never as proof that a gate passed. If this
   is a retry for an already archived outcome, resolve the exact archived
   change path and read its archived `learning.md`; do not select an active
   change or invoke canonical archive again.

   Resolve `project`, `roadmap`, and `learner` only through the named
   project-document registry (`PROJECT_DOC_TEMPLATES`,
   `getProjectDocTemplate`, `resolveProjectDocPath`, and
   `detectHumanSpecDocType`). Build every path with `path.join()` or
   `path.resolve()`, including Windows drive-letter roots. Validate the
   registered frontmatter, every required heading, the candidate-slice grammar,
   the archived-record grammar, and the learner record sections. A missing,
   unreadable, malformed, unmarked, duplicated, or ambiguous anchor is an
   exact blocker: report its logical document id, resolved path, line/heading,
   and one repair action. Do not guess a sibling file or write any document.

2. **Apply the normal verification and learning gates**

   Read the latest single verification result in the selected learning
   artifact. A normal archive is ready only when its overall disposition is
   `pass`, its learning-result assessment is `learning complete`, every
   practice task is checked, `## 开始前` and `## 完成后` contain substantive
   learner-authored evidence, every recorded stuck episode has an attempted
   approach, observation, hypothesis, and requested hint, and every required
   software check has sufficient reproducible evidence. Report each missing,
   failed, or inconclusive item by its exact evidence and do not write positive
   mastery, completed-slice, or adaptive records while a gate is incomplete.

   A learner may explicitly choose a **forced archive** despite a reported
   gate failure. Show the exact gates being bypassed, ask for a separate,
   explicit confirmation, and label the outcome `learning incomplete` or
   `learning evidence inconclusive`. Forced archive does not invent a
   reflection, change a learner checkbox, or record mastery for an unverified
   topic. It still uses the canonical archive operation and still requires a
   separate feedback preview confirmation.

3. **Build and show the archive/feedback preview without writing**

   Use the project-document feedback planner to produce one in-memory plan.
   Resolve the exact roadmap candidate by exact change name; remove only that
   line, leave unrelated candidates untouched, and create or reuse the named
   `# 已归档切片` section with exactly one deterministic record:

   ```
   - [x] archived: <change-name> — <outcome> (feedback: pending|complete)
   ```

   Propose learner `gap:`, `mastered:`, and `review:` records only from
   explicit learner evidence and the latest verification record. normalize
   topics for duplicate detection, preserve their original wording, and never
   rewrite `开始前`, `卡住时的记录`, or `完成后`. Show the resolved path,
   exact old/new lines, duplicate/already-applied records, conflicts, line
   ending style, and every preserved unrelated section for both documents.

   Confirmation is separate at both decision points: first confirm the
   permitted archive, then after canonical archive succeeds show the final
   roadmap and learner feedback preview and ask for explicit confirmation.
   A rejected preview leaves the affected document unchanged and keeps the
   feedback loop pending; it is not a completed learning outcome.

4. **Use the canonical archive operation exactly once**

   After the normal or separately confirmed forced gates pass, invoke the
   existing OpenSpec operation in structured non-interactive mode, carrying the
   selected-root/store flags from the earlier lookups:

   ```bash
   openspec archive "<name>" --json --yes
   ```

   This is the canonical OpenSpec operation. Do not implement a second move,
   validation, date naming, or specification synchronization algorithm. The JSON result is the source of truth for the
   archived path and specification outcome. If validation, delta-spec sync, or
   the move fails, report the concrete error and the state that remains active;
   do not touch roadmap or learner documents and do not claim feedback was
   archived. Do not rerun this operation during feedback reconciliation.

5. **Apply confirmed feedback with an explicit pending state**

   Only after the canonical archive succeeds and the learner confirms the
   feedback preview, use per-document atomic same-directory replacement in
   this order:

   - write the roadmap archived record as `feedback: pending`;
   - write only missing learner gap/mastered/review records;
   - replace that exact roadmap record's state with `feedback: complete`.

   Re-read each file before replacement and preserve its detected LF or CRLF
   style. If any write fails, report the archived path, the exact document,
   error, and `feedback: pending`; leave unrelated content unchanged and
   provide the retry reconciliation action. A conflict, malformed structure,
   duplicate record, or ambiguous anchor blocks that document rather than
   overwriting learner-authored content.

6. **Retry reconciliation without repeating archive**

   A later archive-feedback attempt accepts the exact archived change/path,
   re-reads its archived learning outcome and the registered project documents,
   and applies only missing records. It recognizes matching `feedback: pending`
   and `feedback: complete` records, reports already-applied records without
   duplicating them, and surfaces conflicting edits. Reconciliation must never
   rerun specification synchronization, move the change a second time, or
   create a new planning artifact. Route `humanspec-next` to reconciliation
   while any registered feedback remains pending.

7. **Keep the next action explicit and singular**

   When feedback is complete, report exactly one next action through
   `/humanspec-next` or `/humanspec-propose`. When feedback is pending,
   report exactly one reconciliation action. This workflow must never run
   `openspec new change`, create a change directory, or auto-propose the
   next slice.

   workflow.

**Output**

Return a stable archive handoff report with:

- **Selected context:** one change or exact archived outcome, resolved planning
  root, schema, `changeRoot`/archive path, concrete context files, and the
  three registered project-document paths and classifications;
- **Gates:** task progress, reflection/stuck evidence, verification disposition,
  software checks, and every bypass explicitly named for a forced archive;
- **Archive result:** canonical command/result, specification synchronization
  outcome, and final archive path, or the concrete failure with no feedback
  claim;
- **Feedback preview/result:** exact roadmap slice and archived record,
  learner gap/mastered/review records, duplicate/conflict decisions, preserved
  content, LF/CRLF handling, and `pending` or `complete` reconciliation
  state;
- **Ownership boundary:** the human learner owns application code, test
  implementation, task checkboxes, and reflection text; archive may write only
  the canonical specification/archive result and explicitly confirmed
  roadmap/learner feedback records;
- **Next action:** exactly one `/humanspec-archive` reconciliation,
  `/humanspec-next`, or `/humanspec-propose` handoff. Do not create it
  automatically.
