# Sidebar and chip contrast (Sprint 23)

WCAG 2.x contrast, computed with the same luminance maths as `src/styles/theme.ts`.

| Ground | Hex | How it arises |
|---|---|---|
| void | `#000000` | sidebar ground |
| sunken | `#0c0505` | switcher panel, picker group, hover |
| current | `#2f0004` | crimson `#d50210` at 22% over the void |
| selected picker | `#380407` | crimson at 22% over sunken |

| Role | Hex | void | sunken | current | selected | hover |
|---|---|---|---|---|---|---|
| text (salmon) | `#ec5658` | 6.04 | 5.81 | 5.38 | 5.08 | 5.81 |
| subdued (old blood) | `#bc6957` | 5.30 | 5.10 | 4.72* | 4.46* | 5.10 |
| accent / link | `#ff7466` | 7.94 | 7.64 | 7.07 | 6.68 | 7.64 |

\* Subdued text never renders on the current-row tint or the selected picker
segment. Those surfaces carry the accent.

Non-text: the crimson current-chapter channel `#d50210` on the void is 3.85:1
(≥ 3:1 required).

Chips on `#170e0f`: gradient top `#ff9a8a` 9.26:1, bottom `#ec5658` 5.46:1.
