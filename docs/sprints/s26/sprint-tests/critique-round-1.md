# Test Critique — Sprint 26

Read-only review at head `8275668` (tested code `8353ba9`). Nothing in the repository was edited, staged or built; `git status` was empty before and after. Every reproduction below was run through Tome's own `readPaper()`, `writePaper()`, `prepareDocument()` and `resolveSource()` on papers of my own in a scratch folder, with the installed `pandoc-wasm` 1.1.0. I also ran `npx vitest run` on `pandoc-to-markdown.test.ts` and `rehype-math.test.ts`: 56 passed, which matches the records (30 + 26).

## Concerns

### C-001: an unknown environment with an option loses every mark in the paper
- **Where:** `build-plan.md` T-087 clause 5; `unit-tests.md` `test_pandoc_second_reading_refused`; `integration-tests.md` `test_pandoc_skipped_placed`; INT-0033 AC5.
- **Quote:** "WHEN pandoc refuses the copies, THEN the first reading's tree SHALL be returned and every entry SHALL have `placed: false`."
- **Failure mode:** negative-path
- **Why it matters:** The refusal is tested only with a stand-in, as if it were rare, but Tome causes it itself on a very common construct. For `\begin{name}[opt]` followed by a line end, pandoc reports the place as line + 1, column 1. `placeOf()` does not find the `\begin`, the `\end{name}` is still replaced, and the second reading fails with "expecting \end{name}". Every `[LaTeX not shown]` in the whole paper is then gone, and a drawing or a command holding words is only "a command not read" in the report. AC5 ("marked where it stood") is false for any paper holding `\begin{table*}[t]`, `\begin{algorithm}[t]`, `\begin{algorithmic}[1]` or `\begin{tcolorbox}[title=…]`.
- **Suggested response:** add-test (real pandoc, an environment with an option and a line end after it, beside a marked piece), and fix the placing: look for the piece ending at the line end before, and never replace an `\end` whose `\begin` was not placed.
- **Reproduction:**
  ```latex
  We use \mycmd{important words} here.

  \begin{table*}[t]
  \caption{Star table}
  \begin{tabular}{ll} a & b \end{tabular}
  \end{table*}
  ```
  - Out: `We use here.`, the table with no caption, and the report `2 commands not read (\mycmd, table*)`. All three entries have `placed: false`.
  - Pandoc's second answer: `unexpected end of input expecting \end{table*}`.
  - Without `[t]` the same paper gives `We use \[LaTeX not shown] here.`
  - The same happens with `\begin{algorithmic}[1]`, and a `tikzpicture` elsewhere in such a paper loses its mark too.

### C-002: a paper with Windows line ends loses the mark of every piece on several lines
- **Where:** `integration-tests.md` `test_pandoc_skipped_placed`; `fixtures/latex/paper.tex`; INT-0033 AC5.
- **Quote:** "one for the `tikzpicture`, whose three lines are typed with a tab before each; every entry has … `placed: true`"
- **Failure mode:** intent-coverage
- **Why it matters:** Pandoc reports `contents` with `\n`, while Tome's copy keeps `\r\n`, so a piece on several lines is never found. The drawing vanishes from the page with only "1 command not read (tikzpicture)" in the report. Every fixture is LF in the checkout (`git ls-files --eol` shows `w/lf`; there is no `.gitattributes`), so no test can see it. There is a flake risk too: a clone with `core.autocrlf=true`, the default of Git for Windows, would turn the fixtures to CRLF and fail `test_pandoc_skipped_placed` and the "three marks" assertions.
- **Suggested response:** add-test (a CRLF copy of the fixture: tikzpicture placed, `oneLine()` unchanged), make line ends `\n` in the in-memory copy, and pin the fixtures' line ends with a `.gitattributes`.
- **Reproduction:** the paper `First words.` / blank / `\begin{tikzpicture}` / `\draw (0,0) -- (1,1);` / `\end{tikzpicture}` / blank / `Last words.`, saved with CRLF.
  - Out: `First words.` then `Last words.`, with `placed=false` and the report `1 command not read (tikzpicture)`.
  - Saved with LF, the same paper gives `\[LaTeX not shown]` between the two paragraphs.

