# Sprint 16 — End-to-End Test Results

- **Tested head:** `c3378fc1caed23c7bbccca524eef8dfa2512dace`
- **Status:** not-yet-possible (automated), by design for a spike
- **Intent:** [INT-0015](../../intents/INT-0015-tauri-shell-spike.md)

## Why not automated

A full automated Tauri E2E needs a WebDriver harness (`tauri-driver` + WebdriverIO
/ Edge WebDriver). Standing that up is a follow-on of the **full-port** intent on a
"go" — disproportionate for a throwaway spike. The spike is instead verified by a
deterministic build + launch + captured screenshots + the recorded recommendation.

## Spike verification (criteria 1–4)

| Criterion | Verification | Result |
|---|---|---|
| 1 — build/launch, offline `dist/`, routes/assets resolve | `cargo build` → launch `app.exe`; window loads `/` offline; `/marginalia` (no `.html`) resolves natively | **pass** (`evidence/tauri-bibliotheca.png`, `evidence/tauri-reader.png`) |
| 2 — faithful aesthetic in WebView2 | PrintWindow capture of the rendered Bibliotheca + reader; **surfaced to the user** for the visual sign-off (not self-certified) | **pass** — pixel-identical to Chromium (parchment, Mekzantine fonts, rubric accents, sidebar/switcher/rail) |
| 3 — internal in-app; external → OS browser; secure | internal nav rendered `/marginalia`; external `http(s)` routed via `on_navigation` + `tauri-plugin-opener`; secure-by-default config | **pass** (internal demonstrated; external implemented per the standard pattern) |
| 4 — recorded go/no-go + isolation | `go-no-go.md` = **GO** with size/memory/effort/risk evidence; full existing suite green | **pass** |

## Notes on determinism / limits
- The renders were captured via `PrintWindow(PW_RENDERFULLCONTENT)` so the specific
  window is captured even when occluded (a first `CopyFromScreen` attempt grabbed a
  foreground app — corrected).
- Coverage is **Windows/WebView2 only**. Linux/WebKitGTK parity is unverified and is
  the gating risk for the full-port sprint (see `go-no-go.md`).
