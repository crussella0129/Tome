# Sprint 1 Unit Tests

- **Runner:** Vitest 4.1.10 (jsdom)
- **Command:** `npx vitest run`
- **Head SHA:** `2ec25101eabcd61d3d2392713a29fb237a5a5d4b`
- **Result:** 24 passed / 0 failed / 24 total (6 files) — includes the integration test below and all Sprint 0 tests.

## T-006 — font self-hosting (`src/styles/__tests__/fonts.test.ts`)
- `test_fonts_self_hosted` — every `@font-face src` in `fonts.css` is `/fonts/…`; no `http(s)://` in the file — **pass** (clause 1)
- `test_font_fallback_present` — `--font-family-mono` in `tokens.css` includes `monospace` — **pass** (clause 3)

## T-009 — CI workflow (`src/lib/__tests__/ci-workflow.test.ts`)
- `test_ci_workflow_valid` — `.github/workflows/ci.yml` triggers on `pull_request`→`main` and `push`→`dev`; steps run `npm ci`, `astro check`, `vitest run`, `playwright test` — **pass** (clause 1). YAML also validated via `pyyaml.safe_load`.
