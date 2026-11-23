# Sprint 25 Integration Verification

- **Tested head:** `bf7ff46`. The Vitest cases below ran in the whole-suite
  run recorded in `unit-tests.md` (334 tests, 333 passed, 1 skipped). The
  gates ran on this Windows machine at that head. `test-report.md`, written
  after the final review, cites the CI run on Linux.

## The loader with Word equations

`load-books.test.ts`, with real temporary folders and the loader spawned as a
program, as that file has always done.

| Test | Clause | What it showed |
|---|---|---|
| `test_loader_word_equations` (new) | T-082 4, 8 | the fixture paper, loaded on its own: the staged chapter holds `Density is $\frac{m}{V}$(see the table)` and `$$E=mc^{2}$$`, no mark, and the loader prints no `left out` line |
| `test_loader_reports_left_out` (edited) | T-082 8 | a paper with one equation the converter knows and one it does not: `paper.docx: left out 1 equation`, and not `equations` |
| `test_loader_reports_left_out`, the chart case (edited) | T-082 8 | `left out 1 chart or diagram, 1 element the Word reader did not recognise`: no equations are reported, both being carried over |
| the other 39 cases | T-082 9 | pass unedited (one skipped on Windows, as before the sprint) |

`document-stage.test.ts` `test_prepare_word` (edited): through
`prepareDocument()` the paper reports nothing left out, and the Markdown it
stages holds the set-apart equation.

## The gates as programs

`fixture-commands.test.ts`, `fixture-gate.test.ts`, `ci-workflow.test.ts`.
Each gate script is run as a program in a temporary repository with a
stand-in `build` script.

| Test | Clause | What it showed |
|---|---|---|
| `test_fixture_commands_refuse_dirty_content` for `check-math.mjs` | T-081 1 | with tracked, staged, untracked and ignored personal content in the sample, the gate exits non-zero with "refusing destructive fixture sync", runs no build, and leaves every personal file as it was |
| `test_math_gate_cleans_up_on_failure` | T-081 1 | a build that prints to both streams and exits 31: both are shown, `check-math: FAIL` is reported, the exit is non-zero, the build was given `fixtures/proofs/` and the empty manifest, and the sample is as it was |
| `test_fixture_gate_build_output` | T-081 2 | `buildWithOutput()` returns standard output and standard error; the build saw the explicit book, no inherited `TOME_BOOKS`, the empty manifest and the gate's own library folder, the same environment `gate.env()` gives; an exit of 41 is thrown with its status; `build` and `command` are still there |
| `test_math_e2e_mode` | T-081 12 | `npx playwright test --list` with `TOME_MATH_E2E=1`: only `math.spec.ts`, under `chromium` and `webkit`, the same number of tests in each; without it: `reader`, `scaling`, `search` and `theme`, and no WebKit |
| `test_ci_workflow_valid` | T-081 13 | the workflow installs `chromium webkit` and runs `check-math.mjs` |
| the other gate tests, `test_fixture_gate_isolates_environment` among them | T-081 2 | pass unedited |

## Composed in a build: `npm run check:math`

Astro composes T-077's reader, T-078's layout step, T-079's search index and
T-080's stylesheet in a real build of `fixtures/proofs/`. The gate reads the
built files before any browser opens. Exit 0 at `b39d962`, `1e782cf`,
`9cf62ed`, `b452443` and `bf7ff46`.

| Check | Clause | What it showed |
|---|---|---|
| `check_math_built_pages` | T-081 3 | both chapters hold eight or more `math` elements, no `language-math`, no `script`, `semantics` or `annotation`; the price line as typed; the mistake in `code.tome-math-error` as `$\frac{a}{$`; the derivation written `$$\begin{aligned}` … `\end{aligned}$$` as exactly one `math` element, with no `\begin` or `$$` left as text, and the sentence after it in a `p` of its own |
| `check_math_build_output` | T-081 3 | what the build printed, both streams, holds a line with `1-proof.md` and `\frac{a}{` |
| `check_math_heading_slugs` | T-081 4 | for both chapters the heading `id`s of the page equal the search index's slugs, in order, `the-emc2-law` among them; the first page's record holds `E=mc2`, holds `\frac` only inside the mistake, and holds no `\sqrt`, `\sum` or `\begin` |
| `check_math_rail` | T-079 6, T-081 10 | the second page's rail entry for the formula heading reads `The E = mc² law` and links to `#the-emc2-law`; the entry for `A wide formula` reads as its heading |

