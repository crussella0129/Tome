Finalized - DO NOT EDIT

# Sprint 24 Test Plan

## Intent Traceability
| Intent | Acceptance criterion | Build task / EARS clause | Verification |
|--------|----------------------|--------------------------|--------------|
| [INT-0029](../../../intents/INT-0029-documents-as-tomes.md) | AC1 a manifest path, `TOME_BOOK(S)` and `books:add` accept a `.md`, a `.docx`, or a folder of them; each appears in the Bibliotheca, sidebar and search; anything else fails with a message naming the path and what is accepted | T-065 / kinds `book`, `document`, `folder`; refusal messages. T-067 / search text. T-069 / each entry becomes a tome; failure keeps the library; mixed kinds. T-070 / Bibliotheca link of a tome with no root. T-071 / add, dedupe, refuse. T-073 / sidebar, search, Bibliotheca in a built site | `test_source_book_delegates`, `test_source_document_kinds`, `test_source_folder_walk`, `test_source_refusals`, `test_search_text_drops_tags`, `test_loader_markdown_file`, `test_loader_word_file`, `test_loader_document_folder`, `test_loader_mixes_kinds`, `test_loader_document_failure_keeps_library`, `test_entries_rootless_tome`, `test_books_add_documents`, `test_books_add_document_dedupes`, `test_books_add_rejects_unaccepted`, E2E `test_documents_root_and_sidebar`, E2E `test_documents_search`, gate `check_documents_bibliotheca` |
| [INT-0029](../../../intents/INT-0029-documents-as-tomes.md) | AC2 one chapter per document; folder order, parts and opening page; titles; a tome's own address opens it | T-065 / order, staged names, `writeSpine`. T-068 / titles. T-069 / titles and spine in the library. T-070 / pages at `/` and `/<slug>` | `test_source_order`, `test_source_staged_names`, `test_spine_round_trip`, `test_prepare_markdown_title`, `test_loader_document_titles`, `test_loader_document_folder`, `test_pages_lone_tome_without_root`, `test_pages_rootless_in_library`, `test_pages_unchanged_otherwise`, E2E `test_documents_root_and_sidebar`, gate `check_documents_bibliotheca` |
| [INT-0029](../../../intents/INT-0029-documents-as-tomes.md) | AC3 headings, emphasis, lists, links, tables, footnotes, images from Word; one top heading; the rail lists Heading 1 and 2; images staged | T-066 / text and inline rules; heading levels and title; footnotes; table header; superscript; images. T-068 / media paths. T-069 / images in the library | `test_docx_text_and_inline`, `test_docx_heading_levels`, `test_docx_footnotes`, `test_docx_table_header`, `test_docx_superscript_subscript`, `test_docx_images`, `test_prepare_word`, `test_loader_word_file`, `test_loader_word_images_apart`, E2E `test_documents_word_chapter`, E2E `test_documents_nested_word_image` |
| [INT-0029](../../../intents/INT-0029-documents-as-tomes.md) | AC4 an equation, a chart or diagram, an image that cannot be shown, and a document in a folder that cannot be opened are marked and reported; anything else the reader did not recognise is reported; layout and decoration are neither | T-066 / marks as literal text; equations; charts and diagrams; image of another kind; `other` entries; style messages left out; underline plain. T-068 / Markdown images staged or marked, HTML images listed, the placeholder. T-069 / one line per document, exit 0; a folder's unreadable document | `test_docx_marks_are_literal`, `test_docx_equations_marked`, `test_docx_figures_marked`, `test_docx_unsupported_image`, `test_docx_reader_messages`, `test_docx_text_and_inline` (underline), `test_prepare_markdown_images`, `test_prepare_markdown_missing_image`, `test_prepare_markdown_html_image`, `test_prepare_unreadable_word`, `test_loader_reports_left_out`, `test_loader_folder_unreadable_document`, E2E `test_documents_word_chapter`, E2E `test_documents_markdown_images` |
| [INT-0029](../../../intents/INT-0029-documents-as-tomes.md) | AC5 a link that is not a web or mail address is plain text | T-066 / link rule | `test_docx_unsafe_links`, E2E `test_documents_no_unsafe_links` |
| [INT-0029](../../../intents/INT-0029-documents-as-tomes.md) | AC6 sources never changed; nothing written beside them | T-066 / no writes, bytes unchanged. T-068 / reads only. T-069 / sources byte-identical, no new files | `test_docx_source_untouched`, `test_prepare_writes_nothing`, `test_loader_sources_untouched` |
| [INT-0029](../../../intents/INT-0029-documents-as-tomes.md) | AC7 mdBook folders load exactly as before, with two named tests changed | T-065 / `book` delegates and its errors stand. T-067 / no-HTML chapters index as before. T-069 / identical tome, existing tests. T-070 / unchanged when every tome has a root. T-071 / discovery unchanged. T-072 / mdBook live reload as before | `test_source_book_delegates`, existing `search-index.test.ts` cases unedited, `test_loader_book_unchanged`, existing `load-books.test.ts` cases (only `test_source_none_errors`'s folder contents change), existing `book.test.ts` cases unedited, `test_pages_unchanged_otherwise`, `test_find_books_ignores_documents`, existing `find-books.test.ts` cases (only `test_books_add_rejects_invalid`'s file name changes), `test_live_reload_notice`, `npx playwright test`, `check:external`, `check:multibook`, `check:search`, `check:livereload` |
| [INT-0029](../../../intents/INT-0029-documents-as-tomes.md) | AC8 tests on a Word fixture kept in the repository; a chapter tells a person how to add a document | T-066 / fixture parts and builder. T-073 / gate, its refusal, its clean-up, its CI step. T-074 / tutorial section, commands exist, manifest comments | `test_docx_fixture_builds`, `check:documents`, `test_fixture_commands_refuse_dirty_content` (with `check-documents.mjs` in its list), `test_documents_gate_cleans_up_on_failure`, `test_ci_workflow_valid` (with the new step), `test_tutorial_covers_documents`, `test_tutorial_commands_exist`, `test_config_template_mentions_documents` |

