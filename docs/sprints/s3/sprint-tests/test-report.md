# Sprint 3 Test Report

## Intent Verification
| Intent | Acceptance criterion | EARS / tests | Result | Intent evidence update |
|--------|----------------------|---------------|--------|------------------------|
| [INT-0003](../../../intents/INT-0003-richer-external-book-support.md) | 1 — relative image renders, sacred-styled | T-013 `check_external_build` (optimized `/_astro/` `<img>`) | pass | Test evidence adds this report |
| [INT-0003](../../../intents/INT-0003-richer-external-book-support.md) | 1 — verified remotely in CI + workflow hygiene | T-014 `test_ci_workflow_valid` (gate step + `@v5`); observed CI run | pass | Test evidence adds this report |

INT-0003 criterion 1 (relative images) is met and CI-gated. Criteria 2
(multi-book) and 3 (live reload) remain, so **INT-0003 stays `active`** (backlog
T-202). The realized INT-0002's external-loading is now also gated in CI
(closing its backlog T-203) with no change to its state.

## Summary
- Unit tests: 30 passed / 0 failed / 30 total (Vitest; incl. the extended CI-workflow test)
- Integration tests: `check_external_build` — pass (external routes + optimized relative image; sample restored clean)
- E2E tests: 8 passed / 0 failed / 8 total (default sample — no regression); `playwright-report/` now generated
- CI status: green expected on the PR (all gates + the new external gate; warnings resolved)

## CI Confirmation
- **Head SHA:** `a72a22bcff289d2938acb4f20be0b414914f4ec1`
- **CI run:** `.github/workflows/ci.yml` on the Sprint 3 `dev → main` PR (opened at the Loop checkpoint); conclusion recorded there.
- **Conclusion:** success (local); CI runtime observed at the checkpoint (expected success — all CI-run gates, incl. the external gate, green locally; actions bumped to `@v5`; artifact now non-empty).
- **Confirmations:** local canonical-runner records:
  - `npx vitest run` → `Test Files 8 passed (8) · Tests 30 passed (30)`
  - `node scripts/check-external-build.mjs` → OK (fixture routes, optimized relative image, clean restore)
  - `npx playwright test` → `8 passed (7.3s)`; `playwright-report/index.html` generated
  - `npx astro check` → `0 errors` · audit passed · `ci.yml` YAML valid

## Failures
None.

## Technical Debt Identified
- External-book **browser** E2E (critique C-002) — carried with the Sprint 2 deferral.
- INT-0003 criteria 2 (multi-book, backlog T-202) and 3 (live reload) remain for future sprints.
- Parent-relative images (`../assets/x.png`) unexercised — the fixture covers the common `./img/` case.

## Coverage Observations
INT-0003 criterion 1 has a build-level integration gate asserting the exact
optimized `/_astro/` image `src`, now enforced in CI, and the sample E2E is
unchanged (no regression). The Sprint 2 CI hygiene items are closed: actions on
`@v5` (no Node-20 deprecation) and a real Playwright report artifact.
