# Plan Critique — Sprint 26

Second review, read-only. Nothing in the repository or in the trial folder was touched. Every "tried" below was run with `pandoc-wasm` 1.1.0 (imported from the trial folder), Tome's own modules, and Temml and Playwright from Tome's `node_modules`, from scripts `q1.mjs`–`q10.mjs` in a new scratch folder of my own, `plan-critic-26-round2`.

## Concerns

### C-001: A layout command that swallows a braced group takes the paper's words with it, silently
- **Where:** `build-plan.md` T-088 clause 12 (a) and the layout list; `test-plan.md` `test_paper_layout_commands_quiet`; INT-0033 AC5.
- **Quote:** "passed over, with no mark and no count, when it is a layout command of the exported list (by its name, with or without a star or arguments), or is only `\begin{…}` or `\end{…}`".
- **Failure mode:** intent-drift (AC5, "Nothing vanishes without a word"); EARS-vague for `\begin{name}[…]`.
- **Why it matters:** tried: for a command pandoc does not know, `contents` holds every braced group that follows it.
  - `\noindent{\bf Keywords:} sums, proofs.` gives the piece `\noindent{\bf Keywords:}`; the tree holds only "sums, proofs."
  - `\centering{\includegraphics{a.png}}` in a figure gives one piece holding the picture; the figure keeps only its caption.
  - `\color{red}{Red words}` gives one piece holding both groups. The same for `\quad{…}`, `\protect{…}`, `\relax{…}`, `\null{…}`.
  - Rule (a) passes each over by its name, and the test's "with an argument" case would hold that in place.
  - `\begin{definition}[Compactness]` (an environment a class defines, and no class is read) gives the piece `\begin{definition}[Compactness]`; the name is in no tree. `\begin{tcolorbox}[title=Note this]` and `\begin{algorithm}[t]` have the same shape. The clause does not say whether that is "only `\begin{…}`" (a) or "a command followed by an argument" (b).
  - Held: `\large{…}`, `\small{…}`, `\Huge{…}`, `\hfill{…}`, `{\large …}`, `{\color{red} …}` and `{\centering …}` give the command alone, and the words are kept.
- **Suggested response:** fix-in-plan.
  - Give each entry of the list the number of arguments it takes (none for most). A piece that holds more groups than that falls to (b).
  - Say that a `\begin{name}` with an argument after its name is (b), and a bare one is (a).
  - Add those cases to the tests, and change "with an argument" to "with the arguments it takes".
