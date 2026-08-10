## Why

Archive feedback currently removes the completed slice and records learner feedback but does not advance the milestone or propose a next direction. Once the last prewritten candidate is archived, `humanspec-next` therefore reaches an empty roadmap instead of adapting to the learner's verified outcome.

## What Changes

- Define a stable roadmap milestone-state and next-candidate grammar that remains human-editable and machine-parseable.
- Extend archive-feedback planning to preview the archived slice, milestone transition, and a proposed next learning direction derived from the verified learner state.
- Keep semantic candidate generation learner-owned: the workflow may propose a direction, but the runtime validates and writes it only after explicit learner confirmation and never creates a change automatically.
- Extend next-roadmap context resolution to consume milestone state, confirmed candidates, archived outcomes, and mastered/gap/review records.
- Make archive and next reruns idempotent, with no duplicate candidate or archived record.
- Represent learner rejection explicitly: an empty roadmap remains empty and is reported as such rather than silently inventing or creating work.

## Capabilities

### New Capabilities

<!-- None. -->

### Modified Capabilities

- `humanspec-project-context`: `roadmap.md` gains a stable milestone-state and confirmed-candidate grammar for adaptive planning.
- `humanspec-archive-feedback`: Archive feedback previews and, after confirmation, applies milestone and next-candidate updates based on canonical learner evidence.
- `humanspec-next-router`: Next explains candidate selection from current milestone and learner records and handles an explicitly empty or rejected roadmap safely.

## Impact

- Affects roadmap template/analysis, archive-feedback planning and application, next-roadmap context resolution, and the HumanSpec archive/next workflow templates.
- Builds on the public project-context runtime and canonical learning-feedback contract from the preceding changes.
- Replaces tests that manually inject a later candidate with end-to-end planner/context scenarios.
- Does not automatically create OpenSpec changes or make unconfirmed roadmap edits.
