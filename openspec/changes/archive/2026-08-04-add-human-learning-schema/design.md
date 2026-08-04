## Context

See `proposal.md` for motivation and scope. Built-in schemas are self-contained directories under `schemas/`; package schema discovery enumerates those directories, and published packages already include the entire `schemas` tree. Task progress is resolved from the artifact selected by `apply.tracks`, then shared by list and archive, while apply instructions separately expose the parsed checklist and progress.

The existing generic machinery therefore supports the intended `learning.md` protocol. This change should add a concrete schema and close product-contract/test gaps instead of introducing a HumanSpec-specific execution path.

## Goals / Non-Goals

**Goals:**

- Represent the HumanSpec artifact sequence and learning contract entirely through the existing schema model.
- Make `learning.md` the single tracked checklist and reflection document for the change.
- Exercise the real built-in schema through artifact status, apply instructions, list, validation, and archive.
- Keep file discovery and assertions portable across Windows, macOS, and Linux.

**Non-Goals:**

- Adding or installing `humanspec-*` skills or commands.
- Adding reflection-completion gates or an AI-owned verification update mechanism.
- Changing `openspec status` to report checkbox progress.
- Migrating workflow registration to the unfinished unified template pipeline.
- Changing the default project schema from `spec-driven`.

## Decisions

### Add a self-contained built-in schema directory

Create `schemas/human-learning/schema.yaml` with co-located `proposal.md`, `spec.md`, and `learning.md` templates. Package discovery already enumerates valid schema directories, and `package.json` already ships the complete `schemas` tree, so no parallel TypeScript registry will be introduced.

Alternative considered: register the schema in a new hardcoded constant. Rejected because it duplicates directory discovery and would create the drift the current resolver avoids.

### Model optional specs through the existing skip protocol

Declare the graph as:

```text
proposal
   │
   ▼
 specs  ── skipped when .openspec.yaml has skip_specs: true
   │
   ▼
learning
```

`learning` will require both `proposal` and `specs`. The existing instruction loader treats a schema-declared specs artifact as satisfied when `skip_specs: true` is valid, preserving one graph for behavioral and non-behavioral learning changes.

Alternative considered: define a second no-spec learning schema. Rejected because it would duplicate templates and split one product concept across two schema names.

### Keep planning instructions and generated templates concise and ownership-aware

The schema instructions will guide artifact authors, while templates will provide the stable document shape:

- `proposal.md`: one observable outcome, explicit scope, constraints, and completion evidence.
- `spec.md`: standard delta operations and testable scenarios when behavior changes.
- `learning.md`: learning contract, human-authored before/during/after reflection, two-to-five practice tasks, and a reserved AI verification section.

The apply instruction will state that the human learner implements application and test code. AI assistance may inspect, explain, diagnose, review, and provide progressive hints, but must not edit those implementation files. This is an instruction-level boundary in this change; removing the user-facing apply workflow belongs to the later HumanSpec profile change.

### Reuse schema-selected task tracking across consumers

Set `apply.requires: [learning]` and `apply.tracks: learning.md`. Apply instructions will parse and return the practice tasks from that file. List and archive will continue using the shared task-progress resolver so they report and gate on the same checkboxes.

The status contract remains artifact-oriented: it reports whether `learning.md` exists and whether dependencies are ready. Checkbox totals remain available from list and apply instructions, and archive uses them for its incomplete-task check.

Alternative considered: add task totals to status JSON. Rejected as unnecessary scope expansion; existing structured interfaces already separate artifact state from practice progress.

### Test the package schema as an integrated product slice

Add focused schema assertions plus CLI-level journeys that create temporary `human-learning` changes and verify:

- package discovery and artifact build order;
- normal and `skip_specs` status transitions;
- task parsing from `learning.md` in apply instructions and list output;
- archive prompting/blocking behavior for incomplete practice tasks and successful archive after completion;
- resolved paths and expected values using Node.js `path.join()` rather than hardcoded separators.

Tests should use the real package schema where practical. Narrow unit fixtures remain appropriate only for malformed or edge-case schema inputs.

## Risks / Trade-offs

- [The generic task tracker may have behavior that was only exercised with synthetic schemas] → Add a real `human-learning` CLI journey spanning all task-progress consumers.
- [The learning template contains fields that later workflows will gate but this change does not enforce] → State that limitation in schema instructions and keep completion-policy enforcement scoped to learning-aware verify/archive changes.
- [The existing apply workflow remains installed and callable] → Put the human-implementation boundary in `apply.instruction`; remove the default apply entry in the later workflow-profile change.
- [A future unified template pipeline may change schema packaging or registration] → Depend only on current directory discovery and keep parity tests so later migration can preserve observable artifacts.

## Migration Plan

This is additive. Existing changes remain bound to their current schemas, and `spec-driven` remains the default. Rollback consists of removing the `human-learning` schema directory and its tests before any project selects it; no persisted data migration is required.
