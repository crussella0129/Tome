# INT-0017 — Tauri desktop shell (production port)

<!-- sprint-loop-intent-v2 -->
- **Intent ID:** INT-0017
- **State:** active
- **Work evidence:** [Sprint 18 build plan](../sprints/s18/sprint-plans/build-plan.md) (T-044/T-045/T-046)
- **Completion evidence:** none
- **Code evidence:** none
- **Test evidence:** [Sprint 18 test report](../sprints/s18/sprint-tests/test-report.md) — all 4 criteria pass (proceed-with-caveats)
- **Documentation evidence:** none

## Intent

Take the Tauri v2 spike (INT-0015, a proven "go") to a **production port** on
Windows: bring the `src-tauri/` shell to feature parity with the Electron shell and
to a packaged, installable app. The spike already loads the built `dist/` offline in
a secure WebView2 window with external links routed to the OS browser; this intent
adds the remaining parity — Tome branding, a **theme-aware window icon**, and **zoom
hardening** — plus launch scripts and a native **installer**. The Electron shell
stays the shipping default and fallback until cross-platform parity is verified.

## Acceptance criteria

1. The Tauri shell is **productionized**: real product name/identifier and Tome
   branding (its window title is "Tome", not a spike label), the secure offline
   `dist/` loading and external-link routing from the spike retained, plus a
   **theme-aware window icon** — the near-black "T" in OS dark mode, the
   ink-on-parchment "T" in light mode — matching the Electron shell's behaviour.
2. **Zoom is hardened** so an accidental pinch / Ctrl-wheel gesture cannot shrink
   the viewport and collapse the reader into the mobile drawer (the INT-0013
   parity), while the app opens at 100%.
3. **Launch + package:** `npm run tauri:dev` runs it and `npm run tauri:build`
   produces a native **Windows installer** (NSIS and/or MSI; unsigned is acceptable
   this sprint). The Tauri icon set is generated from the Tome mark.
4. **Verified + coexisting:** the built app launches and renders a chapter offline
   with the Tome branding/icon and locked zoom (captured for review); the Electron
   shell, its E2E, and every existing gate remain green (the two shells coexist,
   Electron still the default). Cross-platform parity (Linux/WebKitGTK),
   code-signing, an automated WebDriver E2E, and the decision to make Tauri the
   default (retiring Electron) are the documented follow-on intents.

## Rationale

The spike proved Tauri renders Tome faithfully at ~8.6 MB vs Electron's ~348 MB and
resolves Astro's routes natively. The port makes it a real, installable app at
parity with Electron on the primary platform, so the two can be compared head to
head before committing to a platform switch. Keeping Electron as the fallback (the
user's stated safety net) means this remains low-risk and reversible.

## Alternatives

- Make Tauri the default and remove Electron now. Rejected: Linux/WebKitGTK parity
  is unverified (the spike was Windows-only); retiring the fallback is premature.
- Skip installers, keep it dev-only. Rejected: a "production port" must package.

## Consequences

- `src-tauri/` gains theme/icon + zoom handling and a generated icon set; the
  bundler produces an installer (a large one-time build). `electron/` is untouched.
- Signing needs a certificate (not available this sprint) → installers are
  unsigned; Linux verification needs a Linux host/CI → both are follow-on intents,
  along with the eventual default-switch/Electron-retirement decision.

## Transition history

- 2026-08-16: created as `proposed` during Sprint 18 research — the production port
  the INT-0015 spike's "go" unlocked; scoped to Windows parity + packaging, with
  Linux/signing/default-switch deferred.
- 2026-08-16: `proposed` → `planned` at Sprint 18 Plan Phase — decomposed into
  T-044 (branding + icon set + scripts), T-045 (theme-aware icon + zoom hardening),
  T-046 (package + verify + coexistence); see the linked build plan.
- 2026-08-16: `planned` → `active` at Sprint 18 Build Phase — implementation begun
  (T-044 first).
