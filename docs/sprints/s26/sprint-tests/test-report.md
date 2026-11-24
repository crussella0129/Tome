# Sprint 26 Test Report

## Intent Verification
| Intent | Acceptance criterion | EARS / tests | Result | Intent evidence update |
|--------|----------------------|---------------|--------|------------------------|
| [INT-0033](../../../intents/INT-0033-latex-and-typst-documents.md) | AC1 — a library entry may name a `.tex` or `.typ` file and a folder may hold them; a paper of several files is one chapter; `books:add` takes them | T-086, T-087, T-092, T-093 / `test_source_paper_formats`, `test_source_one_paper`, `test_source_fragments_left_out`, `test_source_only_fragments_refused`, `test_source_subfiles_part`, `test_source_typst_include_in_code`, `test_source_typst_commented_include`, `test_pandoc_own_files`, `test_pandoc_typst_tree`, `test_pandoc_typst_parent_path`, `test_pandoc_typst_many_files`, `test_pandoc_typst_files_from_variables`, `test_prepare_paper`, `test_loader_papers`, `test_books_add_paper`; gate `check_papers_routes`; E2E `test_papers_sidebar` (Chromium and WebKit) | pass | Test evidence links this report |
| [INT-0033](../../../intents/INT-0033-latex-and-typst-documents.md) | AC2 — title, authors, date and abstract; sections as headings; lists, tables, figures with pictures and captions, footnotes, quotations, code, theorem and proof blocks | T-088, T-092, T-093 / `test_paper_title`, `test_paper_front_matter`, `test_paper_other_properties`, `test_paper_node_rules`, `test_paper_table`, `test_paper_table_spans`, `test_paper_figure`, `test_paper_own_blocks`, `test_paper_text_stays_text`, `test_prepare_paper_images`, `test_prepare_paper_pictures_by_path`, `test_prepare_paper_pictures_same_name`, `test_prepare_paper_picture_named_argument`, `test_pandoc_code_untouched`; E2E `test_papers_latex`, `test_papers_typst` | pass | Test evidence links this report |
| [INT-0033](../../../intents/INT-0033-latex-and-typst-documents.md) | AC3 — formulas laid out as INT-0030 lays them out; one that cannot be is marked and counted | T-088 / `test_paper_formula_one_line`, `test_paper_formulas`, `test_paper_formula_set_apart_in_emphasis`, `test_paper_formulas_read_back`, `test_paper_formula_refused_is_marked`, `test_paper_cell_double_bar`; E2E `test_papers_latex`, `test_papers_typst` (every formula a `math` element) | pass | Test evidence links this report |
| [INT-0033](../../../intents/INT-0033-latex-and-typst-documents.md) | AC4 — references lead where they say and show what they refer to; an equation's reference its number; citations their entry | T-089, T-090, T-091 / `test_paper_references`, `test_paper_caption_numbers`, `test_paper_equation_reference`, `test_paper_item_label`, `test_paper_typst_references`, `test_paper_typst_colon_labels`, `test_paper_typst_label_after_shorter`, `test_paper_own_link_to_label`, `test_math_label_link`, `test_math_label_link_words`, `test_math_label_rows`, `test_math_numbered_labels`, `test_paper_citeproc_citations`, `test_paper_reference_list`, `test_paper_own_bibliography`, `test_paper_own_bibliography_heading_kept`, `test_paper_list_heading_words`, `test_pandoc_bibliography`; E2E `test_papers_latex`, `test_papers_typst` | pass | Test evidence links this report |
| [INT-0033](../../../intents/INT-0033-latex-and-typst-documents.md) | AC5 — what cannot be carried over is marked and named; a reference or citation that leads nowhere is shown and counted; a refused document is a chapter that says so; nothing vanishes without a word | T-087, T-088, T-089, T-091, T-092, T-093 / `test_pandoc_skipped_once`, `test_pandoc_skipped_placed`, `test_pandoc_skipped_not_placed`, `test_pandoc_environment_with_option`, `test_pandoc_crlf`, `test_pandoc_commented_begin`, `test_pandoc_asked_again`, `test_pandoc_refused`, `test_pandoc_input_cycle`, `test_paper_skipped_marked`, `test_paper_layout_commands_quiet`, `test_paper_reference_not_followed`, `test_paper_own_link_nowhere`, `test_paper_citation_no_entry`, `test_prepare_paper_hayagriva`, `test_paper_list_heading_keeps_content`, `test_paper_formula_beside_list`, `test_left_out_paper_words`, `test_read_documents_refused_paper`, `test_loader_reports_papers`, `test_books_add_refused_paper`; gate `check_papers_output`; E2E `test_papers_refused` | pass | Test evidence links this report |
| [INT-0033](../../../intents/INT-0033-latex-and-typst-documents.md) | AC6 — the source is never changed; nothing outside the paper's folder is read; nothing is fetched; the reader is loaded only for a paper | T-087, T-092 / `test_pandoc_writes_nothing`, `test_pandoc_reads_only_its_folder`, `test_pandoc_fetches_nothing`, `test_pandoc_loaded_on_call`, `test_read_documents_no_paper_no_pandoc`, `test_loader_paper_source_unchanged`, `test_prepare_paper_images`; `test_pandoc_today`, `test_pandoc_today_after_percent`, `test_pandoc_today_after_nolinkurl` (the build's day is never written) | pass | Test evidence links this report |
| [INT-0033](../../../intents/INT-0033-latex-and-typst-documents.md) | AC7 — the tutorial and the README say what is read, what is marked, the Typst limit, and the reader's licence | T-094 / `test_tutorial_covers_papers`, `test_tutorial_equation_reference`, `test_readme_names_pandoc`, `test_books_library` | pass | Test evidence links this report |
| [INT-0029](../../../intents/INT-0029-documents-as-tomes.md) | Boundary — Markdown, Word and mdBook sources found, staged and reported as before | the earlier cases of `document-source`, `document-stage`, `docx-to-markdown`, `load-books`, `find-books` unedited; `check:documents`' three earlier builds and `e2e/documents.spec.ts` unedited | pass | none |
| [INT-0030](../../../intents/INT-0030-mathematics-and-code.md) | Boundary — a formula no link reaches is laid out, numbered and refused as before | `test_math_label_unreached`, `test_math_no_link_no_change` (two kept trees from before T-090); the earlier `rehype-math` cases unedited; `check:math` 22 of 22 | pass | none |
| [INT-0008](../../../intents/INT-0008-in-book-search.md) | AC2 — a match within a section opens that section (T-093 clause 6) | `test_papers_search` shows search opens a section for a match in a heading's words and the chapter for a match in its text | not met: carried by backlog task T-096 | none |

