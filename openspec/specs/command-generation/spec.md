# command-generation Specification

## Purpose
Define tool-agnostic command content and adapter contracts for generating tool-specific OpenSpec command files.

## Requirements
### Requirement: CommandContent interface

The system SHALL define a tool-agnostic `CommandContent` interface that represents command presentation separately from its command-family identity.

#### Scenario: CommandContent structure

- **WHEN** defining a command to generate
- **THEN** `CommandContent` SHALL include:
  - `id`: string action identifier such as `explore` or `apply`
  - `namespace`: optional command-family identifier such as `opsx` or `humanspec`
  - `name`: human-readable name such as `OpenSpec Explore`
  - `description`: brief description of command purpose
  - `category`: grouping category such as `OpenSpec`
  - `tags`: array of tag strings
  - `body`: the command instruction content

#### Scenario: Existing command omits namespace

- **WHEN** a command definition does not declare `namespace`
- **THEN** the system SHALL resolve its namespace as `opsx`
- **AND** its generated identity SHALL remain equivalent to the existing OpenSpec command

#### Scenario: Invalid namespace is rejected

- **WHEN** a command namespace is empty, contains a path separator, contains a traversal segment, or is not a lowercase kebab-case segment
- **THEN** generation SHALL fail before resolving or writing a command path
- **AND** the error SHALL identify the invalid namespace

### Requirement: ToolCommandAdapter interface

The system SHALL define a `ToolCommandAdapter` interface for formatting a resolved command identity for each tool.

#### Scenario: Adapter interface structure

- **WHEN** implementing a tool adapter
- **THEN** `ToolCommandAdapter` SHALL require:
  - `toolId`: string identifier matching `AIToolOption.value`
  - `getFilePath(identity: CommandIdentity)`: returns the command path using the supplied namespace and ID, relative from the project root or absolute for a global-scoped tool
  - `formatFile(content: CommandContent)`: returns complete tool-native file content, including frontmatter when the tool's format uses it

#### Scenario: Claude adapter formatting

- **WHEN** formatting command `{ namespace: "<namespace>", id: "<id>" }` for Claude Code
- **THEN** the adapter SHALL output YAML frontmatter with `name`, `description`, `category`, and `tags` fields
- **AND** the file path SHALL follow `.claude/commands/<namespace>/<id>.md` using valid platform path separators

#### Scenario: Cursor adapter formatting

- **WHEN** formatting command `{ namespace: "<namespace>", id: "<id>" }` for Cursor
- **THEN** the adapter SHALL output YAML frontmatter whose displayed command name is `/<namespace>-<id>` together with its existing metadata fields
- **AND** the file path SHALL follow `.cursor/commands/<namespace>-<id>.md` using valid platform path separators

#### Scenario: Devin Desktop adapter formatting

- **WHEN** formatting command `{ namespace: "<namespace>", id: "<id>" }` for Devin Desktop
- **THEN** the adapter SHALL retain its existing frontmatter fields
- **AND** the file path SHALL follow `.devin/workflows/<namespace>-<id>.md` using valid platform path separators

#### Scenario: Trae adapter formatting

- **WHEN** formatting command `{ namespace: "<namespace>", id: "<id>" }` for Trae
- **THEN** the adapter SHALL output YAML frontmatter with `name` and `description` fields
- **AND** the file path SHALL follow `.trae/commands/<namespace>-<id>.md` using valid platform path separators

#### Scenario: Existing adapter output remains stable

- **WHEN** any registered adapter receives a command whose resolved namespace is `opsx`
- **THEN** it SHALL return the same path and frontmatter-visible command name that the adapter generated before namespace support

### Requirement: Command generator function

The system SHALL provide a `generateCommand` function that resolves command identity and combines command content with an adapter.

#### Scenario: Generate command file

- **WHEN** calling `generateCommand(content, adapter)`
- **THEN** it SHALL resolve `{ namespace: content.namespace ?? "opsx", id: content.id }`
- **AND** return `path` from `adapter.getFilePath(identity)`
- **AND** return `fileContent` from `adapter.formatFile(content)` after tool-specific reference transformation

