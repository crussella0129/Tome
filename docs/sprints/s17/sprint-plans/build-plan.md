Finalized - DO NOT EDIT

# Sprint 17 Build Plan

## Intents
- [INT-0016](../../../intents/INT-0016-showcase-readme.md) — state: planned; acceptance criteria covered: 1 (banner — T-040), 2 (screenshots — T-041), 3 (showcase rewrite — T-042), 4 (reproducible banner + screenshot generators; font binaries git-ignored — T-040/T-041).

## Schema Tree
- Sprint Goal: a beautified, brand-led showcase README
  - Brand assets
    - T-040: Mekzantine banner image
    - T-041: feature screenshots
  - Document
    - T-042: README showcase rewrite

## Execution Sequence

### T-040: Brand banner (Mekzantine display) → committed image
- **Intent:** [INT-0016](../../../intents/INT-0016-showcase-readme.md)
- **Touches:** `scripts/make-banner.mjs` (new), `docs/assets/banner.png` (generated), `package.json` (`assets:banner` script)
- **Depends on:** (none)
- **Acceptance criterion:** INT-0016 #1, #4.
- **Success criterion (EARS):**
  - **WHEN** `node scripts/make-banner.mjs` runs, **THEN** it **SHALL** render a "TOME" wordmark + tagline in the Mekzantine **display** woff2 on the ink-on-parchment palette to a wide PNG at `docs/assets/banner.png`, with the type baked into the raster (no font/CSS dependency) so it renders on GitHub.
- **Notes:** reuse `scripts/make-icon.mjs`'s pattern — base64 `@font-face` of `public/fonts/mekzantine.woff2` in a headless-Chromium page, then screenshot. Parchment `#f3e9d2`, ink `#2b2018`, rubric `#a83a2b`.

### T-041: Feature screenshots (Playwright against the built site)
- **Intent:** [INT-0016](../../../intents/INT-0016-showcase-readme.md)
- **Touches:** `scripts/make-shots.mjs` (new), `docs/assets/shots/*.png` (generated)
- **Depends on:** (none — builds its own `dist/`)
- **Acceptance criterion:** INT-0016 #2, #4.
- **Success criterion (EARS):**
  - **WHEN** `node scripts/make-shots.mjs` runs after `astro build`, **THEN** it **SHALL** serve `dist/` and capture PNGs of the **Bibliotheca** (`/`), the **reader** (a chapter with sidebar + tome switcher), the **search overlay** (open), **richer content** (admonitions + footnotes on `/tome/getting-started`), the **dark theme**, and the **on-this-page rail** (wide viewport) — each depicting the shipping 2-tome default.
- **Notes:** reuse the e2e interaction patterns (wait for `data-search-ready`/`js-nav`; press `/` for search; click "Switch colour theme" for dark). Desktop viewport ~1280×860; element or full-page shots per feature. Serve via `scripts/serve-dist.mjs` (its own port).

### T-042: README rewrite into a showcase
- **Intent:** [INT-0016](../../../intents/INT-0016-showcase-readme.md)
- **Touches:** `README.md`
- **Depends on:** T-040, T-041
- **Acceptance criterion:** INT-0016 #3.
- **Success criterion (EARS):**
  - **WHEN** the README renders, **THEN** it **SHALL** open with the banner + a tagline (hero), present a **feature gallery** of the T-041 screenshots (each captioned), then the practical guide (quickstart, view-a-book, Bibliotheca, search, content rendering, desktop app + experimental Tauri) preserving accurate content, **AND** every referenced image path **SHALL** resolve on disk (no broken images/links).
- **Notes:** the objective gate is a link/asset check (every `docs/assets/...` reference exists); the "beautiful/finished" quality is surfaced to the user for sign-off.
