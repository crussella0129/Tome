# Sprint 6 Test Report

## Intent Verification
| Intent | Acceptance criterion | EARS / tests | Result | Intent evidence update |
|--------|----------------------|---------------|--------|------------------------|
| [INT-0003](../../../intents/INT-0003-richer-external-book-support.md) | 2 — present multiple books & switch between them (the Bibliotheca) | T-019 `test_books_library`, `test_routes_adaptive_single_and_multi`, `pageSlug`; T-020 `test_load_books_precedence`, `test_load_books_multi_copy`; T-021 `test_bibliotheca_lists_tomes`, `test_sidebar_book_switcher`, `test_resolve_owner_precedence`; T-022 `check_multibook` (end to end) | **pass** | Test evidence adds this report |

Criterion 2 (multi-book library + switcher) is met. With criterion 1
(relative images, Sprint 3) and criterion 3 (live reload, Sprint 5) already
delivered, **all three INT-0003 criteria are now satisfied → INT-0003 is
eligible to be `realized`** (done in the Loop Phase).

## Summary
- Unit/component tests: **49 passed / 0 failed / 49 total** (Vitest, 9 files)
- Integration gates: `check_multibook` (new), `check_external_build`,
  `check_live_reload` — all **OK**, tree restored clean
- E2E tests: **8 passed / 0 failed / 8 total** (default single-tome — no regression)
- `astro check`: **0 errors / 0 warnings / 0 hints** · neutronium audit: **passed**
- CI status: green **expected** on the PR (unit/integration + external gate +
  the new multi-book gate; live-reload is local by design)

## CI Confirmation
- To be observed on the Sprint 6 PR (recorded at the checkpoint, per the standing
  pattern). Local canonical-runner records at the tip of `dev`:
  - `npx vitest run` → `Tests 49 passed`
  - `npx playwright test` → `8 passed`
  - `node scripts/check-multibook.mjs` → OK (namespaced routes + Bibliotheca + switcher; tree clean)
  - `node scripts/check-external-build.mjs` → OK (handbook + docs-book; single → root)
  - `node scripts/check-live-reload.mjs` → OK (live edit reflected, no restart; tree clean)
  - `npx astro check` → `0 errors` · audit passed
  - Multi-tome Bibliotheca + switcher reviewed in the browser, both themes.

## Failures
None.

## Technical Debt Identified
- Multi-tome view has no automated *browser* E2E (gated at build level by
  `check_multibook`); see critique C-001.
- `test_dark_theme_active` / `test_paper_theme_active` `client:idle` hydration
  flake — backlog **T-208**.
- Remaining backlog: `upload-artifact@v7` bump (**T-207**), external-book browser
  E2E (**T-205**), parent-relative images (**T-206**).

## Coverage Observations
Criterion 2 is proven end to end by a build gate (`check_multibook`: two real
fixture tomes → namespaced routes + a `/` Bibliotheca listing both + the sidebar
switcher), now run in CI alongside the external gate, with the routing model,
loader precedence/dedup, owner resolution, and switcher/Bibliotheca data all
unit-tested. Adaptive routing keeps a single tome at the root, so the whole prior
suite (unit + E2E + external + live-reload) stays green — the multi-book feature
adds capability without disturbing the single-book path.
