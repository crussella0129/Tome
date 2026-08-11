# Completed Tasks Log (Append-Only)

## T-001 (sprint 0)
- **Description:** Scaffold Astro + SolidJS + TypeScript + Tailwind v4 with the Vite pin
- **Intent:** [INT-0001](../intents/INT-0001-tome-ink-on-paper-mdbook-viewer.md)
- **Completed:** 2026-08-11T03:44:24Z
- **Files modified:** package.json, package-lock.json, astro.config.mjs, tsconfig.json, src/env.d.ts, src/pages/index.astro, vitest.config.ts, vitest.setup.ts, playwright.config.ts, .gitignore
- **EARS verified:** `astro check` → 0 errors; `astro build` → static build, no duplicate-Vite plugin error.
- **Commit:** `1f6ff8fd6b5b83514588667193de7b7f6b11342b`

## T-002 (sprint 0)
- **Description:** Ink-on-paper + warm-dark token/theme layer (subtle texture)
- **Intent:** [INT-0001](../intents/INT-0001-tome-ink-on-paper-mdbook-viewer.md)
- **Completed:** 2026-08-11T03:51:09Z
- **Files modified:** src/styles/tokens.css, src/styles/theme.ts, src/styles/fonts.css, src/styles/paper.css, src/styles/prose.css, src/styles/__tests__/contrast.test.ts
- **EARS verified:** clause 1 (contrast ≥ AA both themes) — `test_ink_on_paper_contrast_aa` green (5/5); clause 2 (no raw-value violations) — neutronium `audit.sh` passed. Clauses 3–4 (theme-active) verified via E2E in the Test Phase. Tailwind compile of `@theme` confirmed (parchment token emitted).
- **Commit:** `db253fefebe4019cd745dd1b1a3b7b6bfb391820`

## T-003 (sprint 0)
- **Description:** parseSummary mdBook SUMMARY.md parser (pure)
- **Intent:** [INT-0001](../intents/INT-0001-tome-ink-on-paper-mdbook-viewer.md)
- **Completed:** 2026-08-11T03:53:32Z
- **Files modified:** src/lib/summary.ts, src/lib/summary.types.ts, src/lib/__tests__/summary.test.ts
- **EARS verified:** all 5 clauses green via `test_summary_nested_chapters`, `_part_title`, `_prefix_and_suffix`, `_draft_entry`, `_separator` (10/10 tests). `astro check` clean.
- **Commit:** `f71212679c0a564957ee94f49b6e990113336342`

## T-004 (sprint 0)
- **Description:** BookLayout shell + TocSidebar island (nav, collapse, theme toggle)
- **Intent:** [INT-0001](../intents/INT-0001-tome-ink-on-paper-mdbook-viewer.md)
- **Completed:** 2026-08-11T04:00:40Z
- **Files modified:** src/layouts/BookLayout.astro, src/components/TocSidebar.tsx, src/components/TocSidebar.module.css, src/components/init-theme.astro, src/lib/paths.ts, src/components/__tests__/TocSidebar.test.tsx, vitest.config.ts
- **EARS verified:** clauses 1–3 green via `test_sidebar_lists_chapter_links`, `test_sidebar_marks_current`, `test_sidebar_toggle_collapses` (full suite 18/18). Clause 4 (focus-visible) verified via E2E in the Test Phase. `astro check` clean (0/0/0); neutronium audit passed (`.map` warnings are data transforms). Added `src/lib/paths.ts` (chapter href→slug mapping, shared with T-005) and set `hot:false` in `vitest.config.ts` to fix the solid-refresh test transform.
- **Commit:** `46cea2a1b39cd219b8277800c3a6f4489e09aad0`

## T-005 (sprint 0)
- **Description:** Bundled sample mdBook + chapter rendering with sacred prose styling
- **Intent:** [INT-0001](../intents/INT-0001-tome-ink-on-paper-mdbook-viewer.md)
- **Completed:** 2026-08-11T04:07:40Z
- **Files modified:** src/content/book/SUMMARY.md, src/content/book/README.md, src/content/book/getting-started.md, src/content/book/components.md, src/content/book/components/panels.md, src/content/book/about.md, src/pages/[...slug].astro, src/pages/index.astro (removed), src/components/Pager.astro, src/lib/book.ts, src/lib/__tests__/book.test.ts, e2e/reader.spec.ts, astro.config.mjs
- **EARS verified:** build generates one route per non-draft chapter (/, /getting-started, /components, /components/panels, /about; draft excluded) — `test_book_routes_generated` + `test_pager_prev_next` green (full suite 21/21). Static render confirms clause 1 (Introduction heading + SSR'd sidebar in BookLayout), clause 2 (`<pre>` code panel), clause 4 (pager neighbours). Clauses 2–3 computed-style + clause verification complete via E2E in the Test Phase. `astro check` clean; audit passed. Refinements: single catch-all `[...slug].astro` owns `/` (placeholder `index.astro` removed); added `src/lib/book.ts` (route loader, testable) and `syntaxHighlight:false` so code stays token-styled.
- **Commit:** `e2cb01d4b23ef139403c88560ec76b6f9883c8a8`
