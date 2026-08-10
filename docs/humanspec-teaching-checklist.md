# HumanSpec teaching checklist

- **Checklist version:** 1
- **Fixture revision:** `humanspec-qa-fixture-v1`
- **Purpose:** record model- or reviewer-dependent teaching behavior separately from deterministic QA.

This checklist is intentionally not run by `pnpm qa` or CI. A deterministic smoke pass proves package installation and state transitions only; it does not prove that a model chose an appropriate teaching response.

## Review items

For each item, record the observed transcript/evidence and mark **pass** only when the expected invariant is visible.

- [ ] **Oversized request splitting:** the reviewer recognizes an oversized outcome and proposes independently verifiable slices before implementation.
- [ ] **Experience-sensitive sizing:** the same request is sized differently for a beginner and an experienced learner, with the reason made explicit.
- [ ] **Progressive hints — Level 1:** the learner receives a conceptual direction without a solution.
- [ ] **Progressive hints — Level 2:** after a Level 1 attempt, the learner receives a code location or constrained diagnostic step.
- [ ] **Progressive hints — Level 3:** only after the required attempts, the learner receives bounded pseudocode or a minimal implementation clue.
- [ ] **No full patch:** the workflow refuses to emit a complete application/test patch for the learner.
- [ ] **Software pass / learning incomplete:** software evidence can pass while missing or placeholder learner evidence keeps learning incomplete.
- [ ] **First fail, then pass:** a failed verification is preserved, followed by a later passing result with distinct evidence.
- [ ] **Interruption recovery:** after canonical archive success and an interrupted feedback write, retry uses archived evidence and does not duplicate records.

## Result record

Store one JSON record per reviewed tool/model run. The record must contain every field below:

```json
{
  "tool": "assistant or review tool",
  "model": "model name or human-review",
  "modelVersion": "model/tool version",
  "platform": "linux | darwin | win32",
  "packedArtifact": "@fission-ai/openspec@1.7.0 (sha512-...)",
  "fixtureRevision": "humanspec-qa-fixture-v1",
  "disposition": "pass",
  "reviewer": "name",
  "date": "YYYY-MM-DD",
  "evidenceNotes": "Transcript, artifact, or issue links for every checklist item."
}
```

`pnpm qa:manual -- --result <record.json>` reports `current-pass`, `current-fail`, `stale`, or `not-run`. A result is current only when its package version and fixture revision match this checkout. Missing or stale results are not deterministic CI failures.

## Release reporting

Normal CI and the normal release workflow require deterministic tests, package integrity, and packed smoke scenarios only. A release workflow may separately require a `current-pass` record by policy; if it does, that policy must name the result file and reviewer approval explicitly. Never turn `not-run` into an automated teaching pass.
