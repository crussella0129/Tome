# Sprint 26 Integration Verification

- **Tested code:** `c9f4e2e`, at the head `98e138e`. The Vitest cases
  below ran in the whole-suite run recorded in `unit-tests.md` (452 tests,
  451 passed, 1 skipped), on this Windows machine and in CI on Linux (run
  45470222548). The tables first describe the cases written in the build;
  those written to answer the reviews follow at the end.
- Every case here uses pandoc itself (`pandoc-wasm` 1.1.0, pandoc 3.10), real
  temporary folders, and, for the loader and `books:add`, the program spawned
  as a process.

## Pandoc on the fixtures (T-087; `pandoc-read.test.ts`, 10 cases)

| Test | Clause | What it showed |
|---|---|---|
| `test_pandoc_latex_tree` | 1 | `fixtures/latex/paper.tex` reads to a tree with `abstract`, `author`, `date` and `title`, 16 or more formulas, and a reference to `sec:result` reading `2`; with a fixed word for each piece it equals `papers/latex-tree.json`, the tree the unit tests use |
| `test_pandoc_own_files` | 2 | the headers `Appendix` (from `appendix.tex`) and `Closing` (from `sections/closing.tex`) are in the tree, `missing` is empty, and `\appcmd{y}` has `source: 'appendix.tex'`. In a paper made for the test: a `\input` and a `\include` from `sections/`, a file two folders down that the first pulls in, and a local `house.sty` are read; `../outside.tex`, `absent.tex` and a file whose name a command of the paper's makes (`\sec{viamacro}`) are in `missing` and their words are not in the tree; no `.sty` is in `missing`; a piece skipped in `sections/closing.tex` has that path as its `source` |
| `test_pandoc_bibliography` | 3 | `\bibliography{refs,more}` with `refs.bib` beside the paper: a link to `#ref-gauss`, a list `refs`, and `missing` is `['more.bib']`; the file in `bib/`: the same link and nothing missing; no `.bib` at all: one `Cite`, no list, both names in `missing`, and the paper is read; the Typst fixture: a link to `#ref-gauss` and a list |
| `test_pandoc_skipped_placed` | 4, 5 | the fixture's `skipped` holds one entry each for `\mycmd{x}`, `\maketitle`, `\appcmd{y}`, `\bibitem{gauss}` and the list's `\begin` and `\end`, two for `\centering`, one for `\quad`, and one for the `tikzpicture`, whose three lines are typed with a tab before each; every entry has a line, one of the paper's three files as its `source`, `placed: true`, and its word in the tree; no two entries share a file, a line and their contents. `\institute{Somewhere}` before `\begin{document}` has `placed: false` |
| `test_pandoc_today` | 6 | the fixture's `\date{\today}`: an entry with `contents` `\today`, placed, and `meta.date` is that entry's word and nothing else. In a paper made for the test, `Written \today.` holds the word and no year of the build, and `\verb|\today|` and a `verbatim` block each stay code reading `\today`, with one entry in all |
| `test_pandoc_typst_tree` | 7 | `fixtures/typst/paper.typ`: `skipped` empty; the headers `Appendix` and `Closing` (from `parts/closing.typ`); `so, loudly!`, which the function of `lib/house.typ` writes; 15 or more formulas; equal to `papers/typst-tree.json`. In a copy, `parts/closing.typ` includes `deeper/last.typ` and its words are read; `#include "/parts/closing.typ"` is read from the paper's folder |
| `test_pandoc_refused` | 8 | `uses-a-package.typ` rejects with `PaperRefused` and `HOME not defined`; a call to a function pandoc does not carry, with its name and `line 3`; an include of `parts/absent.typ`, with that name; LaTeX with an unclosed `\begin{document`; no message holds the temporary folder, the repository's path, or a stand-in name |
| `test_pandoc_reads_only_its_folder` | 9 | for the LaTeX fixture, the Typst fixture and a paper that says `\input{../outside}`, every file the module opens (recorded by the wrapper round `node:fs/promises`) lies in the paper's folder, and at least one is opened |
| `test_pandoc_writes_nothing` | 9 | names, sizes, bytes and modification times of every file under a copy of both fixtures are the same after two papers are read and one is refused |
| `test_pandoc_fetches_nothing` | 9 | with `fetch` and `net.Socket.prototype.connect` replaced by functions that count and throw, both fixtures are read and the count is 0 |

