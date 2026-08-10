# humanspec-next-router Specification

## Purpose

The `humanspec-next-router` capability gives a learner one reliable daily entry point that identifies the current HumanSpec state, selects one appropriate next action, and preserves human ownership of implementation.

## Requirements

### Requirement: Next establishes one complete routing context before choosing an action

The `humanspec-next` workflow MUST resolve the HumanSpec project context, active changes, artifact progress, practice-task progress, reflection state, and latest verification disposition before it recommends a next action. It MUST explain the selected state and the reason for the recommendation.

#### Scenario: A ready project has one active change

- **GIVEN** the three registered project documents are valid and exactly one change is active
- **WHEN** the learner invokes `humanspec-next`
- **THEN** the workflow identifies that change, reports its current artifact and practice state, and names exactly one next action with a short reason

#### Scenario: Project context is missing or not ready

- **GIVEN** one or more registered project documents are missing, malformed, or still unresolved
- **WHEN** the learner invokes `humanspec-next`
- **THEN** the workflow reports the affected logical document paths and routes the learner to `humanspec-init` or a specific clarification, without selecting a change from incomplete context

### Requirement: Next routes planning state to a bounded planning action

When no suitable practice change is active, or when the selected change has incomplete planning artifacts, the workflow MUST choose a bounded planning action from the current project roadmap and artifact status. A routing decision MUST preserve the existing propose confirmation gate and MUST not silently create a duplicate change or regenerate a completed artifact.

#### Scenario: No active change has a confirmed roadmap slice

- **GIVEN** the project context is ready, no change is active, and the roadmap contains one or more candidate slices
- **WHEN** the learner invokes `humanspec-next`
- **THEN** the workflow names one candidate slice, explains why it fits the learner context, and hands off to `humanspec-propose` for confirmation and change creation

#### Scenario: The selected change is still in planning

- **GIVEN** one change is selected and its artifact graph has a next uncompleted artifact
- **WHEN** the learner invokes `humanspec-next`
- **THEN** the workflow identifies that artifact and its resolved output location, then continues or hands off to the existing artifact-authoring instructions for that one artifact

#### Scenario: The planning state is already complete

- **GIVEN** the selected change has all required planning artifacts complete
- **WHEN** the learner invokes `humanspec-next`
- **THEN** the workflow does not recreate an artifact and routes to the next practice state instead

### Requirement: Next routes practice and learning evidence in order

The workflow MUST keep implementation, task completion, reflection, verification, archiving, and post-archive feedback in the order defined by the selected change's learning contract.

#### Scenario: Practice tasks remain

- **GIVEN** planning artifacts are complete and at least one practice task in `learning.md` remains unchecked
- **WHEN** the learner invokes `humanspec-next`
- **THEN** the workflow names the next learner-owned task and routes to `humanspec-coach` when help is needed, while leaving implementation code, task checkboxes, and reflections unchanged

#### Scenario: Tasks are complete but reflection is unfinished

- **GIVEN** all practice tasks are complete but a required pre-practice, stuck-state, or post-practice reflection still contains only a placeholder or no learner evidence
- **WHEN** the learner invokes `humanspec-next`
- **THEN** the workflow asks the learner to complete the named reflection section and does not route to verify or archive yet

#### Scenario: Reflection is complete and verification has not passed

- **GIVEN** practice tasks and required reflections contain learner evidence and verification is absent or failed
- **WHEN** the learner invokes `humanspec-next`
- **THEN** the workflow routes to `humanspec-verify` when evidence is ready, or to `humanspec-coach` with the reported blocker when another practice attempt is needed

#### Scenario: Verification has passed

- **GIVEN** verification has a passing disposition for the selected change
- **WHEN** the learner invokes `humanspec-next`
- **THEN** the workflow routes to `humanspec-archive`
- **AND** identifies archive and feedback reconciliation as prerequisites before selecting another slice
- **AND** does not claim that roadmap or learner feedback is complete before the archive workflow confirms it

#### Scenario: Archive feedback is still pending

- **GIVEN** a change has been archived but the registered roadmap or learner feedback record is explicitly marked pending reconciliation
- **WHEN** the learner invokes `humanspec-next` with no active change
- **THEN** the workflow SHALL route to reconciliation for that archived outcome
- **AND** SHALL not select a new candidate or re-propose the archived change until the pending state is resolved

#### Scenario: A later routing run consumes archived feedback

- **GIVEN** a change has been successfully archived and its confirmed feedback has updated the registered roadmap and learner documents
- **WHEN** the learner invokes `humanspec-next` with no active change
- **THEN** the workflow SHALL exclude the archived slice from pending candidates
- **AND** SHALL use the updated learner topics, gaps, review items, and milestone state when explaining the next candidate
- **AND** SHALL not recreate or re-propose the archived change solely because its original name remains in historical records

### Requirement: Ambiguous and interrupted states require an explicit learner choice

