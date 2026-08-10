## 1. QA Runner Foundation

- [ ] 1.1 Add cross-platform package-script entrypoints for default QA, deterministic smoke, and manual/model checklist access.
- [ ] 1.2 Implement the ESM Node.js scenario runner with explicit scenario IDs, tiers, platform selectors, timeouts, exit aggregation, and keep-artifacts support.
- [ ] 1.3 Implement isolated sandbox/environment creation for home/user profile, XDG config/data/state/cache, telemetry, and explicitly registered AI-tool directories.
- [ ] 1.4 Implement portable child-process launch and capture of command, cwd, selected environment, stdout, stderr, exit status, and timeout.
- [ ] 1.5 Add explicit diagnostic snapshot/cleanup behavior and unit tests on Windows-style and POSIX paths.

## 2. Generic CLI Smoke Scenarios

- [ ] 2.1 Add an explicit scenario registry and shared assertion helpers without filesystem glob-based discovery.
- [ ] 2.2 Add project initialization and non-interactive detected-tool scenarios with config/surface assertions.
- [ ] 2.3 Add unset-profile migration and delivery cleanup scenarios for `both -> skills` and `both -> commands`.
- [ ] 2.4 Add commands-only update detection and new tool-directory messaging scenarios.
- [ ] 2.5 Add invalid profile override and deterministic error-output scenarios.
- [ ] 2.6 Document local scenario selection, failure reproduction, and retained-artifact inspection.

## 3. Portable Package and Version Guard

- [ ] 3.1 Refactor `pack-version-check.mjs` to read package name, version, and bin mappings from `package.json`.
- [ ] 3.2 Invoke npm through the active Node/npm environment with a Windows-safe fallback rather than a hardcoded executable filename.
- [ ] 3.3 Resolve the installed package and binary through metadata/Node resolution instead of a hardcoded scoped `node_modules` path.
- [ ] 3.4 Derive expected schemas, workflow surfaces, and project-document assets from explicit registries and assert every named tarball entry.
- [ ] 3.5 Add tests for scoped/unscoped package identities, multiple bin mappings, missing assets, CRLF output, and Windows process launch.

## 4. Packed HumanSpec Capstone

- [ ] 4.1 Add a preparation step that builds once, runs `npm pack --json`, records tarball integrity, and installs that exact artifact into isolated scenario sandboxes.
- [ ] 4.2 Add the minimal checked-in HumanSpec project and `human-learning` fixture with canonical verify-shaped evidence inputs.
- [ ] 4.3 Add a packed happy-path scenario covering bootstrap, template inspection, learning artifacts, canonical archive feedback, and next-context resolution through the installed binary.
- [ ] 4.4 Add an injected feedback-write interruption followed by archive-evidence-only reconciliation and duplicate-free rerun assertions.
- [ ] 4.5 Add confirmed-candidate and rejected-candidate variants, including milestone state, empty-roadmap reporting, and proof that no change directory is auto-created.
- [ ] 4.6 Add guards that fail the scenario if it imports repository source/dist directly or invokes a non-installed CLI.

## 5. Manual and Model-Dependent Evidence

- [ ] 5.1 Create a versioned HumanSpec teaching checklist covering oversized splitting, experience-sensitive sizing, Levels 1/2/3, no full patch, software-pass/learning-incomplete, fail-then-pass, and interruption recovery.
- [ ] 5.2 Define the checklist result record with tool/model/version, platform, packed artifact, fixture revision, disposition, reviewer/date, and evidence notes.
- [ ] 5.3 Add current/stale/not-run/fail manual status reporting without presenting it as deterministic automation.
- [ ] 5.4 Document which release workflow, if any, requires a current manual result and keep normal deterministic CI semantics explicit.

## 6. Cross-Platform CI and Completion Gate

- [ ] 6.1 Add Linux CI for the full fast generic smoke tier and deterministic HumanSpec capstone.
- [ ] 6.2 Add Windows CI for package/version guard, native path/process/newline cases, and the required packed HumanSpec capstone subset.
- [ ] 6.3 Add macOS CI for package install/runtime paths and the required packed HumanSpec capstone subset.
- [ ] 6.4 Reuse or verify the same tarball across matrix jobs and upload named scenario diagnostics on failure.
- [ ] 6.5 Run targeted runner tests, full `pnpm test`, `pnpm lint`, `pnpm build`, `pnpm check:pack-version`, and the supported packed-install matrix.
- [ ] 6.6 Update contributor/release documentation with deterministic versus manual guarantees and the pre-migration HumanSpec completion checklist.
