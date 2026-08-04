## MODIFIED Requirements

### Requirement: Command Execution

The command SHALL scan and analyze either active changes or specs based on the selected mode.

#### Scenario: Scanning for changes (default)

- **WHEN** `openspec list` is executed without flags
- **THEN** scan the `openspec/changes/` directory for change directories
- **AND** exclude the `archive/` subdirectory from results
- **AND** resolve each change's schema-selected tracked artifact and parse its Markdown checkboxes to count task completion
- **AND** fall back to the change's top-level `tasks.md` when no tracked artifact can be resolved

#### Scenario: Scanning for specs

- **WHEN** `openspec list --specs` is executed
- **THEN** scan the `openspec/specs/` directory for capabilities
- **AND** read each capability's `spec.md`
- **AND** parse requirements to compute requirement counts

### Requirement: Task Counting

The command SHALL accurately aggregate task completion from the files matched by the change schema's `apply.tracks` value.

#### Scenario: Counting tasks in a schema-selected tracked artifact

- **WHEN** a change schema tracks a Markdown artifact such as `learning.md`
- **THEN** count completed tasks from lines containing `- [x]`
- **AND** count incomplete tasks from lines containing `- [ ]`
- **AND** calculate total tasks as the sum of completed and incomplete tasks

#### Scenario: Aggregating a tracked glob

- **WHEN** a schema's `apply.tracks` value matches more than one Markdown file inside one change
- **THEN** aggregate completed and incomplete checkboxes from exactly those matched files
- **AND** exclude files belonging to sibling or archived changes

### Requirement: Error Handling

The command SHALL gracefully handle missing files and directories with appropriate messages.

#### Scenario: Missing tracked artifact

- **WHEN** a change has no file matching its resolved tracked artifact
- **THEN** display the change with `No tasks` status

#### Scenario: Missing changes directory

- **WHEN** the `openspec/changes/` directory does not exist
- **THEN** display error: `No OpenSpec changes directory found. Run 'openspec init' first.`
- **AND** exit with code 1

