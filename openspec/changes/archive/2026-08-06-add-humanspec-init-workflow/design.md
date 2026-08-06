## Context

The existing HumanSpec profile is generated through the current skill and command template registry. `openspec init --profile humanspec` already creates the project-local OpenSpec structure, persists the profile, and generates the seven HumanSpec surfaces. The current `humanspec-init` template stops at that bootstrap step and explicitly treats project-document generation as future work.

The project-context foundation is already registered in `src/core/templates/project-docs.ts`. It provides the named `project`, `roadmap`, and `learner` documents, their frontmatter markers, platform-aware destination paths, and marker detection. The three Markdown templates define the headings and parseable roadmap/learner list formats. This change should consume those contracts rather than introduce a second document list or path convention.

## Goals / Non-Goals

**Goals:**

- Make the generated `humanspec-init` skill and command guide a complete, project-local initialization conversation.
- Produce an initial, learner-confirmed project context and a small set of roadmap candidate slices without creating any change directories.
- Make missing, partial, valid, and unmarked documents distinguishable before any write.
- Make every repeat-run modification previewable and explicitly confirmed.
- Keep the generated instructions honest about learner ownership and about later HumanSpec workflows that are not implemented yet.
- Keep the same behavior and logical document layout on Windows, macOS, and Linux.

**Non-Goals:**

- Adding a global HumanSpec installer or replacing the existing CLI bootstrap.
- Implementing the `next`, `propose`, `coach`, `verify`, or `archive` state machines.
- Automatically selecting or creating the first change from the roadmap.
- Updating roadmap or learner records after verification or archive.
- Adding a general-purpose file merge engine or enforcing writes outside the generated workflow's declared planning-document boundary.

## Decisions

### 1. Keep initialization in the generated workflow layer

The primary behavior will be expressed in the `humanspec-init` skill and command templates, using the same tool-agnostic content for both surfaces. The CLI remains responsible for bootstrapping the local profile and generated surfaces; the AI workflow remains responsible for asking learner-specific questions and drafting Markdown.

Extending `openspec init` to invent project and learner content was considered and rejected: the CLI has no conversation context, and automatic writes would make it difficult to preserve learner ownership and safe repeat-run behavior. A separate global command was also rejected because the roadmap explicitly scopes MVP initialization to the project-local bootstrap.

### 2. Use the existing named document registry as the source of truth

The workflow guidance will refer to the three documents through the existing `PROJECT_DOC_TEMPLATES`, `resolveProjectDocPath`, and `detectHumanSpecDocType` contracts. Any new shared template guidance will be registered by name in the existing HumanSpec template modules rather than duplicating path or marker lists in `humanspec-init` and its command counterpart.

The generated instructions will preserve the existing template headings and list grammars. `project.md` receives project facts, `roadmap.md` receives the confirmed initial milestone and candidate slices, and `learner.md` receives learner context. Personal information that the learner defers remains an explicit placeholder or deferred item; the AI does not fill it from assumptions.

### 3. Make writing a two-phase preview/confirmation flow

The workflow will follow this order:

1. Resolve the project root and read the three registered document paths.
2. Classify each path as missing, valid HumanSpec content, malformed/invalid HumanSpec content, or existing unmarked user content.
3. Ask the project and learner questions, then propose an initial milestone and candidate slices.
4. Render proposed contents using the registered document structure, preserving existing sections and values not covered by the current answers.
5. Show a per-document creation/update summary (and the relevant proposed differences for existing files).
6. Write only after explicit learner confirmation for the affected files.
7. Re-read the results, check markers and required sections, and report either `ready` or the unresolved blockers.

Missing documents can be created after confirmation. Valid existing documents are not rewritten merely because initialization was rerun. Unmarked files are conflicts, not templates: the workflow must offer preserve, explicit conversion, or stop, and must never delete or replace them silently. A rejected update leaves the existing file unchanged.

### 4. Treat the roadmap as a proposal, not a change queue

Initialization may draft one initial milestone and a small number of candidate slices in the documented `slice: <name> — <learning focus>` form. It must not run `openspec new change` or pre-create change directories. The learner confirms the roadmap content before it is written; later `humanspec-next` or propose work can decide which candidate becomes an actual change.

### 5. Keep safety and output claims in the shared template contract

The implementation-ownership boundary remains shared across all HumanSpec surfaces. The project-context guidance will be updated to say that `humanspec-init` creates the initial documents, while future workflows may refresh them. The init-specific guidance will state that it may write only project planning documents, must not edit application or test implementation files, and must not claim adaptive routing, reflection gates, or learning-aware archive behavior.

### 6. Validate behavior through template and filesystem scenarios

Because HumanSpec workflows are generated instructions rather than a runtime conversation engine, tests will verify both the generated contract and the reusable document/path primitives. The test fixtures will exercise fresh, partial, repeat-confirmed, repeat-rejected, and unmarked-file cases with `path.join()`/`path.resolve()` expectations. Generation parity tests will assert that skill and command surfaces carry the same initialization protocol and current write boundary.

## Risks / Trade-offs

- **[AI follows the prompt inconsistently]** → Make the sequence, classification states, confirmation gate, ownership boundary, and final readiness check explicit in both generated surfaces; cover the required language with template tests.
- **[A learner has an old or unrelated `openspec/project.md`]** → Use the registered frontmatter marker for recognition and require an explicit resolution choice for unmarked files; never treat path existence alone as permission to overwrite.
- **[A repeat run erases manually refined Markdown]** → Read existing documents before drafting, preserve fields outside the current answers, preview updates, and require confirmation per affected document.
- **[The roadmap becomes over-prescriptive]** → Limit initialization to a confirmed milestone and candidate slices; do not create changes or claim that routing has selected an implementation order.
- **[Windows path behavior diverges]** → Keep logical destinations in the existing registry and resolve filesystem paths with Node's path helpers; retain Windows-specific test coverage alongside POSIX coverage.
- **[Shared guidance becomes stale]** → Update the shared project-context wording and parity assertions in the same change as the init template, rather than maintaining a second copy only in `humanspec-init`.

## Migration Plan

No migration is required for existing OpenSpec or HumanSpec projects. Existing generated workflows continue to work, and existing unmarked documents remain protected by the explicit conflict flow. After upgrading the generated HumanSpec surfaces, a learner can run the local `humanspec-init` workflow to create missing context documents or explicitly review proposed updates. The change is reversible by regenerating the previous workflow templates; it does not alter the core profile, config format, or application files.
