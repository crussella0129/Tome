# Sprint 14 — End-to-End Test Results

- **Tested head:** `da7af92de3ebadc65a31db47ecdccfc6bfc25da8`
- **Status:** possible (Electron feasibility confirmed in research; runs here)
- **Runner:** `npm run check:electron` = `astro build` then
  `playwright test --config playwright.electron.config.ts` (dedicated config: no
  `webServer`, `testMatch` the electron spec only — isolated from the browser suite).
- **Result: 4 passed / 4** (`e2e/electron.spec.ts`, driven by `_electron.launch`).
- **Intent:** [INT-0012](../../intents/INT-0012-desktop-shell-electron.md)

| Test | EARS clause | Assertion (SHALL) | Criterion | Result |
|------|-------------|-------------------|-----------|--------|
| `test_electron_reader_offline` | WHEN `_electron.launch` after build … THEN chapter heading + sidebar TOC | Window URL contains `app://tome/`; H1 "Introduction" visible; sidebar (`navigation` "Table of contents") lists "Getting Started" + "About" — offline, no dev server | 1, 4 | pass |
| `test_electron_search_index` | WHEN `fetch('/search-index.json')` … THEN non-empty records | `res.ok`; resolved URL is exactly `app://tome/search-index.json`; record count > 0 | 4 | pass |
| `test_electron_secure_config` | WHEN app starts … THEN secure `BrowserWindow` | `getLastWebPreferences()` = `{contextIsolation:true, nodeIntegration:false, sandbox:true}`; renderer has no `require`/`module`/`process` | 3 | pass |
| `test_electron_external_link` | WHEN link/`window.open` http(s) … THEN `openExternal` + not in-window; other scheme denied; app origin stays in-app | `window.open('https://example.com/')` recorded by a stubbed `shell.openExternal`; `mailto:` **not** recorded (denied); window count stays 1; app stays on `app://tome` origin | 2 | pass |

## Notes on determinism (flake screen)

- The app is launched against the **built** `dist/` (the `check:electron` script
  builds first; `beforeAll` also asserts `dist/index.html` exists), so there is no
  network or dev-server timing dependency.
- The external-link test **stubs** `shell.openExternal` in the main process to
  record calls instead of launching a real OS browser — deterministic, no external
  side effect, and it asserts the actual routing contract (http(s) out, other
  schemes denied, no in-app window).
- Serial mode (`workers: 1`), one shared app instance, closed in `afterAll`.

## Criterion → test coverage (all four met)

- **Criterion 1** (offline load via protocol): `test_resolve_*` (unit) + `test_electron_reader_offline`.
- **Criterion 2** (internal vs external links): `test_electron_external_link`.
- **Criterion 3** (secure config + protocol scoped to `dist/`): `test_electron_secure_config` + `test_resolve_escape_null` (unit).
- **Criterion 4** (chapter + search work): `test_electron_reader_offline` + `test_electron_search_index`.
