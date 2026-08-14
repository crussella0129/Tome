# Sprint 11 Test Report

## Intent Verification
| Intent | Acceptance criterion | EARS / tests | Result | Intent evidence update |
|--------|----------------------|---------------|--------|------------------------|
| [INT-0009](../../../intents/INT-0009-live-reload-parent-assets.md) | 1 — synced chapter's parent image rewritten + copied | T-209 `test_prepare_chapter_rewrites_parent_asset`, `test_prepare_chapter_leaves_in_source` | **pass** | Test evidence adds this report |
| [INT-0009](../../../intents/INT-0009-live-reload-parent-assets.md) | 2 — build-parity containment | T-209 `test_prepare_chapter_rejects_escape` | **pass** | (as above) |
| [INT-0009](../../../intents/INT-0009-live-reload-parent-assets.md) | 3 — no regression to plain live reload | T-209 `check_live_reload` (marker appears) | **pass** | (as above) |
| [INT-0009](../../../intents/INT-0009-live-reload-parent-assets.md) | 4 — dev edit reflects + image resolves | T-209 `check_live_reload` (parent asset in served page) | **pass** | (as above) |
| [INT-0001](../../../intents/INT-0001-tome-ink-on-paper-mdbook-viewer.md) | theme toggle active (no flake) | T-208 `test_dark_theme_active` (hardened) | **pass** | realized, unchanged (regression provenance) |

All four INT-0009 criteria are met → **INT-0009 is eligible for `realized`** (Loop
Phase). INT-0001 stays `realized` (T-208 hardens an existing test; acceptance unchanged).

## Summary
- Unit/component: **75 passed / 0 failed** (Vitest, 13 files) — incl. 3 new
  per-chapter parent-asset tests; the 5 build-path tests unchanged.
- E2E: **9 passed / 0 failed** (Playwright) — `test_dark_theme_active` de-flaked.
- Gates: **`check_live_reload` OK** (the Sprint-10 failure is fixed),
  `check_external_build`, `check_multibook`, `check_search` — all **OK**, tree clean.
- `astro check`: **0 errors / 0 warnings / 0 hints** · audit: **passed**.
- CI status: green **expected** on the PR (all CI-run gates green locally).

## Tested head
- **Head SHA:** `8600c22abfdf83a7b3fcb5d4b5564bbd00d16337` (tip of `dev`).
- Local canonical-runner records: `vitest` 75 passed · `playwright` 9 passed ·
  `check_live_reload` OK · `check_external_build` OK · `check_multibook` OK ·
  `check_search` OK · `astro check` 0 errors · audit passed. CI conclusion to be
  observed on the Sprint 11 PR.

## Failures
None. (Both Sprint-10 backlog items — T-209 and T-208 — are cleared.)

## Technical Debt Identified
- Live edits to a parent **asset file itself** (not the referencing chapter) remain
  out of scope — the watcher owns only the detected source directory (declared in
  INT-0009 Consequences).
- No new backlog opened this sprint.

## Coverage Observations
The fix is proven at two levels: `prepareChapterParentAssets` is unit-tested for
rewrite/copy (with a preexisting reserved dir), containment parity, and no-op on
in-source images; and the end-to-end `check_live_reload` gate (previously red) now
proves that editing a parent-asset chapter in `dev` reflects **and** the parent
image resolves via the tome-private staged asset. The build path is untouched
(extract-only refactor; its 5 tests + the external gate stay green), so INT-0007's
build-time behavior and confinement are preserved.
