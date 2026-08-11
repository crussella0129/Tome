# Sprint 1 End-to-End Tests

- **Status:** possible — executed.
- **Runner:** Playwright 1.62.1 (chromium) against the production build, served by
  a foreground static server (`scripts/serve-dist.mjs`, `reuseExistingServer:false`
  — deterministic fresh build every run).
- **Command:** `npx playwright test`
- **Head SHA:** `2ec25101eabcd61d3d2392713a29fb237a5a5d4b`
- **Result:** 8 passed / 0 failed / 8 total (24.9s).

## New this sprint
- `test_chapter_image_styled` — `/components/panels`: the `.tome-prose img`
  (self-authored `sacred-diagram.svg`) is visible, bordered (border > 0), and
  actually loaded (`naturalWidth > 0`) — **pass** (T-007 · criterion 5, images).
- `test_reduced_motion_honored` — with `emulateMedia({reducedMotion:'reduce'})`,
  the `.transition-token` theme button's computed `transition-duration` collapses
  to ≤ 1ms — **pass** (T-008 · criterion 6).

## Carried from Sprint 0 (all still green)
- `test_reader_renders_chapter_and_toc`, `test_chapter_code_block_styled`,
  `test_chapter_prose_elements_styled`, `test_paper_theme_active`,
  `test_dark_theme_active`, `test_sidebar_focus_visible` — **pass**.

With images now proven, criterion 5's full element set (headings, paragraphs,
lists, code, inline code, blockquotes, tables, links, **images**) is covered.
