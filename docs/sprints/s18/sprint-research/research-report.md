# Sprint 18 Research Report

## Intents Reviewed

- [INT-0017 — Tauri desktop shell (production port)](../../intents/INT-0017-tauri-production-port.md)
  — **created** this sprint (`proposed`). The production port the INT-0015 spike's
  "go" unlocked; distinct from the throwaway spike.

## 1. Sprint Goal

Take the proven Tauri spike to a **production port** on Windows: bring `src-tauri/`
to Electron parity (Tome branding, a **theme-aware window icon**, **zoom
hardening**) on top of the spike's secure offline `dist/` loading + external-link
routing, add launch scripts, and produce a native **installer**. Verified by build +
launch, with the Electron shell kept as the default/fallback (they coexist).
Linux/WebKitGTK parity, code-signing, an automated WebDriver E2E, and the
default-switch decision are follow-on intents.

## 2. Existing Code Survey

| File | Relevance |
|------|-----------|
| src-tauri/src/lib.rs | The spike shell: opener plugin + `WebviewWindowBuilder` with `on_navigation` (external → OS browser) at `index.html`. Productionize the title, and add theme-icon + zoom handling here. |
| src-tauri/tauri.conf.json | `frontendDist: ../dist`, `windows: []`, `csp: null`, `identifier: com.tome.desktop.spike`, default icons, `bundle.active: true`. Set real `productName`/`identifier`, Tome icons, and `zoomHotkeysEnabled: false`. |
| electron/main.cjs | Parity reference: theme-aware `currentIconPath()` + `setIcon` on `nativeTheme 'updated'`; zoom = `setVisualZoomLevelLimits(1,1)` + `zoom-changed` → `setZoomFactor(1)`. |
| electron/icon-variant.cjs | The pure `resolveIconVariant(override, systemPrefersDark)` + `iconBasename` — the same dark/light decision the Tauri shell should reuse conceptually. |
| electron/assets/icon-dark.png / icon-light.png | The Tome "T" mark in both palettes — the source for the Tauri runtime window icon (and to generate the bundle icon set via `tauri icon`). |
| scripts/make-icon.mjs | Renders the "T" in Mekzantine → the source PNG for `tauri icon` (a high-res master). |
| e2e/electron.spec.ts / playwright.electron.config.ts | The Electron shell's suite — must stay green (coexistence); the Tauri port does not touch it. |
| Config-schema probe (this phase) | `zoomHotkeysEnabled` exists (disables Ctrl+/- zoom). WebView2 `IsZoomControlEnabled(false)` (via Tauri `with_webview`) disables pinch/Ctrl-wheel — verify in build. |

## 3. External Sources

- [Tauri v2 — window icons at runtime (`WebviewWindow::set_icon`) + `WindowEvent::ThemeChanged`](https://v2.tauri.app/reference/rust/tauri/webview/struct.webviewwindow/)
- [Tauri v2 — `zoomHotkeysEnabled` window config + `with_webview` platform hook](https://v2.tauri.app/reference/config/)
- [Tauri v2 — the bundler / installers (NSIS, MSI) & (deferred) code-signing](https://v2.tauri.app/distribute/)
- [Tauri CLI — `tauri icon` (generate the platform icon set from one PNG)](https://v2.tauri.app/reference/cli/#icon)
- [WebView2 — `CoreWebView2Settings.IsZoomControlEnabled` (disable user zoom)](https://learn.microsoft.com/en-us/microsoft-edge/webview2/reference/win32/icorewebview2settings)

## 4. Risks, Unknowns, Dependencies

- **Zoom disable on WebView2.** `zoomHotkeysEnabled:false` covers keyboard zoom;
  pinch/Ctrl-wheel needs `IsZoomControlEnabled(false)` via `with_webview` (a Windows
  platform hook). Mitigation: implement the hook; verify empirically (as with
  Electron). If the hook proves fiddly, ship `zoomHotkeysEnabled:false` + a
  `set_zoom(1.0)` reset and document the residue.
- **Runtime theme icon.** `set_icon` + `ThemeChanged` should mirror Electron.
  Mitigation: set the icon from `window.theme()` on startup and on the event; verify
  visually (surfaced to the user).
- **Installer build weight.** `tauri build` compiles release + runs NSIS/MSI —
  minutes and a large `target/`. One-time; `target/` already git-ignored.
- **No automated E2E.** WebDriver (tauri-driver) is heavy/deferred (as in the
  spike); verify by build + launch + screenshot. Documented follow-up.
- **Signing / Linux.** No certificate and no Linux host here → unsigned installers +
  Linux parity are explicit follow-on intents; the default-switch waits on them.
- **Coexistence.** Must not disturb `electron/` or any gate. Mitigation: all changes
  under `src-tauri/` (+ `package.json` scripts); re-run the full existing suite.

## 5. Recommended Approach

- **Productionize + branding (T-044):** set `productName`/`identifier`, window title
  "Tome"; generate the Tauri icon set with `tauri icon` from the Tome "T" master;
  `zoomHotkeysEnabled:false`; `npm run tauri:dev`/`tauri:build` scripts.
- **Theme icon + zoom (T-045):** in `lib.rs`, pick the dark/light "T" from
  `window.theme()` and swap it on `ThemeChanged` (Electron parity), and disable
  WebView2 user zoom via `with_webview` (`IsZoomControlEnabled(false)`), opening at
  100%.
- **Package + verify (T-046):** `tauri build` → a Windows installer; launch the
  built app, confirm a chapter renders offline with the Tome icon + locked zoom
  (screenshot, surfaced to the user); re-run the Electron E2E + all gates to prove
  coexistence; a README "Desktop app — Tauri" note.

## Artifacts

- [INT-0017](../../intents/INT-0017-tauri-production-port.md) (created).
- This report; the spike (`src-tauri/`) as the base; `electron/main.cjs` +
  `icon-variant.cjs` as the parity reference; the `zoomHotkeysEnabled` schema probe.
