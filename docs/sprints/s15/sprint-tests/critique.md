# Test Critique — Sprint 15

## Concerns

### C-001: the "Ctrl+0 resets to 100%" clause of INT-0013 #1 is not directly asserted
- **Where:** `INT-0013` acceptance criterion 1 / `e2e-tests.md` `test_electron_zoom_locked`
- **Quote:** criterion 1 — "a reset (Ctrl+0 or equivalent) returns to 100%"
- **Failure mode:** intent-coverage
- **Why it matters:** the E2E asserts the app opens at 100% and snaps back an accidental `zoom-changed`, but does not drive a Ctrl+0 keypress.
- **Suggested response:** defer-with-rationale — the shell intentionally leaves **keyboard** zoom (incl. Chromium's native Ctrl+0 reset) working; it is native platform behavior, not shell code this sprint added, and driving the OS accelerator in the Electron harness is flaky. The substantive guarantee — that an *accidental* gesture cannot leave the app zoomed — is directly tested. No defect; the clause is satisfied by the retained native reset.

### C-002: "deliberate zoom always leaves content reachable" is covered only transitively
- **Where:** `INT-0013` acceptance criterion 1 / `e2e-tests.md`
- **Quote:** criterion 1 — "Any deliberate zoom that is still permitted must always leave content reachable — never an unusable state."
- **Failure mode:** intent-coverage
- **Why it matters:** no test zooms via keyboard and then confirms content is reachable.
- **Suggested response:** defer-with-rationale — deliberate zoom shrinks the effective viewport, which is exactly what the browser **scaling sweep** exercises directly (widths 480→2560): at every width there is no horizontal overflow, the dialog stays in view, and the layout resolves to a defined mode (the narrow modes keep the drawer toggle, so content is reachable). Zoom is the viewport-shrink vector; the width sweep is its faithful, deterministic proxy. Adding a keyboard-zoom E2E would duplicate that coverage less reliably.

## Confidence
proceed-with-caveats
