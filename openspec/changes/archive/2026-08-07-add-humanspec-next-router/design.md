## Context

The existing `humanspec-next` template lists active changes and recommends either `humanspec:coach` or `humanspec:propose`, but it does not inspect the rest of the HumanSpec lifecycle. The repository already exposes structured OpenSpec status and instruction commands, a registered project-document list, and `learning.md` task progress through the `human-learning` schema. See `proposal.md` and `specs/humanspec-next-router/spec.md` for the product contract.

The implementation is a generated workflow contract rather than a new long-running CLI state service. The canonical content in `src/core/templates/workflows/humanspec-next.ts` feeds both the skill and command projections, so both surfaces must remain equivalent.

## Goals / Non-Goals

**Goals:**

- Define a deterministic state precedence from project readiness through archive handoff.
- Use structured OpenSpec output and explicitly registered project-document paths as the state sources.
- Select one change and one next action, while making ambiguity and evidence conflicts visible.
- Support bounded planning progress without taking ownership of application or test implementation.
- Make repeated invocations safe by re-reading state before any authorized planning-artifact write and by never recreating completed artifacts.
- Preserve cross-platform behavior and generated skill/command parity.

**Non-Goals:**

- Building a new runtime state machine or changing the OpenSpec CLI JSON schemas.
- Automatically creating a new change from a roadmap slice without the existing propose confirmation.
- Updating roadmap or learner feedback after archive; that belongs to the later learning-aware archive change.
- Marking practice tasks complete, writing learner reflections, modifying application/test code, or replacing the `human-learning` schema.
- Migrating the workflow to `unify-template-generation-pipeline`.

## Decisions

### 1. Keep the state machine in the canonical workflow template

The workflow will express the state machine as explicit ordered guidance in `humanspec-next.ts`. The generated skill and namespaced command will continue to consume the same content through the existing template registry.

**Why:** The current architecture treats HumanSpec behavior as generated workflow instructions, and parity tests already protect the two delivery surfaces.

**Alternative considered:** Add a new CLI router module. This would provide stronger machine-enforced state transitions, but it would introduce a second runtime contract and is not required for this change's workflow-level behavior.

### 2. Use a fixed precedence with ambiguity as an overlay

The router will evaluate states in this order:

1. project context is missing, malformed, or unresolved;
2. multiple active changes or conflicting evidence require learner choice;
3. no active change requires a roadmap slice and propose handoff;
4. the selected change has a missing planning artifact;
5. practice tasks remain;
6. learner reflection remains incomplete;
7. verify is required or has a blocking result;
8. verify passed and archive is the next handoff.

A paused change is resumed at the first unresolved state after explicit selection. Ambiguity is not treated as an ordinary state: it prevents silent routing until the learner chooses.

**Why:** A stable precedence prevents a passing check in a later phase from masking an earlier missing prerequisite, while the overlay protects against destructive guesses after manual edits.

**Alternative considered:** Select the most recently modified change in every ambiguous case. This is convenient but can resume the wrong learning path and conflicts with the roadmap's explicit-choice requirement.

### 3. Read structured state through existing interfaces

The workflow will use:

- `openspec list --json` for active-change discovery;
- `openspec status --change <name> --json` for artifact state;
- artifact-specific `openspec instructions <artifact> --change <name> --json` for the next planning output;
- `openspec instructions apply --change <name> --json` for the tracked learning path, task progress, and current implementation context; and
- the registered `project.md`, `roadmap.md`, and `learner.md` paths for readiness, candidate slices, and learner constraints.

The router will report the evidence it used. It will not infer state from an arbitrary directory scan or from file names that are not in the existing registries.

**Why:** These interfaces are already the structured source of truth used by the surrounding HumanSpec workflows and behave consistently across platforms.

**Alternative considered:** Parse the planning directory directly. This would duplicate OpenSpec resolution rules and is fragile for custom planning homes, stores, Windows paths, and schema-specific artifacts.

### 4. Bound planning writes to one explicit artifact

For a planning state, `next` may continue the existing artifact-authoring protocol for the one artifact identified by structured status and instructions. It must use the resolved output path, re-check that the artifact is still missing before writing, and re-read status afterward. It never creates a new change directly; the no-change path hands off to `humanspec-propose`, whose confirmation gate remains authoritative.

For practice, reflection, verify, ambiguity, and archive states, `next` only reports or hands off. It does not mark task checkboxes, fill reflections, update verification records, or mutate implementation files.

**Why:** This preserves the single-entry experience while keeping planning writes narrow and learner-owned work untouched.

**Alternative considered:** Make `next` entirely read-only. That would be safer but would leave incomplete artifact planning outside the daily entry point promised by the roadmap. Allowing an unbounded executor would violate the ownership boundary and make idempotency difficult to prove.

### 5. Emit a stable routing report

Every successful routing result will contain the selected project/change (or an explicit no-selection result), the normalized state, exactly one recommended next action, the reason, evidence or blockers, and the ownership boundary. The workflow will use the registered HumanSpec action names for handoffs: `humanspec-init`, `humanspec-propose`, `humanspec-coach`, `humanspec-verify`, and `humanspec-archive`.

**Why:** A stable report makes the natural-language workflow auditable, recoverable after interruption, and testable without coupling tests to incidental prose.

## Risks / Trade-offs

- **[Natural-language state interpretation can still be imperfect]** → Require structured command output, fixed precedence, explicit evidence reporting, and an ambiguity stop rather than guessing.
- **[A planning write can race with a learner or another agent]** → Re-read status immediately before and after the single authorized write; if the artifact now exists, report it as already complete.
- **[Multiple active changes add interaction cost]** → Show compact progress and last-state summaries, then ask for one explicit selection instead of silently choosing by timestamp.
- **[Different planning homes and separators can leak into guidance]** → Use resolved CLI paths and registered names; tests must build expectations with `path.join()`/`path.resolve()` and cover Windows paths.
- **[The router may appear to promise adaptive learning]** → Keep roadmap/learner feedback updates and adaptive archive behavior explicitly out of the contract until the later archive change.

## Migration Plan

1. Replace the current `humanspec-next` step text with the canonical state-precedence, evidence, handoff, and bounded-write contract.
2. Extend focused template and workflow-contract tests, then regenerate the committed skill and command projections.
3. Run parity, cross-platform path, lint, build, full test, and strict OpenSpec validation checks.
4. Existing HumanSpec projects receive the new behavior on their next profile update; their project documents and active changes are not migrated or rewritten.
5. Rollback is a template/projection revert: restore the previous `humanspec-next.ts` content and regenerate the projections. No data migration is required.
