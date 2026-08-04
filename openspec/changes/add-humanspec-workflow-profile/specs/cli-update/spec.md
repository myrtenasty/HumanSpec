## ADDED Requirements

### Requirement: Profile-aware managed workflow reconciliation

The update command SHALL reconcile generated workflow artifacts against the same effective project profile used by init.

#### Scenario: Project HumanSpec profile overrides global core

- **WHEN** project config declares profile `humanspec`
- **AND** global config declares profile `core`
- **THEN** update SHALL generate or refresh the registered HumanSpec workflow artifacts for configured tools
- **AND** SHALL not install the core apply workflow

#### Scenario: Legacy project uses global fallback

- **WHEN** project config has no profile field
- **THEN** update SHALL preserve the existing global-profile fallback behavior
- **AND** SHALL not silently add a project profile field

#### Scenario: Switching from core to HumanSpec

- **WHEN** a project's effective profile changes from `core` to `humanspec`
- **THEN** update SHALL create or refresh all desired HumanSpec managed artifacts
- **AND** remove registered managed OpenSpec artifacts not selected by the HumanSpec profile, including the managed apply skill and command
- **AND** leave `openspec instructions apply` available as an internal CLI interface

#### Scenario: Switching from HumanSpec to core

- **WHEN** a project's effective profile changes from `humanspec` to `core`
- **THEN** update SHALL restore the registered core workflow artifacts for configured tools
- **AND** remove only registered HumanSpec managed artifacts that are no longer selected

#### Scenario: Preserve user-authored files during profile switch

- **WHEN** update removes artifacts that are no longer selected
- **THEN** every deletion target SHALL come from exact registered workflow, skill-directory, and command-descriptor lookup
- **AND** similarly named files, unregistered namespaces, and unmanaged content SHALL remain unchanged

#### Scenario: Reconciliation composes with tool behavior

- **WHEN** install scope, delivery, or command-surface capability changes the effective artifact type or location for a configured tool
- **THEN** update SHALL apply those dimensions after resolving workflow membership
- **AND** SHALL reconcile the resulting exact managed paths without partial cross-tool updates

#### Scenario: HumanSpec update is idempotent

- **WHEN** update has synchronized a HumanSpec project and no inputs subsequently change
- **THEN** a second update SHALL report no profile drift
- **AND** SHALL not rewrite, recreate, or delete unrelated files

#### Scenario: Cross-platform profile cleanup

- **WHEN** profile reconciliation runs on Windows, macOS, or Linux
- **THEN** desired and removable paths SHALL be resolved through the selected tool's adapter and platform path helpers
- **AND** cleanup SHALL not depend on forward-slash strings or case-insensitive matching
