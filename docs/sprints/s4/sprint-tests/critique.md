# Test Critique — Sprint 4

## Concerns

### C-001: CI runtime confirmation is observed at the checkpoint, not the test phase
- **Where:** `integration-tests.md` `check_external_build` runs locally + in CI, but the CI conclusion is only observable once the PR runs.
- **Quote:** "local + CI".
- **Failure mode:** evidence-drift
- **Why it matters:** the gate and all suites are green locally, but the CI job actually executing the extended gate on `@v5` actions is confirmed only on the PR run.
- **Suggested response:** defer-with-rationale — inherent to CI (as in Sprints 1–3); the checkpoint opens the PR and its conclusion is recorded. Every gate is green locally at `1f249f5`.

### C-002: No external/`docs`-layout render in a headless browser
- **Where:** `e2e-tests.md` status vs. INT-0004 criterion 1.
- **Quote:** "an external-book browser E2E remains deferred".
- **Failure mode:** e2e-cop-out
- **Why it matters:** `check_external_build` asserts the built HTML (routes, title, image `src`), but no browser loads the `docs`-layout book to confirm it paints.
- **Suggested response:** defer-with-rationale — the render pipeline is identical to the sample (full browser E2E) and to the standard external book; detection changes only *which files* are copied, which the build gate + the CubiKan smoke exercise directly. Carried as backlog T-205.

## Confidence
proceed-with-caveats
