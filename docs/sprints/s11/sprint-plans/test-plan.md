Finalized - DO NOT EDIT

# Sprint 11 Test Plan

## Intent Traceability
| Intent | Acceptance criterion | Build task / EARS clause | Verification |
|--------|----------------------|--------------------------|--------------|
| [INT-0009](../../../intents/INT-0009-live-reload-parent-assets.md) | 1 — synced chapter's parent image rewritten + copied | T-209 / WHEN a synced chapter has a parent image THEN rewrite to staged asset + copy | `test_prepare_chapter_rewrites_parent_asset` |
| [INT-0009](../../../intents/INT-0009-live-reload-parent-assets.md) | 2 — build-parity containment; in-source/non-local unchanged | T-209 / WHEN target escapes root THEN throw; in-source left unchanged | `test_prepare_chapter_rejects_escape`, `test_prepare_chapter_leaves_in_source` |
| [INT-0009](../../../intents/INT-0009-live-reload-parent-assets.md) | 3 — no regression to plain live reload | T-209 / plain chapter still syncs & reflects | `check_live_reload` (marker still appears) |
| [INT-0009](../../../intents/INT-0009-live-reload-parent-assets.md) | 4 — dev edit reflects + image resolves | T-209 / WHEN watcher syncs .md THEN prep before reload | `check_live_reload` (extended: `/_astro/` asset present) |
| [INT-0001](../../../intents/INT-0001-tome-ink-on-paper-mdbook-viewer.md) | theme toggle active (no flake) | T-208 / WHEN the test runs THEN await `body.js-nav` before click | `test_dark_theme_active` |

## Unit Tests
### T-209 unit tests
- **Intent:** [INT-0009](../../../intents/INT-0009-live-reload-parent-assets.md)
- `test_prepare_chapter_rewrites_parent_asset` (`parent-assets.test.ts`): a staged
  chapter referencing `../assets/plate.svg` (asset inside the book root, outside the
  source dir) → `prepareChapterParentAssets` rewrites the URL to the
  `__tome_parent_assets__/…` path (matching the build path's rewrite for the same
  input) and the asset is copied there; **succeeds even when the reserved dir already
  exists** (the live-reload case).
- `test_prepare_chapter_rejects_escape` (`parent-assets.test.ts`): a chapter whose
  image target resolves outside the book root → throws a containment error (parity
  with the build path).
- `test_prepare_chapter_leaves_in_source` (`parent-assets.test.ts`): a chapter with an
  in-source relative image and a non-local URL → left byte-unchanged (no rewrite).
- **Regression:** the existing `prepareParentAssets` build tests
  (`parent-assets.test.ts`) remain **unchanged and green** — the refactor is
  extract-only.

## Integration Tests
### Live-reload gate
- **Intent:** [INT-0009](../../../intents/INT-0009-live-reload-parent-assets.md)
- `check_live_reload` (`scripts/check-live-reload.mjs`, extended): runs `astro dev`
  against a temp copy of `fixtures/handbook` (whose `first.md` references
  `../assets/parent-plate.svg`); confirms `/first` serves the original chapter, edits
  the source heading, and polls until the reader reflects the edit **and** the served
  page references a **parent-plate-derived** `/_astro/` asset (the `parent-plate.<hash>`
  shape; the parent image resolved) with no image error (C-001). Restores
  `src/content/books/` to HEAD. Local gate (as before).

## End-to-End Tests
- **Status:** possible
- `test_dark_theme_active` (`e2e/reader.spec.ts`, hardened): after `goto('/')` it
  awaits `body.js-nav` (sidebar hydrated) before clicking the theme toggle, then
  asserts `theme-terminal-dark` + the warm-dark background — deterministic, no
  `client:idle` race. The full Playwright suite (9) stays green.
