# Sprint 15 Research Report

## Intents Reviewed

- [INT-0013 — Resilient scaling & zoom](../../intents/INT-0013-resilient-scaling-zoom.md)
  — **created** this sprint (`proposed`). Robustness outcome surfaced by the
  desktop shell (INT-0012).
- [INT-0014 — Discoverable library (Bibliotheca by default)](../../intents/INT-0014-discoverable-library.md)
  — **created** this sprint (`proposed`). A distinct discoverability outcome.

## 1. Sprint Goal

Two coupled outcomes raised by using the desktop app: (a) make the reader
**resilient to scaling/zoom** — the shell must not let an accidental zoom collapse
the layout, and a size×zoom fuzz suite must guard against overflow/clipping and
wrong layout modes; (b) make the **library discoverable** — ship a second bundled
sample tome so the Bibliotheca and switcher appear by default, with honest
single-vs-multi-tome copy. Delivers INT-0013 (4 criteria) and INT-0014 (4 criteria).

## 2. Existing Code Survey

| File | Relevance |
|------|-----------|
| electron/main.cjs | The shell. No zoom management today, so pinch / Ctrl-wheel zoom persists invisibly. Add zoom reset on load + disable the accidental gesture (`setVisualZoomLevelLimits(1,1)` and/or a `before-input-event`/wheel clamp) + a Ctrl+0 reset. |
| src/layouts/BookLayout.astro | Responsive grid: 1 col `< 48.0625rem`, 2 col `≥ 48.0625rem`, 3 col (with rail) `≥ 64rem`. The breakpoints the zoom trips. |
| src/components/SearchOverlay.module.css | `.dialog { max-width: 40rem; max-height: min(70vh, 40rem) }`, `.backdrop` padding. Verified: no overflow/clip at any width at 100%; scales down cleanly under zoom. |
| src/components/TocSidebar.tsx | Sidebar + **switcher** (`props.books.length > 1`) + drawer behavior `< 48rem`. Switcher/Bibliotheca link only render for 2+ tomes. |
| src/components/Bibliotheca.astro | The `/` library shelf (multi-tome only). Renders cleanly at all widths (verified, hOverflow=0). |
| src/pages/[...slug].astro | Adaptive routing: 1 tome → root routes; N → namespaced + `/` Bibliotheca. Making the default 2-tome flips `/` to the Bibliotheca. |
| scripts/load-books.mjs | No env/config ⇒ **no-op**: the default library is exactly the committed `src/content/books/<slug>/` dirs. So a second committed sample tome makes the default multi-tome — no config change. |
| src/content/books/tome/ | The current sole bundled tome. A curated second tome dir alongside it yields the default Bibliotheca. |
| src/components/SearchOverlay.tsx | Copy: "Search the library" / "Search every tome" — correct for many, misleading for one. Soften for the single-tome case. |
| e2e/reader.spec.ts, e2e/search.spec.ts, e2e/electron.spec.ts | Open `/` expecting the "Introduction" chapter + sidebar. These must move to "Bibliotheca at `/`, navigate into a tome" once the default is multi-tome. |
| Reproduction (this phase) | A size×zoom sweep in Electron: at zoomFactor 1.5 a 1100px window's `innerWidth`→733 (< 769px) ⇒ mobile stacked layout (the "weirdness"). `--force-device-scale-factor=1.5` kept `innerWidth`=1100 (DIP) ⇒ **DPI is not the cause**. No hOverflow / dialog clip at any size×zoom. |

## 3. External Sources

- [Electron — `webContents.setVisualZoomLevelLimits` (disable pinch zoom)](https://www.electronjs.org/docs/latest/api/web-contents#contentssetvisualzoomlevellimitsminimumlevel-maximumlevel)
- [Electron — `webContents.setZoomFactor` / `zoomLevel` (reset zoom)](https://www.electronjs.org/docs/latest/api/web-contents#contentssetzoomfactorfactor)
- [Electron — `before-input-event` (intercept Ctrl+/-/0 accelerators)](https://www.electronjs.org/docs/latest/api/web-contents#event-before-input-event)
- [MDN — CSS media queries `rem`/`em` are relative to the browser default, not root font-size](https://developer.mozilla.org/en-US/docs/Web/CSS/@media)
- [Playwright — Electron (`_electron`) + window `setContentSize` for viewport sweeps](https://playwright.dev/docs/api/class-electron)

## 4. Risks, Unknowns, Dependencies

- **Gesture delivery (Windows).** Pinch may arrive as a "visual" zoom or as
  Ctrl-wheel *page* zoom; `setVisualZoomLevelLimits(1,1)` only covers the former.
  Mitigation: confirm empirically in build and, if needed, also clamp via
  `before-input-event` / a `wheel`+ctrl handler; always reset zoomFactor on load.
- **Keep deliberate zoom usable.** Don't fully disable page zoom (accessibility).
  Mitigation: allow deliberate zoom but guarantee content stays reachable and
  offer Ctrl+0 reset; the fuzz suite asserts no clipping/overflow at the tested levels.
- **Default-library ripple (big).** Making the default 2-tome flips `/` to the
  Bibliotheca, breaking the reader/search/electron E2E that expect a chapter at
  `/`. Mitigation: update those specs (Bibliotheca at `/`, then navigate into a
  tome); this is planned work, not incidental.
- **Second sample tome content.** Needs curated, on-theme Markdown (not a raw test
  fixture) with its own SUMMARY. Mitigation: author a short companion tome.
- **Gate interactions.** `check-search`/`check-external`/`check-multibook` assume
  specific tome shapes; verify they still pass with the new default (multibook
  already builds its own fixtures, so it is unaffected).

## 5. Recommended Approach

- **Shell zoom hardening (INT-0013):** on window load reset `zoomFactor=1`; call
  `setVisualZoomLevelLimits(1,1)`; intercept Ctrl+`=`/`-`/`0` (and ctrl-wheel) via
  `before-input-event` so accidental zoom can't stick, keeping an explicit Ctrl+0
  reset. Unit-test any pure helper; assert the lock in the Electron E2E.
- **Scaling fuzz suite (INT-0013):** a browser Playwright sweep over a width matrix
  (min→ultrawide) × the reader/Bibliotheca/search-open states asserting
  `scrollWidth ≤ innerWidth` (no hOverflow), the dialog within the viewport, and
  the expected layout mode per breakpoint; plus an Electron test that zoom stays
  locked (a simulated gesture does not change `getZoomFactor()` / the layout mode).
- **Second sample tome (INT-0014):** author a curated tome under
  `src/content/books/<slug>/` (SUMMARY + a few chapters, on-theme), making the
  default a 2-tome Bibliotheca; keep `books/tome/` as the first.
- **Honest copy (INT-0014):** make the search trigger/hint copy adapt to the tome
  count (library-wide when many; not implying "every tome" when one).
- **Test migration (INT-0014):** update reader/search/electron E2E to the 2-tome
  default (Bibliotheca at `/` → into a tome); keep a single-tome path covered.

## Artifacts

- [INT-0013](../../intents/INT-0013-resilient-scaling-zoom.md) (created),
  [INT-0014](../../intents/INT-0014-discoverable-library.md) (created).
- This report; reproduction evidence (size×zoom sweep table + before/after
  screenshots: desktop layout at 100% vs. collapsed mobile layout at 150%);
  `load-books.mjs` no-op-default behavior confirmed.
