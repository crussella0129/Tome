# Sprint 10 Test Report

## Intent Verification
| Intent | Acceptance criterion | EARS / tests | Result | Intent evidence update |
|--------|----------------------|---------------|--------|------------------------|
| [INT-0008](../../../intents/INT-0008-in-book-search.md) | 1 — build-time index covers the library, static JSON | T-023 `test_search_index_covers_chapters`, `test_search_index_heading_slugs`; T-025 `check_search` | **pass** | Test evidence adds this report |
| [INT-0008](../../../intents/INT-0008-in-book-search.md) | 2 — open/type/navigate/close | T-024 `test_search_overlay_opens_and_lists`, `test_search_overlay_escape_closes`, `test_search_shortcut_opens_and_navigates` | **pass** | (as above) |
| [INT-0008](../../../intents/INT-0008-in-book-search.md) | 3 — ranking, prefix/multi-term, designed empty/no-result | T-023 `test_search_ranks_title_over_body`, `test_search_prefix_multiterm`, `test_search_empty_and_noresults` | **pass** | (as above) |
| [INT-0008](../../../intents/INT-0008-in-book-search.md) | 4 — adaptive, zero-JS, accessible, end-to-end | T-023 `test_search_index_adaptive_url`; T-024 e2e; T-025 `check_search` | **pass** | (as above) |

All four INT-0008 criteria are met → **INT-0008 is eligible for `realized`** (done
in the Loop Phase).

## Summary
- Unit/component: **72 passed / 0 failed** (Vitest, 13 files)
- E2E: **9 passed / 0 failed** (Playwright, incl. the new search spec)
- Gates: `check_search` (new), `check_external_build`, `check_multibook` — **OK**,
  tree restored clean
- `astro check`: **0 errors / 0 warnings / 0 hints** · neutronium audit: **passed**
- CI status: green **expected** on the PR (unit/integration + external + multi-book +
  the new search gate all run in CI)

## Tested head
- **Head SHA:** `8669b1ab575d4fbbdb5be1c9f0db3a4fb7784dd8` (tip of `dev` at T-025).
- Local canonical-runner records:
  - `npx vitest run` → `Tests 72 passed`
  - `npx playwright test` → `9 passed`
  - `node scripts/check-search.mjs` → OK (single + multi; tree clean)
  - `node scripts/check-external-build.mjs` → OK (both fixtures)
  - `node scripts/check-multibook.mjs` → OK
  - `npx astro check` → `0 errors` · audit passed
  - CI conclusion to be observed on the Sprint 10 PR.

## Failures
- `check_live_reload` (local-only gate) **fails**, and it is **not caused by this
  sprint**. Root cause: a Sprint-9 (T-206/INT-0007) parent-relative image in the
  handbook fixture combined with the live-reload watcher's raw `syncPath` (no
  parent-asset rewriting) → `ImageNotFound` on live edit. The Sprint-10 diff touches
  none of that path; it reproduces on the base commit. Not in CI. Filed as **T-209**.
  See `integration-tests.md` for the full diagnosis. INT-0008 is unaffected.

## Technical Debt Identified
- **T-209** — live-reload × parent-relative assets (above), INT-0007 domain.
- **T-208** — theme-toggle E2E `client:idle` hydration flake.
- Search index scaling for very large corpora (chunking), fuzzy typo tolerance,
  and a search-lib ranking upgrade — all out of INT-0008's first-cut scope.

## Coverage Observations
INT-0008 is proven end to end: the index is emitted as a real `dist/search-index.json`
(`check_search`, in CI) with slug parity against the rendered heading `id`s, the pure
scorer is unit-tested for ranking/prefix/multi-term/empty, the overlay is component-
and Playwright-tested (open, focus, Escape, designed states, adaptive links,
navigation), and adaptive URLs hold in single- and multi-tome builds. Zero-JS-by-
default holds — the index is a separate lazily-fetched artifact and the overlay is
the only new island.
