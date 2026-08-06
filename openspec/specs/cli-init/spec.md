# CLI Init Specification

## Purpose

The `openspec init` command SHALL create a complete OpenSpec directory structure in any project, enabling immediate adoption of OpenSpec conventions with support for multiple AI coding assistants.
## Requirements
### Requirement: Progress Indicators

The command SHALL display progress indicators during initialization to provide clear feedback about each step.

#### Scenario: Displaying initialization progress

- **WHEN** executing initialization steps
- **THEN** validate environment silently in background (no output unless error)
- **AND** display progress with ora spinners:
  - Show spinner: "⠋ Creating OpenSpec structure..."
  - Then success: "✔ OpenSpec structure created"
  - Show spinner: "⠋ Configuring AI tools..."
  - Then success: "✔ AI tools configured"

### Requirement: Directory Creation

The command SHALL create the OpenSpec directory structure with config file.

#### Scenario: Creating OpenSpec structure

- **WHEN** `openspec init` is executed
- **THEN** create the following directory structure:
```
openspec/
├── config.yaml
├── specs/
└── changes/
    └── archive/
```

### Requirement: AI Tool Configuration

The command SHALL configure AI coding assistants with skills and slash commands using a searchable multi-select experience.

#### Scenario: Prompting for AI tool selection

- **WHEN** run interactively
- **THEN** display animated welcome screen with OpenSpec logo
- **AND** present a searchable multi-select that shows all available tools
- **AND** mark already configured tools with "(configured ✓)" indicator
- **AND** pre-select configured tools for easy refresh
- **AND** sort configured tools to appear first in the list
- **AND** allow filtering by typing to search

#### Scenario: Selecting tools to configure

- **WHEN** user selects tools and confirms
- **THEN** generate skills in `.<tool>/skills/` directory for each selected tool
- **AND** generate slash commands for each selected tool with a command adapter, at that adapter's own path (for example `.claude/commands/opsx/<id>.md` or `.cursor/commands/opsx-<id>.md`)
- **AND** create `openspec/config.yaml` with default schema setting

### Requirement: Interactive Mode
The command SHALL provide an interactive menu for AI tool selection with clear navigation instructions.
#### Scenario: Displaying interactive menu
- **WHEN** run in fresh or extend mode
- **THEN** present a looping select menu that lets users toggle tools with Space and review selections with Enter
- **AND** when Enter is pressed on a highlighted selectable tool that is not already selected, automatically add it to the selection before moving to review so the highlighted tool is configured
- **AND** label already configured tools with "(already configured)" while keeping disabled options marked "coming soon"
- **AND** change the prompt copy in extend mode to "Which AI tools would you like to add or refresh?"
- **AND** display inline instructions clarifying that Space toggles tools and Enter selects the highlighted tool before reviewing selections

### Requirement: Safety Checks
The command SHALL perform safety checks to prevent overwriting existing structures and ensure proper permissions.

#### Scenario: Detecting existing initialization
- **WHEN** the `openspec/` directory already exists
- **THEN** inform the user that OpenSpec is already initialized, skip recreating the base structure, and enter an extend mode
- **AND** continue to the AI tool selection step so additional tools can be configured
- **AND** display the existing-initialization error message only when the user declines to add any AI tools

### Requirement: Success Output

The command SHALL provide clear, actionable next steps upon successful initialization.

#### Scenario: Displaying success message

- **WHEN** initialization completes successfully
- **THEN** display categorized summary:
  - "Created: <tools>" for newly configured tools
  - "Refreshed: <tools>" for already-configured tools that were updated
  - Count of skills and commands generated
- **AND** display a getting started section naming an installed onboarding workflow (for example `/opsx:propose` - Start a change)
- **AND** spell each command the way the configured tool registers it: `/opsx-<id>` for tools whose command files are named `opsx-<id>`, and the tool's skill invocation (`$openspec-<skill>` for Codex, `/skill:openspec-<skill>` for Kimi Code, `/openspec-<skill>` otherwise) for tools that receive no command files
- **AND** print one labeled line per distinct form when the selected tools disagree
- **AND** display links to documentation and feedback

