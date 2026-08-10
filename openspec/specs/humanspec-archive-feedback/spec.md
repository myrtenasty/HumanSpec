# humanspec-archive-feedback Specification

## Purpose

Provides a safe HumanSpec completion handoff that turns verified practice evidence into an archived change and explicit, learner-owned updates to the project's roadmap and learning history.

## Requirements

### Requirement: Archive establishes one complete practice context

The HumanSpec archive workflow SHALL establish exactly one complete practice context before it evaluates readiness or proposes any write. The context SHALL include one selected change, its structured artifact and task state, the learning artifact, valid `project.md`, `roadmap.md`, and `learner.md` documents, and the latest verification record.

#### Scenario: One verified change is ready to archive

- **WHEN** the learner names one active change or exactly one active change is available
- **AND** its planning artifacts, learning artifact, and three registered project documents are readable and valid
- **THEN** the workflow SHALL report the selected change, resolved project context, task progress, verification disposition, and planned archive and feedback actions

#### Scenario: Archive context is ambiguous or incomplete

- **WHEN** multiple changes are candidates, the selected change is missing or malformed, a required artifact is absent, or a registered project document is missing, malformed, unmarked, or contradictory
- **THEN** the workflow SHALL report the exact blocker
- **AND** SHALL make no archive, specification, roadmap, or learner-document change
- **AND** SHALL ask the learner to select or repair the context

### Requirement: Normal archive requires complete software and learning evidence

The workflow SHALL allow a normal HumanSpec archive only when the latest verification record has a passing overall disposition and a learning-complete assessment, every practice task is complete, required learner reflections are substantive, and every required software check has sufficient evidence.

#### Scenario: All evidence passes the archive gate

- **WHEN** the selected change has a passing verification record
- **AND** all practice tasks, required reflections, and recorded stuck episodes are complete
- **AND** the required behavioral and project-check evidence is sufficient
- **THEN** the workflow SHALL allow the learner to confirm the archive and feedback plan

#### Scenario: A learning or software gate is incomplete

- **WHEN** verification is absent, failed, inconclusive, learning-incomplete, or reports an unchecked task, missing reflection, incomplete stuck episode, failed requirement, or insufficient project check
- **THEN** the workflow SHALL identify the exact evidence gap
- **AND** SHALL not report the change as normally ready
- **AND** SHALL not write positive mastery, completed-slice, or adaptive feedback records

#### Scenario: The learner explicitly chooses a forced archive

- **WHEN** the learner explicitly confirms that the change should be archived despite a reported gate failure or incomplete learning evidence
- **THEN** the workflow SHALL show which gates are being bypassed and require a separate explicit confirmation
- **AND** SHALL label the archived learning outcome as incomplete or inconclusive
- **AND** SHALL not fabricate reflections or record the learner as having mastered an unverified topic

### Requirement: Archive reuses the canonical specification and archive operation

After the learner confirms a permitted archive, the workflow SHALL use the existing archive behavior for validation, delta-spec synchronization, and moving the complete change directory into the archive. It SHALL report the resulting archive path and specification outcome without creating a parallel archive mechanism.

#### Scenario: A confirmed archive succeeds

- **WHEN** the archive operation validates the change and completes its specification synchronization and move
- **THEN** the workflow SHALL report the archived change path and specification result
- **AND** SHALL proceed to the separately confirmed roadmap and learner feedback step

#### Scenario: Canonical archive fails

- **WHEN** validation, specification synchronization, or the archive move fails
- **THEN** the workflow SHALL report the concrete failure and the state that remains active
- **AND** SHALL not claim that the change or its feedback was archived successfully
- **AND** SHALL not apply roadmap or learner feedback for that unsuccessful archive

### Requirement: Feedback updates are explicit, learner-owned, and structurally safe

After a successful archive, the workflow SHALL show a preview of each proposed change to the registered `roadmap.md` and `learner.md` documents and SHALL require explicit learner confirmation before writing. Confirmed feedback SHALL modify only the exact selected roadmap slice and registered learner record areas, preserve unrelated learner-authored content and required document structure, and derive learning claims from the learner's evidence and verification rather than invented personal reflection.

#### Scenario: Learner confirms feedback updates

- **WHEN** the learner accepts the preview after a successful archive
- **THEN** the workflow SHALL mark the exact archived slice as no longer pending in `roadmap.md`
- **AND** SHALL record the milestone outcome and any verified mastered topics, knowledge gaps, or review items in their registered sections
- **AND** SHALL preserve the documents' markers, required headings, parseable slice grammar, and unrelated content
- **AND** SHALL record whether the feedback update is complete or still pending reconciliation

#### Scenario: Learner feedback writing is interrupted after archive

- **WHEN** the archive has succeeded and the learner has confirmed feedback, but one registered feedback document cannot be written
- **THEN** the workflow SHALL preserve an explicit pending-feedback state for that archived change
- **AND** SHALL report which document remains pending and how to retry reconciliation
- **AND** SHALL not report the learning feedback loop as complete until the pending state is resolved

#### Scenario: Learner rejects or cannot resolve a feedback preview

- **WHEN** the learner rejects an update or an existing document contains an unmarked conflict, malformed structure, or ambiguous matching record
- **THEN** the workflow SHALL leave the affected document unchanged
- **AND** SHALL identify whether the result was preserved, blocked, or requires manual repair
- **AND** SHALL not claim that the learning feedback loop is complete

### Requirement: Archive feedback is retry-safe and does not create the next change

