# Test Critique — Sprint 24, first review

The reviewer read the locked plans, the test records, the completed tasks,
INT-0029, and the test and implementation code at head `ef6d924`. "Why it
matters" is condensed from the reviewer's report; each "Suggested response"
ends with what was done. Every fix below is in commit `28e3490`.

## Concerns

### C-001: The load's line for a chart, a diagram and an unrecognised element is never executed
- **Where:** `integration-tests.md` `test_loader_reports_left_out` / INT-0029 AC4 / T-069 clause 4 / `scripts/document-stage.mjs` `describeLeftOut`
- **Quote:** "`paper.docx: left out 2 equations`, `note.md: left out 1 image`, nothing for a clean note, two lines in all"
- **Failure mode:** intent-coverage
- **Why it matters:** No test reached the `figure` or `other` branch of the report, and for `other` the line gave a count but not what was not recognised, though AC4 says the load names it.
- **Suggested response:** add-test — done. The report now names each unrecognised element (`(w:madeUpThing)`). `test_describe_left_out` covers every branch, and a second `test_loader_reports_left_out` case runs the loader on a paper with a chart and an unknown element and asserts the whole line.

### C-002: A tome of one document is never built or opened
- **Where:** `e2e-tests.md` `npm run check:documents` / INT-0029 AC1, AC8 / `scripts/check-documents.mjs`
- **Quote:** "The gate copies `fixtures/papers/` to a temporary folder, adds two Word papers"
- **Failure mode:** intent-coverage
- **Why it matters:** A single `.docx`, the path `books:add` takes for one paper, was proved only as files in the library, never as a built site.
- **Suggested response:** add-test — done. The gate makes a third build with `TOME_BOOK` naming one `.docx` and checks that `/` shows its Title, its image is in the build, the equation mark is there, and search holds one record at `/` (`check_documents_single_word`).

### C-003: The reserved names `summary` and `readme` have no assertion that can fail
- **Where:** `unit-tests.md` T-065 `test_source_staged_names` / T-065 clause 6
- **Quote:** "six sets, each passed through the real `hrefToSlug()`: all routes differ and none is the root but the opening page"
- **Failure mode:** weak-assertion
- **Why it matters:** `summary` could be dropped from the reserved names and nothing would fail; on a file system that ignores case a note named `Summary.md` could then be overwritten by the spine.
- **Suggested response:** tighten-assertion — done. `summary-2.md`, `sub/index-2.md` and `sub/readme-2.md` are asserted by name, and a loader case publishes a folder holding `Summary.md` and checks both the chapter and the spine. That case runs where the file system tells the two names apart (CI); where it does not, such a folder is an mdBook, which INT-0029's consequences now say.

### C-004: The opening-page rule is tested with `.md` names only; a Word file takes the place of `README.md`
- **Where:** T-065 clause 5 / INT-0029 AC2 / `scripts/document-source.mjs` `orderDocuments`
- **Quote:** "a `README.md` or `index.md` directly in the folder (README winning when both exist) **SHALL** be first and marked as the opening page"
- **Failure mode:** EARS-coverage
- **Why it matters:** `README.docx` beside `README.md` became the opening page and pushed the Markdown file aside; the behaviour was neither proved nor chosen.
- **Suggested response:** add-test — done, with the choice made: a Markdown `README` or `index` comes before a Word one of the same name, and a Word one opens a tome when it is the only one. `orderDocuments` was changed to do that, a second `test_source_order` case pins it, and INT-0029's consequences record it.

### C-005: The browser image checks race a lazily loaded image
- **Where:** `e2e/documents.spec.ts`, used by `test_documents_nested_word_image` and `test_documents_markdown_images`
- **Quote:** "`.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)`"
- **Failure mode:** flake-risk
- **Why it matters:** A Markdown image is `loading="lazy"`, so the check could run before the image arrived, and CI's one retry would hide it.
- **Suggested response:** tighten-assertion — done. The check scrolls the image into view and awaits `img.decode()` before judging it.

### C-006: The footnote's way back can pass without the back-link working
- **Where:** `e2e-tests.md` `test_documents_word_chapter` / T-073 clause 5
- **Quote:** "`await note.locator('a.data-footnote-backref').first().click();` / `await expect(reference).toBeInViewport();`"
- **Failure mode:** weak-assertion
- **Why it matters:** With the reference and the note on screen together, a back-link that did nothing would pass.
- **Suggested response:** tighten-assertion — done. The test asserts the back-link's `href` is `#` plus the reference's `id`, and that the page's address ends with the note's id after the first click and the reference's after the second.

### C-007: "Not carried over and not reported" is proved for underlining and one unmapped style only
- **Where:** `unit-tests.md` `test_docx_reader_messages` / INT-0029 AC4
- **Quote:** "an unknown element listed as `other`; an unmapped style kept as text and not listed"
- **Failure mode:** negative-path
- **Why it matters:** If the Word reader warned about fonts, colours, comments, headers, bookmarks or field codes, every real paper would print a line of unrecognised elements.
- **Suggested response:** add-test — done. `test_docx_decoration_is_silent` adds a run with a font, colour, size and highlight, a comment with its part, a header with its part, a bookmark, and `REF`, `PAGEREF` and `HYPERLINK \l` fields: the words are kept, the header's and the comment's words are absent, no link is formed, and nothing is reported beyond the paper's equations. Twelve files saved by Word itself were also converted (see `integration-tests.md`); one of them showed a style named but never defined being reported, which is fixed and tested.

