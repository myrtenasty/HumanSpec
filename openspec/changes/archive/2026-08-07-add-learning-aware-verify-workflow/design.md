## Context

The HumanSpec profile already generates `humanspec-verify` skill and command surfaces, and the `human-learning` schema already provides the named `learning.md` sections, tracked task checkboxes, and internal structured apply instructions. The current verify template is intentionally a preliminary contract: it reviews evidence and writes an AI verification record, but it does not yet gate on learner reflections or distinguish a complete learning practice from a merely working implementation.

See `proposal.md` for the motivation and `specs/humanspec-verify-workflow/spec.md` for the observable contract. This change remains within the existing prompt-template and generated-surface architecture; it does not introduce a public apply workflow or a separate verification service.

## Goals / Non-Goals

**Goals:**

- Make the generated verify workflow perform a deterministic, ordered review of context readiness, task/reflection completion, software evidence, and learning outcome.
- Keep skill and HumanSpec command content generated from the same canonical template.
- Make the AI-owned verification record safe to update repeatedly without touching learner-owned content.
- Reuse existing structured CLI output, project-document registry, planning-home resolution, and path helpers.
- Add focused contract and cross-platform tests that make later template drift visible.

**Non-Goals:**

- Do not build a runtime verifier, test runner abstraction, session database, or public `apply` command.
- Do not change the `human-learning` schema DAG, task-progress protocol, or artifact names.
- Do not implement adaptive `humanspec-next`, learning-aware archive, roadmap mutation, or learner-history synchronization.
- Do not enforce writes made by arbitrary external AI tools; the workflow contract can constrain generated HumanSpec surfaces but cannot technically intercept every tool.

## Decisions

### 1. Keep verification prompt-first and reuse existing structured interfaces

The canonical behavior will live in `src/core/templates/workflows/humanspec-verify.ts`, as the other HumanSpec workflows do. The workflow will instruct the agent to use the existing structured status and apply-instruction JSON for the selected change, then read the concrete context files returned by that interface. It will use the existing project-document registry and planning-home helpers as the source of truth for `project.md`, `roadmap.md`, and `learner.md`.

**Why:** This preserves the current HumanSpec architecture, keeps the internal apply protocol available without exposing an apply workflow, and avoids inventing a second state model.

**Alternative rejected:** A new CLI verification command would provide stronger mechanical enforcement, but would expand this change into a new execution surface before the prompt contract and evidence rules have been exercised in real learning sessions.

### 2. Use an explicit review order and a three-way disposition

The generated instructions will require this order:

1. resolve one change and confirm all required context files;
2. inspect task checkboxes and learner-owned reflection sections;
3. map proposal/specification/completion claims to implementation and reproducible project evidence;
4. classify each item as pass, fail, or inconclusive;
5. write the latest AI verification record and state the next learner-owned action.

The overall result will be passing only when all blocking gates and required evidence pass. Inconclusive evidence remains visible rather than being treated as success.

**Why:** Separating context, learning evidence, and software evidence prevents a passing test from being mistaken for completed learning and gives failed verification a stable retry path.

**Alternative rejected:** A single free-form review prompt is shorter, but it makes omissions and false-positive passes difficult to detect or test.

### 3. Recognize learner-owned sections by their registered headings and known template placeholders

The workflow will inspect the explicitly named `## 开始前`, `## 卡住时的记录`, `## 完成后`, and `## AI 验证记录` sections. Known template comments or placeholder-only content do not count as learner evidence. A stuck-state section is required only when the learner records a stuck episode; when present, the attempted approach, observation, hypothesis, and requested hint must be distinguishable. Missing or duplicated named sections are blockers, not permission to guess.

**Why:** The learning schema already defines these headings and ownership boundaries. Exact section lookup protects learner text and avoids broad markdown or regex heuristics that could classify unrelated prose as a reflection.

**Alternative rejected:** Treating any non-empty `learning.md` as evidence would allow the generated template itself to pass.

### 4. Update one explicitly reserved AI-owned section

The workflow will locate the single named `## AI 验证记录` section and update only its body. The record will contain the selected change, evidence reviewed, per-gate disposition, blockers or suggestions, learning-result assessment, and the next action. On a retry, the latest record replaces the prior AI-owned record in that section; learner reflections and task checkboxes remain untouched. If the named section is absent or ambiguous, verification reports a blocker instead of editing by guessed boundaries.

**Why:** A single stable ownership boundary makes repeated verification safe and prevents duplicate stale records or accidental edits to personal reflections.

**Alternative rejected:** Appending arbitrary notes to the end of `learning.md` is not idempotent and can place AI content inside a learner-owned section.

### 5. Preserve delivery parity through existing descriptors and factories

The skill and command factories will continue to consume the same canonical verify content. Tests will assert equivalent requirements, write boundaries, next actions, and explicit non-goals through both generated surfaces. No new workflow ID, namespace, managed-artifact entry, or profile member is needed.

**Why:** The profile already registers `humanspec-verify`; changing its content rather than its identity avoids cleanup, migration, and parity drift.

### 6. Resolve paths with existing platform-aware helpers

The workflow guidance and tests will use the existing planning-home and project-document path conventions. Tests will build expected paths with Node's `path.join()`/`path.resolve()` and include Windows-style logical roots. No slash-based path matching or new path-detection mechanism will be introduced.

**Why:** The same logical change and context documents must be found on Windows, macOS, and Linux, and the repository already has tested helpers for this behavior.

## Risks / Trade-offs

- **[Risk] A generated prompt can be ignored by an external AI tool.** → Keep the implementation boundary, ordered gates, explicit write location, and non-goals in both generated surfaces; add regression tests, while acknowledging that universal external-tool interception is out of scope.
- **[Risk] Template-only text may be mistaken for reflection.** → Use the registered section headings and known template placeholders, require substantive learner-authored evidence, and report ambiguity as a blocker.
- **[Risk] A verification retry could overwrite learner content.** → Permit writes only inside the named AI verification section; reject missing or duplicate section boundaries; test that all other sections remain unchanged in representative fixtures.
- **[Risk] Project checks differ across repositories.** → Read the project's declared check commands and completion evidence; ask the learner to run unavailable checks and report them as inconclusive instead of inventing commands.
- **[Risk] Requirements and scenarios may be too broad to verify in one session.** → Require per-item evidence and a concrete disposition, and route unresolved scope back to a learner-owned correction or a follow-up change rather than silently passing.

## Migration Plan

No data migration or configuration change is required. Existing generated `humanspec-verify` artifacts will receive the updated canonical content on the next `openspec update` or profile synchronization. Existing `learning.md` files remain valid; verification will report missing, malformed, or ambiguous named sections as blockers and will not rewrite them automatically.

Before release, run the focused HumanSpec tests, the full test suite, lint/build checks, and strict OpenSpec validation. If the new contract proves too strict, revert the generated template and its tests without changing the schema or stored learning artifacts.
