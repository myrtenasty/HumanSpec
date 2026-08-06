## Context

The proposal describes the missing coaching behavior after the HumanSpec profile, project context, human-learning schema, and human-sized propose workflow. The repository already has a registered `humanspec-coach` workflow and shared template constants in `src/core/templates/workflows/`, but the current coach content is a short read-only checklist and explicitly leaves later reflection behavior unimplemented.

HumanSpec workflows are delivered as generated skill and command text rather than as a new runtime command engine. The existing `human-learning` schema provides the authoritative `learning.md` task, reflection, stuck-state, and AI-verification sections. Structured artifact status and task progress are already available through the OpenSpec instruction protocol. The existing project-document registry and shared HumanSpec boundary constants must remain the sources of truth for context paths and ownership rules.

## Goals / Non-Goals

**Goals:**

- Make the existing coach template a complete, explicit contract for context loading, evidence-based diagnosis, three-level hint escalation, learner ownership, and artifact-based resume.
- Keep the generated skill and namespaced HumanSpec command surfaces equivalent by composing one canonical content block.
- Add focused tests that verify the generated contract and its parity with the existing workflow/profile projections.
- Preserve cross-platform path guidance through the existing registered project-document and planning-home conventions.

**Non-Goals:**

- Add a new CLI command, workflow ID, session database, or external coaching service.
- Persist chat transcripts or have the coach write learner reflections, task checkboxes, application code, or test code.
- Implement learning-aware verification, adaptive `humanspec-next`, roadmap updates, or archive feedback.
- Provide a technical sandbox that can prevent every external AI tool from writing files; the existing workflow boundary remains an instruction contract.

## Decisions

### 1. Extend the canonical workflow template instead of adding runtime orchestration

Update the existing `humanspec-coach` template module and reuse `HUMANSPEC_PROJECT_DOCS`, `HUMANSPEC_IMPLEMENTATION_BOUNDARY`, and `HUMANSPEC_WRITE_BOUNDARIES`. Both the skill and command factories will continue to consume the same composed content.

This preserves the current registration, profile membership, command identities, cleanup behavior, and adapter parity. A new runtime orchestration layer would duplicate behavior already expressed by generated workflow instructions and would make the later verify/next/archive changes harder to isolate.

**Alternative considered:** Add a CLI subcommand that manages coaching state. Rejected because the product contract is an AI-guidance behavior, and the current architecture intentionally keeps workflow behavior in generated surfaces.

### 2. Resolve task context from structured planning state

The coach guidance will first resolve the planning home and selected change, then use the existing structured status/instruction outputs to identify the current task, progress, learning artifact, and context files. It will read the registered project documents and the learner-provided code or error evidence. If multiple active changes or an incomplete context prevent a unique selection, it will ask the learner rather than infer one.

This follows the existing OpenSpec state protocol and avoids guessing from directory names, free-form markdown scanning, or hardcoded path separators.

**Alternative considered:** Select the first or most recently modified change by inspecting the filesystem. Rejected because it can silently coach the wrong change and violates the roadmap's explicit ambiguity behavior.

### 3. Use learner-owned artifact notes as the resume boundary

The coach will not introduce a new session store. Resume guidance will re-read the current change state and the learner-owned `卡住时的记录` entries, which already capture attempted approaches, observed evidence, hypotheses, and requested hint levels. If those records do not identify a single task, the coach will ask the learner to restate or select the context.

This keeps resume state reviewable in the change and avoids inventing or rewriting personal reflections. The conversation itself remains ephemeral; only learner-authored notes are treated as durable coaching context.

**Alternative considered:** Automatically append coach transcripts or hint state to `learning.md`. Rejected because the schema assigns reflection ownership to the learner and automatic notes could fabricate personal learning evidence.

### 4. Encode progressive hint policy as explicit response stages

The template will define level one, level two, and level three in the same terms as the roadmap and spec. Every response will label its level, begin with the least revealing useful level, ask for learner evidence, and escalate only on an explicit request or confirmation that the current hint was insufficient. Level three is limited to pseudocode, API shape, or a local example and is not a complete patch.

This makes the policy inspectable in generated artifacts and testable without trying to infer teaching quality from arbitrary model output.

**Alternative considered:** Give the model one broad instruction to “be helpful but do not implement.” Rejected because it does not define escalation, makes behavior inconsistent, and provides weak review evidence.

### 5. Test the contract at the template and projection boundaries

Add a focused coach-template test alongside the existing HumanSpec template tests. It will assert the required hint levels, escalation language, context/read-only rules, resume behavior, and learner ownership statements. It will compare the skill and command content produced by the two existing factories, while the existing profile/parity tests continue to verify registration and generated identities.

Where a fixed conversation fixture is useful, test the presence and ordering of the coaching contract rather than asserting a particular model's prose. Do not add a fake runtime coach that would test an architecture the product does not have.

### 6. Preserve platform-neutral path behavior

The template will refer to the existing project-document registry and planning-home resolution, and all implementation/test expectations will use Node.js path helpers and platform-neutral logical paths. Windows coverage will assert that the selected change and three project documents resolve beneath the same planning home without requiring forward-slash literals.

## Risks / Trade-offs

- **[Prompt boundaries are not technical enforcement]** External AI tools may ignore generated instructions or allow other tools to write files → keep the ownership boundary explicit in both generated surfaces, retain the existing no-apply profile, and test the contract; do not claim universal interception.
- **[Structured context may be unavailable in a partially planned change]** A learner can invoke coaching before the learning artifact or task state is ready → report the precise missing artifact/task context and route back to planning or the learner's next action rather than guessing.
- **[Resume depends on learner-authored notes]** An interrupted session may have no durable record of the last hint → ask the learner to restate the task and encourage use of the existing stuck-state format; do not fabricate recovery state.
- **[Generated surfaces can drift]** Skill and command templates may diverge as one is edited independently → compose both from the same canonical content and keep projection/parity tests mandatory.
- **[Path wording can become platform-specific]** Examples may accidentally assume POSIX separators → use the registered path helpers and add Windows path assertions without embedding platform-specific destinations.

## Migration Plan

No change-directory or schema migration is required. The workflow ID, profile membership, command names, and `learning.md` format remain stable. Updating or reinstalling the HumanSpec profile will regenerate the existing coach skill and command with the new contract; projects that do not regenerate their managed artifacts will continue using the previous template until their normal update flow runs. Rollback consists of restoring the prior coach template and regenerating the managed coach surfaces; no learner-authored files need to change.
