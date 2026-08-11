Finalized - DO NOT EDIT

# Sprint 2 Build Plan

## Intents
- [INT-0002](../../../intents/INT-0002-load-external-mdbooks.md) — state: planned; acceptance criteria covered: 1 (resolve external SUMMARY + render chapters), 2 (links incl. nested/README resolve), 3 (clear error on invalid book), 4 (bundled sample fallback when unconfigured).

## Schema Tree
- Sprint Goal: render an external mdBook chosen at build time, reusing INT-0001's pipeline
  - Discovery & load
    - T-010: external book loader (`load-book.mjs`)
  - Resolution
    - T-011: real-book title + safe path resolution
  - Proof & docs
    - T-012: external-book fixture + end-to-end build proof + README

## Execution Sequence

### T-010: External book loader (`scripts/load-book.mjs`)
- **Intent:** [INT-0002](../../../intents/INT-0002-load-external-mdbooks.md)
- **Touches:** `scripts/load-book.mjs` (new), `package.json` (`predev`/`prebuild`/`pretest`/`precheck` hooks, chained after `fetch-fonts`), `src/content/book/book.meta.json` (new; committed `{ "title": "Tome" }` for the sample)
- **Depends on:** (none)
- **Acceptance criterion:** criterion 1 (resolve `<root>/<src>/SUMMARY.md` and make its chapters renderable), criterion 3 (clear error on invalid book), criterion 4 (no-op when unconfigured so the bundled sample renders).
- **Success criterion (EARS):**
  - **WHEN** `TOME_BOOK` names a directory whose `<src>/SUMMARY.md` exists, **THEN** `load-book.mjs` **SHALL** clear `src/content/book/`, copy that book's `<src>` tree into it, and write the `book.toml` `title` into `book.meta.json`.
  - **WHEN** `TOME_BOOK` is unset, **THEN** `load-book.mjs` **SHALL** make no changes (the committed sample remains).
  - **WHEN** `TOME_BOOK` names a path lacking `<src>/SUMMARY.md`, **THEN** `load-book.mjs` **SHALL** print a clear error naming the path and exit non-zero.
- **Notes:** `<src>` from `book.toml [book].src` (default `src`) via a tiny two-field extractor (no TOML dependency). Copies `.md` and assets. Keeping `book/` non-empty preserves `book.ts`'s static `?raw`/glob imports for tests and `astro check`. **Per critique C-001**, the destination is overridable (`--dest`/`TOME_BOOK_DEST`, default `src/content/book`) so tests can target a temp dir and never touch the committed sample.

### T-011: Real-book title + safe path resolution
- **Intent:** [INT-0002](../../../intents/INT-0002-load-external-mdbooks.md)
- **Touches:** `src/lib/book.ts` (title from `book.meta.json`, fallback to the SUMMARY heading), `src/lib/paths.ts` (traversal-safe), `src/lib/__tests__/paths.test.ts` (new), `src/lib/__tests__/book.test.ts` (title-from-meta case)
- **Depends on:** T-010
- **Acceptance criterion:** criterion 1 (the external book's real title, from `book.toml`, is shown), criterion 2 (chapter links — including nested paths and folder `README.md` index chapters — resolve to the correct route).
- **Success criterion (EARS):**
  - **WHEN** `book.meta.json` provides a title, **THEN** `bookToc().title` **SHALL** be that title (falling back to the SUMMARY first heading when the meta title is absent).
  - **WHEN** a chapter href is nested (`a/b.md`) or a folder index (`a/README.md`), **THEN** `hrefToSlug` **SHALL** map it to `a/b` / `a` respectively.
  - **WHEN** a chapter href escapes the book root (a leading `../`), **THEN** the resolved slug **SHALL NOT** begin with `..` (no generated route escapes the book).
- **Notes:** nested/README already handled in `paths.ts`; this adds explicit tests and the `..` guard, and switches the title source to the `book.toml`-derived meta.

### T-012: External-book fixture + end-to-end build proof + docs
- **Intent:** [INT-0002](../../../intents/INT-0002-load-external-mdbooks.md)
- **Touches:** `fixtures/handbook/book.toml`, `fixtures/handbook/src/SUMMARY.md`, `fixtures/handbook/src/**` (chapters), `src/lib/__tests__/load-book.test.ts` (new; the loader integration tests + the external-build gate), `README.md`
- **Depends on:** T-010, T-011
- **Acceptance criterion:** criterion 1/2 (an external book renders end to end) and criterion 4 (the default sample is replaced, proving selection).
- **Success criterion (EARS):**
  - **WHEN** the app is built with `TOME_BOOK=fixtures/handbook`, **THEN** the generated routes **SHALL** be the fixture's chapters and the sample's chapters **SHALL** be absent.
- **Notes:** the fixture's `book.toml` `title` differs from its `SUMMARY.md` first heading to prove the title path; the gate runs the real build with the env var and inspects `dist/`. README documents `TOME_BOOK` usage. **Per critique C-001**, the gate must snapshot and restore `src/content/book/` afterward (`git checkout -- src/content/book`) and rebuild default, so the working tree stays clean; the pure loader tests use the temp `--dest` instead of the live dir.
