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

## T-006 (sprint 1)
- **Description:** Self-host Mekzantine via a build-time fetch script (no redistribution)
- **Intent:** [INT-0001](../intents/INT-0001-tome-ink-on-paper-mdbook-viewer.md)
- **Completed:** 2026-08-11T05:31:00Z
- **Files modified:** scripts/fetch-fonts.mjs, package.json, src/styles/fonts.css, .gitignore, src/styles/__tests__/fonts.test.ts
- **EARS verified:** clause 1 (`fonts.css` src all `/fonts/`, no external host) — `test_fonts_self_hosted`; clause 2 (fetch writes woff2) — `gate_font_fetch` wrote mekzantine-mono.woff2 + mekzantine.woff2 to public/fonts/; clause 3 (monospace fallback) — `test_font_fallback_present`. Full: build emits CSS referencing `/fonts/…woff2` (no runtime CDN); `astro check` clean; audit clean. `public/fonts/` git-ignored (no binary committed).
- **Commit:** `e743c466d9e6f1faff654395fb9fae7f8d3757cb`

## T-007 (sprint 1)
- **Description:** Image chapter + criterion-5 image proof
- **Intent:** [INT-0001](../intents/INT-0001-tome-ink-on-paper-mdbook-viewer.md)
- **Completed:** 2026-08-11T05:38:09Z
- **Files modified:** public/images/sacred-diagram.svg, src/content/book/components/panels.md, e2e/reader.spec.ts, playwright.config.ts, scripts/serve-dist.mjs
- **EARS verified:** clause 1 — `test_chapter_image_styled` green (image renders in `.tome-prose` with border > 0 and loads: naturalWidth > 0); full E2E 7/7. `astro check` clean; audit clean. Infra fix: replaced the daemonizing `astro preview` in the Playwright webServer with a foreground `scripts/serve-dist.mjs` (deterministic, `reuseExistingServer:false`), fixing a fresh-build race that also hardens CI (T-009).
- **Commit:** `0bf90cb38f0e09fe646241debfd51b0aeb9282c1`

## T-008 (sprint 1)
- **Description:** prefers-reduced-motion E2E
- **Intent:** [INT-0001](../intents/INT-0001-tome-ink-on-paper-mdbook-viewer.md)
- **Completed:** 2026-08-11T05:39:38Z
- **Files modified:** e2e/reader.spec.ts
- **EARS verified:** clause 1 — `test_reduced_motion_honored` green: with `emulateMedia({reducedMotion:'reduce'})`, the `.transition-token` theme button's computed transition-duration collapses to ≤ 1ms (the token `@media (prefers-reduced-motion)` rule). `astro check` clean.
- **Commit:** `a26f7c2cc95910222a64ed6a4b9dabf007c57a13`

## T-009 (sprint 1)
- **Description:** CI workflow (astro check + vitest + playwright)
- **Intent:** [INT-0001](../intents/INT-0001-tome-ink-on-paper-mdbook-viewer.md)
- **Completed:** 2026-08-11T05:41:25Z
- **Files modified:** .github/workflows/ci.yml, src/lib/__tests__/ci-workflow.test.ts
- **EARS verified:** clause 1 — `test_ci_workflow_valid` green (workflow triggers on `pull_request`→main and `push`→dev; steps run `npm ci`, `astro check`, `vitest run`, `playwright test`). YAML validated (pyyaml `safe_load` OK). Full unit suite 24/24; `astro check` clean; audit clean. Real CI conclusion to be observed on the Sprint 1 PR (recorded in the test report).
- **Commit:** `edea9be032ef127aa78898aa880d23e2b445398f`

## T-010 (sprint 2)
- **Description:** External book loader (scripts/load-book.mjs)
- **Intent:** [INT-0002](../intents/INT-0002-load-external-mdbooks.md)
- **Completed:** 2026-08-11T15:02:29Z
- **Files modified:** scripts/load-book.mjs, package.json, src/content/book/book.meta.json
- **EARS verified:** clause 2 (unset → no-op) ✓; clause 3 (invalid path → clear error naming the path + exit 1) ✓; clause 1 (valid book → temp dest populated with SUMMARY/chapters + `book.meta.json.title` = book.toml title "External Handbook") ✓ — verified via a throwaway external book against a temp `--dest` (sample untouched, per critique C-001). `npm run build` (prebuild chain, unset no-op) renders the sample; `astro check` clean; audit clean; full suite 24/24 (no regression). Note: hooked into `predev`/`prebuild` only (not `pretest`/`precheck`) since `book/` is committed — keeps tests running against the sample regardless of `TOME_BOOK`. The formal loader integration tests land in T-012 with the committed fixture.
- **Commit:** `15f8e22d9e6ecd14dde48901154f0d3b37691cf6`

