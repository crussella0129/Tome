# Sprint 18 — Integration Test Results

- **Tested head:** `026e8a0dfb667f23bf5d309abf331d94cea8de78`
- **Intent:** [INT-0017](../../intents/INT-0017-tauri-production-port.md)

## Build + package (integration of the whole reader into a native installer) — criteria 1–3

`npm run tauri:build` (which chains `npm run build` → `tauri build`) compiles the Rust
shell in release and bundles the embedded `dist/` into native Windows artifacts:

| Artifact | Path | Size |
|----------|------|------|
| App exe | `src-tauri/target/release/app.exe` | 8.9 MB |
| NSIS installer | `bundle/nsis/Tome_0.1.0_x64-setup.exe` | 2.0 MB |
| MSI installer | `bundle/msi/Tome_0.1.0_x64_en-US.msi` | 3.1 MB |

Rust quality gates at the tested head: `cargo build` clean, `cargo fmt` clean,
`cargo clippy --all-targets` → **0 warnings**.

## Launch (integration of branding + theme icon + offline render) — criteria 1, 2, 4

The built `app.exe` launched and was captured via `PrintWindow(PW_RENDERFULLCONTENT)`:

- OS window title read back from the process = **"Tome"**; theme-aware **"T"** in the
  titlebar (dark variant on the dark OS theme).
- [`evidence/tauri-bibliotheca.png`](evidence/tauri-bibliotheca.png) — the Bibliotheca
  home renders **offline** (embedded `dist/`, no dev server / network).
- [`evidence/tauri-reader.png`](evidence/tauri-reader.png) — opening Marginalia lands on
  the **Colophon** chapter (sidebar, TOMES switcher, admonition, Next-chapter nav) with
  Astro directory routes resolving **natively** in WebView2.

## Coexistence / no-regression (criterion 4)

Everything the port added is confined to `src-tauri/` + `package.json` scripts + a README
note + docs. The full existing suite stays green at the tested head:

| Suite / gate | Result |
|---|---|
| `npx vitest run` | **97 passed / 97** |
| `astro check` | **0 errors / 0 warnings** (1 pre-existing hint) |
| `npm run check:electron` (Electron shell E2E) | **6 passed / 6** |
| `npm run test:e2e` (browser) | **21 passed / 21** |
| `npm run check:external` | **PASS (exit 0)** |
| `npm run check:livereload` | **PASS** |
| `npm run check:multibook` | **PASS** |
| `npm run check:search` | **PASS (tree restored)** |

The Electron shell's own E2E (`test_electron_icon_follows_theme`, `test_electron_zoom_locked`,
`test_electron_external_link`, …) is 6/6 — the two shells coexist, Electron still the default.
