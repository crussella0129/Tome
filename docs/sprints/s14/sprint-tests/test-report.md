# Sprint 14 Test Report

## Intent Verification
| Intent | Acceptance criterion | EARS / tests | Result | Intent evidence update |
|--------|----------------------|---------------|--------|------------------------|
| [INT-0012](../../../intents/INT-0012-desktop-shell-electron.md) | 1 — loads `dist/` offline via a protocol mapping root-absolute URLs to `dist/` (routes → `index.html`; `/_astro/…`, `/fonts/…`, `/search-index.json`) | T-032 `test_resolve_root_index`, `test_resolve_route_index`, `test_resolve_asset_passthrough`; E2E `test_electron_reader_offline` | **pass** | Test evidence adds this report |
| [INT-0012](../../../intents/INT-0012-desktop-shell-electron.md) | 2 — internal nav in-app; external http(s) → OS browser; only http/https opened | E2E `test_electron_external_link` (https → `openExternal`, `mailto:` denied, window count 1, origin stays `app://tome`) | **pass** | (as above) |
| [INT-0012](../../../intents/INT-0012-desktop-shell-electron.md) | 3 — secure window (isolation on / node off / sandbox on); protocol scoped to `dist/`; `npm run electron`; main under `electron/` | E2E `test_electron_secure_config` + unit `test_resolve_escape_null` (escape → `null`) | **pass** | (as above) |
| [INT-0012](../../../intents/INT-0012-desktop-shell-electron.md) | 4 — Playwright-Electron launches app; chapter renders offline (heading + sidebar) and search index reachable | E2E `test_electron_reader_offline` + `test_electron_search_index` | **pass** | (as above) |

All four INT-0012 criteria are met → **INT-0012 is eligible for `realized`** (Loop Phase).

## Summary
- Unit: **89 passed / 0 failed** (Vitest, 17 files) — incl. the new `resolveDistPath` +
  `contentTypeFor` suite (route/asset mapping, `../`-escape → `null`, content-types).
- E2E (desktop shell): **4 passed / 0 failed** (`npm run check:electron`, Playwright
  `_electron`) — offline reader + sidebar, offline search-index fetch, secure window
  config, and external-link routing.
- E2E (browser, regression): **15 passed / 0 failed** (`npm run test:e2e`) — proves the
  `serve-dist` → shared-`resolveDistPath` extraction is behavior-preserving.
- Gates: `check_external`, `check_multibook`, `check_search`, `check_livereload` — all
  **OK**, tree restored to HEAD.
- `astro check`: **0 errors / 0 warnings / 0 hints**.
- CI status: green **expected** on the PR (all CI-run suites/gates green locally; the
  Electron E2E is a dedicated local/opt-in gate).

## Tested head
- **Head SHA:** `da7af92de3ebadc65a31db47ecdccfc6bfc25da8` (tip of `dev`).
- Local canonical-runner: `vitest` 89 · `check:electron` 4 · `playwright` (browser) 15 ·
  `check_external` OK · `check_multibook` OK · `check_search` OK · `check_livereload` OK ·
  `astro check` 0 errors. CI conclusion to be observed on the Sprint 14 PR.

## Failures
None.

## Technical Debt Identified
- **Open-any-library at runtime** and **signed installers** (electron-builder) are the
  declared follow-on intents (see INT-0012 Consequences) — not debt, but the next slices.
- The recurring Windows-only `load-books.test.ts` temp-cleanup `EPERM` remains cosmetic
  (CI is Linux); it did not fire this run. No new backlog opened.

## Coverage Observations
INT-0012 is proven at unit (the pure `resolveDistPath`: root/route → `index.html`,
extensioned asset passthrough with query/hash stripped, and every `../`-escape /
malformed-encoding path refused as `null` — the security scope of criterion 3),
integration (the browser Playwright suite driving the real static server through the
shared resolver, confirming the extraction preserved behavior), and end-to-end (a real
Electron window loading `app://tome/` fully offline: chapter heading + sidebar, an
in-app `search-index.json` fetch, the secure `webPreferences` with no renderer Node
primitives, and external http(s) routed to the OS browser while other schemes are
denied). The one boundary verified by construction rather than direct assertion — the
two-token `npm run electron` alias — is documented in `critique.md` C-001; the entry
point it launches is fully exercised.