## T-011 (sprint 2)
- **Description:** Real-book title (from book.meta.json) + traversal-safe path resolution
- **Intent:** [INT-0002](../intents/INT-0002-load-external-mdbooks.md)
- **Completed:** 2026-08-11T15:05:15Z
- **Files modified:** src/lib/book.ts, src/lib/paths.ts, src/lib/__tests__/paths.test.ts, src/lib/__tests__/book.test.ts
- **EARS verified:** clause 1 (title from meta, fallback to SUMMARY heading) — `test_book_title_from_meta` (pure `resolveTitle`); clause 2 (nested `a/b`, folder `README`/`index`) — `test_paths_nested_and_readme`; clause 3 (`..` never escapes root; `../secret.md`→`secret`, `chapterUrl` not `/../`) — `test_paths_reject_traversal`. Full suite 27/27; `astro check` clean (JSON import of book.meta.json OK); audit clean.
- **Commit:** `d069e1fe00922e41722e3daaed6d866845f008c3`

## T-012 (sprint 2)
- **Description:** External-book fixture + end-to-end build gate + README
- **Intent:** [INT-0002](../intents/INT-0002-load-external-mdbooks.md)
- **Completed:** 2026-08-11T15:08:38Z
- **Files modified:** fixtures/handbook/book.toml, fixtures/handbook/src/SUMMARY.md, fixtures/handbook/src/README.md, fixtures/handbook/src/first.md, fixtures/handbook/src/section/nested.md, src/lib/__tests__/load-book.test.ts, README.md
- **EARS verified:** loader integration `test_load_book_external`/`_noop_when_unset`/`_errors_on_invalid` green (3/3). `gate_external_build`: `TOME_BOOK=fixtures/handbook npm run build` → `dist/first` and `dist/section/nested` present, `dist/getting-started` (sample) absent, and the book.toml title "The Sacred Handbook" in the sidebar; sample restored cleanly (`git checkout` + `git clean`), default rebuild OK. Full suite 30/30; `astro check` clean; audit clean.
- **Commit:** `ededce6e17cbc98929da1eff6c06dec65bfc545e`

## T-013 (sprint 3)
- **Description:** Prove relative-image fidelity + scripted external-build gate
- **Intent:** [INT-0003](../intents/INT-0003-richer-external-book-support.md)
- **Completed:** 2026-08-11T16:28:46Z
- **Files modified:** fixtures/handbook/src/img/plate.svg, fixtures/handbook/src/first.md, scripts/check-external-build.mjs, package.json
- **EARS verified:** clause 1 (relative image → optimized `/_astro/` asset) + clause 2 (script builds/asserts/restores, non-zero on failure) — `node scripts/check-external-build.mjs` green: built with `TOME_BOOK=fixtures/handbook`, asserted `dist/first/` present, `dist/getting-started/` absent, and `<img src="/_astro/plate.<hash>.svg">` in `dist/first/`; restored `src/content/book/` to HEAD (tree clean) + rebuilt default. `astro check` clean; vitest 30/30; audit clean.
- **Commit:** `1ce7432b12db4e08b9c9d67bc3e10b7a519a17fd`

## T-014 (sprint 3)
- **Description:** CI hardening — external gate in CI + actions/artifact hygiene
- **Intent:** [INT-0003](../intents/INT-0003-richer-external-book-support.md)
- **Completed:** 2026-08-11T16:31:02Z
- **Files modified:** .github/workflows/ci.yml, playwright.config.ts, src/lib/__tests__/ci-workflow.test.ts
- **EARS verified:** clause 1 (CI runs `check-external-build.mjs` after E2E) + clause 2 (actions `@v5`, artifact exists) — `test_ci_workflow_valid` extended and green (asserts the gate step, `checkout/setup-node/upload-artifact @v5`, and no `@v4`); YAML valid (pyyaml). Playwright `html` reporter added → `playwright-report/index.html` generated (artifact will upload); E2E 8/8 (no regression); full suite 30/30; `astro check` clean; audit clean. Runtime CI (gate runs, warnings gone) observed at the checkpoint PR.
- **Commit:** `3afab60e86f4f3b56e2dcb1a0a4cb6baa7929f85`

