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
- **Commit:** `c23184b17108459fff583f5c4dccab9526e47491`

## T-021 (sprint 6)
- **Description:** Bibliotheca index + sidebar book switcher
- **Intent:** [INT-0003](../intents/INT-0003-richer-external-book-support.md)
- **Completed:** 2026-08-12T05:42:20Z
- **Files modified:** src/components/Bibliotheca.astro (new), src/components/TocSidebar.tsx + .module.css (switcher), src/layouts/BookLayout.astro (books/activeBook), src/pages/[...slug].astro (render Bibliotheca + owner), src/lib/book.ts (`bibliothecaEntries`), scripts/library-config.mjs (new — `resolveOwner`), tome.config.toml (owner doc), src/lib/__tests__/book.test.ts + src/components/__tests__/TocSidebar.test.tsx + src/lib/__tests__/load-books.test.ts
- **EARS verified:** clause 1 (multi-tome switcher; single → none) — `test_sidebar_book_switcher` (2 cases): with 2 tomes the sidebar lists each as a link with `aria-current="true"` on the active + a Bibliotheca link (`/`); with one tome no switcher renders. clause 2 (Bibliotheca lists tomes) — `test_bibliotheca_lists_tomes`: `bibliothecaEntries` returns one titled, namespaced-href entry per tome. Rendered end to end (two fixtures): `/` shows the sacred masthead + numbered plates linking `/handbook` & `/docs-book`; a chapter's sidebar shows the switcher with the active tome marked; **visually reviewed in the browser, both themes** (ink-on-paper + terminal-dark). Owner: masthead reads "The Bibliotheca of <owner>", where owner defaults to the **OS login name** (zero-config personalization — verified default build shows "charl"), overridable via `tome.config.toml` `owner` / `TOME_OWNER` — `test_resolve_owner_precedence` (env > toml > OS username). Fixed a JSX whitespace bug ("2tomes" → "2 tomes") and removed the redundant "The library of" eyebrow (user feedback). Single-tome path unchanged (no switcher, root URLs). Full suite 49/49; `astro check` 0 errors; audit clean; Playwright 8/8 (one `client:idle` hydration flake cleared on isolated + full re-run).
- **Commit:** `0bc65e7bca1ecf0a9f87b4d6c305033d30f46ffa`

