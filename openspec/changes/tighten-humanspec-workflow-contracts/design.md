## Context

The HumanSpec workflow templates are generated across skill and command surfaces from TypeScript prompt bodies and shared fragments. The main behavioral paths exist, but contract details have drifted: init runs the bootstrap that must precede its own installation, sizing guidance is duplicated and incomplete, and coach/verify do not express teaching evidence and no-solution boundaries with the same precision.

This change is intentionally prompt-contract focused. It follows the runtime, feedback grammar, and adaptive-roadmap changes so it can reference their final public commands and evidence/state semantics without reopening those designs.

## Goals / Non-Goals

**Goals:**
- Make init side-effect-free with respect to CLI bootstrap and truthful about available workflows.
- Make propose and next render the exact same complete sizing policy.
- Tighten learner-owned hint evidence and verification follow-up/no-solution output.
- Keep every generated HumanSpec delivery surface behaviorally identical.

**Non-Goals:**
- Add new runtime commands or Markdown parsers.
- Mechanically score change size from file/line counts.
- Enforce the human-implementation boundary outside HumanSpec workflows.
- Migrate workflow registration to the pending unified manifest.

## Decisions

### 1. Represent sizing as one shared structured prompt contract

Create one exported HumanSpec sizing definition with stable criterion IDs and rendered guidance. It covers:

- one observable outcome;
- one primary goal and at most two supporting concepts;
- two to five independently verifiable tasks;
- one clear completion evidence;
- configured session budget;
- multiple frameworks/infrastructure or independent business capabilities;
- multiple unfamiliar prerequisite concepts;
- whole-module/system wording;
- learner experience and cognitive load;
- roadmap-path impact.

Both propose and next interpolate the same rendered block and use the same fit/oversized reporting shape. Criterion IDs support focused tests, while the workflow still performs contextual judgment rather than a numeric score.

Alternative considered: duplicate equivalent prose in both templates. Rejected because the current gap is semantic drift despite similar intent.

Alternative considered: implement a deterministic size score. Rejected because learner experience and cognitive load cannot be reduced to file counts or fixed weights without contradicting the roadmap.

### 2. Make bootstrap verification read-only inside init

Init checks the effective profile, expected explicitly registered HumanSpec workflow surfaces, absence of a public apply workflow, and project-context state. It never invokes `openspec init`. When prerequisites fail, it returns an external repair command and stops before document planning/writes.

A repeated valid init performs the existing safe document review path only. It does not rewrite config or regenerate skills/commands merely to prove they exist.

Alternative considered: retain self-bootstrap for convenience. Rejected because the local skill cannot exist before bootstrap and a second bootstrap violates its declared write boundary.

### 3. Describe responsibility rather than historical implementation status

Replace feature-status disclaimers with a stable responsibility table/shared fragment: init creates/reviews project context; next routes; propose creates planning artifacts; coach assists; verify assesses; archive syncs and feeds back. Each workflow states what it does not do without claiming sibling workflows are absent.

Alternative considered: periodically update free-form “implemented/not implemented” prose. Rejected because it becomes stale whenever another workflow lands.

### 4. Keep hint evidence explicitly split between coach output and learner record

Coach always emits `Hint level: Level N` plus one reminder that the learner records the level actually used. Requested and used levels remain separate fields in the learning scaffold. Coach never writes the artifact, even when asked; it can explain the field shape only.

This contract is added to the shared output requirements and tested at all three levels and escalation transitions.

### 5. Add verification categories without duplicating the evidence grammar

Verify's human-readable report and canonical latest result distinguish blockers, suggestions, and follow-up learning. Typed gap/review persistence continues to use the canonical feedback block defined by the preceding change. The prompt explicitly prohibits complete patches/solutions and routes implementation help to learner action or coach.

A small local example is allowed only when incomplete and necessary to explain evidence; tests assert the stronger forbidden forms rather than banning all code-like text.

### 6. Regenerate from canonical TypeScript templates and verify explicit surfaces

Edit canonical workflow/shared templates, then regenerate every named HumanSpec skill and command projection through the current pipeline. Parity tests use explicit registered surface lists and hash/content equality; no filesystem glob decides what to delete or update. Windows path expectations use `path.join()`.

The later `unify-template-generation-pipeline` change migrates these stable outputs into its manifest. Implementing that architecture here would mix behavioral correction with generation refactoring.

## Risks / Trade-offs

- [The combined prompt change spans five workflows] → keep policy fragments single-sourced, add requirement-level tests per workflow, and implement after preceding contracts stabilize.
- [Criterion IDs make prompts feel mechanical] → expose human-readable explanations to learners; use IDs primarily for template consistency and tests.
- [Models can still ignore prompt boundaries] → strengthen explicit output contracts and capstone/manual checks without claiming technical enforcement outside workflows.
- [Existing generated files drift during parallel changes] → rebase on the preceding HumanSpec stack and regenerate from one canonical state rather than hand-merging projections.
- [Windows surface paths differ] → use explicit tool registrations and Node path helpers in generation/tests.

## Migration Plan

1. Add the shared structured sizing definition and focused rendering tests.
2. Update propose and next to consume it and report roadmap impact consistently.
3. Remove bootstrap execution and stale status prose from init; add prerequisite cases.
4. Tighten coach and verify output contracts over the canonical learning grammar.
5. Regenerate explicitly registered HumanSpec skills/commands and update parity hashes.
6. Run behavioral template, profile/update/cleanup, cross-platform, and packed-surface tests.

Rollback reverts canonical templates and their generated projections together. No project data format or public CLI operation is introduced by this change.

### Deferred unified-manifest follow-up

The explicit workflow registrations, template factories, and projection parity
fixtures remain unchanged by this change. The separate
`unify-template-generation-pipeline` change may later migrate those registrations
to one manifest and derive profile, skill, command, cleanup, and parity metadata
from it. That architectural refactor is a follow-up only: this change must not
add a second manifest, delete the current registries, or use filesystem globs to
change ownership of generated surfaces.
