Finalized - DO NOT EDIT

# Sprint 19 Build Plan

## Intents
- [INT-0018](../../../intents/INT-0018-tauri-linux-parity.md) — state: planned; acceptance criteria covered: 1 (Linux build + package — T-047), 2 (offline render on WebKitGTK — T-048), 3 (branding + zoom parity — T-048), 4 (coexistence + docs — T-049).

## Schema Tree
- Sprint Goal: Tauri shell to Linux/WebKitGTK parity (WSL-built, WSLg-verified)
  - Build
    - T-047: Linux build via WSL + native `.deb` package
  - Parity
    - T-048: WebKitGTK launch verification + Linux parity fixes
  - Verify + docs
    - T-049: coexistence (Windows/web green) + README/docs

## Execution Sequence

### T-047: Linux build via WSL + native package
- **Intent:** [INT-0018](../../../intents/INT-0018-tauri-linux-parity.md)
- **Touches:** `scripts/build-linux.sh` (new), `src-tauri/tauri.conf.json` (Linux bundle metadata if needed)
- **Depends on:** (none)
- **Acceptance criterion:** INT-0018 #1.
- **Success criterion (EARS):**
  - **WHEN** the shell is built in WSL Ubuntu against webkit2gtk-4.1, **THEN** the same `src-tauri/` **SHALL** compile and `tauri build` **SHALL** produce a native Linux **`.deb`** (AppImage best-effort if the bundler tooling resolves), recorded with path + size.
- **Notes:** provision WSL (`apt install libwebkit2gtk-4.1-dev libsoup-3.0-dev libgtk-3-dev librsvg2-dev build-essential libayatana-appindicator3-dev`; Rust 1.95 already present). Build in the **WSL-native fs** (copy `src-tauri` + the Windows-built `dist/` + icons + Cargo files to `~`), not `/mnt/c` (9p slowness/locks). `scripts/build-linux.sh` documents the reproducible steps + apt requirements. Binaries are **not committed** (`target/` git-ignored) — only path/size recorded. Provisioning is a user-authorized local action, documented as requirements, never committed machine state.

### T-048: WebKitGTK launch verification + Linux parity
- **Intent:** [INT-0018](../../../intents/INT-0018-tauri-linux-parity.md)
- **Touches:** `src-tauri/src/lib.rs` (WebKitGTK zoom handler in the `cfg(not(windows))` path **only if** launch reveals a gap), `docs/sprints/s19/sprint-tests/evidence/*` (screenshots)
- **Depends on:** T-047
- **Acceptance criterion:** INT-0018 #2, #3.
- **Success criterion (EARS):**
  - **WHEN** the built app runs under WSLg, **THEN** it **SHALL** render a chapter **offline** with the Tome branding (title "Tome" + theme-aware icon, best-effort on GTK) and route external `http(s)` links to the OS browser (`xdg-open`).
  - **WHEN** an accidental pinch / Ctrl-scroll gesture occurs, **THEN** it **SHALL NOT** shrink the viewport and collapse the reader into the mobile drawer.
- **Notes:** WebKitGTK generally does not zoom on Ctrl+scroll by default (a WebView2-only behavior), so the existing `cfg(not(windows))` no-op + `zoom_hotkeys_enabled(false)` likely already satisfy #3 — verify empirically; add a WebKitGTK signal handler only if a collapse is observed. Capture the WSLg-hosted window via Windows `PrintWindow` (WSLg surfaces it as a Windows window); fallback `grim` inside WSL. Surface the render to the user for the visual sign-off.

### T-049: Coexistence + docs (Windows + Linux)
- **Intent:** [INT-0018](../../../intents/INT-0018-tauri-linux-parity.md)
- **Touches:** `README.md`, `docs/sprints/s19/sprint-tests/*` (verification notes)
- **Depends on:** T-047, T-048
- **Acceptance criterion:** INT-0018 #4.
- **Success criterion (EARS):**
  - **WHEN** the Linux support lands, **THEN** the Windows Tauri build (`cargo build` clean), the Electron shell + its E2E, and every existing gate **SHALL** remain green (all changes additive / `cfg`-gated), **AND** the README **SHALL** document the Linux build.
- **Notes:** re-run `cargo build`/`clippy` (Windows target) + `npx vitest run` + `astro check` + `npm run check:electron` + `npm run test:e2e` + the four `check:*` gates. README "Also native — Tauri shell" extends from Windows to Windows + Linux (build via WSL, `.deb`). `.rpm`, Linux code-signing, cross-DE Wayland/X nuances, CI Linux builds, and the default-switch are documented follow-ups.
