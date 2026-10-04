# Plan Critique — Sprint 23

## Concerns

### C-001: Visual fidelity to the approved mock is experiential
- **Where:** `test-plan.md` End-to-End "Human verification"
- **Quote:** "screenshots … surfaced for the user's sign-off against the approved mock"
- **Failure mode:** e2e-drift
- **Why it matters:** Computed-style tests prove the colours, briar, and hairlines exist, not that the result matches what the user approved.
- **Suggested response:** defer-with-rationale — the sign-off route is already planned; INT-0025 is not realized until the user confirms.

### C-002: Superseding Sprint 22 expectations could hide a regression
- **Where:** `build-plan.md` T-062 Notes
- **Quote:** "Supersedes Sprint 22's E2E expectations of bone sidebar links and bone chips."
- **Failure mode:** intent-drift
- **Why it matters:** Editing an existing test to new values could mask an unintended change to the inscription or other surfaces.
- **Suggested response:** fix-in-plan — applied: only the sidebar-link and chip assertions move; the inscription ink/size, table-cell bone, and dialog-background assertions stay, and T-062 EARS 6 plus INT-0025 AC5 require them unchanged.

## Confidence
proceed-with-caveats
