Finalized - DO NOT EDIT

# Sprint 24 Build Plan

Approved by the user on 2026-11-23 (Plan Mode approval of the Sprint 24 plan).
Revised the same day to answer the first plan review (`critique-round-1.md`)
and the second (`critique.md`); the revisions keep the approved outcome and
scope, and split three tasks so each has one outcome.

## Intents
- [INT-0029](../../../intents/INT-0029-documents-as-tomes.md) — state: planned; acceptance criteria covered: 1–8.
- [INT-0023](../../../intents/INT-0023-find-load-and-deploy-books.md) — realized compatibility boundary: the manifest, loader and `books:add` keep every existing behaviour for mdBook folders. No state change.
- [INT-0011](../../../intents/INT-0011-richer-content-rendering.md) — realized compatibility boundary: a Word document's notes become the footnotes this intent styled. No state change.
- [INT-0009](../../../intents/INT-0009-live-reload-parent-assets.md) — realized compatibility boundary: live reload is unchanged for mdBook folders and is not extended to documents. No state change.
- [INT-0008](../../../intents/INT-0008-in-book-search.md) — realized compatibility boundary: T-067 changes what search text is taken from a chapter that holds HTML. No state change.

## Schema Tree
- Sprint Goal: read a Markdown file, a Word document, or a folder of them as a tome
  - Recognizing sources
    - T-065: document and folder sources, their order, staged names and the written spine
  - Conversion
    - T-066: a Word document to Markdown
    - T-067: search text without HTML tags
    - T-068: one document made ready for the library
  - The library
    - T-069: the loader publishes documents
    - T-070: the first chapter at `/` for a lone tome with no opening page
    - T-071: `books:add` for documents
    - T-072: the dev server says live reload is off for documents
  - Proof and words
    - T-073: a build gate and browser check
    - T-074: the tutorial

## Execution Sequence

### T-065: Recognize a Markdown file, a Word document, or a folder of them as a source, and write its spine
- **Intent:** [INT-0029](../../../intents/INT-0029-documents-as-tomes.md)
- **Touches:** `scripts/document-source.mjs` (new), `src/lib/__tests__/document-source.test.ts` (new)
- **Depends on:** (none)
- **Acceptance criterion:** INT-0029 AC1 (kinds of entry, refusal message), AC2 (order, opening page).
- **Success criterion (EARS):**
  - **WHEN** `resolveSource()` is given a folder that holds a `book.toml`, or a `SUMMARY.md` at `src/`, `docs/` or its root, **THEN** it **SHALL** call `resolveBookSource()` and return kind `book` with exactly that function's fields, and **SHALL** let that function's error through unchanged (a `book.toml` with no spine, or one that declares a missing `src`, is an error and is never read as loose documents).
  - **WHEN** `resolveSource()` is given a `.md` or a `.docx` file (extension matched without regard to case), **THEN** it **SHALL** return kind `document` with the file's absolute path, its format (`markdown` or `word`), its folder as the root, and a slug that is `slugify()` of the file name without its extension.
  - **WHEN** `resolveSource()` is given any other folder that holds at least one `.md` or `.docx` at any depth, **THEN** it **SHALL** return kind `folder` with the folder name as title, its slug, and its documents; it **SHALL NOT** descend into a dot-folder, `.git`, `.hg`, `.svn`, `node_modules`, `target`, `dist`, `vendor`, `__pycache__`, `venv`, `site-packages`, or a subfolder that is itself a book by the first clause's test (it holds a `book.toml`, or a `SUMMARY.md` at its root, `src/` or `docs/`); it **SHALL NOT** follow symbolic links; and it **SHALL** leave out Word's lock files (`~$…`).
  - **WHEN** `resolveSource()` is given a folder with no documents, or a path that does not exist and does not end in `.md` or `.docx`, **THEN** it **SHALL** throw `resolveBookSource()`'s own message for that path (which names `SUMMARY.md` and lists what was tried) followed by a sentence saying a `.md` file, a `.docx` file, or a folder of them is also accepted; **WHEN** it is given a path ending in `.md` or `.docx` that does not exist, **THEN** it **SHALL** throw a message saying that file was not found, with the path; **WHEN** it is given a file of another type (`.doc`, `.txt`, `.pdf`), **THEN** it **SHALL** throw a message that contains the path and names the four accepted kinds, `SUMMARY.md` among the words.
  - **WHEN** a folder's documents are ordered, **THEN** the documents directly in the folder **SHALL** come before every subfolder's; a `README.md` or `index.md` directly in the folder (README winning when both exist) **SHALL** be first and marked as the opening page; and elsewhere the order **SHALL** be by path, without regard to case, with runs of digits compared as numbers (`2-b.md` before `10-a.md`).
  - **WHEN** staged names are assigned, **THEN** the opening page **SHALL** be `README.md`; every other document **SHALL** be its path with each segment slugified and the extension `.md`; a name whose last segment would be `readme`, `index` or `summary`, or that an earlier document already took, **SHALL** take the suffix `-2`, `-3`, … in order; and so no two documents **SHALL** share a route under `hrefToSlug()`.
  - **WHEN** `writeSpine()` is given a tome title and ordered chapters, **THEN** `parseSummary()` of its output **SHALL** return that title, the opening page as a prefix chapter, the folder's own documents as numbered chapters, and one part title per top-level subfolder followed by that subfolder's documents, with every href equal to the staged name; and in a link's text `[` **SHALL** be written as `(` and `]` as `)`, so a chapter titled `Notes [draft]` is listed as `Notes (draft)`.
