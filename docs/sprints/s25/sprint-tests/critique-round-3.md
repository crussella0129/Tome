# Test Critique — Sprint 25, round 3

> The third independent review of the Test phase, kept as it was written,
> at head `49df08e`. Its verdict was `block`, on one concern. The answers
> follow it. The final review is `critique.md`.

Third review, read-only, at head `49df08e` (records name `b452443` as the tested head; `49df08e` adds records only). Nothing in the project was edited; `git status` is clean after my runs.

## Concerns

### C-001: A Word equation in a table cell that ends in a typed `|` is not read as a formula, and nothing reports it — BLOCK
- **Where:** `scripts/docx-to-markdown.mjs` `dollarForm()`; T-082 clauses 4 and 5; INT-0030 AC3 and Consequences ("In a table … `\vert` is written instead"); `test_docx_equation_in_containers` (its one cell case is `a|b`, bar in the middle).
- **Quote:** `const latex = equation.cell ? equation.latex.replaceAll('|', '\\vert ') : equation.latex;`
- **Failure mode:** EARS-coverage (a real fault on an input no test tries)
- **Why it matters:** When the bar is the last character, the replacement leaves a space before the closing `$`, and T-077's rule refuses a pair with a space there. Measured through `convertDocx` on the fixture, cell `nine stone` replaced:
  - Equation text `|x|` gives the row `| First  | $\vert x\vert $ |`. The page shows `<td>$\vert x\vert $</td>`: no `math`, no error element, no build message, `leftOut` `[]`.
  - The same happens for `x|`, `|`, `||`, `|A|` after words, before a full stop, and with the bars in runs of their own (`|`, `x`, `|`).
  - It reads correctly only when a digit follows (the `$$` form), for `|x|=1`, `P(A|B)`, `a|b`, and for Word's own bracket object (`\left\vert x \right\vert`).
  - Outside a cell `$|x|$` is fine.
  
  Clause 5 says "every carried-over equation SHALL be read as a formula", and AC3 allows only an equation or a counted mark. The tutorial's own example for this rule is a norm in a table (`$\vert x \vert$`). I did not have a Word-saved file with this shape: Word's build-up makes a bracket object, so the fault needs the bars as typed text, as left when Word does not build them up or as another `.docx` writer may save them (not verified).
- **Suggested response:** add-test and fix. Write `\vert{}`, or drop the space when the bar is last, and add cases with a bar at the end of a cell's equation. A stronger net: have `convertDocx` read its own Markdown back with T-077's reader and count as left out any equation not read. My matrix of 8,400 conversions (50 equation texts, ten neighbours before, eleven after, in a paragraph, cell, heading and list item) found this class and no other, and would make a compact test.

### C-002: Nothing holds that the converter reports an equation the net caught — caveat
- **Where:** `convertDocx()` in `scripts/docx-to-markdown.mjs`; `test_docx_lost_placeholder_is_marked`; INT-0030 Consequences ("the equation is counted as left out").
- **Quote:** `leftOut.push({ kind: 'equation', count: equations + written.lost });`
- **Failure mode:** weak-assertion
- **Why it matters:** The test proves `writeEquations()` returns `lost`. With `written.lost` taken out of both lines of `convertDocx` (in memory), all of `docx-to-markdown`, `load-books` and `document-stage` still pass (91 passed, 1 skipped). No real document is known to reach the net, so this is small.
- **Suggested response:** tighten-assertion (build the `leftOut` list in a small function tested directly), or defer-with-rationale.

### C-003: `titleText()` still gives two formulas one text when a bracket, bar or `!` stands before a root with an index — caveat
- **Where:** `row()` in `scripts/rehype-math.mjs`; `test_math_title_text_neighbours`; INT-0030 Consequences ("a number or letter before a root that has an index").
- **Quote:** `if (/[\p{L}\p{N}]$/u.test(out) && (first === 'mfrac' || first === 'mroot'))`
- **Failure mode:** weak-assertion (residue of round-2 C-002)
- **Why it matters:** Measured: `(a+b)\sqrt[3]{x}` and `(a+b)^3\sqrt{x}` both give `(a+b)³√x`; `|x|\sqrt[3]{y}` and `|x|^3\sqrt{y}` both give `|x|³√y`; `n!\sqrt[3]{y}` and `n!^3\sqrt{y}` both give `n!³√y`. This affects only a title, the rail or a search result; the page is right.
- **Suggested response:** tighten-assertion and fix (part anything but a space or a relation from a root with an index), or record it in Consequences.

### C-004: The newly recorded `$$` limit has no test, and its wording says less than happens — caveat
- **Where:** INT-0030 Consequences, the Test-phase list; T-077 clause 11; `test_dollars_recorded_limits`.
- **Quote:** "the line under it is taken as closing it, and the formula meant is shown as typed and named when the library is built"
- **Failure mode:** negative-path
- **Why it matters:** Measured with `See [x](https://e.test/?a=$$) now:` directly above a closed fence, then `After.` and `## Later`: the tree is `paragraph | math("\nAfter.\n\n## Later")`. The formula meant becomes plain text; the intended closing line opens a fence that takes the rest of the chapter, heading included, and the build names "a $$ fence was never closed: After. ## Later", not the formula. The same happens for an autolink (`<https://…$$>`), for `$$$` in prose, and for `$a$$b$` directly above a fence. The build names each, so AC6 holds.
- **Suggested response:** add-test (one case in `test_dollars_recorded_limits`) and correct the sentence to say the rest of the chapter goes with it.

