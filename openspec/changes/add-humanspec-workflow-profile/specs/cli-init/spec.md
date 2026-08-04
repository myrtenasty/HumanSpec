## ADDED Requirements

### Requirement: Effective workflow profile resolution during init

The init command SHALL resolve one effective workflow profile before planning any generated or removed workflow artifacts.

#### Scenario: Explicit profile override wins

- **WHEN** user initializes or extends a project with an explicit `--profile <name>`
- **THEN** init SHALL use that profile ahead of project and global configuration
- **AND** SHALL report that the profile source is the CLI override

#### Scenario: Project profile wins over global profile

- **WHEN** init runs without an explicit profile
- **AND** project config declares a valid profile
- **THEN** init SHALL use the project profile and its project custom workflows when applicable
- **AND** SHALL not replace it with the global profile

#### Scenario: Global and default fallback

- **WHEN** neither CLI nor project config supplies a valid profile
- **THEN** init SHALL use the valid global profile and workflows
- **AND** SHALL fall back to `core` when no valid global profile exists

#### Scenario: Resolve before writes

- **WHEN** effective profile or workflow selection is invalid
- **THEN** init SHALL fail before creating, overwriting, or deleting generated workflow artifacts
- **AND** SHALL provide actionable correction guidance

## MODIFIED Requirements

### Requirement: Skill Generation

The command SHALL generate Agent Skills for selected AI tools according to the effective workflow profile.

#### Scenario: Generating skills for a tool

- **WHEN** a tool supporting skill delivery is selected during initialization
- **THEN** create one managed skill directory for every workflow in the effective profile
- **AND** create no skill directory for a registered workflow outside that profile
- **AND** each `SKILL.md` SHALL contain YAML frontmatter with name and description
- **AND** each `SKILL.md` SHALL contain the selected workflow's instructions

#### Scenario: Generating HumanSpec skills

- **WHEN** the effective profile is `humanspec`
- **AND** the selected tool supports skill delivery
- **THEN** create exactly the seven registered `humanspec-<action>/SKILL.md` files beneath that tool's skills directory
- **AND** SHALL not create `openspec-apply-change/SKILL.md`

#### Scenario: Core and custom skill generation remain compatible

- **WHEN** the effective profile is `core` or `custom`
- **THEN** init SHALL generate the corresponding existing registered workflow skills
- **AND** SHALL preserve their current names and content except for separately approved template changes

### Requirement: Slash Command Generation

The command SHALL generate command files for the effective workflow profile using each selected tool's supported command surface and registered command identities.

#### Scenario: Generating commands for a tool with a registered adapter

- **WHEN** a selected tool has a registered command adapter
- **AND** the effective delivery includes adapter-generated commands
- **THEN** create one command file for every command-bearing workflow in the effective profile
- **AND** create no command file for a registered workflow outside that profile
- **AND** use the adapter's path and frontmatter conventions

#### Scenario: Generating HumanSpec commands

- **WHEN** the effective profile is `humanspec`
- **AND** the selected tool receives adapter-generated commands
- **THEN** create exactly the seven HumanSpec command descriptors in the `humanspec` namespace
- **AND** SHALL not create an `opsx` apply command

#### Scenario: Selected tool has no command adapter

- **GIVEN** a selected tool has a skills directory but no registered command adapter
- **WHEN** initialization includes command generation under the currently resolved command-surface rules
- **THEN** skill generation for that tool SHALL remain valid
- **AND** command-file behavior and messaging SHALL follow that tool's resolved command-surface capability

#### Scenario: Core command generation remains compatible

- **WHEN** the effective profile is `core`
- **THEN** every existing OpenSpec command SHALL retain its current `opsx` identity and tool-specific path

### Requirement: Config File Generation

The command SHALL create or extend project configuration with schema settings and persistent workflow-profile intent.

#### Scenario: Creating config.yaml

- **WHEN** initialization completes and no project config exists
- **THEN** create `openspec/config.yaml` with the default schema setting and resolved named profile
- **AND** display the config location and effective profile in output

#### Scenario: Persisting explicit profile in existing config

- **WHEN** initialization runs in extend mode with an explicit profile override
- **AND** `openspec/config.yaml` or `openspec/config.yml` already exists
- **THEN** update only the profile-related fields required by the explicit selection
- **AND** preserve all other valid fields, user-authored content, and comments
- **AND** retain the existing file extension

#### Scenario: Preserving existing config without override

- **WHEN** initialization runs in extend mode without an explicit profile override
- **AND** project config already exists
- **THEN** preserve the existing config file without adding or changing a project profile
- **AND** display the effective profile and its source

#### Scenario: Cross-platform project config write

- **WHEN** profile configuration is created or updated on Windows, macOS, or Linux
- **THEN** init SHALL resolve the existing or new config path with platform-aware path helpers
- **AND** SHALL never create both `.yaml` and `.yml` variants for one project
