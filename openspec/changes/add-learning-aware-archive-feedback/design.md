## Context

The proposal builds on the existing HumanSpec workflow templates and the OpenSpec archive command. `humanspec-verify` already writes a single latest result into the reserved `AI 验证记录` area of a change's `learning.md`; `humanspec-next` already reads structured status and routes a passing change to `humanspec-archive`. The generic archive operation already validates a change, applies delta specifications, and moves the change directory, including Windows-safe move fallbacks.

The remaining gap is the project-document feedback boundary. `src/core/templates/project-docs.ts` is the registry for `project.md`, `roadmap.md`, and `learner.md`, but currently provides recognition and path resolution rather than safe feedback mutation. The existing archive template deliberately says that roadmap mutation and adaptive learning history are deferred.

## Goals / Non-Goals

**Goals:**

- Add one deterministic archive-feedback contract shared by the generated skill and command surfaces.
- Re-check structured change state, project-document validity, task progress, learner evidence, and the latest verification result before any archive or feedback write.
- Reuse the existing archive command for validation, spec synchronization, and moving the change; do not duplicate those semantics.
- Apply explicit, previewed, learner-confirmed updates to the registered roadmap and learner documents.
- Make partial feedback failure visible and retryable without duplicating records or re-running spec synchronization.
- Let `humanspec-next` distinguish pending feedback reconciliation from a genuinely empty roadmap.
- Preserve the application/test implementation ownership boundary and cross-platform path behavior.

**Non-Goals:**

- No new public implementation/apply workflow and no edits to a learner's application or test implementation files.
- No change to the generic `openspec archive` validation, delta merge, confirmation, or move semantics.
- No automatic creation of the next change, no automatic coding, and no replacement of learner-authored reflections.
- No cloud history, multi-learner collaboration, global installation, `openspec/` rename, or unified manifest migration.
- No attempt to infer a learner's mastery from a passing test alone.

## Decisions

### 1. Keep archive orchestration in the HumanSpec workflow and reuse canonical archive

`humanspec-archive` will first resolve its context and evaluate the HumanSpec gates, then invoke the existing archive operation in structured JSON mode with the selected root/store context. The archive result is the source of truth for the final archive path and spec-sync outcome. This avoids a second implementation of validation, delta application, date naming, and Windows directory moves.

The workflow will not pass `--yes` until its own readiness and learner-confirmation gates have completed. A forced archive remains an explicit, separately confirmed path; its result is labeled learning-incomplete or inconclusive and cannot create positive mastery claims.

**Alternative rejected:** modifying `src/core/archive.ts` to understand HumanSpec reflections. The generic CLI must remain usable by ordinary OpenSpec projects and already exposes the task/progress behavior HumanSpec needs as an internal protocol.

### 2. Use the existing project-document registry and explicit section/record descriptors

Extend the registered project-document metadata with named feedback anchors rather than scattering filenames or free-form markdown searches across workflows. The archive-feedback helper will resolve paths through `getProjectDocTemplate` and `resolveProjectDocPath`, verify markers with `detectHumanSpecDocType`, and recognize only the registered headings and line grammars.

The roadmap feedback representation will preserve the existing `# 候选切片` grammar for pending candidates. On the first confirmed archive, the updater will create or reuse an explicit `# 已归档切片` section and append one deterministic record:

```text
- [x] archived: <change-name> — <outcome> (feedback: pending|complete)
```

The exact candidate line for the archived change is removed from `# 候选切片` by change-name lookup; unrelated candidates are untouched. A direct change that was not on the roadmap still receives an archived record, but no unrelated candidate is invented. `humanspec-next` reads unchecked `slice:` entries as candidates and reads the archived section for `feedback: pending` reconciliation.

Learner feedback is added only in the registered `已暴露的知识缺口`, `已掌握内容`, and `建议复习项` sections using the existing `gap:`, `mastered:`, and `review:` record forms. Records are proposed from the learner's reflection and the verification result, previewed, deduplicated by their normalized topic, and never used to rewrite the reflection itself.

**Alternative rejected:** marking a candidate line in place with an undocumented comment. It would leave the candidate grammar ambiguous and make repeated routing prone to selecting an archived slice again.

### 3. Use a two-step feedback state after archive

The operation is intentionally ordered:

1. Resolve and validate all context; build an in-memory archive and feedback plan.
2. Show the archive result preview and the proposed document changes; obtain explicit confirmation.
3. Invoke canonical archive. If it fails, do not touch project feedback documents.
4. After archive succeeds, write the roadmap archived record with `feedback: pending` using an atomic same-directory replacement.
5. Apply the confirmed learner records using another atomic same-directory replacement.
6. Replace only the exact roadmap feedback record's state from `pending` to `complete` after the learner document succeeds.

