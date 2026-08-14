# Sprint 11 Unit & Component Tests (Vitest)

`npx vitest run` → **75 passed / 0 failed / 75 total** (13 files). New this sprint,
in `src/lib/__tests__/parent-assets.test.ts`:

## Per-chapter parent-asset preparation (T-209, INT-0009)
- `test_prepare_chapter_rewrites_parent_asset` — a synced chapter referencing
  `../assets/plate.svg` → `prepareChapterParentAssets` rewrites the URL to
  `./__tome_parent_assets__/assets/plate.svg` and copies the asset there, and
  **succeeds when the reserved dir already exists** (the dev/live-reload case the
  build function forbids).
- `test_prepare_chapter_rejects_escape` — a chapter whose image target resolves
  outside the book root throws the same containment error as the build path (no
  weakening of INT-0007's confinement).
- `test_prepare_chapter_leaves_in_source` — an in-source relative image and a
  non-local URL are left byte-identical; no reserved directory is created.

## Build-path regression (T-209 refactor — behavior identical)
The five existing `prepareParentAssets` tests are **unchanged and green** after the
extract-only refactor (shared `rewriteChapterAssets` classifier):
`test_image_destination_token_offsets`, `test_parent_asset_cross_platform_paths`,
`test_prepare_parent_asset_rewrites_root_and_nested`,
`test_prepare_parent_asset_preserves_non_targets`,
`test_parent_asset_rejects_symlink_escape`.

## Regression (all prior suites green)
search, book, book-source, load-books, summary, paths, ci-workflow, contrast, fonts.

`npx astro check` → **0 errors / 0 warnings / 0 hints**. neutronium audit → passed.
