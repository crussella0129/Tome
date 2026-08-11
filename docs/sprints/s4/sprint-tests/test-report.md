# Sprint 4 Test Report

## Intent Verification
| Intent | Acceptance criterion | EARS / tests | Result | Intent evidence update |
|--------|----------------------|---------------|--------|------------------------|
| [INT-0004](../../../intents/INT-0004-flexible-book-source-detection.md) | 1 — auto-detect `docs/` source | T-015 `test_source_detect_docs`; T-016 `check_external_build` (docs-book) | pass | Test evidence adds this report |
| [INT-0004](../../../intents/INT-0004-flexible-book-source-detection.md) | 2 — honor `book.toml` src (authoritative) | T-015 `test_source_honor_book_toml_src`, `test_source_declared_missing_errors` | pass | Test evidence adds this report |
| [INT-0004](../../../intents/INT-0004-flexible-book-source-detection.md) | 3 — title from directory name | T-015 `test_title_from_dirname` (+ CubiKan smoke → "CubiKan") | pass | Test evidence adds this report |
| [INT-0004](../../../intents/INT-0004-flexible-book-source-detection.md) | 4 — enumerated error | T-015 `test_source_none_errors` | pass | Test evidence adds this report |
| [INT-0004](../../../intents/INT-0004-flexible-book-source-detection.md) | 5 — no regression | `check_external_build` (handbook) + Vitest 35/35 + Playwright 8/8 (sample) | pass | Test evidence adds this report |

All five INT-0004 criteria are met → eligible for `realized` in Loop. The
motivating case is proven directly: `TOME_BOOK=/c/Users/charl/CubiKan` now loads
with no wrapper (detects `docs/`, 132 chapters, title "CubiKan").

## Summary
- Unit/integration tests: 35 passed / 0 failed / 35 total (Vitest; incl. 5 detection cases)
- Build gate: `check_external_build` — pass for both the standard handbook and the config-less docs-book
- E2E tests: 8 passed / 0 failed / 8 total (default sample — no regression)
- CI status: green expected on the PR (all gates + the two-book external gate)

## CI Confirmation
- **Head SHA:** `1f249f509a68387a35c8327e70214c3433396d93`
- **CI run:** `.github/workflows/ci.yml` on the Sprint 4 checkpoint (commit `9da6314`, [PR #5](https://github.com/crussella0129/Tome/pull/5)) — [run 31528520850](https://github.com/crussella0129/Tome/actions/runs/31528520850).
- **Conclusion:** **success** — the `verify` job is green, including the extended two-book **External book build gate**. **One** annotation remains: `actions/upload-artifact@v5` still targets Node 20 (its current Node-24 major is **v7**; `@v5` was a stale bump in Sprint 3). This **corrects the Sprint 3 report's claim that all warnings were resolved** — `checkout@v5`/`setup-node@v5` are correct (Node 24), but `upload-artifact` needs `@v7`. Non-blocking; queued as backlog **T-207**.
- **Confirmations:** local canonical-runner records:
  - `npx vitest run` → `Test Files 8 passed (8) · Tests 35 passed (35)`
  - `node scripts/check-external-build.mjs` → OK for handbook + docs-book; tree restored clean
  - `npx playwright test` → `8 passed (9.2s)`
  - `npx astro check` → `0 errors` · audit passed
  - real-world: `TOME_BOOK=/c/Users/charl/CubiKan node scripts/load-book.mjs` → detected docs/, 132 chapters, title "CubiKan"

## Failures
None.

## Technical Debt Identified
- External/`docs`-layout browser E2E (critique C-002) — backlog T-205.
- Parent-relative images (backlog T-206), multi-book (T-202), live reload (T-204) — future INT-0003 work.

## Coverage Observations
Every INT-0004 criterion has a named, executed, passing test; detection is proven
by isolated temp-book integration tests, a two-book build gate (regression +
detection), and a direct CubiKan smoke. The sample E2E is unchanged (criterion 5).
