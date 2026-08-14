# Sprint 11 Research Report

## Intents Reviewed

- [INT-0009 — Live-reload fidelity for parent-relative assets](../../intents/INT-0009-live-reload-parent-assets.md)
  — **created** this sprint (`proposed`). Picks up the live-edit slice INT-0007
  explicitly deferred; a distinct outcome, so a new chapter (mirroring INT-0003 →
  INT-0007) rather than reopening a realized intent.
- [INT-0007 — Parent-relative external assets](../../intents/INT-0007-parent-relative-external-assets.md)
  — **revised** (Consequences only, no state change): the deferred live-editing
  slice is now pointed to INT-0009; INT-0007 stays `realized`.
- [INT-0001 — Tome ink-on-paper viewer](../../intents/INT-0001-tome-ink-on-paper-mdbook-viewer.md)
  — **selected** as regression provenance for T-208 (harden a flaky theme-toggle
  E2E); `realized`, unchanged.

## 1. Sprint Goal

A hardening sprint that clears the two backlog bugs. **T-209 (INT-0009):** make the
dev live-reload watcher parent-asset-aware so editing a chapter that references a
parent-relative image reflects in the reader without breaking the image (fixing the
`ImageNotFound` regression Sprint 10 diagnosed), with build-parity containment and
the `check_live_reload` gate green again. **T-208 (INT-0001):** de-flake the
`client:idle` theme-toggle E2E by awaiting the sidebar's hydration signal before
clicking.

## 2. Existing Code Survey

| File | Relevance |
|------|-----------|
| astro.config.mjs | The `tomeLiveReload` integration — `reload(changed)` → `syncPath(changed, sourceDir, dest)` → `full-reload`. The fix site: after syncing a `.md`, run per-chapter parent-asset prep; it must also capture the book `root`. |
| scripts/parent-assets.mjs | `prepareParentAssets({root,sourceDir,stagedTome})` rewrites parent-relative image URLs + copies assets into `__tome_parent_assets__`; throws if that dir preexists (build-time source-trust guard). Exposes `imageDestinationSpans`, `isPathInside`, `toMarkdownPath`, `PARENT_ASSET_DIR`. A per-chapter path reuses the span classification + containment but reuses the already-staged asset dir. |
| scripts/book-source.mjs | `syncPath(changed,sourceDir,dest)` raw-copies one changed file (the current behavior that loses the rewrite); `resolveBookSource` returns `{root,sourceDir,slug,…}` — the watcher already has `root` available. |
| scripts/load-books.mjs | Build reference: after copying a tome it calls `prepareParentAssets({root,sourceDir,stagedTome:out})`. The live path must match its rewrite so URLs are identical. |
| scripts/check-live-reload.mjs | The gate. Currently edits `first.md` (which now has a parent image) → fails. Will assert the edit reflects **and** the parent image still resolves (e.g. an optimized `/_astro/` asset), proving criterion 4. |
| fixtures/handbook/src/first.md | Contains `![A parent-held plate](../assets/parent-plate.svg)` (Sprint 9) — the repro and the gate's fixture. |
| fixtures/handbook/assets/parent-plate.svg | The book-root sibling asset. |
| e2e/reader.spec.ts | `test_dark_theme_active` clicks "Switch colour theme" immediately after `goto` → the `client:idle` race (T-208). Fix: await the hydration signal first. |
| src/components/TocSidebar.tsx | On mount adds `document.body.classList.add('js-nav')` — the deterministic hydration signal the theme E2E can wait on (`body.js-nav`). |

## 3. External Sources

- [mdast-util-from-markdown — CommonMark parsing (reused for image spans)](https://github.com/syntax-tree/mdast-util-from-markdown)
- [Astro — image handling & the `ImageNotFound` error](https://docs.astro.build/en/reference/errors/image-not-found/)
- [Vite dev server `watcher` (chokidar) — the change events the integration hooks](https://vite.dev/guide/api-plugin.html#configureserver)
- [Playwright — `waitForSelector` for deterministic readiness](https://playwright.dev/docs/api/class-page#page-wait-for-selector)

## 4. Risks, Unknowns, Dependencies

- **Rewrite parity.** The live per-chapter rewrite must produce the **same** staged
  URL as the build path, or the image 404s differently. Mitigation: reuse the exact
  span-classification + `toMarkdownPath` logic; the gate asserts the image resolves
  after a live edit.
- **Reserved-dir guard.** The build function throws when `__tome_parent_assets__`
  preexists; the dev dest legitimately already has it. Mitigation: the per-chapter
  path does **not** reuse that throw (it operates on our own trusted dest), but
  keeps the containment (root confinement, realpath, regular-file) checks.
- **Security regression.** Must not weaken INT-0007's confinement. Mitigation: share
  the classification/containment code; a unit test covers an escaping target on the
  live path.
- **Not touching the build path.** Refactor must leave `prepareParentAssets`
  behavior identical (its symlink/escape tests must stay green). Mitigation: extract
  a shared classifier without changing the whole-tome orchestration/guards.
- **Watcher owns only `sourceDir`.** Editing the parent asset file itself is out of
  scope (declared in INT-0009); only chapter edits are covered.
- **T-208 signal.** `body.js-nav` is set in `TocSidebar.onMount`; if the sidebar
  island fails to hydrate the wait times out (surfacing a real failure, not a flake).

## 5. Recommended Approach

- **parent-assets.mjs:** extract the per-span validation (target resolve →
  in-source skip → root confinement → realpath/regular-file → staged path +
  `toMarkdownPath` rewrite) into a shared internal helper. Add an exported
  `prepareChapterParentAssets({ root, sourceDir, stagedTome, sourceFile, stagedFile })`
  that rewrites one synced chapter and copies its referenced assets into the
  existing `__tome_parent_assets__` (idempotent `mkdir`; no preexisting-dir throw).
  Refactor `prepareParentAssets` to call the shared helper, unchanged in behavior.
- **astro.config.mjs:** capture `root` from `resolveBookSource`; in `reload`, after
  `syncPath` yields a `.md` target, `await prepareChapterParentAssets(...)` before
  sending `full-reload`. Non-`.md` and non-parent chapters are unaffected.
- **check-live-reload.mjs:** after the live edit is observed, also assert the parent
  image still resolves in the served page (an optimized `/_astro/` asset), proving
  criterion 4 (the gate goes green).
- **reader.spec.ts (T-208):** `await page.waitForSelector('body.js-nav')` before
  clicking the theme toggle in `test_dark_theme_active` (and the same guard where a
  click depends on sidebar hydration).
- **Tasks:** (T-209) per-chapter parent-asset prep + watcher wiring + gate + unit
  test; (T-208) de-flake the theme-toggle E2E. Two tasks, two intents.

## Artifacts

- [INT-0009 — Live-reload fidelity for parent-relative assets](../../intents/INT-0009-live-reload-parent-assets.md) (created)
- [INT-0007](../../intents/INT-0007-parent-relative-external-assets.md) (Consequences pointer to INT-0009)
- This report; empirical: the Sprint 10 dev log captured `ImageNotFound: ../assets/parent-plate.svg` on live edit; `git log -1 -- fixtures/handbook/src/first.md` = Sprint-9 `fc1b8f4`.
