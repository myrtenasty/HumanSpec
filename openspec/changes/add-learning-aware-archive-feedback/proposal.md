## Why

HumanSpec can now guide a learner through initialization, a bounded practice change, coaching, verification, and routing to archive, but the learning loop stops at that handoff. The existing archive surface can sync specifications and move a change, yet it does not turn the completed change's verified learning evidence into an updated roadmap and learner history. This is the next missing product capability because the following `humanspec-next` invocation must be able to choose from the learner's new state rather than repeat the previous plan.

## What Changes

- Add a learning-aware `humanspec-archive` workflow that selects exactly one change, checks its structured state, and requires a passing HumanSpec verification result before archiving by default.
- Require complete learner-owned practice evidence and reflections, while preserving the learner's task checkboxes and reflection text.
- Reuse the existing archive operation for validation, delta-spec synchronization, and moving the change into `openspec/changes/archive/`; do not create a second archive mechanism.
- After a successful archive, show a preview and obtain explicit learner confirmation before updating the registered `roadmap.md` and `learner.md` documents.
- Record the archived slice and milestone outcome in the roadmap, and record verified mastered topics, knowledge gaps, and suggested review items in the learner document without fabricating personal reflections.
- Make feedback updates safe to retry: preserve unrelated learner-authored content, detect already-applied records, and report conflicts instead of silently overwriting them.
- Leave creation of the next change to a later explicit `humanspec-next`/`humanspec-propose` action; archive must not auto-create a change.
- Update generated archive guidance and routing contracts so they describe the implemented feedback behavior without weakening the human implementation boundary.
- Add cross-platform and end-to-end coverage for verification gates, archive failure/retry, feedback confirmation, and the next-slice handoff on Windows, macOS, and Linux.

## Capabilities

### New Capabilities

- `humanspec-archive-feedback`: Gate HumanSpec archival on verified learning evidence, synchronize and archive the completed change, and safely feed its outcome into the roadmap and learner records.

### Modified Capabilities

- `humanspec-next-router`: Require the next routing experience to consume the post-archive roadmap and learner state so it does not repeat an archived slice and can explain the next candidate's fit.
- `humanspec-workflow-profile`: Update the profile's generated archive contract now that learning-aware archive feedback is an implemented responsibility rather than a deferred behavior.

## Impact

- HumanSpec workflow templates and generated skill/command parity for `humanspec-archive` and the related `humanspec-next` handoff.
- Project-document parsing and safe update helpers for `openspec/roadmap.md` and `openspec/learner.md`.
- Integration with the existing archive command, structured status/instruction outputs, verification record, spec synchronization, and archive paths.
- New unit, template, integration, and cross-platform tests; no application or test implementation files in a learner's project are edited by the workflow.
