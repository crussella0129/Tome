# INT-0021 — Safe, consistent fixture verification

<!-- sprint-loop-intent-v2 -->
- **Intent ID:** INT-0021
- **State:** realized
- **Work evidence:** [T-053 and T-054 build plan](../sprints/s21/sprint-plans/build-plan.md)
- **Completion evidence:** [T-053 completion](../work/completed-tasks.md#t-053-sprint-21), [T-054 completion](../work/completed-tasks.md#t-054-sprint-21)
- **Code evidence:** [shared fixture gate](../../scripts/fixture-gate.mjs), [migrated gates](../../scripts/check-live-reload.mjs), [real-CLI tests](../../src/lib/__tests__/fixture-commands.test.ts)
- **Test evidence:** [Sprint 21 test report](../sprints/s21/sprint-tests/test-report.md)
- **Documentation evidence:** [README build-gate guidance](../../README.md)

## Intent

Refactor the four existing fixture verification commands around one shared
build/environment/cleanup lifecycle. They must preserve local book edits, keep
their existing production assertions, and report failures consistently. This
is a maintenance follow-on to the realized external-book and live-reload
verification intents. Reader UI, rendering, routing, search algorithms,
dependencies, desktop shells, and native library-management work are outside
this pass.

## Acceptance criteria

1. Every fixture check refuses before mutation when `src/content/books/` has
   tracked, staged, untracked, or ignored local changes. Neither fixture setup
   nor restoration executes after a failed preflight; existing bytes survive.
2. For a clean starting library, success and failure both restore its tracked
   content and remove fixture residue only inside that fixed content path.
   Restoration failures fail the command; simultaneous action and restoration
   errors retain both causes. Final default rebuild failures are also failures.
3. Fixture commands isolate book selection, destination, and manifest inputs
   from inherited `TOME_*` values and local manifest book entries. Explicit
   fixtures determine the test library; the final default rebuild uses the
   restored sample. No caller-selected external destination is written.
4. External-book Chromium rendering and assets, multi-book routes/switcher,
   search-index queries, and live-reload chapter/parent-asset assertions remain
   covered by the four existing commands. Verification runs against disposable
   clean content when the active workspace contains personal books.

## Rationale

The external-book check already has a clean-content guard and strict cleanup.
The multi-book, search, and live-reload checks duplicate the lifecycle but can
discard local content, and several restoration/rebuild errors are swallowed.
Inherited loader environment values can also override the intended fixture.
Sharing this responsibility removes drift between checks and makes a refactoring
pass useful without changing the reader's public behavior.

## Alternatives

- Add independent guards to each script. Rejected because duplicated cleanup
  and environment rules would continue to drift.
- Snapshot and replace arbitrary dirty libraries during every check. Deferred
  because it introduces a broader publication/rollback mechanism; refusing dirty
  content is already the established external-check contract.
- Rewrite Node tooling in Rust. Rejected because these checks orchestrate the
  existing JavaScript toolchain; a language change adds no value to this pass.
- Reopen INT-0006 or INT-0009. Rejected because those intents are realized;
  this is a separate maintainability and verification-safety outcome.

## Consequences

- All four commands require pristine content, not just the external check.
- A small shared Node module owns destructive cleanup under one fixed path.
- Disposable Git repositories exercise failure behavior; full production checks
  run serially in an isolated checkout because they share content and build output.
- Guarding preserves local files but intentionally does not make the checks
  concurrent or permit editing the content tree while a check is running.
- Live reload must own its dev process and verify it has stopped before
  restoration. If that cannot be established, cleanup fails explicitly and
  retains the fixture and temporary input for diagnosis; it cannot safely
  restore under a running watcher.
- The existing T-052 native library-management backlog remains separate.

## Transition history

- 2026-09-06: created as `proposed` during Sprint 21 research in response to the
  user's requested refactoring pass.
- 2026-09-06: `proposed → planned` — the user approved the T-053/T-054 build and
  test plans ("approve continue").
- 2026-09-06: `planned → active` — finalized plans passed independent review;
  Build began with T-053 shared lifecycle and preservation tests.
- 2026-10-04: `active → realized` — T-053 extracted the guarded lifecycle and
  T-054 migrated all four gates onto it. Real-CLI tests prove dirty refusal,
  final-rebuild failure, and stop-before-restore ordering; all four production
  gates passed in an isolated worktree with clean content afterward; CI run
  37214164920 succeeded at `159810e`. Test critique: proceed-with-caveats
  (per-CLI final-rebuild and environment-isolation proofs rest on the shared
  module for three of four gates).
