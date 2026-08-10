## ADDED Requirements

### Requirement: Verification records canonical learning feedback

Every verify result SHALL include one versioned, machine-readable learning-feedback region containing a learning status and zero or more typed `mastered`, `gap`, and `review` records. Empty record sets SHALL be represented by the absence of that record type, not by placeholder text that can be parsed as a topic.

#### Scenario: Software and learning both pass
- **WHEN** reproducible software evidence passes and all required learning evidence is complete
- **THEN** verify SHALL record `learning-status: complete`
- **AND** MAY record evidence-supported mastered topics, gaps, and review items

#### Scenario: Software passes but learning evidence is incomplete
- **WHEN** software evidence passes but required reflection or understanding evidence is missing
- **THEN** verify SHALL NOT record `learning-status: complete`
- **AND** SHALL record no mastered topic
- **AND** MAY record supported gaps or review items

#### Scenario: Verification fails or is inconclusive
- **WHEN** the verification disposition is failing or inconclusive
- **THEN** verify SHALL record the corresponding non-complete learning status
- **AND** MAY record evidence-supported gaps and review items
- **AND** SHALL NOT infer mastery from completed task checkboxes or passing tests alone

#### Scenario: A feedback category is empty
- **WHEN** verify has no supported record for a feedback category
- **THEN** it SHALL omit records of that type
- **AND** SHALL NOT emit `<none>`, `none`, or any equivalent placeholder as a topic value

### Requirement: Verification evaluates proposal scope and constraints

Verify SHALL evaluate the implementation and artifacts against the proposal's included scope, excluded scope, and constraints in addition to observable outcomes, requirements, tasks, and project checks.

#### Scenario: Implementation violates excluded scope
- **WHEN** implementation evidence introduces behavior, dependencies, or design explicitly excluded by the proposal
- **THEN** verify SHALL produce a blocking finding
- **AND** SHALL cite the excluded-scope statement, concrete implementation evidence, and a learner-owned next step

#### Scenario: A declared constraint cannot be established
- **WHEN** a proposal constraint is relevant but the required evidence cannot be inspected or a required check cannot run
- **THEN** verify SHALL return an inconclusive or blocking disposition as appropriate
- **AND** SHALL identify the missing evidence and how the learner can supply it

### Requirement: Every blocker is independently actionable

Each verification blocker SHALL carry its own contract reference, observed evidence, consequence, and next learner action. A single global next action SHALL NOT substitute for missing per-blocker evidence.

#### Scenario: Verification finds multiple blockers
- **WHEN** verify identifies more than one independent blocking issue
- **THEN** each blocker SHALL identify the affected outcome, requirement, scope item, constraint, task, or learning gate
- **AND** each blocker SHALL provide evidence and one bounded learner-owned next step
