# Sprint 19 Research Report

## Intents Reviewed

- [INT-0018 — Tauri desktop shell (Linux / WebKitGTK parity)](../../intents/INT-0018-tauri-linux-parity.md)
  — **created** this sprint (`proposed`). Realizes INT-0017's named Linux/WebKitGTK
  follow-on: bring the Windows-ported Tauri shell to Linux parity, built + verified via
  WSL2 + WSLg on this host.

## 1. Sprint Goal

Bring the Tauri v2 shell to **Linux (WebKitGTK) parity** from the same `src-tauri/`
codebase: compile against webkit2gtk-4.1, load the built `dist/` offline, route external
links to the OS browser, carry the "Tome" branding, and package a native Linux bundle
(`.deb` at minimum). Build it in **WSL2 Ubuntu 26.04** and verify a launched render via
**WSLg**, keeping Windows Tauri + Electron + all gates green (Electron stays the default).

## 2. Existing Code Survey

| File | Relevance |
|------|-----------|
| src-tauri/src/lib.rs | The shell. Already Linux-safe: `disable_webview_zoom` is `#[cfg(target_os = "windows")]` with a `#[cfg(not(windows))]` **no-op** fallback; `apply_theme_icon`/`set_icon`, `zoom_hotkeys_enabled(false)`, `on_navigation`, and the embedded icons are cross-platform. The Linux zoom question (pinch/Ctrl-scroll) lands in the currently-no-op non-Windows path. |
| src-tauri/Cargo.toml | Already cross-platform: `webview2-com` is under `[target.'cfg(windows)'.dependencies]` (not pulled on Linux); `tauri` `image-png` feature is portable. No Linux-only deps declared yet (none needed at the crate level — WebKitGTK is a system lib via `tauri`/`wry`). |
| src-tauri/tauri.conf.json | `bundle.targets: "all"`, `frontendDist: ../dist`, `csp: null`, `productName: "Tome"`, `identifier: com.tome.desktop`. On Linux, `"all"` → deb/rpm/appimage (subject to host tooling). May add Linux bundle metadata (category, `.desktop`). |
| src-tauri/icons/* | The Tome "T" set (icon.png + sizes) — used for the Linux window icon and the bundled `.desktop` launcher icon. |
| README.md — "Also native — Tauri shell (Windows)" | The doc surface to extend from "(Windows)" to Windows **+ Linux**. |
| WSL probe (this phase) | Ubuntu 26.04, Rust 1.95 (rustup), **node MISSING** (npm present), `libwebkit2gtk-4.1-dev` 2.52.3 + libsoup-3.0/gtk-3/rsvg/ayatana-appindicator all apt-available, `dpkg-deb` present (rpm/appimage tooling absent), **WSLg display live** (`DISPLAY=:0`), project at `/mnt/c/Users/charl/Tome`. |

## 3. External Sources

- [Tauri v2 — Linux prerequisites (webkit2gtk-4.1, libsoup-3.0, build-essential, librsvg)](https://v2.tauri.app/start/prerequisites/#linux)
- [Tauri v2 — Linux bundle formats (deb, rpm, AppImage) & the AppImage bundler tooling it fetches](https://v2.tauri.app/distribute/)
- [WSLg — running Linux GUI apps on Windows 11 (Wayland/X display, `DISPLAY`/`WAYLAND_DISPLAY`)](https://learn.microsoft.com/en-us/windows/wsl/tutorials/gui-apps)
- [WebKitGTK — `webkit_web_view_set_zoom_level` (zoom is API-driven; no WebView2-style "disable user zoom" flag)](https://webkitgtk.org/reference/webkit2gtk/stable/)
- [wry/Tauri — `zoom_hotkeys_enabled` applies cross-platform (keyboard Ctrl +/- zoom)](https://v2.tauri.app/reference/config/)

## 4. Risks, Unknowns, Dependencies

- **Ubuntu 26.04 is bleeding-edge.** webkit2gtk-4.1 2.52.3 is apt-available (verified),
  but 26.04 + webkit 2.52 is newer than Tauri 2.11's most-tested matrix. Mitigation:
  build early; if a webkit ABI/name mismatch appears, pin the dev package or fall back to
  a 24.04 WSL distro / Docker image.
- **node absent in WSL.** `npm run tauri:build` chains `npm run build` (needs node).
  Mitigation: reuse the **portable Windows-built `dist/`** (static output) and run only
  the Rust/tauri bundling in WSL (`cargo tauri build`), or install node in WSL. Prefer
  reusing `dist/` to avoid a second toolchain.
- **Build location / filesystem.** Building under `/mnt/c` (9p) is slow and can hit
  cargo file-lock issues. Mitigation: build in the WSL-native fs (copy `src-tauri` +
  `dist` + icons into `~`), then copy the `.deb`/screenshot back to `/mnt/c` for evidence.
- **Linux zoom parity.** WebView2's `IsZoomControlEnabled(false)` has no direct WebKitGTK
  analogue. WebKitGTK generally does **not** zoom the page on Ctrl+scroll by default (that
  was a WebView2 behavior), so the INT-0013 "layout collapse" risk may be absent on Linux;
  `zoom_hotkeys_enabled(false)` covers keyboard. Mitigation: verify empirically at launch;
  if Ctrl-scroll zoom is present, add a WebKitGTK signal handler in the non-Windows path.
- **Theme-aware icon on GTK.** `set_icon` sets the window icon; `WindowEvent::ThemeChanged`
  fidelity varies by desktop environment (and WSLg is a single compositor). Mitigation:
  set the icon at startup from `window.theme()`; treat the live theme-swap as best-effort
  and surface the render to the user.
- **GUI capture under WSLg.** WSLg composits Linux windows onto Windows; a Windows-side
  `PrintWindow` may not reach them. Mitigation: capture **inside** Linux (`grim` on
  Wayland, or `gnome-screenshot`/`import`), then copy the PNG to `/mnt/c`.
- **Provisioning is a local action.** Installing apt deps / node in WSL is user-authorized
  ("we have WSL…"), but must stay documented requirements, **not** committed machine-state
  claims (the Sprint-17 lesson).
- **Coexistence.** All changes must be additive / `cfg`-gated so the Windows build +
  Electron + gates stay green.

## 5. Recommended Approach

- **Provision + build (T-04x):** in WSL install the webkit2gtk-4.1 dev stack (+ node or
  reuse Windows `dist/`); build the shell in the WSL-native fs and `tauri build` → a
  Linux `.deb` (AppImage if the bundler resolves). Document the apt deps as requirements.
- **Linux parity in the shell (T-04x):** confirm the cross-platform paths hold on
  WebKitGTK — title "Tome", `set_icon`, `zoom_hotkeys_enabled`, `on_navigation`+opener
  (`xdg-open`); add a WebKitGTK zoom handler in the non-Windows branch **only if** launch
  shows Ctrl-scroll zoom collapsing the layout; add Linux bundle metadata if needed.
- **Verify + coexistence (T-04x):** launch under WSLg, capture the Bibliotheca + a chapter
  offline (Linux-side screenshot → `/mnt/c`), confirm an external link opens the OS
  browser; re-run the Windows-side suite (Vitest, astro check, `check:electron`,
  `test:e2e`, the four gates) + `cargo build`/clippy for the Windows target to prove
  coexistence; extend the README to Windows + Linux.

## Artifacts

- [INT-0018](../../intents/INT-0018-tauri-linux-parity.md) (created).
- This report; the WSL environment probes (Ubuntu 26.04 / Rust 1.95 / webkit2gtk-4.1
  2.52.3 / WSLg `DISPLAY=:0`); `src-tauri/` (already Linux-safe via `cfg` gating) as the
  base; the INT-0017 Windows port as the parity reference.
