Finalized - DO NOT EDIT

# Sprint 23 Build Plan

Approved by the user on 2026-10-04 (Plan Mode approval of the Sprint 23 plan).

## Intents
- [INT-0025](../../../intents/INT-0025-sanguine-sidebar-void.md) — state: planned; acceptance criteria covered: 1–5.
- [INT-0022](../../../intents/INT-0022-sanguine-atonement-theme.md) — realized compatibility boundary (AC5 of INT-0025); no state change.

## Schema Tree
- Sprint Goal: the Sanguine sidebar void, briar edge, refined rules, salmon chips
  - T-062: sidebar tokens + briar + hairlines, salmon chips, contract and tests

## Execution Sequence

### T-062: Make the Sanguine sidebar a salmon-lettered void with a briar edge and refined hairlines, and give code chips a salmon gradient
- **Intent:** [INT-0025](../../../intents/INT-0025-sanguine-sidebar-void.md)
- **Touches:** `src/components/TocSidebar.module.css`, `src/styles/sanguine.css`, `src/styles/theme.ts`, `src/styles/__tests__/contrast.test.ts`, `e2e/theme.spec.ts`
- **Depends on:** (none)
- **Acceptance criterion:** INT-0025 AC1–AC5.
- **Success criterion (EARS):**
  - **WHEN** Sanguine is active, **THEN** the reader sidebar background **SHALL** compute to `rgb(0, 0, 0)`, its chapter links to `rgb(236, 86, 88)`, its part titles to `rgb(188, 105, 87)`, and its current chapter to `rgb(255, 116, 102)` with a `rgb(213, 2, 16)` left border.
  - **WHEN** the sidebar roles are defined, **THEN** text, subdued, and accent **SHALL** each be ≥ 4.5:1 on every ground they render on (void, sunken, current tint, selected picker, hover), and the crimson channel **SHALL** be ≥ 3:1 on the void.
  - **WHEN** the viewport shows the sidebar as a column (≥ 48.0625rem), **THEN** a sidebar `::after` **SHALL** paint the pixel briar (SVG background, 24px wide, repeating vertically, `pointer-events: none`) and the sidebar **SHALL** have no plain right border; **WHEN** the viewport is narrower, **THEN** the briar **SHALL NOT** be displayed.
  - **WHEN** Sanguine is active, **THEN** the header, switcher, and footer dividers and the SUMMARY separators **SHALL** be gradient hairlines (1px, `linear-gradient` fading to transparent at both ends) and the plain `border-top`/`border-bottom` rules **SHALL** be removed.
  - **WHEN** a chapter contains inline code, **THEN** its chip text **SHALL** render as a `#ff9a8a` → `#ec5658` gradient (transparent fill, text-clipped gradient) over the chip's dark ground, both stops ≥ 4.5:1 on it; **WHEN** printed, **THEN** the chip text **SHALL** be solid black.
  - **WHEN** the riddle dialog opens from the Sanguine sidebar, **THEN** its text **SHALL** keep the bone interface ink, and the inscription, Bibliotheca, and Light/Dark computed styles **SHALL** be unchanged.
- **Notes:** Scope token overrides with `:global(body.theme-sanguine-atonement) .sidebar` in the CSS module. Reuse the exact 12×32 briar pixel map from the approved mock. Supersedes Sprint 22's E2E expectations of bone sidebar links and bone chips.
