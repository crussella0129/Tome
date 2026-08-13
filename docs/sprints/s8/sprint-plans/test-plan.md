Finalized - DO NOT EDIT

# Sprint 8 Test Plan

## Intent Traceability

| Intent | Acceptance criterion | Build task / EARS clause | Verification |
|--------|----------------------|--------------------------|--------------|
| [INT-0006](../../../intents/INT-0006-browser-verified-external-books.md) | 1 — Chromium renders fixture-specific chapter/navigation and excludes bundled content | T-205 / WHEN external mode opens the prebuilt handbook `/first`, THEN Chromium SHALL show fixture content and active navigation with no sample navigation | `test_external_book_renders_in_browser` |
| [INT-0006](../../../intents/INT-0006-browser-verified-external-books.md) | 2 — the relative image is visible, decoded, and sacred-prose styled | T-205 / WHEN Chromium renders the sacred plate, THEN it SHALL be visible, decoded, and bordered | `test_external_relative_image_loads` |
| [INT-0006](../../../intents/INT-0006-browser-verified-external-books.md) | 3 — external mode is isolated from the ordinary suite/report | T-205 / WHEN either Playwright mode is invoked, THEN it SHALL select only its matching spec and preserve distinct build/port/report behavior | `test_playwright_mode_selection`, `gate_external_report_isolation` |
| [INT-0006](../../../intents/INT-0006-browser-verified-external-books.md) | 3 — existing CI gate runs browser proof and restores sample on success/failure | T-205 / WHEN browser verification runs or fails, THEN the external gate SHALL serialize it, propagate failure, restore content, and pass hosted CI when assertions pass | `gate_external_failure_cleanup`, `gate_external_build_browser`, `gate_hosted_external_browser` |
| [INT-0006](../../../intents/INT-0006-browser-verified-external-books.md) | Regression boundary — no unrelated application or workflow-contract regression | T-205 / WHEN the change set is verified locally, THEN canonical Vitest and Astro checks SHALL pass | `gate_unit_suite`, `gate_astro_check` |

## Unit Tests

### T-205 configuration and regression tests
- **Intent:** [INT-0006](../../../intents/INT-0006-browser-verified-external-books.md)
- `test_playwright_mode_selection`: use Playwright `--list` in default mode and external mode; default lists the eight bundled-reader cases and excludes `external-book.spec.ts`, while external mode lists only its two named cases. Confirm the external mode's configuration uses its dedicated port, skips `npm run build`, and selects a non-HTML reporter through observable invocation behavior/config loading.
- `gate_unit_suite`: run the canonical Vitest suite; all existing tests pass, including the workflow contract that keeps `check-external-build.mjs` in CI.
- Stubs: none; mode selection loads the real Playwright configuration.

## Integration Tests

### Serialized external build and cleanup
- **Intents:** [INT-0006](../../../intents/INT-0006-browser-verified-external-books.md)
- `gate_external_failure_cleanup`: run the external gate with a deliberately unavailable `PLAYWRIGHT_BROWSERS_PATH`; require a non-zero browser-gate result, then prove `src/content/books/` matches `HEAD` with no untracked content residue. Run before the successful gate so the latter restores the default build.
- `gate_external_build_browser`: run `node scripts/check-external-build.mjs`; require both new named Chromium tests plus both existing fixture generated-output cases to pass, then prove the committed sample is restored and the default build succeeds.
- `gate_external_report_isolation`: place or retain a sentinel in the ordinary `playwright-report/`, execute only external mode through the handbook gate, and prove the external invocation did not replace that report; clean only test-created transient output afterward.
- `gate_astro_check`: run `npm run check`; require 0 errors, warnings, and hints.

## End-to-End Tests

- **Status:** possible
- `test_external_book_renders_in_browser`: against the prebuilt handbook at `/first`, require `First Chapter` fixture prose and its active sidebar link, and require no bundled `Getting Started` link.
- `test_external_relative_image_loads`: against the same page, require the sacred plate to be visible, `complete`, positive `naturalWidth`, and have a positive computed border width.
- `gate_hosted_external_browser`: on the authorized `dev` checkpoint run, require the hosted `verify` job and `External book build gate` step to conclude `success`, with logs naming both new external-book tests; require the subsequent multi-book gate and final job to remain green.