#### Scenario: Displaying restart instruction

- **WHEN** initialization completes successfully and tools were created or refreshed
- **THEN** display instruction to restart IDE for slash commands to take effect

### Requirement: Exit Codes

The command SHALL use consistent exit codes to indicate different failure modes.

#### Scenario: Returning exit codes

- **WHEN** the command completes
- **THEN** return appropriate exit code:
  - 0: Success
  - 1: General error (including when OpenSpec directory already exists)
  - 2: Insufficient permissions (reserved for future use)
  - 3: User cancelled operation (reserved for future use)

### Requirement: Additional AI Tool Initialization
`openspec init` SHALL allow users to add configuration files for new AI coding assistants after the initial setup.

#### Scenario: Configuring an extra tool after initial setup
- **GIVEN** an `openspec/` directory already exists and at least one AI tool file is present
- **WHEN** the user runs `openspec init` and selects a different supported AI tool
- **THEN** generate that tool's configuration files with OpenSpec markers the same way as during first-time initialization
- **AND** leave existing tool configuration files unchanged except for managed sections that need refreshing
- **AND** exit with code 0 and display a success summary highlighting the newly added tool files

### Requirement: Success Output Enhancements
`openspec init` SHALL summarize tool actions when initialization or extend mode completes.

#### Scenario: Showing tool summary
- **WHEN** the command completes successfully
- **THEN** display a categorized summary of tools that were created, refreshed, or skipped (including already-configured skips)
- **AND** personalize the "Next steps" header using the names of the selected tools, defaulting to a generic label when none remain

### Requirement: Exit Code Adjustments
`openspec init` SHALL treat extend mode without new native tool selections as a successful refresh.

#### Scenario: Allowing empty extend runs
- **WHEN** OpenSpec is already initialized and the user selects no additional natively supported tools
- **THEN** complete successfully without requiring additional tool setup
- **AND** preserve the existing OpenSpec structure and config files
- **AND** exit with code 0

### Requirement: Non-Interactive Mode

The command SHALL support non-interactive operation through command-line options.

#### Scenario: Select all tools non-interactively

- **WHEN** run with `--tools all`
- **THEN** automatically select every available AI tool without prompting
- **AND** proceed with skill and command generation

#### Scenario: Select specific tools non-interactively

- **WHEN** run with `--tools claude,cursor`
- **THEN** parse the comma-separated tool IDs
- **AND** generate skills and commands for specified tools only

#### Scenario: Skip tool configuration non-interactively

- **WHEN** run with `--tools none`
- **THEN** create only the openspec directory structure
- **AND** skip skill and command generation
- **AND** create config only when config creation conditions are met

#### Scenario: Invalid tool specification

- **WHEN** run with `--tools invalid-tool`
- **THEN** fail with exit code 1
- **AND** display an error listing available values (`all`, `none`, and supported tool IDs)

#### Scenario: Reserved value combined with tool IDs

- **WHEN** run with `--tools all,claude` or `--tools none,cursor`
- **THEN** fail with exit code 1
- **AND** display an error explaining reserved values cannot be combined with specific tool IDs

#### Scenario: Missing --tools in non-interactive mode

- **GIVEN** prompts are unavailable in non-interactive execution
- **WHEN** user runs `openspec init` without `--tools`
- **THEN** fail with exit code 1
- **AND** instruct to use `--tools all`, `--tools none`, or explicit tool IDs

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

### Requirement: Experimental Command Alias

The command SHALL maintain backward compatibility with the experimental command.

#### Scenario: Running openspec experimental

- **WHEN** user runs `openspec experimental`
- **THEN** delegate to `openspec init`
- **AND** the command SHALL be hidden from help output

## Why

Manual creation of OpenSpec structure is error-prone and creates adoption friction. A standardized init command ensures:
- Consistent structure across all projects
- Proper AI instruction files are always included
- Quick onboarding for new projects
- Clear conventions from the start
