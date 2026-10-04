# Sprint 23 Test Report

## Intent Verification
| Intent | Acceptance criterion | EARS / tests | Result | Intent evidence update |
|--------|----------------------|---------------|--------|------------------------|
| [INT-0025](../../../intents/INT-0025-sanguine-sidebar-void.md) | AC1 — void ground, salmon lettering, crimson channel, contrast on every ground | T-062 / `test_sanguine_sidebar_void`, `test_sanguine_sidebar_contrast`, drift guard | **pass** | Test evidence links this report |
| [INT-0025](../../../intents/INT-0025-sanguine-sidebar-void.md) | AC2 — briar on the column edge, decorative, hidden when stacked | T-062 / `test_sanguine_sidebar_void` (1440, 600) | **pass** | (as above) |
| [INT-0025](../../../intents/INT-0025-sanguine-sidebar-void.md) | AC3 — refined hairlines replace plain dividers | T-062 / `test_sanguine_sidebar_void` | **pass** | (as above) |
| [INT-0025](../../../intents/INT-0025-sanguine-sidebar-void.md) | AC4 — salmon chips ≥ 4.5:1, robust, print black | T-062 / `test_sanguine_code_chips_salmon`, `test_sanguine_chip_contrast`, WebKit/Chromium render check | **pass** (caveat C-002) | (as above) |
| [INT-0025](../../../intents/INT-0025-sanguine-sidebar-void.md) | AC5 — dialog, inscription, Bibliotheca, Light/Dark unchanged | T-062 / dialog-ink check, updated inscription test, unchanged theme/reader suites | **pass** | (as above) |

All criteria are proven by automated evidence. The look itself goes to the
user for sign-off (C-001) before INT-0025 is marked realized.

## Summary
- Vitest: **178 passed / 0 failed** (27 files), five consecutive full runs.
- Playwright (Chromium): **39 passed / 0 failed**.
- `astro check`: 0 errors, 0 warnings, 0 hints.
- Test critic: **proceed-with-caveats** (C-001/C-002 deferred, C-003 rejected).
- CI: **green** on the exact build head.

## CI Confirmation
- **Head SHA:** `277e5979e31e544a93a01d7fb9780655b9512ef1`
- **CI run:** [37237910279](https://github.com/crussella0129/Tome/actions/runs/37237910279)
- **Conclusion:** success
- **Confirmations:** `verify` succeeded for checkout/setup-node v7, dependency installation, Type check, Unit & integration tests, End-to-end tests, External/Multi-book/Search gates, and Playwright-report upload.

## Failures
None against the locked plans.

Resolved during Build, retained for provenance:
- the planned inset-shadow chip technique hid the text in WebKit and Chromium;
  replaced by multi-layer clipping (INT-0025 Alternatives corrected);
- an ID collision with INT-0024's backlog (renumbered T-063/T-064);
- a pre-existing Windows cleanup race in the fixture tests (bounded retry in
  the tests' own cleanup).

## Technical Debt Identified
- No WebKit project in the Playwright config; iPad-engine rendering is checked
  by scratch renders, not CI. Worth adding alongside INT-0024's tablet work.
