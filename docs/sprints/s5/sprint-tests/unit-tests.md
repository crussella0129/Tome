# Sprint 5 Unit Tests

- **Runner:** Vitest 4.1.10
- **Command:** `npx vitest run`
- **Head SHA:** `2232715f0f768477920356e7be746b58253e83cb`
- **Result:** 37 passed / 0 failed / 37 total (9 files) — all prior tests plus 2 new `book-source` cases; the loader's 8 detection tests are unchanged after the refactor to the shared module (parity / no regression).

## T-017 — shared source module (`src/lib/__tests__/book-source.test.ts`)
- `test_resolve_book_source` — `resolveBookSource(root)` returns `{ sourceDir, title }` per the loader rules: no `book.toml` → detects `docs/` with title from the directory name; a declared `book.toml` src is authoritative (wins over a decoy `docs/`); no `SUMMARY.md` anywhere → throws with an enumerated "Tried:" message. (T-017 clause 1)
- `test_sync_path_copy_and_delete` — `syncPath(<sourceDir>/a/b.md, sourceDir, dest)` writes `dest/a/b.md` with the file's content; a path outside the source returns `null`; deleting the source file then syncing removes `dest/a/b.md`. (T-017 clause 2)
