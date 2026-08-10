## 1. Stack and Roadmap Grammar

- [x] 1.1 Rebase on the public runtime and canonical learning-feedback changes and confirm their public envelopes/record identities are the integration baseline.
- [x] 1.2 Add milestone lifecycle types and exact `status` grammar for planned, active, completed, and paused milestones.
- [x] 1.3 Extend roadmap analysis with zero-or-one active milestone validation, unsupported-status issues, and non-writing legacy inference.
- [x] 1.4 Update the packaged roadmap template so new projects contain one active milestone while preserving the existing candidate-slice grammar.
- [x] 1.5 Add parser/renderer tests for valid transitions, multiple-active blockers, legacy no-status documents, human-edited fields, CRLF, and Windows paths.

## 2. Adaptive Plan Inputs and Validation

- [x] 2.1 Define structured adaptive plan input/output for selected milestone, proposed lifecycle transition, optional candidate, evidence references, and candidate disposition.
- [x] 2.2 Implement allowed milestone-transition validation and require a complete proposed document to retain at most one active milestone.
- [x] 2.3 Validate candidate change names and learning focus while keeping semantic proposal generation outside the deterministic runtime.
- [x] 2.4 Detect existing, archived, duplicate, and conflicting candidate identities without modifying compatible human-authored text.
- [x] 2.5 Add focused tests for confirmed, rejected, not-proposed, duplicate, archived-name, and conflicting-focus candidate cases.

## 3. Archive Feedback Integration

- [x] 3.1 Extend feedback preview to report completed-slice removal, archived outcome, milestone transition, typed learner records, and optional candidate as separate effects.
- [x] 3.2 Allow confirmation to accept archive/milestone/learner effects while explicitly excluding a rejected candidate.
- [x] 3.3 Apply adaptive effects through the fail-closed preconditioned runtime and preserve explicit candidate disposition in the result.
- [x] 3.4 Extend pending state and reconciliation so interrupted milestone/candidate writes replay the same confirmed effects from persisted evidence.
- [x] 3.5 Add idempotency tests proving repeated plan/apply/reconcile does not duplicate archived, learner, milestone, or candidate records.
- [x] 3.6 Assert that every adaptive feedback path creates no active change directory or change artifact.

## 4. Next Context and Workflow Behavior

- [x] 4.1 Extend public next context with active milestone details, confirmed candidates, typed learner records, pending reconciliation, and explicit empty reason codes.
- [x] 4.2 Update archive workflow guidance to derive and explain a semantic milestone/candidate proposal, collect learner choice, and pass only confirmed effects to the runtime.
- [x] 4.3 Update next workflow guidance to prioritize reconciliation, explain candidate fit from durable evidence, and require learner choice when candidates are ambiguous.
- [x] 4.4 Implement the intentionally empty route for rejected/no candidate without re-proposing archived work or inventing a new direction.
- [x] 4.5 Regenerate explicitly registered archive/next skills and commands and update parity/content fixtures.

## 5. Adaptive Loop Verification

- [x] 5.1 Remove manual later-candidate insertion from existing tests and replace it with a confirmed adaptive feedback flow.
- [x] 5.2 Add a one-candidate scenario covering archive, milestone update, learner records, confirmed next candidate, and next's evidence-based explanation context.
- [x] 5.3 Add candidate-rejection and no-proposal scenarios proving an empty roadmap is preserved and reported clearly.
- [x] 5.4 Add ambiguous milestones/candidates, duplicate rerun, interrupted write, and reconciliation scenarios through the public CLI.
- [x] 5.5 Add packed Windows/macOS/Linux fixture coverage for milestone status, candidate grammar, CRLF preservation, and no change creation.
- [x] 5.6 Run targeted tests, full `pnpm test`, `pnpm lint`, `pnpm build`, and package checks before tightening the final workflow prompts.
