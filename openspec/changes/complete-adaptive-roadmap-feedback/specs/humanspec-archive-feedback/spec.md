## ADDED Requirements

### Requirement: Archive feedback previews adaptive roadmap effects

The feedback plan for an archived HumanSpec change SHALL separately preview removal of the completed candidate, the archived outcome record, the proposed current-milestone transition, learner mastered/gap/review updates, and any proposed next candidate. No milestone or candidate change SHALL be applied without explicit learner confirmation.

#### Scenario: Archived outcome advances the current milestone
- **WHEN** verified evidence supports a proposed current-milestone transition
- **THEN** the feedback preview SHALL show the exact previous and proposed lifecycle state
- **AND** confirmed application SHALL update only the identified milestone

#### Scenario: Workflow proposes a next direction
- **WHEN** verified learner records and the remaining milestone support a next practice direction
- **THEN** the workflow SHALL present the proposed change name, learning focus, and evidence-based rationale to the learner
- **AND** the runtime SHALL treat that direction as unconfirmed plan input until the learner accepts the preview

#### Scenario: Learner confirms archive feedback but rejects the candidate
- **WHEN** the learner accepts archived outcome, milestone, and learner-record updates but declines the proposed candidate
- **THEN** the accepted feedback updates SHALL remain applicable without the candidate
- **AND** the roadmap SHALL preserve an empty candidate section and report that no next direction was confirmed

### Requirement: Adaptive feedback is idempotent

Archive-feedback planning, confirmed application, and reconciliation SHALL identify archived outcomes and candidates by stable logical identity so reruns do not duplicate or resurrect records.

#### Scenario: Archive feedback is rerun after completion
- **WHEN** feedback is planned again for a change whose archived outcome and confirmed candidate were already applied
- **THEN** the plan SHALL report those effects as already applied
- **AND** SHALL propose no duplicate archived or candidate record

#### Scenario: The proposed candidate matches an existing candidate
- **WHEN** a proposed candidate has the same normalized change identity as an existing unchecked candidate
- **THEN** the plan SHALL preserve the existing candidate rather than append another copy
- **AND** SHALL report whether its learning focus is compatible or conflicting

#### Scenario: Reconciliation resumes a pending adaptive update
- **WHEN** roadmap milestone or candidate writing was interrupted after canonical archive
- **THEN** reconciliation SHALL reconstruct the same confirmed adaptive effects from persisted evidence
- **AND** SHALL not ask a model to invent a different candidate during retry

### Requirement: Archive feedback never creates the next change

Recording or confirming a next candidate SHALL only update the registered roadmap document. Change creation SHALL remain an explicit later `humanspec-propose` action.

#### Scenario: Candidate is applied to roadmap
- **WHEN** archive feedback writes a confirmed next candidate
- **THEN** no directory SHALL be created under the active changes location
- **AND** no proposal, spec, design, learning, or task artifact SHALL be generated for that candidate