- **Notes:** `resolveBookSource`, `slugify` and `exists` come from `scripts/book-source.mjs` unchanged. The module is plain `.mjs` and does not import `src/lib/paths.ts`: it reserves the three names itself, and the test (Vitest, which reads TypeScript) proves the result with the real `hrefToSlug()` and `parseSummary()`. No file is read for its content here; a chapter's title is supplied by the caller (T-068). New test files that touch the file system start with `// @vitest-environment node`, as the existing CLI tests do.

### T-066: Convert a Word document to Markdown that keeps its meaning
- **Intent:** [INT-0029](../../../intents/INT-0029-documents-as-tomes.md)
- **Touches:** `scripts/docx-to-markdown.mjs` (new), `package.json` and `package-lock.json` (add `mammoth`, `jszip`, `unified`, `rehype-parse`, `rehype-remark`, `remark-gfm`, `remark-stringify`), `fixtures/word/paper/` (new: the XML parts of a Word file and its image), `fixtures/word/build-docx.mjs` (new), `src/lib/__tests__/docx-to-markdown.test.ts` (new)
- **Depends on:** (none)
- **Acceptance criterion:** INT-0029 AC3 (what the reader shows), AC4 (marks and the list of what was left out), AC5 (links), AC6 (source untouched), AC8 (a Word fixture kept in the repository).
- **Success criterion (EARS):**
  - **WHEN** `buildDocx()` is given the folder of parts, **THEN** it **SHALL** return the bytes of a zip whose entries are exactly the folder's files under forward-slash names, which `convertDocx()` opens without error.
  - **WHEN** `convertDocx()` converts the fixture, **THEN** its Markdown **SHALL** contain the paragraph text, `**bold**`, emphasis, `~~strikethrough~~`, a bulleted and a numbered list, and working `https:` and `mailto:` links; and underlined text **SHALL** appear as plain words with no markup of its own.
  - **WHEN** a document has a Title paragraph, **THEN** the Markdown **SHALL** have exactly one level-1 heading, the Title, every other heading **SHALL** be one level below its Word level (Heading 1 at `##`), a heading that would pass level 6 **SHALL** stay at level 6, and the returned title **SHALL** be the Title.
  - **WHEN** a document has no Title and exactly one Heading 1, **THEN** heading levels **SHALL** be unchanged and the returned title **SHALL** be that heading's text; **WHEN** it has no Title and no Heading 1, **THEN** a level-1 heading of the fallback name the caller gave **SHALL** be added first, other levels **SHALL** be unchanged, and the returned title **SHALL** be the fallback; **WHEN** it has no Title and several Heading 1, **THEN** that heading **SHALL** be added first, every heading of the document **SHALL** move one level down (capped at 6), and the returned title **SHALL** be the fallback.
  - **WHEN** a document has a footnote or an endnote, **THEN** the Markdown **SHALL** hold a `[^n]` reference where the note was cited, not wrapped in `<sup>`, and a `[^n]:` definition with the note's text, with footnotes and endnotes numbered apart from each other; and it **SHALL NOT** hold the Word reader's numbered list of notes or its "↑" links.
  - **WHEN** a document has a table, **THEN** the Markdown table's header row **SHALL** be the table's first row, and no empty header row **SHALL** be written.
  - **WHEN** a run is superscript or subscript and is not a note's reference, **THEN** the Markdown **SHALL** hold it inside `<sup>` or `<sub>` (so `x<sup>2</sup>`, never `x2`).
  - **WHEN** a link's target is not `http:`, `https:` or `mailto:` (a `javascript:` or `file:` address, a bookmark within the document), **THEN** the Markdown **SHALL** hold the link's text and no link.
  - **WHEN** a mark is written (`[equation not shown]`, `[figure not shown]`, `[image not shown]`), **THEN** it **SHALL** be literal text in the Markdown, its brackets escaped as the Markdown writer escapes them, so that the chapter reads the mark exactly and it can never form a link.
  - **WHEN** a document holds an equation (Office Math, within a line or on its own), **THEN** the chapter's text **SHALL** read `[equation not shown]` in its place, the text on both sides **SHALL** be kept, and the returned list of what was left out **SHALL** hold one entry of kind `equation` with their count.
  - **WHEN** a document holds a chart or a SmartArt diagram (a drawing whose graphic is of the chart or the diagram kind), **THEN** the chapter's text **SHALL** read `[figure not shown]` in its place and the list **SHALL** hold one entry of kind `figure` with their count; a drawing that holds a picture or a text box **SHALL** be left to the Word reader.
  - **WHEN** a document holds a PNG, JPEG, GIF or WebP image, **THEN** `convertDocx()` **SHALL** return its bytes under a name unique within the document, and the Markdown **SHALL** reference that name beneath the media path the caller gave; **WHEN** it holds an image of another kind, **THEN** the chapter's text **SHALL** read `[image not shown]` and the list **SHALL** hold an entry of kind `image` naming its type.
  - **WHEN** the Word reader reports an element it did not recognise, other than an equation, **THEN** the list **SHALL** hold an entry of kind `other` with the reader's message; **WHEN** the reader reports a paragraph or run style it has no mapping for, **THEN** the list **SHALL NOT** hold it (the text is kept; nothing is left out).
  - **WHEN** `convertDocx()` returns or throws, **THEN** the source file's bytes **SHALL** be unchanged and no file **SHALL** have been written anywhere; a file that is not a Word document **SHALL** throw an error naming it.
