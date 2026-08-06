## Purpose

Defines the foundational project-level living-document protocol that grounds the HumanSpec learning loop — fixed paths, frontmatter markers, graded template structure, and the single shared convention by which all HumanSpec workflows read them.

Runtime initialization, archive/verification updates, and re-initialization merge confirmation are deliberately owned by later HumanSpec workflow changes. This change supplies their registered templates and cross-platform path resolver, not those write interactions.

## ADDED Requirements

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