## Summary
- Unit and integration tests (Vitest): **457 tests in 37 files. 456 passed
  and 1 skipped on Windows; the same in CI on Linux; 0 failed.** The skip
  is the loader case for a note named `Summary.md`, which needs a file
  system that tells it from `SUMMARY.md`; on Linux it runs and the staging
  case for a drive-letter path is skipped instead. Before the sprint the
  suite was 337 tests in 35 files.
- E2E tests (Playwright): in the documents gate, **6 passed** on the Word
  and Markdown folder (Chromium, as before) and **10 passed / 0 failed** on
  the papers, the same five tests in Chromium and in WebKit; **22 passed**
  in the mathematics gate (both engines); **40 passed** on the default
  library; **3 passed** in the external-book gate; **7 passed** in the
  desktop app (Electron, this machine only).
- Build gates: `check:documents`, `check:math`, `check:external`,
  `check:multibook`, `check:search` each exit 0, locally and in CI.
- `astro check`: 0 errors, 0 warnings.
- CI status: green (below).

## CI Confirmation
- **Head SHA:** `ec59737`, the tested code (every commit after it holds
  records only).
- **CI run:** 45473215105 (https://github.com/crussella0129/Tome/actions/runs/45473215105).
- **Conclusion:** success. The runs at each earlier tested head were green
  too: 45449718557 at `8353ba9`, 45460599662 at `21ad786`, 45464311382 at
  `2c27689`, 45470222548 at `98e138e`, 45472134668 at `e897481`.
- **Confirmations:** the local whole-suite and gate runs at `ec59737` are
  recorded in `unit-tests.md` and `e2e-tests.md`.

## Failures
None at the tested code. The Test phase found faults no planned test had
tried, in five reviews of the tests and a check of the last; each was
corrected with a test, as `critique-round-1.md` to `critique-round-4.md` and
`critique.md` record, and as `sprint-meta.md` (Blockages) summarises. The
design stands: pandoc reads the paper, and Tome writes the chapter.

## Technical Debt Identified
- [INT-0008](../../../intents/INT-0008-in-book-search.md) — T-096: a word
  found in a section's text opens that section. T-093 clause 6 asked for it
  and is not met.
- [INT-0030](../../../intents/INT-0030-mathematics-and-code.md) — T-095: a
  `multline` of two lines is shown with two numbers.
- [INT-0033](../../../intents/INT-0033-latex-and-typst-documents.md) — what
  the reader finds by pattern and not by a parser (recorded in its
  Consequences): raw text over a line end, a fence of backticks in a
  comment, a Typst line of prose beginning `import "…"`, a cycle made
  through a command or a variable (the build does not finish), a BibTeX key
  with a colon in a Typst paper. Bounding a reading's time needs pandoc run
  apart from the build, in a worker.

## Coverage Observations
- No paper written by anyone but this sprint's author and its reviewers has
  been read. The reviewers wrote and read about two hundred papers of their
  own between them, in LaTeX and Typst, and every fault they found is
  answered or recorded.
- Not run: Safari itself, Firefox, the Tauri app's window; `check:livereload`,
  which this sprint's changes do not reach.
- By eye: both fixture papers in Light, Dark and Sanguine Atonement, in both
  engines, captured at `8353ba9` into `evidence/`. The answers to the
  reviews did not change the fixtures' pages: the kept trees of both papers
  are what `readPaper()` gives at `ec59737`, and the ten browser tests pass
  there unedited.
- Paragraphs of a paper stand close together on the page, as in any chapter
  (the reader's existing spacing); the fixture's picture is 24 pixels wide.
