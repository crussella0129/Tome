Finalized - DO NOT EDIT

# Sprint 6 Test Plan

## Intent Traceability
| Intent | Acceptance criterion | Build task / EARS clause | Verification |
|--------|----------------------|--------------------------|--------------|
| [INT-0003](../../../intents/INT-0003-richer-external-book-support.md) | 2 — library of tomes | T-019 / WHEN books() runs THEN one entry per src/content/books/* with slug/title/toc/routes | `test_books_library` |
| [INT-0003](../../../intents/INT-0003-richer-external-book-support.md) | 2 — adaptive routes | T-019 / WHEN 1 tome THEN /<chapter>; WHEN N THEN /<tome>/<chapter> + / bibliotheca | `test_routes_adaptive_single_and_multi` |
| [INT-0003](../../../intents/INT-0003-richer-external-book-support.md) | 2 — config precedence | T-020 / WHEN env set THEN wins; else toml; else sample | `test_load_books_precedence` |
| [INT-0003](../../../intents/INT-0003-richer-external-book-support.md) | 2 — multi copy + dedup | T-020 / WHEN loaded THEN each copied to books/<slug>/ (deduped) + meta | `test_load_books_multi_copy` |
| [INT-0003](../../../intents/INT-0003-richer-external-book-support.md) | 2 — sidebar switcher | T-021 / WHEN N tomes THEN switcher lists all + active marked; WHEN 1 THEN none | `test_sidebar_book_switcher` |
| [INT-0003](../../../intents/INT-0003-richer-external-book-support.md) | 2 — bibliotheca lists tomes | T-021 / WHEN bibliotheca renders THEN a titled link per tome | `test_bibliotheca_lists_tomes` |
| [INT-0003](../../../intents/INT-0003-richer-external-book-support.md) | 2 — two-tome build end to end | T-022 / WHEN built with two tomes THEN namespaced routes + / bibliotheca | `check_multibook` |

## Unit / Component Tests (Vitest — run in CI)
- **Intent:** [INT-0003](../../../intents/INT-0003-richer-external-book-support.md)
- `test_books_library` (`book.test.ts`): with a temp `src/content/books/*` layout (or fixture-driven), `books()` returns one entry per tome dir with `{ slug, title, toc, routes }`; the sample yields the `tome` book. (T-019 clause 1)
- `test_routes_adaptive_single_and_multi` (`book.test.ts`): one tome → route slugs are bare `/<chapter>`; two tomes → slugs are `/<tome>/<chapter>` and a Bibliotheca entry exists for `/`. (T-019 clause 2)
- `test_load_books_precedence` (`load-books.test.ts`, subprocess): env `TOME_BOOKS` wins over a `tome.config.toml`; the toml is used when env is unset; both unset → no-op. (T-020 clause 1)
- `test_load_books_multi_copy` (`load-books.test.ts`, subprocess): two book roots → two `src/content/books/<slug>/` populated with deduped slugs + `book.meta.json`; an invalid path errors non-zero. (T-020 clause 2)
- `test_sidebar_book_switcher` (`TocSidebar.test.tsx`): with 2 books the switcher renders a link per book with `aria-current` on the active + a Bibliotheca link; with 1 book no switcher. (T-021 clause 1)
- `test_bibliotheca_lists_tomes` (component/Astro-container or DOM): the Bibliotheca lists each tome as a titled link. (T-021 clause 2)

## Gates / End-to-End
- `check_multibook` (local): `TOME_BOOKS=fixtures/handbook,fixtures/docs-book npm run build` → assert `dist/<handbook>/first/` and `dist/<docs-book>/overview/` (namespaced), and `/` (the Bibliotheca) lists both tomes; restore `src/content/books/` to HEAD. (T-022 clause 1)
- Regression (adaptive keeps single-book URLs, so all stay green): full `npx vitest run`, `npx playwright test` (sample at root `/<chapter>`), `node scripts/check-external-build.mjs` (single external book → root), `node scripts/check-live-reload.mjs`, `npx astro check`, audit, observed CI on the PR.
