## Context

The current feedback planner can remove an archived slice, append/update an archived record, and add typed learner records. It does not persist milestone lifecycle, and the next-context resolver sees only whatever candidates were already present. Tests currently insert a later candidate manually, masking the empty-roadmap behavior after the last slice.

This change follows the public runtime and canonical learning-feedback changes. The deterministic runtime can validate, preview, write, deduplicate, and reconcile structured records; deciding a meaningful learning direction still requires workflow reasoning and learner consent.

## Goals / Non-Goals

**Goals:**
- Add minimally invasive, parseable milestone lifecycle to existing roadmaps.
- Make archived evidence affect milestone state and future candidate context.
- Keep semantic proposals explainable and learner-confirmed.
- Make archive/next retries deterministic and duplicate-free.
- Preserve a legitimate empty roadmap instead of filling it silently.

**Non-Goals:**
- Automatically create a change from a candidate.
- Add a scheduler, spaced-repetition algorithm, or multi-milestone optimizer.
- Let the deterministic runtime generate pedagogical meaning from free-form evidence.
- Rewrite valid legacy roadmaps without a confirmed adaptive update.

## Decisions

### 1. Extend the existing milestone block with one status token

Use the existing `## 里程碑 <identity>` heading as milestone identity and add an exact line:

```markdown
- status: planned|active|completed|paused
```

New documents start with one active milestone; additional milestones default to planned. At most one active milestone is valid. Outcome, learning focus, and completion-evidence lines remain unchanged and human-editable.

For a legacy roadmap with no status lines, analysis reports a compatibility inference—the first milestone is the current milestone—but does not persist it until a learner-confirmed feedback plan. Multiple explicit active milestones or unknown tokens block adaptive mutation.

Alternative considered: replace roadmap Markdown with YAML/frontmatter data. Rejected because it would make the living roadmap less approachable and require a disruptive migration.

### 2. Preserve the existing candidate line grammar

Continue to use:

```markdown
- [ ] slice: <change-name> — <learning focus>
```

The active milestone supplies candidate context, so candidate lines do not gain embedded milestone IDs. This preserves existing parsing and human editability. A valid change name is the stable candidate identity; normalized duplicate detection uses that name, not mutable learning-focus text.

Alternative considered: add JSON IDs to every candidate. Rejected as unnecessary for the MVP and noisy in a learner-edited document.

### 3. Split semantic proposal from deterministic validation and writing

The archive workflow derives a proposed milestone transition and optional candidate from the canonical verification/learner context, then submits structured plan input:

- selected milestone identity and proposed lifecycle state;
- optional candidate change name and learning focus;
- evidence references used to explain the proposal.

The runtime validates identity, allowed transitions, grammar, duplicates, archived-change conflicts, and document preconditions. It does not invent learning focus or a candidate name. The learner sees one preview and may confirm all, reject all, or accept archive/milestone/learner updates while rejecting the candidate.

Alternative considered: generate the candidate entirely inside TypeScript. Rejected because deterministic code lacks the semantic project/learning judgment and would either hard-code weak heuristics or hide model behavior behind a supposedly deterministic API.

### 4. Use explicit milestone transition rules

Allowed transitions are:

- `planned -> active|paused`
- `active -> completed|paused`
- `paused -> planned|active`
- identical-state replay as already applied

A completed milestone is immutable through archive feedback; reopening it requires a separately confirmed roadmap edit outside this automatic transition. Activating a planned/paused milestone requires that no other milestone remains active in the proposed complete document.

Alternative considered: infer completion whenever one slice archives. Rejected because a milestone can contain multiple slices and completion is a learner-confirmed semantic judgment.

### 5. Keep candidate rejection as durable absence

The plan separates candidate effects from the required archived outcome and learner feedback effects. If the learner rejects the candidate, application omits that effect and records no placeholder. The result explicitly reports `candidateStatus: rejected|not-proposed|confirmed`, allowing next to distinguish a valid empty roadmap from a parse failure without inventing content.

No rejected proposal transcript is added to `roadmap.md`; the workflow may report it in conversation, while durable state remains the learner-approved document.

### 6. Extend next context with evidence, not generated prose

The runtime next result returns active milestone fields, candidates, pending feedback, archived identities, and typed learner records. The workflow uses these inputs and the shared sizing contract to explain candidate fit. If evidence cannot select uniquely, the workflow asks the learner.

Pending reconciliation has priority over candidate selection. An empty candidate list is a first-class `empty` result with a reason code such as `no-confirmed-candidate`, not a failure and not a creation trigger.

### 7. Make adaptive identities replay-safe

Archived outcomes use archived change identity. Milestones use exact heading identity. Candidates use normalized valid change name. Typed learner records use the canonical feedback identity from the preceding change. Plan/application/reconciliation compare these identities before insertion and preserve existing human text when logically equivalent.

Tests remove the manual `later-change` insertion and cover one-candidate completion, candidate rejection, duplicate replay, ambiguous active milestones, and interrupted adaptive updates.

## Risks / Trade-offs

- [One active milestone may be too restrictive later] → keep statuses versioned and treat multi-track roadmaps as a future capability; MVP routing stays unambiguous.
- [Model proposes a poorly sized candidate] → require learner confirmation and route candidate fit through the shared sizing contract before propose creates anything.
- [Legacy roadmap inference chooses the wrong milestone] → show the inferred milestone in preview and persist only after explicit confirmation.
- [Candidate rejection is not visible after conversation loss] → next reliably sees an empty confirmed set and asks the learner; avoid storing unapproved content merely for audit convenience.
- [Overlapping changes touch archive/next files] → stack after runtime and feedback-contract changes and regenerate projections only after resolving the combined canonical templates.

## Migration Plan

1. Extend roadmap analysis/types with status tokens and legacy inference, without changing writes.
2. Add structured adaptive plan input/output and transition validation.
3. Extend feedback plan/apply/reconcile with optional milestone and candidate effects.
4. Extend next context and workflow reasoning over canonical learner records.
5. Update the roadmap template for new projects and preserve legacy documents until confirmation.
6. Replace synthetic later-candidate tests with adaptive end-to-end cases and packed runtime coverage.

Rollback leaves status lines and candidate lines as readable Markdown. Older code ignores the added status line while retaining milestone and candidate content; no automatically created changes need cleanup.
