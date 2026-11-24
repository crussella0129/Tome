# Test Critique — Sprint 26

This is a read-only second review at head `21ad786`, with the tested code at `2fe447b`. Nothing in the repository was edited, staged or built, and `git status` was empty before and after. I ran every reproduction through Tome's own `readPaper()`, `prepareDocument()` and `resolveSource()`, using the installed `pandoc-wasm` 1.1.0, on papers I wrote in a scratch folder outside the repository. Any paper that might loop was run under `timeout`. I also ran `npx vitest run src/lib/__tests__/pandoc-to-markdown.test.ts`, and all 37 tests passed.

## Concerns

### C-001: the cycle guard refuses papers pandoc can read, and still hangs on cycles it cannot see
- **Where:** `refuseCycle()` in `scripts/pandoc-read.mjs`; `unit-tests.md` (to be rewritten) `test_pandoc_input_cycle`; `build-plan.md` T-087 clause 10; INT-0033 AC5; critique round 1 C-010 answer.
- **Quote:** "before each reading the files read so far are looked at for a cycle, and the paper is refused with the loop named"
- **Failure mode:** negative-path
- **Why it matters:** The guard reads the files' text as plain text. It strips comments but not code. So when a paper *shows* an `\input` in code, the guard counts it as an edge, and Tome refuses a paper that pandoc reads correctly. The whole paper then becomes a `[document not shown]` chapter. Before the fix, these papers were read correctly, so this is a regression. In the other direction, the guard misses a real cycle that goes through a macro or a variable, and the build still hangs forever. The test has no case for either.
- **Suggested response:** add-test (a listing, a `\verb` and a Typst raw block that name their own file, read correctly; a cycle through a macro), and scan with code removed. `TODAY_OR_CODE` already finds LaTeX code; for Typst, strip raw blocks. For the hang, either bound a reading's time, for example by running pandoc in a worker with a time limit, or record the limit in INT-0033.
- **Reproduction:**
  - **A listing in `build.tex`:** `thesis.tex` holds `\input{build}`. `build.tex` holds `\begin{verbatim}` / `\input{build}` / `\end{verbatim}` / `Done.`
    - Out: `PaperRefused: its files pull each other in without end: build.tex → build.tex`
    - Should be: the section, with the listing shown as code.
  - **Variations, all refused:**
    - an `lstlisting` in `build.tex` that shows the main file's `\input{thesis}`: refused with `thesis.tex → build.tex → thesis.tex`;
    - `Write \verb|\input{intro}| to read this file.` in `intro.tex`;
    - a Typst raw block holding `#include "build.typ"` inside `build.typ`;
    - plain Typst prose, `Typst can import "a.typ" into any file.`, inside `a.typ`.
  - **Macro cycle:** `\newcommand{\chap}[1]{\input{#1}}`, then `p.tex` holds `\chap{a}`, `a.tex` holds `\chap{b}`, and `b.tex` holds `\chap{a}`. No answer after 100 s. The same paper without the cycle reads in under 1 s.
  - **Typst variable cycle:** `#let part = "one.typ"` / `#include part` in `main.typ`, and `one.typ` includes `main.typ` the same way. No answer after 100 s.
  - **What held:** a file included by two others (a diamond); the same file by `\input` and by `\include`; `\input{x}` where both `x` and `x.tex` exist; `50\% done \input{a}`.

