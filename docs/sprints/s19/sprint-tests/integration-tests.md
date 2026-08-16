# Sprint 19 — Integration Test Results

- **Tested head:** `a046b8917dc7f19b83fc07ffb693765aa91688a0`
- **Intent:** [INT-0018](../../intents/INT-0018-tauri-linux-parity.md)

## Linux build + package (criterion 1)

`scripts/build-linux.sh` in WSL2 Ubuntu 26.04 (webkit2gtk-4.1 2.52.3) compiled the same
`src-tauri/` natively against WebKitGTK and bundled:

| Artifact | Size |
|----------|------|
| `Tome_0.1.0_amd64.deb` | 4.1 MB (`Package: tome`, `amd64`, `Depends: libwebkit2gtk-4.1-0, libgtk-3-0`) |
| `Tome_0.1.0_amd64.AppImage` | 78.8 MB |

The `cfg(windows)` `webview2-com` dep was correctly excluded; the `webkit2gtk`/`soup3`/
`gtk` crates linked. Built in the WSL-native fs, reusing the portable Windows `dist/`.

## Linux launch (integration of the whole reader on WebKitGTK) — criteria 2, 3

The built `app` launched under WSLg and was captured with X11 `xwd`:

- [`evidence/tauri-linux-bibliotheca.png`](evidence/tauri-linux-bibliotheca.png) — the
  Bibliotheca renders **offline**, pixel-identical to Windows/WebView2.
- [`evidence/tauri-linux-reader.png`](evidence/tauri-linux-reader.png) — the Colophon
  chapter via native directory routing (sidebar, TOMES switcher, admonition, Next-nav).
- Title bar shows **"Tome"** (branding); external links use the cross-platform
  `on_navigation` + opener (`xdg-open` present).
- [`evidence/tauri-linux-zoomtest.png`](evidence/tauri-linux-zoomtest.png) — after 12×
  Ctrl+scroll-down, **byte-identical** to the reader: no zoom, no collapse.

## Coexistence / no-regression (criterion 4)

All Linux support is additive / `cfg`-gated; the only committed source change is
`scripts/build-linux.sh` (+ README + docs). The full existing suite stays green at head:

| Suite / gate | Result |
|---|---|
| `cargo build` / `cargo clippy` (Windows target) | clean / **0 warnings** |
| `npx vitest run` | **97 passed / 97** |
| `astro check` | **0 errors / 0 warnings** (1 pre-existing hint) |
| `npm run check:electron` (Electron shell E2E) | **6 / 6** |
| `npm run test:e2e` (browser) | **21 / 21** |
| `check:external` / `check:livereload` / `check:multibook` / `check:search` | **PASS** |
