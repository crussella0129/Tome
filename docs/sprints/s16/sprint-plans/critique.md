# Plan Critique — Sprint 16

## Concerns

### C-001: criterion 2 (faithful aesthetic) is a visual judgment — must be surfaced, not self-certified
- **Where:** `build-plan.md` T-039 / `INT-0015` acceptance criterion 2
- **Quote:** criterion 2 — "the ink-on-paper aesthetic … is intact and comparable to the Electron/Chromium rendering"
- **Failure mode:** intent-drift (unverifiable-judgment realization)
- **Why it matters:** "renders comparably / the aesthetic is intact" is an experiential judgment. Per the Loop-phase authority, realization that rests on visual/experiential judgment must be surfaced to a human, not self-asserted — otherwise a spike could be marked "go" on my say-so alone.
- **Suggested response:** fix-in-plan — **addressed.** T-039 now captures the rendered-chapter screenshot and **surfaces it to the user for confirmation**; the go/no-go records my observation plus the objective evidence (build result, bundle size, route/asset resolution), but the aesthetic sign-off is explicitly the user's.

### C-002: no automated tests for the EARS clauses (build/launch/observation instead)
- **Where:** `test-plan.md` End-to-End Tests (status: not-yet-possible)
- **Quote:** "a full automated Tauri E2E needs a WebDriver harness … disproportionate for a throwaway spike"
- **Failure mode:** e2e-drift (potential)
- **Why it matters:** the criteria are verified by a manual build + launch + screenshot rather than named automated tests, which a stricter reading could call a cop-out.
- **Suggested response:** reject (the critique is wrong because …) — a spike's *purpose* is a cheap, reversible proof-of-concept and a decision; standing up `tauri-driver`/WebdriverIO is exactly the follow-on cost a spike exists to justify. The unlocking work is named (the full-port intent on a "go"), the isolation/no-regression of every *existing* automated suite is asserted, and if a Rust custom-protocol resolver is added it carries a Rust unit test. Automating the throwaway would defeat the spike.

## Confidence
proceed-with-caveats
