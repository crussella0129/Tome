# Sprint 15 — End-to-End Test Results

- **Tested head:** `cd869bf9863d4b6fc1e03151558638de832f338d`
- **Status:** possible
- **Intents:** [INT-0013](../../intents/INT-0013-resilient-scaling-zoom.md), [INT-0014](../../intents/INT-0014-discoverable-library.md)

## Browser suite — `npm run test:e2e` (21 passed / 21)

Runs against the built 2-tome default (webServer). Includes the prior reader/search
specs (migrated to the `/tome` namespace) plus the new sweep and library specs.

| Test | Assertion (SHALL) | Criterion | Result |
|------|-------------------|-----------|--------|
| `test_scaling_no_overflow` | widths 480→2560 on Bibliotheca + reader: `scrollWidth ≤ innerWidth` | INT-0013 #2 | pass |
| `test_scaling_dialog_in_viewport` | search open at every width: dialog rect within the viewport; no doc overflow | INT-0013 #2 | pass |
| `test_scaling_layout_mode` | stacked < 769px; two-col ≥ 769px; three-col + rail ≥ 1024px | INT-0013 #3 | pass |
| `test_reader_bibliotheca_default` | default `/` lists both tomes as links | INT-0014 #1 | pass |
| `test_reader_cross_tome_nav` | switcher opens the sibling tome; Bibliotheca link → `/` (no JS) | INT-0014 #2 | pass |
| `test_search_across_tomes` | query "reading" returns hits tagged both "Tome" and "Marginalia" | INT-0014 #4 | pass |
| `test_search_shortcut_opens_and_navigates` | `/` opens overlay; a result deep-links to `/tome/components/panels` | INT-0008 (regression) | pass |
| reader content specs (12) | code/prose/image/theme/rail/keyboard/admonition/footnote/print at `/tome/*` | regression | pass |

## Electron suite — `npm run check:electron` (6 passed / 6)

| Test | Assertion (SHALL) | Criterion | Result |
|------|-------------------|-----------|--------|
| `test_electron_zoom_locked` | opens at `getZoomFactor()` 1; an accidental `zoom-changed` snaps back to 1 | INT-0013 #1, #4 | pass |
| `test_electron_reader_offline` | `app://tome/` → Bibliotheca (both tomes) → into a tome → chapter + sidebar, offline | INT-0014 #1 | pass |
| `test_electron_search_index` | `/search-index.json` fetchable in-app | (regression) | pass |
| `test_electron_secure_config` | contextIsolation/no-node/sandbox; no renderer Node primitives | (regression) | pass |
| `test_electron_icon_follows_theme` | icon swaps dark↔light on OS theme | (regression) | pass |
| `test_electron_external_link` | external http(s) → `openExternal`; other schemes denied | (regression) | pass |

## Determinism (flake screen)
- The scaling sweep uses `page.setViewportSize` (deterministic) and 1px sub-pixel
  slack; layout mode is read from bounding boxes + computed `display`.
- `test_electron_zoom_locked` fires the actual `zoom-changed` event a gesture emits
  (no reliance on driving a real wheel/pinch), then asserts the snap-back.
- Cross-tome search uses a term ("reading") verified present in both tomes' index records.

## Criterion → test coverage
- **INT-0013:** #1 → `test_electron_zoom_locked`; #2 → `test_scaling_no_overflow` + `test_scaling_dialog_in_viewport`; #3 → `test_scaling_layout_mode`; #4 → the sweep (browser) + `test_electron_zoom_locked` (shell).
- **INT-0014:** #1 → `test_reader_bibliotheca_default` + electron `test_electron_reader_offline`; #2 → `test_reader_cross_tome_nav` + `check:external` (single-tome); #3 → `searchScopeCopy` unit tests; #4 → `test_search_across_tomes`.
