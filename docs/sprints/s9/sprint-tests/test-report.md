# Sprint 9 Test Report

## Intent Verification

| Intent | Acceptance criterion | EARS / tests | Result | Intent evidence update |
|--------|----------------------|---------------|--------|------------------------|
| [INT-0007](../../../intents/INT-0007-parent-relative-external-assets.md) | 1 — copy only referenced in-root parent assets and rewrite only concrete root/nested inline-image destinations | T-206 referenced-copy clause / `test_image_destination_token_offsets`, `test_prepare_parent_asset_rewrites_root_and_nested`, `test_load_books_parent_asset`, `gate_external_parent_asset_optimized` | pass | Exact token slices, byte preservation, unreferenced decoy absence, real-loader output, and generated route evidence recorded; eligible for realized after completion evidence |
| [INT-0007](../../../intents/INT-0007-parent-relative-external-assets.md) | 2 — invalid targets fail clearly before replacement and clean all staging | T-206 invalid-target clause / `test_parent_asset_errors_are_atomic_across_tomes`, `test_parent_asset_rejects_symlink_escape` | pass | Six later-tome failure classes plus physical symlink escape prove named rejection, old-destination retention, earlier-tome non-publication, and stage cleanup; eligible for realized after completion evidence |
| [INT-0007](../../../intents/INT-0007-parent-relative-external-assets.md) | 3 — preserve non-target/source behavior, platform safety, and tome isolation | T-206 preservation clause / `test_prepare_parent_asset_preserves_non_targets`, `test_parent_asset_cross_platform_paths`, `test_declared_source_outside_root`, `test_load_books_parent_asset_isolation` | pass | Byte identity, POSIX/Windows containment, authoritative external/symlinked sources, root confinement, and distinct per-tome bytes recorded; eligible for realized after completion evidence |
| [INT-0007](../../../intents/INT-0007-parent-relative-external-assets.md) | 4 — both image classes optimize and Chromium decodes/styles the parent image | T-206 browser/output clause / `gate_external_parent_asset_optimized`, `test_external_relative_image_loads`, `test_external_parent_relative_image_loads` | pass | Both non-empty hashed outputs, visible decode, positive dimensions, optimized current URL, and sacred-prose border recorded locally and on hosted Linux; eligible for realized after completion evidence |
| [INT-0007](../../../intents/INT-0007-parent-relative-external-assets.md) | Regression boundary — no application, island, report, cleanup, or routing regression | T-206 canonical-gates clause / `gate_neutronium_audit`, `gate_astro_check`, `gate_unit_suite`, `gate_reader_e2e`, `gate_external_build`, `gate_multibook` | pass | All named local gates and every matching hosted CI step passed at the authoritative head; eligible for realized after completion evidence |

## Summary

- Focused parent-asset/loader tests: 30 passed / 0 failed / 30 total across 2 files.
- Unit and component regression suite: 64 passed / 0 failed / 64 total across 10 files.
- Integration gates: external fixture/build/restoration and multi-book/default restoration both passed locally and in hosted CI.
- E2E tests: 11 passed / 0 failed / 11 total locally (8 bundled-reader plus 3 external-book); the same browser paths passed in hosted CI.
- Static checks: Astro reported 0 errors / 0 warnings / 0 hints across 38 files; Animus Neutronium passed with two reviewed pre-existing data-transform warnings.
- CI status: green.

## CI Confirmation

- **Head SHA:** `777f6fe160bc7d111bbf8c99fca93e48004f9ee2`
- **CI run:** [31740605981](https://github.com/crussella0129/Tome/actions/runs/31740605981)
- **Conclusion:** success
- **Confirmations:** hosted `verify` job `94582776775` passed in 1m12s. Astro diagnostics were clean; Vitest passed 64/64; ordinary Playwright passed 8/8; the external gate named and passed all three browser tests, emitted the optimized parent plate, validated both fixture cases, restored the sample, and rebuilt the default; the multi-book/default gate passed; and report artifact `9196934394` was uploaded successfully through `actions/upload-artifact@v7`.

## Failures

None. A preliminary local browser run was invalidated by intentionally
concurrent fixture mutation during gate orchestration; it was not treated as
product evidence. All shared-state gates were then serialized at the final head
and passed with pristine restoration.

## Technical Debt Identified

None introduced by Sprint 9. Backlog T-208 remains an unrelated theme-hydration
test hardening task.

## Coverage Observations

The proof spans maintained CommonMark tokenization, real temporary files and
links, cross-platform lexical containment, physical `realpath` confinement,
later-tome failure cleanup, rollback-safe publication, production Astro asset
optimization, and semantic Chromium decode/style assertions. Physical symlink
escape rejection and loader publication cleanup are proven compositionally
through their shared throw/finally path, matching the locked plan. The
referenced-only claim is guarded at both the preparation and real-loader layers
with unreferenced decoys, closing the sole gap found by the pre-critique audit.
