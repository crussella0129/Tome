# Sprint 7 Unit and Static Tests

- **Tested head:** `a00a30058b4252ee96ba5366d47a140a6888479e`
- **Task commit:** `f635ad10835e474f1238ce544d349ec96affc688`

## T-207 focused contract test

`npx vitest run src/lib/__tests__/ci-workflow.test.ts` → **1 passed / 0 failed / 1 total**.

- `test_ci_workflow_valid` collects every `actions/upload-artifact@...`
  reference and requires the exact list `['actions/upload-artifact@v7']`; a
  stale v5 reference or duplicate uploader therefore fails.
- The same named test asserts the complete upload block: noncancelled condition,
  `playwright-report` name, `playwright-report/` path, and 30-day retention.
- No stubs or mocks are used; the test reads `.github/workflows/ci.yml` directly.

## Canonical unit regression gate

`npx vitest run` → **49 passed / 0 failed / 49 total** across **9 files**.
This includes the focused T-207 test plus all parser, loader, routing, component,
contrast, font, and path regression tests.

## Static checks

- `npx astro check` → **0 errors / 0 warnings / 0 hints** across 35 files.
- Neutronium audit → **passed**. Its two `.map()` warnings were reviewed as
  non-JSX data transformations (`THEMES` class extraction and test link-attribute
  extraction), not Solid rendering.
