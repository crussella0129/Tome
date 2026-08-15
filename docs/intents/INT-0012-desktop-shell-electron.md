# INT-0012 — Desktop shell (Electron)

<!-- sprint-loop-intent-v2 -->
- **Intent ID:** INT-0012
- **State:** realized
- **Work evidence:** [Sprint 14 build plan (T-032–T-033)](../sprints/s14/sprint-plans/build-plan.md)
- **Completion evidence:** [T-032 completion (Sprint 14)](../work/completed-tasks.md#t-032-sprint-14), [T-033 completion (Sprint 14)](../work/completed-tasks.md#t-033-sprint-14)
- **Code evidence:** [shared dist resolver](../../scripts/dist-resolve.mjs), [Electron main (app:// protocol + secure window + external links)](../../electron/main.cjs)
- **Test evidence:** [Sprint 14 test report](../sprints/s14/sprint-tests/test-report.md)
- **Documentation evidence:** [README — Desktop app](../../README.md#desktop-app)

## Intent

Wrap Tome as a native desktop application (Electron-first, per standing guidance)
that renders the built library entirely **offline** in a native window — the
Bibliotheca, reader, search, and in-page navigation all working with no dev server
and no network — with links behaving natively (internal stays in-app, external
opens in the OS browser). This is the foundation the local-library-opening and
packaging work build on.

## Acceptance criteria

1. An Electron app loads the built Tome (`dist/`) in a native `BrowserWindow` via a
   custom app protocol that maps root-absolute URLs to `dist/` (directory routes →
   `index.html`; `/_astro/…`, `/fonts/…`, `/search-index.json`), so the reader, the
   Bibliotheca, search, and in-page navigation all work fully offline — no dev
   server and no network request leaves the app.
2. Internal navigation stays in the app window; an external `http`/`https` link
   opens in the OS default browser (never in the app window), and only `http`/`https`
   schemes are opened.
3. The window uses a secure configuration (context isolation on, Node integration
   off, sandbox on), and the protocol serves only files resolved **inside** `dist/`
   (no arbitrary filesystem access from the page). The app is launchable via
   `npm run electron`; the main process is small and lives under `electron/`.
4. An automated Playwright-Electron test launches the app, asserts a chapter renders
   offline (its heading + the sidebar table of contents) and that the search index
   is reachable and searchable, proving the shell end to end.

## Rationale

Tome is a mature static web reader; a native desktop shell — deferred as a future
intent back in INT-0003 — makes it an installable offline app and is the base for
opening arbitrary local libraries and producing distributables. Electron-first is
the standing platform choice (Tauri is a later optimization phase). Feasibility was
confirmed in research: Electron launches here and Playwright's `_electron` drives it.

## Alternatives

- Load `dist/` via `file://` with relative URLs. Rejected: Tome uses root-absolute
  URLs (`/…`) for routes, assets, and the search index; a custom protocol mapping
  `/` → `dist/` is the clean, robust approach and reuses the existing `serve-dist`
  resolution.
- Bundle a local HTTP server (e.g. `astro preview`) inside the app. Rejected: a
  custom protocol is lighter, needs no port, and keeps everything in-process/offline.

## Consequences

- The shell reuses `dist/` and the existing route/asset resolution; a build precedes
  launch. Opening an **arbitrary** local library at runtime (rebuilding against a
  chosen folder) and producing signed **distributables** (electron-builder) are the
  immediate follow-on intent(s) — this slice establishes the shell itself.
- Security posture: context isolation, no Node integration in the renderer, sandbox,
  a protocol scoped to `dist/` (path-escape rejected), and `shell.openExternal` gated
  to `http`/`https`.

## Transition history

- 2026-08-15: created as `proposed` during Sprint 14 research — the desktop-shell
  slice INT-0003 deferred, now that the web reader (view, library, search, nav,
  content) is complete; Electron feasibility (launch + Playwright test) confirmed.
- 2026-08-15: `proposed → planned` — Sprint 14 plans T-032 (shared `dist-resolve.mjs`
  pure resolver reused by `serve-dist` + the shell; `electron/main.cjs` with a secure
  `app://` protocol scoped to `dist/`, a secure `BrowserWindow`, and external-link
  routing; `npm run electron`) and T-033 (Playwright-Electron E2E + `check:electron` +
  README), covering all four acceptance criteria.
- 2026-08-15: `planned → active` — Sprint 14 Build Phase began implementing T-032–T-033
  against the locked plans.
- 2026-08-15: `active → realized` — T-032–T-033 delivered all four criteria: a native
  Electron shell renders the built `dist/` fully offline via a secure `app://tome/`
  protocol (a shared pure `resolveDistPath` maps root-absolute routes/assets/the search
  index into `dist/`, refusing any path that escapes it), in a window with context
  isolation on, Node integration off, and sandbox on; internal navigation stays in-app
  while external `http(s)` links open in the OS browser and other schemes are denied.
  Proven by `resolveDistPath` unit tests + a Playwright-`_electron` E2E (offline chapter
  + sidebar, in-app `search-index.json` fetch, secure `webPreferences`, external-link
  routing); the `serve-dist` extraction was verified regression-free by the browser
  suite (15/15). Opening an arbitrary local library and signed installers remain the
  next intent(s).