## T-022 (sprint 6)
- **Description:** Multi-book end-to-end gate + README
- **Intent:** [INT-0003](../intents/INT-0003-richer-external-book-support.md)
- **Files modified:** scripts/check-multibook.mjs (new), package.json (`check:multibook`), README.md (Bibliotheca / adaptive routing / owner docs), .github/workflows/ci.yml (Multi-book build gate step), src/lib/__tests__/ci-workflow.test.ts (asserts the new gate)
- **EARS verified:** clause 1 (two-tome build → namespaced routes + `/` Bibliotheca) — `check_multibook` green: `TOME_BOOKS=fixtures/handbook,fixtures/docs-book npm run build` generates namespaced `/handbook`, `/handbook/first`, `/handbook/section/nested`, `/docs-book`, `/docs-book/overview`, `/docs-book/details/deep`; asserts the root-level `/first` & `/overview` are ABSENT (namespaced now); `/` Bibliotheca links + titles both tomes; a chapter page carries the switcher (sibling-tome link + `aria-current="true"`). Restores `src/content/books/` to HEAD (tree clean) and rebuilds default. Wired into CI as a "Multi-book build gate" step alongside the external gate; `test_ci_workflow_valid` now asserts `check-multibook.mjs` is present (ci.yml validated as YAML). README documents `tome.config.toml` (`[[book]]` + `owner`), the `TOME_BOOKS`/`TOME_BOOK` env override + precedence, adaptive routing, and the Bibliotheca. Full suite 49/49; `astro check` 0 errors; audit clean. (Scope note: added the CI step + its assertion beyond the plan's listed touches, to keep the multi-book gate consistent with the CI-run external gate.)
- **Commit:** `820b32b329eead41c293a556ad015d22c6bc0158`

## T-207 (sprint 7)
- **Description:** Upgrade the Playwright report uploader to v7 and enforce its workflow contract
- **Intent:** [INT-0005](../intents/INT-0005-supported-ci-artifact-upload.md)
- **Completed:** 2026-08-13T04:53:31Z
- **Files modified:** .github/workflows/ci.yml, src/lib/__tests__/ci-workflow.test.ts, docs/SUMMARY.md, docs/intents/INT-0005-supported-ci-artifact-upload.md, docs/sprints/s7/sprint-meta.md, docs/sprints/s7/sprint-research/research-report.md, docs/sprints/s7/sprint-plans/build-plan.md, docs/sprints/s7/sprint-plans/test-plan.md, docs/sprints/s7/sprint-plans/critique.md, docs/work/tasks.md, docs/work/completed-tasks.md
- **EARS verified:** workflow now has exactly one `actions/upload-artifact` reference at `@v7` and preserves `if: ${{ !cancelled() }}`, name `playwright-report`, path `playwright-report/`, and 30-day retention — focused `test_ci_workflow_valid` 1/1 green and PyYAML parse clean. Full Vitest suite 49/49; Astro check 0 errors / 0 warnings / 0 hints; Neutronium audit passed with two reviewed non-JSX data-transform warnings. The hosted checkpoint clause remains Test Phase evidence and is not claimed here.
- **Commit:** `f635ad10835e474f1238ce544d349ec96affc688`

## T-205 (sprint 8)
- **Description:** Join the external fixture build gate to an isolated Chromium verification mode
- **Intent:** [INT-0006](../intents/INT-0006-browser-verified-external-books.md)
- **Completed:** 2026-08-13T18:55:17Z
- **Files modified:** e2e/external-book.spec.ts, playwright.config.ts, scripts/check-external-build.mjs, docs/SUMMARY.md, docs/intents/INT-0006-browser-verified-external-books.md, docs/sprints/s8/sprint-meta.md, docs/sprints/s8/sprint-research/research-report.md, docs/sprints/s8/sprint-plans/build-plan.md, docs/sprints/s8/sprint-plans/test-plan.md, docs/sprints/s8/sprint-plans/critique.md, docs/work/tasks.md, docs/work/completed-tasks.md
- **EARS verified:** default Playwright mode lists only the 8 bundled-reader tests; external mode lists only `test_external_book_renders_in_browser` and `test_external_relative_image_loads`. A deliberate missing-browser run failed nonzero and left `src/content/books/` pristine. The successful external gate passed both Chromium tests, both fixture output checks, strict restoration, an ordinary-report sentinel, and the final default rebuild. Full Vitest passed 49/49; Astro check reported 0 errors / 0 warnings / 0 hints; bundled-reader Playwright passed 8/8; the multi-book gate and its default rebuild passed. Hosted CI remains Test Phase evidence.
- **Commit:** `4cb83b72b5ff207daaeeb285ec7ba42c6b63283d`

## T-206 (sprint 9)
- **Description:** Prepare and verify tome-private parent-relative image assets
- **Intent:** [INT-0007](../intents/INT-0007-parent-relative-external-assets.md)
- **Completed:** 2026-08-13T20:14:43Z
- **Files modified:** package.json, package-lock.json, scripts/parent-assets.mjs, scripts/load-books.mjs, src/lib/__tests__/parent-assets.test.ts, src/lib/__tests__/load-books.test.ts, fixtures/handbook/src/first.md, fixtures/handbook/assets/parent-plate.svg, scripts/check-external-build.mjs, e2e/external-book.spec.ts, docs/SUMMARY.md, docs/intents/INT-0007-parent-relative-external-assets.md, docs/sprints/s9/**, docs/work/tasks.md, docs/work/completed-tasks.md
- **EARS verified:** criterion 1 — maintained CommonMark parsing records exact inline-image destination-token offsets and root/nested chapters rehome only referenced, regular parent assets into `__tome_parent_assets__` while preserving all other Markdown bytes; criterion 2 — six later-tome failure cases (missing, directory, two reserved-directory collisions including a nested bypass, malformed encoding, lexical escape) plus physical symlink escape fail with chapter/destination evidence, preserve the old destination, and remove staging, while publication retains a rollback copy until the prepared tree is live; criterion 3 — in-source, non-local, link/reference, escaped, and code examples remain byte-identical, POSIX/Windows containment and URL normalization pass, external/symlinked authoritative sources remain supported, and equal asset names stay isolated per tome; criterion 4 — the handbook gate emitted both `plate.<hash>.svg` and `parent-plate.<hash>.svg` below `/_astro/`, and Chromium visibly decoded/styled both (3/3 external tests). Full Vitest passed 64/64; Astro check reported 0 errors / 0 warnings / 0 hints; bundled-reader Playwright passed 8/8; multi-book and default rebuilds passed; Animus Neutronium audit passed with two reviewed existing data-transform warnings; independent implementation re-review was clean. Hosted CI remains Test Phase evidence.
- **Commit:** `fc1b8f4a72e90d20c128da8ca3fe9e68feed485c`

## T-023 (sprint 10)
- **Description:** Build-time search index endpoint + pure scorer
- **Intent:** [INT-0008](../intents/INT-0008-in-book-search.md)
- **Completed:** 2026-08-14T16:46:23Z
- **Files modified:** src/lib/search-index.ts (new), src/lib/search.ts (new), src/pages/search-index.json.ts (new), package.json + package-lock.json (github-slugger direct dep), src/lib/__tests__/search-index.test.ts (new), src/lib/__tests__/search.test.ts (new), docs/intents/INT-0008-in-book-search.md (planned → active)
- **EARS verified:** clause 1 (index builder) — `test_search_index_covers_chapters` (one record per non-draft chapter; drafts excluded; fenced code excluded from `text`, inline code kept), `test_search_index_heading_slugs` (headings slugged in document order incl. H1; github-slugger parity — `the-summary-is-the-spine`; dedupe `notes`/`notes-1`/`notes-2`), `test_search_index_adaptive_url` (one tome → `/…`, many → `/<tome>/…`, root → `/` or `/<tome>`). clause 2 (scorer) — `test_search_ranks_title_over_body` (title/heading weight > body), `test_search_prefix_multiterm` (prefix `comp`→`components`; AND multi-term; section deep-link `#panels-and-tables`), `test_search_empty_and_noresults` (empty/whitespace/no-match → `[]`). Verified end to end: `npm run build` emits `dist/search-index.json` (5 records, adaptive URLs), and its heading slugs match the built HTML `id`s exactly — including the `panels--tables` double-hyphen edge case and the fenced `# Summary`/`# Guide` NOT becoming headings. Full suite 70/70; `astro check` 0 errors; audit clean.
- **Commit:** `9a6094fbfe15fe6720d9600044855b2405cb0b6f`

## T-024 (sprint 10)
- **Description:** Search overlay island + wiring
- **Intent:** [INT-0008](../intents/INT-0008-in-book-search.md)
- **Completed:** 2026-08-14T16:57:16Z
- **Files modified:** src/components/SearchOverlay.tsx (new), src/components/SearchOverlay.module.css (new), src/layouts/BookLayout.astro (mount + searchbar), src/components/Bibliotheca.astro (mount in masthead), src/components/__tests__/SearchOverlay.test.tsx (new), e2e/search.spec.ts (new), playwright.config.ts (default testMatch includes search.spec.ts)
- **EARS verified:** clause 1 (open/focus/Escape) — `test_search_overlay_opens_and_lists` (trigger opens the dialog, focus moves to the combobox), `test_search_overlay_escape_closes` (Escape closes and restores focus to the trigger). clause 2 (results/links/states) — same tests: a section query renders a result link with the adaptive href + heading anchor (`/components#panels`); the empty-query hint and no-result panels render (never blank). E2E `test_search_shortcut_opens_and_navigates` (Playwright, built site): `/` opens the overlay, results list, a "/" typed in the field is text (guard), and activating a result navigates to `/components/panels`. Real-Chromium check: `/` opened the overlay and the "panels" query produced a result deep-linking to `/components/panels#panels` (a11y tree). One `client:idle` island mounted in BookLayout + Bibliotheca; sacred tokens, `role="dialog"`/combobox/listbox, reduced-motion, deterministic hydration signal (`html[data-search-ready]`). Full suite 72/72; Playwright 9/9; `astro check` 0 errors; audit clean.
- **Commit:** `7893eb1b0ba6a0c2b97972b25ffab276481dfd2e`

## T-025 (sprint 10)
- **Description:** Search build gate + README
- **Intent:** [INT-0008](../intents/INT-0008-in-book-search.md)
- **Completed:** 2026-08-14T17:01:01Z
- **Files modified:** scripts/check-search.mjs (new), package.json (check:search), .github/workflows/ci.yml (Search build gate step), src/lib/__tests__/ci-workflow.test.ts (asserts the gate), README.md (Search section)
- **EARS verified:** clause (index emitted + adaptive + query resolves) — `check_search` green: the single-tome build emits `dist/search-index.json` covering the sample (a `/getting-started` record with heading slug `the-summary-is-the-spine`) and `search('panels', index)` resolves to `/components/panels`; the two-tome build (`TOME_BOOKS=fixtures/handbook,fixtures/docs-book`) emits namespaced URLs (`/handbook/first`, `/docs-book/…`) and `search('nested', index)` resolves to a `/handbook/…` URL; the gate restores `src/content/books/` to HEAD and rebuilds default (tree clean). The gate runs the real scorer by importing `src/lib/search.ts` (Node 24 type-strips its type-only import). Wired into CI as a "Search build gate" step; `test_ci_workflow_valid` asserts `check-search.mjs` present (ci.yml validated as YAML). README documents the `/` shortcut, the lazily-fetched index, and adaptive result links. Full suite 72/72; `astro check` 0 errors.
- **Commit:** `5aef8158f051abaffa28745e93a2c84ce23a5319`

## T-209 (sprint 11)
- **Description:** Per-chapter parent-asset preparation on live sync
- **Intent:** [INT-0009](../intents/INT-0009-live-reload-parent-assets.md)
- **Completed:** 2026-08-14T22:55:48Z
- **Files modified:** scripts/parent-assets.mjs (extract shared `rewriteChapterAssets` classifier; add exported `prepareChapterParentAssets`; `prepareParentAssets` refactored, behavior identical), astro.config.mjs (capture `root`; run per-chapter prep after `syncPath` for `.md`), scripts/check-live-reload.mjs (assert the parent image resolves after the live edit), src/lib/__tests__/parent-assets.test.ts (3 live-path tests), docs/intents/INT-0009-live-reload-parent-assets.md (planned → active)
- **EARS verified:** clause 1 (rewrite + copy, in-source unchanged) — `test_prepare_chapter_rewrites_parent_asset` (rewrites `../assets/plate.svg` → `./__tome_parent_assets__/assets/plate.svg` and copies the asset, **succeeding with the reserved dir already present** — the dev case), `test_prepare_chapter_leaves_in_source` (in-source + non-local left byte-identical, no reserved dir). clause 2 (containment parity) — `test_prepare_chapter_rejects_escape` (a target outside the book root throws, same as the build path). clause 3+4 (dev edit reflects + image resolves) — `check_live_reload` extended: editing the handbook chapter (which references `../assets/parent-plate.svg`) reflects the edit **and** the served page references the tome-private `__tome_parent_assets__/…/parent-plate.svg` asset (no ImageNotFound), no restart; tree restored clean. Build path unchanged: the 5 existing `prepareParentAssets` tests stay green and `check_external_build` still emits `/_astro/parent-plate.<hash>.svg` (Chromium spec passes). Full parent-assets suite 8/8; `astro check` 0 errors.
- **Commit:** `f9760c2583d62aee48671631103dc29ccc1eeedf`

## T-208 (sprint 11)
- **Description:** De-flake the theme-toggle E2E
- **Intent:** [INT-0001](../intents/INT-0001-tome-ink-on-paper-mdbook-viewer.md) (regression provenance; realized, unchanged)
- **Completed:** 2026-08-14T22:56:42Z
- **Files modified:** e2e/reader.spec.ts
- **EARS verified:** `test_dark_theme_active` now awaits the sidebar hydration signal `body.js-nav` (set in `TocSidebar.onMount`) before clicking "Switch colour theme", so the toggle's handler is always attached before the click — eliminating the `client:idle` race that intermittently reddened the run. Assertion unchanged (body gains `theme-terminal-dark` + the warm-dark background). Playwright 9/9 green. INT-0001's acceptance is unchanged (stays realized).
- **Commit:** `128ef8b05b7f4082bdcfc5618abaca531c72c957`

## T-026 (sprint 12)
- **Description:** "On this page" rail island + wiring
- **Intent:** [INT-0010](../intents/INT-0010-in-page-reader-navigation.md)
- **Completed:** 2026-08-14T23:34:12Z
- **Files modified:** src/components/OnThisPage.tsx (new), src/components/OnThisPage.module.css (new), src/layouts/BookLayout.astro (right rail column, wide-only + `headings` prop), src/pages/[...slug].astro (`mod.getHeadings()` → H2/H3 headings), src/components/__tests__/OnThisPage.test.tsx (new), docs/intents/INT-0010-in-page-reader-navigation.md (planned → active)
- **EARS verified:** clause 1 (rail lists H2/H3 as `#slug` links; none → no rail) — `test_on_this_page_lists_headings` (nav[aria-label="On this page"] with `#alpha`/`#beta` links), `test_on_this_page_empty_no_rail` (no nav); verified in the build: `dist/getting-started/index.html` server-renders the rail with `#the-summary-is-the-spine`/`#running-the-parser` (slugs identical to the rendered heading `id`s via `getHeadings()`), while `about`/`/` (no sections) render no rail. clause 2 (scroll-sync) — pure `activeHeadingSlug(headings, tops)` unit-tested (`test_active_heading_selection`: all-below → first, two-passed → second, all-passed → last), driven by an `IntersectionObserver` in the island (guarded off where unavailable) with `onCleanup` disconnect. Server-rendered links (zero-JS-visible); one `client:idle` island; rail is a 3rd grid column ≥64rem, hidden below. Full suite 78/78 (one Windows-only temp-cleanup EPERM flake in load-books.test.ts cleared on re-run — Linux CI unaffected); `astro check` 0 errors; audit clean.
- **Commit:** `07a6ba3d310981a7b2675e893e1eafd7abab575b`

## T-027 (sprint 12)
- **Description:** Keyboard chapter navigation island
- **Intent:** [INT-0010](../intents/INT-0010-in-page-reader-navigation.md)
- **Completed:** 2026-08-14T23:38:31Z
- **Files modified:** src/components/ReaderKeys.tsx (new — behavior-only island), src/pages/[...slug].astro (mount ReaderKeys in the chapter slot; compute adaptive prev/next URLs), src/components/Pager.astro (accept `bookSlug`, adaptive links), src/components/__tests__/ReaderKeys.test.tsx (new)
- **EARS verified:** clause 1 (nav) — `test_reader_keys_navigates`: `ArrowRight`/`j` → next, `ArrowLeft`/`k` → prev (via an injected `navigate`); an absent neighbour is a no-op. clause 2 (guards) — `test_reader_keys_guarded`: a key whose target is an `input`, a modified key, or a keydown with an open `[role="dialog"]` (the search overlay's signal) → no navigation. The island renders nothing; a document `keydown` listener added in `onMount`, removed in `onCleanup`. URLs are adaptive via `chapterUrlIn(multi?bookSlug:'' , href)`. **Also fixed a latent multi-tome bug:** `Pager` used root-only `chapterUrl` — now takes `bookSlug` and uses `chapterUrlIn`, so pager links are namespaced (verified: `/handbook/section/nested` → prev `/handbook/first`), consistent with keyboard nav. (Refinement: ReaderKeys is mounted in the `[...slug].astro` chapter slot beside the pager rather than threaded through BookLayout — cleaner, same effect.) Full suite 81/81; `astro check` 0 errors; audit clean.
- **Commit:** `c31e1770023f136e787d8878bf4e9ac8cbcec45e`

## T-028 (sprint 12)
- **Description:** Reader-nav E2E + README (+ scroll-sync mechanism fix)
- **Intent:** [INT-0010](../intents/INT-0010-in-page-reader-navigation.md)
- **Completed:** 2026-08-14T23:50:53Z
- **Files modified:** e2e/reader.spec.ts (3 specs), README.md (Reading a chapter), src/components/OnThisPage.tsx (scroll-sync mechanism fix + hydration signal), src/components/ReaderKeys.tsx (hydration signal)
- **EARS verified:** clause (rail + keys in a real browser) — Playwright 12/12: `test_reader_on_this_page_anchor` (the rail lists the chapter's sections; clicking "Figures" moves the URL to `#figures`), `test_reader_keyboard_next_chapter` (`ArrowRight` on `/getting-started` → `/components`; `ArrowRight` typed in the open search field does **not** navigate), `test_reader_on_this_page_scrollspy` (short viewport: first section active at top, no longer active after scrolling to the end). **Mechanism fix (deviation from the locked EARS, for correctness):** the scroll-sync driver was changed from an `IntersectionObserver` to a passive, rAF-throttled **scroll listener** — measurement showed IO misses fast jump-scrolls that skip its thin trigger band (all headings ended non-intersecting, so it never fired); the scroll listener re-derives the active section from live `getBoundingClientRect` tops via the same pure `activeHeadingSlug`, satisfying criterion 2's "scroll-synced active" behavior. Deterministic hydration signals (`html[data-on-this-page]`, `html[data-reader-keys]`) added so the E2E awaits island readiness (no `client:idle` race). README documents the rail + the `→`/`j`, `←`/`k` shortcuts. Full suite 81/81; `astro check` 0 errors; audit clean.
- **Commit:** `5a2902ef585d08210592ce219f0e7d2bd41ba826`

## T-029 (sprint 13)
- **Description:** Admonitions remark plugin + styling
- **Intent:** [INT-0011](../intents/INT-0011-richer-content-rendering.md)
- **Completed:** 2026-08-15T05:46:52Z
- **Files modified:** scripts/remark-alerts.mjs (new), astro.config.mjs (markdown.remarkPlugins), package.json + package-lock.json (unist-util-visit direct dep; **@astrojs/markdown-remark** added — see note), src/styles/prose.css (admonition styling), src/lib/__tests__/remark-alerts.test.ts (new), docs/intents/INT-0011-richer-content-rendering.md (planned → active)
- **EARS verified:** clause 1 (marker → admonition) — `test_remark_alerts_transforms`: `> [!WARNING]` → a `blockquote` node with `data.hName='div'`, className `[admonition, admonition-warning]`, a prepended `admonition-title` paragraph ("Warning"), and the body text with the marker stripped; case-insensitive (`[!note]` → `admonition-note`). clause 2 (plain unchanged) — `test_remark_alerts_leaves_plain_blockquote`: a markerless blockquote and a bogus `[!FOO]` are left as plain blockquotes. Verified end to end: a probe chapter built to `<div class="admonition admonition-warning"><p class="admonition-title">Warning</p>…`. Sacred styling in prose.css (one panel form; rubric/amber accent + title for important/warning/caution, subdued for note/tip). **Processor note:** this Astro's default Markdown processor ("Sätteri") does not run remark/rehype plugins — `remarkPlugins` requires **@astrojs/markdown-remark** (the unified/remark processor), which I installed. Swapping the processor is broad, so I re-verified the whole surface: heading-id github-slug parity preserved (check_search OK — search + rail slugs still match), footnotes still render, images still optimize (check_external_build OK), plus check_multibook/check_live_reload OK, Playwright 12/12, Vitest 83/83, `astro check` 0 errors, audit clean. No regressions from the swap.
- **Commit:** `50170fe8af46ad0dbe0ea00eeec1ed67aaf47b8c`

## T-030 (sprint 13)
- **Description:** Footnote styling + rail filter + print stylesheet
- **Intent:** [INT-0011](../intents/INT-0011-richer-content-rendering.md)
- **Completed:** 2026-08-15T05:49:35Z
- **Files modified:** src/styles/prose.css (footnote styling), src/pages/[...slug].astro (drop `footnote-label` from the rail headings), src/styles/print.css (new), src/styles/tokens.css (import print.css)
- **EARS verified:** clause 1 (footnotes styled + rail clean) — build probe: a chapter with a footnote renders `class="footnotes"` + `data-footnote-ref`, the CSS bundle carries `.footnotes`/`sup a[data-footnote-ref]`/`.data-footnote-backref` sacred rules, and the on-this-page rail lists only the real H2s (`#the-summary-is-the-spine`, `#running-the-parser`) with **no `#footnote-label`** (the GFM footnotes heading is filtered). clause 2 (print) — `src/styles/print.css` (`@media print`, bundled) drops `.app` to block and hides the sidebar (`nav[aria-label="Table of contents"]`), `.searchbar`, `.rail-col`, and `.pager`, sets ink-on-white, and avoids breaking admonitions/figures/tables across pages; the browser E2E check comes in T-031. `astro check` 0 errors; audit clean; Vitest 83/83 (the recurring Windows-only `load-books` temp-cleanup EPERM cleared on re-run — Linux CI unaffected).
- **Commit:** `7d0075426b7c917a5df11abd5716335dbea20b5d`

## T-031 (sprint 13)
- **Description:** Sample + E2E + README
- **Intent:** [INT-0011](../intents/INT-0011-richer-content-rendering.md)
- **Completed:** 2026-08-15T05:54:23Z
- **Files modified:** src/content/books/tome/getting-started.md (a `[!TIP]` + `[!WARNING]` admonition + a `[^spine]` footnote), e2e/reader.spec.ts (3 specs), README.md (Content rendering)
- **EARS verified:** Playwright 15/15. `test_reader_admonition_rendered` — the sample renders `.admonition.admonition-tip` (title "Tip") and `.admonition.admonition-warning` (title "Warning"). `test_reader_footnote_links` — the ref `sup a[data-footnote-ref]` → `#user-content-fn-spine`, the footnotes `<section>` has a non-zero top border (sacred set-off, C-001), the ref is raised (Tailwind superscript `top<0`), and the note's `.data-footnote-backref` → `#user-content-fnref-spine`. `test_reader_print_hides_chrome` — under `emulateMedia({media:'print'})` the sidebar (`nav[aria-label="Table of contents"]`), `.searchbar`, `.rail-col`, and `.pager` compute `display:none` while `article.tome-prose` stays visible. Real-browser check (a11y/page text): the TIP + WARNING admonitions, the footnote ref, and the FOOTNOTES/backref all render. README documents admonitions, footnotes, and printing. `astro check` 0 errors; audit clean.
- **Commit:** `ea7f10bc49ec16bf725f0f69b4985f631df2678b`

## T-032 (sprint 14)
- **Description:** Electron shell — shared dist resolver + serve-dist reuse + secure app:// protocol window + external-link routing + launch scripts + resolver unit test
- **Intent:** [INT-0012](../intents/INT-0012-desktop-shell-electron.md)
- **Completed:** 2026-08-15T14:19:00Z
- **Files modified:** scripts/dist-resolve.mjs (new — pure `resolveDistPath` + `contentTypeFor`), scripts/serve-dist.mjs (reuse the shared resolver), electron/main.cjs (new — app:// protocol, secure BrowserWindow, external-link handling), package.json (`electron` + `electron:start` scripts; `electron` devDep), src/lib/__tests__/dist-resolve.test.ts (new), plus Sprint 14 scaffold (INT-0012, research report, build/test plans, critique, sprint-meta, SUMMARY)
- **EARS verified:** `resolveDistPath` unit suite green (`test_resolve_root_index`, `test_resolve_route_index`, `test_resolve_asset_passthrough`, `test_resolve_escape_null` + content-type map) — Vitest 89/89. Runtime smoke (`_electron.launch` on the built `dist/`): window at `app://tome/`, chapter H1 "Introduction" + 7 sidebar TOC links render fully offline; in-page `fetch('/search-index.json')` → 5 records; `getLastWebPreferences()` = `{contextIsolation:true, nodeIntegration:false, sandbox:true}`; `window.open('https://…')` routed to `shell.openExternal` (recorded), `mailto:` denied, window count stayed 1. `astro check` 0 errors. The serve-dist refactor is behavior-preserving (the browser Playwright suite, unchanged, still runs against it — verified in T-033).
- **Commit:** `0ca6c8f6be8ed9fff5f5782f29c1e13701305010`

## T-033 (sprint 14)
- **Description:** Electron end-to-end proof + docs — Playwright-Electron spec, dedicated config, check:electron gate, README "Desktop app"
- **Intent:** [INT-0012](../intents/INT-0012-desktop-shell-electron.md)
- **Completed:** 2026-08-15T14:23:00Z
- **Files modified:** e2e/electron.spec.ts (new — 4 specs via `_electron.launch`), playwright.electron.config.ts (new — standalone config, no webServer, `testMatch` the electron spec), package.json (`check:electron` script), README.md (Desktop app section + Develop/Content-rendering lines)
- **EARS verified:** `npm run check:electron` (build + Playwright-Electron) 4/4 green. `test_electron_reader_offline` — the window loads `app://tome/`, renders the chapter H1 "Introduction" and the sidebar TOC (Getting Started, About) with no dev server/network. `test_electron_search_index` — in-page `fetch('/search-index.json')` resolves to `app://tome/search-index.json`, `ok`, >0 records. `test_electron_secure_config` — `getLastWebPreferences()` = `{contextIsolation:true, nodeIntegration:false, sandbox:true}` and the renderer has no `require`/`module`/`process`. `test_electron_external_link` — `window.open('https://…')` routed to `shell.openExternal`, `mailto:` denied, window count stayed 1 and the app stayed on the `app://tome` origin. No-regression: browser Playwright suite 15/15 against the refactored `serve-dist` (extraction behavior-preserving), Vitest 89/89, `astro check` 0 errors, and check:external / check:multibook / check:search / check:livereload all green.
- **Commit:** `a42b8e5f5665f529db4ec64092b8fb6c4b2ef2f8`

## T-034 (sprint 15)
- **Description:** Shell zoom hardening — start at 100%, disable pinch, snap back accidental wheel/pinch zoom so the layout can't collapse
- **Intent:** [INT-0013](../intents/INT-0013-resilient-scaling-zoom.md)
- **Completed:** 2026-08-15T19:15:24Z
- **Files modified:** electron/main.cjs (per-load `setVisualZoomLevelLimits(1,1)` + a `zoom-changed` → `setZoomFactor(1)` snap-back), e2e/electron.spec.ts (`test_electron_zoom_locked`), plus Sprint 15 scaffold (INT-0013, INT-0014, research report, build/test plans, critique, sprint-meta, SUMMARY)
- **EARS verified:** `npm run check:electron` 6/6. `test_electron_zoom_locked` — the window opens at `getZoomFactor()` 1; after `setZoomFactor(1.5)` + emitting the `zoom-changed` event a Ctrl-wheel/pinch fires, the shell snaps it back to 1. `setVisualZoomLevelLimits(1,1)` disables pinch/visual zoom on each load; deliberate keyboard zoom (Ctrl +/-/0, incl. the native Ctrl+0 reset) is untouched because it does not emit `zoom-changed`. `astro check` 0 errors. All prior electron tests (reader offline, search index, secure config, icon theme, external link) still green.
- **Commit:** `39ca3b652b83bbf45c76898de51aa66e57965960`

## T-036 (sprint 15)
- **Description:** Second curated sample tome ("Marginalia") → the default build is a 2-tome Bibliotheca; reader/search/electron E2E migrated to the multi-tome default
- **Intent:** [INT-0014](../intents/INT-0014-discoverable-library.md)
- **Completed:** 2026-08-15T19:24:00Z
- **Files modified:** src/content/books/marginalia/{SUMMARY.md,README.md,on-reading.md,on-machines.md,book.meta.json} (new tome), e2e/reader.spec.ts (namespaced under `/tome` + `test_reader_bibliotheca_default` + `test_reader_cross_tome_nav`), e2e/search.spec.ts (`test_search_across_tomes` + namespaced routes), e2e/electron.spec.ts (`test_electron_reader_offline` → Bibliotheca then into a tome), scripts/check-search.mjs (single-tome case now builds an explicit fixture, since the default is 2-tome)
- **EARS verified:** default build emits `/` (Bibliotheca) + `/tome/*` + `/marginalia/*` (9 pages). `npm run test:e2e` 18/18 — incl. `test_reader_bibliotheca_default` (both tomes listed at `/`), `test_reader_cross_tome_nav` (switcher → sibling tome; Bibliotheca link → `/`), `test_search_across_tomes` (query "reading" returns hits tagged both "Tome" and "Marginalia"). `npm run check:electron` 6/6 (migrated reader-offline: Bibliotheca → into a tome, offline). Single-tome mode still covered by `check:external`. `astro check` 0 errors; `check:livereload` OK.
- **Commit:** `b02000716349bb2d06d7980b1c0b0b6a68996cc0`

## T-037 (sprint 15)
- **Description:** Tome-count-aware search copy — the search UI reads library-wide with several tomes and does not imply multiple tomes with one
- **Intent:** [INT-0014](../intents/INT-0014-discoverable-library.md)
- **Completed:** 2026-08-15T19:33:30Z
- **Files modified:** src/lib/search-copy.ts (new — pure `searchScopeCopy(libraryWide)`), src/lib/__tests__/search-copy.test.ts (new), src/components/SearchOverlay.tsx (`libraryWide` prop drives trigger/hint/dialog-label via the helper), src/layouts/BookLayout.astro + src/components/Bibliotheca.astro (pass `libraryWide`), src/components/__tests__/SearchOverlay.test.tsx (render library-wide)
- **EARS verified:** `searchScopeCopy` unit suite — `test_search_copy_library_wide` (N>1 → "Search the library" / "every tome") and `test_search_copy_single_tome` (N=1 → "Search this tome", never "library"/"every tome"). Vitest 96/96; `astro check` 0 errors; `npm run test:e2e` 18/18 (the 2-tome default renders the library-wide copy; the search dialog is still named "Search the library"). BookLayout passes `libraryWide` from the switcher size; the Bibliotheca (multi only) passes true.
- **Commit:** `527065c9e5901dc2b3e2c994302db995916aa14c`

## T-035 (sprint 15)
- **Description:** Responsive scaling sweep — a browser width-matrix guard against overflow, dialog clipping, and wrong layout mode
- **Intent:** [INT-0013](../intents/INT-0013-resilient-scaling-zoom.md)
- **Completed:** 2026-08-15T19:36:00Z
- **Files modified:** e2e/scaling.spec.ts (new), playwright.config.ts (`scaling.spec.ts` added to `testMatch`)
- **EARS verified:** `npm run test:e2e` 21/21 (18 prior + 3 new). `test_scaling_no_overflow` — across widths 480→2560 on the Bibliotheca and a reader chapter, `documentElement.scrollWidth ≤ innerWidth`. `test_scaling_dialog_in_viewport` — with search open at every width the dialog's rect stays within the viewport and the document does not overflow. `test_scaling_layout_mode` — stacked below 769px, two columns at ≥769px, three columns with the rail at ≥1024px (asserted via sidebar/content bounding boxes + the rail's computed display). Together with the Electron `test_electron_zoom_locked`, criterion 4's sweep runs in both the browser and the shell. `astro check` 0 errors.
- **Commit:** `f18ef1d14cfea9cd9d8b8eb2c95eaae0f9ba811b`

## T-038 (sprint 16)
- **Description:** Scaffold the isolated Tauri v2 spike — loads the built dist/ offline in a native WebView2 window, with a secure config + external-link routing
- **Intent:** [INT-0015](../intents/INT-0015-tauri-shell-spike.md)
- **Completed:** 2026-08-16T00:22:08Z
- **Files modified:** src-tauri/ (new — Cargo.toml [standalone workspace], tauri.conf.json [frontendDist→../dist, no auto-window, csp null], src/lib.rs [opener plugin + WebviewWindowBuilder with on_navigation guard], src/main.rs, build.rs, capabilities/default.json [core+opener], icons/), package.json + package-lock.json (@tauri-apps/cli 2.11.4 dev + `tauri` script), plus Sprint 16 scaffold (INT-0015, research report, build/test plans, critique, sprint-meta, SUMMARY)
- **EARS verified:** `cargo build` compiles the Tauri crate tree (first 2m10s; incremental ~20s) → `app.exe` (~13.8 MB debug). Launched (PID confirmed, main process **~37 MB RSS**): the window loads `dist/` **offline** and renders `/` (the Bibliotheca — "The Bibliotheca of Charl", both tome plates, Mekzantine font, parchment ground, rubric-red accents) pixel-identical to Chromium (screenshot `tauri-bibliotheca.png`). Directory routes resolve **natively** — loading `/marginalia` (no `.html`) rendered the full reader (sidebar + switcher + Bibliotheca link, Colophon chapter, pager, theme toggle; screenshot `tauri-directory-route.png`), so **no custom protocol is needed** (the top research risk, retired). Root-absolute assets (`/_astro/*`, `/fonts/*` self-hosted woff2) load; the Solid search island hydrated. Internal navigation stays in-app; external `http(s)` is routed to the OS browser via `on_navigation` + `tauri-plugin-opener` (implemented, standard pattern); secure by default (no Node, capability allowlist). `electron/` and the web build untouched. `src-tauri/target/` (~3 GB) git-ignored.
- **Commit:** `23d8178b192f93433576fb1bc5e5f86175bdb8f4`

## T-039 (sprint 16)
- **Description:** Tauri build/launch verification, rendering evaluation, and the recorded go/no-go (GO); spike isolation confirmed
- **Intent:** [INT-0015](../intents/INT-0015-tauri-shell-spike.md)
- **Completed:** 2026-08-16T00:30:00Z
- **Files modified:** docs/sprints/s16/sprint-tests/go-no-go.md (new — the recommendation), docs/sprints/s16/sprint-tests/evidence/{tauri-bibliotheca.png,tauri-reader.png} (new — captured renders), README.md (experimental Tauri platform note), tsconfig.json (exclude src-tauri so astro check ignores the Rust build output)
- **EARS verified:** the release build produced an **8.6 MB** exe (vs Electron's **348 MB** bundled runtime, ~40× smaller); the launched window renders the Bibliotheca and the reader (directory route `/marginalia`) with the sacred aesthetic **pixel-identical to Chromium** (WebView2), captured as evidence screenshots and **surfaced to the user for confirmation** (criterion 2 is the user's visual sign-off). Recommendation **GO** recorded in `go-no-go.md` with bundle size, ~37 MB memory, porting-effort estimate, and the Linux/WebKitGTK caveat. Isolation/no-regression: Vitest 96/96, `astro check` 0 errors (after excluding `src-tauri/target` from TS), `check:electron` 6/6 — the spike touched no existing web/Electron code. (Note: `astro check` initially reported 40 errors from scanning Tauri's binary `target/*.js`; fixed by the tsconfig exclude.)
- **Commit:** `b547b740d6743dddc8c4f5a989cfd71031efc6d6`
