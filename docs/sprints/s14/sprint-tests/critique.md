# Test Critique — Sprint 14

## Concerns

### C-001: "launchable via `npm run electron`" is proven by equivalence, not a direct script run
- **Where:** `INT-0012` acceptance criterion 3 / `e2e-tests.md` `test_electron_reader_offline`
- **Quote:** criterion 3 — "The app is launchable via `npm run electron`; the main process is small and lives under `electron/`."
- **Failure mode:** intent-coverage
- **Why it matters:** the E2E launches `electron/main.cjs` directly via `_electron.launch`; it does not literally invoke the `npm run electron` script, so the script wiring is verified by construction rather than by assertion.
- **Suggested response:** defer-with-rationale — `npm run electron` is `astro build && electron electron/main.cjs`, and `npm run electron:start` is exactly `electron electron/main.cjs`; the E2E launches that same `electron/main.cjs` entry (after a build, via `check:electron`), and the file demonstrably lives under `electron/`. The behavior of the entry point is fully asserted; only the trivial two-token npm alias is unexercised, which a launch smoke does not meaningfully add to. Documented in the README "Desktop app" section.

### C-002: the external-link test stubs `shell.openExternal`
- **Where:** `e2e-tests.md` `test_electron_external_link`
- **Quote:** "`window.open('https://example.com/')` recorded by a stubbed `shell.openExternal`"
- **Failure mode:** stub-leak
- **Why it matters:** a stub could, in principle, mirror the implementation instead of the contract it replaces.
- **Suggested response:** reject (the critique is wrong because …) — the stub replaces **only** the OS-browser side effect (`shell.openExternal`) at the true external boundary; the routing decision under test — `isExternalHttp`, `setWindowOpenHandler` returning `deny`, and the `will-navigate` guard — is all real production code. The test asserts the observable contract (http(s) handed out, `mailto:` denied, no in-app window, app stays on `app://tome`), not the stub's internals. Launching a real browser in CI would be the flaky, non-deterministic alternative.

## Confidence
proceed-with-caveats
