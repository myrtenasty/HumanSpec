## Why

OpenSpec command generation assumes every generated workflow belongs to the `opsx` command family. HumanSpec needs first-class commands such as `/humanspec:propose` while existing OpenSpec commands keep their current names, and encoding the family into a command ID would create awkward public names and brittle cleanup logic.

## What Changes

- Add an explicit command namespace to tool-agnostic command descriptors, defaulting to `opsx` for backward compatibility.
- Generate tool-specific paths and invocation spellings from the pair `(namespace, command id)` so namespaced, flat, and non-slash command surfaces remain consistent.
- Rewrite command references using the command's namespace while preserving each tool's separator and invocation prefix.
- Make command discovery, parity checks, and managed-path enumeration namespace-aware through explicit descriptor lookup rather than filename pattern matching.
- Preserve every existing `opsx` path, invocation, and generated body when no namespace is supplied.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `command-generation`: Commands can declare a namespace independently from their workflow identity and command ID, with cross-tool path and invocation parity.

## Impact

- Affects command-generation types, invocation formatting, reference transformation, adapters, generation helpers, managed command discovery, and their parity tests.
- Requires coordinated updates across every registered command adapter because each currently embeds the `opsx` family in its output path.
- Provides the prerequisite command-family contract for `add-humanspec-workflow-profile` without depending on `unify-template-generation-pipeline`.
- Introduces no breaking change for existing OpenSpec workflows; omitted namespaces continue to resolve as `opsx`.
