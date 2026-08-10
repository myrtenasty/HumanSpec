## ADDED Requirements

### Requirement: Roadmap milestones have stable lifecycle state

Each HumanSpec roadmap milestone SHALL have a stable identity and one parseable lifecycle status chosen from `planned`, `active`, `completed`, or `paused`. At most one milestone SHALL be active at a time, and human-authored milestone outcome, learning focus, and completion evidence SHALL remain editable independently of the status token.

#### Scenario: A new roadmap is initialized
- **WHEN** HumanSpec creates the first roadmap
- **THEN** its first milestone SHALL be marked `active`
- **AND** any additional milestone SHALL be marked `planned` unless the learner explicitly pauses it

#### Scenario: An existing roadmap predates milestone status
- **WHEN** a valid HumanSpec roadmap has milestone headings but no lifecycle tokens
- **THEN** analysis SHALL preserve the document and report the inferred current milestone separately
- **AND** a lifecycle token SHALL be persisted only in a learner-confirmed update

#### Scenario: Milestone state is ambiguous
- **WHEN** a roadmap declares multiple active milestones or an unsupported lifecycle token
- **THEN** project-context analysis SHALL report a blocking structural issue
- **AND** archive feedback and next SHALL not guess which milestone to advance

### Requirement: Adaptive candidates preserve the registered slice grammar

A next candidate proposed from learner feedback SHALL use the registered candidate-slice identity and remain a proposal in `roadmap.md`; it SHALL not imply that a change directory exists.

#### Scenario: A confirmed candidate is recorded
- **WHEN** the learner confirms one proposed next direction
- **THEN** the roadmap SHALL contain one unchecked `slice` record with a valid change name and learning focus
- **AND** the record SHALL remain editable by the learner

#### Scenario: Candidate is rejected
- **WHEN** the learner rejects the proposed next direction and no other candidate exists
- **THEN** the candidate section SHALL remain explicitly empty
- **AND** no placeholder or automatically created change SHALL be inserted
