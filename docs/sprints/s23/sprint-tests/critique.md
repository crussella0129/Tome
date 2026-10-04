# Test Critique — Sprint 23

## Concerns

### C-001: Visual match to the approved mock is a human judgment
- **Where:** `e2e-tests.md` Human verification
- **Quote:** "Surfaced for the user's sign-off."
- **Failure mode:** e2e-cop-out
- **Why it matters:** Computed styles prove the parts exist; only the user can confirm the result is the look they approved.
- **Suggested response:** defer-with-rationale — the screenshots are committed and surfaced; INT-0025 is realized only after the user confirms.

### C-002: Gradient chips are verified in Chromium E2E only
- **Where:** `test_sanguine_code_chips_salmon` / `INT-0025` AC4 "rendered robustly"
- **Quote:** "transparent fill, `#ff9a8a`→`#ec5658` gradient, text clip"
- **Failure mode:** weak-assertion
- **Why it matters:** iPad Safari runs WebKit, and the robustness claim is about engines.
- **Suggested response:** defer-with-rationale — the identical technique was rendered in WebKit 26.5 and checked (`integration-tests.md`), the `@supports` guard falls back to solid salmon, and adding a WebKit project to the Playwright config is out of this sprint's scope.

### C-003: The test-cleanup change touches Sprint 21 tests
- **Where:** `integration-tests.md` "Pre-existing test race, resolved"
- **Quote:** "Both cleanup helpers now retry lock errors explicitly (≤ ~5 s)."
- **Failure mode:** integration-drift
- **Why it matters:** Editing another intent's tests during this sprint could mask a real cleanup bug.
- **Suggested response:** reject (the critique is wrong because the change is confined to the tests' own temp-directory removal, keeps their path-safety checks, retries only lock errors for a bounded time, and the race was reproduced and measured outside Vitest; the gate's product cleanup and assertions are untouched).

## Confidence
proceed-with-caveats
