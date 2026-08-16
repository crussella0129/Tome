# Sprint 16 Test Report

## Intent Verification
| Intent | Acceptance criterion | Verification | Result | Intent evidence update |
|--------|----------------------|--------------|--------|------------------------|
| [INT-0015](../../../intents/INT-0015-tauri-shell-spike.md) | 1 — build/launch; `dist/` offline; routes/assets resolve | `cargo build` → launch; `/` + `/marginalia` render offline (directory routes native) | **pass** | Test evidence adds this report |
| [INT-0015](../../../intents/INT-0015-tauri-shell-spike.md) | 2 — faithful aesthetic in WebView2 | captured renders (`evidence/*.png`), surfaced to the user | **pass** (user sign-off) | (as above) |
| [INT-0015](../../../intents/INT-0015-tauri-shell-spike.md) | 3 — internal in-app; external → OS browser; secure | internal nav demonstrated; external via `on_navigation`+opener; secure-by-default | **pass** | (as above) |
| [INT-0015](../../../intents/INT-0015-tauri-shell-spike.md) | 4 — recorded go/no-go + isolation | `go-no-go.md` = **GO**; full existing suite green | **pass** | (as above) |

All four criteria met → **INT-0015 is eligible for `realized`** as a spike with a
recorded **GO** recommendation (Loop Phase).

## Summary
- **Spike outcome: GO** — see [go-no-go.md](go-no-go.md). Tauri v2 loads the existing
  `dist/` offline in a native WebView2 window, resolves Astro's directory routes
  **natively** (no custom protocol), and renders the ink-on-paper aesthetic
  pixel-identical to Chromium — at **8.6 MB** (vs Electron's **348 MB** runtime) and
  **~37 MB** RAM. The gating caveat is Linux/WebKitGTK parity, unverified here.
- **Isolation:** Vitest **96/96**, `astro check` **0 errors**, `check:electron`
  **6/6**, browser `test:e2e` **21/21**, and `check:external`/`multibook`/`search`/
  `livereload` all green. The spike changed no existing web/Electron code.

## Tested head
- **Head SHA:** `c3378fc1caed23c7bbccca524eef8dfa2512dace` (tip of `dev`).
- Toolchain: Rust 1.96.0, WebView2 151.0.4129.86, `@tauri-apps/cli` 2.11.4,
  `tauri` 2.11.5. Build times: first 2m10s, incremental ~20s, release 1m54s.

## Failures
None. (One Windows-only `load-books.test.ts` temp-cleanup `EPERM` flake marked its
file failed while all 96 tests passed — Linux CI unaffected. An initial
`astro check` picked up Tauri's binary `target/*.js` (40 errors) — fixed by
excluding `src-tauri` in `tsconfig.json`.)

## Technical Debt Identified
- **Linux/WebKitGTK parity is unverified** — the single reason to keep Electron as
  the fallback; the full-port sprint must check it before any Electron removal.
- Interactive external-link + scheme-deny coverage and an automated Tauri E2E
  (`tauri-driver`/WebdriverIO) are deferred to the full-port sprint (critique C-002).
- The spike uses Tauri's **default icons**; the theme-aware "T" icon and the zoom
  lock (INT-0013) are parity items to port.

## Coverage Observations
This is a spike: the deliverable is a working proof-of-concept plus a decision, and
both exist. Criterion 1 (offline load + native directory routes) and criterion 3
(internal nav; secure) are machine-observable and pass; criterion 2 (aesthetic) is
surfaced to the user for the visual sign-off with an objective floor (same engine,
island hydrated, assets/fonts loaded); criterion 4 (go/no-go + isolation) is the
recorded **GO** plus a fully green existing suite. Automated interactive coverage
and Linux parity are correctly deferred to the full-port sprint that a GO unlocks.