## Unit Tests
Every new test file that touches the file system or spawns a process begins
with `// @vitest-environment node`. Where a clause speaks of what a chapter
"reads", the test parses the Markdown (`mdast-util-from-markdown`, already a
dependency) and looks at its text, so an escaped bracket does not matter.

### T-065 unit tests (real temp folders)
- **Intent:** [INT-0029](../../../intents/INT-0029-documents-as-tomes.md)
- `test_source_book_delegates` (clause 1): `fixtures/handbook` and `fixtures/docs-book` → kind `book`, fields deep-equal to `resolveBookSource()`; a folder with a `book.toml` declaring a missing `src`, and one with a `book.toml`, no spine and loose `.md` files → that function's error, never kind `folder`
- `test_source_document_kinds` (clause 2): `paper.md`, `Paper.DOCX` → kind `document`, formats `markdown` / `word`, root = folder, slug from the name
- `test_source_folder_walk` (clause 3): a folder with documents three levels deep, a dot-folder, `node_modules/`, `target/`, `dist/`, `vendor/`, `venv/`, a subfolder holding a `SUMMARY.md`, a subfolder holding a `book.toml`, a subfolder `proj/` whose spine is `proj/docs/SUMMARY.md` with a `proj/README.md` beside it, a `~$lock.docx`, and a symlinked folder → exactly the real documents, none from `proj/` (the symlink case is skipped where the platform refuses symlinks, as the existing discovery test does)
- `test_source_refusals` (clause 4): a missing path `nope` and a folder holding only `notes.txt` → message containing the path, `SUMMARY.md`, `Tried:` and `.docx`; a missing `papr.docx` and a missing `note.md` → message saying the file was not found, with the path, and no `Tried:`; `old.doc`, `notes.txt`, `scan.pdf` → message containing the path, `SUMMARY.md`, `.md` and `.docx`
- `test_source_order` (clause 5): root documents before subfolders; `README.md` first and marked opening (over `index.md`); `2-b.md` before `10-a.md`; case ignored
- `test_source_staged_names` (clause 6): `My Notes (1).md` → `my-notes-1.md`; `a.md` + `a.docx` → `a.md`, `a-2.md`; a root `index.md` beside `README.md`; `sub/README.md` + `sub/index.md`; `summary.md` → for each set, the staged names passed through the real `hrefToSlug()` are all different, and none is `''` except the opening page
- `test_spine_round_trip` (clause 7): `parseSummary(writeSpine(…))` → title, prefix opening page, numbered root chapters, one part title per top-level subfolder with its chapters, hrefs equal to the staged names; a chapter titled `Notes [draft]` comes back titled `Notes (draft)`
- Stubs: none

