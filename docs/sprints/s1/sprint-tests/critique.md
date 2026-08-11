# Test Critique — Sprint 1

## Concerns

### C-001: T-009's actual green CI conclusion is not yet observed
- **Where:** `e2e-tests.md` / `unit-tests.md` `test_ci_workflow_valid` vs. INT-0001 criterion 7 EARS ("WHEN a PR targets main THEN CI SHALL run … and fail on red").
- **Quote:** "Real CI conclusion to be observed on the Sprint 1 PR".
- **Failure mode:** evidence-drift
- **Why it matters:** the unit test proves the workflow is *configured* to run the gates, but the SHALL is about CI actually running and gating. That first run only exists once the `dev → main` PR is opened (the Loop checkpoint), so the runtime proof is pending at test-phase time.
- **Suggested response:** defer-with-rationale — CI runtime can only be observed once the PR exists; the checkpoint opens exactly that PR, and its conclusion will be recorded. The workflow structure is fully asserted locally, and every gate it runs (`astro check`, `vitest`, `playwright`) is independently green at `2ec2510`, so a green CI run is expected. The Loop phase records the observed conclusion.

### C-002: T-006 fallback is proven by a static token check, not a missing-font render
- **Where:** `unit-tests.md` `test_font_fallback_present` vs. T-006 clause 3.
- **Quote:** "`--font-family-mono` … includes `monospace`".
- **Failure mode:** negative-path
- **Why it matters:** the clause is "WHEN the font asset is absent THEN the reader falls back"; the test asserts the fallback is *declared*, not that rendering survives a genuinely missing font.
- **Suggested response:** reject (proportionate) — the fetch is already non-fatal and the fallback is a standard CSS font-stack; forcing an E2E that deletes the fetched woff2 to observe a monospace render is disproportionate to the risk. The static assertion that the fallback exists, plus the non-fatal fetch, adequately covers the clause.

## Confidence
proceed-with-caveats
