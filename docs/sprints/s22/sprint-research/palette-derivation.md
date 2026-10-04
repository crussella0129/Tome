# Sanguine Atonement palette derivation

Method: candidate colours converted to OKLCH (Björn Ottosson's matrices) and
scored with the WCAG 2.x relative-luminance contrast ratio already implemented
in `src/styles/theme.ts`. Each role was found by sweeping OKLCH lightness at a
fixed hue/chroma until the ratio held on **all three** Sanguine surfaces:

| Surface | Hex | Role |
|---|---|---|
| ground | `#0a0708` | obsidian page (near-black, faint red-violet cast) |
| panel | `#110b0c` | sidebar / plates (lifted glass) |
| modal | `#170e0f` | inputs, dialogs, sunken panels (worst case) |

## The question asked: `#FF0000` or `#BA1A1A`?

| Colour | OKLCH (L C H) | ground | panel | modal | Reading |
|---|---|---|---|---|---|
| `#FF0000` | 0.628 0.258 29.2° | 5.02 | 4.88 | 4.75 | sRGB primary: max chroma, scarlet (oxygenated), the universal "error" red |
| `#BA1A1A` | 0.506 0.193 27.7° | 3.11 | 3.02 | 2.94 | same hue family, far darker: reads venous/pooled — fails body-text AA (4.5) |

The two colours differ mainly in lightness, not hue (29° vs 28°), which is
exactly what physiology predicts: deoxygenated blood is *darker* red, not bluer.
Neither works as the single text colour, so the palette assigns roles along
blood's oxidation path.

## Role palette (derived)

| Role | Hex | OKLCH | ground | panel | modal | Use |
|---|---|---|---|---|---|---|
| arterial accent | `#ff2b2b` | 0.643 0.242 27.5° | 5.38 | 5.23 | 5.09 | focus ring, current chapter, active control |
| ichor text | ≈`#e64b4d` | ≈0.63 0.19 24° | ≥5.0 | ≥5.0 | ≥5.0 | body text (crimson hue = "less oxygenated" than scarlet) |
| link vein | ≈`#e6757f` | 0.695 0.140 15.9° | 6.89 | 6.70 | 6.52 | links (lighter, pinker, underlined) |
| old blood | ≈`#b86554` | 0.598 0.111 32.6° | 4.80 | 4.67 | 4.55 | subdued meta text (methemoglobin-brown hue) |
| pooled venous | `#BA1A1A` | 0.506 0.193 27.7° | 3.11 | 3.02 | 2.94 | bottom stop of large blood-channel letters (≥3:1 large text on ground) |
| clotted | `#5a1a1c` | 0.322 0.094 22.4° | 1.53 | 1.48 | 1.45 | rules and borders (decorative) |
| bone | ≈`#d9c1b8` | 0.829 0.030 41.7° | 11.72 | 11.39 | 11.09 | selected-text ink over a blood selection |

Sweep outputs (lowest lightness meeting the target on all surfaces):

```
text ichor C.20 (>=5.0)              #eb484b oklch(0.635 0.200 23.9) ground=5.31 panel=5.16 modal=5.03
text ichor C.18 (>=5.0)              #e25251 oklch(0.632 0.180 24.2) ground=5.31 panel=5.16 modal=5.03
subdued old-blood H33 C.11 (>=4.5)   #b86554 oklch(0.598 0.111 32.6) ground=4.80 panel=4.67 modal=4.55
link vein H16 C.14 (>=6.5)           #e6757f oklch(0.695 0.140 15.9) ground=6.89 panel=6.70 modal=6.52
bone H40 C.03 (>=11)                 #d9c1b8 oklch(0.829 0.030 41.7) ground=11.72 panel=11.39 modal=11.09
```

Final hex values are fixed in Build and guarded by unit tests per role and
surface; anything at or above these floors is acceptable.

## Why not pure `#000000`

The user allowed "#000000 … or something close to it". Near-black wins on
three counts: obsidian is glass with vitreous sheen, so the procedural surface
needs luminance headroom for highlights; OLED tablets smear true black during
scroll; and a faint warm cast reads as stone rather than an empty screen.
