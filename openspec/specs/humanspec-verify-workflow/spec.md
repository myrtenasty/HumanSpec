# humanspec-verify-workflow Specification

## Purpose

Provide a HumanSpec verification experience that distinguishes a working software slice from a completed learning practice, using reproducible implementation evidence and learner-owned reflection without taking implementation ownership from the learner.

## Requirements

### Requirement: Verification establishes one complete practice context

The HumanSpec verify workflow SHALL establish one unambiguous practice context before judging completion. The context SHALL include the selected change, its current artifact state, the learning contract, the practice-task checklist, the project context documents, and the completion evidence declared for the change.

#### Scenario: A single ready change is selected

- **WHEN** the learner names one active change or exactly one active change is available
- **AND** the change has readable planning artifacts and valid project context
- **THEN** verification SHALL identify the change, current task progress, learning goal, and completion evidence before reporting findings

#### Scenario: Verification context is ambiguous or incomplete

- **WHEN** multiple active changes match, no active change exists, or a required artifact or project context document is missing or malformed
- **THEN** verification SHALL report the exact ambiguity or missing context
- **AND** SHALL ask the learner to select, repair, or complete the context
- **AND** SHALL not report the change as verified

### Requirement: Verification gates completion on practice and reflection evidence

The HumanSpec verify workflow SHALL treat all practice tasks and required learner reflection as completion evidence. A change SHALL not receive a learning-complete result while any practice task is unchecked or while the learner-owned `开始前` or `完成后` section is empty or contains only the template placeholder. When the learner records a stuck episode, its attempted approach, observation, hypothesis, and requested hint SHALL also be complete before that episode is treated as evidence.

#### Scenario: All tasks and reflections are complete

- **WHEN** every practice-task checkbox is checked
- **AND** the learner-owned `开始前` and `完成后` sections contain substantive learner-authored content
- **AND** any recorded stuck episode contains its required evidence
- **THEN** verification SHALL allow the learning evidence to be assessed alongside the software evidence

#### Scenario: A task or reflection is incomplete

- **WHEN** any practice task remains unchecked or a required learner-owned section is empty or template-only
- **THEN** verification SHALL report the incomplete task or reflection as a blocking finding
- **AND** SHALL leave the learner-owned section and task checkbox unchanged
- **AND** SHALL not report learning completion

### Requirement: Verification maps the change contract to reproducible evidence

The HumanSpec verify workflow SHALL assess the observable outcome and completion evidence from the proposal, each applicable delta-spec requirement and scenario, the learner's implementation, and relevant project checks. Each assessed item SHALL be reported as pass, fail, or inconclusive with the evidence observed and the remaining gap.

#### Scenario: Behavioral evidence is reproducible

- **WHEN** the implementation demonstrates the proposal outcome and each applicable requirement or scenario has matching test, demonstration, or review evidence
- **AND** the relevant project checks complete successfully or are explicitly confirmed by the learner
- **THEN** verification SHALL report the matched evidence and mark the assessed software items as passing

#### Scenario: Evidence is missing or cannot be reproduced

- **WHEN** a requirement, scenario, completion claim, test, or relevant project check has no sufficient evidence or cannot be run in the current environment
- **THEN** verification SHALL mark the affected item as inconclusive or failing as appropriate
- **AND** SHALL name the missing reproduction step or learner action needed to resolve it
- **AND** SHALL not convert missing evidence into a pass based on file existence alone

### Requirement: Verification preserves learner ownership while recording its result

The HumanSpec verify workflow SHALL preserve application code, test implementation code, learner reflections, and practice-task checkboxes. After review, it SHALL update only the explicitly reserved `AI 验证记录` section of the selected change's `learning.md` with the verification steps, evidence, learning-result assessment, blockers, and suggested next action.

#### Scenario: Verification records a result

- **WHEN** verification completes with passing, failing, or inconclusive findings
- **THEN** the workflow SHALL record the latest result in the named `AI 验证记录` section
- **AND** SHALL leave all other sections of `learning.md`, application files, and test implementation files unchanged

#### Scenario: Verification is run again after a failed attempt

- **WHEN** the learner resolves a reported gap and requests verification again
- **THEN** the workflow SHALL replace or update only the latest AI verification record in the named section
- **AND** SHALL preserve the learner's prior reflections and task choices
- **AND** SHALL report the new evidence without duplicating stale verification output

### Requirement: Verification produces an actionable disposition

