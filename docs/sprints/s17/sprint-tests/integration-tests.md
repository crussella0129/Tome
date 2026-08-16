# Sprint 17 — Integration Test Results

- **Tested head:** `6036f076a466afad1d05985bb67cc040ab175b0c`
- **Intent:** [INT-0016](../../intents/INT-0016-showcase-readme.md)

## Isolation / no-regression

The sprint touched only `README.md`, `docs/assets/`, `scripts/` (generators), a new
test, and `.gitignore` — no web app, Electron, or Tauri code. The full suite holds:

| Suite / gate | Result |
|---|---|
| `npx vitest run` | **97 passed / 97** |
| `astro check` | **0 errors** (67 files) |
| `npm run check:electron` | **6 passed / 6** |
| `npm run test:e2e` (browser) | **21 passed / 21** |

## Asset integrity
`test_readme_assets_resolve` is the objective gate for the showcase (criterion 3):
every image the README embeds exists. The visual "beautiful/finished" quality is a
separate user sign-off.
