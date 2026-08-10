# humanspec-project-context Specification

## Purpose

Defines the foundational project-level living-document protocol that grounds the HumanSpec learning loop — fixed paths, frontmatter markers, graded template structure, and the single shared convention by which all HumanSpec workflows read them.

Runtime initialization, archive/verification updates, and re-initialization merge confirmation are deliberately owned by later HumanSpec workflow changes. This change supplies their registered templates and cross-platform path resolver, not those write interactions.

## Requirements

### Requirement: Project context documents

The system SHALL recognize three project-level documents as the HumanSpec project context: `project.md`, `roadmap.md`, and `learner.md`, located directly under the project's `openspec/` directory.

Each document SHALL begin with a YAML frontmatter block that declares its document type with `type: humanspec-project` (project.md), `type: humanspec-roadmap` (roadmap.md), or `type: humanspec-learner` (learner.md), so that the file's nature is self-describing to any tool or cleanup routine.

#### Scenario: Document paths resolve cross-platform

- **WHEN** a HumanSpec workflow or cleanup routine resolves a context-document path
- **THEN** the paths for `project.md`, `roadmap.md`, and `learner.md` SHALL be constructed with platform-appropriate path joining beneath `openspec/`
- **AND** the same relative layout SHALL hold on Windows, macOS, and Linux

#### Scenario: Every document carries its marker

- **WHEN** any of the three context documents exists
- **THEN** its first line SHALL be `---` opening a frontmatter block
- **AND** the frontmatter SHALL contain a `type:` field matching the document's role

### Requirement: Graded document structure

The system SHALL structure the three context documents for different consumption patterns:

- `project.md` SHALL use fixed markdown section headings with prose content, optimized for human reading and maintenance.
- `roadmap.md` SHALL list candidate practice slices as individually parseable list items, each carrying a slice name and learning focus, so a router workflow can select one without free-text parsing.
- `learner.md` SHALL represent machine-updatable records (knowledge gaps, mastered topics, review items) as individually parseable list entries.

#### Scenario: Candidate slice grammar is available

- **WHEN** a workflow reads the registered `roadmap.md` template
- **THEN** every candidate slice placeholder SHALL use the documented parseable list-entry grammar

#### Scenario: Learner record grammar is available

- **WHEN** a workflow reads the registered `learner.md` template
- **THEN** the designated gaps, mastered-topics, and review-item sections SHALL contain individually parseable list-entry placeholders

### Requirement: Single shared reading convention

The system SHALL define the project document paths and their purposes in exactly one shared source, and every generated HumanSpec workflow skill and command SHALL reference that source rather than embedding its own copies.

#### Scenario: All workflows carry the convention

- **WHEN** a HumanSpec project generates its workflow skills and commands
- **THEN** each generated surface SHALL include the shared convention naming the three document paths and their reading purpose

#### Scenario: Convention stays consistent

- **WHEN** the shared convention is updated
- **THEN** every generated workflow surface reflects the update
- **AND** no generated surface SHALL hardcode a document path outside the shared source

### Requirement: Packaged project-document registry

The published package SHALL contain the complete registered templates and metadata for `project.md`, `roadmap.md`, and `learner.md`. Project-context consumers SHALL receive the same template content, document identity, and target-path behavior from a packed installation as from the source repository.

#### Scenario: Templates are read from a packed installation
- **WHEN** a caller requests all registered HumanSpec project-document templates through the packed CLI
- **THEN** the result SHALL include exactly the three explicitly registered document identities
- **AND** each template SHALL retain its frontmatter marker, version, required headings, comments, and default grammar

#### Scenario: Package asset is missing
- **WHEN** a registered template asset is absent or unreadable in an installed package
- **THEN** project-context inspection SHALL fail with an actionable structured issue
- **AND** SHALL NOT silently synthesize an approximate replacement template

#### Scenario: Registered paths are resolved on Windows
- **WHEN** template target paths are requested for a planning home on Windows
- **THEN** the three targets SHALL be resolved with platform path semantics beneath that planning home
- **AND** SHALL match the targets used by classification and mutation operations

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
