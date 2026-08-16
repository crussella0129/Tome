# Test Critique — Sprint 19

## Concerns

### C-001: criteria 2 & 3 (render, branding, zoom) rest on visual judgment + manual WSLg driving
- **Where:** `e2e-tests.md` criteria 2–3 / `INT-0018` acceptance criteria 2, 3
- **Quote:** "WSLg launch: Bibliotheca + Colophon chapter render offline … title 'Tome' … no collapse"
- **Failure mode:** weak-assertion / e2e-cop-out
- **Why it matters:** the render, branding, and zoom-stability are confirmed by screenshots
  and observation (xdotool-driven click, `xwd` capture), not by a machine assertion that
  fails on regression.
- **Suggested response:** defer-with-rationale — an automated native-shell E2E needs the
  `tauri-driver`/WebDriver harness INT-0018 names as a follow-up (as on Windows). There is a
  strong objective floor: the `.deb`/AppImage **build** and the full **coexistence** suite are
  machine-verified; the zoom clause has a genuine **negative test** (12× Ctrl+scroll →
  byte-identical capture); the title reads "Tome"; and the identical `dist/` is covered E2E by
  the browser (21/21) + Electron (6/6) suites. Renders surfaced to the user for sign-off.

### C-002: the theme-aware icon is "best-effort" and not shown under WSLg's Weston frame
- **Where:** `e2e-tests.md` / `port-verification.md` icon note
- **Quote:** "under WSLg's Weston frame the window icon isn't surfaced in the title bar"
- **Failure mode:** weak-assertion
- **Why it matters:** the icon half of criterion 3 is not visibly demonstrated on Linux.
- **Suggested response:** accept-with-rationale — INT-0018 criterion 3 itself scopes the GTK
  icon as **"best-effort"**; `set_icon` runs (cross-platform), and a real Linux desktop uses
  the packaged `.desktop`/icon-theme "T" (not the Weston-under-WSLg frame). Not a silent
  weakening — it is the intent's stated boundary. The hard branding assertion (title "Tome")
  is demonstrated.

### C-003: the launch used a WSLg-specific software-render env
- **Where:** `e2e-tests.md` "Notes on determinism / limits"
- **Quote:** "WebKitGTK under WSLg needs the software-render env (`WEBKIT_DISABLE_DMABUF_RENDERER=1` …)"
- **Failure mode:** flake-risk / coverage-scope
- **Why it matters:** the render was verified under WSLg's GPU constraints, not on real Linux
  hardware across desktop environments.
- **Suggested response:** accept-with-rationale — those env vars are a well-known WSLg/GPU
  workaround for WebKitGTK's DMABUF renderer; on real hardware GL compositing is used and the
  **same** `.deb`/binary ships. The build + coexistence are engine/host-independent and fully
  proven; real-hardware/cross-DE coverage and a Linux CI build are documented follow-on
  intents. The offline WebKitGTK render is genuinely demonstrated (the software path renders
  identically to Chromium).

## Confidence
proceed-with-caveats
