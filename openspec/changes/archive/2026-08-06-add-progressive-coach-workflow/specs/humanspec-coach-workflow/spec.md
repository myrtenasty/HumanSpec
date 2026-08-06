## Purpose

Provide a learner-controlled coaching experience that turns a current HumanSpec practice task into evidence-based, progressively more specific guidance without transferring implementation ownership to the AI.

## ADDED Requirements

### Requirement: Coaching is grounded in the active practice context

The coaching workflow SHALL ground each response in one selected HumanSpec change, its current practice task, the learning contract, the completion evidence, and the relevant project context. When required context is missing, malformed, or ambiguous, the workflow SHALL identify the blocker and ask the learner to resolve it before giving task-specific guidance.

#### Scenario: A learner requests help on a ready task

- **WHEN** the selected change has a current practice task and readable learning and project context
- **THEN** the coach SHALL identify the change and task it is addressing
- **AND** SHALL connect its guidance to the task's learning goal and completion evidence
- **AND** SHALL ask what the learner tried and observed before diagnosing the problem

#### Scenario: The current task cannot be determined

- **WHEN** the learner has multiple active changes, no current task, or incomplete required planning context
- **THEN** the coach SHALL report the specific ambiguity or missing context
- **AND** SHALL ask the learner to select or complete the relevant context
- **AND** SHALL not silently choose a change or invent a task

### Requirement: Coaching provides learner-controlled progressive hints

The coaching workflow SHALL provide three explicit hint levels and start with the least revealing level that can move the learner forward:

1. a concept explanation and checking questions without naming a concrete implementation location;
2. a targeted reference to relevant modules, symbols, data flow, or observable evidence without supplying the implementation;
3. bounded pseudocode, API shape, or a local example that clarifies the next step without becoming a complete copy-ready solution.

Each response SHALL state its hint level and SHALL escalate only after the learner requests more specificity or confirms that the current level did not unblock them.

#### Scenario: The learner is stuck for the first time

- **WHEN** the learner asks for help without requesting a specific hint level
- **THEN** the coach SHALL provide a level-one explanation and one or more checking questions
- **AND** SHALL state that the response is level one
- **AND** SHALL invite the learner to report the result of the check or request the next level

#### Scenario: The learner requests a more specific hint

- **WHEN** the learner reports that the previous hint was insufficient and requests more detail
- **THEN** the coach SHALL provide the next appropriate hint level
- **AND** SHALL preserve the current task and learning goal
- **AND** SHALL not jump directly to a complete implementation patch

#### Scenario: The learner requests a complete solution

- **WHEN** the learner asks the coach to write or provide the full application or test implementation
- **THEN** the coach SHALL keep the response within the highest bounded hint level
- **AND** SHALL explain that the learner owns the implementation
- **AND** SHALL offer a smaller diagnostic question or self-directed next step

### Requirement: Diagnosis uses learner evidence

The coaching workflow SHALL distinguish the learner's attempted approach, observed output, and current hypothesis from the coach's explanation. It SHALL use the available code, errors, tests, and task evidence to explain why a hypothesis may or may not fit, then provide a concrete next observation or experiment for the learner to perform.

#### Scenario: The learner reports a failing test

- **WHEN** the learner provides a failing test or runtime error together with the attempted approach
- **THEN** the coach SHALL identify the relevant contradiction or missing evidence
- **AND** SHALL explain the underlying concept in terms of the current task
- **AND** SHALL propose a learner-run diagnostic step whose result can confirm or reject the hypothesis

#### Scenario: The learner has not supplied an observation

- **WHEN** the learner asks why an implementation is wrong without showing an attempt or observable result
- **THEN** the coach SHALL ask for the smallest useful code, command output, or reproduction detail
- **AND** SHALL avoid asserting an unverified root cause

### Requirement: The learner retains implementation and practice ownership

The coaching workflow SHALL keep the learner responsible for application code, test implementation, reflection entries, and practice-task completion. Coaching SHALL be read-only with respect to application and test files, learner-owned reflection sections, and practice-task checkboxes; the coach SHALL explain how the learner can record attempts, observations, hypotheses, and requested hint levels without recording those reflections on the learner's behalf.

#### Scenario: Coaching follows a learner's implementation attempt

- **WHEN** the coach reviews application code or test code supplied by the learner
- **THEN** it SHALL provide explanation, diagnosis, or a progressive hint
- **AND** SHALL leave the implementation and tests for the learner to edit
- **AND** SHALL not mark a practice task complete

#### Scenario: The learner reports a task as complete

- **WHEN** the learner says a practice task is finished
- **THEN** the coach SHALL ask the learner to record the relevant attempt and evidence in the learning artifact if needed
- **AND** SHALL direct verification to the HumanSpec verify workflow
- **AND** SHALL not alter the task checkbox or reflection fields itself

### Requirement: Interrupted coaching resumes without a silent context switch

The coaching workflow SHALL support resuming an interrupted session by re-reading the selected change's current planning and learning state and identifying the last learner-recorded task context. When the persisted state does not identify one change or task, the workflow SHALL ask the learner to choose or restate it instead of switching context silently.

#### Scenario: The learner resumes with persisted task context

- **WHEN** the learner returns to a change whose current task and learner-recorded stuck-state context are available
- **THEN** the coach SHALL summarize the recovered change and task
- **AND** SHALL continue from the learner's recorded evidence and requested hint level
- **AND** SHALL preserve the learner's choice of implementation approach

#### Scenario: The learner resumes with conflicting active changes

- **WHEN** more than one active change could match the learner's request
- **THEN** the coach SHALL list the relevant choices and ask the learner to select one
- **AND** SHALL not provide task-specific guidance until the selection is clear

### Requirement: HumanSpec delivery surfaces remain equivalent

The generated HumanSpec coach skill and HumanSpec coach command SHALL communicate the same context, hint-level, diagnosis, ownership, and resume behavior. A learner using either surface SHALL receive the same workflow contract and the same implementation boundary.

#### Scenario: The learner invokes either generated coach surface

- **WHEN** the learner starts coaching through the generated skill or the generated HumanSpec command
- **THEN** both surfaces SHALL describe the same three hint levels and escalation rule
- **AND** both surfaces SHALL preserve the same read-only and learner-ownership boundaries

### Requirement: Coaching resolves project paths consistently across platforms

The coaching workflow SHALL identify project context and change artifacts beneath the selected planning home using platform-appropriate paths on Windows, macOS, and Linux.

#### Scenario: A learner coaches from a Windows project path

- **WHEN** the selected change and project documents are located beneath a Windows project root
- **THEN** the coach SHALL resolve and report those logical locations using valid Windows path semantics
- **AND** SHALL continue to identify the same change and task without requiring forward-slash path separators
