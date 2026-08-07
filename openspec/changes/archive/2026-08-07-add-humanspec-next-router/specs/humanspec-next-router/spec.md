## Purpose

The `humanspec-next-router` capability gives a learner one reliable daily entry point that identifies the current HumanSpec state, selects one appropriate next action, and preserves human ownership of implementation.

## ADDED Requirements

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

The workflow MUST keep implementation, task completion, reflection, verification, and archiving in the order defined by the selected change's learning contract.

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
- **THEN** the workflow routes to `humanspec-archive` and does not claim that roadmap or learner feedback has already been updated

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
