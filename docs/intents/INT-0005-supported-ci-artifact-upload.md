# INT-0005 — Supported CI artifact upload

<!-- sprint-loop-intent-v2 -->
- **Intent ID:** INT-0005
- **State:** realized
- **Work evidence:** [T-207 Sprint 7 build plan](../sprints/s7/sprint-plans/build-plan.md#t-207-upgrade-the-playwright-report-uploader-to-v7-and-lock-its-workflow-contract)
- **Completion evidence:** [T-207 completion (Sprint 7)](../work/completed-tasks.md#t-207-sprint-7)
- **Code evidence:** [CI workflow](../../.github/workflows/ci.yml), [workflow contract test](../../src/lib/__tests__/ci-workflow.test.ts)
- **Test evidence:** [Sprint 7 test report](../sprints/s7/sprint-tests/test-report.md)
- **Documentation evidence:** none

## Intent

Keep Tome's Playwright diagnostic report upload on a supported official GitHub
Actions runtime while preserving the existing artifact contract. This intent is
limited to the upload action and its workflow contract test; it does not change
application behavior, CI gate coverage, or the realized scope of external-book
support.

## Acceptance criteria

1. The GitHub-hosted CI workflow uploads `playwright-report/` with
   `actions/upload-artifact@v7`, retaining the `playwright-report` name,
   30-day retention, and upload-on-noncancelled behavior.
2. The CI workflow contract test enforces the v7 uploader so a stale v5 pin
   cannot silently return.
3. Checkpoint CI completes successfully, exposes the Playwright report artifact,
   and emits no Node 20 deprecation annotation for the upload step.

## Rationale

The uploader introduced with the external-book CI hardening still floats on v5,
whose default runtime is Node 20. The supported v7 major runs on Node 24. Keeping
the uploader current preserves the diagnostic artifact and removes avoidable
runtime-deprecation risk without reopening the already-realized feature intent
that originally introduced it.

## Alternatives

- Leave v5 in place. Rejected because it retains a stale default runtime even
  though the official action has a compatible Node 24 major.
- Pin v7.0.1 by full commit SHA. This is the strongest immutable reference, but
  Tome currently follows floating official-action majors and T-207 explicitly
  scopes this maintenance to `@v7`; a repository-wide immutable-pinning policy is
  separate work.
- Remove the report upload. Rejected because the artifact remains useful failure
  evidence and the existing Playwright HTML reporter produces it.

## Consequences

- The action requires a GitHub Actions runner compatible with Node 24. Tome uses
  GitHub-hosted `ubuntu-latest`, so no self-hosted runner upgrade is introduced.
- The upload remains a zipped directory because v7's direct-file mode is opt-in
  and this workflow does not set it.
- Runtime behavior can only be proven at the remote checkpoint; local tests can
  prove the workflow's structure but cannot execute a hosted action.

## Transition history

- 2026-08-13: created as `proposed` to separate supported artifact-upload
  maintenance from the terminal INT-0003 feature scope.
- 2026-08-13: `proposed → planned` — the user approved the Sprint 7 plan for
  T-207, covering all three acceptance criteria without changing INT-0003.
- 2026-08-13: `planned → active` — Build Phase began executing T-207 against
  the locked Sprint 7 plans.
- 2026-08-13: `active → realized` — Sprint 7 T-207 upgraded the sole Playwright
  report uploader to v7 while preserving its artifact contract; local contract,
  regression, and syntax gates passed, and hosted CI run 31700205126 completed
  successfully with the expected artifact and no warning annotations. All three
  acceptance criteria are satisfied.
