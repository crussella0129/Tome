Finalized - DO NOT EDIT

# Sprint 10 Test Plan

## Intent Traceability
| Intent | Acceptance criterion | Build task / EARS clause | Verification |
|--------|----------------------|--------------------------|--------------|
| [INT-0008](../../../intents/INT-0008-in-book-search.md) | 1 — index covers the library, static JSON | T-023 / WHEN builder runs THEN one record per non-draft chapter with url + heading slugs | `test_search_index_covers_chapters`, `test_search_index_heading_slugs` |
| [INT-0008](../../../intents/INT-0008-in-book-search.md) | 4 — adaptive result URLs | T-023 / url = chapterUrlIn(multi?tome:'' , href) | `test_search_index_adaptive_url`, `check_search` |
| [INT-0008](../../../intents/INT-0008-in-book-search.md) | 3 — ranking, prefix/multi-term, empty/no-result | T-023 / WHEN search runs THEN title/heading > body, prefix+multiterm, [] on empty | `test_search_ranks_title_over_body`, `test_search_prefix_multiterm`, `test_search_empty_and_noresults` |
| [INT-0008](../../../intents/INT-0008-in-book-search.md) | 2 — open/type/navigate/close | T-024 / WHEN `/` or control THEN open+trap+focus; Esc closes; results are links | `test_search_overlay_opens_and_lists`, `test_search_overlay_escape_closes`, `test_search_shortcut_opens_and_navigates` |
| [INT-0008](../../../intents/INT-0008-in-book-search.md) | 4 — zero-JS/accessible, end-to-end emit | T-024 + T-025 / one island; gate asserts emitted index + query path | `test_search_shortcut_opens_and_navigates`, `check_search` |

## Unit Tests
### T-023 unit tests
- **Intent:** [INT-0008](../../../intents/INT-0008-in-book-search.md)
- `test_search_index_covers_chapters` (`search-index.test.ts`): building over a fixture library yields one record per non-draft chapter with non-empty `text`, `chapterTitle`, and `tomeSlug`/`tomeTitle`; drafts excluded; fenced code absent from `text`.
- `test_search_index_heading_slugs` (`search-index.test.ts`): headings are extracted as `{text,slug,depth}` in document order (incl. the H1) and a computed `slug` equals the `id` Astro emits for the same heading text (github-slugger parity, e.g. `The summary is the spine` → `the-summary-is-the-spine`); a duplicate heading title produces the `-1` dedupe suffix (C-001).
- `test_search_index_adaptive_url` (`search-index.test.ts`): with one tome `url` is `/<chapter>`; with several, `/<tome>/<chapter>` (root chapter → `/<tome>`).
- `test_search_ranks_title_over_body` (`search.test.ts`): a term in a chapter title/heading ranks above the same term only in body.
- `test_search_prefix_multiterm` (`search.test.ts`): a prefix token matches (`comp` → `Components`); multi-term queries require all terms; a hit inside a section carries that heading's anchor.
- `test_search_empty_and_noresults` (`search.test.ts`): empty/whitespace query → `[]`; a query with no matches → `[]` (the overlay renders the designed state).

## Component / E2E Tests
### T-024
- **Intent:** [INT-0008](../../../intents/INT-0008-in-book-search.md)
- `test_search_overlay_opens_and_lists` (`SearchOverlay.test.tsx`): with injected `records`, activating the control opens the dialog, focuses the input, and typing renders result links with the expected `href` (adaptive URL + `#heading`).
- `test_search_overlay_escape_closes` (`SearchOverlay.test.tsx`): `Escape` closes the dialog **and returns focus to the trigger** (C-002); the empty-query and no-result panels render (never blank).
- `test_search_shortcut_opens_and_navigates` (`e2e/search.spec.ts`): on a built page, pressing `/` opens the overlay, a query lists results, and activating one navigates to the right chapter (URL contains the chapter path + heading anchor). Guards that `/` typed inside the input does not re-trigger.

## Integration Tests
### Search gate
- **Intent:** [INT-0008](../../../intents/INT-0008-in-book-search.md)
- `check_search` (`scripts/check-search.mjs`): default build → `dist/search-index.json` exists and covers the sample chapters/headings; `TOME_BOOKS=fixtures/handbook,fixtures/docs-book` build → records' `url`s are namespaced and a sample query via `search.ts` resolves to the expected URL; restores `src/content/books/` to HEAD. Wired into CI; `test_ci_workflow_valid` asserts the gate is present.

## End-to-End Tests
- **Status:** possible
- `test_search_shortcut_opens_and_navigates` (above) runs under Playwright against the built site (existing harness). The whole prior suite (8 specs) stays green — search only adds `/search-index.json` and one idle island.
