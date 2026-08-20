Finalized - DO NOT EDIT

# Sprint 20 Test Plan

## Intent Traceability

| Intent | Acceptance criterion | Build task / EARS clause | Verification |
|--------|----------------------|--------------------------|--------------|
| [INT-0019](../../../intents/INT-0019-centered-reader-search-geometry.md) | AC1: measure-bounded stack, including reader search, centered in real main track | T-050 / wide headed + unheaded centers, widths, containment, and right alignment | `test_scaling_reader_column_centered` |
| [INT-0019](../../../intents/INT-0019-centered-reader-search-geometry.md) | AC1: mobile navigation does not displace/overflow stack | T-050 / hydrated nav open + close at 600px | `test_scaling_reader_column_stable_with_mobile_nav` |
| [INT-0019](../../../intents/INT-0019-centered-reader-search-geometry.md) | AC2: shared trigger fills available host up to 26rem | T-051 / root=trigger=min(resolved 26rem, host content box) on both hosts at 480, 768/769, 1023/1024, 1040 | `test_scaling_search_trigger_usable_across_hosts` |
| [INT-0019](../../../intents/INT-0019-centered-reader-search-geometry.md) | AC3: usable input and 32px close without overlap/overflow | T-051 / both hosts at 320×360 and 480×360 | `test_scaling_search_dialog_controls_do_not_compress` |
| [INT-0019](../../../intents/INT-0019-centered-reader-search-geometry.md) | AC3: decorative UI yields first at 320px | T-051 / icon has no rendered box; field gap and inline padding ≤8px | `test_scaling_search_dialog_controls_do_not_compress` |
| [INT-0019](../../../intents/INT-0019-centered-reader-search-geometry.md) | AC4: geometry matrix, breakpoint edges, both hosts | T-050 + T-051 / all EARS clauses | four named scaling tests plus existing scaling regression tests |

INT-0020 is intentionally not in the execution trace: T-052 is backlog and no
native-library acceptance criterion is claimed by Sprint 20.

## Unit Tests

### T-050 unit tests

- **Intent:** [INT-0019](../../../intents/INT-0019-centered-reader-search-geometry.md)
- None added: centering is generated CSS/layout composition with no isolated
  function or state transition. Browser geometry is the direct observable proof.

### T-051 unit tests

- **Intent:** [INT-0019](../../../intents/INT-0019-centered-reader-search-geometry.md)
- Existing `SearchOverlay` component tests remain green for open/close, keyboard,
  and result behavior. Width, overlap, and responsive media-query behavior require
  a real layout engine and are verified in Playwright.

## Integration Tests

### Reader composition integration

- **Intent:** [INT-0019](../../../intents/INT-0019-centered-reader-search-geometry.md)
- `npm run check`: Astro parses the new wrapper and type-checks the shared search
  component integration with zero errors, warnings, or hints.
- `npm test`: all existing component/library tests pass, proving the structural/CSS
  work does not alter search behavior, content loading, or rendering utilities.
- `test_scaling_reader_column_centered`: visit `/tome/getting-started` (headed,
  rail-capable) and `/tome/about` (unheaded), then assert reading-column/prose/pager
  widths and center deltas at 1280/1920/2560. Also prove the searchbar/trigger
  rectangles are contained by the reading column and the trigger's right edge is
  aligned with the column. Resolve the column's computed `max-width` in pixels;
  do not treat the raw `72ch` token as pixels.
- `test_scaling_reader_column_stable_with_mobile_nav`: at 600px, wait for
  `body.js-nav`, capture the centered column, toggle the named TOC button open and
  closed, assert `aria-expanded` after each action, and assert center stability plus
  no horizontal overflow. Set the viewport before navigation because the sidebar
  samples its media query during hydration.

### Shared search integration

- **Intent:** [INT-0019](../../../intents/INT-0019-centered-reader-search-geometry.md)
- `test_scaling_search_trigger_usable_across_hosts`: on `/` and
  `/tome/getting-started`, derive the CSS-module root as the trigger's parent and
  locate its real host with `root.closest('.searchbar, .masthead-search')` across
  Astro's `display: contents` island wrapper; assert root≈trigger≈`min(resolved
  root max-width, host content-box width)`, one-line label, and no overflow at
  every specified breakpoint edge. A fixed 320px control must fail wherever the
  host offers more.
- `test_scaling_search_dialog_controls_do_not_compress`: on both hosts at 320×360
  and 480×360, open search after its hydration marker, measure input/close/icon and
  dialog rectangles, and assert the exact EARS thresholds and non-overlap. Derive
  the field from the combobox parent and the icon from its preceding
  `span[aria-hidden="true"]`; at 320 assert the icon has no rendered box and computed
  field gap/inline padding are each ≤8px, while at 480 include the visible icon in
  the non-overlap assertions. Set each viewport before navigation.

## End-to-End Tests

- **Status:** possible
- `test_scaling_reader_column_centered` — passes only when headed and unheaded
  reader pages center the whole reading stack in the real content track at all
  three wide sizes.
- `test_scaling_reader_column_stable_with_mobile_nav` — passes only when the live
  Solid navigation island opens/closes without changing horizontal reader geometry.
- `test_scaling_search_trigger_usable_across_hosts` — passes only when the real
  Bibliotheca and reader hosts both provide a non-shrink-wrapped, overflow-safe
  trigger through the breakpoint edges.
- `test_scaling_search_dialog_controls_do_not_compress` — passes only when the live
  search island preserves the input/close geometry on both pages at both narrow
  viewport sizes.
- Existing `test_scaling_no_overflow`, `test_scaling_dialog_in_viewport`, and
  `test_scaling_layout_mode` stay green and their width matrix gains exact 769px and
  1024px boundaries (plus adjacent widths) so prior INT-0013 behavior remains
  guarded. `test_scaling_layout_mode` itself shall assert 768/769 and 1023/1024,
  rather than relying on those values appearing only in an unrelated sweep.
- Full `npm run test:e2e` remains the final browser regression gate after the
  targeted scaling file passes.

The E2E gates run against the committed two-tome fixture. The user's external Bible
configuration/content remains outside the active tree until the sprint PR is
published, so `/tome/getting-started`, `/tome/about`, and `/` retain their planned
semantics.
