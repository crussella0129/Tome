# Plan Critique — Sprint 26

Read-only review. Nothing in the repository was touched. Every "tried" below was run with `pandoc-wasm` 1.1.0 (imported from the trial folder's `node_modules`) and Tome's own modules, from scripts `p1.mjs`–`p7.mjs` in a new scratch folder of my own, `plan-critic-26`.

## Concerns

### C-001: A file in a subfolder cannot be handed to pandoc the way T-087 plans
- **Where:** `build-plan.md` T-087 clause 2 and Notes; `test-plan.md` `test_pandoc_own_files`, `test_pandoc_typst_tree`.
- **Quote:** "that file is a regular file in the paper's folder or a folder within it, THEN the file's content SHALL be part of what pandoc reads" / "its files by their paths from its folder".
- **Failure mode:** missing-risk (the clause is false as planned, and no test would show it).
- **Why it matters:** `convert()` puts each entry of `files` into one flat map (`fileSystem.set(filename, file)` in the package's `src/core.js`), so a key holding a `/` is never found.
  - LaTeX, tried: `\input{sections/intro}` with `'sections/intro.tex'` supplied gives `CouldNotLoadIncludeFile sections/intro.tex` and a tree of "Main." only. Tome would report a file that exists as "not found".
  - Typst, tried: `#include "parts/two.typ"` with that key supplied gives `ERROR: parts/two.typ: withBinaryFile: does not exist`, so the whole document is refused.
  - `sections/*.tex` is the usual layout of a paper. Every pandoc test in the plan uses a top-level `appendix.*`, so Build and Test would pass with the clause false.
- **Suggested response:** fix-in-plan. Either:
  - give pandoc flat stand-in names and rewrite the `\input` / `\include` / `#include` / `#import` arguments in the in-memory copies, mapping `source` back for the report; or
  - narrow the clause and INT-0033 AC1/AC6 to the paper's own folder, and name a subfolder file as not read.
  - Either way, add `sections/intro.tex` and `parts/two.typ` cases to `test_pandoc_own_files` and `test_pandoc_typst_tree`.

### C-002: The documents gate's existing assertions are exact, and the papers break them
- **Where:** `build-plan.md` T-091 clauses 1 and 8; `test-plan.md` INT-0029 row and gate `check_documents_paper_routes`.
- **Quote:** "the gate's existing checks SHALL still pass" / "the tests that ran before this sprint SHALL run as they ran" / "the gate's existing assertions unchanged".
- **Failure mode:** plan-test-mismatch.
- **Why it matters:** two existing assertions pin the folder's contents exactly.
  - `checkSingleTome()` in `scripts/check-documents.mjs` requires the search index's URLs to equal `CHAPTERS`, which is four routes.
  - `test_documents_root_and_sidebar` requires exactly four sidebar links with exactly four hrefs.
  - Adding `latex/` and `typst/` to the same folder fails both. `latex` also sorts before `letters`, so the order changes too.
  - The plan cites these unedited tests as the INT-0029 boundary evidence.
- **Suggested response:** fix-in-plan. Give the papers a build of their own in the gate (own temp folder, own spec file). That also makes clause 8 simple: two engines for that spec only. Otherwise name the assertions that are edited and say why that is no boundary change.

### C-003: The two readings — repeats, tabs, words that never reach the tree, and a second reading that fails
- **Where:** `build-plan.md` T-087 clause 4 and Notes; T-088 clause 12; `test-plan.md` `test_pandoc_skipped_placed`.
- **Quote:** "`skipped` SHALL hold one entry for it" / "so that the tree holds that word where the piece stood, and the entry SHALL have `placed: true`".
- **Failure mode:** EARS-vague (four behaviours tried, none covered by the clause).
- **Why it matters:**
  - **Repeats.** Pandoc reports one piece two to four times at one place when it begins a paragraph or stands in a table cell (tried: `\unknowncell{b}` in a `tabular` ×4, `\phantom{x}` ×2, `\nobreak` ×3, `\large` ×2). The repeats are not found after the first is replaced, so they come out `placed: false` and are counted again. The fixture's `tikzpicture` "alone in a paragraph" is likely to hit this, since every repeat seen began a paragraph or stood in a table cell.
  - **Placed, but not in the tree.** A piece before `\begin{document}` is replaced and the word then vanishes, because pandoc discards the preamble (tried: `\geometry{…}`, `\hypersetup{…}`, `\institute{Somewhere}`, `\keywords{sums, proofs}`; also `\textwidth` in `\begin{subfigure}{0.4\textwidth}`). T-088 marks only what the tree holds and counts only `placed: false`, so `\institute` and `\keywords`, which hold the paper's words, go with no mark and no count (AC5).
  - **Tabs.** Pandoc expands a tab to four spaces in `contents`. A tab-indented `tikzpicture` of several lines is never found ("ending at that place" and "beginning on that line" both fail), so it gets no mark where it stood.
  - **Second reading refused.** With `\begin{mybox}` typed and its end coming from a macro, the first reading succeeds and the second fails with `expecting \end{document}`. No clause says what then.
- **Suggested response:** fix-in-plan.
  - Count one entry for each distinct file, line, column and contents.
  - Expand tabs in the in-memory copy before the first reading.
  - Decide `placed` from the second tree (the word is there exactly once).
  - If the second reading is refused, keep the first tree with every piece unplaced.
  - Say what a piece outside the tree is (quiet, or counted without a mark), and add a case for each.
- Tried and held: no word landed in a wrong place for a piece in a heading, caption, table cell, footnote, bold text, title or author, nor for twins on a tab-indented line.

### C-004: The quiet list is closed, and pandoc skips far more ordinary layout than it names
- **Where:** `build-plan.md` T-088 clause 12 and Notes ("Layout commands that leave no mark"); T-087 clause 2 (`.sty`, `.cls`); `research-report.md` §4 "Unknown: how real papers fare".
- **Quote:** "the list is exported and each entry is a test case" / "The owner was asked for a paper of their own and none has been given; the plan asks again".
- **Failure mode:** missing-risk (the research unknown has no task, test or deferral).
- **Why it matters:**
  - Pandoc reported about 85 common commands as skipped that are not on the list. Among them: `\small`, `\footnotesize`, `\large`, `\quad`, `\qquad`, `\vspace*`, `\hspace*`, `\vskip`, `\phantom`, `\protect`, `\relax`, `\setcounter`, `\addcontentsline`, `\color`, `\captionsetup`, `\numberwithin`, `\allowdisplaybreaks`, `\rowcolor`, `\cellcolor`, `\printbibliography`, `\pagenumbering`, `\sloppy`.
  - Under clause 12, `x\quad y` reads "x [LaTeX not shown] y" and `{\small text}` gets a mark, each counted.
  - A supplied style file adds its own: a 15-line `house.sty` gave 11 skipped pieces with `source: house.sty` (`\NeedsTeXFormat`, `\ProvidesPackage` twice, `\RequirePackage`, `\DeclareOption`, `\ProcessOptions`, `\relax`, `\makeatletter`, …). A journal's style file would bury the real omissions in the report.
  - Pandoc never asks for a class file. `\documentclass{housecls}` with `housecls.cls` supplied left its `\hh` unread with no notice, so the `.cls` half of T-087 clause 2 cannot be met or tested.
- **Suggested response:** fix-in-plan.
  - Make the rule a class, not a list: a piece with no braced words of the paper's, or one whose source is a `.sty` or the preamble, is quiet or tallied once.
  - Drop `.cls` from the clause.
  - Either try one real paper (an arXiv source) before the lock, or record in INT-0033 that none was tried.

### C-005: "Between `$$` lines of its own" is not what the reused code writes, and readable formulas are refused
- **Where:** `build-plan.md` T-088 clauses 8–9, Notes, and Touches.
- **Quote:** "the formula stands between `$$` lines of its own" / "so that Sprint 25's read-back check holds here unchanged; `MARKS` gains `latex`".
- **Failure mode:** hidden-dep.
- **Why it matters:**
  - `settleEquations()` writes through `writeEquations()` and `dollarForm()`, which write a set-apart formula as `$$latex$$` inside a paragraph, not on fence lines. Markdown's block rules then apply to each line of the formula.
  - Pandoc hands LaTeX over with its lines as typed (tried: `\begin{equation}\n\label{eq:one}\na = b\n+ c\n- d\n\end{equation}`).
  - Tried with Tome's own `settleEquations`: a set-apart formula with a line beginning `+ `, `- `, `#` or `>`, or a line that is only `=`, is refused and becomes `[equation not shown]`, though `readable()` accepts it. The same happens with two spaces of indent. Long equations broken before `+` or `-` are common.
  - `test_paper_formulas` passes with either form, so nothing holds the clause.
  - `MARKS` is frozen and lives in `scripts/docx-to-markdown.mjs`, which is in no task's Touches.
- **Suggested response:** fix-in-plan.
  - Either join a formula's lines to one before it is carried (after dropping `%` comments), or change `dollarForm` to fence lines and list `docx-to-markdown.mjs` and its tests in Touches.
  - Add a case with a line that begins `+`.
- Tried and held: a formula of several lines in a list item or a block quotation is kept; `settleEquations` needs only `{ latex, display, cell }` and the place-holder in a paragraph of its own.

### C-006: Equation links — Temml's id is not the label, and `rehype-math` runs before the ids it must compare against
- **Where:** `build-plan.md` T-089 clauses 3–4 and Notes; `test-plan.md` `test_math_label_link`, `test_math_label_unreached`.
- **Quote:** "or a label that is also the `id` of another element of the page, THEN `rehype-math.mjs` SHALL leave the page as it leaves it today".
- **Failure mode:** plan-test-mismatch (the test can pass while the built page is wrong).
- **Why it matters:**
  - **Temml's id.** Temml writes the `id` on the row (`mtr`), stripped to letters, digits and `_`: `eq:gauss` becomes `eqgauss`, and `eq:a.b`, `eq:a b`, `eq:a+b` all become `eqab`. `align*` gets none. So the label must be read from the formula's source, and two labels can share one id.
  - **Plugin order.** In Astro's pipeline, user rehype plugins run before `rehypeHeadingIds` and before `rehype-raw` (read in `@astrojs/markdown-remark/dist/index.js`; raw nodes seen with a probe). When `rehype-math` runs, headings have no `id` and the `<a id>` anchors are raw nodes, not elements. The clash check can never fire in a build.
  - `test_math_label_unreached` builds a heading with an `id` by hand, so it passes anyway. A stripped id such as `gauss` is one a heading "Gauss" also gets.
  - A label with a space reaches the link as `#eq:a%20b`.
- **Suggested response:** fix-in-plan.
  - Read labels from `\label{…}` in the source, row by row.
  - Give the row an id of Tome's own that no heading address can hold (a colon or a dot in it), and drop or re-scope the clash clause.
  - Compare addresses after decoding.
  - Add a check on the built page (gate or E2E) that no `id` stands twice.
- Tried and held: `[eq:gauss](#eq:gauss)` and `[](#eq:gauss)` reach `rehype-math` as link elements with that address; `equation`, `align`, `gather`, `multline`, `split` and `\tag` rows each carry one id.

### C-007: Citations worked out by `citeproc` — several keys and a missing key are undefined
- **Where:** `build-plan.md` T-089 clauses 7 and 9; T-087 clause 3; `test-plan.md` `test_paper_citeproc_citations`, `test_paper_citation_no_entry`.
- **Quote:** "each citation SHALL be written with pandoc's words, as a link to an anchor before its entry" / "the key SHALL be written in square brackets as text".
- **Failure mode:** EARS-vague.
- **Why it matters:**
  - Tried: `\cite{gauss,euler}` is one `Cite` reading "(Gauss 1801; Euler 1740)", so one link cannot lead to two entries.
  - Tried: `\cite{gauss,nobody}` reads "(Gauss 1801; **nobody?**)" with a `CiteprocWarning`. Clause 7 and clause 9 give different answers for it, and no test covers a `.bib` with a missing key.
  - `\printbibliography` (biblatex) is skipped and not on the quiet list, so every biblatex paper gets a mark where its list is.
  - `\bibliography{refs,more}` gives `meta.bibliography` as a list of two; clause 3 speaks of one file.
- **Suggested response:** fix-in-plan.
  - Tried: `metadata: { 'link-citations': true }` makes pandoc write one link for each entry (`#ref-gauss`), and `#ref-nobody` for a missing one. Write those links, and count each whose target is not in `refs`.
  - Add the two-key and the missing-key cases.
  - Add `\printbibliography` to the quiet pieces, and say what a list of `.bib` files does.
- Tried and held: one key with a `.bib` gives "(Gauss 1801)" and a `Div` `refs` holding `ref-gauss`, for LaTeX (`\bibliography` and `\addbibresource`); without the file the `Cite` keeps its keys.

### C-008: A Typst module that a paper imports becomes an empty chapter
- **Where:** `build-plan.md` T-086 clause 3; INT-0033 AC1.
- **Quote:** "a `.typ` file that another `.typ` file in the folder names in `#include "…"` … SHALL NOT be among its documents; every other `.tex` and `.typ` file SHALL be".
- **Failure mode:** intent-drift (AC1's rule misses the usual case).
- **Why it matters:** a Typst paper usually has a `template.typ` or `lib.typ` brought in by `#import "lib.typ": …`. Tried: pandoc loads that file for the paper. Read on its own it gives an empty tree with no title, so the folder gains a chapter "lib" with nothing in it.
- **Suggested response:** fix-in-plan. Treat `#import "x.typ"` as `#include`, amend AC1's wording ("includes or imports"), and add the case to `test_source_fragments_left_out`.

### C-009: The fixtures are made in T-091, and the tests of T-087 to T-090 need them
- **Where:** `build-plan.md` T-091 Touches and Depends on; `test-plan.md` "Pandoc on the fixtures (T-087)", `test_paper_formulas_read_back`, `test_prepare_paper`, `test_loader_papers`.
- **Quote:** "`fixtures/latex/` (new: `paper.tex`, `appendix.tex`, …)" under T-091, which "Depends on: T-086, T-087, T-088, T-089, T-090".
- **Failure mode:** hidden-dep.
- **Why it matters:** T-087's own test file reads `fixtures/latex/paper.tex` and `fixtures/typst/uses-a-package.typ`, and T-088's tests use "the paper's tree". Neither can be written until the last-but-one task.
- **Suggested response:** fix-in-plan. Move the fixture files to T-087, or to a first task of their own. T-091 keeps the gate.

### C-010: `test_loader_no_paper_no_pandoc` cannot fail
- **Where:** `test-plan.md` integration tests; `build-plan.md` T-090 clause 8.
- **Quote:** "a load of `fixtures/papers` (Markdown and Word) with `pandoc-wasm` mocked to throw on load → succeeds".
- **Failure mode:** plan-test-mismatch.
- **Why it matters:** `load-books.test.ts` runs the loader with `execFileSync('node', [script, …])`. A Vitest mock does not reach a child process, so the test passes whether or not pandoc is loaded.
- **Suggested response:** fix-in-plan. Test it in-process at `readDocuments()` with the mock, or give the child a signal (an import hook through `NODE_OPTIONS`, or a line `pandoc-read.mjs` prints when it loads under a test variable).

### C-011: Words written for Word are left in code a paper now passes through
- **Where:** `build-plan.md` T-088 clauses 4 and 13; T-090 clause 4; T-086 Touches.
- **Quote:** "`leftOut` SHALL count `{ kind: 'other', detail: <the kind> }`" / "For the kinds it knows today its words SHALL be unchanged".
- **Failure mode:** plan-test-mismatch.
- **Why it matters:**
  - `describeLeftOut` words `other` as "element the Word reader did not recognise".
  - Pandoc gives `Underline` for `\underline` and `SmallCaps` for `\textsc` (tried), and neither is in clause 4's list. A paper using `\textsc` would be reported as "1 element the Word reader did not recognise (SmallCaps)". INT-0029 AC4 treats underlining and fonts as decoration that is not reported.
  - `scripts/find-books.mjs:264` prints "could not be read as a Word document" for any placeholder chapter, and T-086 touches only its usage text.
  - `scripts/document-source.mjs:206` holds a second sentence of accepted kinds besides `ACCEPTED`.
- **Suggested response:** fix-in-plan.
  - Add rules for `Underline`, `SmallCaps` and `Span` (words kept, no count).
  - Give a paper's unknown node a kind and words of its own.
  - Word the two messages by format.
  - Add one `books:add` test on a `.tex` file and on a folder with a refused `.typ`; AC1 names `books:add`, and only the usage text is tested.

### C-012: Three places where the plan and INT-0033's wording part
- **Where:** `build-plan.md` T-090 clauses 2 and 4; `test-plan.md` AC6 row; INT-0033 AC5, AC6.
- **Quote:** "a picture that is a regular file inside the library entry's folder" against AC6 "no file outside the paper's own folder is read".
- **Failure mode:** intent-drift.
- **Why it matters:**
  - In a folder, `latex/paper.tex` with `\includegraphics{../shared/x.png}` is staged from outside the paper's folder.
  - AC5 says a piece is "named, with its file"; the report's words (`2 pieces of LaTeX not shown (tikzpicture, \mycmd)`) drop the file, so a piece in `appendix.tex` is not told apart.
  - The traceability row for AC6 leaves out "Nothing is fetched from the network".
- **Suggested response:** fix-in-plan.
  - Either AC6 names pictures as the exception or T-090 narrows.
  - Print the file when it is not the paper's own.
  - Add the sentence that pandoc runs on a file system held in memory with no network. That held when read in `src/core.js`: pandoc can open nothing but what Tome hands it.

### C-013: Things a real paper commonly holds that are neither carried, marked nor named
- **Where:** `build-plan.md` T-088 clauses 1–3; T-089 clauses 1, 5, 6; T-092 clause 1.
- **Quote:** "WHEN a paper refers to a label that is nowhere in it … `leftOut` SHALL count `{ kind: 'reference', detail: <label> }`".
- **Failure mode:** missing-risk.
- **Why it matters:** each was tried.
  - `\title{…\thanks{…}}` puts a footnote inside `meta.title`. What `title` (sidebar, spine) holds is unsaid, and likewise for a skipped piece in a title.
  - `\label` on an `\item` reaches the tree as an empty `Span` with the id, and `\ref` to it reads `[it:one]`. `\cref{sec:a,sec:b}` reads `[sec:a,sec:b]`. Both would be reported as "a label that is not there", which is untrue.
  - `\cref{sec:a}` and `\autoref{sec:a}` read a bare `1`, so "see 1" loses the word "Section".
  - Pandoc's numbers are not LaTeX's: two subfigures and their figure are 1 and 3, and a section after `\appendix` is 2, not A.
  - `\caption{Alg}` inside an unknown environment (`algorithm`) vanishes with no notice at all.
  - `\date{\today}` becomes the day of the build, so the staged chapter changes daily.
  - A Typst label after a heading with no blank line is the first inline of the next paragraph, not "alone in a paragraph".
  - Typst `@nowhere` is a `Cite`, not a link; `test_paper_typst_references` says "counted" without saying as which kind.
- **Suggested response:** defer-with-rationale for the numbering, `\cref` wording and the lost caption (name them in INT-0033's "Not read" and in T-092's table). Fix-in-plan for the title, the `Span` labels (anchor them, or word the report "could not be followed") and the Typst label's place.
- Tried and held: `\texorpdfstring`, `\paragraph`, starred sections, `\footnotemark` with `\footnotetext`, `\verb`, accents and Unicode, `\href` with `run:` and `file:` addresses (stripped by clause 11), nested `subfigure`, `\multicolumn`, book-class levels down to `\subparagraph`, and a Typst title from `#set document`.

### C-014: T-089 holds three separable outcomes
- **Where:** `build-plan.md` T-089.
- **Quote:** "References, an equation's number, and citations".
- **Failure mode:** granularity.
- **Why it matters:** the `rehype-math` change alters every Markdown chapter (INT-0030's surface) and can be tested and reverted alone. Citations and the bibliography share nothing with it but the file.
- **Suggested response:** fix-in-plan. Split into references in the writer, the equation link in `rehype-math`, and citations; or reject with the reason the three must land together.

### Checked and held (no concern)
- **The `<a id="…"></a>` anchor.** It survives the pipeline and adds nothing to search's heading addresses (slugs come from headings only). One correction to the Notes: read back, it is a paragraph holding inline HTML, not a block of HTML (tried with `remark-parse` and `remark-stringify`). It has no height, so it should add no gap; not checked in a browser. `test_paper_typst_references`' "no empty paragraph" should not count it.
- **Pandoc's shapes.** `SkippedContent` carries `source`, `line`, `column` and `contents`. `\eqref` and `\ref` to an equation are links reading `[eq:…]`. `\ref{nowhere}` reads `[nowhere]`. `thebibliography` and unknown environments come as begin and end pieces. A Typst package gives `HOME not defined`.
- **CI and E2E.** CI installs Chromium and WebKit. E2E status "possible" is right.
- **Intent links.** INT-0033 is linked, planned and carries the plan's three written-out details. INT-0030's consequence was amended to match T-089.

## Confidence
block

## Responses (the sprint's author)

Each fix was tried in a scratch folder before it was written into the plans.
Task numbers are those of the revised plan: the old T-089 is now T-089
(references), T-090 (the equation's link) and T-091 (citations); the old
T-090, T-091 and T-092 are T-092, T-093 and T-094.

| Concern | Answer |
|---|---|
| C-001 files in a subfolder | Fixed. T-087 gives each such file to pandoc under a name with no `/` and rewrites the argument that names it in the in-memory copy; a `source` pandoc reports is turned back to the real path. Tried: `\input{sections/intro}`, `\include`, Typst `#include` and `#import` all read this way. The fixtures gain `sections/closing.tex`, `parts/closing.typ` and `lib/house.typ`, and `test_pandoc_own_files` and `test_pandoc_typst_tree` try a second level too. |
| C-002 the gate's exact assertions | Fixed as suggested. The papers get a build of their own in `check:documents` and a spec of their own (`e2e/papers.spec.ts`) in a mode of its own with two engines; the existing build, spec and Chromium-only run are untouched, and `test_papers_e2e_mode` holds that. |
| C-003 the two readings | Fixed, all four. One entry for each distinct file, line, column and contents; tabs made spaces in the copies before the first reading; `placed` is decided from the second tree; a refused second reading returns the first tree with every piece unplaced. A piece outside the tree is counted without a mark (T-088 clause 12 c). A test for each. |
| C-004 the closed quiet list | Fixed by a rule in three parts (T-088 clause 12): a layout command of the list, a bare `\begin`/`\end`, a bibliography piece or anything from a `.sty` is passed over; a placed environment or a command with an argument is marked and counted; everything else, a bare command above all, is counted with no mark. So `x\quad y` and `{\small text}` take no mark whatever the list holds. The list is longer by the commands the review found. `.cls` is dropped from T-087. No paper of another's was tried: fetching one is a download the owner has not allowed, and INT-0033 now says so and says the list will grow. |
| C-005 the form of a set-apart formula | Fixed by the first suggestion: a formula's LaTeX is carried on one line, comments dropped (T-088 clause 8). Tried with Tome's `settleEquations`: the review's formula, refused as typed, comes back whole on one line. The clause now says what the reader gives, not how the lines look. The mark is the new module's own export, so `docx-to-markdown.mjs` is not touched. `test_paper_formula_one_line` holds it. |
| C-006 the equation's link | Fixed (T-090). Labels are read from the formula's own LaTeX and matched to the rows Temml marked, in order; the `id` is Tome's own (`eq.` and the label), which holds a full stop and so cannot be a heading's address or an anchor of T-089's; addresses are compared after decoding; the clash clause is gone; `test_papers_latex` and `test_papers_typst` check that no `id` stands twice on a built page. |
| C-007 citations from `citeproc` | Fixed as suggested: `link-citations` (tried: one link for each entry; `#ref-nobody` for a missing key). T-091 writes those links and counts each whose entry is not in the list. `\printbibliography` is on the layout list. Several `.bib` files: each that is there is given, each that is not is `missing`. Cases added for two keys and for a missing key. |
| C-008 an imported Typst module | Fixed: `#import "x.typ"` is treated as `#include` (T-086 clause 3), INT-0033 AC1 says "includes or imports", and the case is in `test_source_fragments_left_out`. |
| C-009 fixtures made too late | Fixed: the fixtures are made in T-087. |
| C-010 a test that cannot fail | Fixed: `test_read_documents_no_paper_no_pandoc` runs in the test's own process with a stand-in whose loading throws, and proves the stand-in is in place by a second call that must reject. |
| C-011 words written for Word | Fixed. `Underline`, `SmallCaps` and `Span` are written as their words with no count; a node with no rule is its own kind (`node`) with its own words; `find-books.mjs` and the refusal sentence in `document-source.mjs` name the kind by format; `books:add` is tested on a `.tex` file and on a folder with a refused `.typ` (T-092). |
| C-012 the plan and the intent's wording | Fixed. Pictures are staged only from the paper's own folder (T-092 clause 2, with a case for `../shared/x.png`); a piece from another file is named with that file; AC6's "nothing is fetched" has a clause and `test_pandoc_fetches_nothing`. |
| C-013 what a real paper holds | Fixed: a note or a skipped piece in the title (T-088 clause 1); a label pandoc keeps as an empty mark (T-089 clause 4); the place of a Typst label (T-089 clause 6); `\today` (T-087 clause 6); a Typst `@nowhere` is a citation with no entry (T-091 clause 4). Deferred, with each named in INT-0033's Consequences and in T-094's chapter: pandoc's numbers differing from the PDF's, the word `\cref` and `\autoref` would add, several labels in one reference (shown as written and counted), and a caption inside an unknown environment, which pandoc drops with no notice. |
| C-014 one task, three outcomes | Fixed: divided into T-089, T-090 and T-091. T-090 depends on nothing and can be reverted alone. |
