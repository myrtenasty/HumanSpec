---
name: humanspec-next
description: Route the learner to the next HumanSpec practice change
allowed-tools: Bash(openspec:*)
license: MIT
compatibility: Requires openspec CLI.
metadata:
  author: openspec
  version: "1.0"
---

Route the learner to the next HumanSpec practice change: inspect the active
changes under openspec/changes/, identify the one change the learner should
work on next, and guide them to it.

**Store selection:** If the user names a store (a store is a standalone OpenSpec repo registered on this machine) or the work lives in one, run `openspec store list --json` to discover registered store ids, then pass `--store <id>` on the commands that read or write specs and changes (`new change`, `status`, `instructions`, `list`, `show`, `validate`, `archive`, `doctor`, `context`, `view`). Other commands do not take the flag. Hints printed by commands already carry the flag; keep it on follow-ups. Without a store, commands act on the nearest local `openspec/` root.

**Human implementation ownership**

The human learner writes all application code and all test implementation code.
AI assistance may plan, inspect code, explain concepts, diagnose failures,
review the learner's work, and offer progressive hints — but only within this
workflow's declared write boundary below. The AI must not edit application or
test implementation files for the learner, and must not mark the learner's
practice tasks complete.

Write boundary: this workflow provides routing and guidance only. It selects
the next change to work on and guides the learner to it; it does not write
application, test, or planning artifacts for the learner.

**Steps**

1. **List the current changes**:
   ```bash
   openspec list --json
   ```

2. **Choose the next change**: prefer the single active change the learner is
   already working on; otherwise pick the smallest open change that fits the
   learner's practice goal.

3. **Guide the learner**: state which change to work on and why, then point to
   /humanspec-coach (while implementing) or /humanspec-propose (to start a new
   change). Do not create, edit, or delete change artifacts yourself.

**Output**

Name the chosen change, the reason in one line, and the next action
(/humanspec-coach or /humanspec-propose). This workflow provides routing and
guidance only — it does not adapt the roadmap or re-sequence changes based on
learning history yet.
