## Purpose

The `humanspec-propose` workflow turns initialized project and learner context into one focused practice change that a person can complete, understand, and verify within a single learning session.

## ADDED Requirements

### Requirement: HumanSpec context readiness

The propose workflow SHALL use the registered HumanSpec project documents as the context for planning a practice change. It SHALL establish that the project, roadmap, and learner documents are valid before creating a change.

#### Scenario: Initialized context is ready

- **WHEN** the learner invokes propose and `project.md`, `roadmap.md`, and `learner.md` are valid registered HumanSpec documents
- **THEN** the workflow SHALL read the project goal, constraints, candidate slices, learner goals, and configured session budget before drafting the change
- **AND** SHALL continue to practice-goal clarification and sizing

#### Scenario: Context is missing or unresolved

- **WHEN** one or more registered HumanSpec documents are missing, malformed, unmarked, or contain an unresolved value required for sizing
- **THEN** the workflow SHALL identify the affected document or value and provide a concrete next action
- **AND** SHALL not create a practice change until the required context is resolved or explicitly supplied by the learner

### Requirement: Human-sized practice plan

The propose workflow SHALL produce a practice plan with one observable outcome, one primary learning goal, no more than two supporting concepts, and two to five independently verifiable practice tasks sized for the learner's configured session budget.

#### Scenario: Request fits one practice session

- **WHEN** the learner's request describes one outcome that fits the configured session budget
- **THEN** the workflow SHALL present the proposed outcome, learning goal, supporting concepts, task list, and expected completion evidence for learner confirmation
- **AND** each practice task SHALL be independently understandable and verifiable

#### Scenario: Request needs a smaller slice

- **WHEN** the request exceeds the learner's session budget or contains multiple independent outcomes
- **THEN** the workflow SHALL explain why the request is too large and present a bounded set of candidate slices
- **AND** each candidate SHALL describe one primary learning focus and a small task set
- **AND** the workflow SHALL wait for the learner to select at most one candidate before creating a change

### Requirement: Confirmed human-learning change creation

After the learner confirms one practice plan, the workflow SHALL create exactly one change using the `human-learning` artifact contract and SHALL preserve the distinction between behavior deltas and non-behavioral practice.

#### Scenario: Confirmed behavioral practice change

- **WHEN** the learner confirms a selected practice plan that changes observable behavior
- **THEN** the workflow SHALL create one change with a proposal, applicable delta specifications, and a `learning.md` practice plan
- **AND** the proposal and specifications SHALL describe the confirmed observable outcome and completion evidence
- **AND** `learning.md` SHALL contain the confirmed two-to-five practice tasks

#### Scenario: Confirmed non-behavioral practice change

- **WHEN** the learner confirms a selected practice plan that adds no behavior contract
- **THEN** the workflow SHALL create one `human-learning` change using the schema's explicit `skip_specs` path
- **AND** SHALL not synthesize a delta specification merely to fill the artifact sequence

#### Scenario: Learner does not confirm the plan

- **WHEN** the learner rejects the proposed plan or candidate slice
- **THEN** the workflow SHALL leave change artifacts unchanged
- **AND** SHALL allow the learner to revise the goal, choose another candidate, or stop without creating a change

### Requirement: Before-practice handoff gate

The propose workflow SHALL separate planning completion from implementation handoff and SHALL require the learner's own pre-practice reflection before directing the learner to implement or coach.

#### Scenario: Plan is created but pre-practice reflection is empty

- **WHEN** the confirmed change has been created but the learner has not completed the `learning.md` before-practice section
- **THEN** the workflow SHALL identify that reflection as the next required learner action
- **AND** SHALL not describe the change as ready for implementation or coaching

#### Scenario: Pre-practice reflection is complete

- **WHEN** the learner has completed the required before-practice reflection for the confirmed change
- **THEN** the workflow SHALL hand off to the human implementation phase
- **AND** SHALL identify `/humanspec:coach` as the optional assistance route without marking any practice task complete

### Requirement: Human implementation ownership and surface parity

The propose workflow SHALL limit its writes to the explicitly named change planning artifacts and SHALL preserve learner ownership of application and test implementation. The skill and command delivery surfaces SHALL communicate the same planning, confirmation, handoff, and write-boundary behavior.

#### Scenario: Planning artifacts are generated

- **WHEN** propose writes the confirmed change
- **THEN** it SHALL write only the change's proposal, specification, and learning-plan artifacts through the `human-learning` contract
- **AND** it SHALL leave application source files, test implementation files, and learner-marked task checkboxes unchanged

#### Scenario: Skill and command surfaces are used

- **WHEN** the learner invokes propose through either the generated skill or the generated HumanSpec command
- **THEN** both surfaces SHALL provide equivalent context-reading, sizing, confirmation, artifact, handoff, and ownership guidance

### Requirement: Cross-platform practice-change paths

The propose workflow SHALL identify the same registered project-document and change-artifact destinations consistently on Windows, macOS, and Linux.

#### Scenario: Windows project uses propose

- **WHEN** propose runs in a Windows project path containing valid HumanSpec documents
- **THEN** it SHALL resolve the registered documents and the new change beneath the selected planning home using valid Windows paths
- **AND** status and subsequent artifact instructions SHALL identify the same change without requiring forward-slash path separators
