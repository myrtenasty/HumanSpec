## MODIFIED Requirements

### Requirement: project.md migration hint

The system SHALL preserve project.md and display a migration hint instead of deleting it, unless the file carries a HumanSpec project-document frontmatter marker (`type: humanspec-project`), in which case the system SHALL treat it as a living HumanSpec document and SHALL NOT report it as a legacy artifact.

#### Scenario: Unmarked project.md exists during upgrade

- **WHEN** `openspec/project.md` exists during legacy cleanup
- **AND** the file does not carry a HumanSpec frontmatter marker
- **THEN** the system SHALL NOT delete the file
- **AND** the system SHALL display a migration hint in the output:
  ```
  Manual migration needed:
    → openspec/project.md still exists
      Move useful content to config.yaml's "context:" field, then delete
  ```

#### Scenario: Marked project.md is a living document

- **WHEN** `openspec/project.md` exists during legacy cleanup
- **AND** the file's frontmatter declares `type: humanspec-project`
- **THEN** the system SHALL NOT delete the file
- **AND** the system SHALL NOT display the project.md migration hint
- **AND** the file SHALL NOT be reported among the detected legacy artifacts

#### Scenario: project.md migration rationale

- **GIVEN** project.md may contain user-written project documentation
- **AND** config.yaml's context field serves the same purpose (auto-injected into artifacts)
- **WHEN** displaying the migration hint
- **THEN** users can migrate manually or use `/opsx:explore` to get AI assistance

### Requirement: Cleanup reporting

The system SHALL report what was cleaned up.

#### Scenario: Displaying cleanup summary

- **WHEN** legacy cleanup completes
- **THEN** the system SHALL display a summary section:
  ```
  Cleaned up legacy files:
    → Removed OpenSpec markers from CLAUDE.md
    → Removed .claude/commands/openspec/ (replaced by OpenSpec skills and commands)
    → Removed openspec/AGENTS.md (no longer needed)
  ```
- **AND IF** `openspec/project.md` exists without a HumanSpec frontmatter marker
- **THEN** the system SHALL display a separate migration section:
  ```
  Manual migration needed:
    → openspec/project.md still exists
      Move useful content to config.yaml's "context:" field, then delete
  ```

#### Scenario: Marked project.md omitted from reporting

- **WHEN** legacy cleanup completes
- **AND** `openspec/project.md` exists with a HumanSpec frontmatter marker
- **THEN** the system SHALL NOT display a project.md migration section
- **AND** the summary SHALL NOT list the file as a legacy artifact

#### Scenario: No legacy detected

- **WHEN** no legacy artifacts are found
- **THEN** the system SHALL NOT display the cleanup section
- **AND** proceed directly with skill setup
