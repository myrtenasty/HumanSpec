## 1. Establish the shared initialization contract

- [ ] 1.1 Update the shared HumanSpec project-context guidance to state that `humanspec-init` creates the initial documents and later workflows may refresh them.
- [ ] 1.2 Add one named, reusable initialization-guidance block for document paths, required sections, ownership, deferred values, and the missing/partial/valid/unmarked document states.
- [ ] 1.3 Compose the shared initialization guidance into both the `humanspec-init` skill and command templates without maintaining divergent copies.

## 2. Implement the HumanSpec initialization workflow

- [ ] 2.1 Replace the current bootstrap-only `humanspec-init` responsibility and steps with a project-local conversation that runs after `openspec init --profile humanspec`.
- [ ] 2.2 Add the project and learner interview fields, including an explicit defer path that records placeholders instead of inventing personal information.
- [ ] 2.3 Add the confirmed initial milestone and candidate practice-slice flow using the registered roadmap grammar, without creating change directories or invoking a change-creation workflow.
- [ ] 2.4 Add pre-write document classification using the existing named project-document registry and HumanSpec marker detection for missing, partial, valid, malformed, and unmarked files.
- [ ] 2.5 Add the preview-and-confirm protocol that preserves existing content, requires explicit confirmation for updates or conversions, and leaves rejected files unchanged.
- [ ] 2.6 Add post-write readiness checks and output that list the three document paths, state learner implementation ownership, identify unresolved blockers, and recommend `/humanspec:next` only when the context is ready.
- [ ] 2.7 Ensure the generated workflow does not claim adaptive routing, reflection gates, learning-aware archive behavior, or any implementation-code writes.

## 3. Add workflow and document-contract tests

- [ ] 3.1 Extend HumanSpec template tests to verify both generated surfaces contain the same initialization sequence, confirmation gate, ownership boundary, and honest later-behavior disclaimer.
- [ ] 3.2 Add fresh-project contract coverage for collecting context, proposing a milestone and slices, creating all three marked documents, and handing off to `/humanspec:next`.
- [ ] 3.3 Add partial-project contract coverage proving missing documents are identified and existing marked documents are preserved unless explicitly updated.
- [ ] 3.4 Add repeat-initialization coverage proving rejected updates preserve existing content and unmarked documents require an explicit resolution choice.
- [ ] 3.5 Add roadmap and learner-format assertions proving generated initialization guidance retains parseable slice, gap, mastered, and review entry grammars and never creates a change directory.
- [ ] 3.6 Add cross-platform path tests using `path.join()` or `path.resolve()` for all three document destinations and Windows-valid expectations.

## 4. Regenerate and validate the change

- [ ] 4.1 Regenerate committed HumanSpec skill output and any parity/hash artifacts from the updated templates, confirming the generated init skill and command remain aligned.
- [ ] 4.2 Run focused HumanSpec template, project-document, legacy-cleanup, profile-parity, and initialization contract tests.
- [ ] 4.3 Verify the path-sensitive initialization and generated-output tests in Windows CI while retaining macOS and Linux coverage.
- [ ] 4.4 Run lint, build, the full `pnpm test` suite, and `openspec validate --strict` for the completed change.
