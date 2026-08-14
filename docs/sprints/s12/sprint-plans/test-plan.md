Finalized - DO NOT EDIT

# Sprint 12 Test Plan

## Intent Traceability
| Intent | Acceptance criterion | Build task / EARS clause | Verification |
|--------|----------------------|--------------------------|--------------|
| [INT-0010](../../../intents/INT-0010-in-page-reader-navigation.md) | 1 — rail lists H2/H3 as `#slug` links; none → no rail | T-026 / WHEN headings THEN nav of anchor links; WHEN none THEN no rail | `test_on_this_page_lists_headings`, `test_on_this_page_empty_no_rail` |
| [INT-0010](../../../intents/INT-0010-in-page-reader-navigation.md) | 2 — scroll-sync marks the in-view section | T-026 / WHEN scroll THEN aria-current (pure `activeHeadingSlug` + IntersectionObserver) | `test_active_heading_selection`, `test_reader_on_this_page_scrollspy` |
| [INT-0010](../../../intents/INT-0010-in-page-reader-navigation.md) | 3 — keyboard nav + guards | T-027 / WHEN arrow/j/k outside field & no dialog THEN navigate; WHEN input/dialog THEN not | `test_reader_keys_navigates`, `test_reader_keys_guarded` |
| [INT-0010](../../../intents/INT-0010-in-page-reader-navigation.md) | 4 — rail + keys work in a browser | T-028 / rail anchor lands; ArrowRight → next chapter | `test_reader_on_this_page_anchor`, `test_reader_keyboard_next_chapter` |

## Unit / Component Tests
### T-026
- **Intent:** [INT-0010](../../../intents/INT-0010-in-page-reader-navigation.md)
- `test_on_this_page_lists_headings` (`OnThisPage.test.tsx`): given injected
  `headings=[{depth:2,slug:'a',text:'A'},{depth:3,slug:'b',text:'B'}]`, renders a
  `nav[aria-label="On this page"]` with links `href="#a"`, `href="#b"` and the
  heading text; nested depth reflected (e.g. an indent class/data-depth).
- `test_on_this_page_empty_no_rail` (`OnThisPage.test.tsx`): given `headings=[]`,
  renders nothing (no `nav`).
- `test_active_heading_selection` (`OnThisPage.test.tsx`): the pure
  `activeHeadingSlug(headings, tops)` picks the last heading at/above the offset —
  all-below → the first heading; scrolled past two → the second; unit-tested with
  no DOM (C-001).

### T-027
- **Intent:** [INT-0010](../../../intents/INT-0010-in-page-reader-navigation.md)
- `test_reader_keys_navigates` (`ReaderKeys.test.tsx`): with an injected `navigate`
  spy and `prevUrl='/a'`, `nextUrl='/b'`, `ArrowRight`/`j` → `navigate('/b')`,
  `ArrowLeft`/`k` → `navigate('/a')`; with `nextUrl` undefined, the next key is a no-op.
- `test_reader_keys_guarded` (`ReaderKeys.test.tsx`): a keydown whose target is an
  `input`/`textarea`/`contenteditable`, or a keydown with a modifier, or with an
  open `[role="dialog"]` in the DOM → `navigate` is NOT called.

## End-to-End Tests
- **Status:** possible
- `test_reader_on_this_page_anchor` (`e2e/reader.spec.ts`): open `/components/panels`
  (multi-section), await `body.js-nav`, assert the "on this page" rail lists the
  chapter's headings, click one → `page.url()` ends with that `#slug`.
- `test_reader_keyboard_next_chapter` (`e2e/reader.spec.ts`): on `/getting-started`,
  await `body.js-nav`, press `ArrowRight` → the URL becomes the next chapter
  (`/components`); pressing it inside the focused search field does not navigate.
- `test_reader_on_this_page_scrollspy` (`e2e/reader.spec.ts`): scrolling to a section
  marks its rail link `aria-current` (top-of-page → the first section active).

## Regression
Full Vitest + Playwright (existing 9) + `check_external_build` / `check_multibook` /
`check_search` / `check_live_reload` + `astro check` + audit stay green. The
Bibliotheca (no chapter) renders no rail; single-tome reader URLs unchanged.
