# Sprint 4 Integration Tests

- **Head SHA:** `1f249f509a68387a35c8327e70214c3433396d93`

## External build gate (`scripts/check-external-build.mjs`, extended — local + CI)
- `check_external_build` — **pass** for both books, `src/content/book/` restored to HEAD after each (tree clean; per plan-critique C-002):
  - **handbook** (standard `book.toml` + `src/`): `dist/first/` present, `dist/getting-started/` absent, relative image optimized to `/_astro/plate.<hash>.svg` — the criterion-5 regression case.
  - **docs-book** (config-less, no `book.toml`, `docs/` layout): `dist/overview/` and nested `dist/details/deep/` present (detected `docs/`), `dist/getting-started/` absent, and the directory-name title `docs-book` in the sidebar — INT-0004 criterion 1 end to end.

The loader detection unit tests (`test_source_*`) also run in CI via Vitest.