### C-008: A note's image named by an absolute path outside its folder is neither marked nor reported
- **Where:** `unit-tests.md` `test_prepare_markdown_missing_image` / INT-0029 AC4 / `scripts/document-stage.mjs` `localPath`
- **Quote:** "missing, outside, a folder, `.heic`, a missing reference-style image: five marks, five entries, no file returned"
- **Failure mode:** negative-path
- **Why it matters:** `C:\…\pic.png` and `file:///…` were taken for web addresses and left as written, so the image was left out in silence.
- **Suggested response:** add-test — done. Both spellings are now local references, staged when inside the document's folder and marked and reported when not; a new `test_prepare_markdown_missing_image` case covers each, inside and outside.

### C-009: Two skipped folders and a symlinked file named by the clause are not in any test
- **Where:** `unit-tests.md` T-065 `test_source_folder_walk` / T-065 clause 3
- **Quote:** "dot-folder, dot-file, `node_modules`, `target`, `dist`, `vendor`, `venv`, three kinds of nested mdBook … and a Word lock file all left out"
- **Failure mode:** EARS-coverage
- **Why it matters:** `__pycache__` and `site-packages` could be dropped from the list, and a linked file read, with nothing failing.
- **Suggested response:** add-test — done. Both folders are in the fixture, and the symlink case links a file as well as a folder and asserts the exact list of documents.

### C-010: A tome's own address in a library of several is checked for existence, not for what it opens
- **Where:** `e2e-tests.md` `check_documents_bibliotheca` / INT-0029 AC2 / T-073 clause 10
- **Quote:** "`/papers`, the sidebar title's page, exists"
- **Failure mode:** weak-assertion
- **Why it matters:** AC2 says the address opens the first chapter; the gate did not read the page.
- **Suggested response:** tighten-assertion — done. The gate reads `dist/papers/index.html` for the first note's `h1`, and reads a chapter page of that tome for a title link to `/papers`.

### C-011: Where the digests in `test_loader_book_unchanged` came from is asserted, not shown
- **Where:** `integration-tests.md` `test_loader_book_unchanged` / INT-0029 AC7
- **Quote:** "handbook and docs-book hash to the digests recorded at `06cdbcd`"
- **Failure mode:** evidence-drift
- **Why it matters:** If the literals had been taken after the loader changed, the test would pin today's output and prove nothing about before.
- **Suggested response:** record — done. Both digests were produced again from a scratch clone checked out at `06cdbcd`, running that commit's own loader; the commands and their output are in `integration-tests.md`, and they equal the literals.

### C-012: `test_search_text_drops_tags` asserts single characters that cannot fail
- **Where:** `unit-tests.md` T-067 / T-067 clause 1 / `search-index.test.ts`
- **Quote:** "`expect(text).toContain('b');`"
- **Failure mode:** weak-assertion
- **Why it matters:** The loose assertions hid that a tag within a line split a word in the body (`H 2 O`) while a heading kept it whole (`H2O`).
- **Suggested response:** tighten-assertion — done, with the choice made: a tag within a line joins its neighbours, so the body reads `H2O` as the heading does. The test asserts the whole text (`x2 and b block words`), and a new case asserts `Washed in H2O, area x2.`

### C-013: The records claim slightly more than the code shows
- **Where:** `unit-tests.md` T-068 `test_prepare_writes_nothing` / INT-0029 AC6 / `sprint-tests/evidence/`
- **Quote:** "every case above compares a hash of every file in its temporary tree before and after, the thrown error included"
- **Failure mode:** evidence-drift
- **Why it matters:** Two cases took no snapshot, `books:add` was never checked for leaving its sources alone, and the captures the record cites were not committed.
- **Suggested response:** tighten-assertion — done. Both cases snapshot; `test_books_add_documents` hashes every source before and after; the captures are committed with these records.

### C-014: In the browser, the Word chapter is not checked for bold, italic, strikethrough or lists
- **Where:** `e2e-tests.md` `test_documents_word_chapter` / INT-0029 AC3
- **Quote:** "one `h1`, the Title; rail `The Quarry`, `Tools`, `Washing in H2O`, `The Measure`"
- **Failure mode:** weak-assertion
- **Why it matters:** Those were proved as Markdown text only; whether the site renders `~~…~~` as a deletion is the site's doing.
- **Suggested response:** tighten-assertion — done for `strong`, `em`, `del`, and the bulleted and numbered lists. Deferred with a reason: `[figure not shown]` and `[document not shown]` are not asserted in a built page, because they are written by the same code as `[equation not shown]` and `[image not shown]`, which are.

### C-015: `books:add` is compared with the loader by path, never through the manifest it wrote; the table of `books:find` is untested
- **Where:** `integration-tests.md` `test_books_add_documents`, `test_find_books_ignores_documents` / T-071 clauses 1 and 4
- **Quote:** "the printed title equals what the loader then writes to `book.meta.json` for the same path"
- **Failure mode:** EARS-coverage
- **Why it matters:** The manifest `books:add` wrote was never loaded, and only the `--json` form of discovery was run.
- **Suggested response:** add-test — done. The test loads the written manifest with `--config` and asserts three tomes, the folder under its given title and slug; discovery's table is run and asserted to list the one book and no loose note.

## Confidence
proceed-with-caveats