### C-002: a picture in a Typst chapter can be replaced by another picture with the same name
- **Where:** `preparePaper()` in `scripts/document-stage.mjs`; `document-stage.test.ts` `test_prepare_paper_pictures_by_path`; `build-plan.md` T-092 clause 2; INT-0033 AC2 and AC5; critique round 1 C-007 answer.
- **Quote:** "a picture is looked for beside each file that was read"
- **Failure mode:** weak-assertion
- **Why it matters:** The code does not look beside the file that named the picture. It looks in the paper's folder first, then in the folder of *every* file that was read, in reading order. In a Typst thesis with one folder per chapter, a name that two chapters share shows the first chapter's picture in both. The same happens when the paper's own folder holds a picture of that name. There is no mark and no count, so the author's figure disappears with no notice. Before this fix the picture took the mark; now it is wrong and nothing says so. The test uses names that are all different, so it passes whichever folder is searched. Its title, "beside an included file", promises more than it checks.
- **Suggested response:** tighten-assertion (two chapters, each with its own `fig.png` of different bytes, each page pointing at its own) and fix. Either rewrite `image("…")` paths in each included file's copy so they are read from the paper's folder, the way include paths already are, or take the mark when a name is found in more than one folder.
- **Reproduction:**
  - **Two chapters:** `main.typ` holds `#include "ch1/ch1.typ"` and `#include "ch2/ch2.typ"`. Each chapter file holds `#image("fig.png")`, and `ch1/fig.png` and `ch2/fig.png` have different bytes.
    - Out: both images are `./__tome_parent_assets__/ch1/fig.png`, only `ch1/fig.png` is staged, and `leftOut` is `[]`.
    - Should be: chapter two shows `ch2/fig.png`.
  - **Picture at the root:** `logo.png` sits beside `main.typ`, and `ch1/ch1.typ` holds `#image("logo.png")` beside its own `ch1/logo.png`. Out: the root's logo, twice.
  - **What held:** the round-1 cases (`/figs/root.png`, `sub/near.png`); `/../secret.png` and `/./ok/../../secret.png` both take the mark and are counted, so AC6 holds; a LaTeX `\includegraphics{/figs/a.png}` takes the mark even when `figs/a.png` exists.

### C-003: the `table*` rewrite changes code the paper shows
- **Where:** `asCopy()` in `scripts/pandoc-read.mjs`; `test_pandoc_wide_table`; INT-0033 AC2 ("code … shown") and AC5.
- **Quote:** "`table*` is written `table` in the copy, which pandoc reads with its caption and label"
- **Failure mode:** weak-assertion
- **Why it matters:** The replacement runs over the whole file before the pass that leaves code alone. So `verbatim`, `lstlisting` and `\verb` all show `\begin{table}` where the paper wrote `\begin{table*}`, with no mark. A paper that explains two-column layout shows the wrong code. The test checks that the source on disk is unchanged, but nothing checks the code shown on the page.
- **Suggested response:** add-test, and do the rewrite inside the `TODAY_OR_CODE` callback, so that code matches are returned unchanged.
- **Reproduction:** `\begin{verbatim}` / `\begin{table*}[t]` / `\caption{Wide}` / `\end{table*}` / `\end{verbatim}`, then `\verb|\begin{table*}|` and an `lstlisting` holding the same lines.
  - Out: a code block reading `\begin{table}[t]` … `\end{table}`, the inline code `` `\begin{table}` ``, and the same change in the listing. `leftOut` is `[]`.
  - Line numbers are not affected, because the rewrite adds and removes no lines.

### C-004: Typst names with a colon still go wrong in two cases, and neither is recorded
- **Where:** `joinedLabel()` in `scripts/pandoc-to-markdown.mjs`; `test_paper_typst_colon_labels`, `test_prepare_paper_typst_colon_label`; INT-0033 AC4 and the Consequences list.
- **Quote:** "a citation followed by `:rest` or `.rest` is the label of that name when the paper holds one"
- **Failure mode:** intent-coverage
- **Why it matters:** The join applies only when pandoc wrote a `Cite`, and only for labels, not for bibliography keys.
  - **Bibliography key with a colon:** with a `.bib` holding `knuth:1984`, `@knuth:1984` is shown as `(**knuth?**):1984`, and the report says "citation with no entry (knuth)". The entry is in the list, so the report names a key the paper never used. `#cite(<knuth:1984>)` works. Keys like `author:year` are common in BibTeX.
  - **Label that is a prefix of another:** when a label `<sec>` exists, pandoc writes a `Link` rather than a `Cite`. Then `@sec:a.b` (label `<sec:a.b>` on a second heading) is written as a link to the first heading followed by `:a.b`. It leads to the wrong section and is not counted.
