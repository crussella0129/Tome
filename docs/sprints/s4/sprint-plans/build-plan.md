Finalized - DO NOT EDIT

# Sprint 4 Build Plan

## Intents
- [INT-0004](../../../intents/INT-0004-flexible-book-source-detection.md) — state: planned; acceptance criteria covered: 1 (auto-detect source: src → docs → root), 2 (honor `book.toml` src), 3 (title from directory name), 4 (enumerated error when no SUMMARY), 5 (no regression). On green, all five are met → INT-0004 eligible for `realized`.

## Schema Tree
- Sprint Goal: load books without a `book.toml` (CubiKan-shaped) directly, by auto-detecting source + title
  - Detection
    - T-015: source + title detection in `load-book.mjs`
  - Proof & docs
    - T-016: docs-layout fixture + end-to-end gate + README

## Execution Sequence

### T-015: Source + title detection in `load-book.mjs`
- **Intent:** [INT-0004](../../../intents/INT-0004-flexible-book-source-detection.md)
- **Touches:** `scripts/load-book.mjs`, `src/lib/__tests__/load-book.test.ts`
- **Depends on:** (none)
- **Acceptance criterion:** INT-0004 criteria 1 (auto-detect source), 2 (honor `book.toml` src), 3 (title from directory name), 4 (enumerated error).
- **Success criterion (EARS):**
  - **WHEN** a book root has no `book.toml` and its `SUMMARY.md` is in `docs/`, **THEN** `load-book.mjs` **SHALL** detect `docs/` as the source and populate `src/content/book/` from it.
  - **WHEN** a `book.toml` declares `src`, **THEN** `load-book.mjs` **SHALL** use that `src` (honored over the `src`/`docs`/root defaults).
  - **WHEN** `book.toml` has no title (or is absent), **THEN** the written `book.meta.json` title **SHALL** be the root directory's basename.
  - **WHEN** no `SUMMARY.md` exists in any candidate (`src/`, `docs/`, root), **THEN** `load-book.mjs` **SHALL** exit non-zero with an error listing the candidate locations tried.
- **Notes (incl. critique C-001):** `resolveSource(root, tomlSrc)` — **a declared `book.toml` `src` is authoritative**: when `book.toml` declares `src`, use exactly `<root>/<src>` and error if its `SUMMARY.md` is missing (naming that path). **Only when `book.toml` is absent or declares no `src`** does auto-detection apply, returning the first of `src/` → `docs/` → `.` (root) that contains `SUMMARY.md` (root last, to avoid over-copying a whole project). Normalize the root (strip trailing separators) before `basename`; if basename is empty, leave the meta title null so `book.ts`'s `resolveTitle` falls back to the SUMMARY heading. Copying stays scoped to the detected source dir. Tests build tiny temp book roots via `mkdtemp` for each case (`docs/`, `src`-declared, declared-but-missing → error, no-toml, none) — no committed fixture needed here.

### T-016: Docs-layout fixture + end-to-end gate + docs
- **Intent:** [INT-0004](../../../intents/INT-0004-flexible-book-source-detection.md)
- **Touches:** `fixtures/docs-book/docs/SUMMARY.md`, `fixtures/docs-book/docs/**` (chapters; **no** `book.toml`), `scripts/check-external-build.mjs`, `README.md`
- **Depends on:** T-015
- **Acceptance criterion:** INT-0004 criterion 1 (a config-less docs-layout book renders end to end) and criterion 5 (the standard `fixtures/handbook` still builds — no regression).
- **Success criterion (EARS):**
  - **WHEN** the app is built with `TOME_BOOK=fixtures/docs-book` (no `book.toml`), **THEN** it **SHALL** render that book's chapters (detecting `docs/`) with the title taken from the directory name (`docs-book`).
- **Notes (incl. critique C-002):** extend `check-external-build.mjs` to build **both** `fixtures/handbook` (regression) and `fixtures/docs-book` (detection), asserting each renders. Restore `src/content/book/` to HEAD (`git checkout` + `git clean`) **after each** book, and on any assertion failure (`fail()` already restores before exiting) — so the gate is idempotent and leaves the tree at HEAD regardless of outcome. README gains a short "books without a `book.toml`" note documenting the strict declared-`src` rule + the `src → docs → root` auto-detection order and the directory-name title fallback.
