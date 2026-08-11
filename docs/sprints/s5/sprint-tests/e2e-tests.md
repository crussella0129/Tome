# Sprint 5 End-to-End Tests

- **Status:** possible — executed against the **default sample** (regression guard).
  Live reload's own end-to-end is `check_live_reload` (a dev-server gate); the
  Playwright suite here proves the shared-module refactor + the dev-only
  integration didn't regress the sample reader.
- **Runner:** Playwright 1.62.1 (chromium) via foreground `serve-dist.mjs`.
- **Command:** `npx playwright test`
- **Head SHA:** `2232715f0f768477920356e7be746b58253e83cb`
- **Result:** 8 passed / 0 failed / 8 total (28.7s) — the Sprint 0–4 suite,
  unchanged. The live-reload integration is dev-only (`astro:server:setup`), so
  the built/preview site the E2E runs against is identical to before.
