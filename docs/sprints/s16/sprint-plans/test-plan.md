Finalized - DO NOT EDIT

# Sprint 16 Test Plan

## Intent Traceability
| Intent | Acceptance criterion | Build task / EARS clause | Verification |
|--------|----------------------|--------------------------|--------------|
| [INT-0015](../../../intents/INT-0015-tauri-shell-spike.md) | 1 — Tauri builds + launches; loads `dist/` offline; routes/assets resolve | T-038 / WHEN run against `dist/` … THEN window renders `/` + a chapter offline | build + launch (`npm run tauri`); route/asset resolution observed |
| [INT-0015](../../../intents/INT-0015-tauri-shell-spike.md) | 2 — faithful aesthetic in WebView2 | T-039 / WHEN launched … THEN chapter `<h1>` + sacred aesthetic render comparably | screenshot of a rendered chapter (parchment, self-hosted font, sacred styling) |
| [INT-0015](../../../intents/INT-0015-tauri-shell-spike.md) | 3 — internal in-app; external → OS browser; secure | T-038 / WHEN link targets http(s) … THEN OS browser; app-origin stays in-app | launch observation: external link opens the OS browser; secure config asserted |
| [INT-0015](../../../intents/INT-0015-tauri-shell-spike.md) | 4 — recorded go/no-go; isolation | T-039 / WHEN evaluation completes … THEN go/no-go recorded + Electron/gates green | recommendation doc + full existing-suite regression |

## Unit Tests
- **Intent:** [INT-0015](../../../intents/INT-0015-tauri-shell-spike.md)
- None required for a spike. If a Rust custom-protocol resolver is added (the
  directory→`index.html` fallback), a Rust `#[cfg(test)]` unit for the path
  resolution (root→`index.html`, extensionless route→its `index.html`, `..`-escape
  → refused) mirrors the existing `dist-resolve` unit and is added with T-038.

## Integration Tests
### Isolation / no-regression (the spike must change nothing existing)
- **Intent:** [INT-0015](../../../intents/INT-0015-tauri-shell-spike.md)
- `npx vitest run` (96), `npm run check:electron` (6), `npm run test:e2e` (21), and
  `check:external`/`check:multibook`/`check:search`/`check:livereload` + `astro check`
  — all remain **green**, proving the Tauri spike (new `src-tauri/` + scripts) did not
  disturb the web build, the Electron shell, or the gates.

## End-to-End Tests
- **Status:** not-yet-possible (for the spike)
- **Rationale / unlocked by:** a full automated Tauri E2E needs a WebDriver harness
  (`tauri-driver` + WebdriverIO / Edge WebDriver), which is a follow-on of the
  **full-port** intent on a "go" decision — disproportionate for a throwaway spike.
- **Spike verification instead:** deterministic build + launch on Windows/WebView2,
  plus a captured **screenshot** of a rendered chapter (aesthetic evaluation) and an
  observed external-link → OS-browser check. These, with the recorded go/no-go, are
  the spike's evidence (criteria 1–4).
