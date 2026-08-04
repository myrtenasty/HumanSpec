## MODIFIED Requirements

### Requirement: Task Completion Check

The command SHALL verify task completion in the change schema's tracked artifact before archiving to prevent premature archival.

#### Scenario: Incomplete tracked tasks found

- **WHEN** one or more files selected by `apply.tracks` contain tasks marked with `- [ ]`
- **THEN** display the incomplete task status to the user
- **AND** prompt for confirmation to continue
- **AND** default to `No` for safety

#### Scenario: All tracked tasks complete

- **WHEN** every task in the schema-selected tracked files is complete
- **THEN** proceed with archiving without an incomplete-task prompt

#### Scenario: No tracked task artifact exists

- **WHEN** the schema has no resolvable tracked artifact or no matching tracked file exists
- **THEN** preserve the existing no-task archive behavior
- **AND** proceed without an incomplete-task prompt

#### Scenario: Learning tasks control archive readiness

- **WHEN** a `human-learning` change tracks `learning.md`
- **AND** `learning.md` contains an incomplete practice task
- **THEN** archive treats that task as incomplete even though no `tasks.md` exists

#### Scenario: Tracked tasks resolve on Windows

- **WHEN** a change and its tracked artifact are stored beneath a Windows project path
- **THEN** archive resolves the tracked files beneath that change directory using valid Windows paths
- **AND** does not count tasks from sibling or archived changes

