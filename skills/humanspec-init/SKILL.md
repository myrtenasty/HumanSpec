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

Initialize a HumanSpec project: set up the openspec/ planning structure, persist
the project's workflow profile (openspec/config.yaml), and generate the
HumanSpec workflow skills/commands for the selected AI tools.

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
personal reflections. Later HumanSpec roadmap changes will generate and
refresh these documents; until then, treat missing documents as "not yet
initialized" rather than assuming their content.

**Human implementation ownership**

The human learner writes all application code and all test implementation code.
AI assistance may plan, inspect code, explain concepts, diagnose failures,
review the learner's work, and offer progressive hints — but only within this
workflow's declared write boundary below. The AI must not edit application or
test implementation files for the learner, and must not mark the learner's
practice tasks complete.

Write boundary: this workflow writes project planning documents only
(e.g. openspec/config.yaml) and the project's learning setup. It does not write
application or test implementation code.

**Steps**

1. **Resolve the project intent**: confirm the project directory, the human
   learner's practice goal, and the tools to configure. Run:

   ```bash
   openspec init --profile humanspec --tools <tool-ids>
   ```

   (or run `openspec init` interactively and select the HumanSpec profile).

2. **Verify the setup**: confirm that `openspec/config.yaml` records
   `profile: humanspec` and that the generated skill directories are
   `humanspec-<action>` (init, next, propose, coach, verify, archive,
   explore) with no `openspec-apply-change` skill.

3. **Hand over to the learner**: point the learner at /humanspec-next to pick
   the first practice change.

**Output**

Summarize what was initialized: the config location, the effective profile,
the generated tool surfaces, and the first suggested action
(`/humanspec-next`). Do not claim that learner-profile generation or
roadmap creation exists yet — those are later HumanSpec roadmap changes.
