# Sprint 23 Research Report

## Intents Reviewed
- [INT-0025](../../../intents/INT-0025-sanguine-sidebar-void.md) — created; relevance: the black sidebar, salmon lettering, briar edge, refined rules, and salmon code chips; current state: proposed.
- [INT-0022](../../../intents/INT-0022-sanguine-atonement-theme.md) — selected (compatibility boundary); relevance: the realized theme whose sidebar and chips this refines; the inscription, dialog, wash, and Bibliotheca must not change; current state: realized.

## 1. Sprint Goal
Make the Sanguine reader sidebar a pure-black void, lettered in the first
version's salmon with crimson structure. A pixel briar runs down its edge,
refined glowing hairlines replace its plain dividers, and inline code chips in
chapter text become salmon-gradient highlights. Every text pairing stays at or
above 4.5:1, and nothing outside the sidebar and the chips changes.

## 2. Existing Code Survey
| File | Relevance | Notes |
|------|-----------|-------|
| src/components/TocSidebar.module.css | high | Sidebar, header, switcher, separators, footer, `.current`; sticky column ≥ 48.0625rem, stacked block below |
| src/components/TocSidebar.tsx | medium | Markup: header, switcher, scroll list (separators are `li[role=separator]`), footer with ThemePicker |
| src/components/ThemePicker.module.css | medium | Picker inherits tokens; its dialog is portalled to `<body>`, so sidebar-scoped tokens do not reach it |
| src/styles/sanguine.css | high | Sanguine prose rules; chips currently forced to bone; print block |
| src/styles/prose.css | medium | Chip box: `font-size: 0.9em`, `background: var(--theme-background-modal)`, subdued border |
| src/styles/theme.ts | high | `SANGUINE_ROLES` contract; gains a sidebar + chip contract |
| src/styles/__tests__/contrast.test.ts | high | Role/surface contrast + drift guard |
| e2e/theme.spec.ts | high | Sprint 22 assertions on bone sidebar links and bone chips must move |

## 3. External Sources
None needed: the sources from Sprint 22's research (WCAG contrast, blood colour
physiology, the Oblivion reference) still apply. Decisions here come from
measured contrast and three rounds of user-reviewed renders.

## 4. Risks, Unknowns, Dependencies
- **Risk — menu contrast:** measured on every ground the text meets (void
  `#000`, sunken `#0c0505`, current tint `#2f0004`, selected picker `#380407`,
  hover `#0c0505`): salmon 5.08–6.04, old-blood 4.72–5.30 on its grounds,
  accent `#ff7466` 6.68–7.94. Crimson channel 3.85 as a non-text mark. See
  `sidebar-contrast.md`.
- **Risk — chip rendering:** gradient text needs `background-clip: text`. A
  single clipped layer plus an inset box-shadow fill keeps the chip ground
  without relying on multi-layer clip lists.
- **Risk — dialog bleed:** the riddle dialog lives outside the sidebar, so
  overriding tokens on the sidebar element keeps the dialog bone. This is
  verified by the existing dialog-background E2E.
- **Unknown — narrow screens:** the sidebar stacks above content below 48rem,
  so the vertical briar is hidden there and the stacked block keeps a hairline.
- **Dependency:** none.

## 5. Recommended Approach
Primary: one task. Scope Sanguine token overrides to `.sidebar` in
`TocSidebar.module.css` (`:global(body.theme-sanguine-atonement) .sidebar`).
Paint the briar as a desktop-only `::after` strip from an asset-free pixel SVG,
replace the four border rules with gradient hairline pseudo-elements, and set
the current row's crimson channel. Restyle the chips in `sanguine.css` with a
text-clipped gradient over an inset-shadow fill, with a print reset. Extend the
role contract and contrast tests, and move Sprint 22's bone-sidebar and
bone-chip E2E expectations to the new ones.
Alternative considered: two tasks (sidebar, chips). Not chosen: it's one small
visual change set with shared tests.
Rationale: the user approved this exact look from rendered mocks.

## Artifacts
- `sidebar-contrast.md` — the contrast table for every sidebar and chip pairing.
