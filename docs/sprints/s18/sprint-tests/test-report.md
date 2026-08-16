# Sprint 18 Test Report

## Intent Verification
| Intent | Acceptance criterion | Verification | Result | Intent evidence update |
|--------|----------------------|--------------|--------|------------------------|
| [INT-0017](../../../intents/INT-0017-tauri-production-port.md) | 1 — productionized branding + theme-aware icon | config `productName`/`identifier`; launch title "Tome" + dark "T" titlebar icon (dark OS theme), captured + surfaced to user | **pass** | Test evidence adds this report |
| [INT-0017](../../../intents/INT-0017-tauri-production-port.md) | 2 — zoom hardened, opens at 100% | `zoom_hotkeys_enabled(false)` + WebView2 `IsZoomControlEnabled(false)`; behavioural, surfaced to user | **pass** (caveat C-001/C-002) | (as above) |
| [INT-0017](../../../intents/INT-0017-tauri-production-port.md) | 3 — `tauri:dev`/`tauri:build`; Windows installer; icon set from the mark | `npm run tauri:build` → NSIS (2.0 MB) + MSI (3.1 MB), unsigned; icons from the Tome "T" | **pass** | (as above) |
| [INT-0017](../../../intents/INT-0017-tauri-production-port.md) | 4 — built app renders a chapter offline + coexistence | launch renders Bibliotheca + Colophon chapter offline; Vitest 97, Electron 6/6, browser 21/21, four gates + `astro check` green | **pass** | (as above) |

All four criteria met → **INT-0017 is eligible for `realized`** (Loop Phase).

## Summary
- **Port outcome:** Tome is now a real, installable **native Tauri app on Windows** at
  Electron parity — the **"Tome"** window with a **theme-aware "T" icon**, **zoom
  hardening** (keyboard via `zoom_hotkeys_enabled`, pinch/Ctrl-wheel via WebView2
  `IsZoomControlEnabled`), secure offline `dist/` loading, and external links to the OS
  browser. `npm run tauri:build` emits an **8.9 MB** exe and unsigned installers (NSIS
  **2.0 MB**, MSI **3.1 MB**) — vs Electron's bundled ~348 MB. The built app launches and
  renders the Bibliotheca **and** a chapter (Colophon, via native directory routing)
  **offline**; captures surfaced to the user for the visual sign-off.
- **Coexistence:** Vitest **97/97**, `astro check` **0 errors**, `check:electron`
  **6/6**, browser `test:e2e` **21/21**, and `check:external`/`multibook`/`search`/
  `livereload` all green. The port changed no existing web/Electron code; the two shells
  coexist, Electron still the default/fallback.

## Tested head
- **Head SHA:** `026e8a0dfb667f23bf5d309abf331d94cea8de78` (tip of `dev`).
- Toolchain: Rust (cargo `build`/`fmt`/`clippy` clean), `@tauri-apps/cli` 2.11.4,
  `tauri` 2.11.5, WebView2 (system). Rust deps added: `image-png` (tauri feature) +
  Windows-only `webview2-com 0.38` (the version Tauri already resolves).

## Failures
None. During build the clippy pass flagged a `false.into()` `useless_conversion` (the
WebView2 setter takes a plain `bool`) — fixed to `false`, re-verified 0 warnings.

## Technical Debt Identified
- **No automated Tauri E2E** — the theme-icon swap, an accidental-pinch negative test,
  and external-link click are verified by launch/construction, not by a driver
  (critique C-001/C-002). A `tauri-driver`/WebdriverIO harness is the named follow-up.
- **Linux/WebKitGTK parity unverified** — Windows/WebView2 only; the reason Electron
  stays the default/fallback. A follow-on intent.
- **Unsigned installers** — no code-signing certificate this sprint; a follow-on intent.
- The chapter screenshot uses a scripted click (capture tooling, not product behaviour;
  critique C-003) — the deterministic Bibliotheca shot carries the offline+branding proof.

## Coverage Observations
The port's central, machine-observable promises — an installable app, offline render of
the whole reader (Bibliotheca + a chapter via native routes), and full coexistence with
the untouched web/Electron suites — are all verified green at the tested head. The
remaining criteria (theme-aware icon, zoom lock) are visual/behavioural; they are
surfaced to the user for sign-off, sit on an objective floor (title reads "Tome", clippy
clean, canonical WebView2 API, the parity contract E2E-asserted in the Electron shell),
and their automated coverage is correctly deferred to the WebDriver-E2E follow-up that
this port unlocks — alongside Linux parity and code-signing.
