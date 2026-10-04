# Sprint 21 End-to-End Verification

## Reader regression checkpoint

- **Intent:** [INT-0021](../../../intents/INT-0021-safe-consistent-fixture-verification.md), criterion 4 compatibility boundary.
- **Tested checkout HEAD:** `9e90e33` with the committed two-book sample.
- `node node_modules/playwright/cli.js test --workers=2`: **25 passed**
  (11.3 seconds), including reader navigation/content/theme, scaling geometry,
  search input/dialog behavior, and cross-tome search.
- Playwright builds and serves only the isolated checkout; the active personal
  Bible library and manifest are not loaded or restored by this verification.

## T-054 checkpoint

- **Tested source:** `9e90e33` plus the T-054 files, isolated worktree.
- `npx playwright test`: **25 passed** (11.3 seconds) after the four gates ran,
  confirming the restored default build still serves the reader.
- `check:external` drove `e2e/external-book.spec.ts` in Chromium: **3 passed**
  (gate table in `integration-tests.md`).