- **Suggested response:** defer-with-rationale: name both in INT-0033 and *Find Your Books*, and add a test that the report for `@knuth:1984` holds what the plan says. Optionally extend the join to a `Link` whose next text completes a longer existing label.
- **Reproduction:**
  - `As @knuth:1984 agrees.` with `#bibliography("refs.bib")` gives `(**knuth?**):1984 agrees.` and `[{"kind":"citation","detail":"knuth"}]`.
  - `== Intro <sec>` / `== Two <sec:a.b>` / `Then @sec:a.b.` gives `Then [Intro](#ref-sec):a.b.`, with no anchor on "Two" and `leftOut` `[]`.
  - **What held:** `@sec:intro` and `@eq:one` with and without a `.bib`; `@sec.` at a sentence's end is left alone.

### C-005: the paper's own list takes over the heading before it, and that heading's anchor is lost
- **Where:** `arrangeBibliography()` / `ownList()` in `scripts/pandoc-to-markdown.mjs`; `test_paper_own_bibliography_heading_and_twice`; INT-0033 AC4 and AC5.
- **Quote:** "`\section*{References}` before the list is its heading, once"
- **Failure mode:** weak-assertion
- **Why it matters:** *Any* heading directly before `thebibliography` is taken for the list's heading, and its label is dropped.
  - A `\ref` to that section points at `#ref-sec-refs`, which no longer exists on the page. The link is dead and nothing counts it.
  - An empty `\section{Conclusion}` just before the list becomes the list's heading, and the word "References" is gone.
  - A related gap: `\hyperref[sec:none]{nowhere}`, a link to a label that does not exist, is written as bare words and not counted, against AC5's "a reference … that leads nowhere is … counted". The test `test_paper_own_link_to_label` asserts the words but not `leftOut`.
- **Suggested response:** add-test, and keep the heading's anchor (write it before the list's heading). Take the heading only when its words are the list's own (References / Bibliography). Count an own link whose label is nowhere.
- **Reproduction:**
  - `See Section~\ref{sec:refs}` … `\section{References}\label{sec:refs}` directly before `\begin{thebibliography}{9}`.
    - Out: `See Section [2](#ref-sec-refs)`, no `id="ref-sec-refs"` anywhere on the page, and `leftOut` `[]`.
  - `\section{Conclusion}` directly before the list gives `## Conclusion` over the numbered list.

### C-006: a nested file's internal stand-in name appears in code the paper shows
- **Where:** the rename of `\input{…}` in `readLatex()` and of `"…"` in `readTypst()`, `scripts/pandoc-read.mjs`. This fault predates `2fe447b`; it was not found in round 1.
- **Quote:** "the argument that names it is rewritten in the copy of the file that names it"
- **Failure mode:** weak-assertion
- **Why it matters:** The rename runs over the whole file, so code blocks on the page show Tome's internal name for the file.
- **Suggested response:** add-test and fix together with C-001 and C-003: change nothing inside code.
- **Reproduction:**
  - `\input{chapters/intro}`, then a `verbatim` block showing `\input{chapters/intro}`. Out: a code block reading `\input{tomefile1}`.
  - Typst: `#include "chapters/intro.typ"` and a raw block showing the same line. Out: `#include "tomefile1.typ"`.

