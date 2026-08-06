## Why

The HumanSpec schema, workflow profile, and project-context document templates are now available, but `humanspec-init` currently stops after bootstrapping the profile and generated tool surfaces. A new project therefore has no `project.md`, `roadmap.md`, or `learner.md` for later workflows to read, so the learning loop cannot reach a stable initialized state. This change completes the roadmap's project-initialization slice without replacing the existing CLI bootstrap.

## What Changes

- Extend the generated `humanspec-init` skill and command to conduct the project-level initialization conversation after the user runs the local CLI bootstrap.
- Update the shared project-context guidance so it distinguishes initial generation by `humanspec-init` from later document updates owned by future workflows.
- Collect the project's goal, target users, technology stack, constraints, completion criteria, learner experience, learning goals, session time budget, and hint preferences.
- Propose an initial roadmap milestone and a small set of candidate practice slices for learner confirmation without creating those changes yet.
- Materialize `openspec/project.md`, `openspec/roadmap.md`, and `openspec/learner.md` from the registered HumanSpec templates, preserving their frontmatter markers and parseable roadmap/learner entry formats.
- Define initialization behavior for missing, partially present, and already complete context documents.
- On repeated initialization, preserve learner-authored content, show proposed differences, and require explicit confirmation before modifying existing documents; never silently overwrite them.
- Report the initialized documents, ownership boundaries, and the next `/humanspec:next` action, without claiming that later adaptive routing or learning-history behavior exists.
- Keep initialization project-local: global HumanSpec installation and the full `next`, `propose`, `verify`, and `archive` behaviors remain outside this change.

## Capabilities

### New Capabilities

- `humanspec-init-workflow`: Conducts the HumanSpec project initialization conversation, creates the three project context documents, and reaches a ready state with safe repeat-run behavior.

### Modified Capabilities

No existing capability requirements change. The new initialization workflow consumes the existing `humanspec-project-context` document protocol without changing its paths, markers, or document structure.

## Impact

- Updates the `humanspec-init` and shared HumanSpec workflow templates under `src/core/templates/workflows/`.
- Reuses the registered project-document templates, marker detection, and platform-aware path resolution under `src/core/templates/project-docs/`.
- Adds workflow-template, document lifecycle, repeated-initialization, and cross-platform path tests.
- Keeps `openspec init --profile humanspec` as the required local CLI bootstrap and does not change the existing `core` profile, public apply behavior, or global installation scope.
