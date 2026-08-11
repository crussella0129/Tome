# Sprint 0 Integration Tests

- **Runner:** Vitest 4.1.10
- **Command:** `npx vitest run` (file: `src/lib/__tests__/book.test.ts`)
- **Head SHA:** `3e950befa8e9047cf9eca77ae765bc5787e8a324`
- **Result:** included in the 21/21 Vitest pass.

## Book routing (parser → route generation)
- `test_book_routes_generated` — composes **T-003 clause 4** (draft → no href) and
  **T-005 clause 1** (a chapter route renders): parsing the bundled
  `SUMMARY.md` yields exactly one route per non-draft chapter
  (`''`, `getting-started`, `components`, `components/panels`, `about`), the
  draft "Unwritten Chapter" produces no route, and every route slug matches its
  parsed href — **pass**.
- supporting: `bookToc().title === 'Tome'` — **pass**.

This exercises the real seam between the pure parser (T-003) and the route
generator that `[...slug].astro` maps over (T-005), not merely repeated unit
coverage.
