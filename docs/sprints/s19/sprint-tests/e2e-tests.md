# Sprint 19 — End-to-End Test Results

- **Tested head:** `a046b8917dc7f19b83fc07ffb693765aa91688a0`
- **Status:** not-yet-possible (automated for the **Tauri** shell), by design
- **Intent:** [INT-0018](../../intents/INT-0018-tauri-linux-parity.md)

## Why the Tauri E2E is not automated (and what unlocks it)

An automated E2E of the native Tauri window (Windows **or** Linux) needs a WebDriver
harness (`tauri-driver` + WebdriverIO). That is a named follow-on intent (as on Windows,
INT-0017); the identical `dist/` is already covered end-to-end by the browser (21/21) and
Electron (6/6) suites, so only the native-shell wrapper is verified by launch. On Linux the
launch was driven under **WSLg** (`xdotool` for the click, `xwd` for capture) — a manual,
reproducible verification, not a CI-gated automated one.

## Port verification (criteria 1–4)

| Criterion | Verification | Result |
|---|---|---|
| 1 — builds + packages on Linux | `scripts/build-linux.sh` (WSL, webkit2gtk-4.1) → `.deb` 4.1 MB + AppImage 78.8 MB | **pass** |
| 2 — offline render on WebKitGTK | WSLg launch: Bibliotheca + Colophon chapter render offline (`evidence/*.png`); external link via cross-platform opener | **pass** (surfaced to user) |
| 3 — branding + zoom parity | title "Tome" (Weston bar); 12× Ctrl+scroll → byte-identical capture (no collapse); theme icon best-effort on GTK | **pass** (surfaced to user) |
| 4 — coexistence + docs | Windows `cargo build`/clippy clean; Vitest 97; Electron 6/6; browser 21/21; four gates; README Windows+Linux | **pass** |

## Notes on determinism / limits
- WebKitGTK under WSLg needs the software-render env (`WEBKIT_DISABLE_DMABUF_RENDERER=1`
  etc.); on real Linux hardware GL compositing is used. This is a WSLg/GPU detail, not a
  Tome behaviour.
- Coverage is **Windows + Linux(WebKitGTK) via WSLg**. Real-hardware Linux across desktop
  environments, `.rpm`, code-signing, a Linux CI build, and an automated WebDriver E2E are
  the documented follow-on intents.
- The render/branding/zoom are visual/behavioural and were **surfaced to the user** for
  sign-off; the build (`.deb`/AppImage) and coexistence are fully machine-verified.
