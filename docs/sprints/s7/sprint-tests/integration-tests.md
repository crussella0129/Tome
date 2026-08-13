# Sprint 7 Integration Tests

- **Tested head:** `a00a30058b4252ee96ba5366d47a140a6888479e`
- **Task commit:** `f635ad10835e474f1238ce544d349ec96affc688`

## `test_ci_yaml_valid`

PyYAML `safe_load` of `.github/workflows/ci.yml` exited **0**. This proves the
edited workflow remains syntactically valid; the named unit test owns the
stronger exact upload-block assertions.

## Canonical build gates

- `node scripts/check-external-build.mjs` → **OK** for the standard handbook
  and config-less docs-book fixtures; the bundled default was restored and
  rebuilt successfully.
- `node scripts/check-multibook.mjs` → **OK** for the two-tome Bibliotheca,
  namespaced routes, and sidebar switcher; the bundled default was restored and
  rebuilt successfully.
- Post-gate `git status --short` contains only the pre-existing untracked
  `.claude/` directory and these Sprint 7 test artifacts. No fixture/content
  residue remains.

## Boundary

Local integration proves workflow syntax, exact action configuration, and all
steps that precede artifact upload. It cannot execute the GitHub-hosted
`actions/upload-artifact` service or prove a downloadable artifact exists; that
is the named remote E2E gate below.
