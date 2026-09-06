# Sprint 21 Research Report

## Intents Reviewed

- [INT-0021](../../../intents/INT-0021-safe-consistent-fixture-verification.md) — created;
  relevance: the requested refactoring pass, bounded to shared fixture verification;
  current state: proposed.
- [INT-0006](../../../intents/INT-0006-browser-verified-external-books.md) — selected
  as a compatibility boundary; current state: realized, unchanged.
- [INT-0009](../../../intents/INT-0009-live-reload-parent-assets.md) — selected as
  a compatibility boundary; current state: realized, unchanged.

## 1. Sprint Goal

Consolidate fixture-check orchestration in the existing Node tooling, preserving
the current production assertions while preventing destruction of local book
edits and making cleanup/build failures reliable. Implement T-053 shared
lifecycle and T-054 consumer migration after plan approval. No reader behavior
or native library-management implementation is part of this sprint.

## 2. Existing Code Survey

| File | Relevance | Notes |
|---|---|---|
| `scripts/check-external-build.mjs` | high | Guard plus strict restore is the existing model; retains Chromium verification. |
| `scripts/check-multibook.mjs` | high | Duplicates build/restore; unchecked destructive restore and swallowed failures. |
| `scripts/check-search.mjs` | high | Duplicates build/restore and inherits higher-priority book environment variables. |
| `scripts/check-live-reload.mjs` | high | Duplicates destructive restore in finally; must retain stop/temp cleanup ordering. |
| `scripts/load-books.mjs` | high | Environment precedence, destination override, and whole-library replacement. |
| `scripts/library-config.mjs` | medium | Owner lookup uses manifest and OS identity; baseline sandbox issue in its test. |
| `scripts/book-source.mjs` | medium | Resolves source paths and live sync; no production change planned. |
| `scripts/fetch-fonts.mjs` | medium | Build downloads are skipped when cached; use existing local fonts for isolation. |
| `astro.config.mjs` | high | Dev integration consumes TOME_BOOK; preserve single-book environment for live reload. |
| `playwright.config.ts` | high | External mode consumes existing dist; ordinary mode builds committed sample. |
| `vitest.config.ts` | medium | Existing Node/Solid test runner includes src/lib tests. |
| `package.json` | high | Four existing command entry points; no dependency or language changes needed. |
| `package-lock.json` | medium | Prettier and Node tooling are already installed. |
| `tome.config.toml` | high | Local uncommitted Bible entry; final default builds must not load this implicitly. |
| `.gitignore` | high | Ignore status matters to content preflight and fixture cleanup. |
| `.github/workflows/ci.yml` | high | Existing CI invokes three production gates; preserve command interfaces. |
| `src/lib/__tests__/load-books.test.ts` | high | Disposable filesystem/CLI testing patterns and environment sanitization. |
| `src/lib/__tests__/book.test.ts` | high | Two tests require the committed two-book sample; active Bible tree cannot satisfy them. |
| `src/lib/__tests__/ci-workflow.test.ts` | medium | Existing CI contract remains unchanged. |
| `src/lib/book.ts` | medium | Eager content glob explains sample-sensitive tests. |
| `src/lib/paths.ts` | low | Routing mapping surveyed; no change required. |
| `README.md` | medium | Existing verification commands and external-library caveat; update only check guidance. |

## 3. External Sources

None. The existing implementation, installed workflow contracts, and local
baseline evidence are sufficient; no new API or dependency is proposed.

## 4. Risks, Unknowns, Dependencies

- **Risk:** The active workspace has deleted sample books, an untracked Bible
  library, and a modified manifest. Never run a mutating legacy fixture check
  here. Execute production verification in a disposable clean checkout.
- **Risk:** An inherited TOME_BOOKS can beat an explicit TOME_BOOK; destination
  and manifest overrides can redirect writes. Centralize clean inputs and test
  the real selection behavior, not just environment object construction.
- **Risk:** A broad finally block can restore after a failed preflight and erase
  the very edits the guard found. Guard before entering the cleanup lifecycle.
- **Risk:** Cleanup errors can hide the original failure, and existing checks
  suppress restoration/default-rebuild errors. Preserve both causes and nonzero
  command outcomes. Keep cleanup scoped to the fixed content directory.
- **Risk:** The live-reload gate must stop its dev process before content cleanup;
  avoid concurrent fixture runs and keep the temporary mutable book contained.
- **Dependency:** Node 24.12.0, installed Astro/Vitest/Playwright/Prettier, Git,
  local fonts/browser availability. Windows shell commands require native-safe
  argument handling and verified paths for recursive cleanup.
- **Baseline:** Vitest reports 94 passed and 3 failed. Two failures require the
  removed sample; the owner-precedence test fails because the sandbox's
  `userInfo()` returns `uv_os_get_passwd` ENOMEM. These predate implementation.
- **Workflow:** Sprint 20 is closed. Bundle 0.22.0 upgraded the substrate stamp
  from 1 to 4, verified convergence, and initialized Sprint 21. Claude-specific
  EnterPlanMode/ExitPlanMode and TaskCreate tools are unavailable in this Codex
  session; keep source unchanged during planning, retain reviewable scratch
  plans, obtain user approval, and track executable work in the Book ledger.

## 5. Recommended Approach

Primary: extract a small shared fixture lifecycle with clean-content preflight,
controlled loader environment, strict restoration, and aggregated failures.
Migrate the four commands to it without changing their fixture assertions.
Test preservation using disposable Git repositories and run existing production
gates serially in a separate checkout using the committed sample.

Alternative considered: patch each script independently. Rejected because it
leaves the repeated lifecycle and the cause of the current inconsistency intact.
Keep the current JavaScript language and dependencies because this is toolchain
orchestration, not a greenfield implementation.

## Artifacts

- [Baseline evidence](baseline.md) — initial working-tree and Vitest observations.
- Approval drafts: `test-results/sprint-21/build-plan.draft.md` and
  `test-results/sprint-21/test-plan.draft.md` (transient scratch; final plans belong
  in `sprint-plans/` only after approval).
- [Sprint metadata](../sprint-meta.md) — provenance and phase progress.

## Budget Override

The survey includes 22 files because the duplicated lifecycle spans four command
entry points, the loader's environment precedence, live-server configuration,
CI/browser orchestration, and sample-sensitive tests. These dependencies are
necessary to make cleanup safe and preserve existing verification behavior.
No external sources were consulted; research stayed within 30 minutes.
