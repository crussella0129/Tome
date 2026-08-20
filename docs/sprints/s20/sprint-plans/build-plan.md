Finalized - DO NOT EDIT

# Sprint 20 Build Plan

## Intents

- [INT-0019 — Centered reader and resilient search geometry](../../../intents/INT-0019-centered-reader-search-geometry.md)
  — state: `planned`; acceptance criteria covered: 1–4.
- [INT-0020 — Native library folder management](../../../intents/INT-0020-native-library-folder-management.md)
  — state: `proposed`; reviewed and preserved as T-052 backlog, but not advanced
  by Sprint 20 implementation.

## Schema Tree

- Sprint Goal: balanced reader and usable responsive search geometry
  - Reader composition
    - T-050: center the complete reading stack in the real main-content track
  - Shared search component
    - T-051: normalize closed-trigger width and protect open-dialog controls
  - Follow-on boundary
    - T-052 (backlog only): native picker + persisted staged library publication

## Execution Sequence

### T-050: Center the reader stack in the available content track

- **Intent:** [INT-0019](../../../intents/INT-0019-centered-reader-search-geometry.md)
- **Touches:** `src/layouts/BookLayout.astro`, `e2e/scaling.spec.ts`
- **Depends on:** (none)
- **Acceptance criterion:** INT-0019 criteria 1 and 4 — search, prose, and pager
  share a measure-bounded column centered against `main.content`, with mobile-nav
  stability proven by geometry.
- **Success criterion (EARS):**
  - **WHEN** a headed or unheaded reader page is rendered at 1280, 1920, or 2560
    CSS pixels, **THEN** the reading column, prose, and pager **SHALL** remain no
    wider than `--measure` and their horizontal centers **SHALL** match the center
    of `main.content` within 1 CSS pixel; the reader search host and trigger
    **SHALL** be contained by that reading column and the trigger's right edge
    **SHALL** align with the column's right edge within 1 CSS pixel.
  - **WHEN** the hydrated table-of-contents navigation is opened and closed at a
    600 CSS-pixel viewport, **THEN** the reading column's horizontal center **SHALL**
    remain unchanged within 1 CSS pixel and the document **SHALL** have no
    horizontal overflow.
- **Notes:** Wrap the existing `.searchbar` and `<slot />` in a
  `.reading-column`; set `width: 100%`, `max-width: var(--measure)`, `min-width: 0`,
  and `margin-inline: auto`. Do not change prose alignment, grid tracks, sidebar
  behavior, or rail breakpoints. Keep the existing searchbar right alignment
  inside the centered reading column. Resolve the computed reading-column
  `max-width` to pixels in the browser test; do not parse `72ch` as though it were
  a pixel value.

### T-051: Normalize search width and narrow-dialog usability

- **Intent:** [INT-0019](../../../intents/INT-0019-centered-reader-search-geometry.md)
- **Touches:** `src/components/SearchOverlay.module.css`, `e2e/scaling.spec.ts`
- **Depends on:** T-050 (the reader host geometry and shared E2E file are final)
- **Acceptance criterion:** INT-0019 criteria 2–4 — consistent closed-trigger
  width and measurable, non-overlapping open-dialog controls in both hosts.
- **Success criterion (EARS):**
  - **WHEN** the shared search control is rendered on the Bibliotheca and a headed
    reader at 480, 768, 769, 1023, 1024, or 1040 CSS pixels, **THEN** its root and
    trigger **SHALL** match widths within 1 CSS pixel and each **SHALL** equal the
    lesser of the root's resolved 26rem maximum and its host's content-box width
    within 1 CSS pixel, keep trigger copy to one line, and **SHALL NOT** introduce
    horizontal overflow.
  - **WHEN** search is opened on either host at 320×360 or 480×360 CSS pixels,
    **THEN** the input **SHALL** retain at least 192 CSS pixels of width, the close
    target **SHALL** remain at least 32×32 CSS pixels, their rectangles **SHALL
    NOT** overlap, and the dialog/document **SHALL** stay inside the viewport
    without horizontal overflow.
  - **WHEN** the open dialog reaches the 320 CSS-pixel narrow layout, **THEN**
    the decorative field icon **SHALL** have no rendered box, and the field's
    computed column gap plus each inline padding **SHALL** be no greater than 8 CSS
    pixels before the query input or close target is compressed.
- **Notes:** Give `.root` the reusable `width: 100%; max-width: 26rem` contract and
  keep `.trigger` full-width. Give the flex root/label overflow-safe `min-width: 0`
  behavior, keep the label on one line with safe overflow handling, and keep the
  icon/keycap non-shrinking. Use a narrow media rule to reduce backdrop/field
  spacing and hide `.fieldIcon`; do not shrink the close target. Do not change
  search results, keyboard behavior, or copy.

## Deferred Follow-on

T-052 remains backlog under
[INT-0020](../../../intents/INT-0020-native-library-folder-management.md).
Sprint 20 ships no inert “Add Tome…” control: realization requires native adapters,
per-user persistence, complete staged route/asset/search generation, atomic switch
and rollback, plus Electron/Tauri availability gating.