The documents gate, `npm run check:documents`, also exits 0 at all five heads: a
Word document built on its own shows its two equations and no mark
(T-082 clause 10).

## A document Word itself saved

The plan's unit tests write Word's equation markup by hand. To try the
converter on markup Word wrote, Microsoft Word (version 16, installed on this
machine) was driven to write a document: twenty-one equations typed in
Word's linear form and built up by Word, one within a line of text and twenty
as paragraphs of their own, then saved as `.docx`. The file was made in a
scratch folder and is not committed. It was read with this sprint's code.

| | |
|---|---|
| Equations | 21 |
| Carried over as LaTeX | 21 |
| Left as the mark | 0 |

They were a fraction, a root, a root with a degree, a sum and a product with
limits, an integral, a matrix in round brackets, aligned lines, cases, a
named function, a limit, an accent, a binomial, Greek letters and relations,
an overbar, a subscript with a superscript, an absolute value, the quadratic
formula, a double-struck letter and a series with a nested fraction. Built
into a page, all twenty-one are `math` elements and none is an error
(captures: `evidence/word-saved-light-chromium.jpg`,
`evidence/word-saved-light-webkit.jpg`).

It found one fault, fixed at `1e782cf` with a test. Word saves `x∈ℝ` as a
run marked double-struck that holds `∈R`; the converter wrote
`x\mathbb{∈R}`, the sign inside the command with the letter. A style now
wraps the letters and digits of its run and leaves the signs beside them:
`x∈\mathbb{R}`.

One result is as Word saved it and looks odd: the accent was typed with a
space before it, so Word saved an accent over nothing, after `x`. Tome shows
what the file holds.

### A second document, for the rules the first did not reach

The first review of the tests asked that the rule for a hidden part be
settled "against a file Word saved". Word was driven again, the same way, to
write twelve more equations: a phantom, a smash, a box, an underbrace, an
overbrace, floor brackets, a norm, angle brackets, a prime, two letters, a
tilde, and a fraction within a line. The file is not committed. Read at
`9cf62ed`, and again at `b452443` and `bf7ff46` with the same result:

| | |
|---|---|
| Equations | 12 |
| Carried over as LaTeX | 12 |
| Left as the mark | 0 |

What it settled: for a phantom Word writes `m:show` with the value `0`; for
a smash it writes heights of nought and no `m:show` at all. The converter
had hidden both. A part is now hidden only when Word says so, and the smash
is shown (`test_omml_other_rules` holds both shapes as Word wrote them).

Two results are as Word saved them and are not what was typed. Two
fractions typed one after the other in one line were built by Word into one
fraction inside another, so that is what Tome shows; two equations side by
side are therefore tried by hand (`test_docx_adjacent_equations`). And the
two letters were typed bold and saved plain.

Both documents were read again at `bf7ff46`, where the converter reads its
own result back with Tome's reader (`critique-round-3.md`): all 21 and all 12
equations come back as formulas, and nothing is left out.

### Every equation is a formula, or it is reported

T-082's promise is that a carried-over equation is read as a formula with
its own LaTeX, and that anything else keeps the mark and is counted. Three
reviews each found a shape where an equation was neither: beside another
equation, beside bold or italic text, and at the end of a table cell after a
bar. Each was fixed. At `bf7ff46` the converter also checks the promise
itself: it reads the Markdown it has written with Tome's own reader, and an
equation that does not come back is written as the mark and counted
(`test_docx_unread_equation_is_marked`, `test_docx_unread_equation_is_reported`).

The third review tried 8,400 conversions of the fixture: fifty equation
texts, each with ten kinds of neighbour before and eleven after, in a
paragraph, a table cell, a heading and a list item. It found 152 where an
equation was neither a formula nor counted, all of the one class. Its
program, kept outside the repository, was run again on `bf7ff46`: 8,400
conversions, none of them silent, and none read back differently from what
was written.

What this did not cover: a paper of the owner's own; a Google Docs download;
an equation inside a tracked change or a link in a file Word wrote (those
are tried in the unit tests, written by hand); equations typed
through Word's ribbon and not its linear form, which may save other
properties.

## The owner's own library

The research report's risk was that a book already in a library holds dollar
signs this sprint would read as formulas. At the Test phase the entries of
the personal manifest on this machine, and one more folder the owner had
meant to add, were read with this sprint's reader: 1,290 Markdown and Word
files. One file held a dollar sign, and it was read as text. No formula was
found, so none was found that was not meant as one. Nothing of that library
is recorded here.
