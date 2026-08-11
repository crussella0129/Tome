# Sprint 2 End-to-End Tests

- **Status:** possible — executed against the **default sample** build (the
  regression guard for criterion 4). An external-book browser E2E is deferred
  (see critique); `gate_external_build` covers the external render at build level.
- **Runner:** Playwright 1.62.1 (chromium) via the foreground `serve-dist.mjs`.
- **Command:** `npx playwright test`
- **Head SHA:** `206333c48e40c4db311130515b8a86ad15445864`
- **Result:** 8 passed / 0 failed / 8 total (8.6s) — the full Sprint 0/1 suite,
  unchanged, confirming the bundled sample still renders exactly as before when
  `TOME_BOOK` is unset (INT-0002 criterion 4, no regression to INT-0001).
