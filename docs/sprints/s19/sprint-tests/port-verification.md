# Sprint 19 — Tauri Linux (WebKitGTK) port verification (T-047–T-049)

Build-phase verification for [INT-0018](../../../intents/INT-0018-tauri-linux-parity.md).
Built and launched on this host via **WSL2 Ubuntu 26.04 + WSLg**; automated Tauri
WebDriver E2E stays a documented follow-up (as on Windows).

## Build + package (criterion 1)

`scripts/build-linux.sh` (in WSL, webkit2gtk-4.1 2.52.3) — the same `src-tauri/` compiled
natively against WebKitGTK (`webkit2gtk`/`soup3`/`gtk` crates; the `cfg(windows)`
`webview2-com` dep correctly excluded) — produced:

| Artifact | Size |
|----------|------|
| `Tome_0.1.0_amd64.deb` | 4.1 MB (`Package: tome`, `amd64`, `Depends: libwebkit2gtk-4.1-0, libgtk-3-0`, ~13 MB installed) |
| `Tome_0.1.0_amd64.AppImage` | 78.8 MB (bundles the GTK/WebKit runtime) |

Built in the WSL-native fs, reusing the portable Windows-built `dist/` (no Node needed);
binaries not committed (`target/` git-ignored). `.rpm` is a follow-up (needs `rpmbuild`).

## Launch on WebKitGTK (criteria 2, 3)

The built `app` launched under WSLg (`DISPLAY=:0`, with the standard WebKitGTK-under-WSL
software-render env: `WEBKIT_DISABLE_DMABUF_RENDERER=1` / `WEBKIT_DISABLE_COMPOSITING_MODE=1`
/ `LIBGL_ALWAYS_SOFTWARE=1` / `GDK_BACKEND=x11`), captured with X11 `xwd`:

- **Offline render** — [`evidence/tauri-linux-bibliotheca.png`](evidence/tauri-linux-bibliotheca.png):
  the Bibliotheca renders pixel-identical to the Windows/WebView2 build.
- **A chapter via native routing** — [`evidence/tauri-linux-reader.png`](evidence/tauri-linux-reader.png):
  the Colophon chapter (sidebar, TOMES switcher, TOC, admonition, Next-nav) reached by
  clicking a tome — Astro directory routes resolve natively on WebKitGTK.
- **Branding** — the Weston title bar shows **"Tome"** (the title is on the server-side
  decoration; the content window's `_NET_WM_NAME` is empty, a GTK-CSD/Weston detail).
- **Zoom parity** — [`evidence/tauri-linux-zoomtest.png`](evidence/tauri-linux-zoomtest.png)
  after 12× Ctrl+scroll-down is **byte-identical** to the pre-gesture reader: WebKitGTK
  doesn't bind Ctrl+scroll to zoom, so the existing `cfg(not(windows))` no-op +
  `zoom_hotkeys_enabled(false)` already prevent a collapse — **no Linux code was needed**.
- **External links** — the same cross-platform `on_navigation` + `tauri-plugin-opener`
  path (`xdg-open` present); verified by construction, as on Windows.
- **Theme-aware icon** — best-effort on GTK: under WSLg's Weston frame the window icon
  isn't surfaced in the title bar; a real desktop uses the packaged `.desktop`/icon-theme
  "T". Matches INT-0018's "best-effort on GTK" boundary.

Renders/behaviour **surfaced to the user** for the visual sign-off.

## Coexistence — no regression (criterion 4)

All Linux support is additive / already `cfg`-gated; the only committed source change is
`scripts/build-linux.sh` + the README + docs. The full existing suite, re-run green:

| Suite | Result |
|-------|--------|
| `cargo build` / `cargo clippy` (Windows target) | clean / **0 warnings** |
| `npx vitest run` | 97 passed (20 files) |
| `astro check` | 0 errors, 0 warnings (1 pre-existing hint) |
| `npm run check:external` / `check:livereload` / `check:multibook` / `check:search` | PASS |
| `npm run check:electron` (Electron shell E2E) | 6/6 |
| `npm run test:e2e` (browser E2E) | 21/21 |

## Follow-ups (documented, out of scope)

`.rpm` packaging, code-signing (Windows + Linux), a Linux CI build, an automated
`tauri-driver` WebDriver E2E, cross-DE Wayland/X nuances, and the default-switch
(retiring Electron) — the follow-on intents named in INT-0018.
