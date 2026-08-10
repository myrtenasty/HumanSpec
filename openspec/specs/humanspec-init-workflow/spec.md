# humanspec-init-workflow Specification

## Purpose

Provides the project-level HumanSpec initialization experience that turns a local CLI bootstrap into a ready learning context without taking ownership of application implementation.

## Requirements

### Requirement: Conduct the HumanSpec initialization conversation

The HumanSpec initialization workflow SHALL guide the learner through a project-context conversation after the project-local HumanSpec profile has been bootstrapped.

The conversation SHALL collect, or let the learner explicitly defer, the following information:

- project goal and target users
- technology stack and project constraints
- observable project completion criteria
- learner experience and current learning goals
- available session time budget
- preferred coaching and hint style
- an initial milestone direction, completion evidence, and candidate practice slices

The workflow SHALL propose candidate slices without creating changes during initialization. Before writing project context documents, the workflow SHALL present the collected values for learner confirmation.

#### Scenario: First initialization collects project and learner context

- **GIVEN** the project-local HumanSpec profile is installed and the project context documents do not exist
- **WHEN** the learner invokes the HumanSpec initialization workflow
- **THEN** the workflow SHALL ask for the project and learner context fields
- **AND** SHALL propose an initial milestone and candidate practice slices without creating change directories
- **AND** SHALL summarize the proposed values before creating the documents
- **AND** SHALL wait for learner confirmation before writing them

#### Scenario: Learner defers an optional context value

- **GIVEN** the learner does not yet know an optional context value such as a hint preference
- **WHEN** the learner chooses to defer that value
- **THEN** initialization SHALL remain usable
- **AND** SHALL record an explicit placeholder or deferred state rather than inventing a personal answer
- **AND** SHALL identify the deferred value for a later initialization or review

### Requirement: Create the three HumanSpec project context documents

After confirmation, the initialization workflow SHALL create the following project-level documents from the registered HumanSpec templates:

- `openspec/project.md`
- `openspec/roadmap.md`
- `openspec/learner.md`

Each generated document SHALL retain its registered frontmatter marker and required section structure. The generated roadmap SHALL contain parseable candidate-slice entries, and the generated learner document SHALL retain parseable knowledge-gap, mastered-topic, and review-item sections.

Initialization SHALL write project-planning documents only; application source files and test implementation files remain owned by the learner.

#### Scenario: Confirmed initialization creates a ready context

- **GIVEN** the learner confirms the collected project and learner context
- **WHEN** initialization writes the project context
- **THEN** all three documents SHALL exist directly beneath the project's `openspec/` directory
- **AND** each document SHALL have the correct `humanspec-*` frontmatter marker
- **AND** the documents SHALL contain the learner-confirmed values in their designated sections
- **AND** `roadmap.md` SHALL contain the confirmed milestone and parseable candidate-slice entries
- **AND** no application or test implementation file SHALL be created or changed by initialization

#### Scenario: Initialization runs on Windows, macOS, or Linux

- **GIVEN** the learner confirms initialization on any supported platform
- **WHEN** the workflow resolves the project context document paths
- **THEN** each document SHALL be written to the same logical `openspec/` location using that platform's valid path semantics
- **AND** initialization SHALL not create duplicate `.yaml`/`.yml` or platform-specific document paths

### Requirement: Handle incomplete or existing context safely

The initialization workflow SHALL distinguish missing, partially present, valid HumanSpec, and existing unmarked context documents before writing.

When an existing document would be changed, the workflow SHALL show the proposed changes and require explicit learner confirmation. Rejecting the proposed changes SHALL leave the existing document content unchanged. Values not supplied during a later run SHALL remain unchanged.

An existing unmarked `openspec/project.md`, `openspec/roadmap.md`, or `openspec/learner.md` SHALL be treated as user content requiring an explicit resolution choice; initialization SHALL not silently replace it with a HumanSpec template.

#### Scenario: Only some context documents exist

- **GIVEN** one or two HumanSpec context documents already exist and carry valid markers
- **WHEN** the learner reruns initialization
- **THEN** the workflow SHALL identify which documents are missing
- **AND** SHALL offer to create only the missing documents
- **AND** SHALL leave existing documents unchanged unless the learner explicitly confirms proposed edits

#### Scenario: Learner rejects a repeat-initialization update

- **GIVEN** an existing HumanSpec context document contains learner-authored content
- **WHEN** initialization proposes changes to that document and the learner rejects them
- **THEN** the document SHALL remain byte-for-byte unchanged
- **AND** initialization SHALL report that the document was preserved
- **AND** the workflow SHALL continue without reporting the project as fully refreshed from the rejected values

#### Scenario: An unmarked project document is present

- **GIVEN** a project document path contains a file without the registered HumanSpec frontmatter marker
- **WHEN** initialization reaches that document
- **THEN** the workflow SHALL identify the file as an existing unmarked document
- **AND** SHALL ask the learner whether to preserve it, explicitly convert it, or stop
- **AND** SHALL not overwrite or delete it without explicit confirmation

### Requirement: Report readiness and hand off to the learning loop

When the three project context documents are present with valid markers and the learner has confirmed the initialization result, the workflow SHALL report the project as ready for HumanSpec practice.

The report SHALL identify the document paths, summarize ownership boundaries, and recommend `/humanspec:next` as the next action. It SHALL not claim that adaptive routing, learning-history updates, reflection gates, or learning-aware archive behavior are implemented by this change.

#### Scenario: Successful initialization reports the next action

- **GIVEN** all three context documents were created or explicitly preserved with valid markers
- **WHEN** initialization completes
- **THEN** the workflow SHALL report the project as ready
- **AND** SHALL list the three context-document paths
- **AND** SHALL recommend `/humanspec:next`
- **AND** SHALL state that the learner remains responsible for application and test implementation

#### Scenario: Initialization cannot reach a valid ready state

- **GIVEN** a document is missing, malformed, or blocked by an unresolved unmarked file
- **WHEN** initialization reaches its final reporting step
- **THEN** the workflow SHALL report the unresolved document and the reason
- **AND** SHALL provide a concrete next action
- **AND** SHALL not claim that the project is ready

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
