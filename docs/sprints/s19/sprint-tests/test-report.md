# Sprint 19 Test Report

## Intent Verification
| Intent | Acceptance criterion | Verification | Result | Intent evidence update |
|--------|----------------------|--------------|--------|------------------------|
| [INT-0018](../../../intents/INT-0018-tauri-linux-parity.md) | 1 — builds + packages on Linux | `scripts/build-linux.sh` (WSL, webkit2gtk-4.1) → `.deb` 4.1 MB + AppImage 78.8 MB | **pass** | Test evidence adds this report |
| [INT-0018](../../../intents/INT-0018-tauri-linux-parity.md) | 2 — offline render on WebKitGTK | WSLg launch: Bibliotheca + Colophon chapter offline (`evidence/*.png`), surfaced to user | **pass** (caveat C-001) | (as above) |
| [INT-0018](../../../intents/INT-0018-tauri-linux-parity.md) | 3 — branding + zoom parity | title "Tome"; 12× Ctrl+scroll → byte-identical (no collapse); theme icon best-effort GTK | **pass** (caveat C-001/C-002) | (as above) |
| [INT-0018](../../../intents/INT-0018-tauri-linux-parity.md) | 4 — coexistence + docs | Windows `cargo build`/clippy clean; Vitest 97; Electron 6/6; browser 21/21; four gates; README | **pass** | (as above) |

All four criteria met → **INT-0018 is eligible for `realized`** (Loop Phase).

## Summary
- **Port outcome:** the one Tauri codebase now runs natively on **Linux (WebKitGTK)** as
  well as Windows. `scripts/build-linux.sh` builds the same `src-tauri/` in WSL2 against
  webkit2gtk-4.1 into a native **`.deb` (4.1 MB)** + **AppImage (78.8 MB)**. Launched under
  WSLg, it renders the Bibliotheca **and** a chapter (Colophon, native directory routes)
  **offline**, pixel-identical to Chromium, with the **"Tome"** title bar; an accidental
  Ctrl+scroll leaves the layout byte-identical (no collapse). **No shell code change was
  needed** — WebKitGTK required no zoom handler; the existing cross-platform paths held.
- **Coexistence:** the shared `src-tauri/` still builds clean on Windows (`cargo build` +
  `clippy` 0 warnings), and Vitest **97/97**, `astro check` **0 errors**, `check:electron`
  **6/6**, browser `test:e2e` **21/21**, and the four gates all stayed green. The only
  committed source change is `scripts/build-linux.sh` (+ README + docs).

## Tested head
- **Head SHA:** `a046b8917dc7f19b83fc07ffb693765aa91688a0` (tip of `dev`).
- Env: WSL2 Ubuntu 26.04, Rust 1.95, webkit2gtk-4.1 2.52.3, WSLg (`DISPLAY=:0`). Linux
  launch used the standard WebKitGTK-under-WSL software-render env
  (`WEBKIT_DISABLE_DMABUF_RENDERER=1` etc.).

## Failures
None. (The first launch hit WSLg's WebKitGTK GPU issue — `libEGL`/`MESA ZINK` couldn't
init the DMABUF renderer; resolved by the documented software-render env. AppImage first
failed on a missing `xdg-open`; resolved by installing `xdg-utils`.)

## Technical Debt Identified
- **No automated Tauri E2E** (Windows or Linux) — verified by build + WSLg launch +
  screenshot; a `tauri-driver`/WebdriverIO harness is the named follow-up (critique C-001).
- **Real-hardware / cross-DE Linux** unverified (WSLg only, software render) — a follow-up
  (critique C-003), along with a **Linux CI build**.
- **`.rpm`** (needs `rpmbuild`) and **code-signing** (Windows + Linux) — follow-ups.
- The `.deb` Maintainer ("you") / Description ("A Tauri App") are scaffold defaults — a
  metadata-polish follow-up (T-047 note).
- The theme-aware window **icon** is best-effort on GTK (critique C-002).

## Coverage Observations
The port's machine-observable promises — a native Linux `.deb`/AppImage from the one
codebase, an offline WebKitGTK render of the whole reader (Bibliotheca + a chapter via
native routes), a genuine zoom negative test, and full coexistence with the untouched
Windows/web suites — are all verified green at the tested head. The remaining criteria
(icon, and the visual render/branding sign-off) are surfaced to the user, sit on that
objective floor, and their automated + real-hardware coverage is correctly deferred to the
WebDriver-E2E, Linux-CI, and cross-DE follow-on intents this port unlocks.
