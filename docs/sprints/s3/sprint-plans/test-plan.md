Finalized - DO NOT EDIT

# Sprint 3 Test Plan

## Intent Traceability
| Intent | Acceptance criterion | Build task / EARS clause | Verification |
|--------|----------------------|--------------------------|--------------|
| [INT-0003](../../../intents/INT-0003-richer-external-book-support.md) | 1 — relative image renders, sacred-styled | T-013 / WHEN built with the fixture THEN the relative image is an `/_astro/` asset | `check_external_build` |
| [INT-0003](../../../intents/INT-0003-richer-external-book-support.md) | 1 — verified remotely in CI | T-014 / WHEN CI runs on a PR THEN it SHALL run `check-external-build.mjs` | `test_ci_workflow_valid` + observed CI run |
| [INT-0003](../../../intents/INT-0003-richer-external-book-support.md) | 1 — CI actions/artifact hygiene (delivery) | T-014 / WHEN CI runs THEN actions are `@v5` and the artifact exists | `test_ci_workflow_valid` + observed CI run |

## Unit Tests

### T-014 unit tests (`src/lib/__tests__/ci-workflow.test.ts`, extended)
- **Intent:** [INT-0003](../../../intents/INT-0003-richer-external-book-support.md)
- `test_ci_workflow_valid`: in addition to the Sprint 1 assertions (triggers + astro check/vitest/playwright), assert `.github/workflows/ci.yml` (a) runs `check-external-build` (the gate step) and (b) pins `actions/checkout`, `actions/setup-node`, `actions/upload-artifact` at `@v5`. (T-014 clauses 1–2, structural)

## Integration Tests

### External build gate (`scripts/check-external-build.mjs`, runs locally and in CI)
- **Intents:** [INT-0003](../../../intents/INT-0003-richer-external-book-support.md), [INT-0002](../../../intents/INT-0002-load-external-mdbooks.md)
- `check_external_build`: build with `TOME_BOOK=fixtures/handbook`, then assert (a) a fixture route exists (`dist/first/`), (b) a sample-only route is absent (`dist/getting-started/`), and (c) the fixture chapter's relative image renders as an `/_astro/…` asset in the built HTML. Restore `src/content/book/` and exit non-zero on any failure. Covers T-013 EARS clauses 1–2 and the CI gate step invoked by T-014.

## End-to-End Tests
- **Status:** possible — the sample Playwright suite (8) must stay green (no regression from the fixture image or CI changes). The external + relative-image render is covered by `check_external_build` at the build level (browser E2E of an external book remains deferred, as in Sprint 2).

### Gates
- `check_external_build`: see Integration (also the new CI step).
- `gate_astro_check`: `npx astro check` → 0 errors.
- `gate_neutronium_audit`: `bash <neutronium>/scripts/audit.sh src/` → no violations.
- Regression: full `npx vitest run` + `npx playwright test` green on the sample.
- Observed CI: the Sprint 3 `dev → main` PR runs `ci.yml` including `check-external-build`, concludes success, and shows **no** Node-20 / empty-artifact warnings.
