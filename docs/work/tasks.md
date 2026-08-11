# Agent Tasks (Persistent Backlog)

- [ ] T-018 (sprint 5) [intent: INT-0003]: End-to-end live-reload gate (dev + edit + poll) + README — touches: scripts/check-live-reload.mjs, package.json, README.md
- [ ] T-207 (backlog) [intent: INT-0003]: Bump `actions/upload-artifact@v5` → `@v7` in ci.yml (v5 is a stale major still on Node 20; v7 targets Node 24) + update the `@v5` assertion in `ci-workflow.test.ts` — touches: .github/workflows/ci.yml, src/lib/__tests__/ci-workflow.test.ts
- [ ] T-202 (backlog) [intent: INT-0003]: Multi-book library / reader-facing book switcher (criterion 2) — touches: src/lib/book.ts, src/components, src/pages
- [ ] T-205 (backlog) [intent: INT-0003]: External-book browser E2E (load a fixture book via build-time env, assert it renders in a headless browser) — touches: e2e, playwright.config.ts
- [ ] T-206 (backlog) [intent: INT-0003]: Parent-relative image support (`../assets/x.png`) for external chapters — touches: scripts/load-book.mjs, fixtures, e2e
