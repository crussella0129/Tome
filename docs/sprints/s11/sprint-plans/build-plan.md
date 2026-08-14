Finalized - DO NOT EDIT

# Sprint 11 Build Plan

## Intents
- [INT-0009](../../../intents/INT-0009-live-reload-parent-assets.md) — state: planned; acceptance criteria covered: 1, 2, 3, 4 (the whole intent — live-reload of a parent-asset chapter with build-parity rewrite/containment, proven by the gate). On green, INT-0009 is eligible for `realized`.
- [INT-0001](../../../intents/INT-0001-tome-ink-on-paper-mdbook-viewer.md) — state: realized (regression provenance only): T-208 hardens the theme-toggle E2E; the intent's acceptance is unchanged.

## Schema Tree
- Sprint Goal: clear the two backlog bugs — live-reload parent-asset fidelity + E2E de-flake
  - Live-reload fidelity
    - T-209: per-chapter parent-asset preparation on live sync
  - Test robustness
    - T-208: de-flake the theme-toggle E2E

## Execution Sequence

### T-209: Per-chapter parent-asset preparation on live sync
- **Intent:** [INT-0009](../../../intents/INT-0009-live-reload-parent-assets.md)
- **Touches:** `scripts/parent-assets.mjs` (extract a shared per-span classifier; add exported `prepareChapterParentAssets`), `astro.config.mjs` (capture `root`; run per-chapter prep after `syncPath` for `.md`), `scripts/check-live-reload.mjs` (assert the parent image resolves after the live edit), `src/lib/__tests__/parent-assets.test.ts`
- **Depends on:** (none)
- **Acceptance criterion:** INT-0009 criteria 1–4 — a parent-asset chapter edited in `dev` reflects with the image still resolving, with build-parity rewrite and containment, proven by `check_live_reload`.
- **Success criterion (EARS):**
  - **WHEN** a synced chapter contains a parent-relative inline image, **THEN** `prepareChapterParentAssets({ root, sourceDir, stagedTome, sourceFile, stagedFile })` **SHALL** rewrite the staged chapter's URL to the tome-private staged asset (byte-identical to the build path) and ensure the asset is copied into the existing `__tome_parent_assets__` (idempotent `mkdir`, **no** preexisting-dir throw); an in-source image or a non-local URL **SHALL** be left unchanged.
  - **WHEN** the referenced target escapes the book root (lexical or symlink), **THEN** the per-chapter prep **SHALL** throw the same containment error as the build path (no weakening of INT-0007's confinement).
  - **WHEN** the dev watcher syncs a changed `.md` file, **THEN** it **SHALL** run the per-chapter prep before sending `full-reload`, so editing a parent-asset chapter reflects in the reader with the parent image still resolving.
- **Notes:** refactor `prepareParentAssets` to call the shared classifier — its whole-tome orchestration + preexisting-dir guards stay **behaviorally identical** (existing symlink/escape tests unchanged). **Per critique C-001**, the gate, after observing the edit marker, asserts the served `/first` references a **parent-plate-derived** `/_astro/` asset (the `parent-plate.<hash>` shape `check_external_build` already asserts at build), not merely any `/_astro/` asset — directly proving the parent image resolved.

### T-208: De-flake the theme-toggle E2E
- **Intent:** [INT-0001](../../../intents/INT-0001-tome-ink-on-paper-mdbook-viewer.md)
- **Touches:** `e2e/reader.spec.ts`
- **Depends on:** (none)
- **Acceptance criterion:** INT-0001 (regression provenance) — the theme-toggle E2E no longer races the `client:idle` sidebar hydration.
- **Success criterion (EARS):**
  - **WHEN** `test_dark_theme_active` runs, **THEN** it **SHALL** await the sidebar hydration signal (`body.js-nav`, set in `TocSidebar.onMount`) before clicking "Switch colour theme", so the click always lands on a hydrated island; the existing assertion (body gains `theme-terminal-dark` + warm-dark background) is unchanged.
- **Notes:** one `await page.waitForSelector('body.js-nav')` before the click; a genuine hydration failure surfaces as a timeout rather than a silent pass.
