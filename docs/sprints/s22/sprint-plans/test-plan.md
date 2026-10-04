Finalized - DO NOT EDIT

# Sprint 22 Test Plan

## Intent Traceability
| Intent | Acceptance criterion | Build task / EARS clause | Verification |
|--------|----------------------|--------------------------|--------------|
| [INT-0022](../../../intents/INT-0022-sanguine-atonement-theme.md) | AC1 selector + dialog, keyboard/touch, focus return | T-055 / Light·Dark switch; Other opens labelled dialog; Escape/Leave return focus; Tab trapped; pre-paint list from `THEMES` | `test_theme_picker_switches_directly`, `test_theme_picker_other_opens_dialog`, `test_riddle_dialog_escape_restores_focus`, `test_riddle_dialog_focus_trap`, `test_init_theme_valid_classes`, E2E `test_theme_selector_reader_and_bibliotheca` |
| [INT-0022](../../../intents/INT-0022-sanguine-atonement-theme.md) | AC2 tolerant matching, refusal, Silence | T-055 / matcher accepted/refused/silence/empty; dialog outcome messages | `test_riddle_accepts_variants`, `test_riddle_refuses_unrelated`, `test_riddle_silence_and_empty`, `test_riddle_dialog_outcomes`, E2E `test_riddle_refused_and_silence_keep_theme` |
| [INT-0022](../../../intents/INT-0022-sanguine-atonement-theme.md) | AC3 transformation + persistence, reduced-motion path, direct exit | T-057 / wash covers then clears ≤3 s; reduced motion → no overlay; first-paint persistence; direct Light/Dark exit | E2E `test_sanguine_wash_and_persistence`, `test_sanguine_reduced_motion_no_wash`, `test_sanguine_exit_direct`; component `test_theme_picker_reduced_motion_skips_wash` |
| [INT-0022](../../../intents/INT-0022-sanguine-atonement-theme.md) | AC4 WCAG per role and surface | T-056 / body ≥5.0, subdued/link ≥4.5 on page/panel/input; darkest heading stop ≥3.0 | `test_sanguine_role_contrast`, existing `test_ink_on_paper_contrast_aa` (iterates `THEMES`) |
| [INT-0022](../../../intents/INT-0022-sanguine-atonement-theme.md) | AC5 obsidian + channels + flourishes; motion off under reduced motion; none in print | T-056 / computed tokens, texture behind content, channel headings, "(sealed)", reduced motion, print, other themes unchanged | E2E `test_sanguine_surface_and_channels`, `test_sanguine_sealed_drafts`, `test_sanguine_reduced_motion_static`, `test_sanguine_print_ink_on_white`, existing `test_paper_theme_active`/`test_dark_theme_active`; human visual sign-off on screenshots |
| [INT-0022](../../../intents/INT-0022-sanguine-atonement-theme.md) | AC6 tablet touch targets, input attributes, theme-color | T-055 / 44×44 at 820×1180; input attrs; meta theme-color per theme | E2E `test_theme_controls_touch_targets`, component `test_riddle_input_attributes`, `test_theme_state_syncs_meta` |
| [INT-0023](../../../intents/INT-0023-find-load-and-deploy-books.md) | AC1 discovery, JSON, no double-listing, skip invalid | T-059 / exact books listed; invalid skipped; JSON schema; symlink/depth bounds | `test_find_books_lists_exact_roots`, `test_find_books_skips_invalid`, `test_find_books_json_schema`, `test_find_books_bounds` |
| [INT-0023](../../../intents/INT-0023-find-load-and-deploy-books.md) | AC2 add + dedupe + precedence; never edit tracked manifest | T-059 / add/no-op/nonzero, tracked manifest byte-identical; T-058 / precedence incl. owner | `test_books_add_appends_and_dedupes`, `test_books_add_rejects_invalid`, `test_manifest_precedence`, `test_owner_follows_manifest` |
| [INT-0023](../../../intents/INT-0023-find-load-and-deploy-books.md) | AC3 clean checkout; sample when unconfigured | T-058 / personal build leaves tracked files clean; default publishes sample byte-equal | `test_loader_publishes_outside_tracked_tree`, `test_loader_default_publishes_sample`, integration `test_personal_build_leaves_checkout_clean` |
| [INT-0023](../../../intents/INT-0023-find-load-and-deploy-books.md) | AC4 copy exclusions, content intact | T-058 / VCS, deps, build dir, target excluded; chapters/assets copied | `test_loader_excludes_vcs_and_build_output` |
| [INT-0023](../../../intents/INT-0023-find-load-and-deploy-books.md) | AC5 existing guarantees | T-058 / Vitest reads sample; Playwright builds sample; gates pass, sample guarded | `test_books_library` (sample under alias), `test_fixture_gate_isolates_environment` (updated), `check:external`/`check:multibook`/`check:search`/`check:livereload`, full Playwright, CI |
| [INT-0023](../../../intents/INT-0023-find-load-and-deploy-books.md) | AC6 tutorial content, commands exist, README link | T-060 / chapters in order; scripts exist; coverage checklist; live-unseal claim matches observation | `test_books_library` (updated chapter order), `test_tutorial_commands_exist`, `test_tutorial_covers_topics`, `test_readme_links_tutorial`, scripted `verify_live_unseal` recorded in e2e-tests.md |

