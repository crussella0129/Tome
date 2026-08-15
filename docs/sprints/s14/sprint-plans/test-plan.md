Finalized - DO NOT EDIT

# Sprint 14 Test Plan

## Intent Traceability
| Intent | Acceptance criterion | Build task / EARS clause | Verification |
|--------|----------------------|--------------------------|--------------|
| [INT-0012](../../../intents/INT-0012-desktop-shell-electron.md) | 1 — app loads `dist/` offline via a protocol mapping root-absolute URLs to `dist/` (routes → `index.html`; `/_astro/…`, `/fonts/…`, `/search-index.json`) | T-032 / WHEN `resolveDistPath("/")` … THEN … `<distRoot>/index.html`; WHEN extensionless route … THEN dir `index.html`; WHEN extensioned asset … THEN passthrough; WHEN app starts … THEN handle `app` scheme + `loadURL('app://tome/')` | `test_resolve_root_index`, `test_resolve_route_index`, `test_resolve_asset_passthrough`, `test_electron_reader_offline` |
| [INT-0012](../../../intents/INT-0012-desktop-shell-electron.md) | 2 — internal nav stays in-app; external `http`/`https` → OS browser; only http/https opened | T-032 / WHEN link/`window.open` targets http(s) … THEN `openExternal` + not in-window; WHEN app origin … THEN in-app; WHEN other scheme … THEN deny | `test_electron_external_link` |
| [INT-0012](../../../intents/INT-0012-desktop-shell-electron.md) | 3 — secure window (contextIsolation on, nodeIntegration off, sandbox on); protocol serves only inside `dist/`; `npm run electron`; main under `electron/` | T-032 / WHEN path escapes `distRoot` … THEN `null`; WHEN app starts … THEN secure `BrowserWindow` config | `test_resolve_escape_null`, `test_electron_secure_config` |
| [INT-0012](../../../intents/INT-0012-desktop-shell-electron.md) | 4 — Playwright-Electron launches app; a chapter renders offline (heading + sidebar TOC) and search index is reachable/searchable | T-033 / WHEN `_electron.launch` … THEN chapter heading + sidebar; WHEN `fetch('/search-index.json')` … THEN non-empty records | `test_electron_reader_offline`, `test_electron_search_index` |

## Unit Tests
### T-032 unit tests — `src/lib/__tests__/dist-resolve.test.ts`
- **Intent:** [INT-0012](../../../intents/INT-0012-desktop-shell-electron.md)
- `test_resolve_root_index`: `resolveDistPath('/', dist)` → `<dist>/index.html` (criterion 1).
- `test_resolve_route_index`: `resolveDistPath('/getting-started', dist)` → `<dist>/getting-started/index.html`; a trailing-slash route resolves identically (criterion 1).
- `test_resolve_asset_passthrough`: `resolveDistPath('/_astro/app.js', dist)` and `resolveDistPath('/search-index.json?v=1', dist)` → the file path unchanged, query/hash stripped (criterion 1).
- `test_resolve_escape_null`: `resolveDistPath('/../secret', dist)` and `resolveDistPath('/a/../../etc/passwd', dist)` → `null` (criterion 3 — no filesystem read outside `dist/`).
- Stubs: none (pure function; `distRoot` is a fixed string).

## Integration Tests
### `serve-dist` reuse (regression) — existing browser Playwright suite
- **Intents:** [INT-0012](../../../intents/INT-0012-desktop-shell-electron.md)
- The existing `reader.spec.ts` + `search.spec.ts` run against `serve-dist.mjs`, which now resolves via the shared `resolveDistPath`; their continued green proves the extraction is behavior-preserving (routes, `_astro/*`, `search-index.json` still served; escape/missing → `404`).

## End-to-End Tests
- **Status:** possible
- `test_electron_reader_offline`: `_electron.launch(electron/main.cjs)` with `dist/` built → first window at `app://tome/`; a chapter's `<h1>` heading and the sidebar table-of-contents are visible with no dev server/network (criteria 1, 4).
- `test_electron_search_index`: in the loaded page, `fetch('/search-index.json')` (→ `app://tome/search-index.json`) returns a non-empty records array (criterion 4 — search reachable offline).
- `test_electron_external_link`: an `https` navigation/`window.open` target is routed to `shell.openExternal` and the app window stays on the `app://tome` origin; a non-http(s), non-app scheme is denied (criterion 2).
- `test_electron_secure_config`: the created `BrowserWindow`'s `webPreferences` are `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true` (criterion 3). (Asserted alongside the launch spec via the web-contents/preferences the launcher exposes; the protocol-scope half of criterion 3 is covered by `test_resolve_escape_null`.)
- Run via the dedicated `check:electron` npm script (`astro build` then `playwright test --config playwright.electron.config.ts`) — a standalone Playwright config (`testMatch: '**/electron.spec.ts'`, no `webServer`, no browser projects), so the electron E2E is fully isolated and the browser suite (`reader.spec.ts`/`search.spec.ts`) is unaffected.
