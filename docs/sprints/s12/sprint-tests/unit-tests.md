# Sprint 12 Unit & Component Tests (Vitest)

`npx vitest run` → **81 passed / 0 failed / 81 total** (15 files). New this sprint:

## "On this page" rail (T-026) — `src/components/__tests__/OnThisPage.test.tsx`
- `test_on_this_page_lists_headings` — given injected headings, renders
  `nav[aria-label="On this page"]` with `#slug` anchor links and the heading text.
- `test_on_this_page_empty_no_rail` — given no headings, renders nothing.
- `test_active_heading_selection` — the pure `activeHeadingSlug(headings, tops)`:
  all-below → the first heading; two passed → the second; all passed → the last;
  empty → undefined. DOM-free (the scroll-sync driver calls it with live
  `getBoundingClientRect` tops).

## Keyboard chapter nav (T-027) — `src/components/__tests__/ReaderKeys.test.tsx`
- `test_reader_keys_navigates` — `ArrowRight`/`j` → next, `ArrowLeft`/`k` → prev (via
  an injected `navigate`); an absent neighbour is a no-op.
- `test_reader_keys_guarded` — a key whose target is an `input`, a modified key, or a
  keydown with an open `[role="dialog"]` (the search overlay's signal) → no navigation.

## Regression (all prior suites green)
book, book-source, load-books, parent-assets, search, search-index, summary, paths,
ci-workflow, contrast, fonts, TocSidebar, SearchOverlay — unchanged and green.

`npx astro check` → **0 errors / 0 warnings / 0 hints**. neutronium audit → passed.
