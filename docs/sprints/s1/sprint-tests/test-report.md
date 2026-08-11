# Sprint 1 Test Report

## Intent Verification
| Intent | Acceptance criterion | EARS / tests | Result | Intent evidence update |
|--------|----------------------|---------------|--------|------------------------|
| [INT-0001](../../../intents/INT-0001-tome-ink-on-paper-mdbook-viewer.md) | 3 — Mekzantine self-hosted (no runtime CDN), AA contrast | T-006 `test_fonts_self_hosted`, `gate_font_fetch`, `test_font_fallback_present` (+ Sprint 0 contrast/theme tests) | pass | Test evidence adds this report |
| [INT-0001](../../../intents/INT-0001-tome-ink-on-paper-mdbook-viewer.md) | 5 — Markdown coverage **incl. images** | T-007 `test_chapter_image_styled` (+ Sprint 0 code/prose/table/quote/link) | pass | Test evidence adds this report |
| [INT-0001](../../../intents/INT-0001-tome-ink-on-paper-mdbook-viewer.md) | 6 — honour prefers-reduced-motion | T-008 `test_reduced_motion_honored` (+ toggle/focus) | pass | Test evidence adds this report |
| [INT-0001](../../../intents/INT-0001-tome-ink-on-paper-mdbook-viewer.md) | 7 — gates green, enforced in CI | T-009 `test_ci_workflow_valid`; local `astro check` + `vitest` + `playwright` green; CI run pending on the PR | pass (runtime CI observed at checkpoint) | Test evidence adds this report |

With Sprint 0 (criteria 1–4, 7) and this sprint (completing 5–6, enforcing 7,
hardening 3), **all seven INT-0001 criteria are satisfied for the bundled book**.
INT-0001 is therefore eligible for `realized` in the Loop phase. (Arbitrary
external book directories remain a separate future intent, not part of INT-0001.)

## Summary
- Unit tests: 22 passed / 0 failed / 22 total (of the 24 Vitest; 2 are integration below)
- Integration tests: 2 passed / 0 failed / 2 total (`gate_font_fetch` + Sprint 0 `test_book_routes_generated`)
- E2E tests: 8 passed / 0 failed / 8 total
- CI status: configured (first run occurs on the Sprint 1 PR; local gates green)

## CI Confirmation
- **Head SHA:** `2ec25101eabcd61d3d2392713a29fb237a5a5d4b`
- **CI run:** `.github/workflows/ci.yml`, first run on the Sprint 1 checkpoint (commit `eb88624`, [PR #2](https://github.com/crussella0129/Tome/pull/2)) — [run 31500420717](https://github.com/crussella0129/Tome/actions/runs/31500420717).
- **Conclusion:** **success** — CI `verify` job green in 53s (npm ci → astro check → vitest → playwright install → E2E all ✓). Closes critique C-001. Two non-blocking warnings: actions target Node 20 (deprecation notice; runs forced to Node 24) and the `upload-artifact` step found no `playwright-report/` (the `list` reporter emits none) — minor CI hygiene, noted below.
- **Confirmations:** local canonical-runner records:
  - `npx vitest run` → `Test Files 6 passed (6) · Tests 24 passed (24)`
  - `npx playwright test` → `8 passed (24.9s)`
  - `npx astro check` → `0 errors, 0 warnings, 0 hints`
  - `node scripts/fetch-fonts.mjs` → wrote 2 woff2 to `public/fonts/`; build emits `/fonts/…` refs
  - `bash <neutronium>/scripts/audit.sh src/` → audit passed

## Failures
None.

## Technical Debt Identified
- CI hygiene: bump `actions/*@v4` to `@v5` (Node 20 deprecation) and either add an HTML Playwright reporter or drop the `upload-artifact` step (currently uploads nothing under the `list` reporter). Non-blocking; observed as warnings on [run 31500420717](https://github.com/crussella0129/Tome/actions/runs/31500420717).
- Font-absent fallback is proven statically, not by a missing-font render (critique C-002) — proportionate.
- Mekzantine remains fetched from the CDN at build time (not vendored) due to the undocumented licence; revisit only with confirmed redistribution rights.

## Coverage Observations
Every locked EARS clause has a named, executed, passing test; the CI clause adds
a runtime confirmation at the checkpoint. E2E is now deterministic — the
foreground `serve-dist.mjs` removed the `astro preview` daemon race, so fresh
builds are served on every run locally and in CI.
