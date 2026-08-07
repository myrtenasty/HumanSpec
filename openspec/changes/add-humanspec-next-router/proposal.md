## Why

HumanSpec now has project initialization, human-sized propose, progressive coach, and learning-aware verify workflows, but `humanspec-next` is still only a guidance template. Learners must manually infer which change, artifact, task, reflection, or verification step comes next, so the workflow does not yet provide the single daily entry point described by the roadmap.

## What Changes

- Turn `humanspec-next` into a state-driven router for one explicit next action.
- Resolve project readiness, active changes, artifact progress, practice-task progress, reflections, and verification state from structured OpenSpec CLI output and the registered project documents.
- Route incomplete planning to the next artifact, ready practice to the next task or coach, completed practice to reflection and verify, and successful verification to archive.
- Handle multiple active changes, ambiguous or manually edited state, failed verification, and interrupted sessions by asking the learner to choose or resume rather than guessing.
- Make repeated runs idempotent: routing must not create duplicate artifacts or changes and must not write application or test implementation code.
- Keep the skill and generated HumanSpec command on one canonical contract with cross-platform path guidance.

## Capabilities

### New Capabilities

- `humanspec-next-router`: Select and explain the next HumanSpec workflow action from the learner's structured project and change state without taking implementation ownership.

### Modified Capabilities

<!-- No existing requirement changes are needed; routing is introduced as a new capability. -->

## Impact

- `src/core/templates/workflows/humanspec-next.ts` and the generated `humanspec-next` skill/command projections.
- HumanSpec template, projection-parity, and workflow-contract tests, including Windows path behavior.
- Existing `openspec list --json`, `status --json`, artifact instructions, apply instructions, and registered project-document contracts are consumed as read-only state sources.
- No changes to application code, learner implementation ownership, the `human-learning` schema, learning-aware verify behavior, adaptive archive feedback, or the upstream template-generation pipeline are included.
