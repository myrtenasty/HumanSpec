## ADDED Requirements

### Requirement: Project bootstrap is an external initialization prerequisite

`humanspec-init` SHALL treat project-local CLI bootstrap and HumanSpec profile installation as prerequisites established before the workflow starts. The workflow SHALL inspect those prerequisites but SHALL NOT execute or repeat bootstrap itself.

#### Scenario: HumanSpec bootstrap is ready
- **WHEN** the project configuration selects the HumanSpec profile, required generated surfaces are present, and no conflicting apply workflow is exposed
- **THEN** `humanspec-init` SHALL proceed to project-context inspection and the learner conversation
- **AND** SHALL not run `openspec init` again

#### Scenario: Bootstrap is missing or inconsistent
- **WHEN** the project has not been bootstrapped or the effective profile/surfaces are inconsistent
- **THEN** `humanspec-init` SHALL stop before project-document writes
- **AND** SHALL report the observed prerequisite failure and an external CLI command the learner can run outside the workflow

#### Scenario: Existing initialized project is revisited
- **WHEN** a valid initialized HumanSpec project invokes `humanspec-init` again
- **THEN** the workflow SHALL inspect and safely review existing project documents
- **AND** SHALL not regenerate unrelated skill or command surfaces as an initialization side effect

### Requirement: Initialization reports current responsibility boundaries accurately

Initialization output SHALL distinguish behavior owned by init from behavior already provided by next, propose, coach, verify, and archive. It SHALL not characterize an available workflow as globally unimplemented merely because init does not perform that workflow's responsibility.

#### Scenario: Initialization completes successfully
- **WHEN** project context is valid and learner-confirmed
- **THEN** init SHALL report its own completed document responsibilities
- **AND** SHALL hand off to the appropriate existing HumanSpec workflow without claiming adaptive routing, verification, or archive behavior is unavailable globally
