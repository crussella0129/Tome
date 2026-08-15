# Sprint 14 Research Report

## Intents Reviewed

- [INT-0012 — Desktop shell (Electron)](../../intents/INT-0012-desktop-shell-electron.md)
  — **created** this sprint (`proposed`). The desktop-shell slice INT-0003 deferred;
  a distinct native-app outcome, so a new chapter.

## 1. Sprint Goal

Ship a native **Electron** desktop app that loads the built Tome (`dist/`) offline
in a secure `BrowserWindow` via a custom app protocol (so root-absolute routes,
`/_astro/…` assets, `/fonts/…`, and `/search-index.json` all resolve with no dev
server and no network), with internal links staying in-app and external `http(s)`
links opening in the OS browser — launchable via `npm run electron` and proven by a
Playwright-Electron test. Delivers INT-0012's four criteria. Opening an arbitrary
local library (rebuild) and signed installers are the next intent(s).

## 2. Existing Code Survey

| File | Relevance |
|------|-----------|
| scripts/serve-dist.mjs | `resolveFile(urlPath)` already maps a request path to `dist/` — directory → `index.html`, else the file, with a `../`-escape guard. Extract this into a shared pure `resolveDistPath(urlPath, root)` and reuse it in the Electron protocol handler (and serve-dist). |
| dist/ (built) | What the shell serves: `index.html`, directory routes (`getting-started/index.html`), `_astro/*` (JS/CSS/optimized images), `fonts/*`, `search-index.json`. All referenced by **root-absolute** URLs. |
| astro.config.mjs | `site: 'https://example.com'`, default `base: '/'` → assets/links are `/…`. The shell's protocol must treat `/` as the `dist/` root (a plain `file://` load would break these). |
| src/components/SearchOverlay.tsx | Fetches `import.meta.env.BASE_URL + 'search-index.json'` = `/search-index.json` on open — the protocol must serve it for offline search. |
| package.json | Add `electron` scripts (`electron`, an offline `electron:build`); `electron@^43.4.0` is a devDependency (installed during the feasibility probe). |
| playwright.config.ts | E2E harness; the Electron spec uses Playwright's `_electron.launch` (a separate launcher, not the `webServer`), so it runs outside the default `testMatch`. |
| README.md | Documents features; add a "Desktop app" section. |
| Feasibility probe (this phase) | Empirical: `electron --version` = 43.4.0; a minimal app launched via `_electron.launch` returned its window title and closed cleanly — **build + automated test are both feasible here**. |

## 3. External Sources

- [Electron — `protocol.handle` / custom protocols (serving local content)](https://www.electronjs.org/docs/latest/api/protocol)
- [Electron — process sandbox & `contextIsolation` (secure defaults)](https://www.electronjs.org/docs/latest/tutorial/security)
- [Electron — `webContents.setWindowOpenHandler` + `shell.openExternal`](https://www.electronjs.org/docs/latest/api/web-contents#contentssetwindowopenhandlerhandler)
- [Playwright — Electron testing (`_electron.launch`)](https://playwright.dev/docs/api/class-electron)
- [electron-builder — packaging (the deferred distributable step)](https://www.electron.build/)

## 4. Risks, Unknowns, Dependencies

- **Absolute URLs.** `file://` would resolve `/…` to the filesystem root. Mitigation:
  a custom scheme (`app://` / `tome://`) whose handler maps `/` → `dist/` via
  `resolveDistPath`; register it before `BrowserWindow`, `loadURL('app://tome/')`.
- **Security.** A desktop shell must not expose Node or the filesystem to page JS.
  Mitigation: `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`,
  no preload with privileged APIs; the protocol rejects any path escaping `dist/`
  (reuse the `../`-guard); `shell.openExternal` only for `http`/`https`.
- **External links.** In-window navigation to `http(s)` (or `window.open`) must go to
  the OS browser. Mitigation: `setWindowOpenHandler` (deny + `openExternal`) and a
  `will-navigate` guard (allow only the `app://` origin; external → `openExternal`).
- **ESM vs CJS main.** Electron 43 supports ESM, but the main process is simplest and
  most robust as CommonJS (`electron/main.cjs`), matching the probe. Mitigation: use CJS.
- **Testing in this env.** Confirmed working (`_electron.launch`). The Electron spec
  runs via its own launcher; keep it out of the default Playwright `testMatch` (its
  own script) so the browser suite is unaffected.
- **Out of scope (declared).** Opening an arbitrary local folder at runtime (needs the
  build toolchain) and signed installers (electron-builder) are the next intent(s).

## 5. Recommended Approach

- **Shared resolver (T-032):** extract `scripts/dist-resolve.mjs` — a pure
  `resolveDistPath(urlPath, distRoot)` (directory → `index.html`, `../`-escape → null),
  reused by `serve-dist.mjs` and the shell; unit-test it.
- **Electron shell (T-032):** `electron/main.cjs` — register a standard, secure scheme
  `app`; `protocol.handle('app', …)` serving `dist/` via `resolveDistPath` with correct
  content-types; a secure `BrowserWindow` (`contextIsolation`, no `nodeIntegration`,
  `sandbox`); `loadURL('app://tome/')`; `setWindowOpenHandler` + `will-navigate` →
  external `http(s)` via `shell.openExternal`, everything else stays in-app. Add
  `npm run electron` (`astro build` then launch) + an `electron:start` that launches
  against an existing `dist/`.
- **Proof + docs (T-033):** `e2e/electron.spec.ts` via `_electron.launch` — the window
  loads a chapter offline (heading + sidebar TOC present), and `/search-index.json` is
  fetchable in-app (search works); a `check:electron` npm script runs it. README adds a
  "Desktop app" section (build + run; note the follow-ups).
- **Tasks:** (T-032) shared resolver + Electron main + launch scripts + resolver unit
  test; (T-033) Playwright-Electron spec + `check:electron` script + README.

## Artifacts

- [INT-0012 — Desktop shell (Electron)](../../intents/INT-0012-desktop-shell-electron.md) (created)
- This report; feasibility probe evidence (`electron --version` 43.4.0; `_electron.launch`
  drove a window and closed cleanly); `dist/` structure + `serve-dist.mjs` resolution confirmed.
