## ADDED Requirements

### Requirement: Verification identifies follow-up learning separately

Verification output SHALL distinguish implementation blockers, non-blocking implementation suggestions, and follow-up learning items. Follow-up learning SHALL be grounded in verification evidence and SHALL not be reduced to one generic next action.

#### Scenario: Verification discovers a non-blocking learning gap
- **WHEN** software and required learning gates pass but evidence reveals a concept worth revisiting
- **THEN** verify SHALL record it as a follow-up learning or review item
- **AND** SHALL not misclassify it as an implementation blocker

#### Scenario: Verification has no supported follow-up item
- **WHEN** evidence supports no additional learning recommendation
- **THEN** verify SHALL report an empty follow-up category without inventing a topic

### Requirement: Verification feedback preserves the no-complete-solution boundary

Failing or inconclusive verification SHALL explain findings, evidence, and bounded next actions but SHALL NOT provide a complete copy-ready implementation, test suite, patch, or end-to-end solution that transfers implementation ownership from the learner.

#### Scenario: Learner asks verify for the complete fix
- **WHEN** a verification result is failing and the learner asks for a ready-to-apply solution
- **THEN** verify SHALL restate the evidence-backed blocker and one bounded learner action
- **AND** SHALL direct the learner to self-implementation or progressive coaching instead of outputting a complete patch

#### Scenario: A local example is needed to clarify evidence
- **WHEN** verify must explain the shape of a missing contract or test observation
- **THEN** it MAY provide a bounded, non-complete example
- **AND** the example SHALL not implement the full affected behavior
