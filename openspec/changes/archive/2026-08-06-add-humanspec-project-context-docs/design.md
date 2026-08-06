## Context

See proposal.md — Why. Current state: the `human-learning` schema and the 7 HumanSpec workflow templates (all ~90-line skeletons under `src/core/templates/workflows/`) exist, but there is no project-level document layer. The only existing project-context mechanism is `config.yaml`'s `context` field, auto-injected into artifact instructions by `instruction-loader.ts`. Separately, `legacy-cleanup.ts` detects `openspec/project.md` by pure path and prints a migration hint, because upstream OpenSpec migrated project.md's role into `config.yaml context` (see `openspec/specs/legacy-cleanup/spec.md`).

Constraints from config rules: track generated artifacts by name in constants; prefer explicit lookups over regex; Node.js path module everywhere; cross-platform tests.

## Goals / Non-Goals

**Goals:**
- Define the project-level living-document foundation (paths, markers, template structure, and reading convention) as a spec-level contract for later workflow changes.
- Ship the three templates with self-describing frontmatter markers.
- Make the legacy-cleanup detection marker-aware so HumanSpec projects never see the self-contradictory migration hint.
- Give every HumanSpec workflow a single shared reading convention (paths + purposes) to reference.

**Non-Goals:**
- The init conversation flow that collects data and writes the docs (roadmap change `add-humanspec-init-workflow`).
- Enforcing the no-silent-overwrite merge policy in code (diff display + confirmation land with init; this change only declares the policy and ships templates that must not be written by any code path here).
- CLI-level injection of the documents into `openspec instructions` output (reserved; see Decision 2).
- Writing back `learner.md` from a change's `learning.md` at archive time (roadmap change `add-learning-aware-archive-feedback`).
- Updating `roadmap.md`/`learner.md` content generation logic.

## Decisions

### Decision 1: Legacy exemption via content marker, not profile awareness

`legacy-cleanup` detection becomes content-aware: when `openspec/project.md`'s frontmatter declares `type: humanspec-project`, the file is a living HumanSpec document and is neither reported nor hinted. Unmarked files keep today's exact behavior.

Chosen over:
- **Profile-aware detection** (pass the resolved profile into `detectLegacyArtifacts` and suppress the hint under `humanspec`): more precise but threads profile state through a call chain that currently has none, and breaks if a project later switches back to `core` while keeping its HumanSpec docs.
- **Renaming the files** (e.g., `openspec/humanspec/project.md`): dodges the conflict but deviates from the roadmap's documented structure and adds learner-facing ceremony.
- **Message-only softening**: keeps a false-positive detection.

The marker approach matches the codebase's existing pattern (`hasOpenSpecMarkers` identifies AGENTS.md content), keeps files self-describing regardless of profile state, and gives the templates a stable identity hook.

Detection mechanics: inspect only the leading frontmatter block (from the first line through the closing `---`) and compare an unindented, exact `type: humanspec-project` line against the registered marker. This is an explicit lookup against a named constant, not a regex scan of the document body (config rule: prefer explicit lookups; if we generate it, track it by name in a constant).

### Decision 2: Templates as registered files; reading convention as one shared constant

**Templates** live as standalone markdown files under `src/core/templates/project-docs/` (`project.md`, `roadmap.md`, `learner.md`), registered by name in a constant list (e.g. `PROJECT_DOC_TEMPLATES`). The `add-humanspec-init-workflow` change will read them at generation time; this change only ships and registers them.

Chosen over:
- **Inline constants in `humanspec-shared.ts`**: would bloat the shared module and, once init embeds them, produce very large generated skills.
- **`schemas/human-learning/templates/`**: `loadTemplate` resolves schema artifact templates; project documents are not change artifacts and do not belong to the `human-learning` schema's semantics.
- **`config.yaml context` as the carrier**: it is a static snapshot injected into instructions, not a living document; mirroring the docs there would create a double-write hazard.

**Reading convention** is one constant in `humanspec-shared.ts` (e.g. `HUMANSPEC_PROJECT_DOCS`) naming the three paths and their reading purpose, referenced by every `humanspec-*.ts` workflow template. The registry also exports a `path.join()`-based destination-path resolver for cleanup and later workflow consumers. This is the "thin start": zero CLI changes, single point of definition (addresses the drift risk flagged in the roadmap's risk table), and a parity test asserts every generated workflow surface includes it.

Reserved upgrade path (not built now): when `humanspec-next` needs machine-level selection logic, the documents can be surfaced through `instruction-loader` injection so the CLI guarantees freshness. The shared convention is the single source either way, so the upgrade does not change the templates.

### Decision 3: Graded structure — one protocol, three shapes

All three documents share the frontmatter skeleton (a `type` marker plus `version: 1`) from day one. The frontmatter is the stable hook for future structured upgrades (e.g., a `completionPolicy`-style evolution) and is what makes the legacy exemption work.

Content structure is graded by machine-consumption frequency:

| Document | Structure | Consumer |
|---|---|---|
| `project.md` | Fixed section headings, prose | Humans (init writes; propose/verify reference) |
| `roadmap.md` | Fixed sections; candidate slices as parseable list entries (`- [ ] slice: <name> — <learning focus>`) | Router workflows select slices |
| `learner.md` | Fixed sections; gaps/mastered/review items as parseable list entries | verify/archive append entries |

The list-entry convention deliberately mirrors the checkbox pattern already proven in `src/utils/task-progress.ts` (`parseTaskLines`), so roadmap slices and learner records can later reuse the same progress/parsing utilities without a new parser. Prose remains allowed around the lists — only the designated records must be parseable, following the `spec.md` pattern of narrative plus contract.

Relationship to `learning.md`: `learner.md` is project-level enduring state; `learning.md` is per-change record. The write-back from one to the other is the archive change's job, not this one's.

## Risks / Trade-offs

- [Marker parsing adds a file read to every legacy detection] → Detection already reads files (AGENTS.md marker scan); the added read is bounded to the frontmatter block and only for `project.md`.
- [Template files and marker constants drift apart] → Parity test asserts each registered template's frontmatter matches its expected `type:` marker.
- [Roadmap slice format too rigid for humans] → Only the slice list entries are constrained; the rest of roadmap.md stays free-form, and the slice entry format (name + learning focus) is minimal.
- [A workflow template forgets the shared reading convention] → Existing parity test pattern extends to assert the convention string appears in every generated humanspec surface.
- [Unmarked legacy project.md in a HumanSpec project still gets the hint] → Accepted: the hint is informational, the file is never deleted, and the marker ships with the templates, so only pre-existing files are affected.

## Migration Plan

No runtime data migration. Existing `openspec/project.md` files without the marker keep today's hint; nothing deletes them. This change makes marked templates and their resolver available; a later init workflow generates project files. Rollback: reverting this change restores pure-path detection; marked files then simply fall under the old hint path again (informational only).

## Open Questions

- Exact roadmap slice entry syntax beyond the minimal `slice: <name> — <learning focus>` shape; the router change may refine it without touching this protocol.
- Whether init should additionally mirror project goal/constraints into `config.yaml context` (keeping the auto-injection benefit) or rely on the documents alone; decided during `add-humanspec-init-workflow`.
