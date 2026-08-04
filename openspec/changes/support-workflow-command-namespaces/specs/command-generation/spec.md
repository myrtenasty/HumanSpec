## MODIFIED Requirements

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
  - `formatFile(content: CommandContent)`: returns complete file content with frontmatter

#### Scenario: Claude adapter formatting

- **WHEN** formatting command `{ namespace: "<namespace>", id: "<id>" }` for Claude Code
- **THEN** the adapter SHALL output YAML frontmatter with `name`, `description`, `category`, and `tags` fields
- **AND** the file path SHALL follow `.claude/commands/<namespace>/<id>.md` using valid platform path separators

#### Scenario: Cursor adapter formatting

- **WHEN** formatting command `{ namespace: "<namespace>", id: "<id>" }` for Cursor
- **THEN** the adapter SHALL output YAML frontmatter whose displayed command name is `/<namespace>-<id>` together with its existing metadata fields
- **AND** the file path SHALL follow `.cursor/commands/<namespace>-<id>.md` using valid platform path separators

#### Scenario: Windsurf-compatible adapter formatting

- **WHEN** formatting command `{ namespace: "<namespace>", id: "<id>" }` for a Windsurf-compatible workflow adapter
- **THEN** the adapter SHALL retain its existing frontmatter fields
- **AND** the file path SHALL follow `.windsurf/workflows/<namespace>-<id>.md` using valid platform path separators

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

### Requirement: Shared command body content

The body content of a command SHALL be shared across tools while retaining the command's declared namespace.

#### Scenario: Same instructions across tools

- **WHEN** generating the same command descriptor for two tools
- **THEN** both SHALL use the same semantic body content
- **AND** only frontmatter, file path, invocation prefix, and spelling of references belonging to the declared namespace SHALL differ

#### Scenario: References to a different namespace remain explicit

- **WHEN** a command body contains a reference whose namespace differs from the command descriptor's namespace
- **THEN** generation SHALL leave that reference unchanged unless the caller supplies an explicit descriptor for transforming that command family
