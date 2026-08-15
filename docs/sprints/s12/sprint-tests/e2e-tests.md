# Sprint 12 E2E Tests (Playwright)

`npx playwright test` → **12 passed / 0 failed / 12 total**. New this sprint
(`e2e/reader.spec.ts`):

- `test_reader_on_this_page_anchor` (INT-0010 #1/#4) — on `/components/panels` (after
  `body.js-nav`), the "on this page" rail lists the chapter's sections; clicking
  "Figures" moves the URL to `#figures`.
- `test_reader_keyboard_next_chapter` (INT-0010 #3/#4) — on `/getting-started` (after
  `html[data-reader-keys]`), `ArrowRight` navigates to `/components`; opening search
  with `/` and pressing `ArrowRight` in its field does **not** navigate (the guard).
- `test_reader_on_this_page_scrollspy` (INT-0010 #2) — with a short viewport (so the
  chapter scrolls, after `html[data-on-this-page]`), the first section is active at
  the top and stops being active once scrolled to the end — proving the scroll-sync
  updates the active section.

## Regression (unchanged, green)
The prior 9 reader + search specs stay green (`test_dark_theme_active` remains
de-flaked from Sprint 11). Deterministic hydration signals (`body.js-nav`,
`html[data-reader-keys]`, `html[data-on-this-page]`, `html[data-search-ready]`)
gate every island interaction, so no spec races `client:idle` hydration.

## Note — scroll-sync mechanism
The scroll-sync driver was changed from an `IntersectionObserver` to a passive,
rAF-throttled `scroll` listener: browser measurement (docH 1380 / viewport 420)
showed IO never fired on a jump-scroll to the end (all headings ended
non-intersecting its thin band), leaving the active section stale. The scroll
listener re-derives it from live `getBoundingClientRect` tops via the pure
`activeHeadingSlug`. INT-0010 criterion 2's wording and Consequences were corrected
to match; the outcome (scroll-synced active) is unchanged.
