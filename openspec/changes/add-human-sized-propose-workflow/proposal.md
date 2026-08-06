## Why

The `humanspec-propose` workflow is currently a registered planning surface, but it does not yet turn project context, learner constraints, and roadmap slices into a reliably human-sized practice change. Without that contract, a learner can receive an oversized change, an unfocused learning plan, or multiple changes at once, leaving the later coach, verify, and routing workflows without a stable unit of practice.

Stages 1–3 already provide the `human-learning` schema, HumanSpec profile, project documents, and initialization handoff. This change establishes the next boundary: converting that context into one confirmed, appropriately sized practice change without taking implementation ownership from the learner.

## What Changes

- Upgrade `humanspec-propose` from a basic planning prompt into a context-aware workflow that reads the registered `project.md`, `roadmap.md`, and `learner.md` documents.
- Derive one observable outcome, one primary learning goal, and no more than two supporting concepts for the proposed change.
- Size two to five independently verifiable practice tasks against the learner's configured session budget.
- Detect requests that are too large or contain independent outcomes, present candidate slices, and create only one learner-confirmed change.
- Generate the `human-learning` planning artifacts: `proposal.md`, applicable delta specs (or an explicit `skip_specs` declaration), and `learning.md`.
- Require the learner to complete the learning artifact's “before practice” section before handing the change to implementation or coaching.
- Preserve the HumanSpec ownership boundary: the workflow may write planning artifacts only and must not write application or test implementation files or mark practice tasks complete.
- Add generated-surface parity and workflow-contract coverage for the skill and command forms, including cross-platform path behavior.
- Keep adaptive `humanspec-next`, progressive coaching, learning-aware verification, and learning-aware archive feedback outside this change.

## Capabilities

### New Capabilities

- `humanspec-propose-workflow`: Turn initialized HumanSpec project and learner context into one confirmed, human-sized `human-learning` practice change.

### Modified Capabilities

None. The existing `human-learning` schema and HumanSpec profile contracts remain the underlying interfaces; this change adds the behavior that consumes them.

## Impact

- HumanSpec workflow templates and their generated skill/command projections, especially `src/core/templates/workflows/humanspec-propose.ts`.
- HumanSpec template, generated-output parity, and workflow contract tests.
- The existing `human-learning` schema and project-document registry are consumed but their core artifact graph and path semantics remain unchanged.
- No changes to application implementation ownership, the internal `openspec instructions apply` protocol, or unrelated OpenSpec profiles are intended.