### C-003: a cell that spans columns or rows shifts the cells after it under the wrong headings
- **Where:** `build-plan.md` T-088 clause 5; `unit-tests.md` `test_paper_table`.
- **Quote:** "a GFM table with the same cells and column alignments"
- **Failure mode:** weak-assertion
- **Why it matters:** `table()` reads each cell's blocks and ignores pandoc's row span and column span. `\multicolumn` and `\multirow` are in most papers' tables, and the numbers land silently under another column, with no mark and no count. The test's table has neither.
- **Suggested response:** add-test and pad a spanned cell with empty cells (or mark the table).
- **Reproduction:**
  ```latex
  \begin{tabular}{lrr}
  \multicolumn{2}{l}{Total} & 9 \\
  Lasso & 1 & 2
  \end{tabular}
  ```
  - Out: `| Total | 9 | |` over `| Lasso | 1 | 2 |`, so the 9 stands in column 2.
  - With `\multirow{2}{*}{Ridge} & 5 & 6 & 7 & 8 \\ & 50 & 60 & 70 & 80`, the second row is written `| 50 | 60 | 70 | 80 | |`, with 50 under the method column.

### C-004: `\|` in a table cell is rewritten to a line break and the word "vert"
- **Where:** `build-plan.md` T-088 clause 9; `unit-tests.md` `test_paper_formulas_read_back` and `test_paper_table`; `latexAsWritten()` in `scripts/docx-to-markdown.mjs`; INT-0033 AC3.
- **Quote:** "every formula either comes back from Tome's reader with the LaTeX carried and can be laid out where it stands (`readable()`), or is replaced by `[equation not shown]`"
- **Failure mode:** weak-assertion
- **Why it matters:** In a cell every `|` becomes `\vert `, including the one in `\|`, which becomes `\\vert `. The read-back check compares against what Tome itself wrote, not against the paper's LaTeX, and Temml accepts the result. The formula is therefore shown changed, with no mark and no count: `formulaText('\\vert z\\vert')` is `vertzvert`. A norm in a table cell is ordinary in a paper.
- **Suggested response:** tighten-assertion (compare the laid-out text of the cell form with that of the paper's own LaTeX) and write `\|` as `\Vert `.
- **Reproduction:** `\begin{tabular}{ll} Norm & Value \\ $\|x\|_2$ & 1 \end{tabular}`
  - Out: the cell `$\\vert x\\vert _2$`, and the report is empty.

### C-005: a Typst paper with a Hayagriva `.yml` shows its citations as keys and counts none
- **Where:** `build-plan.md` T-091 clause 4; `unit-tests.md` `test_paper_citation_no_entry`.
- **Quote:** "the paper has no list Tome can read (a Hayagriva `.yml`, …) THEN the key SHALL be written in square brackets as text and `leftOut` SHALL count `{ kind: 'citation', detail: <the key> }`"
- **Failure mode:** stub-leak
- **Why it matters:** The unit test's hand-written tree has no reference list. Pandoc's real tree for `#bibliography("refs.yml")` holds a `References` header and an empty `Div` `refs`, as the plan's own notes say. `arrangeBibliography()` takes that for `citeproc`'s list, so `citation()` writes pandoc's words and counts nothing. The clause is false in the real pipeline, and AC5 ("a citation that leads nowhere is shown as written and counted") with it.
- **Suggested response:** add-test (integration, real pandoc, a `.yml` bibliography), and treat an empty `refs` as no list.
- **Reproduction:** `= Title` / `Cite @gauss and @other.` / `#bibliography("refs.yml")` with a `refs.yml` beside it.
  - Out: `Cite \[gauss] and \[other].` and an empty report.

### C-006: a Typst file in a subfolder that imports `../something.typ` refuses the whole paper
- **Where:** `build-plan.md` T-087 clause 7; `integration-tests.md` `test_pandoc_typst_tree`.
- **Quote:** "SHALL be supplied under the same rule as a LaTeX paper's, its path read from the naming file's own folder"
- **Failure mode:** EARS-coverage
- **Why it matters:** For a path with `..` pandoc fails with "withBinaryFile: failed (Capabilities insufficient)", not "does not exist", so `readTypst()` never supplies the file. `chapters/intro.typ` beginning `#import "../template.typ": …` is the usual layout of a Typst project of several files; the file lies inside the paper's folder and the clause says it is supplied. The tests try only paths downward and paths from `/`.
- **Suggested response:** add-test and supply on that message too.
- **Reproduction:** `main.typ`: `= Title` / `#include "chapters/intro.typ"`; `chapters/intro.typ`: `#import "../template.typ": note` / `== Intro` / `#note[Hello]`; `template.typ`: `#let note(body) = [Note: #body]`.
  - Out: `PaperRefused: ../template.typ: withBinaryFile: failed (Capabilities insufficient)`.

### C-007: a picture named from `/` is neither staged nor marked; a Typst picture named in an included file is not found
- **Where:** `build-plan.md` T-092 clause 2; `integration-tests.md` `test_prepare_paper_images`; `preparePaper()` in `scripts/document-stage.mjs`.
- **Quote:** "WHEN no such file is found, or the picture is a `.pdf` or `.eps`, or lies outside the paper's folder, THEN the chapter SHALL hold `[image not shown]` in its place and `leftOut` SHALL count"
- **Failure mode:** EARS-coverage
- **Why it matters:** `localPath()` returns null for an address beginning `/`, and the paper branch then leaves the image "as written". A Typst picture named from the project's root, which is the same rule the plan honours for `#include "/parts/…"`, becomes a dead address on the built site with no mark and no count, and so does a LaTeX picture at an absolute Unix path. Separately, Typst reads a picture's path from the file that names it, while Tome reads it from the paper's folder, so pictures of an included chapter in a subfolder are all marked not shown although they are files of the paper.
- **Suggested response:** add-test for both, resolve `/` from the paper's folder for Typst, and mark what cannot be staged.
- **Reproduction:**
  - `#image("/figs/root.png")` with `figs/root.png` present gives `![](/figs/root.png)`, nothing staged and nothing reported.
  - `\includegraphics{/home/me/figs/a.png}` gives `![image](/home/me/figs/a.png)` with nothing reported.
  - `sub/part.typ` holding `#image("near.png")` beside `sub/near.png` gives `\[image not shown\]`.

### C-008: what pandoc reads into metadata other than title, author, date and abstract vanishes without a word
- **Where:** INT-0033 AC2 and AC5; `writePaper()`; `unit-tests.md` `test_paper_front_matter`.
- **Quote:** "Nothing vanishes without a word."
- **Failure mode:** intent-coverage
- **Why it matters:** Pandoc does not skip `\subtitle`, `\dedication` or `\address`: it puts them in `meta.subtitle` and the like, and Tome writes only four fields. The words are lost with no mark and no count, which is exactly what AC5 forbids. No test gives `writePaper()` a metadata field it does not know.
- **Suggested response:** add-test and write or count every other field of `meta` that holds words.
- **Reproduction:** `\title{Main Title}` / `\subtitle{The Subtitle Words}` / `\author{Jane Doe}` before `\begin{document}`, then `\maketitle`.
  - Out: `# Main Title`, `_Jane Doe_`, and an empty report; "The Subtitle Words" is nowhere.

### C-009: limits a real paper will meet that neither the intent nor the tutorial names
- **Where:** `build-plan.md` T-088 notes and T-089 clause 6; INT-0033 Consequences; `find-your-books.md`.
- **Quote:** "The Typst reader has no skipped pieces: it reads a paper or refuses it"
- **Failure mode:** intent-coverage
- **Why it matters:** Each of these was reproduced, and none is recorded or tested.
  - **Typst labels with a colon or a full stop.** `@sec:intro`, `@eq:one`, `@fig:tri` and `@fig.tri4` are read by pandoc as a citation of `sec`, `eq` or `fig` followed by text. The page shows `[sec]:intro`, or `(**eq?**):one` with a `.bib`, and the report says "citations with no entry (sec, eq, fig)". Only `-` and `_` labels work, and the fixture uses only those (`<sec-result>`). AC4 fails for the commonest Typst label style.
  - **A Typst citation's supplement.** `@gauss[p.~5] two` gives `(Gauss 1801)two`; "p. 5" and the space after it are dropped by pandoc with no notice.
  - **Captions.** A caption inside `table*`, `wrapfigure` or `sidewaystable` is dropped silently, and a `\ref` to it is "not followed". The intent names only `algorithm`, and `table*` is in every two-column paper.
  - **IEEE authors.** Under IEEEtran, `\IEEEauthorblockN{Jane Doe}` leaves no authors' line at all, only "commands not read".
- **Suggested response:** defer-with-rationale (name each in INT-0033 and the tutorial), and add-test for the colon label, where Tome could join `Cite` + `:rest` when that label exists.

### C-010: an `\input` cycle never settles
- **Where:** `build-plan.md` T-087 clause 10; `unit-tests.md` `test_pandoc_limits`.
- **Quote:** "`readPaper()` SHALL settle"
- **Failure mode:** negative-path
- **Why it matters:** The limits are proved only with a stand-in that keeps asking for new files. With real pandoc, `paper.tex` with `\input{a}`, `a.tex` with `\input{b}` and `b.tex` with `\input{a}` reaches a third reading that does not return: I stopped it after nine minutes. `\input{paper}` inside `paper.tex` does the same. A build of a library would hang rather than give a refused chapter. LaTeX cannot compile such a paper either, so this is a slip in a draft, not a finished paper.
- **Suggested response:** add-test and refuse a file that is already being read, or defer-with-rationale.

### C-011: the search clause is unproved, and the record's reason leans on an intent that says otherwise
- **Where:** `e2e-tests.md` Departures; `sprint-meta.md` Blockages; `build-plan.md` T-093 clause 6; INT-0008 AC2.
- **Quote:** "`test_papers_search` does not hold the plan's clause as written"
- **Failure mode:** EARS-coverage
- **Why it matters:** The record's account of the code is true: `search-index.ts` keeps one body text for a chapter and the headings apart, so a word of the text can only open the chapter. But INT-0008 AC2 reads "deep-links to the most relevant heading (`#slug`) when the match is within a section", so "INT-0008, not changed here" does not settle it. The locked clause stays without an executed test, and the replacement checks what search does, not what was promised.
- **Suggested response:** defer-with-rationale, naming a backlog task or intent that owns "a match in a section's text opens that section", and say in the test report that T-093 clause 6 is not met.

### C-012: `test_math_no_link_no_change` cannot fail on what T-090 changed
- **Where:** `unit-tests.md` T-090; `src/lib/__tests__/papers/proofs-before-links.json`; INT-0030 boundary.
- **Quote:** "for both pages of `fixtures/proofs` the tree equals the tree kept at the commit before this task"
- **Failure mode:** weak-assertion
- **Why it matters:** Neither page of `fixtures/proofs` holds a `\label` or a link beginning `#`, so `linkLabels()` returns at once and the kept tree proves only that pages without labels are unchanged. I ran the step as it was before `a6d02c8` against the head on six pages of my own.
  - **Unchanged (3):** labelled formulas with no link; an empty link to a heading; links to unnumbered labels.
  - **Changed (3), all one case:** a link whose words and address are both the label, where a heading or a footnote already has that address. `[intro](#intro)` beside `## intro` and `\label{intro}` now reads `(1)` and leads to `#eq.intro`, and so does `[fn1](#fn1)`.
  
  That is the plan's rule, but the boundary line "a link a chapter already has is not taken over" is tested only with words that differ from the label.
- **Suggested response:** tighten-assertion (keep a tree for a page with labelled formulas and heading links) and say in INT-0030 or *Write Mathematics* that a link whose words are the label is taken for the equation.

### C-013: which files are parts of a paper: three cases outside the rule
- **Where:** `build-plan.md` T-086 clause 3; `unit-tests.md` `test_source_fragments_left_out`.
- **Quote:** "a `.typ` file that another `.typ` file in the folder names in `#include "…"` or `#import "…"`"
- **Failure mode:** intent-coverage
- **Why it matters:** Each was reproduced with `resolveSource()`.
  - A `subfiles` part (`\documentclass[main]{subfiles}`) is a chapter of its own and is read into `main.tex` as well.
  - Typst's `include "x.typ"` in code (`#let x = include "…"`, `#show: doc => { include "…" }`) and `#include("x.typ")` are not seen, so those parts are chapters twice.
  - `// #include "parts/commented.typ"` still makes that file a part, so it is neither a chapter nor included, and nothing says so.
- **Suggested response:** add-test for the cases the owner wants held; defer-with-rationale for the rest.

### C-014: smaller things, each reproduced
- **Where:** `scripts/pandoc-to-markdown.mjs` (`arrangeBibliography`, `phrasing`); `unit-tests.md` `test_paper_own_bibliography`.
- **Quote:** "the list SHALL be written under a heading `References`"
- **Failure mode:** weak-assertion
- **Why it matters:** None loses the paper's words, but each shows on a page.
  - A second `thebibliography` is not read: `9 C. Author, 2003.` is written as text and its citations are "no entry".
  - `\section*{References}` before the list gives two `## References`.
  - Two `\bibitem{a}` write `id="ref-bib-a"` twice.
  - `\hyperref[sec:x]{words}` loses its link with no count.
  - `\emph{}` hard against a word is written `_&#xNAN;_`; `\textbf{}` is written `****`.
  - `\cmidrule{2-3}` puts `2-3` in a cell; `\begin{multicols}{2}` writes a stray `2`.
- **Suggested response:** defer-with-rationale, or add-test for those worth fixing.

**What I tried that held.**
- **Skipped pieces.** A piece hard against words, two in a row, and the same `contents` three times on one line (each placed once, in order). A piece inside emphasis, a list item, a table cell, a footnote, a caption, a heading and a link's words. A `thebibliography` with text before and after it in the same paragraph, and entries holding a formula, `\emph` and a URL.
- **Files and names.** A BOM; file and folder names with spaces and non-ASCII letters; `\input` with and without `.tex`, `\include`, `\subfile`, `./x`, `sub/../x`, the same file twice, and a commented-out `\input`. `\today` in the title, author, date, a heading, `\verb`, `verbatim`, `lstlisting` and `minted`.
- **Formulas.** Nested dollar signs in `\text{if $x>0$}`; a backtick; `](`; `\%`; a digit or a letter after a formula; two formulas side by side; a set-apart formula in a list, a quotation, a footnote, strong text, a description, a heading and a link.
- **References and citations.** References before and after their target; labels with spaces, underscores, non-ASCII letters and a percent sign; duplicates; labels on an item, in a footnote and after `\appendix`. Every natbib and biblatex citing command with a `.bib`, and keys with `_`, `:` and `ü`.
- **Pictures and text.** Pictures with spaces and upper-case extensions, the same picture twice, a Windows absolute path, `\graphicspath`, and two papers with a picture of one name each. Markdown-looking text of every kind I tried stayed text.
- **Records.** The records name the tested head, the CI run and their stubs honestly.

## Confidence
block

## Responses (the sprint's author)

Answered in `2fe447b`. Each fix has a test; each test was checked to fail with
its fix undone (the cycle's test times out without its fix, since pandoc then
never returns; the empty list's fix is held by
`test_prepare_paper_hayagriva`).

| Concern | Answer |
|---|---|
| C-001 an environment with an option | Fixed. A piece that ends its line is now looked for ending at the line end before the place pandoc gives; and a `\begin{name}` and its `\end{name}` are replaced together or not at all, so the copy is never left with an environment pandoc cannot close. `table*` is written `table` in the copy, which pandoc reads with its caption and label. Tests: `test_pandoc_environment_with_option` (real pandoc: `algorithmic[1]`, `definition[Compactness]`, a drawing and a command, all placed), `test_pandoc_wide_table`, `test_pandoc_unpaired_environment` (stand-in: an `\end` whose `\begin` was not found is left as typed). |
| C-002 Windows line ends | Fixed: line ends are `\n` in the in-memory copy. `test_pandoc_crlf` reads a CRLF copy of the fixture and gets the same result as the LF one, the drawing placed. `.gitattributes` keeps the two fixture folders' bytes as committed. |
| C-003 spanning cells | Fixed: a cell that spans is written in its place and the columns and rows it covers as empty cells. `test_paper_table_spans` (across, down, both), `test_prepare_paper_table_spans` (real pandoc, `\multicolumn` and `\multirow`). |
| C-004 `\|` in a cell | Fixed: in a cell `\|` is written `\Vert` before the bars are written `\vert`. `test_paper_cell_double_bar` compares the laid-out text of each formula written in a cell with that of the paper's own LaTeX, for `\|x\|_2`, `|x|`, `\left\| y \right\|` and `a \| b`. |
| C-005 Hayagriva `.yml` | Fixed: an empty reference list is no list, so the citations are keys and counted. `test_prepare_paper_hayagriva` (real pandoc). |
| C-006 `../` in a Typst file | Fixed: pandoc's "withBinaryFile: failed" is answered as "does not exist" is, under the same folder rule. `test_pandoc_typst_parent_path`, which also shows a file above the paper's folder is still not read. |
| C-007 pictures by path | Fixed: in a Typst paper a path from `/` is read from the paper's folder, and a picture is looked for beside each file that was read; in a LaTeX paper a path from `/` is outside the paper's folder and takes the mark. `test_prepare_paper_pictures_by_path`. |
| C-008 other properties | Fixed: every other property of a LaTeX paper that holds words (`subtitle`, `dedication`, …) is written under the title; pandoc's own settings are passed over. `test_paper_other_properties`, `test_prepare_paper_subtitle` (real pandoc). |
| C-009 limits | The colon or full-stop label is fixed: a citation followed by `:rest` or `.rest` is the label of that name when the paper holds one (`test_paper_typst_colon_labels`, `test_prepare_paper_typst_colon_label`). `table*` is fixed (C-001). The rest are recorded as limits in INT-0033 and in *Find Your Books*: a Typst citation's supplement, a caption in `wrapfigure` or `sidewaystable`, a Hayagriva bibliography, `\IEEEauthorblockN`. |
| C-010 an `\input` cycle | Fixed: before each reading the files read so far are looked at for a cycle, and the paper is refused with the loop named (`a.tex → b.tex → a.tex`). `test_pandoc_input_cycle` (LaTeX and Typst, and the same file twice is no cycle). |
| C-011 search | Deferred with a task: T-096 (backlog, INT-0008) is "a word found in a section's text opens that section", quoting INT-0008 AC2. The test report says T-093 clause 6 is not met. |
| C-012 the boundary test | Tightened: `test_math_no_link_no_change` also compares a page of labelled formulas and of the writer's own links (`papers/labels-and-links.md`) with the tree the step gave before T-090, made by running the step of `a6d02c8^`. The rule for a link whose words are the label is now a case of `test_math_label_link_words`, and *Write Mathematics* and INT-0030 say a heading with the same address does not stop it. |
| C-013 parts of a paper | Fixed: a `\documentclass[…]{subfiles}` file is a part; a Typst include inside code or with brackets is seen; a name in a Typst comment names nothing. `test_source_subfiles_part`, `test_source_typst_include_in_code`, `test_source_typst_commented_include`. |
| C-014 smaller things | Fixed: `\section*{References}` before the list is its heading, once; a key given twice is anchored once; `\hyperref[label]{words}` leads to the label's anchor; empty emphasis writes nothing (tests named `test_paper_own_bibliography_heading_and_twice`, `test_paper_own_link_to_label`, `test_paper_empty_emphasis`). Deferred and recorded in INT-0033: a second `thebibliography`, `\cmidrule{2-3}`, `multicols`. |