## T-015 (sprint 4)
- **Description:** Source + title detection in load-book.mjs
- **Intent:** [INT-0004](../intents/INT-0004-flexible-book-source-detection.md)
- **Completed:** 2026-08-11T19:26:36Z
- **Files modified:** scripts/load-book.mjs, src/lib/__tests__/load-book.test.ts
- **EARS verified:** clause 1 (no book.toml → detect docs/) `test_source_detect_docs`; clause 2 (declared src authoritative, wins over src/docs) `test_source_honor_book_toml_src` (+ `test_source_declared_missing_errors`); clause 3 (title from root dirname) `test_title_from_dirname`; clause 4 (no SUMMARY → enumerated error listing candidates) `test_source_none_errors`. Full suite 35/35; `astro check` clean; audit clean. **Real-world smoke:** `TOME_BOOK=/c/Users/charl/CubiKan node scripts/load-book.mjs` now works with **no wrapper** — auto-detected `CubiKan/docs`, copied 132 chapters, title "CubiKan" from the directory name.
- **Commit:** `ea69f2cdb8d533ac2db07df0b304232180a08fe1`

## T-016 (sprint 4)
- **Description:** Docs-layout fixture + external-build gate + README
- **Intent:** [INT-0004](../intents/INT-0004-flexible-book-source-detection.md)
- **Completed:** 2026-08-11T19:29:16Z
- **Files modified:** fixtures/docs-book/docs/SUMMARY.md, fixtures/docs-book/docs/README.md, fixtures/docs-book/docs/overview.md, fixtures/docs-book/docs/details/deep.md, scripts/check-external-build.mjs, README.md
- **EARS verified:** clause 1 (docs-book renders detecting docs/, dir-name title) — extended `check_external_build` green: builds both `fixtures/handbook` (standard + relative image, criterion 5 regression) and `fixtures/docs-book` (no book.toml → detects docs/), asserting `/overview` + `/details/deep` routes, sample absent, and the "docs-book" directory-name title in the sidebar; restores `src/content/book/` after each (tree clean). Full suite 35/35; `astro check` clean; audit clean. README documents the optional `book.toml` + `src→docs→root` detection + directory-name title.
- **Commit:** `cb62e4fc63e24d8ec886d33d778053407d60912b`

## T-017 (sprint 5)
- **Description:** Shared source module + live-reload Astro integration
- **Intent:** [INT-0003](../intents/INT-0003-richer-external-book-support.md)
- **Completed:** 2026-08-11T20:39:25Z
- **Files modified:** scripts/book-source.mjs, scripts/load-book.mjs, astro.config.mjs, src/lib/__tests__/book-source.test.ts
- **EARS verified:** clause 1 (`resolveBookSource` parity — docs detect, declared-src authoritative, dir-name title, enumerated throw) `test_resolve_book_source`; clause 2 (`syncPath` copies changed / removes deleted / ignores outside-source) `test_sync_path_copy_and_delete`. Loader refactored to import the shared module — its 8 detection tests unchanged (parity). Full suite 37/37; `astro check` clean; audit clean; `npm run build` unaffected (integration is dev-only). Integration confirmed firing: `astro dev logs` → "live reload watching …/fixtures/handbook/src" (label tome-live-reload). End-to-end proof in T-018.
- **Commit:** `83d3ffe080176d97ba18c0c9b216ac52909052eb`

## T-018 (sprint 5)
- **Description:** End-to-end live-reload gate + docs
- **Intent:** [INT-0003](../intents/INT-0003-richer-external-book-support.md)
- **Completed:** 2026-08-11T20:42:56Z
- **Files modified:** scripts/check-live-reload.mjs, package.json, README.md
- **EARS verified:** clause 1 (edit during dev reflects, no restart) — `check_live_reload` green: copied fixtures/handbook to a temp mutable book, ran `TOME_BOOK=<temp> astro dev`, confirmed `/first` served "First Chapter", edited the source to "LIVE RELOAD CONFIRMED", and the reader reflected it within the poll window — **no restart**; `finally` stopped dev + restored `src/content/book/` to HEAD (tree clean) + removed the temp book. Full suite 37/37; `astro check` clean; audit clean. README documents live reload. Kept local (not CI) per plan.
- **Commit:** `221bf31c21da997175ebc04f7e69d32e64ceb45e`

