# Sprint 26 Unit Verification

- **Tested head:** `8353ba9` (the nine tasks, T-086 to T-094; one commit
  after T-093, `a382e5c`, that gives a test file back its own formatting;
  one that corrects a count in a record).
  `npx vitest run` on this Windows machine: **37 files, 412 tests: 411
  passed, 0 failed, 1 skipped**. Before the sprint the suite was 35 files,
  337 tests. The 75 new cases: `document-source` 5, `pandoc-read` 16 (a new
  file), `pandoc-to-markdown` 30 (a new file), `rehype-math` 6,
  `document-stage` 7, `load-books` 4, `find-books` 3, `fixture-commands` 1,
  `tutorial` 3.
- The one skip is the loader case for a note named `Summary.md`, which needs
  a file system that tells it from `SUMMARY.md`; it runs in CI on Linux, where
  the staging case for a drive-letter path is skipped instead.
- The whole suite was run at T-092's commit (407 passed, 1 skipped) and at
  the head. At the other tasks' commits the task's own test files and their
  neighbours were run, as each task's entry in `completed-tasks.md` says.
- `npx astro check`: 0 errors, 0 warnings. (At T-092 it first reported 14
  errors, all in the types of this sprint's new test files; they were
  corrected in that task's commit.)
- **Stubs:** named here, each for what it stands in for.
  - Five cases of `pandoc-read.test.ts` give `readPaper()` a stand-in for
    pandoc's `convert`, to produce what the real one will not on demand: one
    piece reported four times, a piece reported where the file does not hold
    it, a second reading that is refused, and a paper that never stops
    asking for files. It stands in for pandoc's answer (a tree and a list of
    notices), not for Tome's reading of it.
  - `pandoc-wasm` itself is replaced in two cases, to count how often it is
    loaded: `test_pandoc_loaded_on_call` and
    `test_read_documents_no_paper_no_pandoc`.
  - `node:fs/promises` is wrapped in `pandoc-read.test.ts` to record every
    file the module opens; the wrapper calls the real function.
  - `fetch` and `net.Socket.prototype.connect` are replaced by functions
    that count and throw, in `test_pandoc_fetches_nothing`.
  - `console.warn` is spied in `rehype-math.test.ts`, as before the sprint.
  - Everything else is real: pandoc itself (eleven cases of
    `pandoc-read.test.ts`, and every case that calls `prepareDocument()` or
    the loader on a paper), the Markdown parser with Tome's own plugins, the
    layout engine (Temml), real temporary folders, and spawned processes for
    the loader, `books:add` and the config.
- A tree given to `writePaper()` in a unit test is written out as pandoc's
  JSON, so those cases do not run pandoc. The two kept trees
  (`src/lib/__tests__/papers/latex-tree.json`, `typst-tree.json`) are what
  `readPaper()` gives for the fixtures, and `test_pandoc_latex_tree` and
  `test_pandoc_typst_tree` compare each with a fresh reading by pandoc.

## T-086: two more kinds of document (`document-source.test.ts`, 16 cases, 5 new)

| Test | Clause | What it showed |
|---|---|---|
| `test_source_paper_formats` | 1 | `a.tex`, `A.TEX`, `b.typ`, `B.Typ` are `latex`, `latex`, `typst`, `typst`; `.md` and `.docx` as before; `.bib`, `.sty`, `.cls`, `.yml`, `.pdf` are null |
| `test_source_one_paper` | 2 | a `.tex` file with no `\documentclass`, named on its own, is a `document` source staged as `README.md`; the same for a `.typ` file |
| `test_source_fragments_left_out` | 3 | of `paper.tex`, `appendix.tex` (no `\documentclass`), `old.tex` (its only one after a `%`), `main.typ` (which includes one file, imports another, and imports a package), `alone.typ` and `note.md`, the documents are `alone.typ`, `main.typ`, `note.md`, `paper.tex`, with the order, staged names and parts a folder of `.md` files of those paths has; an include beginning `/` is read from the folder itself |
| `test_source_only_fragments_refused` | 4 | a folder holding only a part of a paper is refused, with its path and `\documentclass` in the message |
| `test_source_accepted_names_papers` | 5 | `ACCEPTED`, the refusal of a file and the sentence after the book's own refusal each name `.tex` and `.typ` |
| the 11 earlier cases | 6 | pass unedited |

