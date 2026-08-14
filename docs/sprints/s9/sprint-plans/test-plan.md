Finalized - DO NOT EDIT

# Sprint 9 Test Plan

## Intent Traceability

| Intent | Acceptance criterion | Build task / EARS clause | Verification |
|--------|----------------------|--------------------------|--------------|
| [INT-0007](../../../intents/INT-0007-parent-relative-external-assets.md) | 1 — copy only a referenced root-sibling file and rewrite only its concrete inline-image destination | T-206 / WHEN a local inline image is inside book root but outside source, THEN preparation SHALL privately copy and token-positionally rewrite it for root or nested chapters | `test_image_destination_token_offsets`, `test_prepare_parent_asset_rewrites_root_and_nested`, `test_load_books_parent_asset` |
| [INT-0007](../../../intents/INT-0007-parent-relative-external-assets.md) | 2 — invalid targets fail before destination replacement and all staging is cleaned | T-206 / IF any tome has an invalid target, THEN loader SHALL identify it, leave destination untouched, and remove earlier-tome staging | `test_parent_asset_errors_are_atomic_across_tomes`, `test_parent_asset_rejects_symlink_escape` |
| [INT-0007](../../../intents/INT-0007-parent-relative-external-assets.md) | 3 — preserve non-target behavior, authoritative external sources, platform containment, and tome isolation | T-206 / WHEN syntax is non-target, source is external, platform paths differ, or tomes share names, THEN preparation SHALL preserve, confine, normalize, or isolate it | `test_prepare_parent_asset_preserves_non_targets`, `test_parent_asset_cross_platform_paths`, `test_declared_source_outside_root`, `test_load_books_parent_asset_isolation` |
| [INT-0007](../../../intents/INT-0007-parent-relative-external-assets.md) | 4 — both relative-image classes optimize; parent image visibly decodes and is styled | T-206 / WHEN handbook builds and opens in Chromium, THEN both SHALL emit optimized URLs and the parent image SHALL decode/style | `gate_external_parent_asset_optimized`, `test_external_parent_relative_image_loads` |
| [INT-0007](../../../intents/INT-0007-parent-relative-external-assets.md) | Regression boundary — no application, island, report, cleanup, or routing regression | T-206 / WHEN change set is verified, THEN all canonical quality gates SHALL pass | `gate_neutronium_audit`, `gate_astro_check`, `gate_unit_suite`, `gate_reader_e2e`, `gate_external_build`, `gate_multibook` |

## Unit Tests

### T-206 Markdown and containment tests
- **Intent:** [INT-0007](../../../intents/INT-0007-parent-relative-external-assets.md)
- `test_image_destination_token_offsets`: actual inline image nodes with bare and angle-bracket destinations, escaped parentheses, titles, query/fragments, and multibyte text before them yield exact destination-only offsets; ordinary links, image references, fenced code, and inline code yield no rewritable span.
- `test_prepare_parent_asset_rewrites_root_and_nested`: temp `src/first.md → ../assets/plate.svg` and `src/guide/deep.md → ../../assets/plate.svg` become distinct correct forward-slash relative URLs to one tome-private copy; all bytes outside each concrete destination token remain unchanged.
- `test_prepare_parent_asset_preserves_non_targets`: in-source `./img/x.svg`, nested in-source `../img/x.svg`, HTTP/data/root URLs, ordinary links, reference images, escaped examples, and fenced/inline code remain unchanged and copy no parent assets.
- `test_parent_asset_errors_are_atomic_across_tomes`: parameterized missing, directory, reserved-directory collision, malformed-percent, and lexical outside-root cases place the failure in tome two after tome one stages successfully; each nonzero error names the source chapter and URL, preserves a pre-existing destination sentinel, and leaves no sibling stage directory.
- `test_parent_asset_rejects_symlink_escape`: where the platform permits symlinks, an in-root link to an outside file is rejected before mutation; otherwise record a platform skip while lexical containment remains mandatory.
- `test_parent_asset_cross_platform_paths`: pure `path.posix`/`path.win32` containment cases reject `..`, absolute/cross-drive relative results and accept descendants; generated Markdown URLs use `/` even for simulated Windows separators.
- `test_declared_source_outside_root`: an authoritative `book.toml src="../shared"` (and, where permitted, a symlinked source) retains in-source images and can rehome only a target independently proven inside the configured book root; a target outside the root is rejected without changing the destination.
- `test_load_books_parent_asset`: the real loader copies a root-sibling image beneath the owning staged tome, rewrites only the destination, writes metadata, and removes staging afterward.
- `test_load_books_parent_asset_isolation`: two configured temp tomes with the same parent asset path and distinct bytes produce separate slug-private files and rewrites.
- Stubs: real temporary directories and files; no filesystem mocks. Existing loader environment sanitization remains in use.

## Integration Tests

### External build and regression gates
- **Intents:** [INT-0007](../../../intents/INT-0007-parent-relative-external-assets.md), [INT-0003](../../../intents/INT-0003-richer-external-book-support.md), [INT-0004](../../../intents/INT-0004-flexible-book-source-detection.md) (realized regression only)
- `gate_external_parent_asset_optimized`: `node scripts/check-external-build.mjs` requires the handbook's existing `./img/plate.svg` and genuine `../assets/parent-plate.svg` to become distinct hashed `/_astro/` URLs whose emitted files exist; it retains strict per-case restoration and final default rebuild.
- `gate_external_build`: the complete handbook and docs-book external gate passes serially and leaves `src/content/books/` pristine.
- `gate_multibook`: the two-tome Bibliotheca/namespaced-route gate passes and restores the default build, exercising staging for multiple configured tomes without parent assets.
- `gate_neutronium_audit`: `bash /tmp/Animus_Neutronium/scripts/audit.sh src/` reports no violations; because T-206 changes a front-end E2E spec but no UI implementation, its judgment audit confirms no design, island, or hydration contract changed.
- `gate_astro_check`: `npx astro check` reports 0 errors, warnings, and hints.
- `gate_unit_suite`: canonical Vitest passes, including all new temp-filesystem cases.

## End-to-End Tests

- **Status:** possible
- `test_external_parent_relative_image_loads`: external Chromium opens `/first`, locates the uniquely named parent plate within main prose, awaits `decode()`, and requires visibility, `complete`, positive `naturalWidth`, a hashed `/_astro/` current URL, and positive computed border width.
- `gate_reader_e2e`: canonical ordinary Playwright remains its bundled-reader-only suite and passes without consuming the external spec or report directory.
- Hosted checkpoint: the existing CI `External book build gate` step must name and pass all external browser tests on the exact task-evidence SHA; type/unit, ordinary E2E, multi-book, and upload steps must also conclude success.
