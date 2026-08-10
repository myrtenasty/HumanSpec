## ADDED Requirements

### Requirement: Hint-level use remains explicit and learner-authored

Every substantive coaching response SHALL label the hint level it actually provides and SHALL remind the learner how to record the level used in their own stuck evidence. The coach SHALL not write or claim that evidence on the learner's behalf.

#### Scenario: Coach provides a level-one response
- **WHEN** the coach answers an initial request for help
- **THEN** the response SHALL explicitly label itself Level 1
- **AND** SHALL ask the learner to record the level actually used if the response becomes part of a stuck episode

#### Scenario: Learner requests escalation
- **WHEN** the learner explicitly asks for a more revealing hint after using the current level
- **THEN** the coach SHALL label the newly provided level
- **AND** SHALL distinguish the requested level from the level the learner later records as actually used

#### Scenario: Learner asks the coach to update learning evidence
- **WHEN** the learner asks the coach to record hint use or reflection content directly
- **THEN** the coach SHALL preserve its no-write boundary
- **AND** SHALL provide a concise description the learner can record themselves without claiming the record was written
