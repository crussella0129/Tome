# Sprint 24 Research Report

## Intents Reviewed
- [INT-0029](../../../intents/INT-0029-documents-as-tomes.md) — created; relevance: the sprint's target, reading a Markdown file or a Word document as a tome; current state: proposed.
- [INT-0026](../../../intents/INT-0026-document-editor.md) — revised; relevance: the editor this is the first step toward; gained the owner's statement of purpose and order of work; current state: proposed.
- [INT-0030](../../../intents/INT-0030-mathematics-and-code.md) — created; relevance: mathematics, and LaTeX and Typst documents, which the owner placed after this sprint; it takes the equations this sprint reports and does not show; current state: proposed.
- [INT-0031](../../../intents/INT-0031-files-simple-to-find.md) — created; relevance: the owner's wish that finding files be simple; not this sprint's work; current state: proposed.
- [INT-0032](../../../intents/INT-0032-shared-ground-with-mdbook.md) — created; relevance: exploring what Tome repeats of mdBook; not this sprint's work, but it bounds how much new reading of formats this sprint should write; current state: proposed.
- [INT-0027](../../../intents/INT-0027-cruor-typefaces.md) — revised; relevance: gained the owner's second choice for the default themes; not this sprint's work; current state: proposed.
- [INT-0028](../../../intents/INT-0028-themes-as-configuration.md) — revised; relevance: gained settings for each heading level and the large first letter; not this sprint's work; current state: proposed.
- [INT-0023](../../../intents/INT-0023-find-load-and-deploy-books.md) — selected (compatibility boundary); relevance: the manifest, loader and `books:add` this sprint extends, which must keep working for mdBooks; current state: realized.
- [INT-0011](../../../intents/INT-0011-richer-content-rendering.md) — selected (compatibility boundary); relevance: the footnotes a Word document's notes must become; current state: realized.

## 1. Sprint Goal
Let a library entry name a single Markdown file, a single Word document, or
a folder of such documents with no `SUMMARY.md`, and read each as a tome.
A Word document is turned into Markdown, with its images, when the library
is built; from there the reader, the sidebar, the "on this page" rail and
search work as they do for an mdBook. What a Word document holds that Tome
cannot carry over is reported, not dropped in silence. mdBook folders load
exactly as before. Editing, mathematics, Cruor, theme files, the explorer
and the comparison with mdBook are recorded as intents and are not built
in this sprint.

## 2. Existing Code Survey
| File | Relevance | Notes |
|------|-----------|-------|
| scripts/book-source.mjs | high | `resolveBookSource` throws unless a `SUMMARY.md` is found under `src/`, `docs/` or the root; shared by the loader, discovery and live reload. A document or loose folder needs a second kind of source here |
| scripts/load-books.mjs | high | Resolves every entry first, then copies each into a staged library and publishes it atomically, with `book.meta.json`. Conversion belongs in the staging step, so a failed document leaves the old library in place |
| scripts/find-books.mjs | high | `books:add` calls `describe`, which reads `SUMMARY.md`; it must accept a document. `books:find` lists only mdBooks; whether it lists loose documents is INT-0031's question |
| scripts/library-config.mjs | medium | Manifest precedence and owner; the `[[book]]` `path`, `title` and `slug` keys stay as they are |
| scripts/parent-assets.mjs | medium | How referenced images are staged under a reserved directory; the pattern for staging a Word document's images |
| src/lib/book.ts | high | Globs `@library/*/SUMMARY.md` and `book.meta.json`; every tome needs a `SUMMARY.md` in the staged library, so the loader writes one for a document |
| src/lib/summary.ts | medium | Parses the spine; a written `SUMMARY.md` must be in the form it reads |
| src/pages/[...slug].astro | medium | Globs `@library/**/*.md`; a converted document is an ordinary chapter here. Headings at depth 2 and 3 feed the rail |
| src/lib/search-index.ts | medium | Reads each chapter's raw Markdown; converted documents are searched with no change |
| astro.config.mjs | medium | Live reload copies a changed file straight into the library; a changed `.docx` must be converted again, or live reload stays an mdBook feature this sprint |
| src/styles/prose.css | low | Footnote, table and image styles the converted Markdown lands in; no superscript or subscript rule beyond footnote references |
| electron/main.cjs | low | Sandboxed window, no preload: the page has no access to files. Reading at build time needs none; the editor (INT-0026) will |
| src-tauri/src/lib.rs | low | The same: capabilities are `core:default` and `opener:default` only |
| src/lib/__tests__/load-books.test.ts | high | The loader's tests run it against fixture folders with `--dest`; the pattern for the new kinds of entry |
| scripts/check-external-build.mjs | medium | A build gate over a fixture book; a gate for a document fixture follows it |
| fixtures/handbook/ | medium | The fixture convention; a small `.docx` fixture is a binary to commit, and it must be one Tome's own tests can rebuild or explain |
| src/content/books/tome/find-your-books.md | medium | The tutorial chapter that tells a person how to add a book; gains documents |
| package.json | medium | No Word reader and no HTML-to-Markdown step today; `mdast-util-from-markdown` and `unist-util-visit` are already dependencies |
| .github/workflows/ci.yml | low | Runs the unit tests, end-to-end tests and three build gates on Ubuntu; a new gate is one more step |

