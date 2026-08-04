## MODIFIED Requirements

### Requirement: Apply Instructions Command

The system SHALL generate schema-aware apply instructions and task progress via `openspec instructions apply`.

#### Scenario: Generate apply instructions

- **WHEN** a user runs `openspec instructions apply --change <id>`
- **AND** all required artifacts from the schema's `apply.requires` exist or are satisfied
- **THEN** the system outputs the existing context files grouped by artifact ID
- **AND** outputs the schema-specific instruction text
- **AND** resolves the progress tracking file or files selected by `apply.tracks`
- **AND** reports checkbox progress and the parsed tasks from those tracked files

#### Scenario: Apply blocked by missing artifacts

- **WHEN** a user runs `openspec instructions apply --change <id>`
- **AND** required artifacts are missing
- **THEN** the system indicates apply is blocked
- **AND** lists which artifacts must be created first

#### Scenario: Apply instructions JSON output

- **WHEN** a user runs `openspec instructions apply --change <id> --json`
- **THEN** the system outputs JSON with `contextFiles` mapping artifact IDs to existing files
- **AND** includes the schema-specific `instruction`
- **AND** identifies the resolved tracked path or paths when `apply.tracks` is configured
- **AND** identifies the artifact IDs from `apply.requires`
- **AND** includes completed, remaining, and total task counts
- **AND** includes each parsed task's identifier, description, and completion state in document order

#### Scenario: Non-tasks artifact supplies progress

- **WHEN** a schema configures `apply.tracks: learning.md`
- **AND** the change's `learning.md` contains completed and incomplete checkboxes
- **THEN** apply instructions report progress from `learning.md`
- **AND** do not require a `tasks.md` file

#### Scenario: Tracked path is resolved on Windows

- **WHEN** apply instructions are generated for a change under a Windows project path
- **THEN** each returned tracked and context file path is a valid resolved Windows path beneath the selected change directory
- **AND** task parsing reads the same files that the schema selected

