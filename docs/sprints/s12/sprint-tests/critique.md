# Test Critique — Sprint 12

## Concerns

### C-001: The delivered scroll-sync mechanism differs from the locked EARS/intent
- **Where:** `build-plan.md` T-026 clause 2 ("via an `IntersectionObserver`") vs. the
  implementation (a scroll listener); `INT-0010` criterion 2 (amended this phase).
- **Quote:** "mark the section currently in view … via an `IntersectionObserver`".
- **Failure mode:** intent-coverage / evidence-drift
- **Why it matters:** the locked plan named IntersectionObserver; shipping a different
  mechanism could hide an unmet promise.
- **Suggested response:** defer-with-rationale — the **outcome** (criterion 2:
  "scroll-synced active section") is fully met and proven (`test_active_heading_selection`
  + the scroll-sync E2E). The mechanism was changed for **correctness**, not to pass a
  failing test: browser measurement showed IO never fired on a jump-scroll to the end
  (all headings ended outside its trigger band), leaving the active section stale. The
  intent's criterion 2 wording + Consequences were corrected to describe the scroll
  listener, with a transition-history note — the Book now matches reality. Not a block:
  the acceptance outcome is unchanged and verified.

### C-002: The scroll-sync E2E asserts "active changed", not a specific active section
- **Where:** `e2e-tests.md` `test_reader_on_this_page_scrollspy`.
- **Quote:** "the first section is active at the top and stops being active once scrolled to the end".
- **Failure mode:** weak-assertion
- **Why it matters:** the E2E proves the active mark *moves* on scroll but not that a
  particular section is chosen.
- **Suggested response:** reject — the **exact** selection rule is unit-tested by
  `test_active_heading_selection` (all-below → first, N-passed → Nth, all-passed →
  last); the E2E's job is to prove the wiring (a real scroll re-runs the selection and
  updates `aria-current`), which it does deterministically (short viewport forces the
  short sample chapter to scroll). Splitting the exact-choice assertion into the E2E
  would duplicate the unit test against fragile fixture geometry.

## Confidence
proceed-with-caveats
