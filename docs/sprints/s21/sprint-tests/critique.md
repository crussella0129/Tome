# Test Critique — Sprint 21

## Concerns

### C-001: Final-rebuild failure proven through one CLI only
- **Where:** `integration-tests.md` T-054 — migrated CLIs / build-plan T-054 EARS 2
- **Quote:** "the real multibook CLI passes its fixture assertions, then its final default rebuild exits 37"
- **Failure mode:** EARS-coverage
- **Why it matters:** The EARS clause covers "a build, assertion, or final default rebuild" for every command, but only `check-multibook` is driven through a failing final rebuild at CLI level.
- **Suggested response:** defer-with-rationale — external, search, and multibook all call the same `gate.rebuildDefault()`; its failure propagation is proven at the module level (`fixture-gate.test.ts`, default-build exit 29), and every CLI sets `process.exitCode = 1` in the same top-level catch, which the four dirty-refusal tests exercise end to end. Live reload has no final rebuild.

### C-002: Caller-environment isolation proven at the gate, not per CLI
- **Where:** `INT-0021` criterion 3 / `integration-tests.md` T-053 `test_fixture_gate_isolates_environment`
- **Quote:** "real loader runs prove explicit single/multi selection and default no-op despite caller book/manifest/destination values"
- **Failure mode:** intent-coverage
- **Why it matters:** No migrated CLI is run with inherited `TOME_BOOK`/`TOME_CONFIG`/`TOME_BOOK_DEST` values set.
- **Suggested response:** defer-with-rationale — after migration no CLI builds its own environment; each passes only explicit fixture keys to `gate.build`/`gate.command`, which strip loader inputs (proven with real loader runs). The CLI build-failure test also asserts the exact `TOME_BOOKS` value its build received.

### C-003: Tested source identity
- **Where:** `unit-tests.md` / `integration-tests.md` / `e2e-tests.md` T-054 checkpoints
- **Quote:** "`9e90e33` plus only the T-054 files"
- **Failure mode:** evidence-drift
- **Why it matters:** The verification ran before the task commit existed, so a reader must trust that the tested bytes equal the commit.
- **Suggested response:** tighten-assertion — `cmp` against `git show 2648b1d:<path>` confirms all four gates, the new test, and the unchanged `fixture-gate.mjs` are byte-identical to the task commit; recorded in the test report.

## Confidence
proceed-with-caveats
