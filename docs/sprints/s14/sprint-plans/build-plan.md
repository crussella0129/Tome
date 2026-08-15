Finalized - DO NOT EDIT

# Sprint 14 Build Plan

## Intents
- [INT-0012](../../../intents/INT-0012-desktop-shell-electron.md) — state: planned; acceptance criteria covered: 1 (offline load via app protocol), 2 (internal vs external links), 3 (secure window + protocol scoped to `dist/` + `npm run electron` + main under `electron/`), 4 (Playwright-Electron proof).

## Schema Tree
- Sprint Goal: native Electron desktop shell rendering the built Tome offline
  - Shared dist resolver
    - T-032: `scripts/dist-resolve.mjs` pure resolver + `serve-dist.mjs` reuse
  - Electron shell
    - T-032: `electron/main.cjs` — app protocol, secure window, external links, launch scripts
  - Proof + docs
    - T-033: `e2e/electron.spec.ts` + `check:electron` + README

## Execution Sequence

### T-032: Electron shell — shared dist resolver, app protocol, secure window, external-link handling
- **Intent:** [INT-0012](../../../intents/INT-0012-desktop-shell-electron.md)
- **Touches:** `scripts/dist-resolve.mjs` (new), `scripts/serve-dist.mjs` (reuse resolver), `electron/main.cjs` (new), `package.json` (`electron` + `electron:start` scripts; `electron` devDep already installed), `src/lib/__tests__/dist-resolve.test.ts` (new)
- **Depends on:** (none)
- **Acceptance criterion:** INT-0012 criteria 1, 2, 3.
- **Success criterion (EARS):**
  - **WHEN** `resolveDistPath(urlPath, distRoot)` is called with the root path `"/"`, **THEN** it **SHALL** return the absolute path `<distRoot>/index.html`.
  - **WHEN** it is called with an extensionless route (e.g. `"/getting-started"`), **THEN** it **SHALL** return that route's directory `index.html` (`<distRoot>/getting-started/index.html`).
  - **WHEN** it is called with an asset path carrying a file extension (e.g. `"/_astro/app.js"`, `"/search-index.json"`), **THEN** it **SHALL** return that file's absolute path unchanged (passthrough), ignoring any `?query`/`#hash`.
  - **WHEN** it is called with a path that escapes `distRoot` (e.g. `"/../secret"`, `"/a/../../etc"`), **THEN** it **SHALL** return `null` (never a path outside `distRoot`).
  - **WHEN** the Electron app starts, **THEN** it **SHALL** register a `standard`, `secure`, fetch-enabled custom scheme and `protocol.handle` it to serve `dist/` via `resolveDistPath` (a `null` resolution → a `404` Response, never a filesystem read outside `dist/`), then open a `BrowserWindow` configured `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true` and `loadURL('app://tome/')`, so the Bibliotheca/reader, `/search-index.json`, `/_astro/…`, and `/fonts/…` all load with no dev server and no network.
  - **WHEN** a link, in-window navigation, or `window.open` targets an `http`/`https` URL, **THEN** the shell **SHALL** open it in the OS default browser via `shell.openExternal` and keep it out of the app window; **WHEN** it targets the `app://tome` origin, **THEN** it **SHALL** navigate in-app; **WHEN** it targets any other scheme, **THEN** it **SHALL** deny it.
- **Notes:** `resolveDistPath` is pure — strip `?`/`#`, `decodeURIComponent`, `normalize`, strip leading `/` and `../` segments, `join` under `distRoot`, and reject an escape by checking `relative(distRoot, candidate)` does not begin `..`/is not absolute (returns `null`); directory route = root, trailing `/`, or `extname === ''` → append `index.html`; else passthrough. This mirrors — and hardens — `serve-dist.mjs`'s existing `resolveFile` (Astro emits only extensionless routes + extensioned files, so the heuristic is exact). `serve-dist.mjs` imports the shared resolver + a shared `contentTypeFor(path)` (the existing `TYPES` map moves into `dist-resolve.mjs`); its E2E webServer must stay green (`null` → `404`, missing file → `404` as before). `electron/main.cjs` is CommonJS (matches the feasibility probe) and reaches the ESM resolver via dynamic `import('../scripts/dist-resolve.mjs')` inside `app.whenReady()` (no `require(ESM)`). External links use `setWindowOpenHandler` (deny + `openExternal` for http/https) plus a `will-navigate` guard (allow only `app://tome`, external http/https → `openExternal` + `preventDefault`). No preload (nothing privileged is exposed to the renderer). `npm run electron` = `astro build` then launch; `electron:start` launches against an existing `dist/`.

### T-033: Electron end-to-end proof + documentation
- **Intent:** [INT-0012](../../../intents/INT-0012-desktop-shell-electron.md)
- **Touches:** `e2e/electron.spec.ts` (new), `playwright.electron.config.ts` (new — dedicated config, no `webServer`, its own `testMatch`), `package.json` (`check:electron` script), `README.md` (new "Desktop app" section)
- **Depends on:** T-032
- **Acceptance criterion:** INT-0012 criterion 4.
- **Success criterion (EARS):**
  - **WHEN** the test launches the built app with Playwright's `_electron.launch` (after `astro build`), **THEN** the first window **SHALL** render a chapter offline — its `<h1>` heading and the sidebar table-of-contents both present — proving the app-protocol reader path.
  - **WHEN** the test evaluates `fetch('/search-index.json')` in the loaded page, **THEN** it **SHALL** resolve to `app://tome/search-index.json` and return a non-empty set of search records, proving offline search reachability.
  - **WHEN** the test inspects the shell's external-link handling for an `https` target, **THEN** it **SHALL** confirm the target is routed to `shell.openExternal` and not navigated in the app window.
- **Notes:** the spec uses Playwright's `_electron` launcher (outside the default `testMatch`, so the browser suite is untouched), launching `electron/main.cjs` with the built `dist/` present; it waits for `firstWindow()`, asserts the chapter heading + sidebar nav, and `page.evaluate`s the search-index fetch. External-link routing is asserted by driving the main-process handler (e.g. a synthetic http/https navigation) and observing `openExternal` is chosen and the window URL stays on `app://tome` — kept deterministic and offline. The default `playwright.config.ts` excludes the electron spec from its `testMatch` and defines a serve-dist `webServer`, so the electron E2E gets its **own** config — `playwright.electron.config.ts` (`testDir: 'e2e'`, `testMatch: '**/electron.spec.ts'`, **no** `webServer`, no browser projects) — keeping it fully isolated from the browser suite (which stays untouched). A `check:electron` npm script runs `astro build` then `playwright test --config playwright.electron.config.ts`. README gains a "Desktop app" section (build + `npm run electron`; note the two follow-on intents: opening an arbitrary local library, and signed installers).
