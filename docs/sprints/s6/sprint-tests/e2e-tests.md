# Sprint 6 E2E Tests (Playwright)

`npx playwright test` → **8 passed / 0 failed / 8 total** against the default
single-tome build. Adaptive routing keeps a single book at the root, so the
entire existing E2E suite is unchanged — no churn:

- `test_reader_renders_chapter_and_toc`, `test_chapter_code_block_styled`,
  `test_chapter_prose_elements_styled`, `test_chapter_image_styled`,
  `test_paper_theme_active`, `test_dark_theme_active`,
  `test_reduced_motion_honored`, `test_sidebar_focus_visible` — all green
  (root URLs `/`, `/getting-started`, `/components`, `/components/panels`).

## Multi-tome (Bibliotheca) — manual browser review
The multi-tome shape has no automated E2E (it is gated at build level by
`check_multibook`), but was **reviewed in the browser** on a real two-tome build
(`TOME_BOOKS=fixtures/handbook,fixtures/docs-book`), in both themes:
- `/` renders the sacred masthead ("The Bibliotheca of <owner>", owner defaulting
  to the OS login name) + numbered plates linking `/handbook` and `/docs-book`.
- A chapter page shows the sidebar switcher with the sibling tome linked and the
  active tome highlighted.
- ink-on-paper (default) and terminal-dark (amber-on-warm-black) both read
  correctly; tokens flow through with no hardcoded colour.

## Note
`test_dark_theme_active`/`test_paper_theme_active` intermittently flake under the
8-worker parallel run (a `client:idle` sidebar-hydration race: the test clicks the
theme toggle immediately after `goto`). Cleared on isolated + full re-run; the
flake predates this sprint. Filed as backlog **T-208** (await hydration before
clicking).
