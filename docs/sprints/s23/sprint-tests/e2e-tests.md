# Sprint 23 End-to-End Verification

- **Tested head:** `277e597`. `npx playwright test` (Chromium, sample build):
  **39 passed**.

| Test | Covers | Result |
|---|---|---|
| `test_sanguine_sidebar_void` | 1440×900: void `rgb(0, 0, 0)`, sticky, no right border; link `rgb(236, 86, 88)`; part title `rgb(188, 105, 87)`; current `rgb(255, 116, 102)` with `rgb(213, 2, 16)` channel; briar SVG `::after` 24px, `pointer-events: none`; header/footer borders 0 with fading gradient hairlines; separator gradient; dialog ink bone `rgb(203, 181, 171)`; at 600px a hairline instead of the briar | pass |
| `test_sanguine_code_chips_salmon` | transparent fill, `#ff9a8a`→`#ec5658` gradient, text clip; print → black, no image | pass |
| `test_sanguine_inscription_size_and_ink` (updated) | inscription ink and size unchanged; search trigger keeps weathered bone; table cells bone | pass |
| existing theme, reader, search, scaling suites | Light/Dark, dialog background, touch targets, wash, persistence unchanged | pass |

## Human verification

`evidence/sidebar-void-desktop.png` and `evidence/sidebar-void-ipad.png` show
the built sidebar beside the approved mock's design: black void, salmon
lettering, crimson channel, pixel briar, refined hairlines, salmon chips.
Surfaced for the user's sign-off.