## Unit Tests
### T-055 unit tests
- **Intent:** [INT-0022](../../../intents/INT-0022-sanguine-atonement-theme.md)
- `test_riddle_accepts_variants`: "Sanguine", "Sanguine, my Brother", "sanguine my brother", "Sanguine, my Sister", "SANGUINE!", "Sanguíne", "sanguin", "sangiune" → `accepted`
- `test_riddle_refuses_unrelated`: "red", "blood", "crimson", "sanguine is a colour" → `refused`
- `test_riddle_silence_and_empty`: "Silence, my brother" → `silence`; "  ,. " → `empty`
- `test_theme_state_syncs_meta`: `applyTheme()` sets the body class (only one theme class), storage, and `meta[name=theme-color]`
- `test_init_theme_valid_classes`: the pre-paint list is derived from `THEMES` and includes Sanguine
- Stubs: none (pure functions; jsdom DOM for theme-state)

### T-055/T-057 component tests (Solid + jsdom)
- **Intent:** [INT-0022](../../../intents/INT-0022-sanguine-atonement-theme.md)
- `test_theme_picker_switches_directly`: Light/Dark radios set class + storage; `aria-checked` follows
- `test_theme_picker_other_opens_dialog`: Other opens `role=dialog` (`aria-modal`) titled with the question; answer field focused
- `test_riddle_input_attributes`: autocapitalize/autocorrect off, spellcheck false
- `test_riddle_dialog_outcomes`: accepted → "Welcome home." + Sanguine; refused → "The door does not open." + unchanged; silence → its acknowledgement + unchanged
- `test_riddle_dialog_escape_restores_focus` / `test_riddle_dialog_focus_trap`: Escape and Leave close and refocus Other; Tab wraps inside
- `test_theme_picker_reduced_motion_skips_wash`: with a reduced-motion `matchMedia` stub, acceptance applies Sanguine and creates no wash node
- Stubs: `matchMedia` (reduced motion on/off) — mirrors the browser contract, not the implementation

### T-056 unit tests
- **Intent:** [INT-0022](../../../intents/INT-0022-sanguine-atonement-theme.md)
- `test_sanguine_role_contrast`: text ≥5.0, subdued ≥4.5, link ≥4.5 on page/panel/input **and on the brightest obsidian sheen tone the texture can produce**; pooled `#BA1A1A` heading stop ≥3.0 on page

