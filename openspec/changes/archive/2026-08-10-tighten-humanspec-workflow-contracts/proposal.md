## Why

The HumanSpec workflows exist, but several prompt contracts still disagree with the product model: init attempts to bootstrap itself and reports stale feature status, propose and next apply different sizing rules, and teaching safeguards are not expressed consistently by coach and verify. These inconsistencies can produce different learner experiences for the same project state even when the deterministic runtime is correct.

## What Changes

- Make `humanspec-init` treat project-local CLI bootstrap as a prerequisite: verify it, stop with an actionable external command when absent, and never rerun bootstrap from inside the generated workflow.
- Replace stale “not implemented yet” language with accurate workflow responsibility boundaries.
- Define one shared HumanSpec change-sizing contract used by both propose and next.
- Complete sizing checks for multiple frameworks/infrastructure components, multiple unfamiliar core concepts, whole-module/system requests, missing single completion evidence, learner experience, cognitive load, and session budget.
- Require roadmap-external requests to report their effect on the current learning path before confirmation.
- Require coach to label every hint level and remind the learner to record the level actually used without writing learner evidence itself.
- Require verify to report follow-up learning items and prohibit complete copy-ready implementation answers in failure feedback.
- Regenerate every committed skill and command projection and preserve surface parity.

## Capabilities

### New Capabilities

<!-- None. -->

### Modified Capabilities

- `humanspec-init-workflow`: Initialization verifies an external bootstrap prerequisite and accurately describes responsibility boundaries.
- `humanspec-propose-workflow`: Propose applies the complete shared sizing and roadmap-impact contract.
- `humanspec-next-router`: Next evaluates candidate fit using the same sizing contract as propose.
- `humanspec-coach-workflow`: Every coaching response labels the hint level and preserves learner-authored hint-use evidence.
- `humanspec-verify-workflow`: Verify reports follow-up learning items and maintains the no-complete-solution teaching boundary.

## Impact

- Primarily affects HumanSpec workflow/shared prompt templates, committed generated skills and commands, parity hashes, and behavioral template tests.
- May introduce a shared sizing policy module or data structure, but does not change the public project-context runtime or evidence grammar defined by preceding changes.
- Requires regeneration across all supported delivery surfaces and cross-platform path assertions for generated artifacts.
