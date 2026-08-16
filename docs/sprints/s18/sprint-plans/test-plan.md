Finalized - DO NOT EDIT

# Sprint 18 Test Plan

## Intent Traceability
| Intent | Acceptance criterion | Build task / EARS clause | Verification |
|--------|----------------------|--------------------------|--------------|
| [INT-0017](../../../intents/INT-0017-tauri-production-port.md) | 1 — productionized branding + theme-aware icon | T-044/T-045 / WHEN built … THEN productName/identifier; WHEN window opens with title "Tome" & theme changes … THEN dark/light "T" icon | config inspection (productName/identifier); launch screenshot shows title "Tome" + the Tome "T" (per theme) |
| [INT-0017](../../../intents/INT-0017-tauri-production-port.md) | 2 — zoom hardening | T-045 / WHEN app runs … THEN user zoom disabled, opens at 100% | launch: an accidental pinch/Ctrl-wheel does not change zoom / collapse the layout (observed) |
| [INT-0017](../../../intents/INT-0017-tauri-production-port.md) | 3 — launch scripts + installer | T-044/T-046 / WHEN `tauri:build` … THEN a Windows installer | installer produced under `src-tauri/target/release/bundle/…` (path + size recorded) |
| [INT-0017](../../../intents/INT-0017-tauri-production-port.md) | 4 — verify + coexistence | T-046 / WHEN launched … THEN chapter offline; Electron/gates green | launch screenshot; `check:electron` 6/6 + vitest + browser e2e + four gates + astro check green |

## Unit Tests
- **Intent:** [INT-0017](../../../intents/INT-0017-tauri-production-port.md)
- None. The port is Rust shell wiring + config + packaging; if a pure theme→variant
  helper is extracted in Rust, a `#[cfg(test)]` unit mirrors `resolveIconVariant`.

## Integration Tests
### Coexistence / no-regression (the port must not disturb anything existing)
- **Intent:** [INT-0017](../../../intents/INT-0017-tauri-production-port.md)
- `npx vitest run`, `astro check`, `npm run check:electron` (the Electron shell E2E),
  `npm run test:e2e` (browser), and `check:external`/`check:multibook`/`check:search`/
  `check:livereload` — all remain **green**. The port lives entirely under
  `src-tauri/` (+ `package.json` scripts + README), so the web app and the Electron
  shell are untouched; the two shells coexist (Electron still the default).

## End-to-End Tests
- **Status:** not-yet-possible (automated), by design
- **Rationale / unlocked by:** an automated Tauri E2E needs a WebDriver harness
  (`tauri-driver` + WebdriverIO / Edge WebDriver) — a follow-on of the shell being
  adopted, disproportionate here (as in the INT-0015 spike).
- **Port verification instead:** `tauri build` emits an installer (recorded); the
  built app is launched and a chapter is captured rendering offline with the Tome
  window icon (per theme) and locked zoom; an external link opens the OS browser.
  The screenshot + the icon/render are **surfaced to the user** for the visual
  sign-off (criteria 1–2 are a visual judgment). Linux/WebKitGTK parity and
  code-signing are explicit follow-on intents.
