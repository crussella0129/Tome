# INT-0022 — Sanguine Atonement hidden theme

<!-- sprint-loop-intent-v2 -->
- **Intent ID:** INT-0022
- **State:** active
- **Work evidence:** [Sprint 22 build plan](../sprints/s22/sprint-plans/build-plan.md)
- **Completion evidence:** none
- **Code evidence:** none
- **Test evidence:** none
- **Documentation evidence:** none

## Intent

Add a third, hidden reading theme, **Sanguine Atonement**: blood-red letters
carved into procedurally textured obsidian. It is built for reading one
campaign's "obsidian tablets, embossed with letters that acted as channels for
sacred blood" on a tablet at a dimly lit table. A viewer should feel "oh dear"
before reading a word, and the effect must come from deliberate craft, not
from the flat pure-red-on-pure-black look of a spreadsheet cell.

The theme is unlocked through a small rite. The theme selector offers
**Light · Dark · Other**. **Other** opens a small dialog, drawn in the
*current* theme, that asks "What is the color of Night?" This is the Dark
Brotherhood door riddle from *The Elder Scrolls IV: Oblivion*. A tolerant
answer of "Sanguine" or "Sanguine, my Brother" (and reasonable variations)
transforms the reader into Sanguine Atonement. Any other answer leaves the
theme unchanged.

The theme keeps every Tome behavior: navigation, search, keyboard and touch
use, the reduced-motion preference, print, and offline desktop shells. It is
a theme, not a separate app. Non-goals: sound, analytics, changing
non-Sanguine themes' look, or making the riddle a security boundary (it is a
flourish; anyone can read the source).

## Acceptance criteria

1. The theme control is a labelled three-option selector (Light, Dark,
   Other) available in the reader sidebar and on the Bibliotheca. Light and
   Dark switch directly. Other opens a modal dialog styled by the active
   theme's tokens, with the question "What is the color of Night?", a text
   field, an answer action, and a way to leave. The dialog is reachable and
   operable by keyboard and touch, and focus returns to the selector on close.
2. Answers are matched case-, punctuation-, whitespace-, and diacritic-
   insensitively. "Sanguine", "Sanguine, my Brother", "sanguine my brother",
   "Sanguine, my Sister", and a one-letter typo of "sanguine" are accepted.
   Unrelated answers are refused with in-world feedback and no theme change.
   Skyrim's "Silence, my brother" receives its own acknowledgement and is not
   accepted.
3. A correct answer plays a short blood-wash transformation and then applies
   and persists Sanguine Atonement across reloads and pages, with no flash
   of another theme on load. Under `prefers-reduced-motion: reduce` the theme
   applies without the animated wash. Light or Dark leave Sanguine directly.
4. In Sanguine Atonement, chapter text is an inscription in anatomically
   hue-true blood (no added green/blue lift), set at ≥ 24px so WCAG AA's
   large-text threshold (3:1) applies; it meets ≥ 3.3:1 against every ground it
   renders on (page, panel, input, and the brightest sheen the texture can
   produce). Interface text (navigation, search, selector, metadata) meets
   WCAG AA (≥ 4.5:1) on the same grounds. Large display letters meet ≥ 3:1.
   The obsidian texture and effects sit behind content and never reduce those
   ratios.
5. The theme reads as obsidian and blood, not flat red on black. It includes
   a procedural (asset-free) obsidian surface, letters rendered as blood-filled
   channels, and a set of restrained Halloween/necromantic flourishes: sealed
   draft chapters, sigil dividers, inscription callouts, dripping masthead,
   candle-dim vignette. All animation stops under reduced motion and none
   appears in print.
6. On a tablet-sized touch viewport, every theme control and dialog action has
   a touch target of at least 44×44 CSS px, the answer field does not
   auto-capitalize or auto-correct, and the browser chrome colour follows the
   active theme.

## Rationale

