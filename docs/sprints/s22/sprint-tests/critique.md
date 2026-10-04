# Test Critique — Sprint 22

## Concerns

### C-001: A locked EARS clause was superseded mid-sprint
- **Where:** `build-plan.md` T-056 EARS 1 / `test-plan.md` `test_sanguine_role_contrast`
- **Quote:** "its body text **SHALL** be ≥ 5.0:1 … against each of the page, panel, and input surfaces"
- **Failure mode:** EARS-coverage
- **Why it matters:** The shipped theme no longer meets that clause literally. Chapter ink is `#d50210` at ≥ 24px (3.31–3.67:1), so a reader of the locked plan alone would see a failure.
- **Suggested response:** reject (the critique is wrong because the change is an explicit, user-directed intent revision rather than drift). INT-0022 AC4 was revised with Transition history, `sprint-meta.md` records the plan amendment and T-061, and `test_sanguine_role_contrast` + `test_sanguine_inscription_contrast` prove the revised criterion: interface ≥ 4.5:1 everywhere and inscription ≥ 3.3:1 at ≥ 24px.

### C-002: "Reads as obsidian and blood" is experiential
- **Where:** `INT-0022` AC5 / `e2e-tests.md` Human verification
- **Quote:** "The theme reads as obsidian and blood, not flat red on black."
- **Failure mode:** e2e-cop-out
- **Why it matters:** Automated tests prove the surface, channels, flourishes, motion, and print behaviour exist and behave correctly, but not that the result evokes the intended response.
- **Suggested response:** defer-with-rationale. The screenshots are committed under `evidence/` and surfaced to the user for sign-off. INT-0022 is not marked realized until the user confirms.

### C-003: The default home-folder scan is exercised only by a manual run
- **Where:** `INT-0023` AC1 / `unit-tests.md` T-059
- **Quote:** "scans one or more directories (default: the user's home, bounded depth …)"
- **Failure mode:** intent-coverage
- **Why it matters:** The automated tests always pass an explicit root, so the default-root code path is not unit tested.
- **Suggested response:** defer-with-rationale. A test that scans a CI runner's or developer's real home folder would be slow, nondeterministic, and invasive. The default is a one-line `homedir()` fallback, and the real-machine run (31 books under the home folder at depth 3) is recorded in `integration-tests.md`.

### C-004: Touch is proven by size, not by a tap
- **Where:** `INT-0022` AC1 "operable by keyboard and touch" / `test_theme_controls_touch_targets`
- **Quote:** "every option and dialog control ≥ 44×44"
- **Failure mode:** weak-assertion
- **Why it matters:** No test dispatches a touch event.
- **Suggested response:** defer-with-rationale. The controls are native `<button>`/`<input>` elements whose click handlers are touch-activated by every browser. The E2E suite activates them with real pointer clicks, and the AC6 size requirement is asserted at a tablet viewport.

### C-005: Pixel-bound test depends on one region and one viewport
- **Where:** `e2e-tests.md` `test_sanguine_surface_and_channels`
- **Quote:** "real screenshot pixels of the obsidian brighter than the bare page but ≤ the sheen luminance"
- **Failure mode:** flake-risk
- **Why it matters:** The flicker animation and tile placement vary over time and by position.
- **Suggested response:** reject (the critique is wrong because the bound is position- and time-independent). Each channel is hard-capped inside the filter and the layer opacity is fixed. The flicker only darkens (opacity ≤ 1 on a darkening vignette), and the test also asserts the texture is visible at all. It passed in every full run this sprint.

## Confidence
proceed-with-caveats
