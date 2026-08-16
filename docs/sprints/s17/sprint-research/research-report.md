# Sprint 17 Research Report

## Intents Reviewed

- [INT-0016 — Showcase README with the Mekzantine brand](../../intents/INT-0016-showcase-readme.md)
  — **created** this sprint (`proposed`). A presentation/brand outcome (a beautified
  README + a local terminal font), distinct from the reader/shell feature intents.

## 1. Sprint Goal

Beautify the README into a showcase: a **brand banner** set in the reader's display
font (Mekzantine), a **gallery of feature screenshots** from the built app, and a
polished structure — with the brand type shipped as committed GitHub-safe images
(GitHub can't use web fonts). As a companion, a committed converter turns the
monospace **MekzantineMono** woff2 into an installable terminal TTF (installed
locally, not committed). Delivers INT-0016's four criteria. A pause before the full
Tauri port.

## 2. Existing Code Survey

| File | Relevance |
|------|-----------|
| scripts/make-icon.mjs | The proven pattern: render text in the Mekzantine woff2 (base64 @font-face) via headless Chromium and screenshot to PNG. Reuse it to render the **banner** wordmark. |
| public/fonts/mekzantine.woff2 | Display font (family "MEKZANTINE", **proportional** — 27 distinct ASCII advances). For the banner. Git-ignored. |
| public/fonts/mekzantine-mono.woff2 | **Monospace** (uniform advance 405 across 93 ASCII glyphs; `post.isFixedPitch` flag is wrongly False — set it on conversion). For the terminal font. Git-ignored. |
| scripts/serve-dist.mjs | Foreground static server for `dist/` — the target for Playwright screenshot capture (the same server the E2E uses). |
| e2e/*.spec.ts | Show how to drive the reader with Playwright (open search via `/`, toggle theme, wait for hydration signals `data-search-ready`/`js-nav`) — reuse those interactions to script clean screenshots. |
| README.md | The document to restructure. Current sections: Develop, View a book, Bibliotheca, Search, Reading a chapter, Content rendering, Desktop app (+ experimental Tauri). Accurate content to preserve/reflow under a showcase. |
| src/content/books/tome/getting-started.md | Carries a `[!TIP]`/`[!WARNING]` admonition + a footnote — the chapter to screenshot for "richer content". |
| src/styles/theme.ts / tokens.css | The palette for the banner (parchment `#f3e9d2`, ink `#2b2018`, rubric `#a83a2b`; dark `#16130e`). |
| Tooling probe (this phase) | Python 3.13 + **fontTools 4.62** + **brotli** available → woff2 decode + TTF export + name/flag edits are feasible for the terminal font. |

## 3. External Sources

- [GitHub docs — Markdown images (`![]()`), and that custom/web fonts aren't supported in rendered Markdown](https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax)
- [Playwright — `page.screenshot` / element screenshots (clean, deterministic captures)](https://playwright.dev/docs/screenshots)
- [fontTools — `ttLib` (read woff2, edit `name`/`post`/`OS/2`, save `.ttf`)](https://fonttools.readthedocs.io/en/latest/ttLib/index.html)
- [Windows — per-user font install (no admin: `%LOCALAPPDATA%\Microsoft\Windows\Fonts` + `HKCU\…\Fonts`)](https://learn.microsoft.com/en-us/typography/font-list/)

## 4. Risks, Unknowns, Dependencies

- **GitHub can't render web fonts.** Mitigation: commit the banner as a raster/
  vector image with the type baked in (rendered from the woff2), not `<style>`/CSS.
- **Font licence is unclear.** The project git-ignores the binaries. Mitigation:
  commit only **rendered images** (consistent with the already-committed app icon);
  never commit a TTF/woff2; keep the terminal TTF local. Flag the caveat to the user.
- **Screenshot freshness.** Screenshots must reflect the current 2-tome default.
  Mitigation: capture from a fresh `npm run build` via `serve-dist`; a committed
  generator makes them reproducible.
- **Terminal-font pickers filter to monospace.** The mono woff2's `isFixedPitch`
  flag is False. Mitigation: on conversion set `post.isFixedPitch=1` (+ OS/2 PANOSE
  monospace) and rename the family to a distinct "Mekzantine Mono" so Windows
  Terminal lists it.
- **System modification (font install).** Per-user, no admin, reversible; done
  out-of-band with the user's explicit request; not a committed artifact.
- **Repo weight.** ~6 screenshots + a banner ≈ a few hundred KB PNG. Acceptable.

## 5. Recommended Approach

- **Banner (T-040):** extend the `make-icon` pattern into a `scripts/make-banner.mjs`
  that renders a "TOME" wordmark (+ tagline) in Mekzantine on parchment → a wide PNG
  committed under `docs/assets/`.
- **Screenshots (T-041):** a `scripts/make-shots.mjs` that builds/serves `dist/` and
  uses Playwright to capture the Bibliotheca, reader (sidebar+switcher+chapter),
  search overlay, admonitions+footnotes, dark theme, and the on-this-page rail →
  committed PNGs under `docs/assets/`.
- **README rewrite (T-042):** restructure into hero (banner + tagline) → feature
  gallery (screenshots + captions) → practical guide; preserve accurate content; a
  link/asset check verifies every image path resolves.
- **Terminal font (T-043, companion):** `scripts/make-terminal-font.py` (fontTools)
  converts `mekzantine-mono.woff2` → a monospace `.ttf` (rename family, set
  `isFixedPitch`/PANOSE); install per-user for the terminal (out-of-band, not
  committed); verify it's valid + monospace. Flag the licence caveat.

## Artifacts

- [INT-0016](../../intents/INT-0016-showcase-readme.md) (created).
- This report; font analysis (mono = uniform advance 405 → monospace; display =
  proportional); `make-icon.mjs` render pattern + `serve-dist.mjs` as reuse.
