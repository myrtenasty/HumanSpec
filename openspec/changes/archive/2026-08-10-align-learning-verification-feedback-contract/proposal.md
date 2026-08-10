## Why

The learning template, verify output, and archive-feedback parser do not share one replayable evidence format: verify does not reliably emit the mastered topics, knowledge gaps, and review items that archive retry expects. As a result, a successful canonical archive followed by an interrupted learner-document update cannot be recovered deterministically from the archived `learning.md`.

## What Changes

- Expand the built-in `learning.md` scaffold so before-practice, stuck, and after-practice evidence explicitly captures the teaching fields required by coach, verify, and archive.
- Define one stable, machine-readable latest verification result with separate mastered, gap, and review records.
- Permit mastery only for learning-complete results; failing or inconclusive results may still persist gaps and review items without implying mastery.
- Make the archive-feedback parser consume the real verify-shaped record, including explicit empty-list semantics that cannot be mistaken for a topic.
- Extend verify to evaluate included scope, excluded scope, and proposal constraints, and to attach concrete evidence and a next step to each blocker.
- Add interruption/retry tests proving that archived learning evidence alone can restore learner feedback idempotently without duplicate records.

## Capabilities

### New Capabilities

<!-- None. -->

### Modified Capabilities

- `human-learning-schema`: The learning artifact scaffold gains explicit before, stuck, after, and reserved verification evidence fields.
- `humanspec-verify-workflow`: Verification records a stable learning-feedback contract and checks proposal scope and constraints with evidence-backed blockers.
- `humanspec-archive-feedback`: Archive feedback parses and replays the canonical verify record, including interrupted-write recovery and duplicate suppression.

## Impact

- Affects the packaged human-learning template, HumanSpec verify workflow template, archive-feedback parsing/types, generated skills/commands, and related fixtures.
- Changes the structured content written inside the reserved `AI 验证记录` section while preserving learner-owned sections.
- Requires compatibility handling for existing learning artifacts that predate the new feedback block.
- Depends on the public project-context runtime for end-to-end CLI recovery tests, but keeps the evidence grammar independent of transport details.
