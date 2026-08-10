## ADDED Requirements

### Requirement: Next and propose share one candidate-sizing contract

Before handing a roadmap candidate to propose, `humanspec-next` SHALL evaluate candidate fit using the same sizing criteria and meanings as `humanspec-propose`. A candidate SHALL not be described as fitting when propose would reject the same durable project and learner context as oversized.

#### Scenario: Candidate satisfies the shared contract
- **WHEN** a confirmed candidate has one observable outcome, clear completion evidence, acceptable concept/platform load, and fits the learner's session budget
- **THEN** next SHALL explain the matching sizing evidence
- **AND** SHALL hand the unchanged candidate identity to propose for confirmation

#### Scenario: Candidate is too large for the current learner context
- **WHEN** a candidate violates any shared sizing criterion
- **THEN** next SHALL not silently select it as fitting
- **AND** SHALL explain the violated criteria and route to learner-confirmed refinement or propose-based splitting

#### Scenario: Propose re-evaluates a candidate without context changes
- **WHEN** next hands off a candidate and the project, learner, milestone, and request context have not changed
- **THEN** propose SHALL reach the same fit or oversized classification
- **AND** any later difference SHALL identify the context that changed
