# Sprint 18 — Tauri production port verification (T-046)

Build-phase verification for [INT-0017](../../../intents/INT-0017-tauri-production-port.md).
Automated Tauri E2E (WebDriver / `tauri-driver`) is a documented follow-up; the port is
verified by build + launch + screenshot + the full untouched web/Electron suite.

## Packaging (criterion 3)

`npm run tauri:build` (release compile + WiX/NSIS bundling) produced, unsigned:

| Artifact | Path | Size |
|----------|------|------|
| App exe | `src-tauri/target/release/app.exe` | 8.9 MB |
| NSIS installer | `src-tauri/target/release/bundle/nsis/Tome_0.1.0_x64-setup.exe` | 2.0 MB |
| MSI installer | `src-tauri/target/release/bundle/msi/Tome_0.1.0_x64_en-US.msi` | 3.1 MB |

(The installers are smaller than the exe because they LZMA-compress it; the installed
footprint is the ~8.9 MB exe over the system-provided WebView2 runtime — vs Electron's
bundled ~348 MB Chromium.)

## Launch verification (criteria 1, 2, 4)

The built `app.exe` was launched and captured via `PrintWindow(PW_RENDERFULLCONTENT)`
(the WebView2-composition-safe capture proven in the INT-0015 spike):

- **Branding** — the OS window title is **"Tome"** (read back from the process:
  `MainWindowTitle = "Tome"`), and the titlebar carries the **theme-aware "T"**: the
  cream-on-near-black variant here, correct for the dark OS theme (parity with the
  Electron `resolveIconVariant` decision).
- **Offline render** — [`evidence/tauri-bibliotheca.png`](evidence/tauri-bibliotheca.png):
  the Bibliotheca home ("THE BIBLIOTHECA OF CHARL · 2 TOMES CATALOGUED", search, both
  tome cards) renders pixel-perfect with no dev server and no network (the app embeds
  `dist/` via `frontendDist`).
- **A chapter, offline, via native routing** —
  [`evidence/tauri-reader.png`](evidence/tauri-reader.png): opening Marginalia lands on
  the **Colophon** chapter with the sidebar, TOMES switcher + Bibliotheca link, the
  chapter TOC, an admonition, and Next-chapter nav — Astro's directory routes resolving
  natively in WebView2 (the spike's top risk, re-confirmed in the production build).
- **Zoom hardening (criterion 2)** — behavioural, so not visible in a static shot: the
  shell disables user zoom two ways — `zoom_hotkeys_enabled(false)` (Ctrl +/- / Ctrl+0)
  and WebView2 `ICoreWebView2Settings::SetIsZoomControlEnabled(false)` (pinch / Ctrl-wheel)
  — so an accidental gesture cannot shrink the viewport below the responsive breakpoint
  and collapse the reader into the mobile drawer. Surfaced to the user for the live check.

Criteria 1, 2 and the icon/render halves of 4 are **visual/behavioural** and were
surfaced to the user for sign-off.

## Coexistence — no regression (criterion 4)

The port lives entirely under `src-tauri/` (+ `package.json` scripts + README); the web
app and the Electron shell are untouched, and both shells coexist (Electron still the
default). The full existing suite, re-run:

| Suite | Result |
|-------|--------|
| `npx vitest run` | 97 passed (20 files) |
| `astro check` | 0 errors, 0 warnings (1 pre-existing hint) |
| `npm run check:external` | PASS |
| `npm run check:livereload` | PASS |
| `npm run check:multibook` | PASS |
| `npm run check:search` | PASS |
| `npm run check:electron` (Electron shell E2E) | 6/6 passed |
| `npm run test:e2e` (browser E2E) | 21/21 passed |

## Follow-ups (documented, out of scope this sprint)

Linux/WebKitGTK parity, code-signing the installers, an automated WebDriver E2E, and the
decision to make Tauri the default (retiring Electron) — the follow-on intents named in
INT-0017.
