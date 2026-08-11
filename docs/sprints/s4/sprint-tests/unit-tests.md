# Sprint 4 Unit / Integration Tests

- **Runner:** Vitest 4.1.10
- **Command:** `npx vitest run`
- **Head SHA:** `1f249f509a68387a35c8327e70214c3433396d93`
- **Result:** 35 passed / 0 failed / 35 total (8 files) — all prior tests plus 5 new detection cases (`src/lib/__tests__/load-book.test.ts`).

## T-015 — source + title detection
- `test_source_detect_docs` — a temp book with no `book.toml` and `docs/SUMMARY.md` → the loader detects `docs/` and copies it. (criterion 1)
- `test_source_honor_book_toml_src` — `book.toml` `src = "guide"` with decoy `src/`+`docs/` SUMMARYs → `guide/` wins, decoys ignored. (criterion 2)
- `test_source_declared_missing_errors` — a declared `src="guide"` whose `SUMMARY.md` is missing → non-zero exit, stderr names `src="guide"` (strict honoring, per plan-critique C-001). (criterion 2)
- `test_title_from_dirname` — a book root named `MyBook`, no `book.toml` title → `book.meta.json.title === "MyBook"`. (criterion 3)
- `test_source_none_errors` — no `SUMMARY.md` in `src/`, `docs/`, or root → non-zero exit; stderr lists the candidate paths (`…/src/SUMMARY.md`, `…/docs/SUMMARY.md`). (criterion 4)
- (Retained) `test_load_book_external` / `_noop_when_unset` / `_errors_on_invalid` — the standard `fixtures/handbook` (book.toml + src) still loads (criteria 2/5 backward-compat).

## Real-world smoke (T-015)
`TOME_BOOK=/c/Users/charl/CubiKan node scripts/load-book.mjs` — with **no wrapper** — detected `CubiKan/docs`, copied **132** chapters, and wrote `book.meta.json.title = "CubiKan"` (from the directory name). This is the exact friction the demo hit, now removed.
