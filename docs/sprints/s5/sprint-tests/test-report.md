# Sprint 5 Test Report

## Intent Verification
| Intent | Acceptance criterion | EARS / tests | Result | Intent evidence update |
|--------|----------------------|---------------|--------|------------------------|
| [INT-0003](../../../intents/INT-0003-richer-external-book-support.md) | 3 — live reload of the active external book during `dev` | T-017 `test_resolve_book_source`, `test_sync_path_copy_and_delete`; T-018 `check_live_reload` (end to end) | pass | Test evidence adds this report |

INT-0003 criterion 3 (live reload) is met. Criterion 2 (multi-book, backlog
T-202) remains, so **INT-0003 stays `active`**.

## Summary
- Unit tests: 37 passed / 0 failed / 37 total (Vitest; incl. 2 `book-source` cases; loader parity preserved)
- Integration gates: `check_live_reload` (live edit reflected, no restart) + `check_external_build` (both books, regression) — pass
- E2E tests: 8 passed / 0 failed / 8 total (default sample — no regression)
- CI status: green expected on the PR (unit/integration + external gate; live-reload gate is local by design)

## CI Confirmation
- **Head SHA:** `2232715f0f768477920356e7be746b58253e83cb`
- **CI run:** `.github/workflows/ci.yml` on the Sprint 5 `dev → main` PR (opened at the Loop checkpoint); conclusion recorded there.
- **Conclusion:** success (local); CI observed at the checkpoint (expected success — the integration is dev-only, so `build`/CI are unaffected, and all CI-run gates are green locally).
- **Confirmations:** local canonical-runner records:
  - `npx vitest run` → `Tests 37 passed`
  - `node scripts/check-live-reload.mjs` → OK (live edit appeared, no restart; tree restored clean)
  - `node scripts/check-external-build.mjs` → OK for handbook + docs-book
  - `npx playwright test` → `8 passed (28.7s)`
  - `npx astro check` → `0 errors` · audit passed
  - dev smoke: `astro dev logs` → "live reload watching …/fixtures/handbook/src"

## Failures
None.

## Technical Debt Identified
- Live-reload end-to-end runs locally, not CI (critique C-001).
- `upload-artifact@v7` (backlog T-207), multi-book (T-202), external browser E2E (T-205), parent-relative images (T-206) — remaining backlog.

## Coverage Observations
Criterion 3 is proven end to end by a dev-server gate (edit → reader updates with
no restart), with the shared detection + per-file sync unit-tested in CI, and the
loader refactor verified regression-free (its 8 detection tests + the two-book
external gate unchanged). The dev-only integration leaves `build`/prod untouched.
