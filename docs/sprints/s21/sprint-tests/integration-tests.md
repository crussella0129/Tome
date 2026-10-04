# Sprint 21 Integration Verification

## T-053 — shared fixture lifecycle

- **Intent:** [INT-0021](../../../intents/INT-0021-safe-consistent-fixture-verification.md), criteria 1–3.
- **Tested source:** `0a080af`; isolated production build HEAD `9e90e33`.
- `test_fixture_gate_refuses_dirty_content`: tracked, staged, untracked, and
  ignored changes survive; action and beforeRestore never run; index unchanged.
- `test_fixture_gate_restores_success` and `test_fixture_gate_restores_failure`:
  async success and sync/async failures restore sample bytes, remove generated
  and ignored fixture files, preserve outside sentinel/generated files.
- `test_fixture_gate_reports_cleanup_failure`: real `.git/index.lock` forces
  restoration failure; standalone failure rejects and simultaneous action
  failure retains both error objects and messages.
- `test_fixture_gate_isolates_environment`: real loader runs prove explicit
  single/multi selection and default no-op despite caller book/manifest/destination
  values; outside destination remains untouched. A real npm default-build
  process invokes the loader and records the committed sample.
- Command and default-build failure tests reject on child exits 23 and 29 and
  restore sample bytes and clean content status.
- beforeRestore tests prove shutdown sees the fixture before restoration;
  shutdown failure preserves fixture data and retains both causes when needed.
- Real guarded default production build in the isolated checkout succeeds:
  **9 pages generated**, sample content restored clean.

## T-054 — migrated CLIs

- **Intent:** [INT-0021](../../../intents/INT-0021-safe-consistent-fixture-verification.md), criteria 1–4.
- `test_fixture_commands_refuse_dirty_content` ×4 (external, multibook, search,
  live reload): each real CLI exits nonzero with "refusing destructive fixture
  sync" against tracked/staged/untracked/ignored personal content; no setup
  script runs; status, index, bytes, and the outside sentinel are unchanged.
- `test_fixture_gate_reports_build_failure`: the real multibook CLI passes its
  fixture assertions, then its final default rebuild exits 37; the command exits
  nonzero, the final build observed the restored sample, and content is clean.
- `test_live_reload_stops_before_restore_on_failure`: a real background server
  serves the original chapter, the parent-asset assertion fails, `astro dev stop`
  runs while the fixture and temp book still exist, the pid is dead, then the
  sample is restored and the `tome-lr-*` temp directory is removed.

## T-054 — production gates (isolated worktree)

Run serially in a detached `git worktree` of `9e90e33` carrying only the T-054
files, with `node_modules` junctioned and fonts copied. The active workspace and
its personal library were never built, restored, or cleaned.

| Gate | Result | Content after |
|---|---|---|
| `npm run check:external` | PASS — handbook + docs-book, Chromium **3 passed** | clean |
| `npm run check:multibook` | PASS — two-tome routes, Bibliotheca, switcher | clean |
| `npm run check:search` | PASS — single + namespaced index, queries resolve | clean |
| `npm run check:livereload` | PASS — live edit + parent image; owned dev pid stopped | clean |
