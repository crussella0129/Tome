# Sprint 2 Integration Tests

- **Head SHA:** `206333c48e40c4db311130515b8a86ad15445864`

## Loader behaviour (`src/lib/__tests__/load-book.test.ts`, Vitest — runs in CI)
- `test_load_book_external` — `load-book.mjs` (subprocess) with `TOME_BOOK=fixtures/handbook` and a temp `--dest` copies `SUMMARY.md`, `first.md`, `section/nested.md`, and writes `book.meta.json.title === "The Sacred Handbook"` (the `book.toml` title) — **pass** (T-010 clause 1 · criterion 1).
- `test_load_book_noop_when_unset` — with `TOME_BOOK` unset, a sentinel file in the temp dest is untouched and no `book.meta.json` is written — **pass** (T-010 clause 2 · criterion 4).
- `test_load_book_errors_on_invalid` — with `TOME_BOOK` at a path lacking `src/SUMMARY.md`, the process exits non-zero and stderr names `SUMMARY.md` — **pass** (T-010 clause 3 · criterion 3).

## External build (`gate_external_build`, local)
- `TOME_BOOK=fixtures/handbook npm run build` — **pass**: `dist/first/` and `dist/section/nested/` (fixture routes) are generated, `dist/getting-started/` (a sample-only route) is **absent**, and the `book.toml` title "The Sacred Handbook" appears in `dist/index.html` (sidebar brand). The sample was then restored cleanly (`git checkout -- src/content/book && git clean -fdq src/content/book` → empty status) and the default rebuilt. (T-012 clause 1 · criteria 1/2/4).
- Note: this full external build runs **locally**; the loader + path logic it exercises is also covered by the CI-run Vitest integration/unit tests above.