- **Notes:** `mammoth.convertToHtml` with a style map for Title, then `rehype-parse` → `rehype-remark` with handlers for the rules above → `remark-gfm` → `remark-stringify`. The footnote rule runs before the superscript rule, since the reader wraps a note's reference in `<sup>`. Equations, charts and diagrams are replaced in the document's XML before the reader sees it (`jszip` opens the file in memory; the reader takes a buffer), because the reader drops them without a place-holder; this was tried for equations in a scratch folder on the fixture's parts and gave two marks with the surrounding text kept. A test with a drawing that is a plain shape records what the reader does with one, so the intent's consequence about shapes rests on what was seen. If the owner has given a real paper by the time this task passes, `convertDocx()` is run on it then and the result recorded in `sprint-tests/integration-tests.md`, so a fault shows during the build and not after it. The fixture is kept as XML parts so a diff shows it; variants (no Title, several Heading 1, Heading 6, an EMF image, an unrecognised element) are made in the test by changing the parts in memory. Evidence for each rule: `../sprint-research/docx-conversion-trial.md`.

### T-067: Leave HTML tags out of a chapter's search text
- **Intent:** [INT-0029](../../../intents/INT-0029-documents-as-tomes.md)
- **Touches:** `src/lib/search-index.ts`, `src/lib/__tests__/search-index.test.ts`
- **Depends on:** (none)
- **Acceptance criterion:** INT-0029 AC1 (a document's chapter is searched like any other), AC7 (an mdBook's chapters still index their words).
- **Success criterion (EARS):**
  - **WHEN** `parseChapter()` reads Markdown that holds HTML tags within a line or as a block, **THEN** its text **SHALL** hold every word that stood between the tags and no `<` or `>` from a tag.
  - **WHEN** a heading holds HTML tags (`## Washing in H<sub>2</sub>O`), **THEN** the heading's text **SHALL** be its words without the tags (`Washing in H2O`) and its slug **SHALL** be the slug of those words (`washing-in-h2o`), which is the `id` the built page gives that heading.
  - **WHEN** `parseChapter()` reads Markdown with no HTML, **THEN** its text and headings **SHALL** be exactly what they were before this sprint (the existing `search-index.test.ts` cases pass unedited).