## T-019 (sprint 6)
- **Description:** Multi-book content model + adaptive routing
- **Intent:** [INT-0003](../intents/INT-0003-richer-external-book-support.md)
- **Completed:** 2026-08-12T05:12:50Z
- **Files modified:** src/content/books/tome/** (migrated from src/content/book/**), src/lib/book.ts, src/lib/paths.ts, src/pages/[...slug].astro, src/layouts/BookLayout.astro, src/components/TocSidebar.tsx, scripts/book-source.mjs, scripts/load-book.mjs, astro.config.mjs, scripts/check-external-build.mjs, scripts/check-live-reload.mjs, src/lib/__tests__/book.test.ts, src/lib/__tests__/load-book.test.ts
- **EARS verified:** clause 1 (`books()` returns one entry per `src/content/books/*` tome as `{slug,title,toc,chapters}`) — `test_books_library`: the migrated sample resolves as slug `tome`, title `Tome`, five chapters in reading order (draft excluded). clause 2 (adaptive routes) — `test_routes_adaptive_single_and_multi` + `pageSlug`: one tome → bare root routes (`''`,`getting-started`,…), many tomes → namespaced `/<tome>/<chapter>` + a `/` Bibliotheca; verified end to end by a manual two-tome build (`/index.html` lists both tomes as titled links; `/tome/*` + `/second/*` generated; sidebar links namespaced) then restored clean. **C-001 fix:** `load-book.mjs` now writes the single external book into `src/content/books/<slug>/` (replacing the whole library → single-tome mode), so external loading + `check_external_build` stay green — the gate passes both fixtures (handbook root `/first` + relative image; docs-book detected) and restores the library to HEAD. live-reload integration syncs into `src/content/books/<slug>/`. Default build routes unchanged (`/`,`/getting-started`,`/components`,`/components/panels`,`/about`). Full suite 39/39; `astro check` 0 errors; audit clean; Playwright 8/8.
- **Commit:** `2eaa4d067a31282e5795cacebaad7d9bcdba2f50`

## T-020 (sprint 6)
- **Description:** load-books.mjs + tome.config.toml + env precedence
- **Intent:** [INT-0003](../intents/INT-0003-richer-external-book-support.md)
- **Completed:** 2026-08-12T05:21:48Z
- **Files modified:** scripts/load-books.mjs (new — generalizes & replaces load-book.mjs), scripts/load-book.mjs (removed), scripts/book-source.mjs (add `slugify`, loader-agnostic error text), tome.config.toml (new, commented manifest), package.json + package-lock.json (predev/prebuild → load-books; add `smol-toml`), src/lib/__tests__/load-books.test.ts (renamed from load-book.test.ts + precedence/multi/dedup), src/lib/book.ts + src/lib/__tests__/book-source.test.ts (comment fixes)
- **EARS verified:** clause 1 (precedence: env wins → toml → sample) — `test_load_books_precedence` (3 cases): `TOME_BOOKS` overrides a `tome.config.toml`; the manifest is used when env is unset; neither → no-op (sentinel untouched). clause 2 (multi-copy + dedup + invalid) — `test_load_books_multi_copy` (4 cases): two books populate `books/<slug>/` with `book.meta.json`; colliding basenames dedupe to `guide`/`guide-2`; an invalid path errors non-zero and writes nothing (resolve-all-first). Single-book source detection retained via load-books (`TOME_BOOK`) — 6 detection cases green. Verified end to end: `TOME_BOOKS=fixtures/handbook,fixtures/docs-book npm run build` → `/` Bibliotheca lists both (sorted by slug) + namespaced `/handbook/*` & `/docs-book/*`, then restored to HEAD; committed `tome.config.toml` is fully commented → default build is a no-op (sample at root). `smol-toml@^1.8.0` parses the `[[book]]` manifest (verified on Node 24, engines ≥18). Full suite 45/45; `astro check` 0 errors; `check_external_build` green (single → root); `check_live_reload` green.
- **Commit:** PENDING
