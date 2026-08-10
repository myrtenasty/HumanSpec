## Context

The repository has focused unit/E2E suites and an existing package-version check, but manual CLI validation is inconsistent. HumanSpec tests currently verify prompt content, helper behavior, and a generic archive followed by direct helper calls; they do not prove that the npm tarball exposes the deterministic runtime used by installed workflows. Model-dependent coaching and verification behavior also cannot be made deterministic merely by naming a helper test “E2E.”

This change is the release gate after the four HumanSpec correctness changes. It must be cross-platform, fast enough for routine use, diagnostic when it fails, and explicit about what automation does not prove.

## Goals / Non-Goals

**Goals:**
- Standardize portable local and CI entrypoints for isolated CLI smoke scenarios.
- Exercise deterministic HumanSpec behavior through the packed binary and public runtime.
- Verify package contents and version/install behavior on Windows, macOS, and Linux.
- Preserve evidence for failures and manual/model reviews.
- Separate deterministic assertions from qualitative teaching checks.

**Non-Goals:**
- Replace unit, integration, or focused CLI E2E tests.
- Automate AI conversations in the required deterministic CI gate.
- Reimplement HumanSpec runtime/parser behavior inside fixture code.
- Make every generic smoke scenario run on every platform/job if a smaller matrix subset proves the platform boundary.

## Decisions

### 1. Use a Node.js scenario runner with package-script entrypoints

Provide package scripts such as:

- `pnpm qa` — default deterministic tier;
- `pnpm qa:smoke` — focused generic and HumanSpec smoke scenarios;
- `pnpm qa:manual` — locate/render the version-controlled manual/model checklist.

Implement orchestration in ESM Node.js so process launch, temporary paths, JSON assertions, and cleanup use the same code on Windows, macOS, and Linux. A Makefile may provide convenience aliases, but it is not the portability contract.

Alternative considered: a Bash smoke script as the primary runner. Rejected because Windows support is itself a release requirement and shell emulation would hide native process/path failures.

### 2. Model scenarios as explicit registered modules

Each scenario has a stable ID, description, tier, supported platforms, setup function, command sequence, assertions, timeout, and diagnostic paths. The runner selects scenarios from an explicit registry; it does not discover executable files by glob. Shared helpers create sandboxes and launch the selected packed binary without embedding product behavior.

Alternative considered: one large imperative smoke script. Rejected because failures become difficult to attribute and platform subsets cannot be selected safely.

### 3. Isolate all relevant process and tool state

Each scenario creates a temporary root with explicit HOME/USERPROFILE, XDG config/data/state/cache, and registered AI-tool directories. It also sets telemetry off, fixes locale/timezone where output assertions require stability, and records the binary/package path. Environment inheritance is allowlisted for essentials such as PATH and the active Node toolchain.

On failure or `--keep-artifacts`, retain a manifest, command stdout/stderr, exit codes, and an explicit snapshot of relevant files. Snapshotting uses known paths from the scenario, not an unbounded filesystem dump.

### 4. Pack once and install the same tarball into capstone sandboxes

A preparation step builds and runs `npm pack --json`, captures the resulting tarball path and integrity metadata, then installs that exact tarball into isolated fixture workspaces. All HumanSpec capstone CLI calls resolve the installed binary; tests fail if they accidentally import repository `src` or `dist` directly.

Local iteration may reuse a tarball only when its source hash matches; CI always produces a fresh one.

Alternative considered: run `tsx src/cli/index.ts`. Rejected because it cannot detect missing package assets, bin mappings, or installed path assumptions.

### 5. Keep the deterministic capstone state-driven, not model-driven

The capstone uses a small checked-in fixture plus CLI operations to establish:

1. HumanSpec bootstrap and packaged project-document inspection;
2. a complete `human-learning` change/artifact set;
3. a canonical verify-shaped latest result;
4. canonical archive;
5. feedback plan/confirmed application or injected write interruption;
6. reconciliation and next-context resolution.

The fixture supplies learner/model semantic choices (for example a confirmed or rejected next candidate) as explicit inputs. The harness validates product behavior around those inputs; it does not pretend to test whether a model would make a pedagogically good choice.

Alternative considered: call an external model in CI. Rejected because cost, nondeterminism, credentials, and model drift would make it an unreliable required release gate.

### 6. Store qualitative behavior in a versioned evidence checklist

Maintain a HumanSpec checklist with scenario ID, expected invariant, tool/model/version, platform, packed artifact/version, fixture revision, observed result, evidence link/notes, reviewer, and date. Include large-request splitting, experience-sensitive sizing, Level 1/2/3 progression, complete-patch refusal, software-pass/learning-incomplete failure, recovery, and rerun behavior.

Deterministic reports contain a separate `manualStatus` field (`not-run`, `current-pass`, `current-fail`, `stale`) based on matching artifact/fixture revision. CI does not turn `not-run` into a deterministic failure unless a release workflow explicitly requires a current manual review.

### 7. Make package/version checks metadata-driven

Read package name, version, and bin mappings from the repository `package.json`. Invoke npm through `process.env.npm_execpath` with the current Node executable when available, with a platform-aware fallback, rather than calling a bare `npm` filename. Resolve scoped installation paths from package metadata and Node resolution, not a hardcoded `node_modules/@scope/name` string.

Asset assertions derive from explicit schema/workflow/project-document registries and verify the exact named tarball paths. This prepares the guard for later product identity changes without coupling this change to the rename.

### 8. Use a layered CI matrix

Linux runs the full fast generic smoke tier plus the deterministic HumanSpec capstone. Windows and macOS run package integrity, install, public runtime, path/newline, and the required capstone subset. Release CI can run the full matrix. Every job uploads retained diagnostics on failure.

The same tarball should be used across matrix jobs when the CI system can publish/download a build artifact; otherwise each job verifies an identical source commit and package manifest.

## Risks / Trade-offs

- [Smoke suite becomes a second test framework] → keep scenarios at public-flow level and leave edge cases in existing focused tests.
- [Cross-platform jobs increase CI time] → pack once, use tier tags, and reserve the full matrix for release while keeping required platform seams on pull requests.
- [Filesystem snapshots leak host information] → snapshot only explicit sandbox paths and redact environment values not needed for diagnosis.
- [Manual checklist becomes stale ceremony] → bind results to fixture/artifact revision and report staleness visibly.
- [Fixture overfits internal Markdown] → create state through public artifacts/runtime contracts where possible and assert observable outputs, while versioning the minimal canonical fixture.
- [First four changes are not yet implemented] → finalize harness APIs now but implement capstone scenarios in dependency order; fail with explicit missing-capability diagnostics rather than embedding temporary replacements.

## Migration Plan

1. Replace the incomplete capability split with the single `developer-qa-workflow` spec.
2. Add Node runner foundations, package scripts, sandbox/process helpers, and generic scenario registry.
3. Make package/version checks metadata-driven and add explicit tarball asset assertions.
4. Add the packed HumanSpec fixture and deterministic happy-path/interruption/rejection scenarios after their runtime dependencies land.
5. Add the versioned manual/model checklist and report separation.
6. Add Linux fast gating, Windows/macOS package-capstone subsets, and release full-matrix jobs.
7. Document local reproduction and diagnostic retention.

Rollback removes the new entrypoints/jobs while leaving existing unit/E2E tests intact. Package guard changes can be reverted independently if necessary, but the old hardcoded guard must not be represented as cross-platform coverage.
