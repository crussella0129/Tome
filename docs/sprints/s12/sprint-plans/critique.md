# Plan Critique — Sprint 12

## Concerns

### C-001: Scroll-sync (criterion 2) rests on a single E2E; the active-selection logic isn't unit-tested
- **Where:** `test-plan.md` `test_reader_on_this_page_scrollspy` (e2e); `build-plan.md` T-026 clause 2.
- **Quote:** "mark the section currently in view … via an `IntersectionObserver` … `test_reader_on_this_page_scrollspy` … e2e (or component w/ IO stub)".
- **Failure mode:** flake-risk / weak-assertion
- **Why it matters:** `IntersectionObserver` isn't available in jsdom and its callbacks are timing-driven in a browser, so a lone E2E is the only proof of the "which heading is active" rule — brittle and coarse.
- **Suggested response:** fix-in-plan — extract the active-choice as a **pure** helper `activeHeadingSlug(headings, tops)` (given each heading's `getBoundingClientRect().top`, pick the last one at/above a small offset) and unit-test it (`test_active_heading_selection`); the island calls it from its `IntersectionObserver`/scroll handler. The E2E then only needs to confirm the wiring (scroll → a link gains `aria-current`), which Playwright's auto-waiting makes deterministic.

### C-002: The "search dialog open blocks nav" guard is proven at unit level only
- **Where:** `test-plan.md` `test_reader_keys_guarded` vs. `test_reader_keyboard_next_chapter`.
- **Quote:** "or while the search dialog is open, THEN the island SHALL NOT navigate".
- **Failure mode:** integration-drift
- **Why it matters:** the component test asserts the mechanism (an open `[role="dialog"]` in the DOM suppresses nav), but not the real integration with `SearchOverlay`.
- **Suggested response:** defer-with-rationale — the E2E already proves the *input-focus* guard (a key typed in the focused search field does not navigate), which is the same real path a reader hits; the dialog-presence guard is unit-verified against the exact `[role="dialog"]` signal `SearchOverlay` emits. A dedicated E2E opening search then pressing an arrow is redundant with these two and adds overlay-timing flake.

### C-003: T-026 and T-027 both edit `BookLayout.astro` + `[...slug].astro`
- **Where:** `build-plan.md` T-026 Touches ∩ T-027 Touches.
- **Quote:** "`src/layouts/BookLayout.astro` … `src/pages/[...slug].astro`" in both.
- **Failure mode:** hidden-dep
- **Why it matters:** two tasks touching the same wiring files can conflict.
- **Suggested response:** reject — T-027 **depends on** T-026 (declared) and they add *disjoint* things to those files (T-026: the rail column + `headings` prop; T-027: the `ReaderKeys` mount + `prev/next` URLs). Sequential execution with a clear dependency is the correct decomposition, not a hidden dependency.

## Confidence
proceed-with-caveats
