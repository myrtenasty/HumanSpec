## Context

The current learning template has the expected major headings but leaves several coach/verify evidence fields implicit. Verify writes a narrative latest result, while archive feedback extracts typed learner records from explicit headings or tags that the real verify workflow does not reliably produce. Existing retry tests compensate by constructing a record shape outside the actual verify contract.

The public project-context runtime is the transport and write boundary; this change defines the content contract passed through it. The contract must remain readable Markdown, preserve learner ownership, support old artifacts conservatively, and make post-archive reconciliation deterministic.

## Goals / Non-Goals

**Goals:**
- Align the learning scaffold, verify result, archive parser, and learner feedback records around one versioned grammar.
- Make mastery eligibility explicit and different from software pass/fail.
- Make every verification blocker traceable to scope, constraints, or another contract source.
- Recover feedback after interruption using only canonical archived state.
- Preserve all learner-authored content and support existing artifacts without fabricating evidence.

**Non-Goals:**
- Change the project-document runtime command shapes or write protocol.
- Decide adaptive milestone/candidate behavior.
- Automate learner reflections or allow verify to fill them in.
- Convert old narrative verification text into inferred mastery.

## Decisions

### 1. Expand prompts without changing learner ownership boundaries

Keep the six major learning sections, but add explicit prompts under them:

- `本次学习契约`: goal, explicitly excluded learning, completion evidence.
- `开始前`: existing understanding and intended starting point.
- `实践任务`: learner-owned checkboxes.
- `卡住时的记录`: attempted approach, observed error/behavior, diagnosis process, hypothesis, requested hint level, used hint level.
- `完成后`: what was learned, what remains unclear, whether it can be reimplemented without viewing the code, and next review topic.
- `AI 验证记录`: one machine-managed latest-result region.

A learner can explicitly state that no stuck episode occurred. The template comments explain completeness, but verify evaluates meaningful content rather than exact prose matching.

Alternative considered: add a separate JSON evidence file. Rejected because it would split the learner's durable practice narrative and complicate the existing artifact graph.

### 2. Use bounded comment markers with typed Markdown records

Inside the latest verify result, reserve this grammar:

```markdown
<!-- humanspec:learning-feedback:start version=1 -->
- learning-status: complete|incomplete|inconclusive
- mastered: <topic>
- gap: <topic>
- review: <topic>
<!-- humanspec:learning-feedback:end -->
```

Typed lines may repeat and preserve display text. A type with no values emits no line; `<none>` and similar sentinels are forbidden. The markers provide a deterministic parser boundary without making the rest of `learning.md` machine-owned.

Alternative considered: parse translated headings and arbitrary narrative bullets. Rejected because localized prose and model variation are not a replayable protocol.

### 3. Separate software disposition from learning status

The existing overall disposition remains pass/fail/inconclusive for the complete verification. `learning-status` independently records complete/incomplete/inconclusive. Mastered records are accepted only when learning status is complete; gaps and review records are valid for every status when supported by evidence.

This prevents passing tests from being treated as proof of understanding and allows useful learning feedback from a failed run.

Alternative considered: infer mastery from overall pass. Rejected because the product explicitly distinguishes software completion from learning completion.

### 4. Parse canonical feedback before conservative legacy forms

The parser locates the latest bounded version-1 region and validates known types. For older artifacts it may recognize the existing explicit headings/tags, but it never extracts arbitrary prose. Unknown future versions produce an actionable unsupported-version issue rather than a best-effort interpretation.

Logical duplicate identity is `(record type, normalized topic)`, where normalization trims and collapses whitespace and performs locale-stable case folding. The original topic text is retained for display.

Alternative considered: replace all legacy parsing immediately. Rejected because already archived changes must remain reconcilable when they contain explicit old-format records.

### 5. Evaluate scope and constraints as first-class verification gates

Verify builds one checklist from observable outcome, delta requirements/scenarios, practice tasks, included scope, excluded scope, constraints, implementation evidence, project checks, and learning evidence. Each finding records its source category/reference, observed evidence, consequence, and next learner action.

A required check that cannot run is not silently passed. Verify reports the evidence gap and chooses failing or inconclusive according to whether another contract violation is already established.

Alternative considered: keep scope/constraints as a narrative review suggestion. Rejected because excluded work and violated constraints can invalidate an otherwise passing slice.

### 6. Reconcile only from canonical archived inputs

After canonical archive succeeds, retry reads the archived `learning.md` and current registered project documents through the runtime. It does not depend on chat history or regenerate feedback with a model. The same typed record identities feed plan preview, apply, and reconciliation.

Tests create a real verify-shaped artifact, interrupt the learner write after the roadmap pending marker, and then recover with archive evidence alone.

## Risks / Trade-offs

- [Marker or tag syntax leaks into learner-facing Markdown] → keep the region small, commented at its boundaries, and explain that only verify manages it.
- [Template expansion feels burdensome] → allow explicit not-applicable/no-stuck responses and gate only evidence relevant to the run.
- [Legacy parsing imports an unintended bullet] → accept only already supported explicit headings/tags, never generic narrative; add adversarial fixtures.
- [Normalization collapses two intentionally distinct topics] → preserve display text, scope dedupe by record type, and use conservative whitespace/case normalization only.
- [Overlapping active changes edit verify/archive templates] → implement after the runtime change and before adaptive-roadmap/workflow-contract changes, then regenerate once per stacked change.

## Migration Plan

1. Add parser/types for the versioned feedback region with legacy read compatibility.
2. Expand the package learning template and fixture expectations.
3. Update verify output and scope/constraint gates to emit the canonical region.
4. Make archive planning/reconciliation consume canonical records first.
5. Replace synthetic retry fixtures with real verify-shaped `learning.md` and interruption tests.
6. Regenerate committed workflow surfaces and run packed/cross-platform tests.

Rollback preserves the parser's legacy path and learner content. A rollback may stop emitting version 1, but already written version-1 records remain bounded and visible Markdown rather than corrupting the artifact.