### T-066 unit tests
- **Intent:** [INT-0029](../../../intents/INT-0029-documents-as-tomes.md)
- `test_docx_fixture_builds` (clause 1): `buildDocx('fixtures/word/paper')` → a zip whose entry names equal the folder's relative file paths with `/`; `convertDocx()` on it does not throw
- `test_docx_text_and_inline` (clause 2): paragraph text, `**bold words**`, emphasis, `~~struck words~~`, a bulleted and a numbered list, `[the source](https://…)`, `[the scribe](mailto:…)`; the underlined words present with no `*`, `_` or `<u>` around them
- `test_docx_heading_levels` (clauses 3, 4): (a) Title + Heading 1/2/3 → one `#` (the Title), then `##`/`###`/`####`, title = the Title; (a′) Title + Heading 6 → that heading at `######`; (b) no Title, one Heading 1 → levels unchanged, title = that heading; (c) no Title, no Heading 1 → `# <fallback>` first, others unchanged, title = fallback; (d) no Title, two Heading 1 → `# <fallback>` first, both at `##`, a Heading 2 at `###`, title = fallback
- `test_docx_footnotes` (clause 5): a footnote and an endnote → two different `[^…]` references where cited and a `[^…]:` definition for each with its text; no `<sup>[^`, no `↑`, no trailing numbered list of notes
- `test_docx_table_header` (clause 6): the header row is `Tablet | Weight`; no row of empty header cells
- `test_docx_superscript_subscript` (clause 7): `x<sup>2</sup>` and `H<sub>2</sub>O` present; `x2` and `H2O` absent
- `test_docx_unsafe_links` (clause 8): the `javascript:`, `file:` and bookmark links → their text present, no `](javascript:`, `](file:` or `](#_`
- `test_docx_marks_are_literal` (clause 9): the converted fixture, parsed, has no link, link reference or definition whose text or label is a mark; each mark is found in a text node exactly as `[equation not shown]`; a mark followed directly by `(text)` in the document still parses as text
- `test_docx_equations_marked` (clause 10): an equation within a line and one on its own → the chapter reads `[equation not shown]` twice, the words before and after the inline one both present, the list holds `{ kind: 'equation', count: 2 }`
- `test_docx_figures_marked` (clause 11): a drawing of the chart kind and one of the diagram kind → the chapter reads `[figure not shown]` twice and the list holds kind `figure`, count 2; a drawing holding a picture is still an image; a drawing holding a text box keeps its text; a drawing that is a plain shape → the test records what the reader returns and that the list holds nothing for it
- `test_docx_images` (clause 12): the PNG is returned with bytes equal to the fixture's, and the Markdown references its name beneath the media path given
- `test_docx_unsupported_image` (clause 12): the image part changed to EMF → the chapter reads `[image not shown]`, no image reference, the list holds kind `image` naming `emf`
- `test_docx_reader_messages` (clause 13): an unknown element added to the body → the list holds kind `other` with the reader's message; a paragraph with an unmapped style → its text is in the Markdown and the list holds nothing for it
- `test_docx_source_untouched` (clause 14): the file's hash before and after is equal and its temp folder holds no new file, for a success and for a thrown error; a text file named `.docx` → error naming it
- Stubs: none (the real Word reader on the real fixture)

### T-067 unit tests
- **Intent:** [INT-0029](../../../intents/INT-0029-documents-as-tomes.md)
- `test_search_text_drops_tags` (clauses 1, 2): `parseChapter('x<sup>2</sup> and <span class="a">b</span>\n\n<div>block words</div>')` → text holds `x`, `2`, `and`, `b`, `block words` and no `<` or `>`; `parseChapter('## Washing in H<sub>2</sub>O')` → heading text `Washing in H2O`, slug `washing-in-h2o`
- existing `search-index.test.ts` cases (clause 3): pass unedited

