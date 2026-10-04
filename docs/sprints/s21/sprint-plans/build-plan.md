Finalized - DO NOT EDIT

# Sprint 21 Build Plan

Approved by the user on 2026-09-06 ("approve continue").

## Intent

[INT-0021](../../../intents/INT-0021-safe-consistent-fixture-verification.md)
is planned and covers acceptance criteria 1–4 below. The existing INT-0006
external-book and INT-0009 live-reload outcomes remain compatibility boundaries.

## Scope

Consolidate the duplicated fixture build/check lifecycle in the existing Node.js
tooling. Preserve application rendering, routing, search behavior, dependencies,
desktop shells, and the user's current book/configuration edits.

## Execution Sequence

### T-053: Extract a guarded fixture-check lifecycle
- **Intent:** [INT-0021](../../../intents/INT-0021-safe-consistent-fixture-verification.md) — planned.
- **Touches:** `scripts/fixture-gate.mjs` (new), a committed empty fixture manifest,
  and `src/lib/__tests__/fixture-gate.test.ts` (new).
- **Depends on:** none.
- **Acceptance criteria:** 1, 2, 3.
- **Success criteria (EARS):**
  - **WHEN** the content library contains tracked, staged, untracked, or ignored
    changes, **THEN** the runner **SHALL** refuse before executing a fixture or
    cleanup and preserve those changes.
  - **WHEN** a fixture starts with clean content and succeeds or throws,
    **THEN** the runner **SHALL** restore the tracked content and remove only
    fixture residue under `src/content/books/`.
  - **WHEN** a fixture and restoration both fail, **THEN** the runner **SHALL**
    report both failures; a restoration failure alone **SHALL** fail the check.
  - **WHEN** the caller has TOME book/config/destination environment overrides,
    **THEN** fixture and default builds **SHALL** use explicit test inputs without
    loading or writing the caller's configured library.
- **Verification:** Real disposable Git repository tests for clean success,
  dirty preflight, failure cleanup, restoration failure, and environment isolation.

### T-054: Migrate the existing checks and verify their behavior
- **Intent:** [INT-0021](../../../intents/INT-0021-safe-consistent-fixture-verification.md).
- **Touches:** `scripts/check-external-build.mjs`, `scripts/check-multibook.mjs`,
  `scripts/check-search.mjs`, `scripts/check-live-reload.mjs`, and focused README
  verification guidance.
- **Depends on:** T-053.
- **Acceptance criteria:** 1–4.
- **Success criteria (EARS):**
  - **WHEN** any fixture check runs, **THEN** it **SHALL** use the shared guard,
    environment, and cleanup lifecycle while retaining its existing assertions.
  - **WHEN** a build, assertion, or final default rebuild fails, **THEN** the
    command **SHALL** exit nonzero rather than swallow the failure.
  - **WHEN** live-reload verification succeeds or fails after starting dev,
    **THEN** the gate **SHALL** stop its dev server before restoring content and
    removing the temporary book; verification **SHALL** exercise the assertion
    failure path and confirm this ordering.
  - **WHEN** the checks run against a clean disposable checkout, **THEN** external
    handbook browser verification, two-book routing, search queries, and live
    reload **SHALL** pass and leave its content library clean.
- **Verification:** Prettier, Node syntax checks, Astro check, full Vitest, the
  four fixture checks and ordinary Playwright tests in an isolated checkout
  containing the committed sample and the refactor. Record actual outcomes.

## Boundaries

Run mutating integration checks only in a disposable checkout; the active
workspace contains the user's Bible library and a modified `tome.config.toml`.
Use the existing JavaScript tooling; no language rewrite or dependency changes.
Leave native library-management backlog T-052 for its existing separate intent.

The baseline has three pre-existing failures: two from the personalized content
tree and one from the sandbox's OS-username lookup. Validate with the committed
sample in isolation; investigate the username restriction without changing the
production owner logic or weakening the existing test. Record unavailable gates
explicitly if the environment cannot support them.
