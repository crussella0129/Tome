# Sprint 13 Unit Tests (Vitest)

`npx vitest run` → **83 passed / 0 failed / 83 total** (16 files). New this sprint:

## Admonitions plugin (T-029) — `src/lib/__tests__/remark-alerts.test.ts`
- `test_remark_alerts_transforms` — parsing `> [!WARNING]\n> Be careful.` and running
  the plugin yields a `blockquote` node with `data.hName='div'`, className
  `[admonition, admonition-warning]`, a prepended `admonition-title` paragraph
  ("Warning"), and the body text with the marker stripped; case-insensitive
  (`[!note]` → `admonition-note`, title "Note").
- `test_remark_alerts_leaves_plain_blockquote` — a markerless blockquote and a bogus
  `[!FOO]` marker are left as plain blockquotes (no `hName`, no admonition class).

## Regression (all prior suites green)
book, book-source, load-books, parent-assets, search, search-index, summary, paths,
ci-workflow, contrast, fonts, TocSidebar, SearchOverlay, OnThisPage, ReaderKeys —
unchanged and green.

> Note: `load-books.test.ts` intermittently hits a **Windows-only** `EPERM` on temp
> directory cleanup (its subprocesses hold handles briefly); it clears on re-run and
> does not occur on the Linux CI runner. All 83 tests pass.

`npx astro check` → **0 errors / 0 warnings / 0 hints**. neutronium audit → passed.