## T-087: pandoc, with a stand-in (`pandoc-read.test.ts`, 5 of its 16 cases)

| Test | Clause | What it showed |
|---|---|---|
| `test_pandoc_skipped_once` | 4 | one piece reported four times at one place is one entry; the same contents at a second place is a second; the returned tree holds each entry's word where its piece stood |
| `test_pandoc_skipped_not_placed` | 5 | a piece reported where the file does not hold it has `placed: false` and no word in the tree; a piece replaced but absent from the second tree has `placed: false`, after two readings; a word that stands only in `meta.title` has `placed: true` |
| `test_pandoc_second_reading_refused` | 5 | when the second reading is refused the first tree is returned and the piece is unplaced |
| `test_pandoc_limits` | 10 | a paper that asks for one new file at each reading is read 20 times and the file then asked for is in `missing`; of 205 files asked for at once, 199 are supplied beside the paper and 6 are `missing`; a file that would pass 20 MB is `missing`; a Typst paper that never stops asking is refused with pandoc's reason after 20 readings |
| `test_pandoc_loaded_on_call` | 11 | importing the module loads no `pandoc-wasm`; the first `readPaper()` loads it once; the second does not load it again |
| `test_pandoc_is_a_dependency` | 12 | `dependencies['pandoc-wasm']` is `1.1.0`, with no range mark |

The other ten cases run pandoc and are in `integration-tests.md`.

## T-088: the tree as Markdown (`pandoc-to-markdown.test.ts`, 20 of its 30 cases)

