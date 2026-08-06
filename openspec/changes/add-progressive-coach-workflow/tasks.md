## 1. Coach workflow contract

- [ ] 1.1 Update `src/core/templates/workflows/humanspec-coach.ts` to resolve one selected change and current practice task from the existing structured planning/status instructions, and to handle missing or ambiguous context explicitly.
- [ ] 1.2 Encode the three progressive hint levels, learner-controlled escalation, evidence-first diagnosis, and the bounded level-three guidance in the canonical coach content.
- [ ] 1.3 Encode learner ownership, read-only boundaries, task/reflection preservation, and artifact-based interruption/resume behavior in the coach workflow output and next-action guidance.
- [ ] 1.4 Verify the coach skill and HumanSpec command factories continue to consume the same canonical content without changing workflow IDs, profile membership, or generated command identities.

## 2. Template and projection verification

- [ ] 2.1 Add focused coach-template tests covering context readiness, hint-level ordering and escalation, evidence-based diagnosis, ownership boundaries, resume behavior, and the explicit non-goals.
- [ ] 2.2 Add assertions that the generated `humanspec-coach` skill and namespaced command expose equivalent coaching content and preserve the existing HumanSpec implementation boundary.
- [ ] 2.3 Run the existing HumanSpec registration, managed-artifact, command-generation, and template parity tests to verify no other workflow projection drifts.

## 3. Cross-platform validation and completion

- [ ] 3.1 Add Windows-path coverage using `path.join()`/`path.resolve()` and the existing project-document/planning-home helpers to confirm the coach identifies the same logical change and context files on Windows, macOS, and Linux.
- [ ] 3.2 Add or update Windows CI verification for the coach template and path assertions, including a Windows test run that does not rely on forward-slash literals.
- [ ] 3.3 Run the focused tests, type checks, lint checks, and `openspec validate --change add-progressive-coach-workflow --strict`; resolve any specification or projection failures before marking the change ready.
