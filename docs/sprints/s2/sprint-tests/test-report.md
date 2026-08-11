# Sprint 2 Test Report

## Intent Verification
| Intent | Acceptance criterion | EARS / tests | Result | Intent evidence update |
|--------|----------------------|---------------|--------|------------------------|
| [INT-0002](../../../intents/INT-0002-load-external-mdbooks.md) | 1 — resolve external SUMMARY, render chapters, real title | T-010 `test_load_book_external`; T-011 `test_book_title_from_meta`; `gate_external_build` | pass | Test evidence adds this report |
| [INT-0002](../../../intents/INT-0002-load-external-mdbooks.md) | 2 — chapter links (incl. nested / folder README) resolve | T-011 `test_paths_nested_and_readme`; `gate_external_build` (`/section/nested`) | pass | Test evidence adds this report |
| [INT-0002](../../../intents/INT-0002-load-external-mdbooks.md) | 3 — clear error on invalid book | T-010 `test_load_book_errors_on_invalid` | pass | Test evidence adds this report |
| [INT-0002](../../../intents/INT-0002-load-external-mdbooks.md) | 4 — bundled sample fallback, no regression | T-010 `test_load_book_noop_when_unset`; E2E 8/8 on the sample | pass | Test evidence adds this report |

All four INT-0002 acceptance criteria are met → eligible for `realized` in Loop.
The traversal guard (`test_paths_reject_traversal`) hardens criterion 2 against
hostile external links. Deferred within INT-0002's own scope: relative-image
fidelity and multi-book (see critique C-002 / the intent's non-goals).

## Summary
- Unit tests: 27 passed / 0 failed / 27 total (of 30 Vitest; 3 are loader integration)
- Integration tests: 3 loader (Vitest, in CI) + `gate_external_build` (local) — all pass
- E2E tests: 8 passed / 0 failed / 8 total (default sample — no regression)
- CI status: green expected on the PR (sample build + all Vitest incl. loader tests + Playwright)

## CI Confirmation
- **Head SHA:** `206333c48e40c4db311130515b8a86ad15445864`
- **CI run:** `.github/workflows/ci.yml` on the Sprint 2 `dev → main` PR (opened at the Loop checkpoint); conclusion recorded there.
- **Conclusion:** success (local); CI observed at the checkpoint (expected success — all CI-run gates green locally).
- **Confirmations:** local canonical-runner records:
  - `npx vitest run` → `Test Files 8 passed (8) · Tests 30 passed (30)`
  - `npx playwright test` → `8 passed (8.6s)`
  - `TOME_BOOK=fixtures/handbook npm run build` → fixture routes present, sample route absent, book.toml title in output
  - `npx astro check` → `0 errors` · audit passed

## Failures
None.

## Technical Debt Identified
- Add `gate_external_build` to CI (built to a separate dir so it doesn't disturb the sample E2E) — critique C-001.
- Relative-image fidelity for external chapters — critique C-002 / next external-book sprint.
- CI hygiene from Sprint 1 (Node-20 actions, empty playwright-report artifact) still open.

## Coverage Observations
Every locked EARS clause has a named, executed, passing test; the loader
integration tests run headless via subprocess against isolated temp dirs (no
sample mutation, per plan-critique C-001), and the external render is proven by
a real build gate. The sample E2E is unchanged, proving criterion 4.
