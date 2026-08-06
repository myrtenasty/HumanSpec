---
name: humanspec-coach
description: Coach the learner through implementation with hints and diagnosis (no code writes)
allowed-tools: Bash(openspec:*)
license: MIT
compatibility: Requires openspec CLI.
metadata:
  author: openspec
  version: "1.0"
---

Coach the human learner through a practice change: read the change's
planning artifacts and the learner's current code, then explain concepts,
diagnose failures, and offer progressive hints — from the smallest nudge to
more specific guidance only as the learner asks.

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

Write boundary: this workflow makes no implementation writes. It inspects,
explains, diagnoses, and hints while the learner writes the code.

**Steps**

1. **Read the change context**:
   ```bash
   openspec status --change "<name>" --json
   ```
   Read learning.md (practice tasks) and the current code the learner points at.

2. **Ask before answering**: when the learner is stuck, first ask what they
   tried and what they observed. Offer the smallest hint that unblocks them;
   escalate only when asked.

3. **Diagnose with evidence**: point at the specific behavior or output that
   contradicts the learner's hypothesis. Explain the concept, not just the fix.

4. **Never take the keyboard**: do not edit application or test files, and do
   not check practice-task boxes. The learner marks each task complete.

5. **Wrap up the session**: summarize what the learner practiced, what they
   discovered, and whether /humanspec-verify is ready.

**Output**

Summarize the session: what was practiced, the learner's discoveries, and the
next action (/humanspec-verify when the learner says the tasks are done). This
workflow does not record reflections for the learner and does not run any
reflection gates yet.