## A paper through the stage (T-088 to T-092; `document-stage.test.ts`, 5 cases)

| Test | Clause | What it showed |
|---|---|---|
| `test_prepare_paper` | T-092 1 | the LaTeX fixture through `prepareDocument()`: title `A Short Paper on Sums`; headings in order `A Short Paper on Sums`, `Introduction`, `The result`, `Lists and a table`, `Appendix`, `Closing`, `References`; 16 or more formulas, each `readable()` where it stands; one table, one footnote; `[LaTeX not shown]` three times; `and set x y apart.`; `leftOut` is three `latex` (one `\appcmd` with `appendix.tex`), one `command` (`\today`), one `reference`, one `citation`, and nothing naming `quad`. The Typst fixture: the same title, 15 or more formulas, an empty `leftOut`, and nothing reading `not shown` |
| `test_prepare_paper_images` | T-092 2 | `figures/triangle.png` and `figures/triangle` both point at `../__tome_parent_assets__/latex/figures/triangle.png`, staged once with the picture's bytes; `figures/chart.pdf`, `figures/absent.png` and `../shared/x.png` (a real picture in the entry's folder, outside the paper's) are each `[image not shown]` with an `image` entry naming it; `https://example.org/a.png` is left as written; with `\graphicspath{{figures/}}`, `triangle` is found; with `\graphicspath{{../shared/}}`, `x` is not, and nothing is staged |
| `test_prepare_paper_missing_include` | T-092 3 | `\input{absent}` gives `{ kind: 'include', count: 1, detail: 'absent.tex' }`, told as `1 file it pulls in that was not found (absent.tex)` |
| `test_read_documents_refused_paper` | T-092 5 | a folder of a note, a paper, `uses-a-package.typ` and a `.tex` file removed after the folder was walked: four chapters; the refused one is titled `uses-a-package`, reads `[document not shown] uses-a-package.typ could not be read as a Typst document.`, and its report holds `the whole document (it could not be read: ` and `HOME not defined`; the removed file's chapter says `LaTeX`; the paper between them reports nothing |
| `test_prepare_paper_refused_alone` | T-092 5 | `readDocuments()` on a source naming `uses-a-package.typ` alone rejects with an error named `PaperRefused` holding `HOME not defined` |

## A paper through the loader and `books:add` (T-092; `load-books.test.ts`, 4 cases; `find-books.test.ts`, 2)