### T-068 unit tests (real temp folders)
- **Intent:** [INT-0029](../../../intents/INT-0029-documents-as-tomes.md)
- `test_prepare_markdown_title` (clauses 1, 2): first `#` heading wins; no heading + front matter `title: A Note` → `A Note`; neither → the file name; front matter (well formed, and malformed YAML) is absent from the returned text and the body is otherwise equal to the source
- `test_prepare_markdown_images` (clauses 3, 6): an inline and a reference-style local image, as PNG and as SVG → each returned for copying and referenced under `__tome_parent_assets__/`, from a root chapter and from one in a subfolder (through `../`); an `https:` image, a `data:` image and `/root.png` → unchanged and not listed
- `test_prepare_markdown_missing_image` (clause 4): a missing file, `../outside.png`, a folder named as an image, `scan.heic` that exists, and (where symlinks are allowed) a link that resolves outside the root → each replaced so the chapter reads `[image not shown]`, each listed as kind `image` with its reference, nothing outside the root and no `.heic` among the returned files; a mark that replaced `![a](x.png)` directly before `(see below)` still parses as text
- `test_prepare_markdown_html_image` (clause 5): `<img src="plate.png">` → text unchanged, list holds kind `html-image`
- `test_prepare_word` (clause 7): the fixture as a root chapter and as `letters/paper` → `convertDocx()`'s title and list; images at `__tome_media__/<staged name>/…`; the nested chapter's reference begins `../`
- `test_prepare_unreadable_word` (clause 8): a text file named `broken.docx` → `prepareDocument()` throws naming it; `placeholderDocument()` → a chapter headed `broken` that reads `[document not shown]` and a list holding kind `document`
- `test_prepare_writes_nothing` (clause 9): the temp tree's listing and hashes are equal before and after each case above, the thrown error included
- Stubs: none

### T-070 unit tests
- **Intent:** [INT-0029](../../../intents/INT-0029-documents-as-tomes.md)
- `test_pages_lone_tome_without_root` (clause 1): one tome, chapters `a.md`, `b.md` → pages `''`, `a`, `b`; the `''` page's route is `a`'s (slug `a`, next `b`)
- `test_pages_rootless_in_library` (clause 2): two tomes, `notes` with chapters `a.md`, `b.md` only → pages include `notes`, `notes/a`, `notes/b`; the `notes` page carries `a`'s route; the Bibliotheca is still at `''`
- `test_pages_unchanged_otherwise` (clause 3): one tome with `README.md`, and two tomes that each have one → deep-equal to the expected present result
- `test_entries_rootless_tome` (clause 4): `bibliothecaEntries()` for the two tomes of clause 2 → `notes`'s href is `/notes/a`, and `tomePages()` holds a page with that route

### T-072 unit test
- **Intent:** [INT-0029](../../../intents/INT-0029-documents-as-tomes.md)
- `test_live_reload_notice` (clause 1): kinds `document` and `folder` → the same sentence, containing `restart`; kind `book` → `undefined`

### T-074 unit tests
- **Intent:** [INT-0029](../../../intents/INT-0029-documents-as-tomes.md)
- `test_tutorial_covers_documents` (clause 1): "Find Your Books" holds `.docx`, `.md`, `Google Docs`, `README.md`, `[equation not shown]`, `[figure not shown]`, `[image not shown]`, `[document not shown]`, `underlin`, `node_modules`, `restart`, a sentence on links between notes, and a `books:add` line that names a `.docx`
- `test_tutorial_commands_exist` (clause 2; existing): passes with the new section
- `test_config_template_mentions_documents` (clause 3): `tome.config.toml` mentions `.docx` in a comment and parses to no `[[book]]` entries

