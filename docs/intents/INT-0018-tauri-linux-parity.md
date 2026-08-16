# INT-0018 — Tauri desktop shell (Linux / WebKitGTK parity)

<!-- sprint-loop-intent-v2 -->
- **Intent ID:** INT-0018
- **State:** realized
- **Work evidence:** [Sprint 19 build plan](../sprints/s19/sprint-plans/build-plan.md) (T-047/T-048/T-049)
- **Completion evidence:** [T-047 completion (Sprint 19)](../work/completed-tasks.md#t-047-sprint-19), [T-048 completion (Sprint 19)](../work/completed-tasks.md#t-048-sprint-19), [T-049 completion (Sprint 19)](../work/completed-tasks.md#t-049-sprint-19)
- **Code evidence:** [Linux build script](../../scripts/build-linux.sh), [Tauri shell (cross-platform, `src-tauri/src/lib.rs`)](../../src-tauri/src/lib.rs) — commits `8fd8943` (T-047), `e554cd9` (T-048), `cf5fdbd` (T-049)
- **Test evidence:** [Sprint 19 test report](../sprints/s19/sprint-tests/test-report.md), [port verification](../sprints/s19/sprint-tests/port-verification.md) — all 4 criteria pass (proceed-with-caveats)
- **Documentation evidence:** [README — Tauri shell (Windows + Linux)](../../README.md#also-native--tauri-shell-windows--linux)

## Intent

Bring the Tauri v2 shell (production-ported to Windows in INT-0017) to **Linux
(WebKitGTK) parity**, built and verified on this host via **WSL2 Ubuntu + WSLg**. The
same `src-tauri/` shell should compile against WebKitGTK, load the built `dist/`
offline, route external links to the OS browser, carry the "Tome" branding, and package
as a native Linux bundle — so Tome runs natively on both Windows and Linux from one
codebase. Electron remains the shipping default/fallback until the default-switch is
separately decided.

## Acceptance criteria

1. **Builds on Linux (WebKitGTK):** the same-in-spirit `src-tauri/` shell compiles on
   Ubuntu (webkit2gtk-4.1) and `tauri build` produces a native Linux package — a
   **`.deb`** at minimum (AppImage if the bundler tooling resolves; `.rpm` is a
   follow-up). Built via WSL2; the provisioning (apt deps, Rust, node) is documented as
   requirements, not baked into the repo as machine state.
2. **Renders offline on WebKitGTK:** the built app launches on Linux (WSLg display) and
   renders the Bibliotheca and a chapter **offline** with the ink-on-paper aesthetic,
   external `http(s)` links opening the OS browser (`xdg-open`), secure by default —
   captured for review.
3. **Branding + zoom parity (best-effort on GTK):** the window title is "Tome" with the
   theme-aware "T" icon where the desktop environment supports it; user zoom cannot
   shrink the viewport and collapse the reader (keyboard via `zoom_hotkeys_enabled(false)`,
   and WebKitGTK's default / a Linux hook for pinch/Ctrl-scroll — verified, since
   WebView2's `IsZoomControlEnabled` has no direct WebKitGTK analogue).
4. **Coexisting + verified:** the Windows Tauri build, the Electron shell + its E2E, and
   every existing gate remain green; all Linux support is additive / `cfg`-gated
   (`src-tauri/` already isolates the Windows-only WebView2 hook). `.rpm` packaging,
   Linux code-signing, cross-DE Wayland/X nuances, CI Linux builds, and the
   default-switch (retiring Electron) are the documented follow-on intents.

## Rationale

INT-0017 shipped Tauri to Windows parity and named Linux/WebKitGTK parity as the gating
follow-on before any Electron retirement. This host has WSL2 Ubuntu 26.04 (Rust + all
Tauri deps apt-available) with WSLg for GUI launch/capture, so Linux parity is verifiable
here without a separate machine or CI. Proving the one codebase renders on WebKitGTK is
the last technical unknown between the two shells.

## Alternatives

- Cross-compile from Windows to Linux. Rejected: Tauri/WebKitGTK cross-compilation is
  impractical; a real Linux toolchain (WSL) is the supported path.
- Build in a Docker container. Viable, but the daemon is off by default and headless GUI
  capture is harder than WSLg; WSL2 + WSLg is the lower-friction path here (Docker
  remains a reproducibility follow-up).
- Defer Linux to CI only. Rejected: local WSL verification with a screenshot is the
  evidence this sprint can produce now; CI is a follow-up.

## Consequences

- `src-tauri/` may gain small `cfg(not(windows))` / Linux branches (e.g. WebKitGTK zoom
  handling) and possibly bundle metadata (Linux category, a `.desktop`); `electron/` and
  the web app are untouched.
- Linux provisioning (apt webkit2gtk deps, Rust, and node — currently absent in WSL) is a
  local, user-authorized environment action, documented in the repo as requirements
  rather than committed machine state.

## Transition history

- 2026-08-16: created as `proposed` during Sprint 19 research — realizing INT-0017's
  named Linux/WebKitGTK follow-on, scoped to a WSL-built, WSLg-verified Linux package,
  with `.rpm`/signing/CI/default-switch deferred.
- 2026-08-16: `proposed` → `planned` at Sprint 19 Plan Phase — decomposed into T-047
  (Linux build + `.deb`), T-048 (WebKitGTK launch verification + parity), T-049
  (coexistence + docs); see the linked build plan.
- 2026-08-16: `planned` → `active` at Sprint 19 Build Phase — implementation begun
  (T-047 first).
- 2026-08-16: `active` → `realized` at Sprint 19 Loop Phase — all four acceptance
  criteria pass (test report, proceed-with-caveats). The one Tauri codebase builds on
  Linux (webkit2gtk-4.1) into a native `.deb` + AppImage and renders offline on WebKitGTK
  (Bibliotheca + a chapter) with the "Tome" branding and zoom that can't collapse — no
  shell code change was needed. Windows Tauri + Electron + all gates stayed green. The
  render/branding/zoom are visual/behavioural and were surfaced to the user for the
  merge-time sign-off. `.rpm`, code-signing, real-hardware/cross-DE coverage, a Linux CI
  build, an automated WebDriver E2E, and the default-switch remain follow-on intents.
