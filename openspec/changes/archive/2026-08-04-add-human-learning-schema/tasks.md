## 1. Add the built-in schema and templates

- [x] 1.1 Add `schemas/human-learning/schema.yaml` with the `proposal → specs → learning` graph, `apply.requires: [learning]`, `apply.tracks: learning.md`, and the human-owned implementation instruction
- [x] 1.2 Add the concise proposal template and instructions covering one observable outcome, explicit scope, constraints, completion evidence, and change-size guidance
- [x] 1.3 Add the delta-spec template and instructions covering testable behavior plus the valid `skip_specs: true` path for changes without behavior deltas
- [x] 1.4 Add the `learning.md` template and instructions with the learning contract, human reflection sections, two-to-five trackable practice tasks, stuck-state evidence, and reserved AI verification section

## 2. Verify schema discovery and artifact behavior

- [x] 2.1 Add package-schema discovery tests proving `human-learning` is listed with `proposal`, `specs`, and `learning` artifacts and can be selected by `openspec new change`
- [x] 2.2 Add artifact status tests for the normal proposal-to-specs-to-learning sequence and final completion state
- [x] 2.3 Add `skip_specs: true` tests proving specs are reported as skipped, no spec file is synthesized, and learning becomes ready after proposal
- [x] 2.4 Add instruction/template assertions for the artifact ownership rules, learning section structure, task-size guidance, and human implementation boundary

## 3. Prove tracked practice-task integration

- [x] 3.1 Add apply-instructions coverage proving `learning.md` supplies the resolved tracked path, apply requirements, ordered task records, and completed/remaining/total progress without a `tasks.md` file
- [x] 3.2 Align apply-instructions structured output with the tracked-artifact contract if the integration test exposes missing path or apply-requirement fields
- [x] 3.3 Add list command coverage proving completed and incomplete checkboxes in `learning.md` produce the displayed and JSON task totals
- [x] 3.4 Add archive coverage proving an incomplete learning task triggers the existing safety flow and fully completed learning tasks permit archive
- [x] 3.5 Preserve regression coverage for `spec-driven`, unresolved schemas, tracked globs, sibling changes, and archived changes

## 4. Cross-platform and release verification

- [x] 4.1 Use `path.join()` or `path.resolve()` for every filesystem setup and expected path in the new tests, including the `learning.md` tracked path
- [x] 4.2 Run the focused schema, artifact-workflow, task-progress, list, validation, and archive test suites on the development platform
- [x] 4.3 Verify the new path-sensitive tests in Windows CI and retain compatibility with macOS and Linux runners
- [x] 4.4 Run `pnpm build` and the full `pnpm test` suite, confirming existing schemas and changes remain unaffected