The workflow MUST make uncertainty visible instead of silently selecting a change or mutating planning state.

#### Scenario: Multiple changes are active

- **GIVEN** more than one active change can be resumed
- **WHEN** the learner invokes `humanspec-next`
- **THEN** the workflow presents each candidate with its progress and last known state, asks the learner to choose continue, pause, or return to the roadmap, and performs no routing for an unchosen change

#### Scenario: State is inconsistent after a manual edit or failed validation

- **GIVEN** structured status, artifact files, or learning evidence disagree, or the latest verification reports a blocking inconsistency
- **WHEN** the learner invokes `humanspec-next`
- **THEN** the workflow reports the conflicting evidence and proposes a concrete inspection or repair action, without deleting, overwriting, or silently normalizing the learner's files

#### Scenario: A paused change is resumed

- **GIVEN** the learner previously paused a selected change and its files remain available
- **WHEN** the learner invokes `humanspec-next` and confirms that change
- **THEN** the workflow resumes from the first unresolved state and does not create another change or duplicate an existing artifact

### Requirement: Next preserves learner ownership and is idempotent

The workflow MUST keep application and test implementation with the learner. It MAY guide or create only the explicitly authorized planning artifact for the current step, and every generated or modified planning path MUST be selected from registered names rather than inferred by a broad file pattern.

#### Scenario: Next is invoked repeatedly without a state change

- **GIVEN** the learner invokes `humanspec-next` more than once without changing the selected project's state
- **WHEN** each invocation resolves the same context
- **THEN** each invocation returns the same next action and does not create a duplicate change, artifact, task, reflection, or implementation edit

#### Scenario: The project runs from Windows paths

- **GIVEN** the project root and planning home contain Windows drive letters and platform-specific separators
- **WHEN** the learner invokes `humanspec-next`
- **THEN** the workflow identifies the same logical documents and change paths as on macOS and Linux, and its guidance does not depend on hardcoded separator text

### Requirement: Next explains adaptive candidate fit from durable state

When routing from a ready project with no active change, `humanspec-next` SHALL evaluate confirmed roadmap candidates against the active milestone, project constraints, learner profile, and durable mastered/gap/review records. It SHALL expose the evidence used for its choice and hand off to propose rather than creating the change itself.

#### Scenario: One confirmed candidate fits the current learner state
- **WHEN** exactly one confirmed candidate fits the active milestone and learner context
- **THEN** next SHALL name that candidate
- **AND** SHALL explain its fit using relevant milestone and mastered/gap/review evidence
- **AND** SHALL hand off to `humanspec-propose` for confirmation

#### Scenario: Multiple candidates remain plausible
- **WHEN** more than one confirmed candidate fits and durable evidence does not establish a unique choice
- **THEN** next SHALL present the bounded alternatives and their evidence
- **AND** SHALL require the learner to select rather than silently choosing one

#### Scenario: Feedback reconciliation is pending
- **WHEN** the most recent archive still has pending roadmap or learner feedback
- **THEN** next SHALL route to reconciliation before evaluating a candidate
- **AND** SHALL not reason from partially updated learner state

### Requirement: Next reports an intentionally empty roadmap

An empty candidate set after archive or learner rejection SHALL be an explicit route state, not permission to invent or create a candidate.

#### Scenario: Learner rejected the only proposed candidate
- **WHEN** there is no active change, feedback is complete, and the candidate section is empty because no direction was confirmed
- **THEN** next SHALL report that the roadmap currently has no confirmed candidate
- **AND** SHALL invite the learner to explore or propose a direction without writing one automatically

#### Scenario: Last prewritten candidate was archived
- **WHEN** the last candidate was archived and adaptive planning produced no confirmed replacement
- **THEN** next SHALL not re-propose the archived change
- **AND** SHALL use the empty route behavior.

### Requirement: Next and propose share one candidate-sizing contract

Before handing a roadmap candidate to propose, `humanspec-next` SHALL evaluate candidate fit using the same sizing criteria and meanings as `humanspec-propose`. A candidate SHALL not be described as fitting when propose would reject the same durable project and learner context as oversized.

#### Scenario: Candidate satisfies the shared contract
- **WHEN** a confirmed candidate has one observable outcome, clear completion evidence, acceptable concept/platform load, and fits the learner's session budget
- **THEN** next SHALL explain the matching sizing evidence
- **AND** SHALL hand the unchanged candidate identity to propose for confirmation

#### Scenario: Candidate is too large for the current learner context
- **WHEN** a candidate violates any shared sizing criterion
- **THEN** next SHALL not silently select it as fitting
- **AND** SHALL explain the violated criteria and route to learner-confirmed refinement or propose-based splitting

#### Scenario: Propose re-evaluates a candidate without context changes
- **WHEN** next hands off a candidate and the project, learner, milestone, and request context have not changed
- **THEN** propose SHALL reach the same fit or oversized classification
- **AND** any later difference SHALL identify the context that changed
