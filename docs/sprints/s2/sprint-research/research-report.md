# Sprint 2 Research Report

## Intents Reviewed
- [INT-0002](../../../intents/INT-0002-load-external-mdbooks.md) — selected; relevance: this sprint delivers the first slice of loading an external mdBook (criteria 1–4) reusing INT-0001's parser and render pipeline; current state: `proposed` (→ `planned` in Plan). No criteria change.

## 1. Sprint Goal

Let Tome render an **external** mdBook chosen at build time, not only the bundled
sample. Given `TOME_BOOK=<path to an mdBook root>`, Tome reads `<root>/book.toml`
(for `title`/`src`, default `src`), resolves `<root>/<src>/SUMMARY.md`, renders
every non-draft chapter through the existing sacred pipeline, and shows the
book's real title. With `TOME_BOOK` unset it renders the committed sample
unchanged (no regression). An invalid/missing book path fails the build with a
clear, actionable error. This satisfies INT-0002 criteria 1–4.

## 2. Existing Code Survey

| File | Relevance | Notes |
|------|-----------|-------|
| `src/lib/book.ts` | high | Hardcodes the bundled book: `import summaryRaw from '../content/book/SUMMARY.md?raw'`. The title comes from `parseSummary` (SUMMARY's first heading). This is what generalizes. |
| `src/pages/[...slug].astro` | high | `import.meta.glob('../content/book/**/*.md')` + `getStaticPaths` from `chapterRoutes()`. Renders each chapter's `Content`. Works for **any** files present under `src/content/book/` at build. |
| `src/lib/summary.ts` / `paths.ts` | high | Pure parser + href→slug. Reused as-is; `hrefToSlug` already strips `./`, `..` handling to review for path-traversal. |
| `src/content/book/**` | high | The committed sample (SUMMARY + chapters). Becomes the *default* content; the build populates this dir. |
| `package.json` | med | Already has `predev`/`prebuild` (fetch-fonts). The book-load hook chains here (and `pretest`/`precheck` so tests/check see populated content). |
| `src/components/TocSidebar.tsx` (brand) | med | Shows `bookTitle`; will show the external book's `book.toml` title. |
| `.gitignore` | low | Consider whether populated/external content is ignored (design decision — see approach). |

## 3. External Sources

- [mdBook — `book.toml` configuration](https://rust-lang.github.io/mdBook/format/configuration/general.html) — the `[book]` table has `title`, `authors`, `description`, and `src` (default `src`); relative paths resolve from the book root. So an external book's spine is `<root>/<src>/SUMMARY.md` and its title is `book.toml [book].title` (SUMMARY's first heading is often just "Summary", so `book.toml` is the correct title source).
- [mdBook — SUMMARY.md format](https://rust-lang.github.io/mdBook/format/summary.html) — confirms the grammar `parseSummary` already implements (prefix/part/nesting/draft/separator); no parser change expected for real books.

## 4. Risks, Unknowns, Dependencies

- **Risk: path traversal.** A chapter link like `../../etc/x.md` could escape the book. Mitigation: the loader copies only files under `<root>/<src>`, and route generation rejects/normalizes slugs that escape. Add a test with a `..` link.
- **Risk: dirty working tree.** If the build populates the committed `src/content/book/`, running with `TOME_BOOK` set overwrites the sample and shows as git changes. Mitigation: the load hook is a **no-op when `TOME_BOOK` is unset** (sample stays pristine); external loading is a deploy-time action where a dirty tree is expected. Document it.
- **Risk: relative image/asset links** in external chapters (mdBook allows `![](./img.png)`). Core scope is Markdown chapters; copying the whole `<src>` tree preserves assets, but Astro's relative-image handling for arbitrary copied files is an edge case. Mitigation: copy non-`.md` assets alongside; treat full relative-image fidelity as a possible follow-up if it proves finicky.
- **Unknown: title plumbing.** `book.toml` title must reach `bookToc().title`. Simplest: the loader writes a small `book.meta.json` (committed for the sample as `{ "title": "Tome" }`, overwritten for external) that `book.ts` imports.
- **Dependency: a TOML read** for `book.toml`. Node has no built-in TOML parser; a tiny hand-rolled `title =`/`src =` extractor avoids adding a dependency (full TOML parsing is unnecessary for two fields).

## 5. Recommended Approach

Primary: a **prebuild `scripts/load-book.mjs`**. When `TOME_BOOK` is set: read
`<root>/book.toml` (extract `title`, `src`), **validate** `<root>/<src>/SUMMARY.md`
exists (else print a clear error and exit non-zero — criterion 3), clear
`src/content/book/` and copy `<root>/<src>/**` into it, and write
`src/content/book/book.meta.json` with the resolved title. When unset: no-op, so
the committed sample renders (criterion 4). Chain the hook into
`predev`/`prebuild`/`pretest`/`precheck` after `fetch-fonts`. `book.ts` reads the
title from `book.meta.json`; everything downstream (`chapterRoutes`, the glob,
the sidebar, prose) is unchanged — the whole win is that the render pipeline
already works on *whatever* is under `src/content/book/`.

Alternative considered: read external `.md` at build and render via a standalone
Markdown library (remark/marked). Rejected: adds a renderer + re-styling and
diverges from Astro's pipeline; the copy-into-content approach reuses it wholesale.

Rationale: minimal new surface, no new runtime dependency, reuses the parser,
router, and sacred styling; the only genuinely new code is discovery + copy +
validation, each independently testable.

## Artifacts
- Reviewed intent: [INT-0002](../../../intents/INT-0002-load-external-mdbooks.md).
- Prior realized foundation: [INT-0001](../../../intents/INT-0001-tome-ink-on-paper-mdbook-viewer.md) (parser, pipeline, styling reused here).
