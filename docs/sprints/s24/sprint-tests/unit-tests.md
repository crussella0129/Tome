# Sprint 24 Unit Verification

- **Tested head:** `36b5db1` (the ten tasks, then four rounds of Test-phase
  fixes). `npx vitest run` on this Windows machine: **30 files, 258 tests:
  257 passed, 0 failed, 1 skipped**. Before the sprint the suite was 27
  files, 178 tests.
- **Every test has passed at that head on one platform or the other.** Two
  cases depend on the file system. The loader case for a note named
  `Summary.md` needs one that tells it from `SUMMARY.md`: skipped here, run
  in CI on Linux. The staging case for a drive-letter path with backslashes
  needs drive letters: run here, skipped in CI. The CI run, its head and its
  totals are in `test-report.md`.
- At the build's last task (`ef6d924`) the suite was 238/238, in two
  consecutive full runs. The twenty tests since then came from reading real
  Word files and from the four test reviews recorded in
  `critique-round-1.md`, `critique-round-2.md`, `critique-round-3.md` and
  `critique.md`.
- `npx astro check`: 0 errors, 0 warnings, 0 hints.
- No stubs anywhere in the new tests: they run the real Word reader on a real
  `.docx` zipped from `fixtures/word/paper/`, the real Markdown parser, and
  real temporary folders.

New and changed files, with their counts:

| File | Tests | Task |
|---|---|---|
| `document-source.test.ts` (new) | 11/11 | T-065, T-072 |
| `docx-to-markdown.test.ts` (new) | 27/27 | T-066 |
| `search-index.test.ts` | 10/10 (7 new) | T-067 |
| `document-stage.test.ts` (new) | 10/10 | T-068 |
| `book.test.ts` | 11/11 (4 new) | T-070 |
| `tutorial.test.ts` | 5/5 (2 new) | T-074 |
| `ci-workflow.test.ts` | 1/1 (extended) | T-073 |

## T-065 — sources, order, names, the spine

| Test | Clause | Result |
|---|---|---|
| `test_source_book_delegates` — both mdBook fixtures give kind `book` with `resolveBookSource()`'s fields; a `book.toml` with a missing `src`, and one with no spine beside loose `.md`, fail as books | 1 | pass |
| `test_source_document_kinds` — `paper.md` and `Paper.DOCX` | 2 | pass |
| `test_source_folder_walk` — three levels deep; dot-folder, dot-file, `node_modules`, `target`, `dist`, `vendor`, `venv`, `__pycache__`, `site-packages`, three kinds of nested mdBook (spine at root, `book.toml`, spine under `docs/`) and a Word lock file all left out; the exact list, staged names and parts asserted | 3 | pass |
| `test_source_folder_walk` (symlinks) — neither a linked folder nor a linked file is read; ran on this machine, not skipped | 3 | pass |
| `test_source_refusals` — missing path and document-less folder keep `SUMMARY.md` and `Tried:`; a missing `.docx`/`.md` says "file not found"; `.doc`, `.txt`, `.pdf` name what is accepted | 4 | pass |
| `test_source_order` — folder first, `README` over `index`, `2-b` before `10-a`, case ignored | 5 | pass |
| `test_source_order` (Word) — `README.md` opens before `README.docx`; `index.docx` alone opens; `README.docx` opens before `index.md` | 5 | pass |
| `test_source_staged_names` — six sets through the real `hrefToSlug()`; and by name: `my-notes-1.md`, `a-2.md`, `index-2.md`, `summary-2.md`, `sub/index-2.md`, `sub/readme-2.md` | 6 | pass |
| `test_spine_round_trip` (two cases) — the real `parseSummary()` reads back title, prefix page, numbered chapters and parts; `Notes [draft]` → `Notes (draft)`; a tome of parts only | 7 | pass |

## T-066 — a Word document to Markdown