#### Scenario: Command references match the name the tool registers

- **WHEN** the adapter's file path names `{ namespace, id }` by a flat filename such as `<namespace>-<id>`
- **THEN** `generateCommand` SHALL rewrite `/<namespace>:<target-id>` references in the body to `/<namespace>-<target-id>` before formatting
- **WHEN** the adapter's file path namespaces the command under a `<namespace>/` directory
- **THEN** the body's `/<namespace>:<target-id>` references SHALL remain in namespaced form

#### Scenario: Command references use the tool's own invocation prefix

- **WHEN** an adapter declares an invocation prefix other than `/`
- **THEN** `generateCommand` SHALL use that prefix with the command's namespace and the adapter's separator
- **AND** Amazon Q SHALL render a HumanSpec reference as `@humanspec-<id>` and an OpenSpec reference as `@opsx-<id>`
- **AND** generated skills and init/update onboarding hints SHALL use the same spelling

#### Scenario: Generate multiple commands

- **WHEN** generating commands from descriptors that contain more than one namespace
- **THEN** the system SHALL generate each command using its own resolved namespace and ID
- **AND** SHALL preserve input descriptor order

#### Scenario: Windows command path resolution

- **WHEN** commands in `opsx` and `humanspec` namespaces are generated on Windows
- **THEN** every adapter path SHALL resolve beneath that adapter's declared command directory using Windows-valid separators
- **AND** command identity SHALL not depend on a hardcoded forward-slash path

### Requirement: CommandAdapterRegistry

The system SHALL provide a registry for looking up tool adapters.

#### Scenario: Get adapter by tool ID

- **WHEN** calling `CommandAdapterRegistry.get('cursor')`
- **THEN** it SHALL return the Cursor adapter or undefined if not registered

#### Scenario: Get all adapters

- **WHEN** calling `CommandAdapterRegistry.getAll()`
- **THEN** it SHALL return array of all registered adapters

#### Scenario: Adapter not found

- **WHEN** looking up an adapter for unregistered tool
- **THEN** `CommandAdapterRegistry.get()` SHALL return undefined
- **AND** caller SHALL handle missing adapter appropriately

### Requirement: Shared command body content

The body content of a command SHALL be shared across tools while retaining the command's declared namespace.

#### Scenario: Same instructions across tools

- **WHEN** generating the same command descriptor for two tools
- **THEN** both SHALL use the same semantic body content
- **AND** only frontmatter, file path, invocation prefix, and spelling of references belonging to the declared namespace SHALL differ

#### Scenario: References to a different namespace remain explicit

- **WHEN** a command body contains a reference whose namespace differs from the command descriptor's namespace
- **THEN** generation SHALL leave that reference unchanged unless the caller supplies an explicit descriptor for transforming that command family

### Requirement: Managed command enumeration

The system SHALL derive generated command content, detection, drift checks, migration, and cleanup from one canonical descriptor source containing workflow ID, namespace, and command ID.

#### Scenario: Missing command is detected by workflow identity

- **WHEN** a selected workflow's command file is absent
- **THEN** profile synchronization SHALL report drift using the descriptor's workflow identity
- **AND** command action IDs that overlap across namespaces SHALL not affect the result

#### Scenario: Cleanup preserves unregistered command paths

- **WHEN** init or update encounters a similarly named command path whose namespace and ID are not an explicitly registered managed or legacy identity
- **THEN** cleanup SHALL preserve the file and its containing directory
- **AND** cleanup SHALL delete only exact registered legacy command paths
- **AND** cleanup SHALL not follow symlinks or Windows junctions outside the project

#### Scenario: Legacy directory contains user content

- **WHEN** a legacy command directory contains both exact managed legacy files and unrelated user content
- **THEN** cleanup SHALL delete the managed files individually
- **AND** preserve the directory and unrelated content
