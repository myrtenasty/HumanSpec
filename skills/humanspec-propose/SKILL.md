---
name: humanspec-propose
description: Propose a HumanSpec practice change with proposal, specs, and learning plan
allowed-tools: Bash(openspec:*)
license: MIT
compatibility: Requires openspec CLI.
metadata:
  author: openspec
  version: "1.0"
---

Propose a small HumanSpec practice change: create the change under
openspec/changes/<name>/ with the human-learning schema artifacts — proposal,
optional delta specs, and the learning plan (learning.md) with practice tasks
the human learner will implement.

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

Write boundary: this workflow writes change planning artifacts only
(proposal, specs, learning plan under openspec/changes/<name>/). It does not
write application or test implementation code.

**Steps**

1. **Understand the practice goal**: ask what the learner wants to practice
   (open-ended). Derive one observable outcome and a kebab-case change name.

2. **Create the change**:
   ```bash
   openspec new change "<name>" --schema human-learning
   ```

3. **Create the planning artifacts** by following the schema's artifact
   instructions (`openspec instructions <artifact-id> --change "<name>" --json`):
   - proposal.md: why, observable outcome, scope, constraints, completion evidence
   - specs/**/*.md when behavior contracts change (or skip_specs when they do not)
   - learning.md: one primary learning goal, at most two supporting concepts,
     and two to five practice tasks with checkboxes

4. **Keep the change small**: split before continuing if it needs a long
   design or contains multiple independent outcomes.

5. **Hand over**: tell the learner to implement the practice tasks and to use
   /humanspec-coach while working.

**Output**

Summarize the change: name, observable outcome, artifacts created, and the
first practice task. Do not claim that reflection gates or learning-history
adaptation exist — those are later roadmap changes.
