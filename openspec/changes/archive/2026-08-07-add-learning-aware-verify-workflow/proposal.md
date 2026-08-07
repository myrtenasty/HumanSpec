## Why

The current `humanspec-verify` surface can review implementation evidence, but it does not yet make learning completion observable or block a false-positive handoff when tasks or learner reflections are still incomplete. This is the next missing gate after the HumanSpec schema, project initialization, human-sized propose flow, and progressive coach flow have landed.

## What Changes

- Define a learning-aware verify workflow for one selected HumanSpec change.
- Require the workflow to resolve structured change status, artifact context, project context, practice-task progress, and learner-owned evidence before judging completion.
- Add an explicit gate for incomplete practice tasks and empty or template-only learner reflection sections.
- Map the proposal, delta specifications, completion evidence, implementation, and relevant tests or checks into pass, fail, or inconclusive findings.
- Allow the workflow to update only the reserved AI verification area of `learning.md`; it must not edit application code, test implementation, learner reflections, or task checkboxes.
- Make failed verification actionable and repeatable, with concrete blockers, evidence gaps, and a route back to `humanspec-coach`.
- Keep the generated skill and HumanSpec command on one canonical contract, including cross-platform path guidance and explicit non-goals for adaptive routing and learning-aware archive behavior.

## Capabilities

### New Capabilities

- `humanspec-verify-workflow`: Verify both software completion evidence and learning evidence for a HumanSpec practice change without taking implementation ownership.

### Modified Capabilities

<!-- No existing requirement changes are needed; the new verification behavior is isolated in its own capability. -->

## Impact

- HumanSpec workflow templates and generated skill/command projections, especially `src/core/templates/workflows/humanspec-verify.ts` and their shared descriptors.
- Focused template, projection, and cross-platform path tests.
- The existing `human-learning` artifact structure is consumed as the source of task, reflection, and verification evidence; its schema and public apply protocol remain compatible.
- No application-code editing, public apply workflow, adaptive next routing, or learning-aware archive implementation is included in this change.
