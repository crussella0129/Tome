# Sprint 0 End-to-End Tests

- **Status:** possible — executed.
- **Runner:** Playwright 1.62.1 (chromium-headless-shell) against the production
  build via `astro build && astro preview` (port 4321).
- **Command:** `npx playwright test` (file: `e2e/reader.spec.ts`)
- **Head SHA:** `3e950befa8e9047cf9eca77ae765bc5787e8a324`
- **Result:** 6 passed / 0 failed / 6 total (18.0s).

## Cases
- `test_reader_renders_chapter_and_toc` — `/` shows the sidebar chapter links
  (Getting Started, Sacred Components, About) and the Introduction chapter's
  rendered Markdown in the content region — **pass** (T-005 clause 1 · criterion 2).
- `test_chapter_code_block_styled` — `/getting-started` `<pre>` has a monospace
  computed font (matches `/mek|mono/`) and a real border (sacred panel) —
  **pass** (T-005 clause 2 · criterion 5).
- `test_chapter_prose_elements_styled` — `h2` carries the underline rule; ordered
  list and inline code render; on `/components` a link renders and a `table th`
  is bordered; on `/components/panels` a `blockquote` carries the accent left
  rule — **pass** (T-005 clause 3 · criterion 5). Images are the one criterion-5
  element not asserted (the sample book ships no image; deferred — see critique).
- `test_paper_theme_active` — default body is `theme-ink-paper`; computed
  `background-color` is the parchment token `rgb(243, 233, 210)` — **pass**
  (T-002 clause 3 · criterion 3).
- `test_dark_theme_active` — the sidebar theme switch flips body to
  `theme-terminal-dark`; computed background becomes `rgb(22, 19, 14)` — **pass**
  (T-002 clause 4 · criterion 3).
- `test_sidebar_focus_visible` — keyboard Tab focuses a sidebar anchor that
  matches `:focus-visible` and shows a non-zero outline — **pass**
  (T-004 clause 4 · criterion 6).
