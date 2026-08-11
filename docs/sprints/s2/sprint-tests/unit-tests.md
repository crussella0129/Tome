# Sprint 2 Unit Tests

- **Runner:** Vitest 4.1.10 (jsdom)
- **Command:** `npx vitest run`
- **Head SHA:** `206333c48e40c4db311130515b8a86ad15445864`
- **Result:** 30 passed / 0 failed / 30 total (8 files) — includes the integration tests below and all Sprint 0/1 tests.

## T-011 — title + safe paths
- `test_book_title_from_meta` (`src/lib/__tests__/book.test.ts`) — `resolveTitle('External Handbook','Summary')==='External Handbook'`; `resolveTitle(null,'Summary')==='Summary'`; `resolveTitle('','Fallback')==='Fallback'` — **pass** (clause 1)
- `test_paths_nested_and_readme` (`src/lib/__tests__/paths.test.ts`) — `a/b.md`→`a/b`, `a/README.md`→`a`, `README.md`→``, `guide/index.md`→`guide`, anchors dropped — **pass** (clause 2)
- `test_paths_reject_traversal` (`src/lib/__tests__/paths.test.ts`) — `../secret.md`→`secret` (never `..`-prefixed), `a/../b.md`→`b`, `chapterUrl('../secret.md')==='/secret'` — **pass** (clause 3)
