# Deterministic QA

OpenSpec's release-oriented QA has three portable entrypoints:

- `pnpm qa` runs the default deterministic smoke tier.
- `pnpm qa:smoke` runs the same focused generic and packed HumanSpec smoke tier; use `-- --scenario <id>` or `-- --tier <fast|smoke|capstone>` to narrow it.
- `pnpm qa:manual` locates the versioned [HumanSpec teaching checklist](./humanspec-teaching-checklist.md). It reports manual evidence status and never claims model-dependent behavior was automated.

The runner is an ESM Node.js program, not a Bash script, so the same commands work from native Windows, macOS, and Linux shells. Every automated scenario has a stable ID, an explicit platform/tier registration, a timeout, and an isolated temporary home/config/data/state/cache environment.

## Local selection and reproduction

List the registered scenarios:

```bash
pnpm qa -- --list
```

Run one scenario and retain its sandbox:

```bash
pnpm qa -- --scenario generic-delivery-both-to-skills --keep-artifacts
```

On failure the runner prints the stable scenario ID and retains the sandbox. Pass `-- --artifact-dir .qa-artifacts` to copy command JSON, stdout/stderr, environment manifest, and explicit before/after filesystem snapshots into a reviewable directory:

```bash
pnpm qa:smoke -- --artifact-dir .qa-artifacts
```

The packed HumanSpec scenarios run `npm pack --json` once, record the tarball integrity, install that exact artifact into each isolated fixture, and invoke the resolved installed `bin` mapping. They do not import repository `src` or `dist` files. CI can set `OPENSPEC_QA_TARBALL` to reuse a tarball produced by its package job.

Deterministic smoke coverage is deliberately narrower than unit and focused CLI tests. It covers profile/delivery synchronization, migration, tool detection, invalid configuration, package contents, HumanSpec archive feedback, interruption reconciliation, and rejected-candidate routing. Model interpretation and teaching quality remain in the manual checklist.

## HumanSpec pre-migration completion gate

Before the four upstream HumanSpec correctness changes are treated as complete, verify the packed capstone against the checked-in fixture for: bootstrap and packaged template inspection; a complete `human-learning` artifact set; canonical verify-shaped evidence; archive followed by confirmed feedback and next-context routing; archive-success/write-interruption reconciliation; duplicate-free reruns; confirmed and rejected candidate variants; milestone persistence; intentional empty-roadmap reporting; and no automatic change-directory creation. These are deterministic boundary checks, not evidence that a model taught the material well.
