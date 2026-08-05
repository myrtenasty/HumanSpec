## Context

The repository now ships a `human-learning` schema, but generated workflow surfaces are selected by a global profile model with only `core` and `custom`. `core` includes `apply`, and init/update both consult the global profile rather than recording project intent. A one-time `--profile humanspec` override would therefore be unsafe unless later updates resolve the same choice; changing `core` itself would break existing OpenSpec users.

Workflow registration is also intentionally duplicated today across template projections, profile constants, skill/command detection, onboarding, and cleanup. `unify-template-generation-pipeline` plans to replace this structure, but the HumanSpec roadmap explicitly does not wait for it. This change must add guarded parity across the current registration points and leave a clean migration shape.

Implementation begins only after `support-workflow-command-namespaces`, which supplies command identities such as `/humanspec:propose` without changing existing `opsx` commands.

## Goals / Non-Goals

**Goals:**

- Add a named HumanSpec profile without changing the existing OpenSpec default.
- Persist HumanSpec profile intent in project configuration and use one precedence rule in init, update, drift detection, and summaries.
- Generate exactly seven HumanSpec workflow surfaces with stable skill and command identities.
- Remove user-invocable apply artifacts from HumanSpec projects while preserving the internal apply instructions protocol.
- Reconcile only explicitly registered managed artifacts and preserve user files.
- Establish shared workflow safety contracts without prematurely implementing later learning-loop phases.

**Non-Goals:**

- Implement the full conversational behavior of init, propose, coach, verify, next, or archive.
- Rename the `openspec` binary or the `openspec/` planning directory.
- Remove OpenSpec workflows or prevent advanced users from selecting them through `core` or `custom`.
- Add global skill installation or implement install-scope selection.
- Implement or wait for the unified workflow manifest.

## Decisions

### 1. Add a distinct `humanspec` preset

Extend the profile type to `core | humanspec | custom` and add one explicit constant:

```ts
const HUMANSPEC_WORKFLOWS = [
  'humanspec-init',
  'humanspec-next',
  'humanspec-propose',
  'humanspec-coach',
  'humanspec-verify',
  'humanspec-archive',
  'humanspec-explore',
] as const;
```

`CORE_WORKFLOWS` and the global default remain unchanged. An exact HumanSpec selection derives the named `humanspec` profile; any other user-selected set that is not exactly core remains `custom`.

Alternative considered: redefine `core` as HumanSpec. Rejected because existing projects would unexpectedly lose OpenSpec workflows and update could delete managed artifacts they still rely on.

### 2. Persist project profile intent and centralize precedence

Extend `openspec/config.yaml` and its `.yml` alias with optional `profile` and `workflows` fields. `profile` accepts the same three profile names; `workflows` is consulted for a project-level custom profile. Fields are parsed resiliently like existing project configuration: a bad profile or workflow entry produces a warning without discarding valid schema, context, rules, operations, references, or store settings.

Introduce one effective-profile resolver used by init, update, profile drift, onboarding, detection, and result summaries:

```text
explicit CLI override
    > project config profile/workflows
    > global config profile/workflows
    > core fallback
```

When init creates a new config, it records the resolved named profile. When the user explicitly supplies a profile while extending an existing project, init updates only the profile-related keys and preserves every other YAML field and user comment. Without an explicit override, init preserves an existing config unchanged. Update reads but does not silently add a project override to legacy configs.

Alternative considered: store HumanSpec only in global config. Rejected because one user may maintain HumanSpec and ordinary OpenSpec projects on the same machine, and a later global profile change would silently alter project workflow ownership.

### 3. Keep workflow, skill, and command identity separate

Until the manifest is available, introduce explicit mappings at the existing registration points. Each HumanSpec entry has:

```ts
{
  workflowId: 'humanspec-propose',
  skillDirName: 'humanspec-propose',
  command: { namespace: 'humanspec', id: 'propose' },
}
```

The other six workflows follow the same rule. This produces:

- `humanspec-<action>/SKILL.md` for skill delivery;
- `/humanspec:<action>` for namespaced command adapters;
- `/humanspec-<action>` for flat command adapters;
- `@humanspec-<action>` for Amazon Q;
- each tool's existing skill invocation form for skills-invocable command surfaces.

All generated paths use adapter output and Node.js path helpers. Parity tests ensure template entries, profile IDs, skill directories, command descriptors, detection, onboarding, and cleanup contain the same seven workflows.

### 4. Ship safe surface contracts before full workflow behavior

Each initial HumanSpec template names its responsibility and carries a shared ownership rule: the human learner writes application and test implementation code; the AI may plan, inspect, explain, diagnose, review, and provide progressive hints only within the workflow's declared planning boundary.

The templates establish these initial write boundaries:

