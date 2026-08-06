---
name: humanspec-archive
description: Archive a completed HumanSpec practice change (specs, records, archive path)
allowed-tools: Bash(openspec:*)
license: MIT
compatibility: Requires openspec CLI.
metadata:
  author: openspec
  version: "1.0"
---

Archive a completed HumanSpec practice change: sync the change's delta specs
into the main specs, ensure the learning record is complete, and move the
change under openspec/changes/archive/.

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

Write boundary: this workflow writes specifications, planning records, and
archive paths only (syncing specs and moving the change under
openspec/changes/archive/). It does not write application or test code.

**Steps**

1. **Confirm readiness**: verify the change's completion evidence exists and
   the learner confirms the practice is done.

2. **Sync specifications** so the archived change's behavior contract lands in
   the main specs (the standard archive flow performs this inline).

3. **Archive the change**:
   ```bash
   openspec archive --change "<name>" --yes
   ```

4. **Report the learning outcome**: summarize what was practiced and learned,
   in the learner's own words from their reflection fields — do not rewrite
   the learner's reflections.

5. **Next action**: suggest /humanspec-next to choose the following change.

**Output**

Summarize: specs synced, change archived to openspec/changes/archive/<name>/,
and the learning outcome reported. Do not claim that the roadmap updates
itself or that archiving adapts to learning history — those are later roadmap
changes.