| Test | Clause | Result |
|---|---|---|
| `test_docx_fixture_builds` — the zip's entries equal the parts' paths | 1 | pass |
| `test_docx_text_and_inline` — text, bold, emphasis, strikethrough, both lists, `https:` and `mailto:` links; underlined words plain | 2 | pass |
| `test_docx_heading_levels` (a) Title + Heading 1/2/3 | 3 | pass |
| `test_docx_heading_levels` (a′) Heading 6 stays at level 6 | 3 | pass |
| `test_docx_heading_levels` (b), (c), (d) — the three no-Title cases, levels and returned title | 4 | pass |
| `test_docx_footnotes` — `[^1]`, `[^e1]`, their definitions; no `<sup>[^`, no `↑`, no numbered list of notes | 5 | pass |
| `test_docx_table_header` — `Tablet \| Weight` is the header; three table lines in all | 6 | pass |
| `test_docx_superscript_subscript` — `x<sup>2</sup>`, `H<sub>2</sub>O`; never `x2`, `H2O` | 7 | pass |
| `test_docx_unsafe_links` — exactly two links survive, the web and the mail one | 8 | pass |
| `test_docx_marks_are_literal` — the chapter reads `Density is [equation not shown](see the table)`; no link, reference or definition holds a mark | 9 | pass |
| `test_docx_equations_marked` — two marks, `{ kind: 'equation', count: 2 }` | 10 | pass |
| `test_docx_figures_marked` — a chart and a diagram marked and counted; the picture still a picture; a text box keeps its words; a plain shape leaves no mark and no entry | 11 | pass |
| `test_docx_images` — the PNG byte-equal, referenced under the media path | 12 | pass |
| `test_docx_unsupported_image` — EMF marked, listed as `image/x-emf`, no `other` entry beside it | 12 | pass |
| `test_docx_reader_messages` — an unknown element listed as `other`; an unmapped style, and a style named but never defined, kept as text and not listed | 13 | pass |
| `test_docx_decoration_is_silent` — a font, colour, size and highlight, a comment, a header, a bookmark, and `REF`, `PAGEREF` and `HYPERLINK \l` fields: words kept, the header's and comment's words absent, no link formed, nothing reported | 13, AC4 | pass |
| `test_docx_reader_messages` (the word "style") — a symbol in a font named "Bookman Old Style" that the reader cannot map is listed as `other` | 13 | pass |
| `test_docx_reader_messages` (what is passed over) — a bookmark between two table rows, one between two cells, and an undefined style whose ID holds a space leave no report, and the test proves the row bookmark was inserted; a picture the document links to and does not hold is listed, with no image and no mark | 13 | pass |
| `test_docx_line_breaks` — a Title set over two lines is returned, and written, as `On the Weight of Obsidian`; a heading with a break is written on one line, `## The Quarry Northern Face`; a break in a paragraph and a break before a superscript are `<br>`, with no stray backslash | AC2, AC3 | pass |
| `test_docx_line_breaks` (page and column breaks) — a page break inside a paragraph, inside the Title and inside a table cell, and a column break inside a paragraph: `<br>` in the paragraph and the cell, a space in the Title, and no two words run together | AC2, AC3 | pass |
| `test_docx_heading_levels` (in a table) — a Title inside a cover table still heads the chapter, once and first, with Heading 1 at `##` and the cover table kept; with no Title and the only Heading 1 in a table, the file's name is the one top heading | 3, 4 | pass |
| `test_docx_block_quotes` — Quote, Intense Quote and Block Text paragraphs are block quotations, two adjacent ones in one: three in all | AC3 | pass |
| `test_docx_table_cells_stay_one_line` — two paragraphs in one cell and two lists in another: three table lines, `<br>` between the cell's lines | AC3 | pass |
| `test_docx_table_cells_stay_one_line` (a quotation, a nested list and a table in a cell) — still three table lines of two cells; the quotation's paragraphs, the indented nested item, and the inner table one line to a row, appearing once | AC3 | pass |
| `test_docx_source_untouched` — hashes and folder listing equal after a success and after a thrown error naming the file | 14 | pass |

What the plain-shape case recorded: the Word reader returns the text on both
sides of the drawing and no message. INT-0029's consequence ("the Word reader
gives no sign of it") rests on that.

