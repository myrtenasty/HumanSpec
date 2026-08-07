## 1. Register feedback structures and safe document operations

- [ ] 1.1 Extend the HumanSpec project-document registry with named roadmap archive-section, candidate-slice, pending-feedback, and learner record descriptors.
- [ ] 1.2 Implement a project-document feedback planner that resolves registered paths, validates frontmatter and required headings, and reports missing, malformed, unmarked, duplicated, or ambiguous anchors without guessing.
- [ ] 1.3 Implement exact change-name lookup for pending roadmap slices and archived feedback records, preserving unrelated candidates and learner-authored content.
- [ ] 1.4 Implement learner gap/mastered/review record proposal and normalized duplicate detection from learner evidence and the latest verification record without rewriting reflection sections.
- [ ] 1.5 Implement pending-to-complete feedback transitions and per-document atomic replacement with preserved line endings, including an explicit reconciliation result when a write fails.

## 2. Integrate the HumanSpec workflows

- [ ] 2.1 Update `humanspec-archive` skill and command templates with structured context resolution, verification and learning gates, forced-archive warnings, canonical archive invocation, feedback preview/confirmation, and reconciliation output.
- [ ] 2.2 Update the shared HumanSpec write boundary and project-document guidance so archive may write only explicitly confirmed roadmap and learner feedback records while application and test implementation remain learner-owned.
- [ ] 2.3 Update `humanspec-next` templates to detect pending archived feedback, route reconciliation before new work, exclude archived slices from candidates, and explain later candidates using updated learner state.
- [ ] 2.4 Keep HumanSpec workflow registration and generated identities unchanged while updating template exports, descriptors, and any shared constants required by the new archive contract.
- [ ] 2.5 Regenerate managed skills and command surfaces through the existing generation pipeline and ensure both generated surfaces contain equivalent archive and routing guidance.

## 3. Add focused unit and template coverage

- [ ] 3.1 Test project-document classification, registered section resolution, exact slice matching, archive-record creation, learner-record deduplication, conflict reporting, and preservation of unrelated content.
- [ ] 3.2 Test pending and complete feedback transitions, retry reconciliation, already-applied records, atomic-write failures, and no duplicate spec/archive operation.
- [ ] 3.3 Test `humanspec-archive` skill/command content for gates, preview confirmation, forced archive labeling, reconciliation, ownership boundaries, and platform-neutral archive paths.
- [ ] 3.4 Extend `humanspec-next` tests for pending reconciliation, completed feedback consumption, archived-slice exclusion, and repeated routing idempotency.
- [ ] 3.5 Update generated-surface parity, profile, update, cleanup, and command/skill hash tests for the changed shared templates.

## 4. Verify end-to-end behavior

- [ ] 4.1 Add a successful archive journey covering passing verification, canonical spec synchronization, archive movement, confirmed roadmap feedback, confirmed learner records, and the single next-action handoff.
- [ ] 4.2 Add blocking journeys for missing context, incomplete reflection, failed or inconclusive verification, ambiguous changes, and rejected feedback previews; assert no unauthorized writes occur.
- [ ] 4.3 Add forced-archive coverage that records an incomplete or inconclusive learning outcome without inventing mastery or reflections.
- [ ] 4.4 Add interrupted-feedback coverage that leaves `feedback: pending`, retries against the archived outcome, applies only missing records, and routes `humanspec-next` to reconciliation until complete.
- [ ] 4.5 Add a later `humanspec-next` journey proving that updated milestone, mastered, gap, and review records influence the next candidate and do not recreate the archived change.

## 5. Cross-platform validation and release checks

- [ ] 5.1 Add Windows-path and CRLF coverage using `path.join()`/`path.resolve()`, drive-letter project roots, same-directory temporary files, and exact logical-document assertions.
- [ ] 5.2 Add or update Windows CI verification for archive-feedback document writes, generated-surface parity, and the end-to-end journey.
- [ ] 5.3 Run the focused HumanSpec tests, full type-check/build, and relevant CLI integration tests; resolve regressions without changing generic OpenSpec archive semantics.
- [ ] 5.4 Run `openspec validate --change add-learning-aware-archive-feedback` and confirm every task, spec scenario, generated surface, and ownership boundary is covered before implementation is considered complete.
