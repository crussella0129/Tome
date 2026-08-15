# Plan Critique — Sprint 14

## Concerns

### C-001: `check:electron` would run zero tests against the default Playwright config
- **Where:** `build-plan.md` T-033 / `test-plan.md` End-to-End Tests
- **Quote:** original — "a `check:electron` npm script runs it (build first) … `playwright test e2e/electron.spec.ts`"
- **Failure mode:** hidden-dep
- **Why it matters:** `playwright.config.ts` sets `testMatch` to only `reader.spec.ts`/`search.spec.ts` (or `external-book.spec.ts`) and defines a serve-dist `webServer`. A CLI file filter **intersects** with `testMatch`, so `playwright test e2e/electron.spec.ts` would match no tests, and the run would still start the unneeded serve-dist server. Criterion 4 would appear "passing" while executing nothing.
- **Suggested response:** fix-in-plan — **addressed.** T-033 now adds a dedicated `playwright.electron.config.ts` (`testDir: 'e2e'`, `testMatch: '**/electron.spec.ts'`, no `webServer`, no browser projects); `check:electron` runs `astro build` then `playwright test --config playwright.electron.config.ts`. The default browser suite is untouched.

### C-002: T-032 bundles the pure resolver with the Electron main process
- **Where:** `build-plan.md` T-032
- **Quote:** "Electron shell — shared dist resolver, app protocol, secure window, external-link handling"
- **Failure mode:** granularity
- **Why it matters:** one task creates a pure helper (`dist-resolve.mjs`), refactors `serve-dist.mjs`, and writes the Electron main. A stricter split would isolate the resolver.
- **Suggested response:** defer-with-rationale — the resolver exists **only** to be consumed by the same task's protocol handler (and the serve-dist refactor); it is not independently shippable or observable, and it carries its own unit suite (`dist-resolve.test.ts`) so it is independently *verified*. The diff stays coherent ("the offline shell"). Keeping T-032 whole is intentional and low-risk.

### C-003: external-link EARS is expressed in both T-032 and T-033
- **Where:** `build-plan.md` T-032 (criterion 2) and T-033 (external-link clause)
- **Quote:** T-033 — "WHEN the test inspects the shell's external-link handling for an `https` target, THEN it SHALL confirm the target is routed to `shell.openExternal`"
- **Failure mode:** plan-test-mismatch (potential double-count)
- **Why it matters:** the same behavior appears as an EARS clause in two tasks; a reader could expect two separate tests.
- **Suggested response:** reject (the critique is wrong because …) — this is deliberate and consistent: T-032 **implements** external-link routing; T-033's spec **verifies** it end-to-end. Both map to the single named test `test_electron_external_link`, and the traceability table binds criterion 2 → T-032 EARS → that test. No missing or duplicated coverage.

## Confidence
proceed-with-caveats
