Finalized - DO NOT EDIT

# Sprint 1 Build Plan

## Intents
- [INT-0001](../../../intents/INT-0001-tome-ink-on-paper-mdbook-viewer.md) — state: active; acceptance criteria covered: completes 5 (images) and 6 (reduced-motion), enforces 7 (CI) remotely, and hardens 3 (drops the runtime font CDN). On green, criteria 1–7 are all satisfied for the bundled book.

## Schema Tree
- Sprint Goal: harden and finish the foundation so INT-0001 is fully met for the bundled book
  - Font resilience
    - T-006: self-host Mekzantine via a build-time fetch (no redistribution)
  - Content coverage
    - T-007: image chapter + criterion-5 image proof
  - Motion accessibility
    - T-008: prefers-reduced-motion E2E
  - Delivery
    - T-009: CI workflow (astro check + vitest + playwright)

## Execution Sequence

### T-006: Self-host Mekzantine via a build-time fetch script
- **Intent:** [INT-0001](../../../intents/INT-0001-tome-ink-on-paper-mdbook-viewer.md)
- **Touches:** `scripts/fetch-fonts.mjs` (new), `package.json` (`prebuild`/`predev` hooks), `src/styles/fonts.css`, `.gitignore`
- **Depends on:** (none)
- **Acceptance criterion:** criterion 3 — the ink-on-paper surface is set in Mekzantine; this removes the third-party runtime CDN dependency so the aesthetic loads from Tome's own origin. (Licence-safe: fetch at build, do not redistribute the binary.)
- **Success criterion (EARS):**
  - **WHEN** the shipped `fonts.css` is inspected, **THEN** every Mekzantine `@font-face` `src` **SHALL** be a same-origin `/fonts/…woff2` URL and **SHALL NOT** name an external host.
  - **WHEN** `scripts/fetch-fonts.mjs` runs, **THEN** it **SHALL** write the Mekzantine woff2 file(s) into `public/fonts/`.
  - **WHEN** the font asset is absent, **THEN** `--font-family-mono` **SHALL** still resolve through a `monospace` fallback so the reader never breaks.
- **Notes:** script is idempotent (skips if the file already exists) **and non-fatal** — on any network/fetch error it warns and exits 0 so a blocked CDN can never break a build (in CI or a later sprint); the `monospace` fallback then covers the reader (per critique C-001). Wired as an npm `prebuild`/`predev` hook; `public/fonts/` is git-ignored (no binary committed). Vendoring the file is an alternative only on confirmed redistribution rights.

### T-007: Image chapter + criterion-5 image proof
- **Intent:** [INT-0001](../../../intents/INT-0001-tome-ink-on-paper-mdbook-viewer.md)
- **Touches:** `public/images/sacred-diagram.svg` (new, self-authored), `src/content/book/components/panels.md`
- **Depends on:** (none)
- **Acceptance criterion:** criterion 5 — Markdown rendering covers **images**, styled through the sacred prose layer (the one element Sprint 0 left unexercised).
- **Success criterion (EARS):**
  - **WHEN** a chapter containing an image is rendered, **THEN** the image **SHALL** appear inside `.tome-prose` as a bordered `img`.
- **Notes:** self-authored SVG (ink-on-paper / sacred styled) referenced by absolute URL `/images/sacred-diagram.svg`; no external image, no asset transform, no licence issue. `prose.css .tome-prose img` already provides the border/fluid styling.

### T-008: prefers-reduced-motion E2E
- **Intent:** [INT-0001](../../../intents/INT-0001-tome-ink-on-paper-mdbook-viewer.md)
- **Touches:** `e2e/reader.spec.ts`
- **Depends on:** (none)
- **Acceptance criterion:** criterion 6 — reader interactions honour `prefers-reduced-motion`.
- **Success criterion (EARS):**
  - **WHEN** `prefers-reduced-motion: reduce` is emulated, **THEN** an interactive element's computed `transition-duration` **SHALL** be effectively zero (≤ 1ms).
- **Notes:** `page.emulateMedia({ reducedMotion: 'reduce' })` exercises the existing `@media (prefers-reduced-motion: reduce)` rule in `tokens.css`; no implementation change expected.

### T-009: CI workflow (GitHub Actions)
- **Intent:** [INT-0001](../../../intents/INT-0001-tome-ink-on-paper-mdbook-viewer.md)
- **Touches:** `.github/workflows/ci.yml` (new)
- **Depends on:** (none)
- **Acceptance criterion:** criterion 7 — `astro check` clean, audit clean, and **wired test gates green**; this wires those gates in CI so they are enforced remotely on every checkpoint PR.
- **Success criterion (EARS):**
  - **WHEN** a pull request targets `main` or a commit is pushed to `dev`, **THEN** CI **SHALL** run `astro check`, `vitest run`, and `playwright test`, and **SHALL** fail the check on any red gate.
- **Notes:** steps — `actions/checkout`, `actions/setup-node` (npm cache), `npm ci`, `npx astro check`, `npx vitest run`, `npx playwright install --with-deps chromium`, `npx playwright test`, upload `playwright-report/`. Structure validated locally by a parse test; the real conclusion is observed on the Sprint 1 PR.
