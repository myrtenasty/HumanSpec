## Context

The current HumanSpec profile already exposes `humanspec-propose`, but its generated guidance is intentionally a lightweight planning shell. Stages 1–3 provide the `human-learning` schema, the named HumanSpec workflow profile, the registered project-document templates, and the initialization handoff. This design adds the first workflow behavior that consumes those contracts; motivation and scope are in `proposal.md`, and the observable contract is in `specs/humanspec-propose-workflow/spec.md`.

The implementation must preserve the current generated-surface architecture: workflow modules produce both skill and command content, shared HumanSpec constants keep safety language aligned, and the existing OpenSpec artifact/status/instructions protocol remains the source of truth for change creation and task tracking.

## Goals / Non-Goals

**Goals:**

- Make propose read the initialized project, roadmap, and learner context before planning.
- Establish one repeatable sizing policy for a practice change: one observable outcome, one primary learning goal, at most two supporting concepts, and two to five tasks within the learner's session budget.
- Add a preview-and-confirm flow that creates at most one selected change.
- Generate the existing `human-learning` artifact sequence and enforce the before-practice handoff gate in the workflow guidance.
- Keep the skill and command projections behaviorally equivalent and retain cross-platform path guarantees.

**Non-Goals:**

- Implement adaptive routing or a state machine for `humanspec-next`.
- Implement progressive coaching behavior beyond the existing coach workflow contract.
- Implement learning-aware verification, archive gates, roadmap updates, or learner-history feedback.
- Add a new CLI command, schema, artifact type, or implementation-code editing capability.
- Migrate HumanSpec registration to `unify-template-generation-pipeline`.

## Decisions

### Use the existing workflow-template projections

Update the existing HumanSpec propose workflow template and its generated projections rather than adding a new runtime command. The current architecture treats these workflows as generated instructions for supported AI tools, and the product contract is the learner-facing conversation and its write boundary.

**Alternative considered:** add a dedicated Commander.js subcommand. Rejected for this change because it would create a second implementation of an AI-guided conversation and would expand the scope beyond the roadmap's focused workflow increment.

### Use the registered project-document registry

The workflow will refer to the existing named project-document registry and its path/detection helpers as the source of truth for `project.md`, `roadmap.md`, and `learner.md`. It will not introduce a second list of filenames, alternate destinations, or free-form document detection.

This keeps propose aligned with `humanspec-init` and preserves the existing platform-aware path behavior. Tests will derive expected destinations with `path.join()` or `path.resolve()`.

**Alternative considered:** have each generated surface hardcode the three paths. Rejected because it would allow initialization and propose to drift and would violate the established registry contract.

### Keep `human-learning` as the artifact contract

Propose will use the existing `human-learning` schema and its `proposal → specs → learning` graph. A behavior-changing practice creates applicable delta specs; a practice without a behavior contract uses the existing explicit `skip_specs` path. No parallel learning schema or custom task tracker will be introduced.

The workflow will ask for learner confirmation before invoking change creation and will use the schema's own artifact instructions for the final artifact structure rather than duplicating templates in the HumanSpec prompt.

**Alternative considered:** create a HumanSpec-specific change format. Rejected because it would break the completed schema/status/instructions/archive foundation and make downstream workflows handle two artifact contracts.

### Model propose as a guarded conversation

The generated guidance will describe these stages in order:

1. Check document readiness and identify missing or unresolved sizing context.
2. Clarify one practice outcome and inspect the learner's time budget and goals.
3. Draft one plan or bounded candidate slices.
4. Show the selected plan and artifact consequences for explicit confirmation.
5. Create at most one change after confirmation.
6. Require the learner to complete the before-practice section before handoff.

Candidate slices are planning output only. Propose will not create multiple change directories or silently update the roadmap as a side effect.

**Alternative considered:** immediately call `openspec new change` and refine the artifacts afterward. Rejected because it makes oversized or rejected plans observable as unwanted changes and conflicts with the project's explicit confirmation and learner-ownership conventions.

### Keep the sizing policy explicit and bounded

The shared propose contract will state the numeric limits directly so every delivery surface and test can assert the same behavior. Missing or deferred learner budget is treated as a planning blocker that must be supplied or explicitly resolved; the workflow does not invent personal availability or learning goals.

The policy is intentionally small enough to support later coach, verify, and next work without introducing adaptive history prematurely.

**Alternative considered:** let each AI tool choose its own task count and granularity. Rejected because downstream learning evidence would not have a stable shape and behavior would diverge across generated surfaces.

### Test the generated contract at the projection boundary

Tests will assert the source template's responsibilities and that the generated skill and command surfaces contain the same context, sizing, confirmation, handoff, and ownership rules. Existing HumanSpec parity tests remain the registration guard; this change adds propose-specific contract coverage rather than changing unrelated workflow projections.

## Risks / Trade-offs

- **Prompt behavior can vary between AI tools** → Keep the flow and numeric sizing rules in shared, explicit template text and assert parity across generated surfaces.
- **A learner may provide incomplete or deferred context** → Treat required missing values as visible blockers and offer a concrete next action instead of fabricating learner information.
- **Candidate slicing may create roadmap drift** → Keep candidate slices in the conversation and confirmed change plan; do not update roadmap or learner history in this change.
- **A rejected plan may leave partial artifacts** → Make preview and confirmation precede change creation, and limit the write boundary to the named planning artifacts.
- **A non-behavioral practice may accidentally receive a fake spec** → Preserve the schema's explicit `skip_specs` decision and test that no synthetic delta spec is requested for that path.
- **The before-practice gate may be mistaken for verification** → State that it is a learner handoff prerequisite only; reflection quality and verification remain later workflow responsibilities.

## Migration Plan

1. Update the source HumanSpec propose workflow template and its contract tests.
2. Regenerate the committed `humanspec-propose` skill output and all affected command projections using the repository's existing generation path.
3. Run focused HumanSpec template/parity tests, cross-platform path tests, lint, build, and the full test suite.
4. Validate the completed change with `openspec validate --strict`.

Existing `human-learning` changes and the existing HumanSpec profile require no migration. If the generated output is not acceptable, revert the source template and regenerated projections together; no project data migration is needed.
