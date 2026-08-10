## ADDED Requirements

### Requirement: Propose applies the complete shared change-sizing assessment

Before creating artifacts, `humanspec-propose` SHALL assess the request using the same HumanSpec sizing contract used by `humanspec-next`. In addition to outcome, learning goal, supporting concepts, task count, evidence, and session budget, the assessment SHALL consider multiple frameworks or infrastructure components, multiple unfamiliar core concepts, whole-module/system scope, learner experience, and cognitive load.

#### Scenario: Request is a bounded learning slice
- **WHEN** the request has one observable outcome, a single clear completion evidence, no excessive platform/concept load, and fits the learner's configured experience and session budget
- **THEN** propose SHALL present one human-sized plan for learner confirmation
- **AND** SHALL identify the primary goal, supporting concepts, tasks, and completion evidence used in the assessment

#### Scenario: Request combines multiple frameworks or infrastructure components
- **WHEN** completing the request would require introducing independent frameworks, infrastructure components, or business capabilities in one practice change
- **THEN** propose SHALL warn that the request is oversized
- **AND** SHALL offer smaller independently verifiable slices instead of creating the original change

#### Scenario: Request requires multiple unfamiliar core concepts
- **WHEN** the learner would need to learn multiple unfamiliar core concepts before beginning the first task
- **THEN** propose SHALL split or reduce the learning target
- **AND** SHALL explain the cognitive-load reason using known learner context rather than file-count or line-count limits

#### Scenario: Completion cannot be evidenced as one behavior
- **WHEN** the task can only be described as completing an entire module/system or no single observable completion evidence can be stated
- **THEN** propose SHALL block immediate change creation
- **AND** SHALL ask for or propose a narrower observable outcome

### Requirement: Roadmap-external requests report learning-path impact

A request not represented by the current roadmap SHALL not be rejected solely for being new, but propose SHALL explain how accepting it would preserve, interrupt, replace, or extend the confirmed learning path before the learner decides.

#### Scenario: Learner requests an unplanned but bounded change
- **WHEN** the request is human-sized but absent from confirmed roadmap candidates
- **THEN** propose SHALL compare it with the active milestone and learner goals
- **AND** SHALL present its learning-path impact for confirmation before creating artifacts
