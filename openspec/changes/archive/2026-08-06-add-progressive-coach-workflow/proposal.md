## Why

The HumanSpec profile already creates a `humanspec-coach` surface, but its current guidance is only a basic read-only checklist. Learners need a predictable way to move from a conceptual explanation to targeted diagnosis without the AI taking over implementation or revealing a complete solution. This is the next missing step after the human-sized propose workflow and is required before the learning-oriented verify loop can be meaningful.

## What Changes

- Define a three-level progressive coaching contract: concept and checking questions, targeted module/data-flow guidance, and limited pseudocode or API-shape guidance.
- Make coaching start from the selected change's current task, learning contract, completion evidence, and learner-reported attempts or observations.
- Allow read-only code and error investigation while preserving the learner's ownership of application and test implementation.
- Prevent the coach from editing application code, test code, learner reflection fields, or practice-task checkboxes.
- Make each coaching response identify its hint level, explain the reasoning behind the guidance, and state the learner's next self-directed action.
- Define interruption and resume behavior so the current task and coaching context are not lost.
- Keep the generated skill and HumanSpec command surfaces behaviorally equivalent, with contract tests covering the safety and progressive-hint rules.

## Capabilities

### New Capabilities

- `humanspec-coach-workflow`: Progressive, read-only coaching for a learner implementing one HumanSpec practice change.

### Modified Capabilities

<!-- No existing requirement changes; the new capability extends the already-registered coach workflow. -->

## Impact

- Updates the HumanSpec coach workflow template and its generated skill/command projections.
- Reuses the existing `human-learning` artifact contract, `learning.md` task/reflection structure, project context documents, and internal `openspec instructions apply --change <name> --json` protocol.
- Adds focused template, parity, and behavioral-contract tests for hint levels, context loading, write boundaries, and interrupted sessions.
- Does not add an application-code writer, public apply workflow, or new implementation runtime; the learner continues to write application and test code.
