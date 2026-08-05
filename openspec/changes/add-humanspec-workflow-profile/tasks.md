## 0. Prerequisite and stacking preparation

- [x] 0.1 Implement and verify `support-workflow-command-namespaces` before registering HumanSpec commands
- [x] 0.2 Rebase on current init/update/profile work and document any overlaps with `add-tool-command-surface-capabilities` and `add-global-install-scope`
- [x] 0.3 Keep profile membership, install scope, delivery, and command-surface capability as separate inputs in combined tests

## 1. Profile and project-configuration model

- [x] 1.1 Extend the profile type with `humanspec` and add the ordered `HUMANSPEC_WORKFLOWS` constant without changing `CORE_WORKFLOWS` or the global `core` default
- [x] 1.2 Extend the registered workflow ID type so core, HumanSpec, and custom selections can use the same explicit validation list
- [x] 1.3 Implement one effective-profile resolver with CLI override → project config → global config → core precedence and a reported source
- [x] 1.4 Extend project config parsing with resilient `profile` and `workflows` fields, preserving valid sibling fields when either value is invalid
- [x] 1.5 Validate custom workflow entries by explicit registered ID lookup, preserving first-declared order while warning about invalid, duplicate, empty, or unknown values
- [x] 1.6 Add project-config tests for `config.yaml`, `config.yml`, mixed valid/invalid fields, custom workflows, and Windows path resolution
- [x] 1.7 Extend global config validation with the HumanSpec preset and verify old/missing/invalid profile values retain the core fallback and unrelated fields

## 2. Profile configuration UX

- [x] 2.1 Add `openspec config profile humanspec` while preserving the existing core shortcut and delivery setting
- [x] 2.2 Derive `humanspec` only from the exact ordered HumanSpec workflow set and derive other non-core selections as custom
- [x] 2.3 Update interactive profile summaries and choices to display core, HumanSpec, custom, and any effective project override source
- [x] 2.4 Make no-op drift warnings and apply prompts compare the current project's effective profile/delivery result rather than global values alone
- [x] 2.5 Add CLI config tests for the HumanSpec shortcut, exact-set derivation, project-override messaging, delivery-only changes, and no-op behavior

## 3. HumanSpec workflow templates and registration

- [x] 3.1 Add template modules for `humanspec-init`, `humanspec-next`, `humanspec-propose`, and `humanspec-coach` with their declared responsibility and human-implementation boundary
- [x] 3.2 Add template modules for `humanspec-verify`, `humanspec-archive`, and `humanspec-explore` with their declared write boundaries
- [x] 3.3 Factor or consistently embed the shared rule that the learner writes application and test implementation code
- [x] 3.4 Register all seven skill entries with `humanspec-<action>` workflow IDs and skill directory names
- [x] 3.5 Register all seven command entries with namespace `humanspec` and action IDs `init`, `next`, `propose`, `coach`, `verify`, `archive`, and `explore`
- [x] 3.6 Update workflow, skill-name, command-descriptor, detection, onboarding, drift, migration, and cleanup lists through explicit registration entries
- [x] 3.7 Add strict parity tests proving every projection contains exactly the same HumanSpec workflow identities and that the profile contains no apply workflow
- [x] 3.8 Add template tests proving current responsibilities are honest and later reflection/state-machine/archive behaviors are not claimed as already implemented

## 4. Init resolution and project persistence

- [x] 4.1 Accept the HumanSpec profile in init's explicit profile option and resolve the effective profile before any artifact write or deletion
- [x] 4.2 When creating a project config, persist the resolved named profile alongside the schema setting
- [x] 4.3 When extending with an explicit profile, update only profile-related keys in the existing `.yaml` or `.yml` document while preserving other fields, comments, and extension
- [x] 4.4 Preserve existing project config byte-for-byte when extend mode has no explicit profile override
- [x] 4.5 Generate exactly the selected HumanSpec skills and command descriptors for each tool's effective delivery/command surface and omit managed apply artifacts
- [x] 4.6 Report the effective profile, source, generated counts, and tool-specific HumanSpec invocation forms in init output
- [x] 4.7 Add init integration tests for new and existing projects, CLI/project/global precedence, config comment preservation, core compatibility, and failure-before-write behavior

## 5. Update, drift, and safe profile switching

- [x] 5.1 Make update, configured-tool detection, profile drift, and onboarding use the shared effective-profile resolver
- [x] 5.2 Reconcile desired HumanSpec artifacts per configured tool after applying install scope, delivery, and command-surface capability
- [x] 5.3 Switch core → HumanSpec by creating desired HumanSpec artifacts and removing only explicitly registered unselected OpenSpec artifacts, including managed apply files
- [x] 5.4 Switch HumanSpec → core by restoring registered core artifacts and removing only explicitly registered HumanSpec paths
- [x] 5.5 Add preservation tests for similarly named user files, unmanaged content, unregistered namespaces, and files outside the selected tool roots
- [x] 5.6 Add update tests for project-over-global precedence, legacy global fallback without config mutation, mixed tools, and an idempotent second update
- [x] 5.7 Verify `openspec instructions apply --change <name> --json` and `human-learning` task progress remain available after public apply artifacts are removed

## 6. Cross-tool, cross-platform, and release verification

- [x] 6.1 Add generated-output tests for `/humanspec:<action>`, `/humanspec-<action>`, `@humanspec-<action>`, and skills-invocable HumanSpec names
- [x] 6.2 Use `path.join()` or `path.resolve()` for every new production and expected path and test Windows `.yaml`/`.yml`, skill, command, and cleanup paths
- [x] 6.3 Verify path-sensitive init/update/profile-switch tests in Windows CI and retain macOS/Linux coverage
- [x] 6.4 Run focused profile, project-config, global-config, template parity, init, update, tool-detection, and command-generation suites
- [x] 6.5 Run `pnpm build` and the full `pnpm test` suite
- [x] 6.6 Update CLI/profile documentation to explain project profile precedence, the seven HumanSpec entries, the absence of public apply, and the retained internal apply protocol
- [x] 6.7 Record the future manifest migration point without changing generated HumanSpec paths or waiting for `unify-template-generation-pipeline`
