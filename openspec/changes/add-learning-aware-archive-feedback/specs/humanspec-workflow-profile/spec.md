# humanspec-workflow-profile Specification

## MODIFIED Requirements

### Requirement: Human implementation ownership contract

Every HumanSpec workflow template SHALL preserve the learner's ownership of application and test implementation.

#### Scenario: Shared implementation boundary

- **WHEN** a HumanSpec workflow is invoked
- **THEN** its instructions SHALL state that the human learner writes application code and test implementation code
- **AND** AI activity SHALL be limited to the workflow's declared planning, explanation, inspection, diagnosis, review, hint, verification-record, or archival responsibility

#### Scenario: Initial workflow write boundaries

- **WHEN** the initial HumanSpec workflow templates are generated
- **THEN** they SHALL declare these maximum write boundaries:
  - init: project planning documents
  - next: routing and guidance only
  - propose: change planning artifacts
  - coach: no implementation writes
  - verify: review output and the reserved AI verification area of `learning.md`
  - archive: specifications, planning records, archive paths, and explicitly confirmed roadmap and learner feedback records
  - explore: no implementation writes

#### Scenario: Later workflow behavior is not implied

- **WHEN** the HumanSpec profile is installed before later roadmap workflow changes are implemented
- **THEN** its generated templates SHALL identify their current responsibility and safety boundary
- **AND** SHALL NOT claim that unimplemented reflection gates, adaptive routing, or other deferred workflow behavior has already completed
- **AND** SHALL describe learning-aware archive feedback as implemented only when the archive-feedback contract and its confirmation and retry behavior are available
