## ADDED Requirements

### Requirement: Load project workflow profile configuration

The system SHALL parse optional project-level workflow profile settings from `openspec/config.yaml` and its supported `.yml` alias without discarding other valid project configuration.

#### Scenario: Named project profile is valid

- **WHEN** project config contains `profile: humanspec`
- **THEN** the returned project configuration SHALL include profile `humanspec`
- **AND** schema, context, rules, operations, references, and store fields SHALL retain their existing parsing behavior

#### Scenario: Project custom workflow selection is valid

- **WHEN** project config contains `profile: custom`
- **AND** `workflows` is an array of registered workflow ID strings
- **THEN** the returned project configuration SHALL include the custom profile and the ordered workflow selection

#### Scenario: Project profile is absent

- **WHEN** project config does not contain `profile`
- **THEN** project-config loading SHALL succeed without a profile warning
- **AND** effective profile resolution SHALL be allowed to consult global configuration

#### Scenario: Project profile value is invalid

- **WHEN** project config contains an unknown profile name or a non-string profile value
- **THEN** the system SHALL warn about the invalid profile and omit that field
- **AND** SHALL retain every other independently valid project-config field

#### Scenario: Custom workflow entries are partially invalid

- **WHEN** project config `workflows` contains non-string, empty, duplicate, or unregistered entries
- **THEN** the system SHALL retain valid registered workflow IDs in their first-declared order
- **AND** SHALL warn about each ignored entry category
- **AND** registration validity SHALL use the explicit workflow ID list rather than pattern matching

#### Scenario: Project profile in config.yml

- **WHEN** `openspec/config.yml` contains a valid project profile and `openspec/config.yaml` does not exist
- **THEN** the system SHALL load that profile using the same behavior as `config.yaml`

#### Scenario: Cross-platform project profile path

- **WHEN** project config is resolved on Windows, macOS, or Linux
- **THEN** profile loading SHALL use the existing platform-aware config path resolver
- **AND** SHALL not depend on a hardcoded path separator
