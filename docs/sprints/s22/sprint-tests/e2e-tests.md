# Sprint 22 End-to-End Verification

- **Tested head:** `b222c56`. `npx playwright test` (Chromium, default build of
  the committed sample with the empty manifest pinned): **37 passed** (14.4 s).

## INT-0022 — `e2e/theme.spec.ts`

| Test | Covers | Result |
|---|---|---|
| `test_theme_selector_reader_and_bibliotheca` | selector on reader and `/`; dialog background = active `--theme-window-background` (paper, dark); Escape returns focus | pass |
| `test_riddle_refused_and_silence_keep_theme` | in-world refusal, Skyrim nod, theme unchanged | pass |
| `test_theme_controls_touch_targets` | 820×1180: every option and dialog control ≥ 44×44 | pass |
| `test_sanguine_surface_and_channels` | bg `rgb(10, 7, 8)`, interface ink bone, texture at z −1 / opacity 0.3, h1 clipped gradient; **real screenshot pixels** of the obsidian brighter than the bare page but ≤ the sheen luminance | pass |
| `test_sanguine_inscription_size_and_ink` | prose `rgb(213, 2, 16)` at ≥ 24px; inline code and table cells bone; current chapter `rgb(255, 48, 48)` | pass |
| `test_sanguine_sealed_drafts` | "(draft)" → "(sealed)" | pass |
| `test_sanguine_reduced_motion_static` | no running animations (reader, `/`) | pass |
| `test_sanguine_print_ink_on_white` | white body, texture hidden, solid black headings | pass |
| `test_sanguine_wash_and_persistence` | one wash → Sanguine → wash gone ≤ 3 s; reload, `/`, `/tome/about` report Sanguine at `DOMContentLoaded`; theme-color `#0a0708` | pass |
| `test_sanguine_reduced_motion_no_wash` | zero washes mounted | pass |
| `test_sanguine_exit_direct` | Dark applies at once, no dialog, no wash, theme-color `#16130e` | pass |

`e2e/reader.spec.ts` drives the selector for `test_dark_theme_active` and
`test_reduced_motion_honored`; `test_paper_theme_active` is unchanged. All pass.

## INT-0023 — `e2e/reader.spec.ts`

- `test_tutorial_chapters_reachable_and_searchable`: "Your Library" part and
  the three chapter links in the sidebar; `/tome/find-your-books` renders; all
  three chapters are in `/search-index.json`, which contains `books:find`. Pass.

## Human verification (INT-0022 AC5 — experiential)

Screenshots in `evidence/`: `sanguine-bibliotheca-desktop.png`,
`sanguine-bibliotheca-ipad.png`, `sanguine-chapter-desktop.png`,
`sanguine-campaign-ipad.png`, `riddle-dialog-ipad.png` (drawn in the light
theme), `transformation-mid-wash.png`.

The user steered the look twice from earlier renders during Build: the 8-bit
vine replaced the dripping banner, and direction A was chosen for the colour.
Their sign-off on the final renders is requested before INT-0022 is marked
realized.
