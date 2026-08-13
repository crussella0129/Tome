# Sprint 7 Test Report

## Intent Verification

| Intent | Acceptance criterion | EARS / tests | Result | Intent evidence update |
|--------|----------------------|---------------|--------|------------------------|
| [INT-0005](../../../intents/INT-0005-supported-ci-artifact-upload.md) | 1 — v7 uploader preserves the Playwright artifact contract | T-207 hosted-step clause / `test_ci_workflow_valid`, `test_ci_yaml_valid` | pass | Test evidence links this report; eligible for realized after completion evidence |
| [INT-0005](../../../intents/INT-0005-supported-ci-artifact-upload.md) | 2 — the contract test prevents stale, duplicate, or drifted uploader configuration | T-207 workflow-inspection clause / `test_ci_workflow_valid` | pass | Test evidence links this report; eligible for realized after completion evidence |
| [INT-0005](../../../intents/INT-0005-supported-ci-artifact-upload.md) | 1 plus the no-application-change boundary | T-207 local-regression clause / `gate_unit_suite`, `gate_astro_check`, `test_ci_yaml_valid` | pass | Full local regression evidence recorded; eligible for realized after completion evidence |
| [INT-0005](../../../intents/INT-0005-supported-ci-artifact-upload.md) | 3 — hosted checkpoint succeeds, publishes the report, and emits no uploader Node 20 annotation | T-207 checkpoint clause / `gate_ci_upload_artifact_v7` | pass | Run, job, artifact, digest, and empty annotations evidence recorded; eligible for realized after completion evidence |

## Summary

- Unit tests: 49 passed / 0 failed / 49 total across 9 files.
- Integration tests: 3 passed / 0 failed / 3 total (workflow YAML, external-book build gate, and multi-book build gate).
- E2E tests: 9 passed / 0 failed / 9 total (8 Playwright cases plus the hosted artifact-upload gate).
- Static checks: Astro reported 0 errors / 0 warnings / 0 hints; the Neutronium audit passed after reviewing two benign non-JSX `.map()` warnings.
- CI status: green.

## CI Confirmation

- **Head SHA:** `a00a30058b4252ee96ba5366d47a140a6888479e`
- **CI run:** [31700205126](https://github.com/crussella0129/Tome/actions/runs/31700205126)
- **Conclusion:** success
- **Confirmations:** the hosted `verify` job completed successfully; all canonical unit, Playwright, external-book, and multi-book gates passed; `Upload Playwright report` passed; artifact `playwright-report` (ID `9180951683`) was published with digest `sha256:803e5dc4ef75c2ae036363ddfbde3389827298a092fb124b8090300364faea9c`; and the check-run annotations list was empty.

## Failures

None.

## Technical Debt Identified

None within Sprint 7 scope. Immutable full-SHA action pinning remains a possible repository-wide hardening policy, not a defect in this floating-major maintenance sprint.

## Coverage Observations

The structural contract test fails on a stale major, duplicate uploader, or drift in the artifact condition, name, path, or retention. Hosted evidence complements that local test by proving the v7 runtime completed the real service upload and exposed the downloadable artifact without a Node 20 deprecation annotation. Full application, external-book, multi-book, and browser gates demonstrate that the workflow-only change did not alter Tome behavior.