### C-007: a timing assertion in the cycle test
- **Where:** `pandoc-read.test.ts` `test_pandoc_input_cycle`.
- **Quote:** "`expect(Date.now() - started).toBeLessThan(30_000)`"
- **Failure mode:** flake-risk
- **Why it matters:** The limit measures how long a refusal takes, which includes up to two real pandoc readings and the first load of the 56 MB wasm. A slow CI runner could fail it with no fault in the code. The 120 s test timeout already shows that the reading stops.
- **Suggested response:** tighten-assertion: count the readings with a spy on `convert` (at most two before the refusal) instead of timing them, or drop the bound.

### C-008: what the rewritten records must cover
- **Where:** `unit-tests.md`, `integration-tests.md`, `e2e-tests.md` (at `8353ba9`); the coming `test-report.md`.
- **Quote:** "Five cases of `pandoc-read.test.ts` give `readPaper()` a stand-in for pandoc's `convert`"
- **Failure mode:** evidence-drift
- **Why it matters:** The records name an older head, a smaller test count and a stub list that is no longer complete.
- **Suggested response:** add-test (records). The rewrite should:
  - name the tested commit `2fe447b` and the CI run at it, with a whole-suite count;
  - list the 21 new cases:
    - `test_pandoc_*`: `environment_with_option`, `wide_table`, `unpaired_environment`, `crlf`, `input_cycle`, `typst_parent_path`;
    - `test_paper_*`: `table_spans`, `cell_double_bar`, `other_properties`, `own_link_to_label`, `empty_emphasis`, `own_bibliography_heading_and_twice`, `typst_colon_labels`;
    - `test_prepare_paper_*`: `table_spans`, `hayagriva`, `pictures_by_path`, `subtitle`, `typst_colon_label`;
    - `test_source_*`: `subfiles_part`, `typst_include_in_code`, `typst_commented_include`;
  - list the two tightened cases, `test_math_no_link_no_change` (now also `labels-and-links.md` against `labels-before-links.json`, made from `a6d02c8^`) and `test_math_label_link_words`;
  - add `test_pandoc_unpaired_environment` to the stand-in list (six cases now). It stands in for pandoc reporting a place the file does not hold;
  - record the new `.gitattributes`;
  - re-run the E2E and the two-engine check at the new head, since `pandoc-read.mjs`, `pandoc-to-markdown.mjs` and `document-stage.mjs` changed (the kept fixture trees did not);
  - say in `test-report.md` that T-093 clause 6 is not met and is carried by T-096 (INT-0008 AC2).

**The first round's concerns, judged against `2fe447b`.**
- **C-001 is closed.** The reviewer's paper now marks `\mycmd` and keeps the `table*` caption. Also placed:
  - `tcolorbox[title=Box]`;
  - an option split across two lines;
  - `algorithmic[1]` with `\State`;
  - nested environments of the same name, each with an option;
  - `\begin{bar}[x] … \end{bar}` on one line;
  - words after the option on the `\begin` line;
  - an environment whose content is an `\input`.
- **C-002 is closed** for CRLF and for CR-only line ends.
- **C-003 is closed** for both of the reviewer's tables, plus:
  - a head with `\multirow` and `\multicolumn`;
  - a short row after a span down;
  - Typst `rowspan` and `colspan`;
  - a `\multicolumn` wider than the table.
- **C-004 is closed.** `\|x\|_2` is written `\Vert x\Vert _2`, and `a \\| b` keeps its line break. The test now compares the laid-out text with the paper's own LaTeX.
- **C-005 is closed.** With a `.yml` bibliography the citations are keys and are counted.
- **C-006 is closed.** A file above the paper's folder is still refused.
- **C-007 is closed for paths from `/`.** The "beside the file" half has the new fault in C-002 above.
- **C-008 is closed.** Checked: `\subtitle`, amsart `\address`, beamer `\subtitle`, `\thanks`, and `\date`. Commands not read are counted (`\keywords`, `\dedicatory`, `\email`, `\institute`). Pandoc's settings are not written.
- **C-009 is mostly closed.** The colon label works in the plain case; the remainder is C-004 above. The other limits are recorded in INT-0033.
- **C-010 is closed for direct cycles.** The diamond and repeated-file cases are no longer refused; the new faults are in C-001 above.
- **C-011's deferral is credible.** T-096 quotes INT-0008 AC2.
- **C-012 is closed.** The new page is read with its line ends normalized.
- **C-013 is closed.** Checked with `resolveSource()`:
  - `include` inside `#show`, `#include("…")`, and an include after a URL on the same line are parts;
  - names in `//` and `/* */` comments name nothing;
  - a `subfiles` chapter is a part.
