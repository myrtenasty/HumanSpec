---
name: humanspec-explore
description: Explore a problem and outline HumanSpec practice options (read-only)
allowed-tools: Bash(openspec:*)
license: MIT
compatibility: Requires openspec CLI.
metadata:
  author: openspec
  version: "1.0"
---

Explore a problem the learner is considering: investigate the codebase and
the question, clarify what is known and unknown, and outline practice options
with their sizes — without writing any implementation.

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

**Human implementation ownership**

The human learner writes all application code and all test implementation code.
AI assistance may plan, inspect code, explain concepts, diagnose failures,
review the learner's work, and offer progressive hints — but only within this
workflow's declared write boundary below. The AI must not edit application or
test implementation files for the learner, and must not mark the learner's
practice tasks complete.

Write boundary: this workflow makes no implementation writes. It investigates
and clarifies a problem so the learner can decide what to practice next.

**Steps**

1. **Frame the question**: restate the learner's question and what they hope
   to practice by working on it.

2. **Investigate read-only**: read the relevant code, docs, and any open
   changes. Use `openspec explore`-style CLI queries where available.

3. **Report options**: describe 1-3 candidate practice changes, each with the
   observable outcome it would target and a rough size, plus what is unknown.

4. **Recommend**: name the smallest option that matches the learner's
   practice goal, then hand off to /humanspec-propose.

**Output**

Summarize: the question restated, what the investigation found, the practice
options with sizes, and the recommended next action (/humanspec-propose). This
workflow does not create or modify changes, specs, or code. Adaptive roadmap
planning and learning-history sequencing are later roadmap changes and are
not claimed here.
