## Why

The built-in `human-learning` schema can describe a human-owned practice change, but project initialization still installs OpenSpec's `core` workflows, including the AI implementation entry point. HumanSpec needs an explicit, persistent project profile whose generated entry points preserve human implementation ownership without changing the default experience of existing OpenSpec projects.

## What Changes

- Add a named `humanspec` workflow profile containing `humanspec-init`, `humanspec-next`, `humanspec-propose`, `humanspec-coach`, `humanspec-verify`, `humanspec-archive`, and `humanspec-explore`.
- Keep the existing `core` and `custom` profiles and the global `core` default unchanged.
- Allow project configuration to persist the selected workflow profile so init and update resolve the same effective workflow set for that project.
- Resolve profile selection in the order: explicit CLI override, project configuration, global configuration, then `core` fallback.
- Generate HumanSpec skills and commands through the current registration pipeline, using the `humanspec` command namespace supplied by `support-workflow-command-namespaces`.
- Ensure a HumanSpec project does not receive a user-invocable apply workflow, while the internal `openspec instructions apply` protocol remains available.
- Make update remove obsolete OpenSpec-managed workflow artifacts by exact registered path while preserving user-authored files and the compatible OpenSpec profile.
- Add profile, generation, update/cleanup, cross-tool parity, and cross-platform tests.

## Capabilities

### New Capabilities

- `humanspec-workflow-profile`: Defines the HumanSpec workflow set, generated identities, implementation-ownership boundary, and compatibility contract.

### Modified Capabilities

- `config-loading`: Project configuration can persist workflow-profile selection and optional custom workflow selection with resilient field parsing.
- `global-config`: Global profile configuration recognizes the named `humanspec` preset while retaining `core` as the default.
- `cli-config`: Profile configuration displays, selects, and derives the HumanSpec preset consistently.
- `cli-init`: Initialization resolves and persists an effective project workflow profile and generates only that profile's managed artifacts.
- `cli-update`: Update reuses the persisted project profile and safely reconciles managed workflow artifacts to it.

## Impact

- Affects project/global config types and parsing, profile resolution, init/update, workflow templates and registrations, onboarding, drift detection, managed cleanup, and parity tests.
- Depends on `support-workflow-command-namespaces` for `/humanspec:<id>`, `/humanspec-<id>`, and tool-specific equivalent command identities.
- Must be reconciled with active init/update work such as `add-tool-command-surface-capabilities` and `add-global-install-scope`; command-surface capability and install scope remain independent dimensions of the selected profile.
- Does not wait for `unify-template-generation-pipeline`; current explicit lists remain synchronized by parity tests and can later migrate without changing generated HumanSpec artifacts.
- Does not implement the full init, propose, coach, verify, next, or archive learning behavior planned in later HumanSpec changes; it establishes their generated surfaces and shared safety contract.
