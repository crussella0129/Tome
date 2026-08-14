# Sprint 10 E2E Tests (Playwright)

`npx playwright test` → **9 passed / 0 failed / 9 total** against the built
single-tome site.

## Search (new — T-024) — `e2e/search.spec.ts`
- `test_search_shortcut_opens_and_navigates` — on the built page, pressing `/`
  opens the overlay (dialog visible, combobox focused); typing lists results; a `/`
  typed **inside** the field is text, not a re-trigger (`components/`); activating a
  result navigates to `/components/panels` (its heading anchor). Waits on a
  deterministic hydration signal (`html[data-search-ready="true"]`) to avoid the
  `client:idle` race.

## Reader (regression, unchanged)
- `test_reader_renders_chapter_and_toc`, `test_chapter_code_block_styled`,
  `test_chapter_prose_elements_styled`, `test_chapter_image_styled`,
  `test_paper_theme_active`, `test_dark_theme_active`, `test_reduced_motion_honored`,
  `test_sidebar_focus_visible` — all green (the search overlay adds one idle island;
  reader routes/URLs unchanged).

## Real-browser check
The overlay was additionally exercised in Chromium (in-app browser): `/` opened it
and a "panels" query produced a result deep-linking to `/components/panels#panels`
(verified via the accessibility tree). A visual screenshot was unavailable this
session (the browser pane was not compositing), but the overlay styles use only
`--theme-*` tokens, so both themes derive from the token layer.
