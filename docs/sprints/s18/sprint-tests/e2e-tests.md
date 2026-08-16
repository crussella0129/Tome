# Sprint 18 — End-to-End Test Results

- **Tested head:** `026e8a0dfb667f23bf5d309abf331d94cea8de78`
- **Status:** not-yet-possible (automated for the **Tauri** shell), by design
- **Intent:** [INT-0017](../../intents/INT-0017-tauri-production-port.md)

## Why the Tauri E2E is not automated (and what unlocks it)

An automated E2E of the *native Tauri window* needs a WebDriver harness
(`tauri-driver` + WebdriverIO / Edge WebDriver). Standing that up is one of the named
follow-on intents in INT-0017 (alongside Linux parity, code-signing, and the
default-switch) — disproportionate to add mid-port when the browser + Electron E2E
suites already exercise the identical `dist/`. The port is verified instead by a
deterministic build + launch + captured screenshots + the full untouched suite.

Note: the **browser** E2E (`npm run test:e2e`, 21/21) and the **Electron** E2E
(`npm run check:electron`, 6/6) both run against the same built `dist/` the Tauri shell
embeds, so the reader/search/scaling/nav behaviours are covered end-to-end; only the
native-shell wrapper is verified by launch rather than by driver.

## Port verification (criteria 1–4)

| Criterion | Verification | Result |
|---|---|---|
| 1 — productionized branding + theme-aware icon | config: `productName` "Tome", `identifier` `com.tome.desktop`; launch: process title "Tome" + the dark "T" titlebar icon on the dark OS theme (parity with `resolveIconVariant`) | **pass** (`evidence/tauri-bibliotheca.png`, `evidence/tauri-reader.png`; surfaced to the user) |
| 2 — zoom hardened, opens at 100% | `zoom_hotkeys_enabled(false)` (Ctrl +/-) + WebView2 `IsZoomControlEnabled(false)` (pinch/Ctrl-wheel); app opens at default scale | **pass** (behavioural; code paths in `lib.rs`; surfaced for the live check) |
| 3 — `tauri:dev`/`tauri:build`; Windows installer; icon set from the mark | `npm run tauri:build` → NSIS `Tome_0.1.0_x64-setup.exe` (2.0 MB) + MSI `Tome_0.1.0_x64_en-US.msi` (3.1 MB), unsigned; icons regenerated from the Tome "T" | **pass** |
| 4 — built app renders a chapter offline + coexistence | launch renders Bibliotheca **and** the Colophon chapter offline; Vitest 97, Electron 6/6, browser 21/21, four gates + `astro check` green | **pass** |

## Notes on determinism / limits
- Renders captured via `PrintWindow(PW_RENDERFULLCONTENT)` so the specific WebView2
  window is captured even when occluded (the technique proven in the INT-0015 spike).
- Coverage is **Windows/WebView2 only**. Linux/WebKitGTK parity is unverified and is a
  documented follow-on intent — the reason Electron stays the default/fallback.
- The theme-icon and zoom-lock are visual/behavioural and were **surfaced to the user**
  for sign-off; criterion 3 (installer) and criterion 4 (coexistence) are fully
  machine-verified.
