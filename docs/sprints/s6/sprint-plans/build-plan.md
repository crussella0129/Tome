Finalized - DO NOT EDIT

# Sprint 6 Build Plan

## Intents
- [INT-0003](../../../intents/INT-0003-richer-external-book-support.md) — state: active; acceptance criteria covered: 2 (present multiple books + switch — "the Bibliotheca"). This is INT-0003's **last** criterion; on green all three are met → INT-0003 eligible for `realized`.

## Schema Tree
- Sprint Goal: the Bibliotheca — present multiple tomes and switch between them (adaptive: one → root, many → namespaced + library)
  - Content model
    - T-019: multi-book content model + adaptive routing
  - Loader
    - T-020: load-books.mjs + tome.config.toml + env precedence
  - Library UI
    - T-021: Bibliotheca index + sidebar book switcher
  - Proof & docs
    - T-022: multi-book fixtures + end-to-end gate + README

## Execution Sequence

### T-019: Multi-book content model + adaptive routing
- **Intent:** [INT-0003](../../../intents/INT-0003-richer-external-book-support.md)
- **Touches:** migrate `src/content/book/**` → `src/content/books/tome/**`; `src/lib/book.ts`, `src/pages/[...slug].astro`, **`scripts/load-book.mjs` (dest → `src/content/books/<slug>/`)**, `astro.config.mjs` (live-reload dest/watch), `scripts/check-external-build.mjs`, `scripts/check-live-reload.mjs`, `src/lib/__tests__/book.test.ts`
- **Depends on:** (none)
- **Acceptance criterion:** INT-0003 criterion 2 — the content + routing foundation for a multi-tome library, adaptive so a single tome is unchanged.
- **Success criterion (EARS):**
  - **WHEN** `books()` runs, **THEN** it **SHALL** return one entry per directory under `src/content/books/*` as `{ slug, title, toc, routes }`, built from `import.meta.glob('*/SUMMARY.md', {query:'?raw'})` + `*/book.meta.json`.
  - **WHEN** exactly one tome is present, **THEN** chapter routes **SHALL** be `/<chapter>` (root — unchanged); **WHEN** more than one, **THEN** routes **SHALL** be `/<tome>/<chapter>` and `/` **SHALL** be the Bibliotheca.
- **Notes:** reuse `parseSummary`, `hrefToSlug`, `resolveTitle`. `[...slug].astro` `getStaticPaths` branches on tome count and renders a chapter or the Bibliotheca via a prop discriminant. The committed sample migrates to slug `tome`. The live-reload integration + gates move their dest to `src/content/books/<slug>/`. **Per critique C-001**, T-019 also repoints the single-book `load-book.mjs` dest to `src/content/books/<slug>/` so external single-book loading + `check-external-build` stay green *within* T-019 (adaptive → still root `/<chapter>` for one tome); T-020 then generalizes it.

### T-020: load-books.mjs + tome.config.toml + env precedence
- **Intent:** [INT-0003](../../../intents/INT-0003-richer-external-book-support.md)
- **Touches:** `scripts/load-books.mjs` (new — generalizes T-019's single-book `load-book.mjs`), `scripts/book-source.mjs` (reused), `package.json` (`predev`/`prebuild` → `load-books`; add `smol-toml`), `tome.config.toml` (committed, commented example), `src/lib/__tests__/load-books.test.ts`
- **Depends on:** T-019
- **Acceptance criterion:** INT-0003 criterion 2 — specify and load the set of tomes.
- **Success criterion (EARS):**
  - **WHEN** `TOME_BOOKS` (comma) or `TOME_BOOK` (single) env is set, **THEN** it **SHALL** determine the tomes (env wins); else **WHEN** `tome.config.toml` exists, **THEN** its `[[book]]` list **SHALL** be used; else the committed sample **SHALL** remain (no-op).
  - **WHEN** tomes are loaded, **THEN** each **SHALL** be copied into `src/content/books/<slug>/` (slugs deduped deterministically) with a per-tome `book.meta.json`, and an invalid book path **SHALL** error clearly (reuse `resolveBookSource`).
- **Notes:** `smol-toml` parses the manifest (`[[book]]` with `path`, optional `title`/`slug`). Reuse `resolveBookSource` per book. Destination overridable (as `load-book.mjs`) for tests.

### T-021: Bibliotheca index + sidebar book switcher
- **Intent:** [INT-0003](../../../intents/INT-0003-richer-external-book-support.md)
- **Touches:** `src/components/Bibliotheca.astro` (new), `src/components/TocSidebar.tsx`, `src/components/TocSidebar.module.css`, `src/layouts/BookLayout.astro`, `src/components/__tests__/TocSidebar.test.tsx`
- **Depends on:** T-019
- **Acceptance criterion:** INT-0003 criterion 2 — the reader can see the library and switch tomes.
- **Success criterion (EARS):**
  - **WHEN** more than one tome is present, **THEN** the sidebar **SHALL** render a switcher listing every tome (a link to each) with the active tome marked `aria-current`, plus a link to the Bibliotheca; **WHEN** one tome, **THEN** no switcher renders.
  - **WHEN** the Bibliotheca renders, **THEN** it **SHALL** list every tome as a titled link to that tome.
- **Notes:** switcher props are serializable (`books: {slug,title}[]`, `activeBook`); sacred token styling. `BookLayout` passes `books`/`activeBook` and renders the Bibliotheca vs a chapter.

### T-022: Multi-book fixtures + end-to-end gate + docs
- **Intent:** [INT-0003](../../../intents/INT-0003-richer-external-book-support.md)
- **Touches:** `scripts/check-multibook.mjs` (new), `package.json` (`check:multibook`), `README.md`
- **Depends on:** T-019, T-020, T-021
- **Acceptance criterion:** INT-0003 criterion 2 — a real two-tome library renders end to end.
- **Success criterion (EARS):**
  - **WHEN** the app is built with two tomes (`TOME_BOOKS=fixtures/handbook,fixtures/docs-book`), **THEN** the generated routes **SHALL** include both tomes' chapters under `/<tome>/…` and a `/` Bibliotheca listing both tomes; the gate **SHALL** restore `src/content/books/` to HEAD afterward.
- **Notes:** reuse the existing fixtures; gate is idempotent (restore to HEAD on success/failure, per Sprint 4/5). README documents `tome.config.toml`, the env override, adaptive routing, and the Bibliotheca. Kept local (build-level), consistent with the external gate.
