# humanspec-workflow-profile Specification

## Purpose
TBD: Define the named HumanSpec workflow profile and its generated identities.

## Requirements

### Requirement: Named HumanSpec workflow profile

The system SHALL provide a named `humanspec` profile for project-level human-owned implementation workflows.

#### Scenario: Resolve HumanSpec profile membership

- **WHEN** the effective workflow profile is `humanspec`
- **THEN** the selected workflows SHALL be, in lifecycle order:
  - `humanspec-init`
  - `humanspec-next`
  - `humanspec-propose`
  - `humanspec-coach`
  - `humanspec-verify`
  - `humanspec-archive`
  - `humanspec-explore`

#### Scenario: HumanSpec profile excludes implementation workflow

- **WHEN** the effective workflow profile is `humanspec`
- **THEN** the generated workflow set SHALL contain neither `apply` nor `humanspec-apply`
- **AND** SHALL omit every other OpenSpec workflow not explicitly listed in the HumanSpec profile

#### Scenario: Exact workflow selection derives named profile

- **WHEN** a user selects exactly the seven HumanSpec workflows
- **THEN** the system SHALL identify the selection as the named `humanspec` profile
- **AND** any different selection that is not exactly `core` SHALL be identified as `custom`

### Requirement: Stable HumanSpec generated identities

Every HumanSpec workflow SHALL have a stable workflow ID, skill directory, and command identity.

#### Scenario: Generate HumanSpec skills

- **WHEN** HumanSpec workflows are delivered as skills
- **THEN** each workflow SHALL generate `humanspec-<action>/SKILL.md` beneath the selected tool's skills directory
- **AND** `<action>` SHALL be one of `init`, `next`, `propose`, `coach`, `verify`, `archive`, or `explore`

#### Scenario: Generate namespaced HumanSpec commands

- **WHEN** HumanSpec workflows are delivered through a directory-namespaced command adapter
- **THEN** their public invocations SHALL be `/humanspec:init`, `/humanspec:next`, `/humanspec:propose`, `/humanspec:coach`, `/humanspec:verify`, `/humanspec:archive`, and `/humanspec:explore`

#### Scenario: Generate flat HumanSpec commands

- **WHEN** HumanSpec workflows are delivered through a flat command adapter
- **THEN** their public invocations SHALL use `/humanspec-<action>`

#### Scenario: Generate non-slash HumanSpec commands

- **WHEN** a tool declares a non-slash invocation prefix
- **THEN** HumanSpec commands SHALL use that prefix with the HumanSpec namespace
- **AND** Amazon Q SHALL expose each entry as `@humanspec-<action>`

#### Scenario: Generate HumanSpec paths on Windows

- **WHEN** a HumanSpec skill or command is generated on Windows
- **THEN** its filesystem path SHALL be constructed beneath the tool's declared project directory using Windows-valid separators
- **AND** its public command identity SHALL remain the same as on macOS and Linux

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

### Requirement: OpenSpec compatibility and internal apply protocol

The HumanSpec profile SHALL coexist with existing OpenSpec workflow profiles and internal task-progress APIs.

#### Scenario: Existing OpenSpec core profile remains available

- **WHEN** an existing project resolves the `core` profile
- **THEN** it SHALL retain the existing OpenSpec core workflow membership and generated identities
- **AND** HumanSpec workflow installation SHALL not be implied

#### Scenario: Advanced custom profile remains available

- **WHEN** a user selects a custom set of registered workflows
- **THEN** the system SHALL continue to generate that explicit set, including OpenSpec workflows when selected

#### Scenario: Internal apply instructions remain available

- **WHEN** a HumanSpec workflow needs structured artifact context or practice-task progress
- **THEN** `openspec instructions apply --change <name> --json` SHALL remain available as an internal interface
- **AND** schema `apply.requires` and `apply.tracks` behavior SHALL remain unchanged

### Requirement: HumanSpec registration parity

All generated-artifact consumers SHALL agree on the exact HumanSpec workflow registrations.

#### Scenario: Registration projections remain aligned

- **WHEN** generation parity tests run
- **THEN** profile membership, template projection, skill directory names, command descriptors, detection, onboarding, drift checks, and managed cleanup SHALL enumerate the same seven HumanSpec workflow IDs
- **AND** a missing or extra projection SHALL fail the test suite

#### Scenario: Cleanup uses explicit registered identities

- **WHEN** HumanSpec managed artifacts are reconciled
- **THEN** deletion targets SHALL be obtained through exact workflow and command descriptor lookup
- **AND** SHALL NOT be inferred from filename patterns or namespace-wide globs
