# Plan Critique — Sprint 19

## Concerns

### C-001: T-048's code deliverable is contingent on an empirical launch finding
- **Where:** `build-plan.md` T-048 Touches / Notes
- **Quote:** "a WebKitGTK zoom handler in the `cfg(not(windows))` path **only if** launch reveals a gap"
- **Failure mode:** granularity (uncertain diff)
- **Why it matters:** the task may ship code (a zoom handler) or none, depending on a
  runtime observation — its concrete diff isn't fixed in advance.
- **Suggested response:** accept-with-rationale — the EARS clause targets the *verified
  outcome* ("a zoom gesture SHALL NOT collapse the reader"), not a specific code change;
  zoom parity is inherently empirical (it was verified at launch on Windows too, INT-0017).
  The task delivers verified parity + a captured render regardless of whether a handler is
  needed; if WebKitGTK's default already satisfies it, the honest diff is "no shell code,
  evidence only." Not a hidden scope — the contingency is stated.

### C-002: the sprint hinges on a bleeding-edge Ubuntu 26.04 build succeeding
- **Where:** `build-plan.md` T-047 / research risks
- **Quote:** "built in WSL Ubuntu against webkit2gtk-4.1"
- **Failure mode:** missing-risk (environment dependency)
- **Why it matters:** Ubuntu 26.04 + webkit 2.52 is newer than Tauri 2.11's most-tested
  matrix; a hard build failure would block criteria 1–3.
- **Suggested response:** accept-with-rationale — `libwebkit2gtk-4.1-dev` 2.52.3
  apt-availability is verified (research probe); the mitigation is to build early and, on
  an ABI/name mismatch, pin the dev package or fall back to a 24.04 WSL distro / Docker
  image. A genuine hard failure routes to a Build-phase blockage / failure-report per the
  phase contract — the plan does not pretend success is guaranteed.

### C-003: theme-aware icon parity is scoped "best-effort on GTK"
- **Where:** `build-plan.md` T-048 EARS / `test-plan.md` criterion 3
- **Quote:** "theme-aware icon, best-effort on GTK"
- **Failure mode:** weak-assertion
- **Why it matters:** "best-effort" softens the icon half of criterion 3; a live
  theme-swap might not fire under WSLg's single compositor.
- **Suggested response:** accept-with-rationale — this is not a silent weakening: INT-0018
  criterion 3 itself scopes the GTK icon as "best-effort" because `WindowEvent::ThemeChanged`
  fidelity is desktop-environment-dependent. The icon is set at startup from
  `window.theme()` (verifiable in the launch), and the live-swap is surfaced to the user.
  The hard branding assertion (window title "Tome") remains machine-checkable.

## Confidence
proceed-with-caveats
