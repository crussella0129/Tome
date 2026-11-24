# Test Critique — Sprint 25, round 4

> The fourth independent review of the Test phase, kept as it was written,
> at head `f162064`. Its verdict was `proceed-with-caveats`. The answers
> follow it. The final review, of those answers, is `critique.md`.

Fourth review, read-only, at head `f162064` (records name `bf7ff46` as the tested head; `f162064` adds records only, checked with `git diff bf7ff46 f162064 --stat`). Nothing in the project was edited; `git status` is clean after my runs.

## Concerns

### C-001: A bar inside an equation's plain words, in a table cell, is written as LaTeX the page cannot lay out, and the converter reports nothing — caveat (a real fault, narrow, and not silent)
- **Where:** `scripts/docx-to-markdown.mjs` `latexAsWritten()` and `markUnreadable()`; `settleEquations()`; INT-0030 AC3; T-082 clause 3; `integration-tests.md` "Every equation is a formula, or it is reported".
- **Quote:** `// Laid out once here: LaTeX the layout engine refuses is never written.`
- **Failure mode:** intent-coverage
- **Why it matters:** `readable()` is asked about the LaTeX before the cell rule rewrites `|` to `\vert `, and the new check only asks whether the Markdown reader finds a formula, not whether it can be laid out. Measured through `convertDocx` on the fixture, cell `nine stone` replaced by an equation whose run is marked plain words (`<m:rPr><m:nor/></m:rPr>`) holding `a|b`:
  - Row written: `| First  | $\text{a\vert b}$ |`. `leftOut` is `[]`.
  - Page: a `tome-math-error` element showing `$\text{a\vert b}$`. Build line: "a formula could not be read: \text{a\vert b}".
  - The same for plain words `a|`, in a header cell, and with two or three equations in the cell: 34 of my 4,752 conversions, all this one body.
  - Outside a cell the same equation is `$$\text{a|b}$$` and lays out. `\operatorname{a\vert b}` lays out.
  
  So this equation is neither an equation nor a counted mark, which AC3 allows no third case for. It has the same root as round 3's block (the cell rewrite). I label it a caveat because it is loud where round 3's was silent: the page marks it and the build names it with its chapter (AC6), and clause 5 holds by its letter. It needs three things together (a table, plain words, a bar in them), and I did not try a file Word saved with this shape. It is not a recorded limit.
- **Suggested response:** add-test and fix: have the check also ask `readable()` of the LaTeX as written (then it is the mark, and counted), or write the bar another way inside `\text{…}`. Otherwise record it in Consequences. Fixed the first way, this shape is also the end-to-end refusal test C-002 lacks.

### C-002: No test holds that the converter applies the check with Tome's own reader, or that the comparison is in order — caveat
- **Where:** `convertDocx()` and `settleEquations()` in `scripts/docx-to-markdown.mjs`; `test_docx_unread_equation_is_reported`, `test_docx_unread_equation_is_marked`.
- **Quote:** `const at = out.written.findIndex((equation, place) => back[place] !== equation.latex);`
- **Failure mode:** weak-assertion
- **Why it matters:** Two in-memory alterations leave `docx-to-markdown`, `document-stage` and `load-books` green (94 passed, 1 skipped each time):
  - `convertDocx` uses the check only when a test hands it a reader, and plain `writeEquations()` otherwise. The refusal tests either call `settleEquations()` directly or inject a reader, so the production path is only ever seen passing.
  - The comparison becomes `!back.includes(equation.latex)`, which ignores order. With that, two equal equations of which the first is not read would pass with one shown as text.
  
  No document is known that Tome's reader refuses (none in 4,752 + 8,400 conversions), which is why the first survives.
- **Suggested response:** tighten-assertion: one end-to-end case that Tome's own reader refuses (C-001's shape, once the check asks `readable()`), and one `settleEquations()` case with two equal equations and a reader that misses the first.

