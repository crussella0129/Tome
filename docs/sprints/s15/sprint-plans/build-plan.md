Finalized - DO NOT EDIT

# Sprint 15 Build Plan

## Intents
- [INT-0013](../../../intents/INT-0013-resilient-scaling-zoom.md) — state: planned; acceptance criteria covered: 1 (shell zoom lock — T-034), 2–3 (no overflow/clip + layout mode — T-035), 4 (sweep runs browser + shell — T-035 + T-034).
- [INT-0014](../../../intents/INT-0014-discoverable-library.md) — state: planned; acceptance criteria covered: 1–2, 4 (default 2-tome Bibliotheca + cross-tome nav + library search — T-036), 3 (honest copy — T-037).

## Schema Tree
- Sprint Goal: resilient scaling/zoom + a discoverable library
  - Scaling & zoom (INT-0013)
    - T-034: shell zoom hardening
    - T-035: responsive scaling sweep
  - Discoverable library (INT-0014)
    - T-036: second sample tome → default Bibliotheca (+ E2E migration)
    - T-037: tome-count-aware search copy

## Execution Sequence

### T-034: Shell zoom hardening — accidental zoom can't collapse the layout
- **Intent:** [INT-0013](../../../intents/INT-0013-resilient-scaling-zoom.md)
- **Touches:** `electron/main.cjs`, `e2e/electron.spec.ts`
- **Depends on:** (none)
- **Acceptance criterion:** INT-0013 #1.
- **Success criterion (EARS):**
  - **WHEN** the shell window finishes loading, **THEN** it **SHALL** set the page zoom factor to 1 and call `setVisualZoomLevelLimits(1, 1)`, so pinch/visual zoom is disabled and the app starts at 100%.
  - **WHEN** an accidental mouse-wheel/pinch page zoom fires a `zoom-changed` event, **THEN** the shell **SHALL** reset the zoom factor to 1 (the layout cannot collapse), while a deliberate **keyboard** zoom remains available and **Ctrl+0** resets to 100%.
- **Notes:** `zoom-changed` fires for mouse-wheel/pinch zoom, not keyboard zoom, so resetting there neutralizes the accidental Windows trackpad-pinch (→ Ctrl-wheel) vector while leaving accessibility keyboard zoom intact. Confirm the vector empirically in build; if a wheel gesture proves undrivable in the E2E, assert the handler resets a simulated wheel-zoom to 1. The test asserts `getZoomFactor()` stays 1 **page-agnostically** (robust to T-036 flipping the default to multi-tome), and any non-collapse layout check is done on a **chapter** page reached by navigation (the Bibliotheca has no sidebar layout). No preload (stays sandboxed).

### T-036: Second sample tome → default Bibliotheca (+ E2E migration)
- **Intent:** [INT-0014](../../../intents/INT-0014-discoverable-library.md)
- **Touches:** `src/content/books/<second-slug>/` (new: `SUMMARY.md` + on-theme chapters + `book.meta.json`), `src/content/books/tome/book.meta.json` (clean title if needed), `e2e/reader.spec.ts`, `e2e/search.spec.ts`, `e2e/electron.spec.ts`
- **Depends on:** (none)
- **Acceptance criterion:** INT-0014 #1, #2, #4.
- **Success criterion (EARS):**
  - **WHEN** the default build runs (no `TOME_BOOK*`/config), **THEN** it **SHALL** produce a 2-tome library — `/` renders the Bibliotheca listing both tomes as working links, chapters are namespaced under their tome slug, and a chapter's sidebar shows the tome switcher (with a Bibliotheca link).
  - **WHEN** the reader opens `/` and follows the Bibliotheca/switcher links, **THEN** it **SHALL** reach any tome's chapter with working links requiring no JavaScript, and library-wide search **SHALL** return hits from both tomes, each tagged with its tome.
  - **WHEN** a single tome is loaded (`TOME_BOOK=<fixture>`), **THEN** `/` **SHALL** remain that tome's entry chapter with no switcher and no Bibliotheca.
- **Notes:** `load-books` is a no-op with no env/config, so committing a second tome dir makes the default multi-tome (no config change). Migrate the affected E2E in this same task so no commit boundary is left red: `/` → Bibliotheca (both tomes) → into a tome (chapter + sidebar + switcher); cross-tome nav; `test_search_across_tomes`; electron `test_electron_reader_offline` → Bibliotheca then into a tome (keep search-index/secure/external/icon tests). Single-tome mode stays covered by the **existing `check:external` gate** (it builds one external tome and already asserts root routes + no Bibliotheca), so no new single-tome spec is needed — just confirm `check:external` still passes.

### T-037: Tome-count-aware search copy
- **Intent:** [INT-0014](../../../intents/INT-0014-discoverable-library.md)
- **Touches:** `src/components/SearchOverlay.tsx`, `src/layouts/BookLayout.astro`, `src/components/Bibliotheca.astro`, `e2e/search.spec.ts`
- **Depends on:** T-036
- **Acceptance criterion:** INT-0014 #3.
- **Success criterion (EARS):**
  - **WHEN** the search UI renders in a library of N tomes, **THEN** its trigger/hint/empty copy **SHALL** read as library-wide when N > 1 and **SHALL NOT** imply multiple tomes when N = 1 (e.g. "Search this tome" vs "Search the library").
- **Notes:** the layout/Bibliotheca know the library size; pass a `tomeCount` (or `libraryWide`) prop into the `SearchOverlay` island. Results already carry the per-tome tag (`resultTome`); this task only fixes the invitational copy.

### T-035: Responsive scaling sweep
- **Intent:** [INT-0013](../../../intents/INT-0013-resilient-scaling-zoom.md)
- **Touches:** `e2e/scaling.spec.ts` (new), `playwright.config.ts` (`testMatch`)
- **Depends on:** T-036 (needs the Bibliotheca in the default build)
- **Acceptance criterion:** INT-0013 #2, #3, #4.
- **Success criterion (EARS):**
  - **WHEN** the browser renders the reader chapter, the Bibliotheca, and the open search overlay across a viewport-width matrix (from the shell minimum ~480px through ultrawide 2560px), **THEN** each **SHALL** produce no horizontal overflow (`scrollWidth ≤ innerWidth`) and the search dialog **SHALL** remain fully within the viewport (not clipped).
  - **WHEN** the viewport width crosses each responsive breakpoint, **THEN** the rendered layout mode **SHALL** match the intended mode — one column below 769px, two columns at ≥ 769px, three columns (with the "on this page" rail) at ≥ 1024px.
- **Notes:** browser Playwright via `page.setViewportSize` (a width sweep is the browser-equivalent of the zoom-induced viewport shrink; the zoom-lock half of criterion 4 is T-034's Electron test). Add `**/scaling.spec.ts` to the default `testMatch` (same webServer/dist). Assert layout mode by comparing the sidebar and content bounding boxes (side-by-side vs stacked) and the presence of the rail column.