The block quotation and table cell rows have no clause of their own in the
locked plan. They were added at the Test phase when files saved by Word itself
showed block quotations lost and a table broken by a list in a cell; the plan
provided for that ("a fault found is fixed … with a fixture variant that shows
it"), and INT-0029's criterion 3 and consequences were amended first.

## T-067 — search text

| Test | Clause | Result |
|---|---|---|
| `test_search_text_drops_tags` (text) — the whole text is `x2 and b block words` | 1 | pass |
| `test_search_text_drops_tags` (formula) — `Washed in H2O, area x2.` | 1 | pass |
| `test_search_text_drops_tags` (what parts words) — `alpha<br>beta gamma` → `alpha beta gamma`; `<br/>`, `<br />` and `<img>`; a two-line table cell; `<hr>` inside a list item and inside a quotation; adjacent cells of an HTML table; a joining tag inside a block of HTML; a `span` inside a word; a tag at a paragraph's end joining nothing across blocks | 1 | pass |
| `test_search_text_drops_tags` (heading) — `Washing in H2O`, slug `washing-in-h2o` | 2 | pass |
| `test_search_text_drops_tags` (heading) — `## Alpha<br>Beta` reads `Alpha Beta` and is slugged `alphabeta`; a heading with a Markdown line break reads `The Quarry Northern Face` and is slugged `the-quarrynorthern-face`, as the page's id is; a `>` inside an attribute or a comment does not end the tag (`a-c-d`, `a--b`) | 1, 2 | pass |
| `test_search_text_drops_tags` (line breaks) — `m<sup>2</sup>` then `<br>`, a backslash break or two trailing spaces, then `Volume five` → `Area 20 m2 Volume five`; a break before an opening tag; an `<img>` whose attribute holds `>`; a comment holding `>` | 1 | pass |
| `test_search_text_drops_tags` (what joins) — `<sup>2</sup>Guild of Masons` → `2 Guild of Masons`; `<sup>a</sup>Corresponding author` → `a Corresponding author`; a bracket or a comma before the tag does not join (`( a Corresponding author)`, `1 , 2 Department of Stone`); `H<sub>2</sub>O and CO<sub>2</sub>.`; nested joining tags; `<wbr>` and `<wbr/>`; uppercase tag names | 1 | pass |
| the three existing `search-index.test.ts` cases, unedited but for one line the formatter re-wrapped (no assertion changed) | 3 | pass |

## T-068 — one document made ready

| Test | Clause | Result |
|---|---|---|
| `test_prepare_markdown_title` — heading, then front matter, then file name; well-formed and malformed front matter left out; a lone `---` kept | 1, 2 | pass |
| `test_prepare_markdown_images` — inline and by reference, PNG and SVG, from the root and from a subfolder; web, `data:` and root-absolute left alone | 3, 6 | pass |
| `test_prepare_markdown_missing_image` — missing, outside, a folder, `.heic`, a missing reference-style image: five marks, five entries, no file returned; a mark before `(see below)` is text | 4 | pass |
| `test_prepare_markdown_missing_image` (symlink) — a link resolving outside the root is not followed; ran, not skipped | 4 | pass |
| `test_prepare_markdown_missing_image` (full paths) — a drive-letter path and a `file:` address, each inside the root (staged) and outside it (marked and listed) | 4 | pass |
| `test_prepare_markdown_html_image` — text unchanged, kind `html-image` | 5 | pass |
| `test_prepare_word` — title and list from the conversion; media under the chapter's own folder; `../` from a nested chapter | 7 | pass |
| `test_prepare_unreadable_word` — throws naming the file; the placeholder reads `[document not shown]` | 8 | pass |
| `test_prepare_markdown_missing_image` (backslashes and `%20`) — a drive-letter path written with backslashes, and one percent-encoded, are both staged; a missing one is marked. Runs where full paths begin with a drive letter (this machine); skipped elsewhere | 4 | pass |
| `test_describe_left_out` — the words for an equation, a chart or diagram (singular and plural), images, and unrecognised elements with their names; the words for an unreadable document and an HTML image are asserted in `test_prepare_unreadable_word` and `test_prepare_markdown_html_image` | T-069 clause 4, AC4 | pass |
| `test_prepare_writes_nothing` — not a test of its own: every case above takes a hash of every file in its temporary tree before and after, the thrown error included | 9 | pass |

## T-070 — a tome's own address

| Test | Clause | Result |
|---|---|---|
| `test_pages_lone_tome_without_root` | 1 | pass |
| `test_pages_rootless_in_library` | 2 | pass |
| `test_pages_unchanged_otherwise` | 3 | pass |
| `test_entries_rootless_tome` | 4 | pass |
| the seven existing `book.test.ts` cases, unedited | 3 | pass |

## T-072 — the dev notice

| Test | Clause | Result |
|---|---|---|
| `test_live_reload_notice` | 1 | pass |

## T-074 — the guide

| Test | Clause | Result |
|---|---|---|
| `test_tutorial_covers_documents` — sixteen topics and a `books:add` line naming a `.docx`, in the guide and in the README | 1 | pass |
| `test_tutorial_commands_exist` (existing) | 2 | pass |
| `test_config_template_mentions_documents` | 3 | pass |

## Departures from the test plan

- `docx-to-markdown.test.ts` and `document-stage.test.ts` run in the default
  (jsdom) environment, not the node one the plan named, for the reason in the
  sprint metadata. They use the file system all the same.
- `vitest.config.ts` sets `testTimeout: 20_000`. An existing test that runs
  the loader four times once took 6 s in the fuller suite. No assertion
  changed.
- Search text: the plan's clause said a chapter's text holds "every word that
  stood between the tags". The first review showed a tag within a line
  splitting a word in two (`H 2 O`). The first fix joined across every tag,
  which the second review showed joining separate words across a line break;
  the third showed the same across Markdown's own line break and after a
  leading superscript. The rule now: a tag that sits inside a word joins what
  it holds to text hard against it before, and to the text after only if that
  first join happened; a line break and any other tag part their neighbours.
  The limits that remain are stated in INT-0029's consequences.
- A Word line break is written `<br>` in a paragraph or a table cell, where
  the first build wrote Markdown's backslash break, and as a space in a
  heading or a title.
