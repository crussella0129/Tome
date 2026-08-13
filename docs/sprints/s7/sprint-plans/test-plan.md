Finalized - DO NOT EDIT

# Sprint 7 Test Plan

## Intent Traceability

| Intent | Acceptance criterion | Build task / EARS clause | Verification |
|--------|----------------------|--------------------------|--------------|
| [INT-0005](../../../intents/INT-0005-supported-ci-artifact-upload.md) | 1 — v7 uploader preserves the Playwright artifact contract | T-207 / WHEN the hosted job reaches the noncancelled artifact step, THEN the workflow SHALL invoke v7 with the existing name, path, retention, and condition | `test_ci_workflow_valid`, `test_ci_yaml_valid` |
| [INT-0005](../../../intents/INT-0005-supported-ci-artifact-upload.md) | 2 — workflow contract test prevents stale or duplicate uploader references | T-207 / WHEN the contract test inspects the workflow, THEN it SHALL find exactly one uploader, require v7, and require the preserved block properties | `test_ci_workflow_valid` |
| [INT-0005](../../../intents/INT-0005-supported-ci-artifact-upload.md) | 1 plus the no-application-change intent boundary | T-207 / WHEN the change set is verified locally, THEN the unit suite and Astro check SHALL pass and the workflow YAML SHALL parse | `gate_unit_suite`, `gate_astro_check`, `test_ci_yaml_valid` |
| [INT-0005](../../../intents/INT-0005-supported-ci-artifact-upload.md) | 3 — hosted checkpoint succeeds with artifact and no uploader Node 20 warning | T-207 / WHEN checkpoint CI executes, THEN verify SHALL succeed, publish the report, and emit no uploader Node 20 annotation | `gate_ci_upload_artifact_v7` |

## Unit Tests

### T-207 unit tests
- **Intent:** [INT-0005](../../../intents/INT-0005-supported-ci-artifact-upload.md)
- `test_ci_workflow_valid`: run `npx vitest run src/lib/__tests__/ci-workflow.test.ts`; collect every `actions/upload-artifact@...` reference and require the exact list `['actions/upload-artifact@v7']`, plus `if: ${{ !cancelled() }}`, artifact name `playwright-report`, path `playwright-report/`, and `retention-days: 30`; the focused test passes.
- `gate_unit_suite`: run `npm test`; all tests pass with no unrelated workflow-contract regression.
- Stubs: none; the test reads the committed workflow text directly.

## Integration Tests

### GitHub Actions workflow integration
- **Intents:** [INT-0005](../../../intents/INT-0005-supported-ci-artifact-upload.md)
- `test_ci_yaml_valid`: run `python3 -c "from pathlib import Path; import yaml; yaml.safe_load(Path('.github/workflows/ci.yml').read_text())"`; PyYAML parsing exits zero. Approved upload inputs remain covered by `test_ci_workflow_valid`.
- `gate_astro_check`: run `npm run check`; Astro reports no errors, warnings, or hints.

## End-to-End Tests

- **Status:** possible
- `gate_ci_upload_artifact_v7`: on the human-approved checkpoint run, require the GitHub `verify` job to conclude `success`, the run summary to expose a downloadable `playwright-report` artifact, and the upload step/annotations to contain no Node 20 deprecation warning attributable to `actions/upload-artifact`.
- This remote gate is required for INT-0005 criterion 3 because a local runner cannot execute the hosted action service; if remote authority is not granted in this session, record the missing evidence rather than treating structural tests as a substitute.
