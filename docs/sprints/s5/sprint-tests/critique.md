# Test Critique — Sprint 5

## Concerns

### C-001: Live reload's end-to-end proof runs locally only, not in CI
- **Where:** `integration-tests.md` `check_live_reload` ("local", not CI) vs. INT-0003 criterion 3.
- **Quote:** "Kept local (dev-server + timing), not CI".
- **Failure mode:** e2e-cop-out
- **Why it matters:** the only *end-to-end* proof of criterion 3 is a local gate; CI proves the pieces (`resolveBookSource`, `syncPath`) but not the live loop.
- **Suggested response:** defer-with-rationale — a dev-server + file-timing test is genuinely flaky in CI; the spike proved the mechanism, the unit pieces run in CI, the gate ran green (twice) locally, and the CubiKan manual path is documented. CI-ifying it is possible follow-up, not worth the flake now.

### C-002: CI runtime confirmation is at the checkpoint, not the test phase
- **Where:** the standard CI-observed-at-PR pattern.
- **Quote:** n/a (recurring).
- **Failure mode:** evidence-drift
- **Why it matters:** the PR's CI run is the reproducible conclusion; it's observed after the sprint closes.
- **Suggested response:** defer-with-rationale — inherent to CI; recorded at the checkpoint. Live reload is dev-only, so `build`/CI are unaffected and all CI-run gates are green locally at `2232715`.

## Confidence
proceed-with-caveats
