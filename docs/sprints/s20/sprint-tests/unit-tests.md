# Sprint 20 — Unit Test Results

- **Tested implementation head:** `3830b71eb2c3cab0ce3aa3f4f25aa456cbfe8d9a`
- **Intent:** [INT-0019](../../../intents/INT-0019-centered-reader-search-geometry.md)
- **Environment:** Windows 11, Node 24.12.0, Vitest 4.1.10

## New unit tests

None. Sprint 20 changes browser layout composition and responsive CSS. JSDOM has
no layout engine, so an isolated unit assertion cannot prove element centers,
resolved `ch`/`rem` widths, media queries, hit-target rectangles, overlap, or
viewport containment. The locked plan therefore assigns every new EARS response
to real Chromium geometry tests.

## Existing unit and component coverage

`npm test` / `vitest run` passed **97/97 tests in 20 files** at the tested head.
Relevant retained behavior includes:

- `SearchOverlay.test.tsx`: **2/2** for search open/close and result behavior;
- `TocSidebar.test.tsx`: **5/5** for navigation state;
- `search.test.ts`, `search-copy.test.ts`, and `search-index.test.ts`: **8/8**
  for query behavior, host copy, and index contracts;
- `ci-workflow.test.ts`: **1/1**, including the checkout/setup-node/upload action
  major pins already present in the merged workflow.

The complete suite confirms that the layout-only work did not change the search
result model, keyboard behavior, navigation state, content loader, or rendering
utilities. The acceptance geometry itself is proved in `e2e-tests.md`.
