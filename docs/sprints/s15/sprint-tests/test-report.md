# Sprint 15 Test Report

## Intent Verification
| Intent | Acceptance criterion | EARS / tests | Result | Intent evidence update |
|--------|----------------------|---------------|--------|------------------------|
| [INT-0013](../../../intents/INT-0013-resilient-scaling-zoom.md) | 1 — shell opens at 100%; accidental zoom can't collapse the layout | `test_electron_zoom_locked` (opens at 1; `zoom-changed` snaps back) | **pass** | Test evidence adds this report |
| [INT-0013](../../../intents/INT-0013-resilient-scaling-zoom.md) | 2 — no overflow; dialog never clipped, across widths | `test_scaling_no_overflow`, `test_scaling_dialog_in_viewport` | **pass** | (as above) |
| [INT-0013](../../../intents/INT-0013-resilient-scaling-zoom.md) | 3 — correct layout mode per breakpoint | `test_scaling_layout_mode` | **pass** | (as above) |
| [INT-0013](../../../intents/INT-0013-resilient-scaling-zoom.md) | 4 — sweep runs browser + shell | `test_scaling_*` + `test_electron_zoom_locked` | **pass** | (as above) |
| [INT-0014](../../../intents/INT-0014-discoverable-library.md) | 1 — default is a 2-tome Bibliotheca (index + switcher) | `test_reader_bibliotheca_default` + electron `test_electron_reader_offline` + build (9 pages) | **pass** | Test evidence adds this report |
| [INT-0014](../../../intents/INT-0014-discoverable-library.md) | 2 — cross-tome nav (no JS); single-tome unchanged | `test_reader_cross_tome_nav` + `check:external` | **pass** | (as above) |
| [INT-0014](../../../intents/INT-0014-discoverable-library.md) | 3 — honest search copy | `searchScopeCopy` unit (`test_search_copy_library_wide`/`_single_tome`) | **pass** | (as above) |
| [INT-0014](../../../intents/INT-0014-discoverable-library.md) | 4 — multi-tome + single-tome; library-wide search | `test_search_across_tomes` + `check:external` | **pass** | (as above) |

All criteria met → **INT-0013 and INT-0014 are eligible for `realized`** (Loop Phase).

## Summary
- Unit: **96 passed / 0 failed** (Vitest, 19 files) — incl. `searchScopeCopy` (both library sizes) and the 2-tome bundled-library shape.
- Browser E2E: **21 passed / 0 failed** (`npm run test:e2e`) — the scaling sweep (no overflow / dialog-in-viewport / layout mode), the Bibliotheca default, cross-tome nav, cross-tome search, and the reader/search specs migrated to the `/tome` namespace.
- Electron E2E: **6 passed / 0 failed** (`npm run check:electron`) — zoom-lock + the Bibliotheca→tome offline path, plus the retained shell tests.
- Gates: `check:external` (exit 0), `check:multibook`, `check:search`, `check:livereload` — all **OK** against the new 2-tome default.
- `astro check`: **0 errors**; neutronium audit: **passed**.
- CI status: green **expected** on the PR (all CI-run suites/gates green locally; the Electron E2E is the local opt-in gate).

## Tested head
- **Head SHA:** `cd869bf9863d4b6fc1e03151558638de832f338d` (tip of `dev`).
- Local canonical-runner: `vitest` 96 · `test:e2e` 21 · `check:electron` 6 · `check:external` OK · `check:multibook` OK · `check:search` OK · `check:livereload` OK · `astro check` 0 · audit passed. CI conclusion to be observed on the Sprint 15 additions to PR #15.

## Failures
None. (The recurring Windows-only `load-books.test.ts` temp-cleanup `EPERM` flake surfaced once and cleared on re-run — Linux CI unaffected.)

## Technical Debt Identified
- **Gate tree-cleaning hazard:** `check:search`/`check:multibook` run `git clean -fdq src/content/books`, which deletes *uncommitted* tomes — a footgun encountered this sprint (mitigated by committing content before running gates). A future hardening could scope the clean or guard a dirty tree.
- The `npm run electron` alias and the deliberate-keyboard-zoom reachability clause are covered by construction / transitively (see `critique.md` C-001/C-002), not by dedicated assertions.

## Coverage Observations
INT-0013 is proven at unit (none needed beyond the copy helper), browser (a width
sweep 480→2560 asserting no overflow, the search dialog in-viewport, and the exact
layout mode per breakpoint), and shell (the accidental-zoom `zoom-changed` snap-back
that neutralizes the collapse the sprint set out to fix). INT-0014 is proven by the
default build being a navigable 2-tome Bibliotheca — `/` lists both tomes, the sidebar
switcher crosses between them and links back to the library, and library-wide search
returns tome-tagged hits from both — with the single-tome mode still green via
`check:external` and the search copy made honest for either library size.
