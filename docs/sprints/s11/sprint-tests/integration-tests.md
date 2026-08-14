# Sprint 11 Integration Gates

All gates green, tree restored clean after each.

## `check_live_reload` (the sprint's target) — local — **now OK**
`node scripts/check-live-reload.mjs` → **OK — the live edit appeared and the parent
image resolved, no restart.** This is the gate that **failed** in Sprint 10. It runs
`astro dev` against a temp copy of `fixtures/handbook` (whose `first.md` references
`../assets/parent-plate.svg`), confirms `/first` serves the original chapter, edits
the heading, and polls until:
1. the reader reflects the edit (marker appears — the page rendered, i.e. no
   `ImageNotFound` 500), **and**
2. the served page references the tome-private `__tome_parent_assets__/…/parent-plate.svg`
   asset — proving the synced chapter was re-rewritten (INT-0009), not the broken
   `../assets/…` (criterion 4).
Restores `src/content/books/` to HEAD. (Verified live: the dev-served page emits
`<img src="/_image?href=…__tome_parent_assets__%2Fassets%2Fparent-plate.svg…">`.)

## `check_external_build` (build-path regression) — CI + local
`node scripts/check-external-build.mjs` → **OK** for both fixtures. The T-209
refactor is extract-only, so the **build** path is unchanged: the handbook still
emits `/_astro/parent-plate.<hash>.svg` and the external-book Chromium spec
(`test_external_parent_relative_image_loads`) passes.

## `check_multibook` + `check_search` (regression) — CI + local
`node scripts/check-multibook.mjs` → **OK**; `node scripts/check-search.mjs` → **OK**
(single + multi). Neither touches the parent-asset or live-reload paths; both green.