### C-003: The mark a refusal writes can become a link after a backslash of the document's; the title and the count can disagree with the body — caveat
- **Where:** `writeEquations()` (the `refused` branch and the debris branch), `titleWithEquations()`; `unit-tests.md` row `test_docx_lost_placeholder_is_marked`.
- **Quote:** "becomes the mark, written so that it forms no link, and is counted"
- **Failure mode:** negative-path
- **Why it matters:** Measured with the converter's own `readFormulas` option set to a reader that finds nothing:
  - Word text `Before \`, then an equation, then `(after)` gives `Before \\[equation not shown](after)`. The document's backslash takes the mark's own, and the page shows a link reading "equation not shown" that leads to `after`: two marks as text against three counted. With Tome's reader the same text is right (`Before \\$x$(after)`).
  - A title holding a refused equation is returned as `On the Weight of √2` while the chapter's heading reads `[equation not shown]`.
  - A Title set in a table puts its place-holder in the Markdown twice, so one refused equation there is counted twice (4 for 3).
  
  All three need a refusal, which no real document is known to cause, so they are small. Everywhere else the mark is plain text: a paragraph, set apart, a heading, a heading that is only the equation, bullet and numbered items, a quotation, a note, a whole cell, two in a cell with a typed bar, beside bold, before `(…)`, `[x]: y` and `[^1]`.
- **Suggested response:** tighten-assertion (give the mark the backslash rule the dollar form has, with one case), or defer-with-rationale.

### C-004: `unit-tests.md` still says there is one stub — caveat (wording)
- **Where:** `unit-tests.md`, the head list.
- **Quote:** "**Stubs:** one. `console.warn` is spied … Everything else is real"
- **Failure mode:** evidence-drift
- **Why it matters:** `test_docx_unread_equation_is_reported` hands the converter stand-in readers (`() => []`, and one that drops `frac`). The stand-in is a fair one, the contract and not the implementation, and the test's row says so; only the summary line is out of date.
- **Suggested response:** tighten-assertion (name the stand-in reader in that line).

## Confidence
proceed-with-caveats

No concern is a block. C-001 is the one to answer before the report: a real fault against AC3's letter, but shown on the page and named by the build, and one line either fixes it or records it. If the owner reads AC3 as "the converter's own left-out report must be complete", treat C-001 as a block; that is the only judgement call in this review.

**The four round-3 answers.** Each was checked by running the project's tests with the fix removed in memory (a vitest config outside the project; nothing on disk changed).
- **C-001 (cell ending in a bar): resolved.** Round 3's inputs (`|x|`, `x|`, `|`, `||`, after words, before a full stop, bars in runs of their own, `|x|=1`, `P(A|B)`, before a digit, before a typed bar) are each one formula, with no dollar sign as text and nothing left out.
  - Without `.trim()`, `test_docx_cell_equation_ends_in_bar` and `test_docx_unread_equation_is_marked` fail.
  - Without the reading back, `…is_marked` and `…is_reported` fail; without both, all three.
  - Round 3's own matrix, run again as it stands: 8,400 conversions, none silent. Its 168 "differing only in outer space" are that probe expecting the untrimmed form.
- **C-002 (the count): resolved.** With the count taken out of `convertDocx`, `test_docx_unread_equation_is_reported` fails. The residue is my C-002.
- **C-003 (root with an index): resolved.** The six measured titles are now distinct in pairs (`(a+b) ³√x` and `(a+b)³√x`, and so for `|x|` and `n!`). With the old rule, `test_math_title_text_neighbours` fails. Fifteen more neighbours (`α`, `∞`, `%`, `]`, `}`, a fraction, a root, relations) gave no collision.
- **C-004 (the `$$` limit): resolved.** The test holds the input as measured, and the sentence in INT-0030 now says what happens.

**The check itself.**
- **Same reader as the page.** It agreed with the page's reader, composed as Astro does (remark-parse, GFM, smartypants, `remarkAlerts`, the plugin), in every one of the 4,752 conversions. The Word path writes line feeds only and the loader writes the string as it is (`load-books.mjs:235`), so CRLF cannot come between the check and the page.
- **Passing with an equation shown as text.** That would need a formula from somewhere other than an equation. The document's own dollar signs gave none in 18 shapes: a typed `$x$` in a paragraph, bold, a heading, a cell, a list item, raised text and a note; a lone `$$` line; inside backticks; in a link's address, with the text its address and not; in a bare address; and after a backslash.
- **Refusing a good equation.** Only in two contrived cases, both loud: of two equal equations with the first unread, both become the mark; a formula too many before the equations refuses them all. One too many after them changes nothing.
- **Ending.** It always ends, with one reading per refused equation plus one. The worst case is quadratic (400 equations, none reading back: 9.7 s), and no input is known to reach it.
- **Cost on the loader path.** The fixture converts in 10 ms; a paper of 1,102 equations in 321 ms, 64 ms of it the reading back. `load-books` and `document-stage` pass.

**The matrix.** 4,752 conversions: 66 equation bodies (round 3's fifty, ten that look like Markdown, six built ones) in 32 places.
- Places: a note (in its line, hard between text, a paragraph of its own, two in a line); a quotation (in line, first in line, alone between two); a list item followed by a second paragraph; an item that is the equation, then an equation paragraph; nested and numbered items; set apart between paragraphs, two running, under a heading and over a table, with spaces round it; before a line break; a whole cell; two and three in a cell (hard together, a word between, a typed bar between, digits round them, a paragraph each); a header cell; and nine places with the document's own dollar signs beside the equation.
- Result: 0 silent, 0 place-holders shown, 0 formulas from the document's text, 0 disagreements between the two readers, 0 equations refused. The 34 with an error element are all C-001.
- Word has no true second paragraph inside a list item, so that case is an item followed by a plain paragraph.
- Outside the matrix: an equation inside a tracked insertion, a content control, a smart tag, a link, a text box, hidden text or an endnote is carried over. One inside a tracked deletion goes with the deleted text. One inside a simple field goes with the field, which the loader names as an element the Word reader did not recognise, not as an equation.

**Records.**
- `npx vitest list` gives 35 files and 334 cases, and every per-file count in `unit-tests.md` matches (docx 40, rehype-math 20, remark-math-dollars 15).
- The ten sprint test files ran 162 passed, 1 skipped.
- The names and descriptions of the three new tests and the added cases match the code.
- `math.spec.ts` is unchanged since `9cf62ed` and holds the eleven tests recorded.
- The heads are named honestly, and `sprint-meta.md` records the check as a source change made during Test.

**The eight failure modes.** Traceability is as the earlier rounds found it, with C-001 the one gap under AC3. Assertions: C-002. Stubs: `console.warn` and the stand-in reader (C-004). No integration drift and no E2E cop-out. Negative paths are covered by the stand-in reader and the blank-line case, with C-003 the gap. Flake risk is low: the random place-holder reaches no compared output and the loop is bounded. Evidence drift: C-004 only.

**Not run.** No build, gate, Playwright or Electron run, no network, and Word was not driven. The browser and gate results in the records were judged by reading. Probes, their outputs and the in-memory mutation config are in a scratch folder outside the repository: `r3.mjs` reproduces C-001, `matrix.mjs` is the matrix, `refuse.mjs` is C-003, and `mutate.config.mjs` holds the alterations behind C-002.

## Responses

Written by the sprint's author after the review. Its verdict let the phase
go on; every concern was answered all the same, in `0eb7dd4`, and the suite
and every gate were run again at that head. The same reviewer then looked at
the answers; its verdict on them is `critique.md`.

| Concern | Answer | Where |
|---|---|---|
| C-001 | **Fixed, with a test.** Read as the review's stricter reading: the converter's own report must be complete. The check now also asks the layout engine about each equation's LaTeX as it is written where it stands; one it refuses is the mark, and counted. The review's shape (plain words holding a bar, in a table cell) gives the mark in the cell and a count of one, and the same equation outside a cell is a formula. | `settleEquations()` in `scripts/docx-to-markdown.mjs`; `test_docx_cell_words_with_bar_is_marked`; INT-0030 Consequences |
| C-002 | **Tightened, both ways the review named.** `test_docx_cell_words_with_bar_is_marked` runs the converter end to end with Tome's own reader, nothing handed in, to a refusal: it fails if the converter applies the check only when a test gives it a reader. `test_docx_read_back_is_in_order` gives two equal equations to a reader that misses the first: neither is left between dollar signs, and both are counted; it fails if the comparison ignores order. | the two tests named |
| C-003 | **Fixed, with a test.** The mark keeps its own backslash after a backslash of the document's, as the dollar form does, so its bracket opens no link (for a refusal, and for what is left of a place-holder). A title names the mark when its chapter shows the mark. A place-holder that stands twice is one equation and is counted once. | `writeEquations()`, `titleWithEquations()`; `test_docx_refusal_mark_is_text` |
| C-004 | **Corrected.** `unit-tests.md` names the stand-in reader beside `console.warn`. | `unit-tests.md` |
