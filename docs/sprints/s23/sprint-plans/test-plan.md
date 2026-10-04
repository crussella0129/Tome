Finalized - DO NOT EDIT

# Sprint 23 Test Plan

## Intent Traceability
| Intent | Acceptance criterion | Build task / EARS clause | Verification |
|--------|----------------------|--------------------------|--------------|
| [INT-0025](../../../intents/INT-0025-sanguine-sidebar-void.md) | AC1 void ground, salmon lettering, crimson channel, contrast | T-062 / computed sidebar colours; role contrast on every ground | `test_sanguine_sidebar_void` (E2E), `test_sanguine_sidebar_contrast` (unit), drift guard |
| [INT-0025](../../../intents/INT-0025-sanguine-sidebar-void.md) | AC2 briar on the column edge, hidden when stacked | T-062 / `::after` briar at ≥ 48.0625rem, none below | `test_sanguine_sidebar_void` (1440 and 600 widths) |
| [INT-0025](../../../intents/INT-0025-sanguine-sidebar-void.md) | AC3 refined hairlines replace plain dividers | T-062 / gradient hairlines, borders removed | `test_sanguine_sidebar_void` |
| [INT-0025](../../../intents/INT-0025-sanguine-sidebar-void.md) | AC4 salmon chips, ≥ 4.5:1, robust, print black | T-062 / chip gradient + print | `test_sanguine_code_chips_salmon` (E2E), `test_sanguine_chip_contrast` (unit) |
| [INT-0025](../../../intents/INT-0025-sanguine-sidebar-void.md) | AC5 dialog, inscription, Bibliotheca, Light/Dark unchanged | T-062 / dialog bone; other computed styles unchanged | `test_sanguine_sidebar_void` (dialog ink), existing `test_sanguine_inscription_size_and_ink` (updated), `test_paper_theme_active`, `test_dark_theme_active`, `test_theme_selector_reader_and_bibliotheca` |

## Unit Tests
### T-062 unit tests
- **Intent:** [INT-0025](../../../intents/INT-0025-sanguine-sidebar-void.md)
- `test_sanguine_sidebar_contrast`: text/subdued/accent ≥ 4.5 on each ground they render on; crimson channel ≥ 3 on the void
- `test_sanguine_chip_contrast`: both gradient stops ≥ 4.5 on the chip ground
- drift guard: `SANGUINE_SIDEBAR` values appear in `TocSidebar.module.css` / `sanguine.css`

## Integration Tests
### Sidebar styling in the built site
- **Intents:** [INT-0025](../../../intents/INT-0025-sanguine-sidebar-void.md)
- Covered by the E2E below against the production build; no separate integration layer.

## End-to-End Tests
- **Status:** possible
- `test_sanguine_sidebar_void`: at 1440×900 in Sanguine — sidebar `rgb(0, 0, 0)`; chapter link `rgb(236, 86, 88)`; part title `rgb(188, 105, 87)`; current chapter `rgb(255, 116, 102)` with left border `rgb(213, 2, 16)`; `::after` background SVG, 24px wide, no right border; header/switcher/footer pseudo hairlines with `linear-gradient`, borders `0px`; separator background gradient; at 600px the briar `display: none`; the riddle dialog's computed ink is bone `rgb(203, 181, 171)`
- `test_sanguine_code_chips_salmon`: inline code fill `rgba(0, 0, 0, 0)` with a gradient background image clipped to text; under print emulation the fill is `rgb(0, 0, 0)`
- Human verification: screenshots at 1440×900 and 820×1180 surfaced for the user's sign-off against the approved mock.