### T-058 unit/integration tests (node environment, real temp trees)
- **Intent:** [INT-0023](../../../intents/INT-0023-find-load-and-deploy-books.md)
- `test_manifest_precedence`: env book vars > explicit `TOME_CONFIG` > `tome.local.toml` > `tome.config.toml` > sample
- `test_owner_follows_manifest`: owner read from the same resolved manifest
- `test_loader_publishes_outside_tracked_tree`: configured book → library dir populated; sample bytes unchanged
- `test_loader_default_publishes_sample`: empty manifest → library is a byte-equal sample copy
- `test_loader_excludes_vcs_and_build_output`: root-layout book with `.git/`, nested `node_modules/`, root `book/`, custom `build-dir`, root `target/` → excluded; chapters + a referenced image present
- `test_fixture_gate_isolates_environment` (updated): gate destination is the generated library; default load publishes the sample there
- `test_books_library` (alias): `books()` under Vitest returns the committed sample tomes

### T-059 unit/integration tests (spawned CLI, temp trees)
- **Intent:** [INT-0023](../../../intents/INT-0023-find-load-and-deploy-books.md)
- `test_find_books_lists_exact_roots`, `test_find_books_skips_invalid`, `test_find_books_json_schema`, `test_find_books_bounds` (symlink not followed; `--depth` honored)
- `test_books_add_appends_and_dedupes`, `test_books_add_rejects_invalid` (tracked `tome.config.toml` hashed before/after)

### T-060 unit tests
- **Intent:** [INT-0023](../../../intents/INT-0023-find-load-and-deploy-books.md)
- `test_tutorial_commands_exist`: every `npm run <name>` in the three chapters and README section exists in `package.json`
- `test_tutorial_covers_topics`: required topics present (books:find, --json, tome.local.toml, PowerShell, bash, --host, Add to Home Screen, static hosting root path, privacy, offline, sealed)
- `test_readme_links_tutorial`: README links the chapter files and drops the overwrite claim
- `test_books_library` / `test_pager_prev_next` (updated): new chapter order and neighbours

## Integration Tests
### Personal library integration
- **Intents:** [INT-0023](../../../intents/INT-0023-find-load-and-deploy-books.md)
- `test_personal_build_leaves_checkout_clean`: in a disposable git checkout, a `tome.local.toml` book builds; tracked status stays empty and the sample is intact
- Production gates `check:external`, `check:multibook`, `check:search`, `check:livereload` against the generated library (sample guarded)

## End-to-End Tests
- **Status:** possible
- `e2e/theme.spec.ts` (Chromium, built sample):
  - `test_theme_selector_reader_and_bibliotheca`: selector present and operable on `/tome` and `/`; the open dialog's computed background equals the active theme's `--theme-window-background` (paper and dark)
  - `test_riddle_refused_and_silence_keep_theme`: messages shown, class unchanged
  - `test_sanguine_wash_and_persistence`: accepted → wash appears → Sanguine class → wash gone ≤3 s → reload and `/` show Sanguine at `DOMContentLoaded`
  - `test_sanguine_reduced_motion_no_wash`, `test_sanguine_exit_direct`
  - `test_sanguine_surface_and_channels`: computed bg/text tokens, texture layer behind content, heading background-clip text
  - `test_sanguine_sealed_drafts`: "(sealed)" in Sanguine, "(draft)" otherwise
  - `test_sanguine_reduced_motion_static`: no running animations
  - `test_sanguine_print_ink_on_white`: `emulateMedia({ media: 'print' })` → white bg, hidden texture, solid heading fill
  - `test_theme_controls_touch_targets`: 820×1180, every option/dialog control ≥44×44
- `e2e/reader.spec.ts`: `test_dark_theme_active` / `test_reduced_motion_honored` move to the selector; `test_paper_theme_active` unchanged
- `verify_live_unseal` (scripted, recorded): temp copy of a book with a draft entry under `TOME_BOOK=… npm run dev`; link the draft; observe whether the new route serves without restart; the tutorial states the observed behavior
- **Human verification:** screenshots of Bibliotheca, a chapter, the dialog, and mid-wash at 1440×900 and 820×1180 are surfaced for the user's "oh dear" judgment before INT-0022 is marked realized.
