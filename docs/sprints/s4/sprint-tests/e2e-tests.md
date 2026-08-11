# Sprint 4 End-to-End Tests

- **Status:** possible — executed against the **default sample** (regression guard,
  criterion 5). The external/`docs`-layout render is covered at build level by
  `check_external_build`; an external-book browser E2E remains deferred (backlog T-205).
- **Runner:** Playwright 1.62.1 (chromium) via foreground `serve-dist.mjs`.
- **Command:** `npx playwright test`
- **Head SHA:** `1f249f509a68387a35c8327e70214c3433396d93`
- **Result:** 8 passed / 0 failed / 8 total (9.2s) — the Sprint 0–3 suite,
  unchanged, confirming the loader detection changes did not regress the sample
  reader.
