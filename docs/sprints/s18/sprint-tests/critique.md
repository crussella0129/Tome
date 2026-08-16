# Test Critique — Sprint 18

## Concerns

### C-001: criteria 1 & 2 (theme icon + zoom) rest on visual/behavioural judgment
- **Where:** `e2e-tests.md` criteria 1–2 / `INT-0017` acceptance criteria 1, 2
- **Quote:** "the dark 'T' titlebar icon on the dark OS theme … app opens at default scale (behavioural; code paths in `lib.rs`)"
- **Failure mode:** weak-assertion / e2e-cop-out
- **Why it matters:** the theme-aware icon and the zoom lock are confirmed by a
  screenshot + a reading of the code path, not by a machine assertion that fails on
  regression. A future change to `icon_for` or the WebView2 hook could pass silently.
- **Suggested response:** defer-with-rationale — driving the native window (theme-swap,
  a pinch gesture, the icon handle) needs the `tauri-driver`/WebDriver harness that
  INT-0017 names as an explicit follow-on. There is an objective floor: the installer
  builds, the offline render is captured, the process title reads back as **"Tome"**,
  `clippy` is clean, and the identical `dist/` is covered end-to-end by the browser
  (21/21) and Electron (6/6) suites — and the Electron shell's own
  `test_electron_icon_follows_theme` / `test_electron_zoom_locked` prove the *parity
  contract* being mirrored. The visual/behavioural halves are surfaced to the user for
  sign-off. Not a false-pass risk for the port's central promise (a branded, installable,
  offline app), which is fully machine-verified.

### C-002: criterion 2's zoom lock has no executed negative test
- **Where:** `e2e-tests.md` criterion 2
- **Quote:** "an accidental pinch / Ctrl-wheel gesture cannot … collapse the reader" — not driven
- **Failure mode:** negative-path
- **Why it matters:** the SHALL is a negative property ("a zoom gesture does *not* change
  scale / collapse layout"); no test simulates the gesture and asserts the non-effect.
- **Suggested response:** defer-with-rationale — simulating a trackpad pinch inside
  WebView2 requires the same deferred driver harness. The lock uses WebView2's canonical
  `ICoreWebView2Settings::SetIsZoomControlEnabled(false)` (pinch/Ctrl-wheel) **plus**
  `zoom_hotkeys_enabled(false)` (keyboard) — two independent, documented mechanisms — and
  the analogous Electron lock is E2E-asserted (`test_electron_zoom_locked`). Belongs to
  the full-port WebDriver E2E follow-up.

### C-003: the *chapter* screenshot depends on a coordinate click that could miss
- **Where:** `integration-tests.md` launch / `evidence/tauri-reader.png`
- **Quote:** "opening Marginalia lands on the Colophon chapter"
- **Failure mode:** flake-risk (capture reproducibility, not product behaviour)
- **Why it matters:** the reader shot was produced by a scripted click at ~46% window
  height; on a different layout the click could land off a card and the shot would show
  the home instead.
- **Suggested response:** defer/acknowledge — the **Bibliotheca** capture is deterministic
  (no click) and already proves offline render + branding + the "T" icon; the chapter
  capture is corroborating, and native directory-route rendering is independently proven
  by the INT-0015 spike and by the browser/Electron E2E on the same `dist/`. It is
  evidence-capture tooling, not a product code path, so no product flake is implied.

## Confidence
proceed-with-caveats