The HumanSpec verify workflow SHALL distinguish blocking findings, non-blocking suggestions, and follow-up learning items. A failed or inconclusive verification SHALL identify the concrete gap and route the learner back to `humanspec-coach` or a learner-owned correction. A passing verification SHALL identify the evidence supporting the result and may recommend `humanspec-archive`, but SHALL not archive the change or update the roadmap itself.

#### Scenario: Verification fails

- **WHEN** a required task, reflection, software requirement, test, or completion-evidence check fails or remains inconclusive
- **THEN** the workflow SHALL report the finding with its evidence and severity
- **AND** SHALL give one concrete learner-owned next action
- **AND** SHALL direct the learner to `humanspec-coach` when task-specific guidance is needed

#### Scenario: Verification passes

- **WHEN** all required practice tasks, learner reflections, software evidence, and relevant checks are complete and sufficient
- **THEN** the workflow SHALL report a passing disposition and summarize the evidence
- **AND** SHALL recommend `humanspec-archive` as the next action
- **AND** SHALL leave archiving, specification synchronization, roadmap updates, and learner-history updates to their later workflows

### Requirement: Generated verification surfaces remain equivalent across platforms

The generated HumanSpec verify skill and HumanSpec verify command SHALL communicate the same context requirements, learning gates, evidence dispositions, ownership boundary, write boundary, and next actions. The workflow SHALL resolve the selected change and the three project context documents using platform-appropriate paths on Windows, macOS, and Linux.

#### Scenario: Skill and command expose the same contract

- **WHEN** the learner starts verification through either the generated skill or the generated HumanSpec command
- **THEN** both surfaces SHALL describe equivalent verification behavior and the same reserved write location
- **AND** neither surface SHALL introduce a public implementation-apply workflow

#### Scenario: Verification runs from a Windows project path

- **WHEN** the selected change and project context documents are beneath a Windows project root
- **THEN** verification SHALL resolve and report the same logical files using Windows-valid path semantics
- **AND** SHALL not require forward-slash path separators

### Requirement: Verification records canonical learning feedback

Every verify result SHALL include one versioned, machine-readable learning-feedback region containing a learning status and zero or more typed `mastered`, `gap`, and `review` records. Empty record sets SHALL be represented by the absence of that record type, not by placeholder text that can be parsed as a topic.

#### Scenario: Software and learning both pass

- **WHEN** reproducible software evidence passes and all required learning evidence is complete
- **THEN** verify SHALL record `learning-status: complete`
- **AND** MAY record evidence-supported mastered topics, gaps, and review items

#### Scenario: Software passes but learning evidence is incomplete

- **WHEN** software evidence passes but required reflection or understanding evidence is missing
- **THEN** verify SHALL NOT record `learning-status: complete`
- **AND** SHALL record no mastered topic
- **AND** MAY record supported gaps or review items

#### Scenario: Verification fails or is inconclusive

- **WHEN** the verification disposition is failing or inconclusive
- **THEN** verify SHALL record the corresponding non-complete learning status
- **AND** MAY record evidence-supported gaps and review items
- **AND** SHALL NOT infer mastery from completed task checkboxes or passing tests alone

#### Scenario: A feedback category is empty

- **WHEN** verify has no supported record for a feedback category
- **THEN** it SHALL omit records of that type
- **AND** SHALL NOT emit `<none>`, `none`, or any equivalent placeholder as a topic value

### Requirement: Verification evaluates proposal scope and constraints

Verify SHALL evaluate the implementation and artifacts against the proposal's included scope, excluded scope, and constraints in addition to observable outcomes, requirements, tasks, and project checks.

#### Scenario: Implementation violates excluded scope

- **WHEN** implementation evidence introduces behavior, dependencies, or design explicitly excluded by the proposal
- **THEN** verify SHALL produce a blocking finding
- **AND** SHALL cite the excluded-scope statement, concrete implementation evidence, and a learner-owned next step

#### Scenario: A declared constraint cannot be established

- **WHEN** a proposal constraint is relevant but the required evidence cannot be inspected or a required check cannot run
- **THEN** verify SHALL return an inconclusive or blocking disposition as appropriate
- **AND** SHALL identify the missing evidence and how the learner can supply it

### Requirement: Every blocker is independently actionable

Each verification blocker SHALL carry its own contract reference, observed evidence, consequence, and next learner action. A single global next action SHALL NOT substitute for missing per-blocker evidence.

#### Scenario: Verification finds multiple blockers

- **WHEN** verify identifies more than one independent blocking issue
- **THEN** each blocker SHALL identify the affected outcome, requirement, scope item, constraint, task, or learning gate
- **AND** each blocker SHALL provide evidence and one bounded learner-owned next step
