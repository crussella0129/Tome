# Sprint 3 Unit Tests

- **Runner:** Vitest 4.1.10 (jsdom)
- **Command:** `npx vitest run`
- **Head SHA:** `a72a22bcff289d2938acb4f20be0b414914f4ec1`
- **Result:** 30 passed / 0 failed / 30 total (8 files) — all Sprint 0–2 tests plus the extended CI-workflow test.

## T-014 — CI workflow (`src/lib/__tests__/ci-workflow.test.ts`, extended)
- `test_ci_workflow_valid` — in addition to the triggers + astro-check/vitest/playwright gates, now asserts `.github/workflows/ci.yml` (a) runs `check-external-build.mjs` and (b) pins `actions/checkout`, `actions/setup-node`, `actions/upload-artifact` at `@v5` with **no** `@v4` — **pass** (T-014 clauses 1–2, structural). YAML also validated via `pyyaml.safe_load`.
