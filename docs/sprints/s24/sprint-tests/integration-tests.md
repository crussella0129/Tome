# Sprint 24 Integration Verification

## Recorded during Build

### `verify_dev_serves_document` (T-072 clause 2), 23 November 2026

Run on this machine with a scratch script: the loader, then
`astro dev --background --port 4331` with `TOME_BOOK` set, a request for `/`,
an edit to the source on disk, ten seconds' wait, `astro dev logs`, and
`astro dev stop`. Not in CI, as the plan says.

| `TOME_BOOK` names | `/` | notice logged | watcher added | after the edit |
|---|---|---|---|---|
| a `.md` file | 200, shows its heading | yes | no | no `synced` line; the page shows the old text |
| a folder of documents | 200, shows its `README.md` | yes | no | no `synced` line; the page shows the old text |
| an mdBook (a copy of `fixtures/handbook`) | 200, shows its title | no | yes (`live reload watching …/src`) | `synced …/README.md → reloading`; the page shows the edit |

The notice, as logged under the label `tome-live-reload`: "live reload is off
for documents: restart `npm run dev` to see a change to them".

The first attempt read the server's own output and found no notice. The cause
was the check, not the hook: Astro 7 puts a dev server started without a
terminal in the background, so its lines are read with `astro dev logs` and it
is stopped with `astro dev stop`. The check was changed to do both.

### `verify_real_paper_converts` (T-066 Notes)

Not run. No paper of the owner's had been given when T-066 passed, so the
reading of a real Word or Google Docs file is still owed at the Test phase,
with the checklist in the test plan.

## Recorded at the Test phase

- **Tested head:** `36b5db1`. All cases below ran in `npx vitest run`
  (257 passed, 1 skipped, 0 failed on this machine) with the spawned loader or
  CLI on real temporary folders; none uses a stub. The one case skipped here,
  the note named `Summary.md`, ran and passed in CI on Linux at the same head
  (see `test-report.md`).

### Loader (`load-books.test.ts`, 41 passed and 1 skipped of 42; 13 new) — T-065 + T-066 + T-068 + T-069

| Test | T-069 clause | Result |
|---|---|---|
| `test_loader_markdown_file` — `My Paper.md` → `my-paper/README.md` byte-equal, one-chapter spine, title from its `#`; a note with no heading is titled by its file name | 1 | pass |
| `test_loader_word_file` — converted `README.md`, the image under `__tome_media__/README/`, title from the Title | 1 | pass |
| `test_loader_document_titles` — a manifest `title` and `slug` win | 1 | pass |
| `test_loader_document_folder` — the exact list of eight files published, the exact spine, the part `letters`, the note's image staged, and neither `notes.pdf` nor an unused image | 2 | pass |
| `test_loader_word_images_apart` — two Word chapters, one nested, reference two different existing files | 3 | pass |
| `test_loader_reports_left_out` — `paper.docx: left out 2 equations`, `note.md: left out 1 image`, nothing for a clean note, two lines in all | 4 | pass |
| `test_loader_reports_left_out` (figures) — a paper with a chart and an unknown element prints `left out 2 equations, 1 chart or diagram, 1 element the Word reader did not recognise (w:madeUpThing)`, and its chapter holds the figure mark | 4 | pass |
| `test_loader_document_folder` (a note named `Summary.md`) — the note is staged as `summary-2.md` and listed in the written spine | 2 | skipped here (the file system ignores case, so the folder is an mdBook); runs in CI |
| `test_loader_folder_unreadable_document` — exit 0, both chapters in the spine, the placeholder, the line naming `broken.docx` | 5 | pass |
| `test_loader_document_failure_keeps_library` — a corrupt `.docx`, `old.doc` and a missing `.docx` named directly: nonzero, the path named, the library's tree equal, no staging residue | 6 | pass |
| `test_loader_sources_untouched` — every source hash equal; the source's parent holds only `out` and `vault` | 7 | pass |
| `test_loader_book_unchanged` — handbook and docs-book hash to the digests recorded at `06cdbcd` | 8 | pass |
| `test_loader_mixes_kinds` — by manifest and by `TOME_BOOKS`: two tomes each | 9 | pass |
| the 29 existing cases; one edit, `test_source_none_errors`'s folder now holds `notes.txt` | 8 | pass |

### `books:add` (`find-books.test.ts`, 11/11; 4 new) — T-065 + T-066 + T-068 + T-069 + T-071

`test_books_add_documents` also loads the manifest `books:add` wrote
(`--config tome.local.toml`): three tomes, `my-note`, `paper` and `the-vault`,
the last titled "My Vault"; and it hashes every source file before and after
the three adds and finds them equal. `test_find_books_ignores_documents` also
runs discovery's table: one book found, and no line for the loose note.

