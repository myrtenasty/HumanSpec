## 1. Verification contract

- [x] 1.1 Update `src/core/templates/workflows/humanspec-verify.ts` to resolve exactly one selected change, structured status/instruction context, and the three registered HumanSpec project documents before reviewing evidence.
- [x] 1.2 Add ordered verification guidance for task checkboxes, `开始前`, `卡住时的记录`, and `完成后`, distinguishing learner-authored evidence from the registered template placeholders.
- [x] 1.3 Add contract-review guidance that maps proposal outcome, delta-spec requirements and scenarios, implementation evidence, and relevant project checks to pass, fail, or inconclusive dispositions.
- [x] 1.4 Add actionable failure and success routing, including blocking findings, suggestions, learner-owned next actions, `/humanspec:coach`, and `/humanspec:archive`, while preserving the explicit non-goals for `next` and archive feedback.

## 2. Verification record and ownership boundary

- [x] 2.1 Define the exact `AI 验证记录` update protocol in the canonical verify content, including the latest-result shape and the blocker behavior for missing or duplicated section headings.
- [x] 2.2 State and test that verification may update only the named AI verification section and must preserve application code, test implementation, learner reflections, and practice-task checkboxes across retries.
- [x] 2.3 Keep the existing HumanSpec workflow identity, namespace, internal apply protocol, and shared implementation boundary unchanged while updating the verify responsibility.

## 3. Generated surfaces and regression tests

- [x] 3.1 Regenerate or update the checked-in `humanspec-verify` skill projection from the canonical template without hand-diverging its content.
- [x] 3.2 Extend focused verify-template tests for context readiness, task/reflection gates, evidence dispositions, reserved-section updates, retry behavior, ownership boundaries, and later-workflow non-goals.
- [x] 3.3 Extend skill/command projection and parity tests to assert both generated surfaces expose equivalent learning-aware verification content and write boundaries.
- [x] 3.4 Add representative learning-artifact fixtures or assertions that prove template-only reflections do not count as evidence and that learner-owned content remains unchanged by the prescribed update boundary.

## 4. Cross-platform validation and completion

- [x] 4.1 Add Windows-style path coverage using `path.join()`/`path.resolve()` and the existing planning-home and project-document helpers; do not use hardcoded slash separators.
- [x] 4.2 Add or update Windows CI verification for the verify workflow and its path assertions.
- [x] 4.3 Run focused HumanSpec tests, the full test suite, lint, build, and `openspec validate 'add-learning-aware-verify-workflow' --type change --strict`; resolve all failures before marking the change ready.
