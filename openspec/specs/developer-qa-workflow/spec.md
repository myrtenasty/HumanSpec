# developer-qa-workflow Specification

## Purpose

Provide repeatable local and CI quality gates for generic OpenSpec CLI behavior, packed HumanSpec deterministic flows, and explicitly separate manual or model-dependent teaching checks.

## Requirements

### Requirement: Cross-platform QA entrypoints

The repository SHALL provide documented package-script entrypoints for the default deterministic QA suite, the focused smoke suite, and the manual/model checklist. The primary entrypoints SHALL run on supported Windows, macOS, and Linux development environments without requiring a platform-specific shell.

#### Scenario: Developer runs the default QA entrypoint
- **WHEN** a developer runs the documented default QA command
- **THEN** it SHALL execute the deterministic smoke tier
- **AND** SHALL exit non-zero when any required scenario or assertion fails

#### Scenario: Developer opens the manual checklist
- **WHEN** a developer runs the documented manual QA command
- **THEN** it SHALL display or identify the version-controlled checklist
- **AND** SHALL NOT claim that model-dependent scenarios were automatically executed

#### Scenario: Entry point runs on Windows
- **WHEN** the smoke entrypoint is invoked from Windows with platform-native paths
- **THEN** sandbox creation, command execution, assertions, and cleanup SHALL work without Bash-only path assumptions

### Requirement: Sandboxed scenario runner

Each automated QA scenario SHALL execute in an isolated temporary workspace and user environment. Host global configuration and previously installed tool artifacts SHALL not affect scenario outcomes. The runner SHALL handle workspace and environment paths using the conventions of the current operating system.

#### Scenario: Scenario environment is created
- **WHEN** a smoke scenario starts
- **THEN** the runner SHALL isolate home, config, data, state, cache, and relevant AI-tool directories
- **AND** SHALL record the exact package/CLI under test

#### Scenario: Scenario fails
- **WHEN** a command or assertion fails
- **THEN** the runner SHALL retain or publish command output, exit status, and enough explicit before/after filesystem state to diagnose the failure
- **AND** SHALL identify the failing scenario by stable name

#### Scenario: Scenario succeeds
- **WHEN** all assertions pass
- **THEN** temporary state SHALL be cleaned up by default
- **AND** a diagnostic keep-artifacts option SHALL be available

### Requirement: Generic high-risk CLI smoke coverage

The deterministic smoke tier SHALL cover explicitly registered high-risk profile, delivery, detection, update, and migration-sensitive CLI behaviors without replacing focused unit or E2E tests.

#### Scenario: Generic smoke suite runs
- **WHEN** the focused generic suite executes
- **THEN** it SHALL cover project initialization output, non-interactive tool selection, unset-profile migration, delivery cleanup, commands-only update detection, new tool-directory messaging, and invalid profile override handling
- **AND** each scenario SHALL assert exit status and selected filesystem/config outcomes

### Requirement: Packed HumanSpec deterministic capstone

The QA workflow SHALL include a minimal replayable HumanSpec fixture that installs the npm tarball rather than importing repository source and exercises only deterministic product boundaries.

#### Scenario: Packed HumanSpec capstone runs successfully
- **WHEN** the capstone executes against a newly packed artifact
- **THEN** it SHALL bootstrap a HumanSpec project, resolve packaged project-document templates, create or load a complete `human-learning` artifact set, process a canonical verify-shaped learning record, archive and apply or reconcile feedback, and resolve the resulting next context
- **AND** every CLI assertion SHALL use the installed package binary

#### Scenario: Feedback write is interrupted
- **WHEN** the capstone simulates canonical archive success followed by an interrupted project-document feedback write
- **THEN** reconciliation SHALL recover from the archived `learning.md`
- **AND** a repeated run SHALL produce no duplicate learner, archive, milestone, or candidate record

#### Scenario: Candidate is rejected
- **WHEN** the fixture represents learner rejection of the only proposed next candidate
- **THEN** the deterministic next context SHALL report an intentionally empty roadmap
- **AND** the harness SHALL assert that no new change directory was created

### Requirement: Model-dependent behavior remains an explicit checklist

Behaviors that require interpreting model responses or learner quality SHALL be documented and recorded separately from deterministic smoke results.

#### Scenario: Reviewer executes the HumanSpec teaching checklist
- **WHEN** a human or approved model-driven review is performed
- **THEN** the checklist SHALL cover oversized-request splitting, beginner-versus-experienced sizing, progressive Level 1/2/3 hints, refusal to emit a complete patch, software-pass/learning-incomplete verification, first-fail/then-pass flow, and interrupted-session recovery
- **AND** SHALL capture tool/model identity, version, platform, fixture revision, disposition, and evidence notes

#### Scenario: Manual checklist has not been run
- **WHEN** deterministic CI passes but no current checklist result exists
- **THEN** release reporting SHALL distinguish deterministic success from unverified teaching behavior

### Requirement: Package integrity and version guard are portable

The package-version/install guard SHALL invoke the active npm toolchain portably, derive package identity and installed paths from package metadata, and verify explicitly registered release assets.

#### Scenario: Package name changes
- **WHEN** the package metadata uses a different scoped or unscoped package name
- **THEN** the guard SHALL locate the installed binary/package using that metadata
- **AND** SHALL not depend on a hardcoded package name or `node_modules` path

#### Scenario: Guard runs on Windows
- **WHEN** the guard executes on Windows
- **THEN** npm invocation SHALL succeed using the active Node/npm environment
- **AND** SHALL not fail because only a POSIX executable name was attempted

#### Scenario: Required HumanSpec asset is missing
- **WHEN** the tarball omits any explicitly registered HumanSpec schema, workflow surface, or project-document template
- **THEN** package validation SHALL fail and identify the missing registered asset

### Requirement: CI exercises supported package-install platforms

CI SHALL run the packed-install guard and an appropriate deterministic smoke tier on Windows, macOS, and Linux. Platform failures SHALL be attributable to named scenarios and retain diagnostic artifacts.

#### Scenario: Cross-platform package smoke passes
- **WHEN** the supported CI matrix completes
- **THEN** each platform SHALL have installed the same packed artifact and passed package integrity plus the required deterministic HumanSpec scenario subset

#### Scenario: A platform-only failure occurs
- **WHEN** one platform fails path, process-launch, newline, or package-install behavior
- **THEN** that job SHALL fail independently
- **AND** SHALL publish the named scenario diagnostics needed to reproduce it
