# INT-0013 — Resilient scaling & zoom

<!-- sprint-loop-intent-v2 -->
- **Intent ID:** INT-0013
- **State:** active
- **Work evidence:** [Sprint 15 build plan (T-034, T-035)](../sprints/s15/sprint-plans/build-plan.md)
- **Completion evidence:** none
- **Code evidence:** none
- **Test evidence:** none
- **Documentation evidence:** none

## Intent

The reader renders correctly across the full range of window sizes and zoom
levels, and the desktop shell prevents an **accidental** zoom from silently
breaking the layout. The Electron shell surfaced that a stray/sticky zoom shrinks
the effective CSS viewport below the desktop breakpoint and collapses the
side-by-side layout into the mobile drawer (the sidebar fills the window and the
chapter is pushed off-screen), while the browser — pinned at 100% — looks fine.
This intent hardens the shell against that and establishes an automated scaling
guardrail so future features can be built with confidence.

## Acceptance criteria

1. In the desktop shell the window opens at 100% page zoom, and an **accidental**
   zoom gesture cannot silently change it: pinch-to-zoom (and the equivalent
   non-deliberate gesture) is prevented from altering the page zoom, and a reset
   (Ctrl+0 or equivalent) returns to 100%. Any deliberate zoom that is still
   permitted must always leave content reachable — never an unusable state.
2. Across a matrix of viewport widths — from the shell's minimum width up through
   ultrawide — at representative zoom levels, the reader, the Bibliotheca, and the
   **open search overlay** produce no horizontal overflow, and the search dialog
   is never clipped outside the viewport.
3. The responsive layout mode is correct at each breakpoint boundary: a single
   column below the small breakpoint, two columns at the medium breakpoint, and
   three columns (with the "on this page" rail) at the wide breakpoint — asserted
   programmatically, not only by eye.
4. A fuzz/sweep test suite encodes criteria 2–3 (viewport size × zoom) and runs
   both in the browser suite and against the Electron shell (for the zoom-lock
   behavior), so scaling regressions are caught automatically.

## Rationale

At 100% zoom the responsive CSS is robust (no horizontal overflow or dialog
clipping at any width, and the window's min-width already prevents ultra-narrow
viewports). The failure is Electron-specific: pinch / Ctrl-wheel zoom is enabled
by default, persists invisibly within a session, and — because it shrinks the
effective viewport — trips the responsive breakpoints. Nothing currently guards
against zoom-induced breakage or future responsive regressions. Locking accidental
zoom in the shell plus a scaling sweep makes the app trustworthy before more
features land.

## Alternatives

- Lower or remove the responsive breakpoints so zoom never collapses the layout.
  Rejected: the breakpoints are correct for genuine small viewports; the defect is
  accidental zoom, not the breakpoints.
- Disable page zoom entirely. Rejected: page zoom is the only text-enlargement
  affordance (accessibility); we disable only the accidental gesture and keep a
  reset, not deliberate enlargement.

## Consequences

- The shell gains zoom management (reset on load, accidental-gesture zoom
  disabled, a reset control). The exact mechanism (`setVisualZoomLevelLimits`,
  a `before-input-event` / wheel clamp, or both) is chosen during build after
  confirming how Windows delivers the gesture (pinch vs. Ctrl-wheel page zoom).
- The scaling sweep becomes a reusable guardrail; new layout/feature work is
  expected to keep it green.

## Transition history

- 2026-08-15: created as `proposed` during Sprint 15 research — the desktop shell
  (INT-0012) surfaced a zoom-induced layout collapse; reproduced by a size×zoom
  sweep in Electron (OS DPI scaling ruled out — Electron sizes in DIP).
- 2026-08-15: `proposed → planned` — Sprint 15 plans T-034 (shell zoom hardening:
  reset on load, disable pinch, snap back accidental wheel/pinch zoom, Ctrl+0
  reset) and T-035 (browser responsive scaling sweep), covering all four criteria.
- 2026-08-15: `planned → active` — Sprint 15 Build Phase began with T-034.