## Integration Tests
### Loader integration (T-065 + T-066 + T-068 + T-069; spawned loader, real temp folders, `--dest`)
- **Intents:** [INT-0029](../../../intents/INT-0029-documents-as-tomes.md)
- `test_loader_markdown_file` (T-069 clause 1): `TOME_BOOK=<tmp>/My Paper.md` → `<dest>/my-paper/README.md` equal to the source text, `SUMMARY.md` with one chapter, `book.meta.json` title = the first `#` heading
- `test_loader_word_file` (clause 1): `TOME_BOOK=<tmp>/paper.docx` → `README.md` with the converted text, the PNG under `__tome_media__/`, title = the Title
- `test_loader_document_titles` (clause 1): a manifest `title` and `slug` win over the document's own
- `test_loader_document_folder` (clause 2): a folder with `README.md`, `2-b.md`, `10-a.docx`, `letters/one.md`, a note with an image, and a stray `notes.pdf` → staged names and spine order per T-065, chapter titles from the documents, part title `letters`, meta title = the folder's name, the image under `__tome_parent_assets__/`, and no `notes.pdf` in the library
- `test_loader_word_images_apart` (clause 3): `a.docx` and `letters/b.docx`, each with an image → two image files in the library; each chapter's reference, resolved from the chapter's own folder, names an existing file, and the two are different files
- `test_loader_reports_left_out` (clause 4): stdout holds one line naming `paper.docx` and `2 equations`, and one naming a note and `1 image`; exit 0
- `test_loader_folder_unreadable_document` (clause 5): a folder with `good.md` and a text file named `broken.docx` → exit 0, both chapters in the spine, `broken.md` reads `[document not shown]`, stdout names `broken.docx`
- `test_loader_document_failure_keeps_library` (clause 6): a library published from the handbook, then a run with `TOME_BOOK` naming a corrupt `.docx`, and a run naming `old.doc` → nonzero, a message naming the path, the library's tree byte-identical, no `.stage-` residue
- `test_loader_sources_untouched` (clause 7): hashes of every source file equal before and after; the source folder's recursive listing unchanged
- `test_loader_book_unchanged` (clause 8): the published trees of `fixtures/handbook` and `fixtures/docs-book` (sorted relative paths and their contents, line endings normalized) hash to the digests recorded from the loader at commit `06cdbcd`, before any Sprint 24 source change; the digests are literals in the test
- existing `load-books.test.ts` cases (clause 8): pass; the only edit is `test_source_none_errors`'s folder, which holds `notes.txt` in place of `README.md`
- `test_loader_mixes_kinds` (clause 9): a manifest with the handbook and a `.md` file, and `TOME_BOOKS` with the handbook and a `.docx` → two tomes each time, distinct slugs
- Stubs: none

### `books:add` integration (T-065 + T-066 + T-068 + T-069 + T-071; spawned CLIs, temp folders)
- **Intents:** [INT-0029](../../../intents/INT-0029-documents-as-tomes.md)
- `test_books_add_documents` (clause 1): a `.md`, a `.docx` and a folder each append one `[[book]]` entry with the absolute path; the output names the same title the loader then writes to `book.meta.json` for that entry, and the chapter count; `--title`/`--slug` are written
- `test_books_add_document_dedupes` (clause 2): adding the same file twice → one entry, "already in"
- `test_books_add_rejects_unaccepted` (clause 3): `old.doc`, a folder with no documents, and a corrupt `.docx` given directly → nonzero, a message naming the path, manifest unchanged, `tome.config.toml` hash unchanged; a folder holding a good note and a corrupt `.docx` → added, exit 0, the output names the corrupt file
- `test_find_books_ignores_documents` (clause 4): a scan over a tree with loose documents and one mdBook → the JSON lists the mdBook only, with the present fields
- existing `find-books.test.ts` cases (clause 5): pass; the only edit is `test_books_add_rejects_invalid`'s `notes.md`, renamed `notes.txt`

### Gate safety (T-073)
- **Intents:** [INT-0029](../../../intents/INT-0029-documents-as-tomes.md)
- `test_fixture_commands_refuse_dirty_content` (clause 2; existing, with `check-documents.mjs` added to its list): on dirty tracked content the gate exits nonzero with "refusing destructive fixture sync", runs no build, and leaves status and index as they were
- `test_documents_gate_cleans_up_on_failure` (clause 2; in `fixture-commands.test.ts`, beside `test_fixture_gate_reports_build_failure`): the real `check-documents.mjs` in a disposable checkout whose build script fails → nonzero, the tracked sample as it was, and no temporary folder of the gate's left behind
- `test_ci_workflow_valid` (clause 3; existing, extended): the workflow matches `check-documents\.mjs`

