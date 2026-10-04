# Sprint 22 Test Report

## Intent Verification
| Intent | Acceptance criterion | EARS / tests | Result | Intent evidence update |
|--------|----------------------|---------------|--------|------------------------|
| [INT-0022](../../../intents/INT-0022-sanguine-atonement-theme.md) | AC1 — Light·Dark·Other on reader + Bibliotheca; themed modal; keyboard/touch; focus return | T-055 / picker + dialog component tests, `test_theme_selector_reader_and_bibliotheca` | **pass** (caveat C-004) | Test evidence links this report |
| [INT-0022](../../../intents/INT-0022-sanguine-atonement-theme.md) | AC2 — tolerant answers; refusal; Silence nod | T-055 / `test_riddle_*`, `test_riddle_refused_and_silence_keep_theme` | **pass** | (as above) |
| [INT-0022](../../../intents/INT-0022-sanguine-atonement-theme.md) | AC3 — wash, persistence from first paint, reduced-motion path, direct exit | T-057 / wash component tests, `test_sanguine_wash_and_persistence`, `…_reduced_motion_no_wash`, `…_exit_direct` | **pass** | (as above) |
| [INT-0022](../../../intents/INT-0022-sanguine-atonement-theme.md) | AC4 (revised) — inscription ≥ 3.3:1 at ≥ 24px, hue-true; interface ≥ 4.5:1; texture never lowers ratios | T-061 / `test_sanguine_role_contrast`, `test_sanguine_inscription_contrast`, `test_sanguine_inscription_size_and_ink`, pixel bound in `test_sanguine_surface_and_channels` | **pass** | (as above) |
| [INT-0022](../../../intents/INT-0022-sanguine-atonement-theme.md) | AC5 — obsidian + channels + flourishes; motion off under reduced motion; none in print | T-056 / `test_sanguine_surface_and_channels`, `…_sealed_drafts`, `…_reduced_motion_static`, `…_print_ink_on_white` + human screenshots | **pass (automated)**; experiential judgment surfaced for user sign-off (C-002) | Realization awaits sign-off |
| [INT-0022](../../../intents/INT-0022-sanguine-atonement-theme.md) | AC6 — 44px targets at tablet size; no auto-capitalize/correct; theme-color follows | T-055 / `test_theme_controls_touch_targets`, `test_riddle_input_attributes`, `test_theme_state_syncs_meta`, theme-color E2E | **pass** | (as above) |
| [INT-0023](../../../intents/INT-0023-find-load-and-deploy-books.md) | AC1 — discovery, JSON, no double-listing, invalid skipped | T-059 / `test_find_books_*`; real-machine scan | **pass** (caveat C-003) | Test evidence links this report |
| [INT-0023](../../../intents/INT-0023-find-load-and-deploy-books.md) | AC2 — add, dedupe, precedence, never edit tracked manifest | T-058/T-059 / `test_manifest_precedence`, `test_owner_follows_manifest`, `test_books_add_*` | **pass** | (as above) |
| [INT-0023](../../../intents/INT-0023-find-load-and-deploy-books.md) | AC3 — clean checkout; sample when unconfigured | T-058 / `test_personal_build_leaves_checkout_clean`, `test_loader_default_publishes_sample`; user's real library | **pass** | (as above) |
| [INT-0023](../../../intents/INT-0023-find-load-and-deploy-books.md) | AC4 — no VCS/deps/build output; content intact | T-058 / `test_loader_excludes_vcs_and_build_output`; real library 35 → 21 MB, no `.git` | **pass** | (as above) |
| [INT-0023](../../../intents/INT-0023-find-load-and-deploy-books.md) | AC5 — existing guarantees hold | T-058 / all four gates PASS in the active workspace; Vitest reads the sample; Playwright builds the sample; CI | **pass** | (as above) |
| [INT-0023](../../../intents/INT-0023-find-load-and-deploy-books.md) | AC6 — tutorial in the guide + README; documented commands exist and are tested | T-060 / `test_tutorial_*`, `test_readme_links_tutorial`, `test_tutorial_chapters_reachable_and_searchable`, `verify_live_unseal` | **pass** | (as above) |

Every INT-0023 criterion is proved, so it is eligible for `realized` in Loop.
INT-0022's criteria are proved by automated evidence, except AC5's experiential
clause, which goes to the user. INT-0021 (realized) received only a consequence
note; its guard and isolation contracts were re-verified by the T-058 gate runs.

## Summary
- Unit + integration (Vitest): **173 passed / 0 failed / 173 total** (27 files).
- E2E (Playwright, Chromium): **37 passed / 0 failed**, plus external-book
  Chromium **3/3** inside `check:external`.
- Production gates: **4/4 PASS** in the active workspace (first time with a
  personal library present).
- `astro check`: 0 errors, 0 warnings, 0 hints.
- Scripted live checks: unseal-without-restart (≈ 0.045 s), raw-file reachability
  in dev (confirms the tutorial warning), LAN preview HTTP 200.
- Test critic: **proceed-with-caveats** (C-001 and C-005 rejected with
  reasons; C-002, C-003, and C-004 deferred with rationale).
- CI: **green** on the exact build head.

## CI Confirmation
- **Head SHA:** `b222c5670c5a1a1b0af2399b842d710ac01b6d29`
- **CI run:** [37219722218](https://github.com/crussella0129/Tome/actions/runs/37219722218)
- **Conclusion:** success
- **Confirmations:** `verify` succeeded for checkout/setup-node v7, dependency
  installation, Type check, Unit & integration tests (Linux, including the
  symlink case of `test_find_books_bounds`), End-to-end tests, External book
  build gate, Multi-book build gate, Search build gate, and Playwright-report
  upload.

## Failures
None against the locked plans as amended (`sprint-meta.md` § Plan amendments).

Resolved during Build, retained for provenance:
- the first obsidian glint measured `#412f32`, above the contrast budget,
  because Chromium renormalises lighting output; it was redesigned with
  per-channel caps inside the filter and is now guarded by a pixel test;
- adding three test files pushed `fixture-commands.test.ts` past Vitest's 5 s
  default timeout under full-suite load; the describe now uses its own 30 s
  spawn bound;
- `aria-haspopup` on the Other radio (not valid for `role="radio"`) collided
  with the search trigger's locator and was removed.

## Technical Debt Identified
- [INT-0020](../../../intents/INT-0020-native-library-folder-management.md):
  in-app folder picking remains backlog T-052. `books:find --json`/`books:add`
  and the personal manifest are the building blocks it can reuse.
- Base-path hosting (`user.github.io/repo/`) and an offline/PWA mode are
  documented limitations in the tutorial, not yet intents.
