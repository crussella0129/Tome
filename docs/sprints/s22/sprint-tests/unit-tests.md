# Sprint 22 Unit and Component Verification

- **Tested head:** `b222c56` (all of T-055–T-061 committed); full suite run in the
  active workspace with a personal `tome.local.toml` present.
- `npx vitest run`: **27 files, 173 tests passed, 0 skipped**.
- `npx astro check`: **0 errors, 0 warnings, 0 hints**.

## INT-0022 — Sanguine Atonement

| Test | Clause | Result |
|---|---|---|
| `test_riddle_accepts_variants` (11 inputs incl. "Sanguíne", "sanguin", "sangiune") | T-055 matcher accepted | pass |
| `test_riddle_refuses_unrelated` (7 inputs) | T-055 matcher refused | pass |
| `test_riddle_silence_and_empty` | T-055 Silence / empty | pass |
| `test_theme_state_syncs_meta` | T-055 class + storage + theme-color | pass |
| `test_init_theme_valid_classes` | T-055 pre-paint table from `THEMES` | pass |
| `test_theme_picker_switches_directly` | T-055 Light/Dark | pass |
| `test_theme_picker_other_opens_dialog` | T-055 Other → labelled modal, focus | pass |
| `test_riddle_input_attributes` | T-055 / AC6 input attributes | pass |
| `test_riddle_dialog_outcomes` | T-055 refused / Silence / accepted | pass |
| `test_riddle_dialog_escape_restores_focus`, `test_riddle_dialog_focus_trap` | T-055 leave + trap | pass |
| `test_theme_picker_wash_covers_then_clears` | T-057 theme changes under the wash, wash removed | pass |
| `test_theme_picker_reduced_motion_skips_wash` | T-057 reduced motion | pass |
| `test_sanguine_role_contrast` — interface roles ≥ 4.5 on page/panel/input/sheen; accent ≥ 4.5 on its 0.15 tint | T-061 (supersedes T-056 clause 1) | pass |
| `test_sanguine_inscription_contrast` — ink `#d50210` and links ≥ 3.3 on all four grounds; ≥ 24px; hue-true | T-061 / AC4 (revised) | pass (worst 3.31, ink on sheen) |
| pooled `#ba1a1a` ≥ 3.0 on page; token/contract/layer-opacity drift guard | T-056 / T-061 | pass |
| `test_ink_on_paper_contrast_aa` (iterates `THEMES`, now incl. Sanguine's bone interface ink) | existing | pass |

## INT-0023 — find, load, deploy

| Test | Clause | Result |
|---|---|---|
| `test_loader_default_publishes_sample`, precedence "no env and no manifest publishes the sample" | T-058 default | pass |
| `test_manifest_precedence` | T-058 precedence (env > TOME_CONFIG > local > shared; relative paths) | pass |
| `test_owner_follows_manifest` | T-058 owner | pass |
| `test_loader_excludes_vcs_and_build_output` | T-058 / AC4 copy exclusions | pass |
| `test_fixture_gate_isolates_environment` (updated ×2) | T-058 gate publishes into the library | pass |
| `test_books_library`, `test_pager_prev_next` (sample through the Vitest `@library` alias) | T-058 AC5, T-060 order | pass |
| `test_find_books_lists_exact_roots`, `test_find_books_json_schema`, `test_find_books_skips_invalid`, `test_find_books_bounds` | T-059 discovery | pass |
| `test_books_add_appends_and_dedupes`, `test_books_add_rejects_invalid` | T-059 add | pass |
| `test_tutorial_commands_exist`, `test_tutorial_covers_topics`, `test_readme_links_tutorial` | T-060 | pass |