| Test | Clause | What it showed |
|---|---|---|
| `test_paper_title` | 1 | `meta.title` heads the Markdown and is `title`; with none, the file's name; a title holding `x^2 \ge 0` is titled `Why x² ≥ 0` |
| `test_paper_title_note_and_piece` | 1 | a note and a skipped piece in the title are in neither `title` nor the heading; the note's words stand under the authors' line; the piece is counted, with no mark |
| `test_paper_heading_levels` | 2 | with a title, headers 1, 2, 3 are `##`, `###`, `####` and a header 6 stays 6; a Typst tree whose first heading is its title has one `#` and its other headings as they are, on a small tree and on the fixture |
| `test_paper_front_matter` | 3 | `_A. Writer, B. Reader, November 2026_`, then `**Abstract**` and the abstract; no date and no stray comma when the date is empty or only `\today`'s word; nothing when the tree has none of the three; a Typst tree's `meta.author` is not written |
| `test_paper_node_rules` | 4 | emphasis, strong, struck text, inline code, a link, a bullet list, a quotation and a rule each read back as that kind with the same text; a line break is `<br>`; quoted text takes curled marks; a numbered list beginning at 3 begins at 3; a code block of class `python` is fenced `python` with a `#` line kept; a footnote reads back as one; `x<sup>2</sup>y<sub>i</sub>`; a definition list is two bullets beginning `**Sum**` and `**Product**`; underlining, small capitals and a span are their words with nothing counted |
| `test_paper_table` | 5 | the paper's table reads back with alignments left, right, right and its four rows of cells, the first holding the formula `n`; its caption stands under it; a table with no heading row is headed by its first; a cell of two paragraphs is `first<br>second \| third` on one line |
| `test_paper_figure` | 6 | an image and its caption's paragraph; `images` is `[{ url: 'figures/triangle.png', placeholder: 'tome-paper-image-0' }]`, and that placeholder is the address in the Markdown |
| `test_paper_own_blocks` | 7 | `**Theorem 1** (Gauss). _For every whole number $n \ge 1$,_`; `_Proof._ By induction.`; the end mark `◻`; `**Lemma 2**.`; a block of class `myenv` is its paragraph |
| `test_paper_formula_one_line` | 8 | a formula typed on six lines with a comment holding a `$` and a `\%` is carried as `\begin{equation} \label{eq:one} a = b + c - d \% e \end{equation}`, found by Tome's reader as one set-apart formula with nothing counted; so is one with lines beginning `>`, `=`, `-`, `+` and `*`; `\text{foo%⏎  bar}` is `\text{foobar}`; `a \\% c⏎b` is `a \\ b`; `\alpha% c⏎b` is `\alpha b`; a comment on a line of its own costs no space |
| `test_paper_formulas` | 8 | `For $n \ge 1$, so.` with one inline formula; `words, DisplayMath, words` reads back as paragraph, set-apart formula, paragraph; a set-apart formula in a table cell, a heading, a link and a caption is inline in each, and nothing is counted |
| `test_paper_formula_set_apart_in_emphasis` | 8 | the theorem's paragraph: the words after its name in emphasis, then a set-apart formula holding `\begin{equation}`; `Emph[a, DisplayMath, b]` is emphasis `a`, formula, emphasis `b` |
| `test_paper_formulas_read_back` | 9 | the formulas Tome's reader finds in the paper's Markdown are, in order, the formulas the tree holds (abstract, text, notes), each with its LaTeX on one line and each `readable()` where it stands; no equation is counted and no mark is written |
| `test_paper_formula_refused_is_marked` | 9 | `x = \badmacro{1}` set apart and an `align` in a table cell are each `[equation not shown]`; `leftOut` is `[{ kind: 'equation', count: 2 }]`; the reader finds no formula |
| `test_paper_text_stays_text` | 10 | ten lines of words (`It costs $5 … 50% …`, `*not emphasis*`, `_nor this_`, `[not](a link)`, `a \ backslash`, `<b>not bold</b>`, `- not a list`, `# not a heading`, `1. not numbered`, `$a$ and $b$`) each read back as one paragraph of exactly that text, with no emphasis, strong, link, HTML, list, heading or formula node |
| `test_paper_unsafe_links` | 11 | `javascript:`, `file:`, `data:` and `vbscript:` links are their words with no link node; `https:`, `http:` and `mailto:` are links |
| `test_paper_skipped_marked` | 12 b | `\mycmd{x}`, `\other[opt]`, a `tikzpicture`, `\appcmd{y}` from `appendix.tex`, `\noindent{\bf Keywords:}`, `\centering{\includegraphics{a.png}}`, `\color{red}{Red words}` and `\begin{definition}[Compactness]` each take the mark, eight in all, as text even with a definition `[LaTeX not shown]: …` appended; each is counted `latex` with its name and line, the one from `appendix.tex` with that file and the paper's own with none; no word that stood for a piece is in the Markdown |
| `test_paper_skipped_counted_only` | 12 c | `a \myname b` reads `a b` with one `command` counted; `x \myname y` typed hard against `y` reads `x y`; a piece with `placed: false` leaves no mark and is counted `command` |
| `test_paper_layout_commands_quiet` | 12 a | each of the 77 layout commands, bare, starred, followed by a space, with the arguments it takes, and starred with an option, leaves `x y` and nothing counted; with one group more than it takes it is marked and counted; a bare `\begin{myenv}` and `\end{myenv}`, the bibliography's three pieces and a piece from `house.sty` leave nothing; in the paper `x\quad y` reads `x y` |
| `test_paper_unknown_node` | 13 | an inline and a block of invented kinds keep their words and are counted `node` with the kind's name; nothing throws |
| `test_paper_deterministic` | 14 | the paper's tree written twice gives equal Markdown and equal counts |

## T-089: references (`pandoc-to-markdown.test.ts`, 6 cases)

| Test | Clause | What it showed |
|---|---|---|
| `test_paper_references` | 1 | in the paper, an anchor paragraph stands directly before `## The result`, the theorem, the table and the figure, and the links read `[2](#ref-sec-result)`, `[1](#ref-thm-gauss)`, `[2](#ref-lem-norm)`, `[1](#ref-tab-sums)`, `[1](#ref-fig-triangle)`, `[1](#ref-sec-intro)`; labels `a:b` and `a.b` take `ref-a-b` and `ref-a-b-2`, each link to its own; a labelled heading nothing refers to has no anchor, and two anchors are written in all |
| `test_paper_caption_numbers` | 2 | `_Table 1._ The first three sums.` and `_Figure 1._ A triangle of dots.`; of two tables with the same caption only the one referred to takes `_Table 1._` |
| `test_paper_equation_reference` | 3, 5 | `\eqref` and `\ref` to `eq:gauss` are each `[eq:gauss](#eq:gauss)` with no anchor; a label with a space is written `#eq:a%20b`; a reference to a label inside `split`, on a `\notag` row, in `equation*`, in a formula that cannot be laid out, and to a numbered formula in a table cell is `[label]` as text with one `reference` counted |
| `test_paper_item_label` | 4 | `- <a id="ref-it-one"></a>The first point.` and `[\[it:one\]](#ref-it-one)`, with nothing counted |
| `test_paper_reference_not_followed` | 5 | in the paper `\ref{nowhere}` is `[nowhere]` as text and one `reference`; a reference naming `sec:a,sec:b` is shown as written with no link and counted once, though both labels exist |
| `test_paper_typst_references` | 6 | in the Typst paper the links read `The result`, `the equation`, `the table`, `the figure`, each to an anchor directly before that heading, formula, table or figure; no `<span`, no empty block, and nothing left of a label no reference names; a label that is the first inline of the paragraph after a heading names the heading and the paragraph keeps its words; a label after a paragraph's words is an anchor within the line and its reference reads `[here]` |