- **Notes:** Needed because T-066 writes `<sup>` and `<sub>`. It also applies to an mdBook chapter that holds HTML, where tags are indexed as words today; that is a correction, and the second clause holds everything else still.

### T-068: Make one document ready for the library
- **Intent:** [INT-0029](../../../intents/INT-0029-documents-as-tomes.md)
- **Touches:** `scripts/document-stage.mjs` (new), `src/lib/__tests__/document-stage.test.ts` (new)
- **Depends on:** T-066
- **Acceptance criterion:** INT-0029 AC2 (titles), AC3 (images staged), AC4 (marks and reports for images), AC6 (sources untouched).
- **Success criterion (EARS):**
  - **WHEN** `prepareDocument()` is given a Markdown document, **THEN** it **SHALL** return the document's text unchanged apart from the rules below, and a title that is its first level-1 heading, else the `title` of its front matter, else its file name without the extension.
  - **WHEN** a Markdown document opens with a YAML front matter block, **THEN** the returned text **SHALL NOT** hold the block, whether or not the YAML is well formed.
  - **WHEN** a Markdown document references a local image, inline (`![a](x.png)`) or by reference (`![a][fig]` with `[fig]: x.png`), that is a regular file inside the root and is a PNG, JPEG, GIF, WebP, SVG or AVIF by its extension, **THEN** the returned text **SHALL** reference it at `__tome_parent_assets__/<its path from the root>` relative to the staged chapter, and the returned files **SHALL** hold it for copying.
  - **WHEN** such a reference names a file that is missing, lies outside the root (by path or through a symbolic link), is not a regular file, or is of another kind (`scan.heic`), **THEN** the image **SHALL** be replaced in the text by the mark `[image not shown]`, written as T-066 writes its marks, the returned list of what was left out **SHALL** hold an entry of kind `image` with the reference as written, and no file from outside the root **SHALL** be returned.
  - **WHEN** a Markdown document holds an HTML `<img>` with a local address, **THEN** the text **SHALL** be unchanged there and the list **SHALL** hold an entry of kind `html-image`.
  - **WHEN** a reference is a web address, a `data:` address, or root-absolute, **THEN** it **SHALL** be left as written and not listed.
  - **WHEN** `prepareDocument()` is given a Word document, **THEN** it **SHALL** return `convertDocx()`'s Markdown, title and list, with each image to be written at `__tome_media__/<the chapter's staged name without .md>/<image name>` and referenced by a path relative to the staged chapter (so a chapter in a subfolder reaches it through `../`).
  - **WHEN** `prepareDocument()` is given a Word document that cannot be opened, **THEN** it **SHALL** throw an error naming the file; **WHEN** `placeholderDocument()` is given that file's name and the error, **THEN** it **SHALL** return a chapter whose top heading is the file's name without its extension, whose text is the mark `[document not shown]` followed by a sentence saying the file could not be read as a Word document, and a list holding one entry of kind `document`.
  - **WHEN** `prepareDocument()` returns or throws, **THEN** it **SHALL** have written nothing; it only reads the source.
- **Notes:** One function, used by the loader (T-069) and by `books:add` (T-071), so both agree on a document's title and on whether it can be read. `isPathInside`, `toMarkdownPath` and `imageDestinationSpans` are imported from `scripts/parent-assets.mjs`, which is not changed; its own rule (fail the load) stays for mdBooks. The two reserved directory names are tome-level, so they cannot meet a staged chapter: T-065 slugifies every staged segment, and a slug has no underscore.

### T-069: Publish documents and loose folders from the loader
- **Intent:** [INT-0029](../../../intents/INT-0029-documents-as-tomes.md)
- **Touches:** `scripts/load-books.mjs`, `src/lib/__tests__/load-books.test.ts`
- **Depends on:** T-065, T-066, T-068
- **Acceptance criterion:** INT-0029 AC1 (entries become tomes; refusal), AC2 (chapters, titles), AC3 (images staged), AC4 (the load names what was left out), AC6 (sources untouched), AC7 (mdBooks unchanged, with the one named exception).
- **Success criterion (EARS):**
  - **WHEN** `TOME_BOOK`, a `TOME_BOOKS` entry or a manifest `[[book]]` path names a `.md` or a `.docx` file, **THEN** the library **SHALL** hold a tome at the file's slug with the prepared document as `README.md`, its images at the places T-068 names, a `SUMMARY.md` whose only chapter is that page, and a `book.meta.json` whose title is the document's title; a manifest `title` or `slug` **SHALL** win.
  - **WHEN** an entry names a folder of documents, **THEN** the library **SHALL** hold one `.md` per document at the staged names and in the order T-065 gives, a `SUMMARY.md` from `writeSpine()` with each chapter titled by its document's title, and a `book.meta.json` titled with the folder's name; and no other file of the folder **SHALL** be in the library except the images T-068 returned.
  - **WHEN** a folder holds two Word documents that each hold an image, one of them in a subfolder, **THEN** each chapter's image **SHALL** be a different file in the library, and each reference **SHALL** resolve from its own chapter's folder to that file.
  - **WHEN** a prepared document left something out, **THEN** the loader **SHALL** print one line per document naming its path from the root and what was left out with counts (`left out 1 equation`), and **SHALL** still exit 0.
  - **WHEN** a Word document inside a folder entry cannot be opened, **THEN** the tome **SHALL** still be published with that document's chapter replaced by T-068's placeholder, the loader **SHALL** print a line naming the document and that it could not be read, and **SHALL** exit 0.
  - **WHEN** any entry cannot be resolved, or an entry that itself names one Word document cannot be opened, **THEN** the loader **SHALL** exit nonzero with a message naming the path, the previous library **SHALL** be byte-identical, and no staging directory **SHALL** remain.
  - **WHEN** the loader has run on documents, **THEN** every source file **SHALL** be byte-identical to before and no file **SHALL** have been created in or beside the source folder.
  - **WHEN** an entry names an mdBook folder, **THEN** the published tome **SHALL** be identical to what the loader published before this sprint, and every existing test in `load-books.test.ts` **SHALL** pass unedited except `test_source_none_errors`, whose folder holding only `README.md` becomes a folder holding only `notes.txt`, with its assertions as they are.
  - **WHEN** a manifest or `TOME_BOOKS` lists a document and an mdBook together, **THEN** both **SHALL** be published as tomes with distinct slugs.
- **Notes:** Resolve every entry first, as now, through `resolveSource()`; a `book` goes down the existing path untouched. Staging happens inside the existing `publish()`, so a failure keeps the old library. The two existing tests that give the loader a path that does not exist expect `SUMMARY.md` in the message, and T-065's message for that case keeps it.

### T-070: Open the first chapter at a tome's own address when it has no opening page
- **Intent:** [INT-0029](../../../intents/INT-0029-documents-as-tomes.md)
- **Touches:** `src/lib/book.ts`, `src/lib/__tests__/book.test.ts`
- **Depends on:** (none)
- **Acceptance criterion:** INT-0029 AC2 (a tome's own address opens it), AC1 (a tome appears in the Bibliotheca).
- **Success criterion (EARS):**
  - **WHEN** `tomePages()` is given one tome whose chapters include none at the tome's root, **THEN** it **SHALL** return, besides each chapter's own page, one page with route `''` that carries the first chapter's route (so the sidebar marks that chapter current and the pager offers the second).
  - **WHEN** `tomePages()` is given several tomes and one has no chapter at its root, **THEN** it **SHALL** return for that tome one more page, with route `<slug>`, that carries its first chapter's route; this is the page the sidebar's title links to (`src/components/TocSidebar.tsx`).
  - **WHEN** every tome given to `tomePages()` has a root chapter, **THEN** its result **SHALL** be exactly what it returned before this sprint.
  - **WHEN** `bibliothecaEntries()` is given several tomes, one of which has no root chapter, **THEN** that tome's link **SHALL** be the route of its first chapter, which is among the pages `tomePages()` returns.
- **Notes:** The page set is the only change; `[...slug].astro` renders an added page through the same branch. An mdBook with no opening chapter gains a page at its own address where it had none; nothing that existed changes. The last clause is true of the code today and is pinned by a test, because a folder of documents with no `README.md` is the first common tome of that shape. That an added page adds nothing to search is checked in the built site (T-073), where it can fail.

### T-071: Let `books:add` take a document or a loose folder
- **Intent:** [INT-0029](../../../intents/INT-0029-documents-as-tomes.md)
- **Touches:** `scripts/find-books.mjs`, `src/lib/__tests__/find-books.test.ts`
- **Depends on:** T-065, T-066, T-068, T-069
- **Acceptance criterion:** INT-0029 AC1 (`npm run books:add`), AC7 (discovery unchanged, with the one named exception).
- **Success criterion (EARS):**
  - **WHEN** `books:add` is given a `.md` file, a `.docx` file or a folder of documents, **THEN** it **SHALL** read every document through `prepareDocument()`, append a `[[book]]` entry with the absolute path to `tome.local.toml`, print the title the loader will show and the chapter count and the next command, and exit 0; `--title` and `--slug` **SHALL** be written as for a book.
  - **WHEN** the same document or folder is added twice, **THEN** the manifest **SHALL** hold one entry and the second run **SHALL** say it is already there.
  - **WHEN** `books:add` is given a path Tome does not accept, or is given one Word document that cannot be opened, **THEN** it **SHALL** exit nonzero with a message naming the path and the manifest **SHALL** be unchanged; **WHEN** it is given a folder in which one Word document cannot be opened, **THEN** it **SHALL** add the folder and name that document as one that will not be shown; in every case `tome.config.toml` **SHALL** stay byte-identical.
  - **WHEN** `books:find` scans a tree that holds loose documents and mdBooks, **THEN** its table and its `--json` document **SHALL** list the mdBooks only, with the fields they have today.
  - **WHEN** the existing tests in `find-books.test.ts` run, **THEN** they **SHALL** pass unedited except `test_books_add_rejects_invalid`, whose `not-a-book/notes.md` becomes `not-a-book/notes.txt`, with its assertions as they are.
- **Notes:** `describe()` gains a branch for the two new kinds; the scan does not. Listing loose documents in discovery is [INT-0031](../../../intents/INT-0031-files-simple-to-find.md).

### T-072: Say in `npm run dev` that live reload is off for documents
- **Intent:** [INT-0029](../../../intents/INT-0029-documents-as-tomes.md)
- **Touches:** `astro.config.mjs`, `scripts/document-source.mjs`, `src/lib/__tests__/document-source.test.ts`
- **Depends on:** T-065, T-069
- **Acceptance criterion:** INT-0029 AC7 (live reload of an mdBook folder is unchanged); the consequence that a changed document is seen after a restart.
- **Success criterion (EARS):**
  - **WHEN** `liveReloadNotice()` is given a source of kind `document` or `folder`, **THEN** it **SHALL** return one sentence saying live reload is off for documents and a restart shows changes; **WHEN** it is given kind `book`, **THEN** it **SHALL** return nothing.
  - **WHEN** `astro dev` starts with `TOME_BOOK` naming a document or a loose folder, **THEN** the server **SHALL** start, serve the tome, log that sentence, and add no watcher; **WHEN** it names an mdBook folder, **THEN** the hook **SHALL** behave as before this sprint.
- **Notes:** The decision is a pure function so CI can test it. The second clause is checked on this machine by starting the dev server once on a document and once on the handbook, and recording what was served and logged in `sprint-tests/integration-tests.md`; it is not in CI, as the existing live-reload gate is not. `scripts/check-live-reload.mjs` and `fixture-commands.test.ts` are not touched.

### T-073: Prove documents in a built site with a gate and a browser check
- **Intent:** [INT-0029](../../../intents/INT-0029-documents-as-tomes.md)
- **Touches:** `scripts/check-documents.mjs` (new), `e2e/documents.spec.ts` (new), `playwright.config.ts`, `package.json` (`check:documents`), `.github/workflows/ci.yml`, `fixtures/papers/` (new: Markdown notes, one in a subfolder, and an image), `src/lib/__tests__/fixture-commands.test.ts`, `src/lib/__tests__/ci-workflow.test.ts`
- **Depends on:** T-067, T-069, T-070
- **Acceptance criterion:** INT-0029 AC1 (sidebar, search, Bibliotheca), AC2 (`/`), AC3, AC4, AC5 (in the reader), AC7 (the default library after), AC8.
- **Success criterion (EARS):**
  - **WHEN** `npm run check:documents` runs on a clean checkout, **THEN** it **SHALL** copy `fixtures/papers/` to a temporary folder, add the Word fixture built by `buildDocx()` at its root and in its subfolder, build Tome with `TOME_BOOK` naming that folder, run `e2e/documents.spec.ts` against the built site, rebuild the default library, and exit 0.
  - **WHEN** the tracked sample is dirty, **THEN** the gate **SHALL** exit nonzero with the fixture gate's refusal before it creates a temporary folder or runs a build, leaving the working tree as it was; **WHEN** a build fails, **THEN** it **SHALL** exit nonzero, the tracked sample **SHALL** be as it was, and the temporary folder **SHALL** be removed.
  - **WHEN** the CI workflow is read, **THEN** it **SHALL** run `check-documents.mjs` as a step.
  - **WHEN** the built site is opened at `/`, **THEN** the first document's chapter **SHALL** be shown, and the sidebar **SHALL** list the folder's documents in order with the subfolder as a part title.
  - **WHEN** the Word chapter is opened, **THEN** the page **SHALL** show one level-1 heading with the document's Title; the "on this page" rail **SHALL** list the paper's Heading 1 and Heading 2 sections by name and not its Heading 3; the footnote reference **SHALL** lead to the note and the note's back-link to the reference; the table **SHALL** have a header row; the image **SHALL** load (natural width above zero); the superscript **SHALL** be a `sup` element; and `[equation not shown]` **SHALL** be visible.
  - **WHEN** the Word chapter in the subfolder is opened, **THEN** its image **SHALL** load.
  - **WHEN** the Word chapter is opened, **THEN** no element **SHALL** have an `href` beginning `javascript:` or `file:`, and the text of each unsafe link **SHALL** be visible.
  - **WHEN** a word that occurs only in the Word document is searched, **THEN** the search **SHALL** offer that chapter; the built `search-index.json` **SHALL** hold exactly one record per chapter, with no two records sharing a URL; and every heading slug in the Word chapter's record, the one with a subscript among them, **SHALL** be an `id` in that chapter's built page.
  - **WHEN** the Markdown note with an image is opened, **THEN** its image **SHALL** load; and where the note points to a missing image, `[image not shown]` **SHALL** be visible.
  - **WHEN** Tome is built with `TOME_BOOKS` naming the handbook and the documents folder, **THEN** `/` **SHALL** be the Bibliotheca listing both tomes, the documents tome's link there **SHALL** name a page that exists in the built site, and so **SHALL** the title link in that tome's sidebar (`/<slug>`).
- **Notes:** Follow `scripts/check-external-build.mjs` and `createFixtureGate` (`scripts/fixture-gate.mjs`): everything, the temporary folder included, happens inside `gate.withFixture`, so the dirty-sample refusal comes first. `check-documents.mjs` joins the list of gate scripts in `fixture-commands.test.ts`'s refusal test, and `ci-workflow.test.ts` gains the assertion for the new step. `playwright.config.ts` gains a third mode beside the external-book one, selected by an environment variable, with its own port and output folder. The fixture folder has no `README.md`, so T-070's page at `/` is exercised in a browser.

### T-074: Tell a person how to add a document
- **Intent:** [INT-0029](../../../intents/INT-0029-documents-as-tomes.md)
- **Touches:** `src/content/books/tome/find-your-books.md`, `README.md`, `tome.config.toml` (comments only), `src/lib/__tests__/tutorial.test.ts`
- **Depends on:** T-069, T-070, T-071, T-072, T-073
- **Acceptance criterion:** INT-0029 AC8 (a chapter of the bundled Tome book).
- **Success criterion (EARS):**
  - **WHEN** the bundled Tome book is read, **THEN** "Find Your Books" **SHALL** have a section on documents that covers: adding a `.md` file, a `.docx` file and a folder of them with `npm run books:add`; the same in `tome.local.toml`; downloading a Google Doc as `.docx`; what carries over from Word; what is marked and not shown (equations, charts and diagrams, images that cannot be shown, a document that cannot be opened); what becomes plain text (links within the document); what is not carried over (headers and footers, comments, colours, fonts, underlining); that a link from one note to another file does not lead to its chapter; how a folder is ordered, which folders are skipped, and that `README.md` opens it; and that `npm run dev` needs a restart to show a changed document.
  - **WHEN** the tutorial or the README names an `npm run <script>` command, **THEN** that script **SHALL** exist in `package.json`.
  - **WHEN** `tome.config.toml` is read, **THEN** its comments **SHALL** say a `path` may be a document or a folder of documents, and the file **SHALL** still parse to no entries.
- **Notes:** The section is added to the existing chapter so the sample's chapter list, and the tests and E2E expectations that enumerate it, do not change. It is written last so it describes what was built.

## Boundaries

- Reading only. No editor, no equations laid out, no LaTeX or Typst, no fonts, no theme files, no change to discovery's scan, no change to either desktop shell.
- The Word fixture is XML parts written for this sprint, and no document of the owner's is committed. The research asked for a fixture saved from a real Word file. That is deferred to the Test phase with a reason: a real paper is the owner's own writing and stays out of the repository, so it is read by eye against a checklist (test plan, "By eye"), and INT-0029 is not marked realized if that reading shows a fault the fixture missed. The paper or papers read must between them hold headings, a footnote, a table and an image, and the conversion is run on them as soon as T-066 passes if the owner has given one by then.
- Dependencies added are the seven named in T-066, all used when the library is built. Nothing is added to the pages a reader loads.
- Formatting follows the repository: single quotes, each file's existing width, no reformatting of untouched lines.
- Push only `dev`; the checkpoint pull request is left for the owner to merge.
