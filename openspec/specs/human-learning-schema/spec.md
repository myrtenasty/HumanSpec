# human-learning-schema Specification

## Purpose

Define the built-in learning workflow that lets a person implement a small change while OpenSpec tracks planning artifacts, practice tasks, and reflection evidence.

## Requirements

### Requirement: Built-in human-learning schema availability

The system SHALL provide `human-learning` as a package schema that users can select when creating a change.

#### Scenario: Schema appears in structured discovery

- **WHEN** a user runs `openspec schemas --json`
- **THEN** the result includes a schema named `human-learning`
- **AND** its source is `package`
- **AND** its artifacts are `proposal`, `specs`, and `learning`

#### Scenario: User creates a learning change

- **WHEN** a user runs `openspec new change practice-routing --schema human-learning`
- **THEN** the change metadata binds the change to `human-learning`
- **AND** subsequent status and instructions commands resolve that package schema

### Requirement: Human learning artifact sequence

The `human-learning` schema SHALL guide users through proposal, optional delta specifications, and a learning artifact in dependency order.

#### Scenario: Behavioral change follows the complete sequence

- **WHEN** a `human-learning` change does not declare `skip_specs: true`
- **THEN** `proposal` is the first ready artifact
- **AND** `specs` becomes ready after `proposal` exists
- **AND** `learning` becomes ready after both `proposal` and `specs` are satisfied

#### Scenario: Non-behavioral change skips specifications

- **WHEN** a `human-learning` change declares `skip_specs: true`
- **AND** its proposal exists
- **AND** no file exists under the change's `specs` directory
- **THEN** status reports `specs` as skipped
- **AND** status reports `learning` as ready

#### Scenario: Learning artifact completes planning

- **WHEN** the required proposal and specification state is satisfied
- **AND** `learning.md` exists
- **THEN** status reports all required planning artifacts as satisfied
- **AND** apply instructions are available for the human practice phase

### Requirement: Learning-oriented artifact guidance

The `human-learning` schema SHALL provide co-located templates and instructions that keep each change focused on one observable behavior slice and one primary learning goal.

#### Scenario: Proposal guidance is requested

- **WHEN** a user requests proposal instructions for a `human-learning` change
- **THEN** the guidance asks for the reason, one observable outcome, included and excluded scope, constraints, and completion evidence
- **AND** it advises splitting work that requires a long architecture design or multiple independent outcomes

#### Scenario: Specification guidance is requested

- **WHEN** a user requests specs instructions for a `human-learning` change
- **THEN** the guidance asks for testable observable behavior and scenarios
- **AND** it permits `skip_specs: true` only when the change has no behavior contract to add or modify

#### Scenario: Learning guidance is requested

- **WHEN** a user requests learning instructions for a `human-learning` change
- **THEN** the guidance assigns one primary learning goal and no more than two supporting concepts
- **AND** it asks for two to five independently verifiable practice tasks sized for one configured learning session
- **AND** it distinguishes AI-authored planning and verification fields from human-authored reflection fields

### Requirement: Stable learning artifact structure

The `learning.md` template SHALL provide explicit sections for the learning contract, prior understanding, practice tasks, stuck-state evidence, reflection, and AI verification.

#### Scenario: Learning template is rendered

- **WHEN** learning instructions return the `learning.md` template
- **THEN** the template contains sections named `本次学习契约`, `开始前`, `实践任务`, `卡住时的记录`, `完成后`, and `AI 验证记录`
- **AND** practice tasks use Markdown checkbox placeholders
- **AND** human reflection fields remain available for the learner to complete

### Requirement: Human-owned implementation phase

The `human-learning` schema SHALL make `learning.md` the prerequisite and tracked checklist for implementation, and its apply guidance SHALL preserve implementation ownership for the human learner.

#### Scenario: Apply configuration is resolved

- **WHEN** a `human-learning` change has a completed `learning` artifact
- **THEN** apply instructions report `learning` as the required artifact
- **AND** resolve the tracked file to that change's `learning.md`

#### Scenario: Human implementation boundary is presented

- **WHEN** apply instructions are requested for a `human-learning` change
- **THEN** the instruction states that the human learner writes application and test implementation code
- **AND** it limits AI assistance to explanation, inspection, diagnosis, review, and progressive hints

### Requirement: Cross-platform learning artifact paths

The system SHALL resolve the `human-learning` schema and its generated artifact paths consistently on Windows, macOS, and Linux.

#### Scenario: Windows change paths

- **WHEN** a `human-learning` change is resolved from a Windows project path
- **THEN** status and instructions identify `proposal.md`, `specs`, and `learning.md` beneath that change directory using valid Windows paths
- **AND** task tracking resolves the same `learning.md` file without relying on forward-slash path separators
