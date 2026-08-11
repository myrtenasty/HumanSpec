## Why

HumanSpec currently has helper, prompt-text, and generic CLI tests, but no repeatable release gate proving that the packed product can execute its deterministic learning loop. Manual CLI review is also ad hoc, and model-dependent teaching behavior is easily mislabeled as deterministic end-to-end coverage.

## What Changes

- Add a lightweight, sandboxed QA harness with stable local entrypoints for deterministic smoke tests and a separate manual/model checklist.
- Isolate each scenario with temporary home/config/data/tool directories and retain command output, exit status, and relevant before/after filesystem state on failure.
- Preserve focused generic CLI scenarios for profile/delivery synchronization, migration-sensitive behavior, tool detection, cleanup, and invalid configuration.
- Add a minimal replayable HumanSpec fixture that starts from a packed installation and covers bootstrap, human-learning artifacts, verify-shaped records, archive feedback/reconciliation, and next-roadmap context.
- Keep model-dependent behaviors—oversized-request splitting, learner-level adaptation, progressive hints, no full patch, and learning-evidence judgments—in an explicit human/model checklist rather than claiming deterministic automation.
- Make the pack-version guard cross-platform, derive the installed package path from `package.json`, and assert that required schemas, workflows, and project-document templates exist in the tarball.
- Run packed-install smoke coverage in the supported Windows, macOS, and Linux CI matrix, while retaining an appropriately fast default local/CI smoke tier.

## Capabilities

### New Capabilities

- `developer-qa-workflow`: Repeatable local and CI QA for generic CLI behavior, packed HumanSpec deterministic flows, and clearly separated manual/model teaching checks.

### Modified Capabilities

<!-- None. -->

## Impact

- Affects developer QA entrypoints, smoke runner scripts/fixtures, contributor documentation, `scripts/pack-version-check.mjs`, package assertions, and CI workflows.
- Exercises the runtime, evidence, adaptive-roadmap, and workflow-contract changes without implementing their product behavior inside the test harness.
- Replaces the existing incomplete proposal/spec split between `qa-smoke-harness` and `developer-qa-workflow` with one coherent new capability.
