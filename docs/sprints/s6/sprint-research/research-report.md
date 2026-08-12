# Sprint 6 Research Report

## Intents Reviewed
- [INT-0003](../../../intents/INT-0003-richer-external-book-support.md) — selected; relevance: this sprint delivers criterion 2 (present more than one book and switch between them), the **last** remaining criterion — on green, INT-0003 is eligible for `realized`; current state: `active` (criteria 1 + 3 done).

## 1. Sprint Goal

Let Tome present **multiple books** and switch between them: load several book
roots, mount each under its own route namespace, add a book switcher to the
sidebar, and a library index that lists the books. The bundled sample remains the
default when nothing is configured (a one-book library — no regression).

## 2. Existing Code Survey

The whole app assumes a **single** book under `src/content/book/`:

| File | Relevance | Notes (single-book assumption to generalize) |
|------|-----------|-----------|
| `src/lib/book.ts` | high | Static `import '../content/book/SUMMARY.md?raw'` + `book.meta.json`; `bookToc()`/`chapterRoutes()` for one book. → glob `../content/books/*/…` and build a library of `{ slug, title, toc, routes }`. |
| `src/pages/[...slug].astro` | high | `import.meta.glob('../content/book/**/*.md')`; `getStaticPaths` → `/<chapter-slug>`. → routes become `/<book>/<chapter>`; glob `../content/books/**`. |
| `src/layouts/BookLayout.astro` + `src/components/TocSidebar.tsx` | high | Render one book's TOC + title. → add a **book switcher** (list/links of books) above the active book's TOC. |
| `scripts/load-book.mjs` + `scripts/book-source.mjs` | high | `load-book.mjs` copies **one** book into `src/content/book/`. → a `load-books.mjs` copies **each** `TOME_BOOKS` entry into `src/content/books/<book-slug>/`; reuse `resolveBookSource`. |
| `src/content/book/**` (committed sample) | high | Migrates to `src/content/books/<sample-slug>/` so the library model is uniform (always ≥1 book). |
| `scripts/check-external-build.mjs`, `e2e/reader.spec.ts`, `src/lib/__tests__/*`, `fixtures/**` | high | Reference `src/content/book/` and `/<chapter>` routes — updated for the new content dir + `/<book>/<chapter>` routes. |
| `src/components/Pager.astro`, `src/lib/paths.ts` | med | Pager neighbours + slug mapping stay per-book; URLs gain the `<book>/` prefix. |

## 3. External Sources

- [Astro — `import.meta.glob`](https://docs.astro.build/en/guides/imports/#importmetaglob) — supports `eager` + `query: '?raw'` and `*`/`**` patterns, so a **variable** number of books can be loaded from `../content/books/*/SUMMARY.md` + `../content/books/*/book.meta.json` at build without a static per-book import. This is the mechanism that makes N books work with Astro's static imports.
- [Astro — dynamic (rest) routes](https://docs.astro.build/en/guides/routing/#dynamic-routes) — `src/pages/[...slug].astro` `getStaticPaths` can emit `/<book>/<chapter>` params for every book × chapter, and `/` (a library index) as its own page or a `slug: undefined` entry.

## 4. Risks, Unknowns, Dependencies

- **Risk: route churn.** Namespacing every book under `/<book>/…` changes all existing sample URLs and the E2E/gate assertions. Mitigation: update tests/gates in the same sprint; consider whether the *default single book* keeps root URLs (a design fork — see §5).
- **Risk: content-dir migration.** Moving the committed sample from `src/content/book/` → `src/content/books/<slug>/` touches many references (book.ts, glob, gates, fixtures). Mitigation: do it once, mechanically; the `check-external-build` + E2E gates catch misses.
- **Risk: slug collisions.** Two books with the same directory name. Mitigation: dedupe slugs (`name`, `name-2`, …), deterministic by input order.
- **Risk: scope.** This is the largest change since Sprint 0 (routing + content + UI + loader + tests). Mitigation: bound to criterion 2's essentials (load N, namespaced routes, switcher, library index, sample default); no search/per-book theming.
- **Unknown (design forks — resolve at Plan with the user):** (a) **config** — `TOME_BOOKS=/a,/b` env vs a config file; (b) **route model** — uniform `/<book>/<chapter>` for all, or the primary/first book stays at root `/<chapter>` with others namespaced; (c) **root `/`** — a library index page vs a redirect to the first book.
- **Dependency: none new** — reuses `resolveBookSource`, `parseSummary`, the render pipeline, and the live-reload/gate infrastructure.

## 5. Recommended Approach

Primary: a **`src/content/books/<book-slug>/`** layout, one dir per book, populated
by a new **`scripts/load-books.mjs`** (from `TOME_BOOKS`, else the single
`TOME_BOOK`, else the committed sample — migrated to `src/content/books/tome/`).
`book.ts` becomes a **library**: `import.meta.glob('../content/books/*/SUMMARY.md',
{ eager, query:'?raw' })` + the per-book `book.meta.json` → `books()` returning
`[{ slug, title, toc, routes }]`. `[...slug].astro` emits `/<book>/<chapter>` for
every book (glob `../content/books/**/*.md`), plus a **library index** at `/`.
`TocSidebar` gains a switcher (the books, linking to each book's first chapter),
above the active book's TOC. Reuse `resolveBookSource`, `parseSummary`,
`hrefToSlug`, prose/token styling, and the gates unchanged in spirit.

**Three design forks are deliberately deferred to the Plan gate** (they change
URLs/UX and are the user's call): config mechanism, route model, and root
behavior. I will confirm them via a plan-mode question before finalizing.

Alternative considered: keep a single content dir with per-book subfolders and a
`books.json` manifest. Rejected — `import.meta.glob('*/SUMMARY.md')` over
`src/content/books/*` is cleaner and avoids a hand-maintained manifest.

Rationale: `import.meta.glob` removes the static-import barrier to N books, and
the render pipeline is per-book already, so the work is (loader → content dirs →
library in `book.ts` → namespaced routes → switcher + index), each testable, with
the existing gates catching regressions.

## Artifacts
- Reviewed intent: [INT-0003](../../../intents/INT-0003-richer-external-book-support.md) (criterion 2, the last one).
- Reuses realized [INT-0004](../../../intents/INT-0004-flexible-book-source-detection.md) detection (`resolveBookSource`) for each book.
