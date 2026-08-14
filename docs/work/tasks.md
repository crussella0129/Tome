# Agent Tasks (Persistent Backlog)

- [ ] T-024 (sprint 10) [intent: INT-0008]: Search overlay island + wiring (SearchOverlay.tsx + module.css; mount in BookLayout + Bibliotheca; / shortcut, focus trap, adaptive result links) — touches: src/components/SearchOverlay.tsx, src/components/SearchOverlay.module.css, src/layouts/BookLayout.astro, src/components/Bibliotheca.astro, src/components/__tests__/SearchOverlay.test.tsx, e2e/search.spec.ts
- [ ] T-025 (sprint 10) [intent: INT-0008]: Search build gate + README (check-search.mjs; CI step + ci-workflow assertion; docs) — touches: scripts/check-search.mjs, package.json, .github/workflows/ci.yml, src/lib/__tests__/ci-workflow.test.ts, README.md
- [ ] T-208 (backlog) [intent: INT-0001]: Harden `test_dark_theme_active`/`test_paper_theme_active` E2E against the `client:idle` hydration race (wait for the sidebar island to hydrate before clicking the theme toggle) — touches: e2e/reader.spec.ts