## Confidence
block

C-001 is the only block: T-082 clause 5 and AC3 fail silently on a measured shape that the current cell test cannot show. It is a one-line fix and one test; with that done the verdict would be proceed-with-caveats. C-002 to C-004 are caveats.

**The five round-2 answers.** Each was checked by running the project's own tests with the fix taken out in memory (a vitest config outside the project that alters the module text as it loads; nothing on disk changed).
- **C-001 (beside emphasis): resolved.** 46 shapes carried over with no place-holder and nothing left out, apart from two that hit the cell fault above: bold, italic and bold-italic on either or both sides, emphasis between two and three equations, strikethrough, underline, superscript, a link before, after and around, a footnote reference, a line break, a heading, the Title, a table cell and a list item. Without the tolerant pattern, `test_docx_equation_beside_emphasis` and `test_docx_lost_placeholder_is_marked` fail; without the net, the second fails; without both, both fail.
- **C-002 (root with an index): resolved for a number or letter.** `test_math_title_text_neighbours` fails without the fix. Residue is C-003.
- **C-003 (token test): resolved.** With one fixed place-holder for all documents, `test_docx_token_in_text` fails on the whole-sentence assertion.
- **C-004 (fences): resolved.** `fencesIn()` agreed with the Markdown reader in every shape tried: code over a line end, CRLF, doubled backticks holding one, code ending in a backslash, `\\` before code, an escaped backtick then real code, unequal runs, a lone backtick, a quotation, a list item, `\$$` inside code. With the old pattern, `test_dollars_code_above_fence` fails.
- **C-005 (records, `$%x$`): resolved.** `test_math_empty` fails without the comment rule. The rule never refused a formula Temml lays out with visible content: `\%`, `5\%`, `a \\% b`, `\\\%`, `a % b`, a comment line then a content line (LF and CRLF), and `\verb|%|` are all readable.

**The net.** It cannot take a document's own words: it needs the document's 16-digit random number. `&#x74;` or `&#x20;` typed in the document before a real equation is left alone. Only a shape nothing is known to produce (a place-holder that lost an end altogether, with a character reference hard against that end) would take that one character too.

**Records.** `npx vitest list` gives 35 files and 331 cases, and every per-file count in `unit-tests.md` matches. The ten sprint test files ran 159 passed, 1 skipped. Names, case counts and descriptions of the new tests match the files. `math.spec.ts` is unchanged since round 2.

**The eight failure modes.** Traceability is as rounds 1 and 2 found it, with C-001 the one gap; one stub (`console.warn`); no integration drift; no E2E cop-out; negative paths covered except C-004; flake risk low (the random place-holder reaches no compared output); no evidence drift beyond the CI citation you asked me not to raise.

**Not run.** No build, gate, Playwright or Electron run, and no network; browser tests were judged by reading. Probes and the in-memory mutation config are in a scratch folder outside the repository; `cell.mjs` and `cell2.mjs` reproduce C-001, and `fuzz.mjs` is the matrix.

## Responses

Written by the sprint's author after the review. Every concern was taken.
The fixes and tests are in `bf7ff46`; the suite and every gate were run
again at that head (`unit-tests.md`, `integration-tests.md`,
`e2e-tests.md`).

| Concern | Answer | Where |
|---|---|---|
| C-001 | **Fixed, with a test, and the class closed.** The space after `\vert` is no longer left at the end of a formula. And the review's "stronger net" is built: the converter reads its own Markdown back with Tome's reader, and an equation that does not come back as a formula holding its own LaTeX is written as the mark and counted as left out. Three reviews each found another road to the same silent loss; this holds the promise itself (T-082 clause 5, AC3) and not one road at a time. The review's own matrix of 8,400 conversions, run again on the fix, finds none silent (152 before). With the one-line fix taken out, the cell test fails; with the check taken out, its two tests fail; with both out, all three (tried). | `latexAsWritten()`, `settleEquations()`, `formulasRead()` in `scripts/docx-to-markdown.mjs`; `test_docx_cell_equation_ends_in_bar` (nine shapes), `test_docx_unread_equation_is_marked`; INT-0030 Consequences |
| C-002 | **Tightened.** A test runs the converter end to end with a reader that finds less than Tome's: both equations become the mark with a count of two; one refused gives one mark and a count of one; a refusal is added to the count of equations the converter had no rule for. With the count taken out of the converter, that test fails (tried). | `test_docx_unread_equation_is_reported`; the `readFormulas` option of `convertDocx()` |
| C-003 | **Fixed, with a test.** Whatever stands before a root that has an index is kept apart from it, a bracket, a bar and `!` among them; after a sign that joins two things, or an opening bracket, there is nothing for the index to be a power of, and no space is written. | `AFTER_WHICH_NO_POWER`, `row()` in `scripts/rehype-math.mjs`; eight cases added to `test_math_title_text_neighbours`; INT-0030 Consequences |
| C-004 | **Test added, and the sentence corrected.** `test_dollars_recorded_limits` holds the review's input: the formula meant stays text, the line meant to close it opens a fence that takes the rest of the chapter, heading included, and that fence is marked as never closed; with a blank line before the `$$` line, all is as written. INT-0030 now says exactly that, and names `$$$` and `$a$$b$` beside the link's address. | `test_dollars_recorded_limits`; INT-0030 Consequences |
