## 1. Establish the propose workflow contract

- [x] 1.1 Update the HumanSpec propose workflow source with a single shared sequence for context readiness, goal clarification, sizing, candidate slicing, confirmation, artifact creation, and handoff.
- [x] 1.2 Add explicit handling for missing, malformed, unmarked, or deferred project and learner context, including a concrete initialization or clarification action and a rule against inventing learner facts.
- [x] 1.3 Encode the human-sizing policy as one observable outcome, one primary learning goal, at most two supporting concepts, and two to five independently verifiable tasks within the learner's session budget.
- [x] 1.4 Define the oversized-request flow so independent outcomes or over-budget work become bounded candidate slices and only one learner-confirmed slice can proceed to change creation.
- [x] 1.5 Define the confirmation and before-practice handoff gates, including the behavioral-delta versus `skip_specs` decision and the requirement that the learner fills the pre-practice reflection before implementation or coaching.
- [x] 1.6 Preserve the explicit HumanSpec write boundary so propose writes only named planning artifacts and never application code, test implementation, or learner-completed task checkboxes.

## 2. Integrate generated HumanSpec surfaces

- [x] 2.1 Compose the completed propose contract into both skill and command templates through the existing projection path, keeping their context, sizing, confirmation, handoff, and ownership guidance equivalent.
- [x] 2.2 Regenerate the committed `humanspec-propose` skill output and affected command projections with `pnpm generate:skills`, preserving the existing HumanSpec workflow IDs and profile membership.
- [x] 2.3 Regenerate any repository parity/hash artifacts required by the existing generation workflow and confirm no unrelated workflow output changes.

## 3. Add behavioral-contract and path coverage

- [x] 3.1 Extend HumanSpec template tests to assert the readiness blocker, learner-context ownership, one-outcome sizing limits, task-count limits, candidate-slice flow, confirmation gate, `skip_specs` path, before-practice gate, and implementation write boundary.
- [x] 3.2 Add generated skill/command parity coverage proving both delivery surfaces contain the same propose contract and do not claim adaptive next, learning-aware verify, or learning-aware archive behavior.
- [x] 3.3 Add workflow contract coverage for a request that fits one session, a request that must be split, a non-behavioral practice, and a rejected plan, verifying that the guidance creates at most one confirmed change.
- [x] 3.4 Add cross-platform path coverage for the registered project documents and selected change planning home, using `path.join()` or `path.resolve()` for Windows, macOS, and Linux expectations.

## 4. Verify and close the change

- [x] 4.1 Run focused HumanSpec template, generated-parity, project-document, and workflow contract tests and resolve any generated-surface drift.
- [x] 4.2 Run `pnpm lint`, `pnpm build`, and the full `pnpm test` suite.
- [x] 4.3 Verify the path-sensitive tests and generated output on Windows CI while retaining macOS and Linux coverage.
- [x] 4.4 Run `openspec validate --strict --change add-human-sized-propose-workflow` and review the final diff to confirm the change contains only the Stage 4 propose workflow scope.
