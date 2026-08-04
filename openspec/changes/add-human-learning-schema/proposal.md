## Why

HumanSpec needs a schema that turns an OpenSpec change into a small, human-implemented learning exercise while preserving the existing artifact, progress, and archive protocols. The repository already supports schema-selected tracked task files, so the first product slice can add the learning contract and prove that it works end to end without introducing HumanSpec workflows yet.

## What Changes

- Add a built-in `human-learning` schema with the artifact sequence `proposal → specs → learning`.
- Add concise proposal, delta-spec, and `learning.md` templates for a human-owned implementation and reflection loop.
- Allow a `human-learning` change with `skip_specs: true` to advance from proposal directly to learning when no observable behavior changes.
- Track practice-task checkboxes from `learning.md` through list and apply-instructions progress reporting.
- Use the schema-selected tracked artifact when checking task completion during archive.
- Add cross-platform integration coverage proving that schema discovery, artifact status, task reporting, and archive behavior work with `learning.md`.
- Keep HumanSpec workflow generation, coaching, learning-aware verification, project initialization, routing, and archive feedback outside this change.

## Capabilities

### New Capabilities

- `human-learning-schema`: Defines the built-in HumanSpec learning artifact graph, templates, skip-spec behavior, and human-implementation guidance.

### Modified Capabilities

- `cli-list`: Report task progress from the tracked artifact selected by the change schema, including `learning.md`.
- `cli-artifact-workflow`: Return progress and parsed tasks from a schema-selected tracked artifact in apply instructions.
- `cli-archive`: Check incomplete tasks in the schema-selected tracked artifact before archiving.

## Impact

- Adds a new package schema directory and templates under `schemas/`.
- Extends schema, artifact-workflow, list, and archive tests with `human-learning` fixtures and cross-platform path assertions.
- Preserves existing `spec-driven` behavior and the current `openspec status` contract; status continues to report artifact completion rather than checkbox progress.
- Does not depend on `unify-template-generation-pipeline`; registration follows the current built-in schema architecture.
