Finalized - DO NOT EDIT

# Sprint 15 Test Plan

## Intent Traceability
| Intent | Acceptance criterion | Build task / EARS clause | Verification |
|--------|----------------------|--------------------------|--------------|
| [INT-0013](../../../intents/INT-0013-resilient-scaling-zoom.md) | 1 — shell opens at 100%; accidental zoom can't collapse the layout; Ctrl+0 resets | T-034 / WHEN load … THEN zoom=1 + `setVisualZoomLevelLimits(1,1)`; WHEN accidental `zoom-changed` … THEN reset to 1 | `test_electron_zoom_locked` |
| [INT-0013](../../../intents/INT-0013-resilient-scaling-zoom.md) | 2 — no horizontal overflow; search dialog never clipped, across the width matrix | T-035 / WHEN sweep widths over reader/Bibliotheca/search … THEN `scrollWidth ≤ innerWidth` + dialog within viewport | `test_scaling_no_overflow`, `test_scaling_dialog_in_viewport` |
| [INT-0013](../../../intents/INT-0013-resilient-scaling-zoom.md) | 3 — correct layout mode per breakpoint | T-035 / WHEN width crosses each breakpoint … THEN 1/2/3-col as intended | `test_scaling_layout_mode` |
| [INT-0013](../../../intents/INT-0013-resilient-scaling-zoom.md) | 4 — sweep runs in browser + shell | T-035 (browser) + T-034 (shell) | `test_scaling_*` + `test_electron_zoom_locked` |
| [INT-0014](../../../intents/INT-0014-discoverable-library.md) | 1 — default build is a 2-tome Bibliotheca (index + switcher, no config) | T-036 / WHEN default build … THEN `/` Bibliotheca + namespaced chapters + switcher | `test_reader_bibliotheca_default` + electron `test_electron_reader_offline` + build check |
| [INT-0014](../../../intents/INT-0014-discoverable-library.md) | 2 — cross-tome navigation (no JS); single-tome unchanged | T-036 / WHEN follow Bibliotheca/switcher links … THEN reach any tome; WHEN single tome … THEN root routes | `test_reader_cross_tome_nav`, existing `check:external` gate (single-tome root routes) |
| [INT-0014](../../../intents/INT-0014-discoverable-library.md) | 3 — honest search copy | T-037 / WHEN N tomes … THEN library-wide for N>1, not implying many for N=1 | `test_search_copy_library_wide`, `test_search_copy_single_tome` |
| [INT-0014](../../../intents/INT-0014-discoverable-library.md) | 4 — multi-tome + single-tome covered; library-wide search | T-036 / WHEN search … THEN hits across both tomes | `test_search_across_tomes` (+ single-tome path) |

## Unit Tests
### T-037 — search copy helper (if extracted)
- **Intent:** [INT-0014](../../../intents/INT-0014-discoverable-library.md)
- If the copy choice is factored into a pure helper (e.g. `searchScopeLabel(tomeCount)`), unit-test it: `1 → "this tome"`-style, `>1 → library-wide`. Otherwise the copy is asserted by the E2E below (no pure logic to unit-test).

## Integration Tests
### Build-shape gates (existing, must stay green against the new default)
- **Intents:** [INT-0013](../../../intents/INT-0013-resilient-scaling-zoom.md), [INT-0014](../../../intents/INT-0014-discoverable-library.md)
- `check:search` builds the **default** and validates the search index/query — must pass with the 2-tome default (adjust the gate if it hard-codes single-tome content).
- `check:livereload` runs the dev watcher on the default — verify it still serves/edits with 2 tomes.
- `check:multibook` / `check:external` build their own fixtures (isolated) — expected unaffected.

## End-to-End Tests
- **Status:** possible
- `test_electron_zoom_locked` (Electron): after a simulated accidental wheel/pinch zoom, `webContents.getZoomFactor()` stays 1 and the layout stays desktop (side-by-side); opens at 100% (criterion INT-0013 #1, #4).
- `test_scaling_no_overflow` (browser): for each width in the matrix, on reader/Bibliotheca/search-open, `document.documentElement.scrollWidth ≤ innerWidth` (INT-0013 #2).
- `test_scaling_dialog_in_viewport` (browser): with search open, the dialog's rect is within `[0, innerWidth] × [0, innerHeight]` at every width (INT-0013 #2).
- `test_scaling_layout_mode` (browser): sidebar/content are stacked < 769px, side-by-side ≥ 769px, and the rail column is present ≥ 1024px (INT-0013 #3).
- `test_reader_bibliotheca_default` (browser): default build → `/` shows the Bibliotheca listing both tomes as links (INT-0014 #1).
- `test_reader_cross_tome_nav` (browser): from a chapter, the switcher opens the sibling tome and the Bibliotheca link reaches `/`; links work with JS disabled where asserted (INT-0014 #2).
- single-tome root routing (INT-0014 #2): covered by the **existing `check:external` gate** (builds one external tome; asserts root routes + no Bibliotheca) — no new spec; confirm it still passes.
- `test_search_across_tomes` (browser): a query matching both tomes returns hits tagged by their respective tome (INT-0014 #4).
- `test_search_copy_library_wide` / `test_search_copy_single_tome` (browser): trigger/hint copy is library-wide with 2 tomes and non-misleading with 1 (INT-0014 #3).
- `test_electron_reader_offline` (Electron, migrated): `app://tome/` → Bibliotheca (both tomes) → into a tome → chapter + sidebar, all offline (INT-0014 #1).
- Runners: browser specs via `npm run test:e2e` (default config, `scaling.spec` added to `testMatch`); Electron specs via `npm run check:electron` (dedicated config).