## T-090: an equation's link (`rehype-math.test.ts`, 26 cases, 6 new)

| Test | Clause | What it showed |
|---|---|---|
| `test_math_label_link` | 1 | `[eq:gauss](#eq:gauss)` becomes a link reading `(1)` to `#eq.eq:gauss`; that `id` is the page's only one and stands on the formula's own `mtr`, which holds `(1)`; labels `eq:a b` (linked as `#eq:a%20b`) and `eq:a.b` take `eq.eq:a-b` and `eq.eq:a-b-2`, each link to its own row |
| `test_math_label_link_words` | 2 | the label as words, and empty words, both read `(1)`; `([eq:gauss](#eq:gauss))` reads `1`; with only a closing bracket after it, `(1)`; a `\tag{A}` row reads `(A)`; `[words of mine](#eq:gauss)` is left with its address and no `id` is written; with a heading whose address is `pythagoras` and a formula labelled `pythagoras`, `[the theorem](#pythagoras)` is unchanged and the page's only `id` is the heading's (run with Astro's own heading step after Tome's) |
| `test_math_label_rows` | 3 | after one numbered `equation`, an `align` whose first and third rows are labelled and whose second is `\nonumber`: the links read `(2)` and `(3)` and reach different rows; a `\label` after a `%` is no label and its link is unchanged; a label before an `align` meets no row, its link is unchanged, and the two rows' links read `(1)` and `(2)` |
| `test_math_numbered_labels` | 4 | `['eq:one']` for a labelled `equation`; the first and third labels of an `align` whose second row is `\nonumber`; the label of a `\tag` row; an empty list for `equation*`, a label inside `split`, a bare formula with a label, and LaTeX that cannot be laid out |
| `test_math_label_unreached` | 5 | a labelled formula with no link has no `id` anywhere; a link to no label and a link to a site are unchanged; a label on a `\notag` row is not reached; of two formulas with one label the link reads `(1)` and one `id` is written |
| `test_math_no_link_no_change` | 6 | for both pages of `fixtures/proofs` the tree equals the tree kept at the commit before this task; a page with three labelled rows and no link to them has no `id` and the numbers `(1)`, `(2)`, `(3)` |
| the 20 earlier cases | boundary | pass unedited |

## T-091: citations (`pandoc-to-markdown.test.ts`, 4 cases)

| Test | Clause | What it showed |
|---|---|---|
| `test_paper_citeproc_citations` | 1 | `([Gauss 1801](#ref-ref-gauss); [Euler 1748](#ref-ref-euler))`, each link to the anchor directly before its own entry; `([Gauss 1801](…); nobody?)` and `(nobody?)` with `nobody?` as text and one `citation` counted for the two; the Typst paper's citation is a link reading `Gauss 1801` and nothing is counted |
| `test_paper_reference_list` | 2 | `## References`, then each entry behind its anchor; pandoc's own level-1 heading before a Typst paper's list is that heading at level 2, so the Typst paper has one heading `References` and one level-1 heading; an empty list with that heading writes neither |
| `test_paper_own_bibliography` | 3 | `## References` and `1. <a id="ref-bib-gauss"></a>C. F. Gauss, …`, `2. <a id="ref-bib-euler"></a>L. Euler, …`; the paragraphs read `One [1], two [1, 2],`, `three [1, p. 3], four [see 1, ch. 2],`, `five [2].` (the last an author-in-text citation), each number a link to its entry; no `9`, no word of a piece, no mark, nothing counted; in the paper, `[1]` after "known to Gauss" and its one entry |
| `test_paper_citation_no_entry` | 4 | `[1, missing] [missing]` with one link and one `citation` counted; with no list, `[a] [b, a]` and each key counted once; a Typst `@nowhere` with no list is `[nowhere]`, counted; in the paper, `[1, missing]` and one `citation` |

