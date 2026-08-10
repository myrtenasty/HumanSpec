## Purpose

Expose HumanSpec project-document inspection and mutation as a stable, structured CLI contract that installed workflows can execute without importing package-internal code.

## ADDED Requirements

### Requirement: Public project-context runtime operations

The CLI SHALL expose structured HumanSpec project-context operations for document inspection, registered template and target-path discovery, next-roadmap context resolution, archive-feedback planning, confirmed feedback application, and feedback reconciliation. In JSON mode, every operation SHALL return a versioned result containing the operation, status, resolved planning home, data, issues, and an actionable next step where applicable.

#### Scenario: Inspect a ready project context
- **WHEN** a caller requests project-context inspection in JSON mode from a valid HumanSpec planning home
- **THEN** the result SHALL identify each registered project document, its resolved path, classification, marker/template version, and parse issues
- **AND** the operation SHALL make no file changes

#### Scenario: Resolve next-roadmap context
- **WHEN** a caller requests next-roadmap context in JSON mode
- **THEN** the result SHALL distinguish blocked, reconciliation, ready, and empty states
- **AND** SHALL return the parsed candidates, archived changes, pending feedback, and learner records used to determine that state

#### Scenario: Structured operation fails
- **WHEN** an operation cannot resolve its planning home or receives invalid input
- **THEN** it SHALL exit non-zero
- **AND** JSON mode SHALL still emit one parseable error result with stable issue codes and no partial human prose on standard output

### Requirement: Planning-home and path resolution parity

Every project-context runtime operation SHALL use the same nearest-project and registered-store selection semantics as other root-aware OpenSpec commands. Returned document paths SHALL be resolved beneath the selected planning home using platform-native path semantics.

#### Scenario: Explicit store selection
- **WHEN** a caller invokes a project-context operation with a registered store selector
- **THEN** every inspected or mutated document SHALL resolve beneath that store's planning home
- **AND** no document in the caller's current project SHALL be used implicitly

#### Scenario: Windows project paths
- **WHEN** a project-context operation runs from a Windows path containing drive letters or backslash separators
- **THEN** document containment and identity SHALL be evaluated using Windows path semantics
- **AND** the JSON result SHALL return the accurate resolved Windows paths without constructing them through hardcoded separators

### Requirement: Fail-closed planned mutations

Archive-feedback application SHALL be based on a previously returned plan and SHALL write nothing unless the caller supplies explicit confirmation. The plan SHALL bind each proposed change to the document content observed during planning so that stale previews are rejected.

#### Scenario: Apply is not explicitly confirmed
- **WHEN** a caller submits a ready archive-feedback plan without explicit confirmation
- **THEN** the operation SHALL write zero documents
- **AND** SHALL return a blocked or confirmation-required result

#### Scenario: A document changes after preview
- **WHEN** any planned document differs from the content bound to the confirmed plan
- **THEN** application SHALL report a conflict
- **AND** SHALL write zero planned documents
- **AND** SHALL require the caller to obtain and confirm a new preview

#### Scenario: Confirmed plan is applied
- **WHEN** every plan precondition still matches and the caller explicitly confirms application
- **THEN** only the documents explicitly listed as changed in the plan SHALL be written
- **AND** the result SHALL identify every written and pending document

### Requirement: Interrupted writes are recoverable

If a confirmed multi-document feedback operation completes only partially, the runtime SHALL preserve a machine-readable pending state and provide an idempotent reconciliation operation.

#### Scenario: A later document write fails
- **WHEN** a confirmed feedback operation writes one registered document and a subsequent registered document cannot be written
- **THEN** the result SHALL report a pending state and the exact incomplete documents
- **AND** SHALL provide a reconciliation action rather than report completion

#### Scenario: Reconciliation is retried
- **WHEN** reconciliation is invoked repeatedly after the remaining documents are writable
- **THEN** the final result SHALL be complete
- **AND** already-applied records SHALL not be duplicated

### Requirement: Installed workflows use the public runtime boundary

Every generated HumanSpec workflow that needs project-document data or feedback mutation SHALL invoke public CLI operations and SHALL NOT instruct an installed AI tool to call package-internal TypeScript symbols.

#### Scenario: Workflow artifacts are generated
- **WHEN** HumanSpec skills and commands are generated for any supported delivery surface
- **THEN** project-document instructions SHALL reference callable CLI operations
- **AND** SHALL contain none of the explicitly tracked internal helper identifiers replaced by this capability

#### Scenario: Workflow is installed from a packed artifact
- **WHEN** a HumanSpec workflow is installed from the npm tarball and follows its project-context instructions
- **THEN** every referenced runtime operation SHALL be available from the packed CLI
