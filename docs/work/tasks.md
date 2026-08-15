# Agent Tasks (Persistent Backlog)

- [ ] T-036 (sprint 15) [intent: INT-0014]: Second curated sample tome → default 2-tome Bibliotheca; migrate reader/search/electron E2E to the multi-tome default (Bibliotheca at `/`, cross-tome nav, library-wide search) — touches: src/content/books/<second>/, src/content/books/tome/book.meta.json, e2e/reader.spec.ts, e2e/search.spec.ts, e2e/electron.spec.ts
- [ ] T-037 (sprint 15) [intent: INT-0014]: Tome-count-aware search copy (library-wide for N>1, not implying many for N=1) — touches: src/components/SearchOverlay.tsx, src/layouts/BookLayout.astro, src/components/Bibliotheca.astro, e2e/search.spec.ts
- [ ] T-035 (sprint 15) [intent: INT-0013]: Responsive scaling sweep — e2e/scaling.spec.ts (width matrix × reader/Bibliotheca/search: no overflow, dialog in viewport, layout mode per breakpoint) + testMatch — touches: e2e/scaling.spec.ts, playwright.config.ts
