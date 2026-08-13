# Sprint 7 End-to-End Tests

- **Tested head:** `a00a30058b4252ee96ba5366d47a140a6888479e`
- **Task commit:** `f635ad10835e474f1238ce544d349ec96affc688`

## Local browser regression

`npx playwright test` → **8 passed / 0 failed / 8 total** using the canonical
8-worker configuration. Both theme tests passed without the known
`client:idle` hydration flake, along with chapter rendering, prose, image, code,
reduced-motion, and focus-visible coverage.

## `gate_ci_upload_artifact_v7`

- **Status:** passed.
- **Arrangement (WHEN):** commit `a00a30058b4252ee96ba5366d47a140a6888479e`
  was pushed to the configured `dev` work branch, triggering GitHub-hosted
  [CI run 31700205126](https://github.com/crussella0129/Tome/actions/runs/31700205126).
- **Hosted assertion (SHALL):** the `verify`
  [job 94447253041](https://github.com/crussella0129/Tome/actions/runs/31700205126/job/94447253041)
  completed with `success`; `End-to-end tests`, `External book build gate`,
  `Multi-book build gate`, and `Upload Playwright report` each completed with
  `success`.
- **Artifact assertion:** the run exposed artifact ID `9180951683`, named
  `playwright-report`, with digest
  `sha256:803e5dc4ef75c2ae036363ddfbde3389827298a092fb124b8090300364faea9c`,
  size 198,355 bytes, and expiration `2026-09-12T12:29:50Z`.
- **Runtime-warning assertion:** the job check run returned an empty annotations
  list, so it emitted no Node 20 deprecation annotation attributable to
  `actions/upload-artifact` (and no other warning annotation).

This hosted result supplies the remote execution evidence required by INT-0005
criterion 3; the local structural tests remain the evidence for the exact v7
workflow contract.