- `humanspec-init`: project planning documents only.
- `humanspec-next`: routing and guidance only.
- `humanspec-propose`: change planning artifacts only.
- `humanspec-coach`: read-only investigation and guidance.
- `humanspec-verify`: review output and the reserved AI verification area of `learning.md` only.
- `humanspec-archive`: specs, planning records, and archive paths only.
- `humanspec-explore`: no implementation writes.

Later changes replace or enrich the workflow-specific instructions and tests. This change does not claim that the complete learning state machine, reflection gates, or adaptive roadmap updates already exist.

### 5. Exclude public apply while preserving the protocol

The HumanSpec profile contains neither the existing `apply` workflow nor a `humanspec-apply` workflow. Switching a project from core to HumanSpec removes only the registered managed apply skill and command files for configured tools. It does not delete user-authored similarly named files.

The CLI command `openspec instructions apply` and schema `apply.requires`/`apply.tracks` remain unchanged. HumanSpec coach, next, verify, and archive can therefore reuse structured progress and context internally without exposing an AI implementation workflow.

### 6. Reconcile exact registered artifacts

Init/update build desired and removable paths from the explicit workflow registrations and command descriptors. They do not use filename patterns to infer HumanSpec or OpenSpec ownership. Profile switching computes:

```text
registered managed paths - desired profile paths = removable managed paths
```

This rule applies independently per tool after install scope, delivery mode, and command-surface capability are resolved. It composes with `add-global-install-scope` and `add-tool-command-surface-capabilities` rather than replacing either decision.

### 7. Defer manifest migration without creating a second architecture

The temporary registrations stay in the existing lists and mappings, guarded by parity tests. They use the same `{ workflowId, skillDirName, command }` concepts proposed for the future manifest. When `unify-template-generation-pipeline` lands, migration moves these entries into the manifest and removes duplicate lists without changing file names, profile membership, or workflow content.

## Risks / Trade-offs

- [Project and global profiles can confuse users] → Report the effective profile and its source, and explain when a project override wins over the global preset.
- [Init/update overlap with active changes] → Keep profile, install scope, delivery, and command-surface capability as separate resolver inputs; rebase and test their combined matrix.
- [Initial workflow templates could imply later features are complete] → Limit assertions to surface responsibility and safety boundaries; leave detailed state machines and learning gates to their named follow-up changes.
- [Hardcoded registrations can drift] → Add strict parity tests across every current projection and cleanup list.
- [Profile switching could delete user content] → Derive removal targets from exact registered paths only and add similarly named user-file preservation tests.

## Migration Plan

1. Land `support-workflow-command-namespaces`.
2. Extend profile and project-config types plus the shared effective-profile resolver.
3. Add HumanSpec template modules and all explicit registrations with parity tests.
4. Integrate profile resolution and persistence into init, then reconcile update, detection, drift, cleanup, and onboarding.
5. Rebase active scope/capability changes and verify the combined behavior matrix.
6. Run generated-output parity, cross-tool integration, Windows CI, build, and full tests.

## Stacking Notes (implementation record)

Applied on top of `support-workflow-command-namespaces`, which is fully
implemented (command identities `/humanspec:<id>`, `/humanspec-<id>`, and
`@humanspec-<id>` come from that change). The overlap review for the two
active sibling changes:

- `add-tool-command-surface-capabilities` (not yet implemented): that change
  decides per-tool artifact type/location (adapter-backed, skills-invocable,
  none). This change consumes it through the existing
  `command-surface.ts` helpers and never re-decides the surface itself.
  Overlap is limited to `getTransformerForTool` receiving the template's
  command namespace so reference rewriting stays family-accurate; the
  capability and invocation inputs are unchanged.
- `add-global-install-scope` (not yet implemented): install scope decides
  whether artifacts land in the project or the machine profile. This change
  keeps profile membership (WHICH workflows), install scope (WHERE), delivery
  (HOW), and command-surface capability (WHAT surfaces) as four separate
  resolver inputs — the combined tests keep them separate (see
  `update-humanspec.test.ts` "keeps delivery-only and command-surface
  dimensions independent"). When the scope change lands, reconciliation
  applies scope after resolving workflow membership, per Decision 6.

These two changes were not required to land first: this change's tests keep
the four dimensions independent, and the shared effective-profile resolver is
the single point where the scope change later plugs in. Windows CI
(`.github/workflows/ci.yml`, windows-latest) runs the new path-sensitive
init/update/profile-switch tests (tasks 6.1-6.3).

## Rollback

Selects `core` for affected projects, runs update to restore the OpenSpec managed set, and then removes the HumanSpec registrations and project-profile fields. Project planning documents and user-authored files remain recoverable because cleanup never targets them.

## Open Questions

None for this change. Detailed behavior of each HumanSpec workflow remains assigned to the later roadmap changes.
