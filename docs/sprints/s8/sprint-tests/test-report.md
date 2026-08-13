# Sprint 8 Test Report

## Intent Verification

| Intent | Acceptance criterion | EARS / tests | Result | Intent evidence update |
|--------|----------------------|---------------|--------|------------------------|
| [INT-0006](../../../intents/INT-0006-browser-verified-external-books.md) | 1 — Chromium renders fixture-specific chapter/navigation and excludes bundled content | T-205 external-page clause / `test_external_book_renders_in_browser` | pass | Test evidence links this report; eligible for realized after completion evidence |
| [INT-0006](../../../intents/INT-0006-browser-verified-external-books.md) | 2 — the relative image is visible, decoded, and sacred-prose styled | T-205 relative-image clause / `test_external_relative_image_loads` | pass | Test evidence links this report; eligible for realized after completion evidence |
| [INT-0006](../../../intents/INT-0006-browser-verified-external-books.md) | 3 — external mode is isolated from the ordinary suite/report | T-205 mode-isolation clause / `test_playwright_mode_selection`, `gate_external_report_isolation` | pass | Test evidence links this report; eligible for realized after completion evidence |
| [INT-0006](../../../intents/INT-0006-browser-verified-external-books.md) | 3 — existing CI gate serializes browser proof and restores the sample on success/failure | T-205 gate/cleanup clause / `gate_external_failure_cleanup`, `gate_external_build_browser`, `gate_hosted_external_browser` | pass | Negative cleanup, local success, and hosted Linux evidence recorded; eligible for realized after completion evidence |
| [INT-0006](../../../intents/INT-0006-browser-verified-external-books.md) | Regression boundary — no unrelated application or workflow-contract regression | T-205 local-verification clause / `gate_unit_suite`, `gate_astro_check`, bundled Playwright and multi-book confirmations | pass | Canonical local and hosted regressions recorded; eligible for realized after completion evidence |

## Summary

- Unit tests: 49 passed / 0 failed / 49 total across 9 files.
- Mode selection: default listed exactly 8 bundled-reader tests; external mode listed exactly 2 external-book tests.
- Integration gates: 4 passed / 0 failed / 4 total (expected-failure cleanup, successful external browser gate, report isolation, and multi-book/default restoration).
- E2E tests: 10 passed / 0 failed / 10 total locally (8 bundled-reader plus 2 external-book); the same browser paths passed in hosted CI.
- Static checks: Astro reported 0 errors / 0 warnings / 0 hints across 36 files.
- CI status: green.

## CI Confirmation

- **Head SHA:** `38ed51208d14aa3e3421542672054f092671de1d`
- **CI run:** [31733596864](https://github.com/crussella0129/Tome/actions/runs/31733596864)
- **Conclusion:** success
- **Confirmations:** hosted `verify` job `94559750900` passed in 1m50s. The `External book build gate` log explicitly records `test_external_book_renders_in_browser` and `test_external_relative_image_loads` passing 2/2 on Linux, followed by both fixture output cases and the default rebuild. The ordinary E2E, multi-book, and artifact-upload steps also passed; report artifact `9194257287` was published.

## Failures

None. The deliberately unavailable browser-path execution was an expected
negative test: it exited nonzero and proved complete scoped content restoration.

## Technical Debt Identified

None introduced by Sprint 8. Existing backlog T-206 (parent-relative assets)
and T-208 (theme hydration-test hardening) remain deliberately outside this
verification intent.

## Coverage Observations

The new browser proof joins external source ingestion, production build,
foreground static serving, semantic navigation assertions, browser image decode,
and computed sacred-prose styling. Mode-list evidence and a preserved ordinary
report sentinel guard isolation. The forced launch failure exercises the actual
cleanup path, while the pristine-target preflight prevents the destructive gate
from touching user content. Hosted Linux execution complements the local Windows
run and confirms the unchanged CI step owns the new proof.
