Finalized - DO NOT EDIT

# Sprint 5 Test Plan

## Intent Traceability
| Intent | Acceptance criterion | Build task / EARS clause | Verification |
|--------|----------------------|--------------------------|--------------|
| [INT-0003](../../../intents/INT-0003-richer-external-book-support.md) | 3 — shared source detection (parity) | T-017 / WHEN resolveBookSource runs THEN same sourceDir+title as the loader | `test_resolve_book_source` |
| [INT-0003](../../../intents/INT-0003-richer-external-book-support.md) | 3 — per-file sync | T-017 / WHEN syncPath runs for a changed/deleted file THEN copy/remove at dest | `test_sync_path_copy_and_delete` |
| [INT-0003](../../../intents/INT-0003-richer-external-book-support.md) | 3 — end-to-end live reload | T-018 / WHEN a chapter is edited during dev THEN the reader reflects it, no restart | `check_live_reload` |

## Unit Tests (`src/lib/__tests__/book-source.test.ts`, runs in CI via Vitest)
- **Intent:** [INT-0003](../../../intents/INT-0003-richer-external-book-support.md)
- `test_resolve_book_source`: `resolveBookSource(root)` on temp books returns `{ sourceDir, title }` matching the loader's rules — declared `book.toml` src (authoritative), else `src/` → `docs/` → root; title = book.toml title → directory basename. (T-017 clause 1)
- `test_sync_path_copy_and_delete`: `syncPath(<sourceDir>/a/b.md, sourceDir, dest)` writes `dest/a/b.md` with the file's content; a subsequent delete removes `dest/a/b.md`. (T-017 clause 2)
- (Retained) the `load-book.mjs` detection tests still pass unchanged after the refactor to the shared module (parity / no regression).

## Gates / End-to-End
- `check_live_reload` (local): copies `fixtures/handbook` to a temp mutable book, runs `TOME_BOOK=<temp> astro dev`, asserts the served `/first` shows the original heading, edits the temp source, polls until `/first` shows the edited heading (bounded timeout → non-zero exit), then stops dev and cleans up. Covers T-018 EARS (criterion 3, end to end). **Not** in CI (dev-server + timing); the unit-level pieces run in CI.
- `gate_astro_check`: `npx astro check` → 0 errors (the integration type-checks).
- `gate_neutronium_audit`: `bash <neutronium>/scripts/audit.sh src/` → no violations.
- Regression (all still green, and CI unaffected since the integration is dev-only): full `npx vitest run`, `node scripts/check-external-build.mjs` (both books), `npx playwright test` (sample), observed CI on the PR.
