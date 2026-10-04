# INT-0025 — Sanguine sidebar: the void, the briar, and salmon highlights

<!-- sprint-loop-intent-v2 -->
- **Intent ID:** INT-0025
- **State:** realized
- **Work evidence:** [Sprint 23 build plan](../sprints/s23/sprint-plans/build-plan.md)
- **Completion evidence:** [T-062 completion](../work/completed-tasks.md#t-062-sprint-23)
- **Code evidence:** [sidebar void, briar, hairlines](../../src/components/TocSidebar.module.css), [salmon chips](../../src/styles/sanguine.css), [role contract](../../src/styles/theme.ts)
- **Test evidence:** [Sprint 23 test report](../sprints/s23/sprint-tests/test-report.md)
- **Documentation evidence:** [visual evidence](../sprints/s23/sprint-tests/evidence/sidebar-void-desktop.png)

## Intent

Refine Sanguine Atonement ([INT-0022](INT-0022-sanguine-atonement-theme.md),
realized) where the user found it plain. The reader's sidebar becomes a void of
pure black beside the obsidian page, lettered in the first version's salmon
scheme, with the new crimson used for its structure. A pixel briar runs down
the sidebar's edge, and its horizontal dividers become refined, glowing
hairlines. Inline code chips in chapter text become salmon highlights. The
crimson inscription, bone interface outside the sidebar, Bibliotheca, riddle,
and transformation are unchanged. Other themes are unaffected.

## Acceptance criteria

1. In Sanguine, the reader sidebar's ground is `#000000`. Its letters use the
   salmon scheme: links and the brand in `#EC5658`, part titles, draft labels,
   and captions in `#BC6957`, and the current chapter and active controls in
   `#FF7466` over a crimson tint. The current chapter carries a crimson
   `#D50210` channel on its left edge. Every text colour meets ≥ 4.5:1 on each
   ground it renders on (void, sunken panels, the current-row tint, hover, and
   the selected picker segment), and the crimson channel meets ≥ 3:1 as a
   non-text mark.
2. On viewports where the sidebar is a column, a pixel briar runs the full
   height of its right edge in place of the plain border: a wandering crimson
   stem with hooked, blood-tipped thorns on both sides, a leaf, and berries. It
   is decorative (`aria-hidden` via a pseudo-element), ignores pointer events,
   and is not shown where the sidebar stacks above the content on narrow
   screens.
3. The sidebar's horizontal dividers (below the header and the tome switcher,
   above the footer, and between SUMMARY parts) are refined hairlines: 1px
   crimson fading out at both ends, with a faint glow and a dark scored line
   beneath. No vine or drip ornament is used for them.
4. Inline code chips in chapter text show their text as a salmon gradient
   (`#FF9A8A` → `#EC5658`) on the chip's own ground, ≥ 4.5:1 throughout,
   rendered robustly where gradient text is supported. They print as black.
5. The riddle dialog, the Bibliotheca, the inscription, and the Light/Dark
   themes look and behave as before.

## Rationale

After Sprint 22 the user asked for the "first version" salmon in the places
that felt flat: the menu and the code highlights. Measured, salmon passes AA
comfortably at menu size on black (6.0:1), where the new crimson cannot
(3.85:1). So crimson moves to non-text structure, where 3:1 suffices. Across
three mock rounds the user kept the vertical pixel briar and rejected every
ornamented horizontal option (vines, drips, a blade, an iron rail) in favour of
"refined lines".

## Alternatives

- **Crimson menu text.** Rejected: 3.85:1 on black fails menu-size AA.
- **Hue-true `#EC0010` menu text.** Rejected: it passes at 4.57:1 but is the
  pure-red look the theme set out to avoid.
- **Vine, bleeding-line, blade, or rail dividers.** Mocked and rejected by the
  user; the briar is reserved for the vertical edge.
- **A text-clipped gradient over an inset-shadow fill for the chips.**
  Rejected after testing: an inset shadow paints over the text-clipped
  background, so the letters vanish (observed in WebKit 26.5 and Chromium).
  Multi-layer `background-clip: text, padding-box` rendered correctly in both
  and is used, behind an `@supports` guard with a solid salmon fallback.

## Consequences

- The sidebar overrides the Sanguine tokens locally, so the riddle dialog
  (portalled to `<body>`) and every surface outside the sidebar keep bone.
- Sprint 22's E2E expectations for bone sidebar links and bone chips are
  superseded by this intent's.

## Transition history

- 2026-10-04: created as `proposed` during Sprint 23 research from the user's
  sidebar and code-highlight feedback and three rounds of rendered mocks.
- 2026-10-04: `proposed → planned` — the user approved the Sprint 23 plan
  (T-062).
- 2026-10-04: `planned → active` — Sprint 23 Build began with T-062.
- 2026-10-04: Alternatives corrected (state unchanged): the planned inset-shadow
  chip technique hides the text in WebKit and Chromium; multi-layer clipping
  renders correctly in both and replaces it. No acceptance criterion changed.
- 2026-10-04: `active → realized` — T-062 delivers the void sidebar, salmon
  lettering, crimson channel, pixel briar, refined hairlines, and salmon code
  chips. All five criteria are proven (CI 37237910279 green at `277e597`), and
  the user signed off on the built look.
