# Sprint 20 Test Report

## Intent Verification
| Intent | Acceptance criterion | EARS / tests | Result | Intent evidence update |
|--------|----------------------|---------------|--------|------------------------|
| [INT-0019](../../../intents/INT-0019-centered-reader-search-geometry.md) | AC1 — complete reader stack is measure-bounded, centered in the real main track, and stable through mobile navigation | T-050 / `test_scaling_reader_column_centered`, `test_scaling_reader_column_stable_with_mobile_nav` | **pass** | Test evidence links this report; T-050 completion exists; eligible for `realized` after Loop attaches all evidence |
| [INT-0019](../../../intents/INT-0019-centered-reader-search-geometry.md) | AC2 — shared trigger fills each host up to exactly 26rem, stays contained, keeps one-line copy, and avoids adjacent UI | T-051 / `test_scaling_search_trigger_usable_across_hosts` | **pass** | (as above) |
| [INT-0019](../../../intents/INT-0019-centered-reader-search-geometry.md) | AC3 — narrow open dialog preserves usable input, rendered 32×32 close target, zero overlap, and viewport containment | T-051 / `test_scaling_search_dialog_controls_do_not_compress` | **pass** | (as above) |
| [INT-0019](../../../intents/INT-0019-centered-reader-search-geometry.md) | AC4 — real geometry across both hosts, 320/480, wide headed/unheaded pages, and 768/769 + 1023/1024 edges | all four named Sprint 20 tests plus the three retained scaling regressions | **pass** | (as above) |

All four criteria and every locked T-050/T-051 EARS response are proved.
INT-0019 is eligible for `active → realized` in Loop Phase once its existing task,
code, test, and sprint-completion evidence links are attached. INT-0020 remains a
separate proposed follow-on and is not claimed by this report.

## Summary
- Unit tests: **97 passed / 0 failed / 97 total** (20 files).
- Integration gates: **5 passed / 0 failed / 5 total** — Astro check, external
  books, multi-book, search, and Electron; the Electron gate contains 6/6 tests.
- E2E tests: **34 passed / 0 failed / 34 total** — ordinary browser 25/25,
  external-book Chromium 3/3, and Electron shell 6/6.
- Direct Sprint 20 geometry: scaling **7/7**, including both hosts and every
  locked narrow, breakpoint-edge, and wide viewport.
- Independent review: implementation review clean after rendered-target
  tightening; final Test critic **clean** after the 26rem/adjacency false-pass
  gaps were fixed.
- CI status: **green** on the exact implementation head.

## CI Confirmation
- **Head SHA:** `3830b71eb2c3cab0ce3aa3f4f25aa456cbfe8d9a`
- **CI run:** [32334993225](https://github.com/crussella0129/Tome/actions/runs/32334993225)
- **Conclusion:** success
- **Confirmations:** `verify` succeeded for checkout/setup-node v7, dependency
  installation, Type check, Unit & integration tests, End-to-end tests, External
  book build, Multi-book build, Search build, and Playwright-report upload.

## Failures
None against the locked Sprint 20 plan, INT-0019, or the authoritative CI matrix.

Two resolved execution observations are retained for provenance:

- the first exact-head external-gate attempt completed the handbook build and
  Chromium 3/3, then hit a transient Windows `EPERM` during the next fixture
  swap; its cleanup restored the library and the immediate full retry passed;
- the first rendered-target assertion observed Chromium reporting exact 32px as
  `31.999998px`; a deliberately tight 0.01px tolerance preserves the contract
  without masking scaling or clipping.

## Technical Debt Identified
- [INT-0009](../../../intents/INT-0009-live-reload-parent-assets.md) maintenance:
  the optional local `check:livereload` driver launches its never-returning dev
  server through `execSync`, so this Windows invocation could not reach the
  driver's HTTP assertions. The temporary fixture and exact orphaned listener
  were cleaned. This is pre-existing harness-process debt outside INT-0019's
  locked/hosted oracle; it does not reopen INT-0009's realized product outcome.
- [INT-0020](../../../intents/INT-0020-native-library-folder-management.md): the
  requested native folder picker is intentionally preserved as T-052 backlog.
  It requires persistence plus staged, atomic route/asset/search publication in
  both desktop shells, not an inert button.

## Coverage Observations
The tests now use independent semantic oracles rather than implementation-shaped
expectations: `26rem` is resolved as 26 times the root font size, the reader
measure comes from the browser's resolved max width, and actual rectangles prove
host containment, neighboring-UI separation, rendered hit-target size, and
dialog/viewport containment. Fonts and hydration use existing product readiness
signals; no sleeps, retries, random data, or external content are involved.

The same static UI ships through Chromium, Electron, and Tauri. Chromium provides
the direct layout engine evidence, Electron provides an additional desktop-shell
regression floor, and hosted Ubuntu Chromium independently reproduced every
planned geometry test. Native Tauri WebDriver coverage remains a broader shell
follow-on, not a gap in the CSS geometry promise.
