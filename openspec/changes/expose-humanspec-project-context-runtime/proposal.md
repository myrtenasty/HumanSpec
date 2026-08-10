## Why

Installed HumanSpec workflows currently instruct AI tools to call internal TypeScript helpers that are not exposed through the CLI, so the tested project-document logic is not actually available on the installed workflow path. The same boundary is unsafe for writes and incomplete in packed releases because project-document templates are not shipped as runtime assets.

## What Changes

- Add a public, structured HumanSpec project-context CLI runtime for document inspection, registered template/path resolution, next-roadmap context resolution, archive-feedback planning, confirmed application, and reconciliation.
- Reuse the existing project/store root-selection contract for every runtime operation and return stable JSON suitable for generated workflows and black-box tests.
- Make archive-feedback application fail closed: no write occurs without explicit confirmation, and plans carry enough precondition data to reject stale previews rather than overwrite concurrently changed documents.
- Preserve recoverable pending state when a multi-document write is interrupted and expose an idempotent reconciliation operation.
- Ship the three registered HumanSpec project-document templates in `dist` and the packed npm artifact, and resolve template content from packaged runtime assets rather than source-only paths.
- Rewrite generated HumanSpec workflows to invoke only public CLI operations; published workflow bodies must not name internal TypeScript helpers as if they were callable tools.

## Capabilities

### New Capabilities

- `humanspec-project-context-runtime`: Public structured runtime operations that expose deterministic HumanSpec project-document inspection, planning, confirmed mutation, and reconciliation to installed workflows.

### Modified Capabilities

- `humanspec-project-context`: Registered project-document templates and path resolution become packaged runtime behavior rather than source-only helpers.
- `humanspec-archive-feedback`: Feedback application gains an explicit fail-closed confirmation and stale-plan/reconciliation contract through the public runtime.

## Impact

- Affects CLI command registration, completion metadata, root/store selection integration, and stable JSON result/error shapes.
- Affects `src/core/templates/project-docs*`, `src/core/templates/project-doc-feedback.ts`, HumanSpec workflow templates, generated committed skills/commands, build asset copying, and package contents.
- Adds packed-install and CLI black-box coverage for conflicts, CRLF input, stale plans, partial writes, and reconciliation.
- Establishes the runtime dependency used by the later learning-feedback and adaptive-roadmap changes; it does not itself redefine learning evidence or generate new roadmap candidates.
