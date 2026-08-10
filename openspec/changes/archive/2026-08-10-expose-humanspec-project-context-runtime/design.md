## Context

HumanSpec already has a project-document registry, parsers, feedback planner/application helpers, and next-context resolver. They are package-internal exports used directly by tests, while generated workflows describe those exports as if installed AI tools could invoke them. Project-document Markdown assets also remain under `src/`, and the current apply helper treats missing confirmation as permission to proceed.

This change establishes the runtime seam required by the later evidence and adaptive-roadmap changes. It must preserve current root/store behavior, cross-platform paths, Markdown fidelity, and the ability to reconcile an archive that succeeded before project-document feedback was fully written.

## Goals / Non-Goals

**Goals:**
- Provide one public, versioned JSON boundary over the existing project-document domain logic.
- Make mutation preview/confirmation/precondition checks fail closed and replay-safe.
- Make registered templates available from the built and packed package.
- Ensure generated HumanSpec workflows reference only operations an installed user can execute.
- Test the installed tarball and real CLI route rather than importing helpers from an E2E test.

**Non-Goals:**
- Redefine the learning-feedback grammar; that belongs to `align-learning-verification-feedback-contract`.
- Add adaptive milestone transitions or candidate generation; that belongs to `complete-adaptive-roadmap-feedback`.
- Rename the package, binary, or `openspec/` planning directory.
- Remove existing internal exports before downstream callers have migrated.

## Decisions

### 1. Add a dedicated `humanspec context` CLI group

Expose a focused command group rather than adding unrelated flags to generic commands:

- `openspec humanspec context inspect --json`
- `openspec humanspec context next --json`
- `openspec humanspec context feedback-plan --change <name> --json`
- `openspec humanspec context feedback-apply --plan <path|-> --yes --json`
- `openspec humanspec context feedback-reconcile --change <name> --json`

Inspection returns registered templates, target paths, classifications, and issues, so a separate template command is unnecessary. Complex plan input is read from an explicit file or stdin (`-`) instead of encoding Markdown evidence in flags.

Alternative considered: teach each generated workflow how to read and rewrite Markdown. Rejected because it recreates untested parsing and write behavior differently for every AI tool.

### 2. Use a versioned JSON envelope and domain-specific issue codes

All JSON operations return `{ version, operation, status, planningHome, data, issues, nextAction }`. JSON mode reserves stdout for exactly one JSON value; diagnostics go to stderr. Exit code zero represents a successfully evaluated ready/empty/already-applied result, while invalid input, blocked resolution, conflict, or failed application is non-zero even though its JSON remains parseable.

Alternative considered: expose raw helper return types directly. Rejected because those types are internal and would make future refactoring an accidental CLI breaking change.

### 3. Reuse one command adapter over existing domain functions

The CLI layer validates input, resolves the planning home, calls the domain operation, and maps the result to the public envelope. Domain parsing/planning remains free of Commander and console output. Existing root-selection utilities provide nearest-root and `--store` behavior; document targets continue to use the Node.js path module and explicit registry lookups.

Alternative considered: duplicate a CLI-specific parser. Rejected because it would immediately diverge from tested project-document semantics.

### 4. Bind plans to exact observed document content

Each changed document plan carries a SHA-256 digest of its exact `before` bytes plus its explicit resolved path and document identity. Application validates every planned precondition before the first write. `confirmed` defaults to false in the domain API; CLI application additionally requires `--yes` after the workflow has obtained learner confirmation.

A plan is data, not ambient process state. This permits preview in one workflow turn and confirmed application in a later turn without a daemon or hidden cache.

Alternative considered: compare modification timestamps. Rejected because timestamps are lossy and can miss same-timestamp content changes.

### 5. Keep the two-phase pending marker for recoverability

Roadmap feedback continues to establish a pending state before the learner document is completed. The result identifies written and pending documents, and reconciliation reconstructs expected feedback from canonical archived evidence. Atomic replacement is used per file, but cross-file atomicity is not claimed.

Alternative considered: roll back the first file after a later write fails. Rejected because rollback can itself fail and may erase a valid canonical archive marker; explicit reconciliation is safer and observable.

### 6. Copy template assets into `dist` through an explicit manifest

Build logic copies the three named project-document assets to a stable `dist` location. Runtime lookup uses an explicit document registry that maps each identity to its packaged asset; it does not glob or infer assets by filename. Package-content tests compare source and packed bytes and fail when any registered asset is omitted.

Alternative considered: embed all Markdown in generated JavaScript strings. Rejected because it creates another source of truth and makes byte-fidelity checks harder.

### 7. Migrate workflow instructions by explicit tracked identifier list

Update the canonical HumanSpec workflow templates/shared fragment and regenerate committed skill/command projections. Tests maintain an explicit list of forbidden internal helper identifiers and assert their absence from every HumanSpec delivery surface while asserting the expected public command forms are present.

This migration remains compatible with the current generation pipeline; the later manifest change can move the registrations without changing rendered behavior.

## 8. Bind public feedback plans to one selected planning home
A `feedback-plan` result is the only accepted wire format for `feedback-apply`: callers provide the versioned envelope and its `data.plan`, rather than an ambient or partial plan. Plans carry the selected planning-home path, registered document identity, explicit target path, and SHA-256 digests calculated from the raw UTF-8 document bytes. Application resolves the requested local root or selected store again, rejects a different planning home, and checks every registered target and digest before the first write.

`feedback-plan` and `feedback-reconcile` locate canonical archive evidence only when exactly one archive beneath the selected planning home's archive directory matches the requested change name; no match and ambiguous matches are structured errors. Context statuses `ready`, `empty`, `complete`, and `already-applied` exit zero. Blocked, reconciliation-required, pending, conflict, and error statuses exit non-zero while still emitting one parseable JSON envelope.

Alternative considered: accept arbitrary plan fragments or infer an archive from the caller's current directory. Rejected because either option could apply feedback from the wrong project, store, or archived change.

## Risks / Trade-offs

- [Public JSON becomes a compatibility surface] → Version the envelope, test field presence and status semantics, and keep domain internals behind a mapper.
- [Plan files can expose project text] → Store only required proposed content and hashes, avoid secrets in diagnostics, and document that callers should use temporary files with normal user permissions.
- [A process crash can still split a multi-file update] → Preserve explicit pending state and make reconciliation idempotent; do not claim cross-file transactions.
- [Changing confirmation defaults can break direct helper callers] → update all callers and tests in the same change, retain a clear blocked result, and treat implicit confirmation as unsupported.
- [Windows packaging/path behavior diverges] → exercise drive-letter, separator, CRLF, tarball install, and store-selection cases in Windows CI.
- [Later active changes touch CLI/template registration] → keep this change behavior-focused, rebase explicitly, and migrate to the unified manifest only after the HumanSpec contract is frozen.

## Migration Plan

1. Add the public result types and CLI adapters while preserving existing helper exports.
2. Add explicit build asset copying and packed-content assertions.
3. Change confirmation defaults and update all direct callers to pass explicit intent.
4. Add black-box CLI tests, including stale-plan and interrupted-write reconciliation.
5. Rewrite canonical workflow templates and regenerate all tracked projections.
6. After all consumers use the public commands, mark direct helper use outside the domain/tests as unsupported; removal can occur in a later refactor.

Rollback keeps the internal helpers and document formats intact: revert generated workflow references and command registration together, while leaving archive data readable by the previous parser.
