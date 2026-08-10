## 1. Public Runtime Contract

- [x] 1.1 Define versioned public JSON envelopes, operation result types, stable issue codes, and exit-status mapping for HumanSpec context operations.
- [x] 1.2 Add the `humanspec context` command group and register its explicit subcommands, flags, help, completion metadata, and `--store` support.
- [x] 1.3 Implement the read-only `inspect` adapter over the existing project-document registry/classifier and return registered templates, targets, states, and issues.
- [x] 1.4 Implement the read-only `next` adapter over next-roadmap context resolution with blocked, reconciliation, ready, and empty result mapping.
- [x] 1.5 Add JSON-mode tests proving stdout contains exactly one parseable envelope and structured failures exit non-zero.

## 2. Packaged Project-Document Assets

- [x] 2.1 Add an explicit build manifest for the three registered project-document Markdown assets and copy them to a stable `dist` location.
- [x] 2.2 Update runtime template lookup to resolve the explicit packaged asset for each registered document identity without glob discovery or source-directory fallback.
- [x] 2.3 Add byte-fidelity tests comparing source, `dist`, and packed templates, including frontmatter, comments, default grammar, and CRLF-safe reads.
- [x] 2.4 Extend package-content checks so a missing registered schema, template, or runtime entry fails with the exact missing asset.

## 3. Fail-Closed Feedback Planning and Application

- [x] 3.1 Extend archive-feedback plans with explicit document identity/path and SHA-256 preconditions over exact observed bytes.
- [x] 3.2 Change domain application defaults so missing or false confirmation writes zero documents and returns a confirmation-required result.
- [x] 3.3 Validate every plan path, identity, and content precondition before the first write, returning a zero-write conflict for stale or out-of-home plans.
- [x] 3.4 Implement `feedback-plan` input validation and public envelope mapping using canonical change/archive evidence.
- [x] 3.5 Implement `feedback-apply` plan-file/stdin handling and require `--yes` in addition to a valid ready plan.
- [x] 3.6 Implement `feedback-reconcile` over persisted archive evidence and pending state, preserving idempotent already-applied behavior.
- [x] 3.7 Add injectable write-failure coverage proving partial application reports exact written/pending documents and can reconcile without duplicates.

## 4. Workflow Runtime Migration

- [x] 4.1 Replace project-document helper-name instructions in the shared HumanSpec guidance with the public inspect command and structured result contract.
- [x] 4.2 Update next and archive workflow templates to use the public next/feedback plan/apply/reconcile commands and explicit learner confirmation flow.
- [x] 4.3 Update propose, coach, verify, and other affected HumanSpec templates so none instruct installed tools to invoke tracked internal TypeScript identifiers.
- [x] 4.4 Regenerate all explicitly registered HumanSpec skill and command artifacts and update parity hashes/content fixtures.
- [x] 4.5 Add a tracked forbidden-identifier test across every registered HumanSpec delivery surface and assert the required public command references.

## 5. Cross-Platform and Packed Black-Box Verification

- [x] 5.1 Add CLI black-box tests for nearest-project and explicit-store context operations, including rootless and invalid-store errors.
- [x] 5.2 Add Windows path tests using `path.join()` expectations for drive-letter planning homes, containment, template targets, and selected stores.
- [x] 5.3 Add fail-closed tests for omitted confirmation, rejected preview, stale content, changed path, and malformed plan input with zero writes.
- [x] 5.4 Add CRLF and unrelated-Markdown preservation tests for inspect, plan, confirmed apply, and reconcile.
- [x] 5.5 Build and install the npm tarball in an isolated project, invoke every referenced public operation through the packed binary, and verify the three templates are available.
- [x] 5.6 Run targeted tests, full `pnpm test`, `pnpm lint`, `pnpm build`, and package checks on supported platforms; record any required follow-up without implementing later feedback/adaptive behavior here.
  - Follow-up: run the completed suite in macOS and Linux CI; this session verified the Windows environment and cross-platform path fixtures only.
