# Plan Critique — Sprint 18

## Concerns

### C-001: `zoomHotkeysEnabled` asserted on config, but the window is code-built
- **Where:** `build-plan.md` T-044 Success criterion / T-045 zoom clause
- **Quote:** "`app.windows[].zoomHotkeysEnabled: false`" (T-044) vs. "keyboard via `zoomHotkeysEnabled`" (T-045)
- **Failure mode:** hidden-dep
- **Why it matters:** the shell creates its window programmatically via
  `WebviewWindowBuilder` (`tauri.conf.json` has `app.windows: []`), so a
  `zoomHotkeysEnabled` key placed under `app.windows[]` in config governs no
  window and would silently no-op. The keyboard-zoom disable must be applied on
  the builder in code (`.zoom_hotkeys_enabled(false)`), i.e. in T-045, not as a
  config assertion in T-044.
- **Suggested response:** fix-in-plan — drop the config assertion from T-044's
  EARS; make T-045 own the keyboard-zoom disable on the builder (alongside the
  WebView2 pinch/Ctrl-wheel hook). T-044 keeps the static branding/bundle fields.

### C-002: Tauri-specific EARS clauses map to manual verification, not automated tests
- **Where:** `test-plan.md` Intent Traceability / Unit Tests ("None") / End-to-End ("not-yet-possible")
- **Quote:** "config inspection; launch screenshot shows the Tome 'T' (per theme)"
- **Failure mode:** plan-test-mismatch (partial)
- **Why it matters:** the branding, theme-icon, and zoom clauses have no automated
  named test — they are verified by config inspection + a launched-app screenshot
  surfaced to the user. If unqualified this reads as a coverage gap.
- **Suggested response:** defer-with-rationale — this is inherent to a native-shell
  port: the icon/offline-render/zoom criteria are visual/behavioural judgments, and
  an automated Tauri E2E needs a WebDriver harness (`tauri-driver`) that is an
  explicit follow-on intent (as in the INT-0015 spike). The port is instead gated
  by `tauri build` producing an installer + a launched-app screenshot + the full
  untouched Electron/browser/gate suite staying green (coexistence). Recorded as
  the E2E `not-yet-possible` status with a named unlocking follow-up.

### C-003: T-045 bundles theme-icon and zoom-hardening
- **Where:** `build-plan.md` T-045 (two EARS clauses: icon swap + zoom disable)
- **Quote:** "Theme-aware window icon + zoom hardening (Electron parity)"
- **Failure mode:** granularity
- **Why it matters:** two logically distinct behaviours in one task.
- **Suggested response:** defer — both are runtime window-parity wiring in the same
  file (`src-tauri/src/lib.rs`), land as one coherent diff, and mirror how the
  Electron shell carries icon + zoom together in `electron/main.cjs`. Splitting
  would fragment a single-file change without improving reviewability.

## Confidence
proceed-with-caveats
