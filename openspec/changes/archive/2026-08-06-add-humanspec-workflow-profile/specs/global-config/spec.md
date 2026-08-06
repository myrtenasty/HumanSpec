## MODIFIED Requirements

### Requirement: Default Configuration

The system SHALL provide a backward-compatible default configuration that is used when no global config file exists.

#### Scenario: Default config structure

- **WHEN** no global config file exists
- **THEN** the default configuration SHALL include an empty `featureFlags` object
- **AND** profile SHALL be `core`
- **AND** delivery SHALL retain its existing default

## ADDED Requirements

### Requirement: Named HumanSpec global profile value

Global configuration SHALL recognize `humanspec` as a named workflow-profile preset without changing the default for existing users.

#### Scenario: Load HumanSpec global profile

- **WHEN** global config contains `"profile": "humanspec"`
- **THEN** the configuration SHALL load successfully with profile `humanspec`
- **AND** effective-profile resolution MAY use it when no CLI or project profile overrides it

#### Scenario: Existing core and custom profiles remain valid

- **WHEN** global config contains profile `core` or `custom`
- **THEN** it SHALL preserve its existing profile and workflow-selection behavior

#### Scenario: Older config lacks profile

- **WHEN** an existing global config has no profile field
- **THEN** schema evolution SHALL supply the `core` default
- **AND** SHALL preserve every unrelated existing field

#### Scenario: Invalid global profile

- **WHEN** global config contains an unsupported profile value
- **THEN** the system SHALL warn and use the `core` fallback for profile resolution
- **AND** SHALL preserve unrelated valid configuration fields
