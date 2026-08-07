## 1. Define the canonical routing contract

- [x] 1.1 Replace the current `humanspec-next` list-and-choose steps in `src/core/templates/workflows/humanspec-next.ts` with the fixed state precedence for project readiness, ambiguity, planning, practice, reflection, verification, and archive handoff.
- [x] 1.2 Add guidance for reading `openspec list --json`, change status, artifact instructions, apply instructions, and the three registered project documents, including the evidence and blocker fields required in the routing report.
- [x] 1.3 Encode the selection and recovery rules for no active change, incomplete artifacts, one or multiple active changes, paused work, manually inconsistent state, failed verification, and a passing verification.
- [x] 1.4 Bound planning progress to the one explicitly resolved artifact for the current step, preserve the propose confirmation gate, and state that next never writes application/test implementation, task checkboxes, learner reflections, or adaptive archive feedback.

## 2. Add workflow contract and state-coverage tests

- [x] 2.1 Add focused `humanspec-next` template tests covering project readiness, no-change roadmap handoff, incomplete planning, practice tasks, reflection, verify, archive, and the stable routing report.
- [x] 2.2 Add ambiguity, interrupted-resume, manual-conflict, and repeated-invocation assertions proving that next asks for an explicit choice and does not duplicate changes, artifacts, or learner-owned records.
- [x] 2.3 Add cross-platform path assertions using the registered project-document and planning-home helpers with `path.join()`/`path.resolve()`, including Windows drive-letter and separator cases.
- [x] 2.4 Extend skill/command projection parity tests to prove the generated `humanspec-next` skill and namespaced command expose the same state machine, handoffs, write boundary, and later-workflow non-goals.

## 3. Regenerate and inspect HumanSpec projections

- [x] 3.1 Run `pnpm generate:skills` and update the committed `humanspec-next` skill and command projections without changing workflow IDs, profile membership, or other HumanSpec surfaces.
- [x] 3.2 Regenerate any existing parity/hash artifacts required by the repository and review the generated diff for unrelated workflow drift.

## 4. Validate the complete change

- [x] 4.1 Run focused next-router, HumanSpec parity, generated-command, and project-document tests, then run `pnpm lint`, `pnpm build`, and the full `pnpm test` suite.
- [x] 4.2 Verify path-sensitive tests and generated output on Windows CI while retaining macOS and Linux coverage.
- [x] 4.3 Run `openspec validate add-humanspec-next-router --type change --strict` and review the final artifact and generated-output diff for scope compliance.
