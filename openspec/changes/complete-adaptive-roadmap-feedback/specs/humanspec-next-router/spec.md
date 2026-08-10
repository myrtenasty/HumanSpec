## ADDED Requirements

### Requirement: Next explains adaptive candidate fit from durable state

When routing from a ready project with no active change, `humanspec-next` SHALL evaluate confirmed roadmap candidates against the active milestone, project constraints, learner profile, and durable mastered/gap/review records. It SHALL expose the evidence used for its choice and hand off to propose rather than creating the change itself.

#### Scenario: One confirmed candidate fits the current learner state
- **WHEN** exactly one confirmed candidate fits the active milestone and learner context
- **THEN** next SHALL name that candidate
- **AND** SHALL explain its fit using relevant milestone and mastered/gap/review evidence
- **AND** SHALL hand off to `humanspec-propose` for confirmation

#### Scenario: Multiple candidates remain plausible
- **WHEN** more than one confirmed candidate fits and durable evidence does not establish a unique choice
- **THEN** next SHALL present the bounded alternatives and their evidence
- **AND** SHALL require the learner to select rather than silently choosing one

#### Scenario: Feedback reconciliation is pending
- **WHEN** the most recent archive still has pending roadmap or learner feedback
- **THEN** next SHALL route to reconciliation before evaluating a candidate
- **AND** SHALL not reason from partially updated learner state

### Requirement: Next reports an intentionally empty roadmap

An empty candidate set after archive or learner rejection SHALL be an explicit route state, not permission to invent or create a candidate.

#### Scenario: Learner rejected the only proposed candidate
- **WHEN** there is no active change, feedback is complete, and the candidate section is empty because no direction was confirmed
- **THEN** next SHALL report that the roadmap currently has no confirmed candidate
- **AND** SHALL invite the learner to explore or propose a direction without writing one automatically

#### Scenario: Last prewritten candidate was archived
- **WHEN** the last candidate was archived and adaptive planning produced no confirmed replacement
- **THEN** next SHALL not re-propose the archived change
- **AND** SHALL use the empty route behavior
