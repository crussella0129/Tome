# Sprint 17 Test Report

## Intent Verification
| Intent | Acceptance criterion | Verification | Result |
|--------|----------------------|--------------|--------|
| [INT-0016](../../../intents/INT-0016-showcase-readme.md) | 1 — brand banner in the display font, GitHub-safe | `docs/assets/banner.png` exists (baked-in type); surfaced to user | **pass** |
| [INT-0016](../../../intents/INT-0016-showcase-readme.md) | 2 — current feature screenshots | six PNGs captured from the built app (Playwright); surfaced to user | **pass** |
| [INT-0016](../../../intents/INT-0016-showcase-readme.md) | 3 — polished showcase, valid links | `test_readme_assets_resolve` (all images resolve); surfaced to user | **pass** |
| [INT-0016](../../../intents/INT-0016-showcase-readme.md) | 4 — reproducible banner + screenshot generators; no committed font binaries | generators committed + rerun clean; `git check-ignore` → no font binary tracked | **pass** |

All four criteria met → **INT-0016 is eligible for `realized`** (Loop Phase).

## Summary
- The README is now a **showcase**: a Mekzantine brand banner, a hero reader shot, a
  2×2 feature gallery (Bibliotheca / library-wide search / rich content / dark theme),
  and the polished practical guide — every embedded image guarded by
  `test_readme_assets_resolve`.
- **Reproducible generators:** `npm run assets:banner` (the wordmark from the woff2)
  and `npm run assets:shots` (Playwright feature captures).
- **Isolation:** Vitest **97/97**, `astro check` **0 errors**, `check:electron`
  **6/6**, browser `test:e2e` **21/21** — the sprint changed no web/shell code.

## Tested head
- **Head SHA:** `6036f076a466afad1d05985bb67cc040ab175b0c` (tip of `dev`).

## Failures
None.

## Technical Debt Identified
- **Font licence** is unpublished; the project commits only rendered images and keeps
  the terminal TTF local. If a licence is ever clarified, the fonts could be vendored.
- The showcase's aesthetic quality is a user sign-off, not an automated check (by nature).

## Coverage Observations
A presentation sprint: the objective gates (the banner + six screenshots exist and are
captured from the real app; every README image resolves; the terminal TTF is valid
monospace and uncommitted) all pass, and the subjective "finished" quality is surfaced
to the user. Nothing existing regressed.
