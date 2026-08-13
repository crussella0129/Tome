# Sprint 7 Research Report

## Intents Reviewed

- [INT-0005](../../../intents/INT-0005-supported-ci-artifact-upload.md) — created; relevance: owns the bounded supported-uploader outcome that T-207 advances; current state: `proposed`.
- [INT-0003](../../../intents/INT-0003-richer-external-book-support.md) — selected for provenance only; relevance: its Sprint 3 CI hardening introduced the Playwright artifact upload, but all feature criteria are already satisfied; current state: `realized` and unchanged.

## 1. Sprint Goal

Move Tome's Playwright-report upload from `actions/upload-artifact@v5` to
`@v7` and update the CI workflow contract test so the stale v5 pin cannot
return, without changing application behavior, CI gate coverage, artifact
semantics, or INT-0003's realized scope.

## 2. Existing Code Survey

| File | Relevance | Notes |
|------|-----------|-------|
| `docs/work/tasks.md` | high | T-207 names the exact two implementation touches; research retags it from terminal INT-0003 to follow-on INT-0005. |
| `.github/workflows/ci.yml` | high | Contains one `actions/upload-artifact@v5` step for `playwright-report/`; its name, path, retention, and condition remain valid on v7. |
| `src/lib/__tests__/ci-workflow.test.ts` | high | Reads the workflow as text and currently requires `actions/upload-artifact@v5`; the positive assertion must require v7. |
| `package.json` | medium | Exposes the isolated/full Vitest and Astro check commands used for local verification; no dependency change is needed. |
| `vitest.config.ts` | medium | Includes `src/lib/__tests__/ci-workflow.test.ts` in the unit-test suite. |
| `docs/intents/INT-0003-richer-external-book-support.md` | high | Terminal, `realized` authority whose three acceptance criteria are already met; it must not be reopened for generic CI maintenance. |
| `docs/sprints/s3/sprint-tests/test-report.md` | medium | Records the green hosted run where v5 first uploaded the Playwright report without the earlier Node warning. |
| `docs/sprints/s6/sprint-tests/test-report.md` | medium | Carries T-207 forward explicitly as remaining technical-debt backlog. |

## 3. External Sources

- [actions/upload-artifact releases](https://github.com/actions/upload-artifact/releases) — v7.0.1 is the latest v7 release; the v6 notes establish that v5 defaulted to Node 20 while v6 and later default to Node 24, and the v7 notes limit new behavior to opt-in direct upload plus an internal ESM migration.
- [v7 action manifest](https://github.com/actions/upload-artifact/blob/v7/action.yml) — declares `runs.using: node24`; existing `name`, `path`, `retention-days`, and default archived upload inputs remain supported.
- [v7 README](https://github.com/actions/upload-artifact/blob/v7/README.md) — documents `uses: actions/upload-artifact@v7`, default zipped-directory behavior, the GitHub Enterprise Server limitation, and existing immutable-artifact constraints.
- [GitHub secure-use reference](https://docs.github.com/en/actions/reference/security/secure-use) — a full commit SHA is the only immutable action reference; recorded as a stronger alternative, but not introduced inconsistently in this two-file floating-major maintenance task.

## 4. Risks, Unknowns, Dependencies

- **Risk (low): hosted-runtime compatibility.** Node 24 actions require runner
  2.327.1 or newer. Tome uses GitHub-hosted `ubuntu-latest`, not a self-hosted
  or GHES runner, so GitHub owns this compatibility boundary.
- **Risk (low): behavior drift.** v7 adds `archive: false`, but only as an
  opt-in. Tome leaves the default archive mode enabled, uses one uniquely named
  artifact, and does not rely on v7's new direct-upload behavior.
- **Risk: floating tags are mutable.** `@v7` follows Tome's current official
  action convention and the explicit T-207 scope, but is weaker than a full SHA
  pin. A coherent immutable-pinning policy should cover all actions rather than
  changing one incidentally.
- **Unknown until checkpoint:** local tests cannot execute the hosted action or
  prove the artifact exists. A green remote `verify` job, downloadable
  `playwright-report`, and absence of an uploader Node 20 annotation are the
  final runtime evidence.
- **Dependency:** the human-approved `dev` to `main` checkpoint governs remote
  CI evidence; implementation and local verification do not require new npm
  packages or lockfile changes.

## 5. Recommended Approach

Primary: create the narrow INT-0005 follow-on and retag T-207, change the one
workflow reference from `actions/upload-artifact@v5` to `@v7`, and update the
matching structural assertion. Verify the focused test, full Vitest suite,
Astro check, and YAML parse locally; then use the checkpoint CI run to verify
the hosted action and actual report artifact.

Alternative considered: use the immutable v7.0.1 commit SHA. That improves
supply-chain immutability, but it contradicts T-207's explicit `@v7` contract
and would leave checkout/setup-node under a different pinning policy. Defer a
coherent all-actions SHA policy rather than broadening this sprint.

Rationale: the change is the smallest slice that removes the stale runtime,
keeps the existing artifact useful, makes the approved major executable
authority in a test, and avoids silently redefining a terminal feature intent.

## Artifacts

- [INT-0005 — Supported CI artifact upload](../../../intents/INT-0005-supported-ci-artifact-upload.md) — new stable semantic authority for T-207.
- [T-207 backlog entry](../../../work/tasks.md) — retagged execution item with its original implementation scope preserved.
- [INT-0003 — Richer external-book support](../../../intents/INT-0003-richer-external-book-support.md) — retained unchanged as historical provenance.
