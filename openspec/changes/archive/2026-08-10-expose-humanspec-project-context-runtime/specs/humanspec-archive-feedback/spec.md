## ADDED Requirements

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