- **C-014 is closed for the items answered** (the list's heading, a key given twice, `\hyperref`, empty emphasis). C-005 above follows from the heading fix.

## Confidence
block

C-002 is the blocking concern: in an ordinary multi-folder Typst project, a chapter can show a different figure from the one its author placed, with no mark and no count, and the test as written cannot see it. C-001 is a regression introduced by the fix: Tome refuses papers that pandoc reads correctly. Both have small fixes. The rest can proceed with caveats.

## Responses (the sprint's author)

Answered in `5662158`. Each fix has a test, checked to fail with its fix undone.

| Concern | Answer |
|---|---|
| C-001 the cycle guard | Fixed for the regression: the guard reads a LaTeX file with its code (`verbatim`, `lstlisting`, `minted`, `\verb`) and comments left out, and a Typst file with its raw text and comments left out, and counts a Typst `include` or `import` only where code stands (after `#`, `{`, `;`, `(`, `=`, `=>`, or at a line's start), so prose naming a file names nothing. The folder rule uses the same reading (`typstFilesNamed`). `test_pandoc_code_names_nothing` reads the reviewer's papers (a listing, a `\verb`, a Typst raw block, Typst prose). Deferred, and recorded in INT-0033 and *Find Your Books*: a cycle made through a command of the paper's own or a Typst variable is not seen, and the build does not finish; bounding a reading's time needs pandoc run in a worker, a larger change than this phase should make. |
| C-002 pictures of one name | Fixed as the review suggested: in the copy of a Typst file in a folder of its own, each `image("…")` path is written from the paper's folder (`/ch1/fig.png`), so each chapter's picture is found beside it and nowhere else. The stage no longer searches other files' folders. `test_prepare_paper_pictures_same_name` (two chapters with a `fig.png` of different bytes each, a logo of one name at the root and in a chapter, and a chapter's picture that is not beside it, marked). |
| C-003 `table*` in code | Fixed: `table*` is written `table` outside code only. `test_pandoc_code_untouched`. |
| C-004 names with a colon | The shorter-label case is fixed: a link to `<sec>` followed by `:a.b` is the label `sec:a.b` when the paper holds it (`test_paper_typst_label_after_shorter`). The BibTeX key with a colon is deferred and recorded in INT-0033 and *Find Your Books*, with `#cite(<knuth:1984>)` as the way to write it: pandoc never cites the whole key, so its entry is not in the list `citeproc` makes, and Tome cannot recover it. |
| C-005 the heading before the list | Fixed: a heading directly before the paper's own list, or before the list `citeproc` makes, is the list's heading only when its words name a list (References, Bibliography, Works cited, Literature, and the French and German words), and its anchor is written before it. A link of the writer's own to no label is its words, counted as a reference. `test_paper_own_bibliography_heading_kept`, `test_paper_own_link_nowhere`. |
| C-006 stand-in names in code | Fixed: the argument that names a file is rewritten outside code only, in LaTeX and in Typst. `test_pandoc_code_untouched` shows no stand-in name anywhere in either tree. |
| C-007 the timing assertion | Fixed: `test_pandoc_input_cycle` counts pandoc's readings through a wrapper round the real `convert` (three at most) and times nothing. |
| C-008 the records | Done in the rewrite of `unit-tests.md`, `integration-tests.md` and `e2e-tests.md` at the tested head, with the gates re-run there. |