The workflow SHALL make feedback application safe to retry after a partial failure or interruption. It SHALL recognize an already-applied record for the same archived change, avoid duplicate entries, surface conflicting edits, and leave creation of a future change to an explicit HumanSpec routing or proposal action.

#### Scenario: Feedback is retried after archive success

- **WHEN** the archive has succeeded but feedback writing was interrupted or failed
- **THEN** a later archive-feedback attempt SHALL be able to reconcile the same archived outcome and its pending-feedback state
- **AND** SHALL apply only missing records or report exact conflicts
- **AND** SHALL not repeat specification synchronization or create duplicate roadmap or learner entries

#### Scenario: Feedback is already applied

- **WHEN** the selected archived outcome already has matching roadmap and learner records
- **THEN** the workflow SHALL report the records as already applied
- **AND** SHALL leave their content unchanged
- **AND** SHALL offer the next routing action without creating another change

#### Scenario: Archive completes without auto-proposing work

- **WHEN** archive and feedback updates complete
- **THEN** the workflow SHALL report one recommended next action through `humanspec-next` or `humanspec-propose`
- **AND** SHALL not create a new change directory or planning artifact automatically

### Requirement: Archive surfaces preserve the HumanSpec ownership boundary across platforms

The generated HumanSpec archive skill and command SHALL expose equivalent archive gates, feedback confirmation behavior, retry semantics, and ownership boundaries. The workflow SHALL resolve and report registered paths with platform-appropriate semantics on Windows, macOS, and Linux.

#### Scenario: Skill and command expose the same archive contract

- **WHEN** the learner starts archive through either generated surface
- **THEN** both surfaces SHALL describe the same verification gate, canonical archive operation, feedback preview, and learner-owned write boundary
- **AND** neither surface SHALL permit the AI to edit application or test implementation files

#### Scenario: Archive runs from a Windows project path

- **WHEN** the selected change and project documents are beneath a Windows project root
- **THEN** the workflow SHALL resolve the same logical files using Windows-valid paths
- **AND** SHALL not depend on hardcoded forward-slash separators or update a sibling or archived change by mistake

### Requirement: Archive feedback application is plan-bound and explicitly confirmed

The archive-feedback capability SHALL expose its preview, application, and reconciliation behavior through the public project-context runtime. A preview SHALL enumerate the exact registered documents and changes under consideration, and application SHALL be fail closed unless that preview is explicitly confirmed while its document preconditions remain valid.

#### Scenario: Learner declines a feedback preview
- **WHEN** a ready feedback preview is rejected or receives no explicit confirmation
- **THEN** roadmap and learner documents SHALL remain byte-for-byte unchanged
- **AND** the result SHALL not describe the feedback update as complete

#### Scenario: Preview becomes stale before confirmation
- **WHEN** roadmap or learner content changes after a feedback preview is produced
- **THEN** the confirmed application attempt SHALL report a conflict
- **AND** neither document SHALL be overwritten from the stale preview

#### Scenario: Confirmed feedback is interrupted
- **WHEN** canonical archive has completed and a confirmed project-document feedback operation is interrupted after writing only part of its explicit document list
- **THEN** the archived change SHALL retain a detectable pending-feedback state
- **AND** a subsequent reconciliation SHALL resume from persisted archive evidence without duplicating the completed write

#### Scenario: Feedback runs against a selected store on Windows
- **WHEN** archive feedback is planned and applied for a registered store from Windows
- **THEN** all previewed and written paths SHALL remain beneath the selected store planning home
- **AND** no path SHALL depend on hardcoded slash direction or the caller's current directory

### Requirement: Canonical verification feedback is the replay source

Archive feedback SHALL consume the latest canonical learning-feedback region from the archived `learning.md` as the authoritative source of verified mastered, gap, and review records. It SHALL preserve record type and text and SHALL not re-infer learning outcomes during retry.

#### Scenario: Learner-document update is interrupted after archive

- **WHEN** canonical archive has completed but learner feedback was not fully written
- **THEN** reconciliation SHALL recover every verified mastered, gap, and review record using only the archived `learning.md` and registered project documents
- **AND** SHALL not require the original model conversation or an invented replacement fixture

#### Scenario: Reconciliation is repeated

- **WHEN** the same archived verification evidence is reconciled more than once
- **THEN** each logical learner record SHALL appear at most once in `learner.md`
- **AND** the archived outcome and feedback state SHALL remain idempotent

#### Scenario: Learning status is not complete

- **WHEN** the canonical feedback region records incomplete or inconclusive learning
- **THEN** archive feedback SHALL persist supported gap and review records
- **AND** SHALL write no mastered record from that result

#### Scenario: A canonical record type is absent

- **WHEN** the latest feedback region contains no record of a given type
- **THEN** archive feedback SHALL add no learner record of that type
- **AND** SHALL not turn headings, comments, or empty placeholders into learner topics

### Requirement: Legacy verification evidence is handled conservatively

Archived learning artifacts that predate the canonical region SHALL remain readable through explicitly recognized legacy headings or typed records, but missing evidence SHALL never be reconstructed as mastery.

#### Scenario: Legacy artifact has explicit typed feedback

- **WHEN** an archived legacy `learning.md` contains an explicitly recognized mastered, gap, or review entry
- **THEN** reconciliation MAY import that typed record using the same duplicate rules as canonical feedback

#### Scenario: Legacy artifact has only narrative verification text

- **WHEN** an archived legacy `learning.md` has no canonical region and no explicitly typed feedback records
- **THEN** reconciliation SHALL report that replayable learning feedback is unavailable
- **AND** SHALL not infer mastered topics from narrative text or passing disposition alone
