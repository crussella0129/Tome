# Test Critique — Sprint 3

## Concerns

### C-001: The CI runtime confirmation is observed at the checkpoint, not the test phase
- **Where:** `unit-tests.md` `test_ci_workflow_valid` (structural) vs. T-014's runtime EARS (the gate actually runs in CI, warnings gone, artifact uploaded).
- **Quote:** "Runtime CI … observed at the checkpoint PR".
- **Failure mode:** evidence-drift
- **Why it matters:** the unit test proves `ci.yml` is *configured* to run the external gate on `@v5` actions, but the gate actually executing green in CI (and the Node-20 / empty-artifact warnings being gone) is only observable once the PR runs.
- **Suggested response:** defer-with-rationale — inherent to CI; the checkpoint opens the PR and its run is recorded. Every step the gate performs is green locally (`check_external_build`, 30 Vitest, 8 Playwright), and the local Playwright run already produced `playwright-report/`, so a green run with no warnings is expected.

### C-002: No external-book **browser** E2E; relative image proven at build level only
- **Where:** `e2e-tests.md` status vs. INT-0003 criterion 1.
- **Quote:** "an external-book browser E2E remains deferred".
- **Failure mode:** e2e-cop-out
- **Why it matters:** `check_external_build` asserts the optimized `/_astro/` `<img>` in the built HTML, but no headless browser loads an external book to confirm the image paints.
- **Suggested response:** defer-with-rationale — the render pipeline is identical to the sample (which has full browser E2E, incl. `test_chapter_image_styled`), and the build gate asserts the exact optimized `src`. A browser E2E of an external book (with build-time env plumbing) is carried with the Sprint 2 deferral for a later sprint.

## Confidence
proceed-with-caveats
