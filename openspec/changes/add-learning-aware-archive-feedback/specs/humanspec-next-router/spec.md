# humanspec-next-router Specification

## MODIFIED Requirements

### Requirement: Next routes practice and learning evidence in order

The workflow MUST keep implementation, task completion, reflection, verification, archiving, and post-archive feedback in the order defined by the selected change's learning contract.

#### Scenario: Practice tasks remain

- **GIVEN** planning artifacts are complete and at least one practice task in `learning.md` remains unchecked
- **WHEN** the learner invokes `humanspec-next`
- **THEN** the workflow names the next learner-owned task and routes to `humanspec-coach` when help is needed, while leaving implementation code, task checkboxes, and reflections unchanged

#### Scenario: Tasks are complete but reflection is unfinished

- **GIVEN** all practice tasks are complete but a required pre-practice, stuck-state, or post-practice reflection still contains only a placeholder or no learner evidence
- **WHEN** the learner invokes `humanspec-next`
- **THEN** the workflow asks the learner to complete the named reflection section and does not route to verify or archive yet

#### Scenario: Reflection is complete and verification has not passed

- **GIVEN** practice tasks and required reflections contain learner evidence and verification is absent or failed
- **WHEN** the learner invokes `humanspec-next`
- **THEN** the workflow routes to `humanspec-verify` when evidence is ready, or to `humanspec-coach` with the reported blocker when another practice attempt is needed

#### Scenario: Verification has passed

- **GIVEN** verification has a passing disposition for the selected change
- **WHEN** the learner invokes `humanspec-next`
- **THEN** the workflow routes to `humanspec-archive`
- **AND** identifies archive and feedback reconciliation as prerequisites before selecting another slice
- **AND** does not claim that roadmap or learner feedback is complete before the archive workflow confirms it

#### Scenario: Archive feedback is still pending

- **GIVEN** a change has been archived but the registered roadmap or learner feedback record is explicitly marked pending reconciliation
- **WHEN** the learner invokes `humanspec-next` with no active change
- **THEN** the workflow SHALL route to reconciliation for that archived outcome
- **AND** SHALL not select a new candidate or re-propose the archived change until the pending state is resolved

#### Scenario: A later routing run consumes archived feedback

- **GIVEN** a change has been successfully archived and its confirmed feedback has updated the registered roadmap and learner documents
- **WHEN** the learner invokes `humanspec-next` with no active change
- **THEN** the workflow SHALL exclude the archived slice from pending candidates
- **AND** SHALL use the updated learner topics, gaps, review items, and milestone state when explaining the next candidate
- **AND** SHALL not recreate or re-propose the archived change solely because its original name remains in historical records
