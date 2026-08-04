## 1. Command identity foundation

- [ ] 1.1 Add `CommandIdentity`, `DEFAULT_COMMAND_NAMESPACE`, and a validator for non-empty lowercase kebab-case namespace segments
- [ ] 1.2 Extend `CommandContent` with an optional namespace and resolve omitted values to `opsx` before path or invocation generation
- [ ] 1.3 Change `ToolCommandAdapter.getFilePath` to accept a resolved command identity and update shared command-generation types and exports
- [ ] 1.4 Add unit tests for defaulting, explicit namespaces, invalid separators, traversal segments, empty values, and non-kebab-case values

## 2. Adapter path and invocation projection

- [ ] 2.1 Migrate every directory-namespaced adapter to build `<namespace>/<id>` paths with `path.join()` while preserving its extension and frontmatter
- [ ] 2.2 Migrate every flat adapter to build `<namespace>-<id>` filenames with `path.join()` while preserving its extension and frontmatter
- [ ] 2.3 Update invocation-style detection and formatting to derive `<prefix><namespace><separator><id>` from the resolved identity and actual adapter path
- [ ] 2.4 Add registry-wide assertions that every adapter preserves its existing `opsx` path/invocation and produces the expected `humanspec` path/invocation
- [ ] 2.5 Cover `/humanspec:propose`, `/humanspec-propose`, and `@humanspec-propose` projections for representative namespaced, flat, and Amazon Q adapters

## 3. Reference transformation and managed enumeration

- [ ] 3.1 Make command-body reference transformation accept an explicit namespace and rewrite only references belonging to that family
- [ ] 3.2 Reuse the namespace-aware invocation formatter for generated skill references and init/update onboarding hints
- [ ] 3.3 Replace command-ID-only discovery inputs with explicit managed command descriptors containing namespace and ID
- [ ] 3.4 Update configured-command detection, drift checks, init/update cleanup, and migration helpers to enumerate adapter paths from the explicit descriptor list
- [ ] 3.5 Add safety tests proving cleanup removes only explicitly registered namespace/ID paths and preserves similarly named user files and unregistered namespaces

## 4. Cross-platform and parity verification

- [ ] 4.1 Use `path.join()` or `path.resolve()` for all new production paths and expected test paths
- [ ] 4.2 Add Windows path tests for both directory-namespaced and flat adapters, and retain equivalent macOS/Linux assertions
- [ ] 4.3 Extend command-generation, adapter, invocation, command-reference, tool-detection, init, and update focused test suites for non-default namespaces
- [ ] 4.4 Add parity coverage proving all existing OpenSpec generated command files and invocation text remain unchanged when namespace is omitted
- [ ] 4.5 Verify the path-sensitive suite in Windows CI

## 5. Stacking and release verification

- [ ] 5.1 Rebase or reconcile with `add-tool-command-surface-capabilities` so surface selection remains independent from namespace projection
- [ ] 5.2 Preserve a migration path into `unify-template-generation-pipeline` by keeping namespace and ID in the command descriptor rather than adding a second registry
- [ ] 5.3 Run `pnpm build` and the full `pnpm test` suite