| Test | T-071 clause | Result |
|---|---|---|
| `test_books_add_documents` — a `.md`, a `.docx` and a folder added; for the note and the Word paper the printed title equals what the loader then writes to `book.meta.json` for the same path; the folder is added under its `--title`, with `--slug` written, and loads under its own name without them | 1 | pass |
| `test_books_add_document_dedupes` — the same file by another spelling | 2 | pass |
| `test_books_add_rejects_unaccepted` — `old.doc`, a document-less folder and a corrupt `.docx` refused with the manifest unchanged; a folder with one corrupt `.docx` added and that file named | 3 | pass |
| `test_find_books_ignores_documents` — the scan lists the mdBook only, with today's six fields | 4 | pass |
| the seven existing cases; one edit, `test_books_add_rejects_invalid`'s `notes.md` renamed `notes.txt` | 5 | pass |

### Gate safety (`fixture-commands.test.ts`, 8/8) — T-073

Recorded with the end-to-end results in `e2e-tests.md`.

### Loader start-up, measured

An mdBook load took about 0.85 s before the sprint. Importing the Word reader
at the top of the loader raised it to about 2.4 s; with the reader loaded only
when an entry names documents it is about 0.85 s again, and a load of
documents takes about 2.5 s.

### Where the "mdBooks unchanged" digests come from

`test_loader_book_unchanged` holds two digests as literals. To show they are
the loader's output from before the sprint and not after, they were produced
again from a scratch clone of the repository checked out at `06cdbcd` (the
Research commit, before any source change), running that commit's own loader:

```text
$ git clone --no-hardlinks . <scratch>/clone && cd <scratch>/clone && git checkout 06cdbcd
$ TOME_BOOK=fixtures/handbook  node scripts/load-books.mjs --dest <scratch>/out/handbook
$ TOME_BOOK=fixtures/docs-book node scripts/load-books.mjs --dest <scratch>/out/docs-book
$ node digest.mjs <scratch>/out/handbook
7 0b97f999d3114c67dd7a9999a86d8864f4c35bede5b8991a3e4fcb97ea065fc0
$ node digest.mjs <scratch>/out/docs-book
5 83cdf0ca0da69802494bf43a8039f508b28791a3278589c33322bf6992079d37
```

The digest is SHA-256 over each published file's path and text in path order,
line endings normalized, which is what the test computes. The first number is
the count of files. Both equal the test's literals.

### `verify_real_paper_converts`: files saved by Word itself

The owner asked for an example found online in place of a paper of their own
("find an example with headings online for a .docx to make sure this works
properly"). Twelve small test documents from the pandoc project
(`jgm/pandoc`, `test/docx/`, GPL-2.0, 2.7 to 25.8 KB each) were downloaded to
a scratch folder outside the repository, converted with `convertDocx()`, and
then built as a tome and read in the browser. They are not committed.

| File | What it holds | Result |
|---|---|---|
| `headers.docx` | a Title and Heading 1 to 6, and a "Heading 7" Word never defined | Title as the one top heading, six levels below it, the seventh as a paragraph. **Fault found:** the undefined style was reported as something left out. Fixed. |
| `0_level_headers.docx` | a cover table, a table of contents, one Heading 1 | converts; the contents entries are plain text; the cover table, laid out with empty rows, gets an empty header row (recorded as a consequence) |
| `numbered_header.docx`, `nested_anchors_in_header.docx` | a numbered heading; headings holding bookmarks, with a contents list | headings right; bookmark links are plain text |
| `notes.docx` | a footnote and an endnote | `[^1]` and `[^e1]` with their definitions |
| `inline_formatting.docx` | italics, bold, small caps, strikethrough, superscript, subscript, a line break | all carried over; small caps as plain text |
| `lists.docx` | nested numbered and bulleted lists | nesting kept |
| `links.docx` | two web links, a link to a heading, a link to a bookmark | web links kept; the two internal links are plain text |
| `image.docx` | a JPEG | extracted (22,975 bytes) and shown, 485 px wide in the page |
| `table_one_header_row.docx` | a one-row table | a header row |
| `table_with_list_cell.docx` | a bulleted and a numbered list inside table cells | **Fault found:** the lists broke the table apart. Fixed: each cell keeps its lines. |
| `block_quotes.docx` | Quote and Intense Quote paragraphs, and an indented one | **Fault found:** both quotations came out as ordinary paragraphs. Fixed: they are block quotations; the merely indented paragraph stays a paragraph. |

Each fault has a test on a variant of the committed fixture
(`test_docx_reader_messages`, `test_docx_table_cells_stay_one_line`,
`test_docx_block_quotes`). Captures of four of these pages were shown to the
owner; they are not committed, since the documents are not the project's.
