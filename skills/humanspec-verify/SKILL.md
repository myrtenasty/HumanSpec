---
name: humanspec-verify
description: Verify a HumanSpec practice change against its completion evidence
allowed-tools: Bash(openspec:*)
license: MIT
compatibility: Requires openspec CLI.
metadata:
  author: openspec
  version: "1.0"
---

Verify a HumanSpec practice change: check the learner's implementation against
the proposal's completion evidence, run the verification steps the learner
approves, and record the outcome in the reserved AI verification area of
learning.md.

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

Write boundary: this workflow writes review output and the reserved AI verification area of learning.md only. It does not edit the
learner's application or test code.

**Steps**

1. **Read the contract**:
   ```bash
   openspec status --change "<name>" --json
   ```
   Read proposal.md (observable outcome, completion evidence), specs, and
   learning.md (practice tasks, the learner's reflection fields).

2. **Verify evidence**: confirm each practice task the learner marked complete
   has the claimed evidence — a test, a demonstration, or a review trail the
   learner can reproduce. Ask the learner to run anything you cannot run.

3. **Report findings**: state what passes, what fails, and what is
   inconclusive — in the learner's terms, with the specific evidence.

4. **Record the result**: append the verification record to the reserved AI
   verification area of learning.md only. Do not edit the learner's
   reflections, code, or tests.

5. **Next action**: if the change passes, suggest /humanspec-archive; if not,
   route back to /humanspec-coach with the specific gap.

**Output**

Summarize: evidence checked, pass/fail per task, the verification record
written to learning.md, and the next action (/humanspec-archive or
/humanspec-coach). This workflow does not gate archiving on learning
reflection quality yet — that gate belongs to a later roadmap change.
