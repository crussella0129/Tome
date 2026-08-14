# Sprint 11 E2E Tests (Playwright)

`npx playwright test` → **9 passed / 0 failed / 9 total**.

## De-flaked theme toggle (T-208, INT-0001)
- `test_dark_theme_active` — now awaits the sidebar hydration signal
  (`body.js-nav`, set in `TocSidebar.onMount`) before clicking "Switch colour
  theme", so the toggle handler is attached before the click. This removes the
  `client:idle` race that intermittently reddened the run (observed in Sprints 10).
  The assertion is unchanged (body gains `theme-terminal-dark` + the warm-dark
  background). A genuine hydration failure now surfaces as a timeout, not a flaky
  pass/fail.

## Regression (unchanged, green)
- `test_reader_renders_chapter_and_toc`, `test_chapter_code_block_styled`,
  `test_chapter_prose_elements_styled`, `test_chapter_image_styled`,
  `test_paper_theme_active`, `test_reduced_motion_honored`,
  `test_sidebar_focus_visible` (reader), and `test_search_shortcut_opens_and_navigates`
  (search) — all green.
