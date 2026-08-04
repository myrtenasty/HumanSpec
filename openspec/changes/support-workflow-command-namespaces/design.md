## Context

Command generation currently treats a command as an `id` plus presentation fields. Every adapter embeds `opsx` in its output path, invocation formatting always emits `opsx`, and reference rewriting recognizes only `/opsx:<id>`. That works while OpenSpec is the only command family, but it cannot represent a HumanSpec command whose stable public identity is `/humanspec:propose` without folding `humanspec` into the command ID.

The change crosses command types, every adapter, generation, invocation/reference transformation, discovery, and managed cleanup. It must preserve byte-for-byte path and invocation behavior for existing OpenSpec commands and remain compatible with the planned `WorkflowManifest` without waiting for that change.

`add-tool-command-surface-capabilities` remains orthogonal: command-surface capability decides whether a tool receives command files; command namespace decides how those files and invocations are named.

## Goals / Non-Goals

**Goals:**

- Represent command family and command action as separate, validated identity fields.
- Project the same identity consistently to namespaced, flat, and non-slash tool surfaces.
- Keep all existing OpenSpec outputs unchanged through an `opsx` default.
- Make discovery and managed cleanup enumerate exact generated paths from registered descriptors.
- Provide a forward-compatible descriptor that a future workflow manifest can own.

**Non-Goals:**

- Add HumanSpec workflows or select a HumanSpec profile.
- Rename the `openspec` binary, planning directory, environment variables, or existing `opsx` commands.
- Implement the canonical workflow manifest or tool-profile registry.
- Change which tools receive commands versus skills.

## Decisions

### 1. Model command identity as namespace plus action ID

Add a small command identity shape:

```ts
interface CommandIdentity {
  namespace: string;
  id: string;
}
```

`CommandContent` carries an optional `namespace`; the generator resolves an omitted value through an exported `DEFAULT_COMMAND_NAMESPACE = 'opsx'` before invoking adapters. Workflow IDs and skill directory names remain separate from command identity, allowing a future entry to map `humanspec-propose` to `{ namespace: 'humanspec', id: 'propose' }`.

Namespaces must be non-empty kebab-case path segments. Validation happens before an adapter constructs a path so separators, `.` segments, and traversal tokens never become filesystem input.

Alternative considered: encode `humanspec-propose` in `id`. Rejected because namespaced tools would expose `/opsx:humanspec-propose`, and cleanup could not distinguish family from action without parsing strings.

### 2. Pass resolved identity to every adapter

Change `ToolCommandAdapter.getFilePath` to receive the resolved `CommandIdentity`. Each adapter replaces its literal `opsx` segment with `identity.namespace` and its existing ID interpolation with `identity.id`.

- Directory-namespaced adapters produce paths such as `.claude/commands/<namespace>/<id>.md`.
- Flat adapters produce names such as `<namespace>-<id>.md` in their existing directory.
- Adapter-specific extensions and frontmatter remain unchanged.

All filesystem construction continues through `path.join()` or `path.resolve()`. Tests compare paths through platform-aware helpers, including an explicit Windows case.

Alternative considered: add an optional namespace positional argument to `getFilePath`. Rejected because two independent strings are easy to swap or partially default; one identity object makes the contract explicit and fits a future manifest entry.

### 3. Derive invocation spelling from the generated path and identity

Invocation style remains an adapter/path property: directory-namespaced paths use `:`, flat filename paths use `-`, and `invocationPrefix` supplies `/` or `@`. Formatting becomes:

```text
<prefix><namespace><separator><id>
```

The style classifier examines the actual path returned for the resolved identity rather than testing specifically for an `opsx-` filename. This preserves `/opsx:apply`, `/opsx-apply`, and `@opsx-apply` while enabling `/humanspec:propose`, `/humanspec-propose`, and `@humanspec-propose`.

### 4. Rewrite only references belonging to the command's declared family

Reference transformation receives the resolved namespace and rewrites canonical `/<namespace>:<id>` references to the tool's invocation form. References to other namespaces remain unchanged unless a caller explicitly supplies their descriptor. The same identity-aware formatter is used for generated commands, generated skills, and onboarding hints so a tool never advertises a spelling different from the file it registers.

### 5. Enumerate managed commands from descriptors

Detection, drift checks, init/update cleanup, and migration code obtain exact paths by iterating registered command descriptors and calling the adapter. They do not discover namespaces through filename globs or regular expressions. Generated command families are therefore deleted or refreshed only when their namespace and ID appear in the managed descriptor list; unrelated user files remain untouched.

Until `WorkflowManifest` lands, existing arrays and mappings remain the registration source and gain the namespace field where needed. Parity tests assert that the command descriptor list, projections, detection, and cleanup enumerate the same identities. A later migration can move the descriptors into the manifest without changing their shape or generated paths.

## Risks / Trade-offs

- [Every adapter changes even though existing output must not] → Add registry-wide parity tests proving omitted namespaces generate the current `opsx` paths and invocations for every adapter.
- [Path-style detection could misclassify a new adapter] → Test every registered adapter with both `opsx` and a non-default namespace, and require the adapter registry test to classify each path explicitly.
- [Parallel init/update refactors may reintroduce string-based cleanup] → Keep exact descriptor enumeration as the contract and rebase whichever change lands second, especially `add-tool-command-surface-capabilities` and `unify-template-generation-pipeline`.
- [Adding namespace validation rejects a future unusual family name] → Keep the rule deliberately small and documented: lowercase kebab-case, one path segment.

## Migration Plan

1. Add identity/default/validation helpers and update invocation/reference unit tests.
2. Migrate every adapter to accept `CommandIdentity`, retaining approved `opsx` parity fixtures.
3. Update generators, skill reference transforms, onboarding, detection, and cleanup to use descriptors.
4. Add non-default namespace tests across the adapter registry and Windows path behavior.
5. Rebase overlapping command-surface or template-pipeline work and run the full suite.

Rollback is code-only: remove the namespace field and identity projection before any non-`opsx` workflow ships. Existing files require no migration because their paths do not change.

## Open Questions

None. HumanSpec profile composition and project-level selection are deliberately owned by `add-humanspec-workflow-profile`.
