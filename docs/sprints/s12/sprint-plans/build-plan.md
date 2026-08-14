Finalized - DO NOT EDIT

# Sprint 12 Build Plan

## Intents
- [INT-0010](../../../intents/INT-0010-in-page-reader-navigation.md) — state: planned; acceptance criteria covered: 1, 2, 3, 4 (the whole intent — the "on this page" rail with scroll-sync, keyboard chapter nav with guards, proven by component + E2E). On green, INT-0010 is eligible for `realized`.

## Schema Tree
- Sprint Goal: in-page reader navigation — an "on this page" rail + keyboard chapter nav
  - Section rail
    - T-026: "on this page" rail island + wiring + scroll-sync
  - Chapter keys
    - T-027: keyboard chapter navigation island
  - Proof & docs
    - T-028: reader-nav E2E + README

## Execution Sequence

### T-026: "On this page" rail island + wiring
- **Intent:** [INT-0010](../../../intents/INT-0010-in-page-reader-navigation.md)
- **Touches:** `src/components/OnThisPage.tsx` (new), `src/components/OnThisPage.module.css` (new), `src/layouts/BookLayout.astro` (right rail column, wide-only; mount the island), `src/pages/[...slug].astro` (pass `headings` from `mod.getHeadings()`), `src/components/__tests__/OnThisPage.test.tsx` (new)
- **Depends on:** (none)
- **Acceptance criterion:** INT-0010 criteria 1 (server-rendered heading rail) and 2 (scroll-sync active).
- **Success criterion (EARS):**
  - **WHEN** a chapter has H2/H3 headings, **THEN** `OnThisPage` **SHALL** render a `<nav aria-label="On this page">` listing each heading as an `<a href="#slug">`, the slug taken from `getHeadings()` (identical to the rendered heading `id`), server-rendered so the links work with no JS; **WHEN** a chapter has no H2/H3 headings, **THEN** no rail **SHALL** render.
  - **WHEN** the reader scrolls, **THEN** the island **SHALL** mark the section currently in view with `aria-current` via an `IntersectionObserver` — its only client JavaScript — disconnecting the observer on cleanup and honoring `prefers-reduced-motion`. The active section is chosen by a **pure** exported helper `activeHeadingSlug(headings, tops)` (the last heading whose viewport `top` is at/above a small offset), unit-tested independently of the DOM (**per critique C-001**).
- **Notes:** `[...slug].astro` computes `headings = mod.getHeadings().filter((h) => h.depth >= 2 && h.depth <= 3)` and passes it to `BookLayout`. The island SSRs the links (progressive enhancement), adding scroll-sync on hydration (`client:idle`); it accepts the headings as serializable props so component tests inject them. Grid becomes `sidebar | content | rail` ≥ 64rem; the rail is `display:none` below. Sacred tokens only.

### T-027: Keyboard chapter navigation island
- **Intent:** [INT-0010](../../../intents/INT-0010-in-page-reader-navigation.md)
- **Touches:** `src/components/ReaderKeys.tsx` (new — behavior-only island), `src/layouts/BookLayout.astro` (mount with prev/next URLs), `src/pages/[...slug].astro` (compute the adaptive prev/next URLs), `src/components/__tests__/ReaderKeys.test.tsx` (new)
- **Depends on:** T-026
- **Acceptance criterion:** INT-0010 criterion 3 — keyboard chapter navigation, guarded.
- **Success criterion (EARS):**
  - **WHEN** the reader presses `ArrowRight`/`j` (next) or `ArrowLeft`/`k` (prev) outside a text field, with no modifier keys and no open `[role="dialog"]`, **THEN** the island **SHALL** navigate to the adjacent chapter's adaptive URL; at the first/last chapter the corresponding key **SHALL** be a no-op.
  - **WHEN** a key is pressed while a text input/`textarea`/`contenteditable` is focused, or while the search dialog is open, **THEN** the island **SHALL NOT** navigate.
- **Notes:** props are serializable `prevUrl?`/`nextUrl?` strings (from `[...slug].astro` via `chapterUrlIn(multi ? bookSlug : '', node.href)`); a document `keydown` listener added in `onMount`, removed in `onCleanup`; the component renders nothing. Navigation is injectable (a `navigate` prop defaulting to `location.assign`) so component tests assert the target without a real navigation.

### T-028: Reader-nav E2E + README
- **Intent:** [INT-0010](../../../intents/INT-0010-in-page-reader-navigation.md)
- **Touches:** `e2e/reader.spec.ts`, `README.md`
- **Depends on:** T-026, T-027
- **Acceptance criterion:** INT-0010 criterion 4 — the rail + keyboard nav work in a real browser.
- **Success criterion (EARS):**
  - **WHEN** a chapter with sections is opened, **THEN** the E2E **SHALL** find the "on this page" rail listing that chapter's headings, and clicking a rail link **SHALL** move the URL hash to that `#slug`; **WHEN** `ArrowRight` is pressed (after awaiting `body.js-nav`), **THEN** the page **SHALL** navigate to the next chapter.
- **Notes:** reuse the `body.js-nav` hydration wait (from T-208). README documents the rail and the keyboard shortcuts.
