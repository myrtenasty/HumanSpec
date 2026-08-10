## ADDED Requirements

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
