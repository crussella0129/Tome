# Plan Critique — Sprint 22

## Concerns

### C-001: Dialog "styled by the active theme" had no assertion
- **Where:** `build-plan.md` T-055 EARS 4 / `test-plan.md` Intent Traceability AC1
- **Quote:** "a `role="dialog"` … **SHALL** open, styled by the active theme's tokens"
- **Failure mode:** plan-test-mismatch
- **Why it matters:** INT-0022 AC1 requires the dialog to be drawn in the *current* theme; the component tests only checked role and focus.
- **Suggested response:** fix-in-plan — applied: `test_theme_selector_reader_and_bibliotheca` now asserts the open dialog's computed background equals the active theme's `--theme-window-background` in both paper and dark.

### C-002: Texture-over-text contrast risk had no verification
- **Where:** `research-report.md` §4 "Risk — texture over text" / `build-plan.md` T-056 EARS 1
- **Quote:** "a lit SVG surface raises local ground luminance"
- **Failure mode:** missing-risk
- **Why it matters:** INT-0022 AC4 says the texture must never reduce the ratios; flat-surface contrast alone could pass while sheen highlights erode legibility.
- **Suggested response:** fix-in-plan — applied: T-056 EARS 1 and `test_sanguine_role_contrast` now include the brightest sheen tone the obsidian texture can produce as a fourth surface.

### C-003: Workspace cleanup ordered after the task that needs it
- **Where:** `build-plan.md` T-060 Notes (original) / approved plan decision 5
- **Quote:** "After this task, perform the user-approved local workspace cleanup"
- **Failure mode:** hidden-dep
- **Why it matters:** T-060 edits `src/content/books/tome/`, which the active workspace currently shows as deleted, and T-055–T-057 browser tests need the sample build; running the cleanup last would force every earlier verification into a disposable checkout and make T-060's edits conflict with local deletions.
- **Suggested response:** fix-in-plan — applied: a Boundaries section moves the same approved, uncommitted cleanup to the start of Build, with re-verification before deleting the stale copy. The action itself is unchanged; only its timing moves (reported to the user).

### C-004: iPad rendering cost of the procedural surface is unmeasured
- **Where:** `research-report.md` §4 "Risk — iPad performance"
- **Quote:** "SVG lighting filters are costly if re-rasterized"
- **Failure mode:** missing-risk
- **Why it matters:** a janky obsidian surface on a tablet would undercut the intent's purpose.
- **Suggested response:** defer-with-rationale — mitigated by construction (static data-URI tile on a fixed pseudo-element, rasterized once as `paper.css` already does; animation limited to opacity/transform/background-position, asserted by the reduced-motion and computed-style tests). No reliable automated frame-time gate exists for iPad Safari in this harness; the human visual sign-off at 820×1180 covers perceived quality.

### C-005: "Oh dear" quality is an experiential judgment
- **Where:** `INT-0022` AC5 / `test-plan.md` End-to-End "Human verification"
- **Quote:** "The theme reads as obsidian and blood, not flat red on black."
- **Failure mode:** e2e-drift
- **Why it matters:** automated checks prove presence of the surface/channels, not the felt effect.
- **Suggested response:** reject (as a defect) — the plan already routes this to explicit human verification with named screenshots before INT-0022 can be marked realized, which is the Sprint Loops contract for experiential claims.

## Confidence
proceed-with-caveats
