Finalized - DO NOT EDIT

# Sprint 7 Build Plan

## Intents

- [INT-0005](../../../intents/INT-0005-supported-ci-artifact-upload.md) — state: planned; acceptance criteria covered: 1–3.
- [INT-0003](../../../intents/INT-0003-richer-external-book-support.md) — state: realized; provenance only, with no acceptance or lifecycle change.

## Schema Tree

- Supported CI artifact upload
  - T-207: Upgrade the Playwright report uploader to v7 and lock its workflow contract

## Execution Sequence

### T-207: Upgrade the Playwright report uploader to v7 and lock its workflow contract
- **Intent:** [INT-0005](../../../intents/INT-0005-supported-ci-artifact-upload.md)
- **Touches:** `.github/workflows/ci.yml`, `src/lib/__tests__/ci-workflow.test.ts`
- **Depends on:** no source dependency; final completion depends on explicit authority for the human-approved remote checkpoint after local verification.
- **Acceptance criterion:** INT-0005 criteria 1–3: use the v7 uploader with the existing artifact contract, enforce it structurally, and prove it at checkpoint CI.
- **Success criterion (EARS):**
  - **WHEN** the GitHub-hosted `verify` job reaches its noncancelled artifact step, **THEN** the workflow **SHALL** invoke `actions/upload-artifact@v7` for `playwright-report/` with the `playwright-report` name, 30-day retention, and existing noncancelled condition.
  - **WHEN** `test_ci_workflow_valid` inspects `.github/workflows/ci.yml`, **THEN** the test **SHALL** find exactly one `actions/upload-artifact` reference, require it to be `@v7`, and require the preserved artifact-block properties so a v5 pin, duplicate uploader, or configuration drift fails locally.
  - **WHEN** the T-207 change set is verified locally, **THEN** the complete unit suite and Astro check **SHALL** pass and the workflow YAML **SHALL** parse without error.
  - **WHEN** checkpoint CI executes the T-207 workflow, **THEN** the `verify` job **SHALL** succeed, publish a downloadable `playwright-report` artifact, and emit no Node 20 deprecation annotation attributable to `upload-artifact`.
- **Notes:** Keep default archived-directory behavior; do not add `archive: false`, change other action pins, add packages, alter gate ordering, or modify application code.
