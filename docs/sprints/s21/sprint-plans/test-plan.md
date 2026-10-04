Finalized - DO NOT EDIT

# Sprint 21 Test Plan

## Intent Traceability

All tests below verify [INT-0021](../../../intents/INT-0021-safe-consistent-fixture-verification.md).
Criterion 1 maps to dirty preflight and real CLI refusal; criterion 2 maps to
restoration and error propagation; criterion 3 maps to environment isolation;
criterion 4 maps to all four production gates and ordinary browser regressions.

| Task / clause | Named verification |
|---|---|
| T-053 dirty content preflight | `test_fixture_gate_refuses_dirty_content`: tracked/staged/untracked/ignored cases, callback not executed, original bytes preserved |
| T-053 successful restoration | `test_fixture_gate_restores_success`: tracked sample restored, generated fixture removed, outside sentinel preserved |
| T-053 failed action restoration | `test_fixture_gate_restores_failure`: same preservation checks after an action throws |
| T-053 restoration failure | `test_fixture_gate_reports_cleanup_failure`: restoration failure rejects; simultaneous action failure retains both causes |
| T-053 input isolation | `test_fixture_gate_isolates_environment`: inherited TOME overrides cannot select a different fixture, alter the destination, or affect the default rebuild |
| T-054 shared lifecycle / exit status | `test_fixture_commands_refuse_dirty_content`: invoke each real CLI against a dirty disposable repository and assert nonzero exit and unchanged files; existing assertions retained in review |
| T-054 final rebuild errors | `test_fixture_gate_reports_build_failure`: invoke a migrated CLI in a disposable repository whose fixture build and assertions succeed but final default build fails; assert nonzero command status, evidence that failure occurred in the final phase, and restored sample bytes |
| T-054 live-server cleanup ordering | `test_live_reload_stops_before_restore_on_failure`: start a test dev process, force a post-start assertion failure, observe dev stopped while fixture content remains, then assert original content restored and temporary book removed |
| T-054 external production path | `check:external` including existing `e2e/external-book.spec.ts` in isolated checkout |
| T-054 two-book routing | `check:multibook` in isolated checkout |
| T-054 search output and queries | `check:search` in isolated checkout |
| T-054 live reload and parent assets | `check:livereload` in isolated checkout |

## Unit Tests

T-053 error composition and process-result checks use the named cases in the
traceability table. Behavior involving Git or files is verified by integration
tests rather than by stubbing Git.

## Integration Tests

T-053/T-054 named preservation and CLI tests use real disposable Git repositories,
with actual tracked, staged, untracked, and ignored files. Failure fixtures can
hold an index lock to force restoration errors, or provide a failing build
command. Sentinel files outside the content target prove cleanup containment.

## Regression gates

Run Prettier on changed JavaScript/TypeScript, Node syntax checks, Astro check,
full Vitest, and the ordinary Playwright suite against the committed sample in
the isolated checkout. Use the repository's installed Node 24 and dependencies.
No test may restore or clean the active workspace's content library.

## End-to-end status

Possible. Existing fixture and browser gates provide the production coverage.
Failures or unavailable gates will be reported explicitly rather than counted
as passing. Temporary repositories are created under the task's writable area
or the system temporary directory; cleanup must verify their resolved paths.
