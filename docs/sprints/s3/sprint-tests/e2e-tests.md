# Sprint 3 End-to-End Tests

- **Status:** possible — executed against the **default sample** (regression guard).
  The external + relative-image render is covered at build level by
  `check_external_build`; an external-book browser E2E remains deferred (as in
  Sprint 2).
- **Runner:** Playwright 1.62.1 (chromium) via the foreground `serve-dist.mjs`,
  now with the `html` reporter (produces `playwright-report/`).
- **Command:** `npx playwright test`
- **Head SHA:** `a72a22bcff289d2938acb4f20be0b414914f4ec1`
- **Result:** 8 passed / 0 failed / 8 total (7.3s) — the Sprint 0–2 suite,
  unchanged, confirming the fixture-image and CI changes did not regress the
  sample reader. `playwright-report/index.html` was generated (the CI artifact
  now has content).