## T-092: the report's words, and pandoc not loaded (`document-stage.test.ts`, 2 of its 7 new cases; `find-books.test.ts`, 1)

| Test | Clause | What it showed |
|---|---|---|
| `test_left_out_paper_words` | 4 | each of the six phrases word for word; `\appcmd in appendix.tex` for a piece from another file; `2 files it pulls in that were not found (a.tex, b.tex)`; seven names give five and `and 2 more`; five entries named `\State` give the name once; several kinds join in one line with `1 equation` before them and `1 image` after |
| `test_describe_left_out` (existing) | 4 | the words for the kinds a document already had, unedited (`test_left_out_words_unchanged` of the plan) |
| `test_read_documents_no_paper_no_pandoc` | 9 | with a stand-in that counts its loading, a folder of a note and a Word document is read with the count at 0; a paper named on its own brings it to 1 and meets the stand-in |
| `test_find_books_usage_names_papers` | 7 | the words that open `find-books.mjs` hold `npm run books:add`, `.tex` and `.typ` |

The other cases of T-092 use pandoc, real folders and spawned programs, and
are in `integration-tests.md`.

## T-094: the tutorial and the README (`tutorial.test.ts`, 9 cases, 3 new)

| Test | Clause | What it showed |
|---|---|---|
| `test_tutorial_covers_papers` | 1, 2 | *Find Your Books* names a paper in LaTeX (`.tex`) or Typst (`.typ`), holds a `books:add` line ending `.tex`, a chapter for each `.md`, `.docx`, `.tex` and `.typ` file, "A paper of several files is one chapter", `\documentclass`, "includes or imports"; its new section names what a paper keeps, the four marks, "PDF or EPS", the loader's words, the Typst limit, that a number may differ from the PDF's, `.bbl`, `\resizebox`, `pandoc-wasm`, the GPL, and that a paper shows a change only after a restart |
| `test_tutorial_equation_reference` | 3 | *Write Mathematics* has "Refer to an equation by its number" with `[](#eq:gauss)` and `\label{eq:gauss}`, refers to its own equation as `([](#eq:energy))` with the label in both the source shown and the formula laid out, no longer says "is not offered yet", and says `\ref` and `\eqref` inside a formula are not read |
| `test_readme_names_pandoc` | 4 | the README's section names LaTeX and Typst, `[LaTeX not shown]`, `pandoc-wasm`, "GPL (version 2 or later)", that pandoc is not in the built pages or the desktop apps, and a `books:add` line ending `.tex` |
| the 6 earlier cases, `tutorial-math.test.ts`, `book.test.ts` | 5 | pass unedited: the chapter count is unchanged, and the mathematics chapter is laid out with no formula shown as typed and the numbers `(1)`, `(2)`, `(3)` |

## Departures from the test plan, in these tests

- **A line beginning `#`.** The plan's `test_paper_formula_one_line` names
  lines beginning `#`, `>` and `=`. `#` is TeX's own parameter sign and the
  layout engine refuses a formula with a bare one, so such a formula cannot
  be "found by Tome's reader"; lines beginning `>`, `=`, `-`, `+` and `*`
  are tried.
- **`test_left_out_words_unchanged`** is the existing `test_describe_left_out`,
  unedited, and not a test of a new name.
- **`test_pandoc_skipped_once`, `_not_placed`, `_second_reading_refused` and
  `_limits`** use a stand-in for pandoc, as the plan says, and are counted
  here as unit tests though they live in the file of integration tests.
- **`test_math_no_link_no_change`** compares both proofs pages with the kept
  tree, as planned; its second half checks a page of labelled formulas for
  no `id` and unchanged numbers, since no kept tree exists for a page
  written for this test.
