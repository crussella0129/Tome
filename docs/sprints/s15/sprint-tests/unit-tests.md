# Sprint 15 — Unit Test Results

- **Tested head:** `cd869bf9863d4b6fc1e03151558638de832f338d`
- **Runner:** `npx vitest run` (canonical). **Result: 96 passed / 96 (19 files).**
- **Intents:** [INT-0013](../../intents/INT-0013-resilient-scaling-zoom.md), [INT-0014](../../intents/INT-0014-discoverable-library.md)

## T-037 — `searchScopeCopy` (`src/lib/__tests__/search-copy.test.ts`)

Proves the pure, tome-count-aware search copy (INT-0014 #3).

| Test | Arrangement → assertion | Result |
|------|--------------------------|--------|
| `test_search_copy_library_wide` | `searchScopeCopy(true)` → trigger/dialog "Search the library", hint contains "every tome" | pass |
| `test_search_copy_single_tome` | `searchScopeCopy(false)` → trigger/dialog "Search this tome"; never "library"/"every tome" | pass |

## T-036 — bundled-library shape (`src/lib/__tests__/book.test.ts`, updated)

The default library is now two tomes; the unit tests select by slug.

- `test_books_library` — `books()` returns `['marginalia', 'tome']`; the "tome" book keeps its chapters (`''`, `getting-started`, `components`, `components/panels`, `about`), Marginalia is titled "Marginalia".
- `test_pager_prev_next` — the "tome" book's pager neighbours are linked and ends open (Introduction ↔ Getting Started … Panels & Tables).
- The adaptive-routing/`bibliothecaEntries`/`pageSlug` tests (single → root, multi → namespaced + Bibliotheca) remain green.

## Regression

All prior unit suites (summary, book, load-books, search, search-index, paths,
book-source, ci-workflow, parent-assets, remark-alerts, dist-resolve, icon-variant,
contrast, fonts, TocSidebar, **SearchOverlay** — rendered library-wide) — **94 prior
+ 2 new = 96**, green. The recurring Windows-only `load-books` temp-cleanup EPERM
flake surfaced once mid-run and cleared on re-run (Linux CI unaffected).