### Dev server (T-072 clause 2; this machine, recorded in `sprint-tests/integration-tests.md`)
- **Intents:** [INT-0029](../../../intents/INT-0029-documents-as-tomes.md)
- `verify_dev_serves_document`: `npm run dev` with `TOME_BOOK` naming a `.md` file, and again naming the documents folder → `/` answers 200 with the document's heading and the server's output holds the notice; the document is then edited on disk, and after ten seconds the output holds no `synced` line and the page still shows the old text
- `check:livereload` (existing gate, unchanged): passes, so an mdBook's live reload is as before
- Not in CI, as the existing live-reload gate is not; the decision itself is covered in CI by `test_live_reload_notice`

### Real paper, early (T-066 Notes)
- **Intents:** [INT-0029](../../../intents/INT-0029-documents-as-tomes.md)
- `verify_real_paper_converts`: if the owner has given a paper when T-066 passes, `convertDocx()` is run on it outside the repository and its headings, notes, tables, images, marks and reader messages are counted and recorded in `sprint-tests/integration-tests.md`; a fault found is fixed in the build with a fixture variant that shows it. If no paper has been given, this is recorded as not run and the reading happens at the Test phase.

## End-to-End Tests
- **Status:** possible
- `npm run check:documents` (T-073 clause 1) builds the site on a temporary copy of `fixtures/papers/` plus the built Word fixture (at the root and in `letters/`) and runs `e2e/documents.spec.ts` in Chromium:
  - `test_documents_root_and_sidebar` (clause 4): `/` shows the first note's heading; the sidebar lists the notes in order, the Word paper, and the part title `letters` with its documents. Pass: all visible, in that order.
  - `test_documents_word_chapter` (clause 5): one `h1` with the Title; the rail lists `The Quarry`, `Tools`, `Washing in H2O` and `The Measure` and does not list `Links` (a Heading 3); clicking the footnote reference brings the note into view and its back-link returns to the reference; the table has `th` cells reading `Tablet` and `Weight`; the image's `naturalWidth` > 0; a `sup` holds `2`; `[equation not shown]` is visible twice.
  - `test_documents_nested_word_image` (clause 6): in `letters/`'s Word chapter the image's `naturalWidth` > 0.
  - `test_documents_no_unsafe_links` (clause 7): no `a[href^="javascript:"]` or `a[href^="file:"]` on the page; "the trapdoor" and "the cellar" are visible as text.
  - `test_documents_search` (clause 8): searching a word found only in the Word paper offers its chapter, and choosing it opens that chapter.
  - `test_documents_markdown_images` (clause 9): the note's image has `naturalWidth` > 0, and `[image not shown]` is visible where the note points to a missing file.
- In the same gate, on the built `dist/`, without a browser:
  - `check_documents_search_index_unique` (clause 8): `search-index.json` holds one record per chapter of the tome and no URL twice.
  - `check_documents_heading_ids` (clause 8): every heading slug in the Word chapter's record (`washing-in-h2o` among them) is an `id="…"` in that chapter's built page.
  - `check_documents_bibliotheca` (clause 10): a second build with `TOME_BOOKS` naming the handbook and the documents folder → `dist/index.html` names both tomes; the documents tome's link there resolves to an `index.html` that exists in `dist/`; and so does `dist/<slug>/index.html`, the page its sidebar title links to.
- After the cases the gate rebuilds the default library; the default `npx playwright test` suite then passes unchanged.
- CI runs `check:documents` beside the three existing gates.
- **By eye (owner), with a checklist.** One or more real papers from Word or a Google Docs download, added with `books:add` and read in Light, Dark and Sanguine Atonement. Between them the papers must hold headings, a footnote, a table and an image; a reading where any of those four is "not in the paper" does not count, and another paper is asked for. For each of the following the test report records present-and-right, present-and-wrong, or not in the paper: the title as the page's heading; sections in the rail; a list; a table with its header; a footnote there and back; an image; superscript or subscript; a web link; a cross-reference shown as text; an equation's mark and the load's count of them; a chart's mark; anything the load reported as not recognised; and anything in the paper that is absent from the page with no mark. This stands in for a fixture saved from a real Word file, which is not committed because the paper is the owner's own. INT-0029 is not marked realized if this reading shows a fault the fixtures missed.
