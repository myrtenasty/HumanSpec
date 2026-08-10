## ADDED Requirements

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
