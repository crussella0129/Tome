# Sprint 6 Unit & Component Tests (Vitest)

`npx vitest run` → **49 passed / 0 failed / 49 total** (9 files). New this sprint:

## Content model + adaptive routing (T-019) — `src/lib/__tests__/book.test.ts`
- `test_books_library` — `books()` returns one entry per `src/content/books/*`
  tome; the migrated sample resolves as slug `tome`, title `Tome`, five chapters
  in reading order (the draft excluded).
- `test_routes_adaptive_single_and_multi` (2 cases) — one tome → bare root route
  slugs (`''`, `one`); many tomes → a single `bibliotheca` page at `''` plus
  namespaced chapter slugs (`alpha`, `alpha/one`, `beta`, `beta/two`), and no
  chapter collides with the index.
- `pageSlug` — adaptive prefixing: single-tome root → `''`; multi root → the tome
  slug; deeper chapters → `<tome>/<chapter>`.

## Bibliotheca + switcher (T-021)
- `test_bibliotheca_lists_tomes` (`book.test.ts`) — `bibliothecaEntries` returns
  one titled, namespaced-href entry per tome with a chapter count.
- `test_sidebar_book_switcher` (2 cases, `TocSidebar.test.tsx`) — with 2 tomes the
  sidebar lists each tome as a link with `aria-current="true"` on the active + a
  Bibliotheca link (`/`); with one tome, no switcher renders.

## Loader precedence + owner (T-020, T-021) — `src/lib/__tests__/load-books.test.ts`
- `test_load_books_precedence` (3 cases) — `TOME_BOOKS` overrides a
  `tome.config.toml`; the manifest is used when env is unset; neither → no-op.
- `test_load_books_multi_copy` (4 cases) — two books populate `books/<slug>/` with
  `book.meta.json`; colliding basenames dedupe (`guide`, `guide-2`); an invalid
  path errors non-zero and writes nothing (resolve-all-first).
- `test_resolve_owner_precedence` — `TOME_OWNER` env > `tome.config.toml` `owner` >
  the OS login name (zero-config personalization).
- Single-book source detection retained through `load-books` (`TOME_BOOK`): the 6
  detection cases (`test_load_book_external`, docs/ detection, declared-src
  authoritative, dir-name title, enumerated errors, no-op-when-unset) stay green.

## Regression (unchanged, still green)
- `summary.test.ts` (parser, 10), `book-source.test.ts` (resolve + syncPath),
  `contrast.test.ts`, `fonts.test.ts`, `ci-workflow.test.ts` (now also asserts the
  `check-multibook.mjs` gate is present).

`npx astro check` → **0 errors / 0 warnings / 0 hints**. neutronium audit → passed
(the two `.map(` warnings are data transforms — `THEMES.map`, a test href map —
not Solid JSX; the sidebar switcher renders with `<For>`).
