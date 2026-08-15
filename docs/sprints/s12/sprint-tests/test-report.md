# Sprint 12 Test Report

## Intent Verification
| Intent | Acceptance criterion | EARS / tests | Result | Intent evidence update |
|--------|----------------------|---------------|--------|------------------------|
| [INT-0010](../../../intents/INT-0010-in-page-reader-navigation.md) | 1 — rail lists H2/H3 as `#slug` links; none → no rail | T-026 `test_on_this_page_lists_headings`, `test_on_this_page_empty_no_rail`; E2E `test_reader_on_this_page_anchor` | **pass** | Test evidence adds this report |
| [INT-0010](../../../intents/INT-0010-in-page-reader-navigation.md) | 2 — scroll-synced active section | T-026 `test_active_heading_selection`; E2E `test_reader_on_this_page_scrollspy` | **pass** | (as above) |
| [INT-0010](../../../intents/INT-0010-in-page-reader-navigation.md) | 3 — keyboard nav + guards | T-027 `test_reader_keys_navigates`, `test_reader_keys_guarded`; E2E `test_reader_keyboard_next_chapter` | **pass** | (as above) |
| [INT-0010](../../../intents/INT-0010-in-page-reader-navigation.md) | 4 — rail + keys in a browser | T-028 E2E (above) | **pass** | (as above) |

All four INT-0010 criteria are met → **INT-0010 is eligible for `realized`** (Loop
Phase). Criterion 2's mechanism wording was corrected (IntersectionObserver → a
scroll listener) to match the delivered implementation; the outcome is unchanged.

## Summary
- Unit/component: **81 passed / 0 failed** (Vitest, 15 files) — incl. `activeHeadingSlug`,
  the rail, and keyboard-nav guards.
- E2E: **12 passed / 0 failed** (Playwright) — 3 new reader-nav specs + the prior 9.
- Regression gates: `check_external_build`, `check_multibook` (also proves the Pager
  multi-tome fix), `check_search`, `check_live_reload` — all **OK**, tree clean.
- `astro check`: **0 errors / 0 warnings / 0 hints** · audit: **passed**.
- CI status: green **expected** on the PR (all CI-run gates green locally).

## Tested head
- **Head SHA:** `f3c6b5f430185a6736e931ae860ce29803e65f89` (tip of `dev`).
- Local canonical-runner: `vitest` 81 · `playwright` 12 · `check_external_build` OK ·
  `check_multibook` OK · `check_search` OK · `check_live_reload` OK · `astro check`
  0 errors · audit passed. CI conclusion to be observed on the Sprint 12 PR.

## Failures
None.

## Technical Debt Identified
- The scroll-sync E2E uses a short viewport to force the (short) sample chapter to
  scroll; richer sample content would let it assert a specific active section
  directly. Not blocking.
- Deep nesting (H4+) and a cross-chapter TOC remain out of scope (the sidebar's job).
- No new backlog opened.

## Coverage Observations
INT-0010 is proven at two levels: the rail's structure + the pure `activeHeadingSlug`
selection are unit-tested (DOM-free), and Playwright verifies the rail lists a real
chapter's sections, an anchor lands, an arrow key navigates (and is guarded in the
search field), and the active section is scroll-synced. The build path is unchanged
(the rail is server-rendered; a section-less chapter renders no rail), and the Pager
multi-tome link bug found while wiring keyboard nav was fixed and is covered by
`check_multibook`.
