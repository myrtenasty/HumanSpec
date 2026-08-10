## ADDED Requirements

### Requirement: Learning artifact scaffolds the complete evidence lifecycle

The built-in `learning.md` template SHALL provide explicit learner-owned fields for the before-practice plan, each stuck episode, and the after-practice reflection expected by HumanSpec coach, verify, and archive. The scaffold SHALL distinguish intentionally empty or deferred evidence from an accidentally omitted response.

#### Scenario: A new learning artifact is rendered
- **WHEN** a learner requests instructions for the `learning` artifact of a `human-learning` change
- **THEN** the template SHALL prompt for the learning goal, explicitly excluded learning, intended starting point, practice tasks, attempted approach, observed error or behavior, diagnosis process, current hypothesis, requested and used hint level, completed understanding, remaining uncertainty, ability to reimplement without the code, and next review topic
- **AND** learner-owned fields SHALL remain outside the reserved AI verification block

#### Scenario: The learner never becomes stuck
- **WHEN** no stuck episode occurred during the practice
- **THEN** the learner SHALL be able to record that fact explicitly without inventing an attempt, error, hypothesis, or hint level
- **AND** verify SHALL not treat the absence of a fabricated stuck episode as missing evidence

#### Scenario: A legacy learning artifact lacks new prompts
- **WHEN** verify opens an existing `learning.md` created before the expanded scaffold
- **THEN** it SHALL report the specific evidence fields required for the current result
- **AND** SHALL preserve learner-authored content rather than replacing the artifact with the latest template

### Requirement: Learning artifacts reserve one machine-readable feedback region

The learning artifact contract SHALL reserve a versioned feedback region inside `AI 验证记录` for the latest verify result. Learner-owned sections SHALL not contain machine-generated mastery, gap, or review records.

#### Scenario: Template exposes the reserved region
- **WHEN** a new learning artifact is generated
- **THEN** the `AI 验证记录` section SHALL identify the versioned machine-managed boundary
- **AND** SHALL state that verify may replace only that reserved content

#### Scenario: Verify updates the reserved region
- **WHEN** verify records a new result
- **THEN** every byte outside the reserved verification region SHALL remain unchanged
- **AND** only one latest machine-readable feedback region SHALL remain
