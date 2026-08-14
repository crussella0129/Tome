# Sprint 10 Unit & Component Tests (Vitest)

`npx vitest run` → **72 passed / 0 failed / 72 total** (13 files). New this sprint:

## Search index (T-023) — `src/lib/__tests__/search-index.test.ts`
- `test_search_index_covers_chapters` — one record per non-draft chapter (drafts
  excluded); fenced code excluded from `text` (a `FENCEDTOKEN` inside a code block
  is absent), inline code kept.
- `test_search_index_heading_slugs` — headings slugged in document order incl. the
  H1; github-slugger parity (`The summary is the spine` → `the-summary-is-the-spine`);
  duplicate headings dedupe `notes`/`notes-1`/`notes-2` (matching Astro's per-page ids).
- `test_search_index_adaptive_url` — one tome → `/<chapter>` (root → `/`); several
  → `/<tome>/<chapter>` (root → `/<tome>`).

## Scorer (T-023) — `src/lib/__tests__/search.test.ts`
- `test_search_ranks_title_over_body` — a title/heading term outranks the same term
  in body; a title-only match links to the page (no section anchor).
- `test_search_prefix_multiterm` — prefix (`comp`→`components`); AND multi-term
  (`components widgets`); a section hit deep-links `/components#panels-and-tables`.
- `test_search_empty_and_noresults` — empty/whitespace and a no-match query → `[]`.

## Overlay (T-024) — `src/components/__tests__/SearchOverlay.test.tsx`
- `test_search_overlay_opens_and_lists` — the trigger opens the dialog, focus moves
  to the combobox, and a section query renders a result link with the adaptive href
  + heading anchor (`/components#panels`).
- `test_search_overlay_escape_closes` — `Escape` closes the dialog and restores
  focus to the trigger; the empty-query hint and no-result panels render (never blank).

## Regression (unchanged, still green)
- `ci-workflow.test.ts` now also asserts the `check-search.mjs` gate is present.
- summary, book, book-source, load-books, parent-assets, paths, contrast, fonts —
  all green.

`npx astro check` → **0 errors / 0 warnings / 0 hints**. neutronium audit → passed
(the `.map(` warnings are data transforms — the overlay renders results with `<For>`).