The campaign's tablets are a physical prop translated to a screen. The user's
earlier spreadsheet (pure `#FF0000` script numerals on a `#000000` cell) read
as cheap. Research for this intent found why. `#FF0000` is the sRGB red
primary (OKLCH ≈ 0.63 / 0.26 / 29°): maximal chroma, scarlet-leaning, and the
universal UI "error" red. The darker `#BA1A1A` has nearly the same hue
(≈ 28°) but much lower lightness, so it reads as deoxygenated, pooled blood.
It reaches only ≈ 3.1:1 on near-black, though, which fails body-text
legibility. Neither colour alone solves the problem. A role-based palette that
follows blood's real oxidation path (arterial scarlet → crimson →
pooled/venous → methemoglobin brown) keeps every reading surface legible and
gives the darker, "less oxygenated" red the large-letter and depth roles it
suits. A 2024 study using an iPad found red-on-black text produced the
smallest accommodative lag of the colours tested, which supports red as a
dark-mode reading colour at the table.

Colour is bounded by physics. On near-black, a hue-true blood red bright
enough for 16px text at 4.5:1 is essentially `#FF0000` (`#FE0214`). Any
"darker, anatomical" red therefore needs larger letters. The first build lifted
the ink with green and blue to `#EC5658` to keep 16px text at 5:1. The user saw
that as salmon/pink and chose (2026-10-04, from a rendered comparison) the
inscription direction: chapter text in arterial crimson `#D50210` at 24px,
where AA's large-text threshold applies, with small interface text in bone. That
also suits the fiction of letters carved into tablets.

The riddle is a shared cultural reference: the Dark Brotherhood's Black Door in
*Oblivion*. Hiding the theme behind it turns theme selection into part of
the session.

## Alternatives

- **Pure `#FF0000` on `#000000`.** Rejected: legible but reads as an alarm
  or error state. Pure black also gives a procedural surface no headroom, and
  OLED panels smear true black during scroll.
- **`#BA1A1A` for all text.** Rejected for body copy (≈ 3.1:1, below AA);
  adopted for large display letters and channel depth, where ≥ 3:1 holds.
- **Lifted ichor `#EC5658` at 16px** (built first). Rejected by the user:
  the green/blue lift needed for 5:1 at small sizes reads as salmon/pink rather
  than blood.
- **Hue-true `#FE0214` at 16px everywhere.** Rejected: passes 4.5:1 but is
  indistinguishable from the `#FF0000` look the theme set out to avoid.
- **A visible fourth theme in the cycle.** Rejected: the user asked for the
  riddle, and an always-visible novelty theme dilutes the two reading themes.
- **Image textures or a downloaded display font.** Rejected: Tome's texture
  layer is asset-free (CSP- and offline-safe), and font binaries of unclear
  licence must not enter the repository.
- **The View Transitions API for the wash.** Deferred to progressive
  enhancement at most; a transform-only overlay animates consistently on iPad
  Safari and is straightforward to disable under reduced motion.

## Consequences

- `THEMES` gains a hidden member. The pre-paint theme script and the
  selector derive their valid theme lists from one source instead of
  duplicating class names.
- Sanguine-specific CSS is scoped under its body class, so the existing
  themes' computed styles and tests are unchanged.
- The riddle answer is client-side and discoverable; the theme is a flourish,
  not access control.
- Theme-scoped labels (for example "sealed" in place of "draft") are CSS-only
  presentation and do not change the parsed book model.

## Transition history

- 2026-10-04: created as `proposed` during Sprint 22 research from the user's
  Sanguine Atonement request.
- 2026-10-04: `proposed → planned` — the user approved the Sprint 22 plan
  (T-055 selector + riddle, T-056 visual system, T-057 transformation).
- 2026-10-04: `planned → active` — Sprint 22 Build began with T-055 (selector,
  riddle matcher, hidden theme entry).
- 2026-10-04: AC4 revised, state unchanged (`active`). After T-056 landed, the
  user judged the lifted `#EC5658` ink salmon and asked for anatomically
  correct colour. From a rendered comparison they chose crimson inscription
  text at ≥ 24px (large-text AA, ≥ 3.3:1 on every ground) with interface text in
  bone at ≥ 4.5:1. Delivered as mid-sprint task T-061.
