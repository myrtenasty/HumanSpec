## MODIFIED Requirements

### Requirement: Profile Configuration Flow

The `openspec config profile` command SHALL provide an action-first interactive flow that recognizes `core`, `humanspec`, and `custom` workflow selections while explaining any project-level override.

#### Scenario: Current profile summary appears first

- **WHEN** user runs `openspec config profile` in an interactive terminal
- **THEN** display a current-state header with:
  - current delivery value
  - workflow count with profile label `core`, `humanspec`, or `custom`
  - the effective profile source when the current project declares a project-level profile

#### Scenario: Action-first menu offers skippable paths

- **WHEN** user runs `openspec config profile` interactively
- **THEN** the first prompt SHALL offer:
  - `Change delivery + workflows`
  - `Change delivery only`
  - `Change workflows only`
  - `Keep current settings (exit)`

#### Scenario: Delivery prompt marks current selection

- **WHEN** delivery selection is shown in `openspec config profile`
- **THEN** the currently configured delivery option SHALL include `[current]` in its label
- **AND** that value SHALL be preselected by default

#### Scenario: Exact HumanSpec selection derives preset

- **WHEN** the workflow selector contains exactly the registered HumanSpec workflow set
- **THEN** the saved global profile SHALL be `humanspec`
- **AND** the saved workflow order SHALL match the registered HumanSpec lifecycle order

#### Scenario: HumanSpec preset shortcut

- **WHEN** user runs `openspec config profile humanspec`
- **THEN** global profile SHALL be set to `humanspec`
- **AND** global workflows SHALL be set to the exact registered HumanSpec workflow set
- **AND** delivery SHALL be preserved

#### Scenario: Core preset shortcut remains compatible

- **WHEN** user runs `openspec config profile core`
- **THEN** the existing core preset behavior SHALL remain unchanged

#### Scenario: No-op exits without saving or apply prompt

- **WHEN** user chooses `Keep current settings (exit)` OR makes selections that do not change effective config values
- **THEN** the command SHALL print `No config changes.`
- **AND** SHALL NOT write config changes
- **AND** SHALL NOT ask to apply updates to the current project

#### Scenario: No-op warns when current project is out of sync

- **WHEN** `openspec config profile` exits with `No config changes.` inside an OpenSpec project
- **AND** project files are out of sync with the effective profile and delivery after applying project-profile precedence
- **THEN** display a non-blocking warning that configuration is not yet applied to this project
- **AND** include guidance to run `openspec update` to sync project files

#### Scenario: Project override is explained

- **WHEN** global profile changes inside a project that declares its own profile
- **THEN** output SHALL explain that the project profile continues to determine workflow membership
- **AND** SHALL distinguish any delivery change that still affects the project

#### Scenario: Apply prompt is gated on actual effective changes

- **WHEN** config values were changed and saved
- **AND** current directory is an OpenSpec project
- **AND** the change alters that project's effective workflow or delivery result
- **THEN** prompt `Apply changes to this project now?`
- **AND** if confirmed, run `openspec update` for the current project