This ordering prevents a failed archive from being represented as completed. If the learner write or final roadmap state update fails, the pending record remains an explicit reconciliation signal. A later archive-feedback invocation accepts the reported archived path/name, reads the archived `learning.md`, applies only missing records, and never invokes canonical archive again. If the first roadmap write fails, the workflow reports the archived path as a manual reconciliation target rather than silently claiming completion.

**Alternative rejected:** updating roadmap and learner documents before archiving. That can claim a completed learning slice while the change and its specification delta are still active.

### 4. Preserve markdown and line-ending ownership with narrow edits

The feedback helper will read each document as UTF-8, preserve its detected line-ending style, and produce a change plan containing exact line ranges and old/new text. It will modify only the selected candidate line, the registered archive-record section, and the three registered learner-record sections. It will refuse unmarked, malformed, duplicated, or ambiguous anchors instead of rendering the whole document.

Writes will use a temporary file beside the original and an atomic rename where supported, with the existing filesystem/path utilities and `path.join()`/`path.resolve()` for every destination. Windows tests will assert that drive-letter roots, CRLF documents, and same-directory temporary paths behave like POSIX paths.

### 5. Keep routing and generated surfaces aligned through shared content

Update `src/core/templates/workflows/humanspec-archive.ts` with the gate, preview, canonical archive, pending-reconciliation, and output contract. Update `humanspec-next.ts` to route a pending archived record to reconciliation and to use completed feedback when selecting a later candidate. Update `HUMANSPEC_WRITE_BOUNDARIES` in `humanspec-shared.ts` so archive may write only the explicitly confirmed planning feedback records; the application/test boundary remains unchanged.

Both skill and command templates will continue to be generated from the same template functions. Existing profile membership and command identities do not change; parity, generated-output, update, and cleanup tests remain the guard against drift.

### 6. Treat feedback as a reconciled outcome, not a new change

The archive workflow will report exactly one next handoff: reconciliation when feedback is pending, or `humanspec-next`/`humanspec-propose` after feedback is complete. It will not call `openspec new change`, create a change directory, or create planning artifacts for the next slice.

## Risks / Trade-offs

- **[Risk]** The canonical archive succeeds but a project-document write fails, leaving a partially updated loop. → Keep the roadmap record explicitly `feedback: pending`, report the archived path and failed document, and make reconciliation idempotent and independent of spec synchronization.
- **[Risk]** Existing user-authored markdown does not match the registered template. → Classify it as unmarked, malformed, duplicated, or ambiguous; show a repair action and do not overwrite it.
- **[Risk]** A broad markdown rewrite could erase learner content or line-ending style. → Use registered section descriptors, exact change-name lookup, narrow splices, preserved line endings, and atomic per-file replacement.
- **[Risk]** A passing test could be mistaken for learning mastery. → Require the latest verification's learning assessment and learner evidence, preview every mastery/gap/review claim, and never synthesize reflections.
- **[Risk]** Multiple active changes or archived records could make retry selection ambiguous. → Require an explicit change/archive-path selection and report all candidates; never select by recency or directory order.
- **[Risk]** Generated tool surfaces drift apart. → Keep skill and command content composed from the same template constants and extend existing parity/hash tests.
- **[Trade-off]** The roadmap gains a small explicit archived-record section and status marker. → This makes pending reconciliation and idempotent `next` routing observable and safer than hidden comments or heuristic history scans.

## Migration Plan

1. Add the registered archive-feedback section/record descriptors and narrow document planning helpers without changing existing project documents.
2. Update the HumanSpec archive and next templates, shared write boundary, generated projections, and their parity fixtures.
3. Add unit tests for context classification, exact slice lookup, learner record deduplication, pending/complete transitions, conflict handling, CRLF/Windows paths, and atomic-write failure reporting.
4. Add workflow and CLI journey coverage for a successful archive, failed verification gate, forced incomplete archive, canonical archive failure, interrupted feedback, retry reconciliation, and next-slice selection.
5. Regenerate managed skill/command artifacts through the existing generation path and run the cross-platform CI checks.
6. Existing projects require no automatic migration. The archived-record section is created only after a learner confirms the first feedback update; existing roadmap and learner content is preserved byte-for-byte until then.
7. If the workflow is rolled back, already-written records remain ordinary markdown history. A learner can remove or correct them manually; no application code or generic archive data migration is required.
