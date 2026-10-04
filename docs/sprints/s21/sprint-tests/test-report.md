# Sprint 21 Test Report

## Intent Verification
| Intent | Acceptance criterion | EARS / tests | Result | Intent evidence update |
|--------|----------------------|---------------|--------|------------------------|
| [INT-0021](../../../intents/INT-0021-safe-consistent-fixture-verification.md) | AC1 — every fixture check refuses dirty content before mutation | T-053 `test_fixture_gate_refuses_dirty_content`; T-054 `test_fixture_commands_refuse_dirty_content` ×4 (real CLIs) | **pass** | Test evidence links this report |
| [INT-0021](../../../intents/INT-0021-safe-consistent-fixture-verification.md) | AC2 — restore on success/failure; restoration and final-rebuild failures fail; both causes retained | T-053 restore/cleanup-failure tests; T-054 `test_fixture_gate_reports_build_failure`, `test_live_reload_stops_before_restore_on_failure` | **pass** (caveat C-001) | (as above) |
| [INT-0021](../../../intents/INT-0021-safe-consistent-fixture-verification.md) | AC3 — inputs isolated from inherited `TOME_*` values and local manifests | T-053 `test_fixture_gate_isolates_environment` (real loader + npm build); T-054 CLI asserts exact `TOME_BOOKS` | **pass** (caveat C-002) | (as above) |
| [INT-0021](../../../intents/INT-0021-safe-consistent-fixture-verification.md) | AC4 — external Chromium, multi-book, search, and live-reload assertions retained; verification on disposable clean content | `check:external` (Chromium 3/3), `check:multibook`, `check:search`, `check:livereload` in an isolated worktree; CI gates | **pass** | (as above) |

All four criteria and every locked T-053/T-054 EARS response are proved.
INT-0021 is eligible for `active → realized` in Loop once completion evidence
is attached. INT-0006 and INT-0009 remain realized compatibility boundaries.

## Summary
- Unit + integration (Vitest): **120 passed / 0 failed / 120 total** (22 files),
  including the 23 targeted fixture tests.
- Production fixture gates: **4 passed / 0 failed / 4 total**, each leaving
  `src/content/books/` clean in the isolated worktree.
- E2E (Playwright): **25 passed** ordinary browser suite + **3 passed**
  external-book Chromium.
- `astro check`: 0 errors, 0 warnings, 0 hints.
- Test critic: **proceed-with-caveats** (C-001/C-002 deferred with rationale,
  C-003 addressed below).
- CI: **green** on the exact final head.

## Tested source identity
The isolated runs used a detached worktree of `9e90e33` carrying the T-054
files. `cmp` against `git show 2648b1d:<path>` confirms the four gates, the new
test, and the unchanged `scripts/fixture-gate.mjs` are byte-identical to the
task commit. Follow-up `159810e` restores single-quote style only (token-identical
after quote/whitespace normalization; targeted tests 23/23 re-run).

## CI Confirmation
- **Head SHA:** `159810ead0967a58c8ba6d67c114b9cf0f848204`
- **CI run:** [37214164920](https://github.com/crussella0129/Tome/actions/runs/37214164920)
- **Conclusion:** success
- **Confirmations:** `verify` succeeded for checkout/setup-node v7, dependency installation, Type check, Unit & integration tests, End-to-end tests, External book build gate, Multi-book build gate, Search build gate, and Playwright-report upload.
- Prior head `0fcf661` (task commit + evidence): run
  [37214067143](https://github.com/crussella0129/Tome/actions/runs/37214067143),
  **success** — Type check, Unit & integration, E2E, External/Multi-book/Search
  gates.

## Failures
None against the locked Sprint 21 plan or INT-0021.

Resolved execution observations retained for provenance:
- the prior session left an unplanned `FIXTURE_GATE_SKIP_GIT_GUARD` environment
  bypass uncommitted in `scripts/fixture-gate.mjs`; it disabled AC1's guard and
  was reverted before verification (never committed);
- a Prettier run without `--single-quote` changed quote style; fixed in
  `159810e`.

## Technical Debt Identified
- [INT-0021](../../../intents/INT-0021-safe-consistent-fixture-verification.md)
  caveats C-001/C-002: final-rebuild failure and caller-environment isolation are
  proven per-CLI for multibook only, otherwise at the shared module.
- The library still materializes into tracked `src/content/books/`, so loading a
  personal book shows the committed sample as deleted and makes the gates refuse
  in the active workspace. This is a product-level explorer concern, carried to
  the next sprint's research rather than patched here.