## 3. External Sources
- [mammoth.js README](https://github.com/mwilliamson/mammoth.js) — converts `.docx` to HTML; lists headings, lists, tables, footnotes and endnotes, images, links, bold, italic, underline, strikethrough, superscript and subscript as supported; says nothing of equations; "Markdown support is deprecated", with HTML and a separate converter recommended; images can be written to files through `convertImage`; "performs no sanitisation of the source document".
- [Pandoc User's Guide](https://pandoc.org/MANUAL.html) — reads `docx`, `latex` and `typst` and writes `gfm` and `docx` (with `--reference-doc` for styles); `--extract-media` writes a document's images to a folder. The part of the manual that would say how Word equations are read was not reached, so that is not claimed here.
- [mdBook: Alternative Backends](https://rust-lang.github.io/mdBook/for_developers/backends.html) — a renderer named under `[output.<name>]` receives "a JSON representation of the book and configuration information" on standard input, with chapters already parsed. The ground for INT-0032.
- [mdBook: Markdown](https://rust-lang.github.io/mdBook/format/markdown.html) — mdBook itself renders footnotes, tables, task lists, strikethrough, definition lists and `> [!NOTE]` admonitions, the last two "enabled by default". Tome's admonition plugin repeats one of these.
- [mdBook: MathJax Support](https://rust-lang.github.io/mdBook/format/mathjax.html) — mathematics is off unless `mathjax-support = true`, and is written `\\( … \\)` and `\\[ … \\]`; "You can't currently use `$$ ... $$` as delimiters". Why INT-0030 does not simply follow mdBook.

## 4. Risks, Unknowns, Dependencies
- **Risk — meaning lost in conversion:** the trial (`docx-conversion-trial.md`)
  showed superscript and subscript flattened (`x²` becomes `x2`), footnotes
  turned into a plain numbered list, tables given an empty header row, and
  underline turned into emphasis. Each needs a rule of its own in the
  HTML-to-Markdown step, and a test.
- **Risk — equations dropped:** the Word reader ignores Office Math and says
  so only in a warning. The build must pass that warning on by document
  name. A paper that is mostly equations reads badly until INT-0030.
- **Risk — unsafe links:** the Word reader does not clean its input, and a
  `javascript:` or `file:` link survived the trial into Markdown. Tome must
  remove such links itself.
- **Risk — a binary fixture:** a `.docx` test fixture is a zip the diff
  cannot show. Either the tests write it (with a development-only package)
  or a small committed file is explained beside it.
- **Risk — two sources of truth for the spine:** a `SUMMARY.md` written by
  the loader must not be mistaken for the owner's. It is written only into
  the staged library, never beside the source.
- **Unknown — how a long document divides.** One chapter per document is the
  simplest reading. A Word paper with a Title and several Heading 1 sections
  then shows two levels of `#` on one page, and the rail lists only depth 2
  and 3. The plan decides how Word's levels map.
- **Unknown — order of a folder's documents.** By file name is stable and
  predictable; the plan states it.
- **Unknown — live reload.** Whether editing a `.docx` or a loose `.md`
  refreshes the reader in `npm run dev`, or that stays an mdBook feature
  for now.
- **Unknown — Word files in the wild.** The trial used a file written by a
  library, not by Word or Google Docs. The fixture for the tests should be
  saved from a real one; the owner can supply a paper, or a Google Docs
  download.
- **Dependency:** `mammoth` (BSD-2-Clause, 1.13.0 on npm), and
  `rehype-parse`, `rehype-remark`, `remark-gfm`, `remark-stringify` (MIT).
  All run at build time; nothing is added to the reader's pages.
- **Dependency — none on Cruor.** This sprint sets no fonts. For the record,
  the Cruor build already holds Cruor Sans Regular, Cruor Lite Regular and
  Cruor Thornamental Regular, each in four styles as WOFF2, which is what
  INT-0027 will take in.

## 5. Recommended Approach
Primary: widen the shared source rules so a path may be an mdBook folder (as
now), a single `.md` or `.docx`, or a folder of them without `SUMMARY.md`.
In the loader's staging step, copy Markdown as it is, convert each Word
document to Markdown with mammoth followed by rehype-remark, write its
images under a reserved directory in the staged tome, and write a
`SUMMARY.md` for the tome there. Add rules for footnotes, table headers,
superscript and subscript, and links; pass the Word reader's warnings to
the build's output by document. Teach `books:add` the new kinds. Cover it
with unit tests of the conversion, loader tests for each kind of entry, a
build gate over a document fixture, and an end-to-end check that a Word
document's chapter, footnote and image show in the reader. Add the
tutorial.

Alternative considered: call pandoc. It reads Word, LaTeX and Typst in one
tool and would serve INT-0030 too. It is not installed on this machine, and
`npm ci` does not bring it, so every person building Tome would have to
install it separately. It stays the
likely answer for LaTeX and Typst documents, to be weighed when INT-0030 is
planned.

Alternative considered: begin with the editor. An editor needs the desktop
app to read and write files for the page, which neither shell allows
today, and it needs the reading built here first.

Rationale: converting to Markdown at build time reuses everything Tome has
and adds nothing to the pages a reader loads. It keeps this sprint to one
outcome the owner can try at its end: add a paper, and read it. The owner
said "to start" of exactly this.

## Artifacts
- `docx-conversion-trial.md` — the conversion tried on a sample Word file: the code, the Markdown it produced, and what each finding asks of the build.
