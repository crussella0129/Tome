Finalized - DO NOT EDIT

# Sprint 18 Build Plan

## Intents
- [INT-0017](../../../intents/INT-0017-tauri-production-port.md) — state: planned; acceptance criteria covered: 1 (branding + theme icon — T-044/T-045), 2 (zoom hardening — T-045), 3 (launch scripts + installer — T-044/T-046), 4 (verify + coexistence — T-046).

## Schema Tree
- Sprint Goal: production Tauri port on Windows (Electron parity + installer)
  - Productionize
    - T-044: branding, icon set, scripts, zoom-hotkeys config
  - Parity
    - T-045: theme-aware icon + zoom hardening
  - Package + verify
    - T-046: installer, launch verification, coexistence, docs

## Execution Sequence

### T-044: Productionize branding + icon set + scripts
- **Intent:** [INT-0017](../../../intents/INT-0017-tauri-production-port.md)
- **Touches:** `src-tauri/tauri.conf.json`, `src-tauri/icons/*` (regenerated), `package.json` (`tauri:dev`/`tauri:build`)
- **Depends on:** (none)
- **Acceptance criterion:** INT-0017 #1, #3.
- **Success criterion (EARS):**
  - **WHEN** the Tauri app is built, **THEN** `tauri.conf.json` **SHALL** carry `productName` "Tome", `identifier` `com.tome.desktop`, `frontendDist: ../dist`, and `csp: null`; the bundle icon set **SHALL** be generated from the Tome "T" mark via `tauri icon`; and `npm run tauri:dev` / `npm run tauri:build` **SHALL** run and package the app.
- **Notes:** produce a high-res "T" master (via `make-icon`'s render or upscaling `electron/assets/icon-dark.png`) and run `npm run tauri icon <master>` to regenerate `src-tauri/icons/`. The window is created in code (`app.windows: []`), so the window title "Tome" and the keyboard-zoom disable are applied on the `WebviewWindowBuilder` in T-045 — not in config (a `zoomHotkeysEnabled` key under an empty `app.windows[]` would govern no window). This task owns the static branding/bundle fields + icon set + scripts.

### T-045: Theme-aware window icon + zoom hardening (Electron parity)
- **Intent:** [INT-0017](../../../intents/INT-0017-tauri-production-port.md)
- **Touches:** `src-tauri/src/lib.rs`, `src-tauri/Cargo.toml` (webview2 hook crate if needed), the two "T" icon PNGs embedded
- **Depends on:** T-044
- **Acceptance criterion:** INT-0017 #1, #2.
- **Success criterion (EARS):**
  - **WHEN** the window opens with the title "Tome", and **WHEN** the OS theme changes (`WindowEvent::ThemeChanged`), **THEN** the shell **SHALL** set the window icon to the near-black "T" in dark mode and the ink-on-parchment "T" in light mode (from `window.theme()` + `WebviewWindow::set_icon`), matching the Electron shell.
  - **WHEN** the app runs, **THEN** user zoom **SHALL** be disabled so an accidental pinch/Ctrl-wheel gesture cannot change the zoom or collapse the layout, and the app opens at 100% — pinch/Ctrl-wheel via WebView2 `IsZoomControlEnabled(false)` through `with_webview`, and keyboard (Ctrl+/-) via the builder's `.zoom_hotkeys_enabled(false)`.
- **Notes:** embed the two icon PNGs (`include_bytes!`) → `tauri::image::Image` → `set_icon`; the dark/light decision mirrors `electron/icon-variant.cjs`'s `resolveIconVariant`. Verify the WebView2 zoom hook empirically (as the Electron zoom was); if impractical, fall back to `zoomHotkeysEnabled:false` + a `set_zoom(1.0)` reset and record the residue.

### T-046: Package, verify, coexistence + docs
- **Intent:** [INT-0017](../../../intents/INT-0017-tauri-production-port.md)
- **Touches:** `docs/sprints/s18/sprint-tests/` (verification notes + screenshot), `README.md`
- **Depends on:** T-044, T-045
- **Acceptance criterion:** INT-0017 #4.
- **Success criterion (EARS):**
  - **WHEN** `npm run tauri:build` runs, **THEN** it **SHALL** produce a native Windows installer (NSIS and/or MSI, unsigned), recorded with its path and size.
  - **WHEN** the built app is launched, **THEN** a chapter **SHALL** render offline with the Tome window icon and locked zoom (captured as a screenshot, surfaced to the user for sign-off), **AND** the Electron shell, its E2E, and every existing gate **SHALL** remain green (coexistence).
- **Notes:** run `tauri build`; capture the built window (PrintWindow, as in the spike). Re-run `npm run check:electron` + `npx vitest run` + `npm run test:e2e` + the four `check:*` gates + `astro check`. README gains a short "Tauri (native, ~9 MB installer)" note under Desktop app. Automated WebDriver E2E is deferred (a follow-up).