| Test | Clause | What it showed |
|---|---|---|
| `test_loader_papers` | T-092 1 | a folder holding copies of both fixtures: the spine is the folder's name, the part `latex` with `A Short Paper on Sums`, and the part `typst` with `A Short Paper on Sums` and `uses-a-package`, and nothing else; `latex/` holds `paper.md` alone and `typst/` two chapters; the LaTeX chapter holds `## Appendix` and `## Closing`, the Typst one `so, loudly!`; each paper's picture is staged under its own folder's name with the fixture's bytes, and its chapter points there; the refused chapter says it could not be read as a Typst document |
| `test_loader_reports_papers` | T-092 6 | two lines hold `left out`. The LaTeX paper's: `3 pieces of LaTeX not shown`, `tikzpicture`, `\mycmd`, `\appcmd in appendix.tex`, `1 command not read (\today)`, `1 reference that could not be followed (nowhere)`, `1 citation with no entry (missing)`, and no `quad`. The refused file's: `the whole document` and `HOME not defined`. None for `typst/paper.typ` |
| `test_loader_paper_source_unchanged` | T-092 8 | every file under the papers' folder has the hash and the modification time it had before the load, and the load wrote nothing beside its own output folder |
| `test_loader_paper_alone` (beyond the plan) | T-092 5 | one paper named on its own is a tome of one chapter titled by the paper; the refused document named on its own stops the load with a non-zero exit, `HOME not defined` on standard error, and nothing published |
| `test_books_add_paper` | T-092 7 | `books:add` on `paper.tex` prints `Added "A Short Paper on Sums" (1 chapter) to tome.local.toml.` and writes its path to the manifest |
| `test_books_add_refused_paper` | T-092 7 | on a folder of a note, a broken `.docx` and `uses-a-package.typ`: three chapters; `uses-a-package.typ could not be read as a Typst document and will not be shown.`; `broken.docx could not be read as a Word document and will not be shown.`, the words it had before |
| the earlier cases of `load-books.test.ts`, `find-books.test.ts`, `document-stage.test.ts` | T-092 4, 9; INT-0029 | pass unedited (one of the loader's is skipped on Windows, as before the sprint) |

## The gate as a program (T-093; `fixture-commands.test.ts`)

| Test | Clause | What it showed |
|---|---|---|
| `test_papers_e2e_mode` | T-093 8 | `npx playwright test --list` with `TOME_PAPERS_E2E=1` names `papers.spec.ts` alone, five tests in Chromium and five in WebKit; with `TOME_DOCUMENTS_E2E=1`, `documents.spec.ts` alone in the default engine; with no mode, the four default specs; the config names four ports, all different |
| `test_fixture_commands_refuse_dirty_content` (existing) | T-093 9 | `check:documents` still refuses to start on uncommitted library content and restores the library after, unedited |

## Departures from the test plan, in these tests

- **`test_loader_no_paper_no_pandoc`** of an earlier draft was replaced in
  the locked plan by `test_read_documents_no_paper_no_pandoc`, which runs
  in the test's own process (`unit-tests.md`); the loader's own unchanged
  output is held by its earlier cases, unedited.
- **`test_pandoc_typst_tree`'s "with each stand-in name turned back"** needs
  no turning back: no stand-in name reaches the tree, so the tree is
  compared as it is.
- **A symbolic link** in `test_pandoc_own_files` is made only where the
  system allows one, and the assertion that the linked file is not read
  (`missing` holds `linked.tex`) runs only then. This Windows machine
  allows it (tried), and so does CI's Linux, so the assertion ran in both.

## Tests added in answer to the reviews (real pandoc, through the stage)

| Test | Answers | What it shows |
|---|---|---|
| `test_prepare_paper_hayagriva` | round 1 C-005 | a Typst paper with a `.yml` bibliography: citations are keys in brackets, each counted once, and no `References` heading over nothing |
| `test_prepare_paper_pictures_by_path` | round 1 C-007 | a Typst picture named from `/` and one beside an included file are staged; a LaTeX picture at `/home/…` takes the mark and is counted |
| `test_prepare_paper_subtitle` | round 1 C-008 | `\subtitle` is on the page and nothing is counted |
| `test_prepare_paper_typst_colon_label` | round 1 C-009 | `@sec:intro` and `@eq:one` lead to their anchors |
| `test_prepare_paper_table_spans` | round 1 C-003 | `\multicolumn` and `\multirow` keep the numbers in their columns |
| `test_prepare_paper_pictures_same_name` | round 2 C-002 | two chapters with a `fig.png` of different bytes each show their own; a chapter's picture not beside it is marked |
| `test_prepare_paper_picture_named_argument` | round 3 C-003 | `image(width: 50%, "fig.png")` and `image(alt: "A dog", "fig.png")` in a chapter show the chapter's picture; prose reading `image("fig.png")` is left as written |
| `test_prepare_paper_typst_include_after_comma` | round 3 C-004 | `#grid(columns: 2, include "a.typ", include "b.typ")` and `#align(center, include "c.typ")`: one chapter, holding all three |
| `test_prepare_paper_odd_backtick` | round 4 C-001 | a lone backtick in the paper and in a chapter hides no part and no picture |
