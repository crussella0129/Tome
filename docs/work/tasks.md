# Agent Tasks (Persistent Backlog)

- [ ] T-207 (backlog) [intent: INT-0003]: Bump `actions/upload-artifact@v5` → `@v7` in ci.yml (v5 is a stale major still on Node 20; v7 targets Node 24) + update the `@v5` assertion in `ci-workflow.test.ts` — touches: .github/workflows/ci.yml, src/lib/__tests__/ci-workflow.test.ts
- [ ] T-205 (backlog) [intent: INT-0003]: External-book browser E2E (load a fixture book via build-time env, assert it renders in a headless browser) — touches: e2e, playwright.config.ts
- [ ] T-206 (backlog) [intent: INT-0003]: Parent-relative image support (`../assets/x.png`) for external chapters — touches: scripts/load-books.mjs, fixtures, e2e
- [ ] T-208 (backlog) [intent: INT-0001]: Harden `test_dark_theme_active`/`test_paper_theme_active` E2E against the `client:idle` hydration race (wait for the sidebar island to hydrate before clicking the theme toggle) — touches: e2e/reader.spec.ts