- **Response (the sprint's author):** fixed in the plans as suggested. Each entry of the layout list now has the number of
  arguments it takes, and a piece that holds more groups than that is marked and counted
  (T-088 clause 12). A `\begin{name}` with anything after its name is marked; a bare one is
  passed over. `test_paper_skipped_marked` has the review's four cases, and
  `test_paper_layout_commands_quiet` gives each command the arguments it takes. INT-0033 AC5
  now says a layout command is passed over only when it holds nothing of the paper's.

### C-002: A reference to an equation that T-090 cannot serve is a dead link, and nothing counts it
- **Where:** `build-plan.md` T-089 clause 3, T-090 clauses 3 and 4; `test-plan.md` `test_math_label_rows`, `test_math_label_unreached`; INT-0033 AC5.
- **Quote:** "the Markdown SHALL hold a link whose words are the label and whose address is `#` and the label" / "WHEN the two counts differ, THEN the formula SHALL be treated as having no label" / "the link unchanged".
- **Failure mode:** intent-drift (AC5, "A reference … that leads nowhere is shown as written and counted"); the fix adds a dependency.
- **Why it matters:** T-089 writes the link for any label in a formula, and T-090 leaves it alone when it cannot serve it. The page then shows a link reading `eq:ea` that leads nowhere, and `leftOut` holds nothing. Tried:
  - `eqnarray`: Temml refuses it, so the formula is `[equation not shown]` and the `\eqref` to it stays a link.
  - `\begin{equation}\begin{split} … \label{eq:in} … \end{split}\end{equation}` (and `aligned`): the row is numbered but Temml writes no `id`, so one label meets no row.
  - `subequations`: pandoc hands over `\label{eq:all}\begin{align} … \label{eq:sa} … \label{eq:sb}\end{align}`. Temml marks two rows and the LaTeX holds three labels, so the counts differ and the links to `eq:sa` and `eq:sb`, both numbered, die too.
  - A label on a `\notag` row beside labelled rows: three labels, two rows, the same.
  - `equation*` and `\[ … \label{x} \]`: no number.
- **Suggested response:** fix-in-plan.
  - Match a row to a label by Temml's `id` (the label stripped to letters, digits and `_`), in order, not by equal counts. A label with no row is then only unreached. Read labels after `%` comments are dropped.
  - T-090 exports which labels of a formula take a number. T-089 writes the link only for those; for any other, and for a formula that became `[equation not shown]`, it writes pandoc's words as text and counts `reference`. T-089 then depends on T-090.
  - Add to `test_papers_latex` and `test_papers_typst`: every link whose address begins `#` has an element with that `id`.
- **Response (the sprint's author):** fixed in the plans as suggested. T-090 matches a row to its label by Temml's mark, in
  order, so a label that meets no row costs the other labels nothing, and exports
  `numberedLabels()`. T-089 writes the link only for a label whose row takes a number in a
  formula that is written as a formula; any other is pandoc's words as text, counted as a
  reference that cannot be followed. T-089 now depends on T-090. Both browser tests check
  that every link beginning `#` has its element.

### C-003: With `citeproc`, a `.bib` that is named but not given refuses the whole paper
- **Where:** `build-plan.md` T-087 clause 3 and Notes; `test-plan.md` `test_pandoc_bibliography`.
- **Quote:** "each that is not there SHALL be in `missing`".
- **Failure mode:** hidden-dep (the clause rests on a behaviour that was not tried).
- **Why it matters:** tried: `\bibliography{refs,more}` with `refs.bib` given and `citeproc: true` gives `File 'more.bib' not found in resource path` and no tree. `bib/refs.bib` as written does the same, in LaTeX and in Typst. The plan names no way round it.
- **Suggested response:** fix-in-plan, one sentence. Tried and works for both formats: pass the files that are there in pandoc's `bibliography` option under their flat names. The option replaces the paper's own list, so no argument needs rewriting.
- **Response (the sprint's author):** fixed, in one sentence of T-087 clause 3: the `.bib` files that are there are named to
  pandoc in its `bibliography` option under their stand-in names. `test_pandoc_bibliography`
  asserts that the paper is not refused in any of its cases.

### C-004: AC1 says `books:find` takes the two kinds; it takes no document today, and no task changes that
- **Where:** INT-0033 AC1; `build-plan.md` T-086 Notes; `test-plan.md` AC1 row.
- **Quote:** "`books:find` and `books:add` take the new kinds through `resolveSource()`".
- **Failure mode:** intent-drift (an acceptance criterion with no work and no verification).
- **Why it matters:** `scan()` in `scripts/find-books.mjs` lists only folders that `looksLikeBook()` accepts, which are mdBooks. `resolveSource()` is called only by `describeForAdd()`. INT-0029 AC1 names `books:add` alone. The only test on the `books:find` side is the usage text.
- **Suggested response:** fix-in-plan. Reword AC1 to `books:add`, as INT-0029 has it, and correct the Note. Otherwise plan the scan and a test for it.
- **Response (the sprint's author):** fixed by rewording. INT-0033 AC1 names `books:add` alone, as INT-0029 does, and T-086's
  note says `books:find` lists mdBook folders only and is not changed.

### C-005: Two tests contradict the clauses they test, and INT-0030 names the old task
- **Where:** `build-plan.md` T-093 clause 3, T-087 clause 5; `test-plan.md` `test_pandoc_today`; INT-0030 Consequences.
- **Quote:** "`[nowhere]` and `[missing]` SHALL stand as text" / "the tree's `meta.date` holds no digit" / "Sprint 26 plans that link (INT-0033, T-089)".
- **Failure mode:** plan-test-mismatch.
- **Why it matters:**
  - The fixture's `\cite{gauss,missing}` is written `[1, missing]` by T-091 clause 4 and `test_paper_citation_no_entry`, so `[missing]` is not on the page.
  - The tree returned is the second reading's, in which `\today` is its word, and the word holds sixteen hex digits. `test_paper_front_matter` expects exactly that word in `meta.date`.
  - The equation's link is T-090 now.
- **Suggested response:** fix-in-plan, a line each.
- **Response (the sprint's author):** fixed, a line each. The page shows `[1, missing]` with `missing` as text; `test_pandoc_today`
  expects the piece's word in `meta.date` and nothing else; INT-0030 names T-090.

### C-006: A Typst paper's reference list, authors and labels
- **Where:** `build-plan.md` T-088 clauses 1–3, T-091 clause 2, T-089 clause 6; `test_papers_typst`.
- **Quote:** "every other heading SHALL keep its level" / "under a heading `References` at the level of the paper's sections when no heading stands directly before it".
- **Failure mode:** EARS-vague.
- **Why it matters:** tried with the research paper in Typst and a `refs.bib`.
  - Pandoc itself writes a level-1 header `References` before the list. In the fixture's case (the title is the first heading) it keeps level 1, so the chapter has a second `#` heading.
  - With a Hayagriva `.yml`, or with the `.bib` absent, pandoc still writes that header and an empty `Div` `refs`: a heading over nothing.
  - `meta.author` comes from `#set document(author: …)`, which Typst does not print. The fixture also sets its authors in the text, so its page would show them twice.
  - A label after a paragraph's words, a block or a formula within a line is a `Span` at that place, and `@name` is a link reading `[name]`. Clause 6 covers only a heading, table, figure and set-apart formula.
- **Suggested response:** fix-in-plan.
  - The list's heading is written at the sections' level, and an empty list writes nothing.
  - Say what a label on anything else gives: an anchor within the line, or shown as written and counted.
  - Decide whether a Typst paper's `meta.author` is written.
- **Response (the sprint's author):** fixed in the plans. One heading `References` at the sections' level, pandoc's own being
  that heading; an empty list writes nothing (T-091 clause 2). A Typst label after anything
  else is an anchor within the line, and a reference to it a link with pandoc's words
  (T-089 clause 6). A Typst paper's `meta.author` is not written (T-088 clause 3), so the
  authors stand once; `test_papers_typst` checks both.

### C-007: T-090 takes over a link that today leads to a heading
- **Where:** `build-plan.md` T-090 clauses 1 and 2; `test-plan.md` `test_math_label_link_words`, `test_math_no_link_no_change`.
- **Quote:** "`[words of mine](#eq:gauss)` → its words kept and its address rewritten".
- **Failure mode:** intent-drift (INT-0030's boundary).
- **Why it matters:** take a Markdown chapter with a heading "Pythagoras", a numbered formula holding `\label{pythagoras}`, and a link `[the theorem](#pythagoras)`. Today the link leads to the heading; after T-090 it leads to the equation. Round 1's clash clause was dropped, not re-scoped, and the boundary test covers only pages with no link to a label. Only a label of lower-case letters, digits and hyphens can match a heading's address; one with `eq:` cannot.
- **Suggested response:** fix-in-plan or defer-with-rationale. Either rewrite only a link whose words are empty or are the label (the two forms Tome writes and the tutorial teaches), or record in INT-0030's Consequences that a label takes such a link.
- **Response (the sprint's author):** fixed by the first suggestion. T-090 changes only a link whose words are empty or are
  the label; any other link is left as it is, address and all. `test_math_label_link_words`
  has the heading named `pythagoras`, and INT-0030's consequence says the same.

### C-008: Constructs common in papers that lose content and are named nowhere
- **Where:** `build-plan.md` T-092 clause 2, T-088 clause 12, T-091 clause 4; INT-0033 "Not read" and its limits; `research-report.md` §4.
- **Quote:** "No paper written by anyone else has been tried; INT-0033 says so."
- **Failure mode:** missing-risk.
- **Why it matters:** each was tried.
  - `\graphicspath{{figures/}}` with `\includegraphics{triangle}`: pandoc reports nothing and gives the address `triangle`, so every figure of such a paper is `[image not shown]`.
  - `\resizebox{\textwidth}{!}{\begin{tabular}…}` in a `table`: one skipped piece. In the second reading the word stands, the `\caption` is dropped with no notice, and `\ref` reads `[tab:r]`. INT-0033's limit names only an unknown environment.
  - A `.bbl` beside the paper with the `.bib` absent (the usual arXiv source) is not read, so every citation has "no entry", though T-091 clause 3 could read its `thebibliography`.
  - `\index{…}`, `\enlargethispage{…}`, `\linespread{…}`, `\markboth{…}{…}` and `\pdfbookmark{…}{…}` are not on the list, so each takes `[LaTeX not shown]`.
  - `\etal`, `\eg`, `\BibTeX`, `\checkmark`, `\degree` and `\dag` are dropped by pandoc. Rule (c) counts them with no mark; AC5 allows that but calls a bare command "spacing or type".
  - Not this sprint's making: today's `settle()` writes two numbers, `(1)` and `(2)`, on a `multline` of two lines. Every paper with a `multline` will show it, and later numbers shift.
- **Suggested response:** fix-in-plan for `\graphicspath` (read it from the paper's text, under the same folder rule) and for the list's additions. Defer-with-rationale for the rest, each named in INT-0033's limits and T-094's table; `multline` as a line in T-090 or a work item of its own.
- **Response (the sprint's author):** fixed for `\graphicspath` (T-092 clause 2, under the same folder rule) and for the
  list's additions (T-088's notes). Deferred, each named in INT-0033's limits and in T-094's
  chapter: a table inside `\resizebox`, a `.bbl` with no `.bib`, and bare commands that
  print a word or a sign, which are named in the report without a mark. The two numbers on
  a `multline` are INT-0030's and are queued as T-095.

### C-009: Small corrections, a line each
- **Where:** `build-plan.md` T-087 clauses 2, 6, 7 and Notes, T-088 clause 8, T-091 clause 3, T-092 clause 4, Touches of T-087 and T-090; `test-plan.md` `test_left_out_paper_words`.
- **Quote:** "the argument that names it is rewritten in the in-memory copy of the file that names it".
- **Failure mode:** EARS-vague and plan-test-mismatch.
- **Why it matters:**
  - **A name made by a macro.** Tried: `\newcommand{\sec}[1]{\input{sections/#1}}` gives pandoc's notice with the path and place, but there is no argument to rewrite. Say the file is then `missing`.
  - **Typst paths.** `#include "/parts/two.typ"` is asked for as `./parts/two.typ`. A file read by `csv()` or `read()` refuses the paper though it is there. Say so in clause 7.
  - **`\today` in code.** Pandoc keeps `\verb|\today|` and `verbatim` as code, so a replacement made before the reading puts the word in code. Say "outside verbatim".
  - **A `%` that ends a line.** TeX joins the lines with nothing; the rule joins with a space (`\text{foo%⏎bar}` came back `foo bar`).
  - **Touches.** The kept tree JSON (T-087, T-088) and T-090's kept output are in no Touches, and the Typst tree used by `test_paper_typst_references` has no check against a fresh reading.
  - **Limits.** 20 rounds, 200 files and 20 MB are in Notes only: no clause, no test.
  - **A piece from another file.** No test carries one through to the printed line (`\appcmd in appendix.tex`); T-088 and T-092 each test their side with a `detail` written by hand, and `writePaper()` is not told which file is the paper's own.
  - **Citations with the paper's own list.** A prefix (`\citep[see][ch.~2]{…}` gives `citationPrefix`) and `\citet` or `\citeauthor` are unsaid.
  - **Repeated names.** An algorithm's `\State` would be named five times in one line; name each once.
- **Suggested response:** fix-in-plan.
- **Response (the sprint's author):** fixed, each in its clause. A file whose name a command of the paper's makes is `missing`;
  Typst paths beginning `/` and files read by `csv()` or `read()` are in T-087 clause 7;
  `\today` is replaced outside code only; a line that ends in a comment is joined to the
  next with nothing; the kept trees and T-090's kept output are in Touches, and the Typst
  tree is compared with a fresh reading; the limits are a clause with `test_pandoc_limits`;
  `writePaper()` is told the paper's own file, and `\appcmd in appendix.tex` is carried from
  the fixture to the loader's printed line; a prefix and the other citing commands are in
  T-091 clause 3; a name is given once.

### The fourteen first-round concerns
- **Answered:** C-002, C-003, C-005, C-008, C-009, C-010, C-011, C-012, C-014.
- **C-001 (subfolders):** answered for what was claimed. What remains is C-003 and the first two items of C-009 above.
- **C-004 (quiet list):** the rule is now a class, but see C-001 above. No real paper was tried; that is deferred with a reason in INT-0033, which I accept.
- **C-006 (equation link):** the `id` and the decoding are answered. What remains is C-002 and C-007 above.
- **C-007 (citations):** answered except for C-003 above.
- **C-013 (real papers):** answered except for the `\today` test (C-005) and Typst labels elsewhere (C-006).

### Tried and held (no concern)
- **Stand-in names.** `\include{sections/more}`, a LaTeX file two levels down that inputs another, and a Typst file two levels down that includes a sibling all read under flat names. A skipped piece in a stand-in file comes back with the stand-in's name as `source`, so it can be turned back.
- **The fixture.** Built as T-087 describes, pandoc skips exactly what `test_pandoc_skipped_placed` lists. Pandoc writes the build's day for `\today` (`2026-11-24`), so clause 6 is needed.
- **The second reading.** A word inside a `table` or `figure` leaves the table, figure, caption and number intact; a word in `\date{…}` is `meta.date`.
- **One-line formulas.** Pandoc hands a formula over with its comments and lines as typed, within a line too. Joined to one line, formulas holding `\\%`, `\%`, `\$`, a backtick, `<`, `*`, `_` and `|` came back whole from `settleEquations`.
- **T-090.** Temml marks the right rows for `align` with `\notag`, `\tag` with `\label` in either order, `gather`, `multline` and `alignat`. A link to `mtr#eq.eq:one` scrolls to the row and makes it `:target` in Chromium and in WebKit, percent-encoded too.
- **T-091.** `link-citations` works for a Typst paper. `citationSuffix` holds `p. 3` without a `.bib`. With `citeproc`, `\citep`, `\citet`, `\textcite`, `\parencite`, `\citeauthor` and `\citeyear` are each a `Cite` with links, which clause 1 covers.
- **T-093.** `fixture-gate.mjs` already has `buildWithOutput()`, and a fourth build inside `withFixture()` fits how it owns the build and restores the library.
- **Boundaries and numbering.** No existing test pins a sentence T-086 or T-092 changes. The renumbering is consistent across both plans; the one stale number is in INT-0030 (C-005).
- **Failure modes 1, 6 and 7.** Every task has measurable EARS clauses, E2E status "possible" is right, and I raise no granularity concern.

## Confidence
proceed-with-caveats

The plans are sound in structure and the first round's blocking faults are answered. C-001 and C-002 are AC5 errors that planned tests would hold in place, so they should be fixed in the plans before the lock, not deferred; C-002's fix adds a dependency of T-089 on T-090. With those two and C-003 to C-005 fixed as suggested, I see no need for a third review.
