# Sprint 17 — Unit Test Results

- **Tested head:** `6036f076a466afad1d05985bb67cc040ab175b0c`
- **Runner:** `npx vitest run` → **97 passed / 97 (20 files)**.
- **Intent:** [INT-0016](../../intents/INT-0016-showcase-readme.md)

## New

- `test_readme_assets_resolve` (`src/lib/__tests__/readme-assets.test.ts`) — parses
  `README.md` for `docs/assets/...` image references and asserts each resolves on
  disk (7 refs: the banner + 6 screenshots). Guards the showcase against a broken
  image reference landing in the repo. **pass.**
- Terminal-font monospace verification (T-043): `scripts/make-terminal-font.py`
  self-checks the produced TTF — a single distinct ASCII advance width,
  `post.isFixedPitch=1`, Windows family "Mekzantine Mono" — and exits non-zero
  otherwise. Ran clean (the artifact is local, not committed).

## Regression

All prior unit suites green (96 → 97 with the new asset guard).
