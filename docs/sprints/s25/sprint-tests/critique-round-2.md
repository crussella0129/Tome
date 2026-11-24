# Test Critique — Sprint 25, round 2

> The second independent review of the Test phase, kept as it was written,
> at head `e1bee88`. Its verdict was `block`. The answers follow it. The
> final review is `critique.md`.

Second review, read-only, at local head `e1bee88` (records name `eec6432` as the tested head). Nothing in the project was edited and `git status` is clean after my runs.

## Concerns

### C-001: A Word equation directly beside bold or italic text is lost, and its place-holder is shown in the chapter
- **Where:** `scripts/docx-to-markdown.mjs` `writeEquations()` / `placeholders()`; T-082 clauses 4, 5 and 8; INT-0030 AC3; `test_docx_equation_in_containers`, `test_docx_adjacent_equations` (no case beside emphasis).
- **Quote:** "a token of letters and digits only, which the Word reader and the Markdown writer carry untouched"
- **Failure mode:** EARS-coverage (a real fault on an input no test tries)
- **Why it matters:** The Markdown writer does not carry the token untouched beside emphasis: it writes the token's first or last letter as a character reference, so the token is never matched. The equation is gone, the reader sees the place-holder, and `leftOut` is `[]`. Measured through `convertDocx` on the fixture with only the run before or after the first equation changed:
  - Bold `Theorem 1. ` (space inside the bold run, the usual shape of a theorem label) gives `**Theorem 1.&#x20;**&#x74;omeEquation2a4fe7fac95dcf04n1carried(see the table)…`. The page reads `<strong>Theorem 1. </strong>tomeEquation2a4fe7fac95dcf04n1carried(see the table)`, with no formula, no mark and no build message.
  - The same happens after bold `Theorem 1.` or `ρ =` hard against the equation, and after italic `where `.
  - The same happens when the equation comes first: before bold `, and so on.` and before italic `see the table` the token ends `carrie&#x64;`.
  - It works after bold ending in a letter (`**Density**$…$`) and when the space is a plain run.
  
  This fault predates the round-1 fixes (the old token was encoded the same way) and was missed in round 1. It is the silent loss C-004 was raised for, on a far commoner shape.
- **Suggested response:** add-test and fix. Carry the equation through the writer as a node of its own, or exchange tokens in the tree before it is written. Also make `convertDocx` fail or count an equation as left out if any place-holder remains in its output, so this can never be silent.

### C-002: `titleText()` still gives two different formulas the same text when a root has an index
- **Where:** `scripts/rehype-math.mjs` `row()` / `case 'mroot'`; T-078 clause 12; INT-0030 Consequences; `test_math_title_text_neighbours`.
- **Quote:** "so that what a root, a fraction or a power holds is never run together with what stands beside it"
- **Failure mode:** weak-assertion (same class as round-1 C-003; the new cases try only `2\sqrt{3}`)
- **Why it matters:** Measured: `2\sqrt[3]{x}` and `2^3\sqrt{x}` both give `2³√x`; `x\sqrt[3]{y}` and `x^3\sqrt{y}` both give `x³√y`; `x\sqrt[n]{y}` and `x^n\sqrt{y}` both give `xⁿ√y`. Twice a cube root reads as two cubed times a root, in a title, the rail and a search result. Consequences promise "brackets wherever two formulas would otherwise read the same".
- **Suggested response:** tighten-assertion and fix (part a letter or number from a root that has an index, as is now done before a fraction), or record it in Consequences.

### C-003: `test_docx_token_in_text` does not hold the per-document place-holder
- **Where:** `src/lib/__tests__/docx-to-markdown.test.ts` `test_docx_token_in_text`; `unit-tests.md` "Added in the Test phase"; round-1 answer to C-004.
- **Quote:** `expect(reads(out.markdown)).toContain('Density tomeEquation9carried and ');`
- **Failure mode:** weak-assertion
- **Why it matters:** The assertion stops just before the document's second word, `tomeEquation0carried`. With the old fixed pattern and only the new `carried[index] === undefined` guards, that word would be exchanged for the first equation and all three assertions would still pass (by reading; I did not mutate the code). The crash is held; "its own words are never taken for an equation" is not. The record's "its two real equations are carried over" also says more than the test, which looks for `E=mc^{2}` only. The current output is right: I measured `Density tomeEquation9carried and tomeEquation0carried is $\frac{m}{V}$(see the table)`.
- **Suggested response:** tighten-assertion: assert the whole sentence, and exactly one formula `\frac{m}{V}`.

### C-004: The code-span stripping is its own reader of code spans; one shape regressed, and `$$` in other non-formula places still turns the fence over
- **Where:** `scripts/remark-math-dollars.mjs` `openInParagraph()`; T-077 clauses 5 and 6; `test_dollars_code_above_fence`.
- **Quote:** ``const outsideCode = text.replace(/(`+)(?!`)[\s\S]*?(?<!`)\1(?!`)/g, '');``
- **Failure mode:** negative-path
- **Why it matters:** All four shapes are rare, and the build names each (AC6 holds), but none is tested or recorded.
  - **Regression:** escaped backticks are not code, but the pattern strips them. ``A \`$$a = b\` thing`` then a `$$` line, a blank line and `After.` now opens a fence that is never closed and takes the rest of the chapter. Before the fix the `$$` line closed the formula, as clause 6 says.
  - **Still as round-1 C-002:** a `$$` in a link's address (`[x](https://e.test/?a=$$)`), in an HTML attribute (`<span title="$$">`), or written `\$$`, directly above a fence. The fence is turned over, the formula is left as text, and the later heading is lost into a `tome-math-error`.
- **Suggested response:** defer-with-rationale (record these in INT-0030 Consequences beside the other edges), or count from the paragraph's own parsed tokens and not from a pattern over its text.

### C-005: Records state things that are not yet true, and two details disagree with the tests
- **Where:** `integration-tests.md` and `e2e-tests.md` "Tested head"; `critique-round-1.md` Responses, C-008 and C-012; `scripts/rehype-math.mjs` `row()` comment.
- **Quote:** "**Done in `test-report.md`**, which cites the CI run on the tested head and its totals."
- **Failure mode:** evidence-drift
- **Why it matters:**
  - `test-report.md` is 0 bytes, yet the Responses row says "Done" and both records say in the past tense that CI ran "on a later commit … (`test-report.md` names it)". I understand the report is written after this verdict; until then these are forward references. The local `origin/dev` reflog shows `e1bee88` as "update by push"; I did not query CI.
  - `playwright.config.ts` has `retries: process.env.CI ? 1 : 0`, so the report should say whether any math test passed only on a retry.
  - The Responses row for C-008 says "`test_omml_other_rules` (30 cases)"; the test and `unit-tests.md` have 28.
  - The comment in `row()` says "`2 \cdot 3^2` written `2 3^2` is not `23²`", but `test_math_title_text_neighbours` asserts `['2 3^2', '23²']`. The test is right: Temml writes `<msup><mn>23</mn>…`, so the page shows the same.
- **Suggested response:** defer-with-rationale for CI (write the run, its head, its totals and its retry count into `test-report.md`); correct the two small details.

## Confidence
block

C-001 is a T-082 promise and INT-0030 AC3 failing silently on a common shape of Word document, with no test; the current evidence supports a false pass on AC3. Once C-001 is fixed with a test and C-002 is fixed or recorded, the verdict would be proceed-with-caveats.

**The twelve round-1 answers.** "Holds the fix" is judged by reading each test against the diff, not by mutating code.
- **C-001 (CRLF): resolved.** Both review inputs now give paragraph / `div.tome-math` / paragraph and a numbered `(1)`. `test_dollars_crlf`, `test_math_crlf` and the search case hold the fix.
- **C-002 (code above a fence): resolved for code spans**, also with CRLF, in a quotation, in a list and with a span over a line end. The test holds the fix. Residue is C-004 above.
- **C-003 (titles): resolved as answered.** `3 1/2`, `12 3/4`, `a/b c/d`; `\binom`, `\choose`, `\atop`, `\brack`, `\dbinom` and a no-bar `\genfrac` give `null`. The test holds the fix; the `2 3^2` answer is sound. A sibling collision remains (C-002 above).
- **C-004 (adjacent equations, backslash, token): resolved** for all three inputs, and for adjacent-before-a-digit, two backslashes, and a first equation ending in `$`. The first two tests hold their fixes; the third is weak (C-003 above). The same silent loss by another road is C-001 above.
- **C-005 (font): resolved.** No `fonts.load` remains in `e2e/`, nothing preloads the face, and only `math` uses the token. Without the `math { font-family }` rule `open()` would time out and the computed-family assertion would fail.
- **C-006 (radical, cell padding): resolved by reading.** `paintedRows` measures ink in the strip left of the fraction and fails on no ink; the padding assertions and `math mtd` in `test_math_css_rules` would fail if the rule were lost. Blockage 2 now says what the test does.
- **C-007 (threshold): resolved.** The 16 and 17 character cases pin `LONG`.
- **C-008 (converter rules): resolved.** Probed: a smash is shown, `m:show` 0 or off is hidden, a struck or side-hidden box and a `w:r` with text give nothing; Word's own `m:nor` run with a `w:rPr` still converts. All 28 cases and the 6 unknowns are present.
- **C-009 (by eye): the record is specific.** The one capture I opened (`proof-2-sanguine-webkit.jpg`) shows what it says, including the wide equation cut with `(2)` out of sight.
- **C-010 (limits): recorded** in Consequences and the tutorial; an empty formula is an error element with a message. One leftover: `$%x$` is still an empty `math` element with no warning.
- **C-011 (search opens a section): resolved by reading.** The test types `mc2`, checks the first result's link and text, follows it and checks the heading is in view.
- **C-012: not yet done** (C-005 above).

**Evidence records.** `npx vitest list` gives 35 files and 329 cases, and every per-file count in `unit-tests.md` matches. The nine sprint test files ran 115/115. `eec6432` differs from `9cf62ed` in the two test files named and nothing else, and both changes strengthen assertions. `math.spec.ts` has eleven tests, as `e2e-tests.md` says. Test names and descriptions match the files, except as noted in C-003 and C-005.

**The eight failure modes over the sprint.**
- Traceability is as round 1 found it; each new test names its clause.
- There is one stub (`console.warn`).
- There is no integration drift and no E2E cop-out; Safari, Firefox and Tauri are stated as not run.
- Negative paths are covered except for C-004.
- Flake risk is low: the `toPass` loop in `test_math_search_opens_section` is bounded at 15 s and cannot pass falsely, and `paintedRows` has a wide margin (44 px against 32 px measured). The place-holder's randomness does not reach any output a test compares.

**What I did not run.** No build, gate, Playwright or Electron run, and nothing on the network. The browser tests were judged by reading. Probe scripts are in a scratch folder outside the repository (`dollars.mjs`, `title.mjs`, `word.mjs`, `word2.mjs`, `word3.mjs`); `word2.mjs` reproduces C-001.

## Responses

Written by the sprint's author after the review. Every concern was taken.
The fixes and tests are in `b452443`; the suite and every gate were run
again at that head (`unit-tests.md`, `integration-tests.md`,
`e2e-tests.md`).

| Concern | Answer | Where |
|---|---|---|
| C-001 | **Fixed, with tests.** The exchange now knows a place-holder whose first or last letter the Markdown writer wrote as a character reference, which is what it does to a letter hard against emphasis. And the failure can no longer be silent: what is left of a place-holder the exchange does not know becomes the mark, and the equation is counted as left out. With the first fix taken out, both new tests fail (tried), and the chapter then shows the mark and reports one equation, not the place-holder. | `placeholders()`, `writeEquations()` in `scripts/docx-to-markdown.mjs`; `test_docx_equation_beside_emphasis` (the review's shapes: seven), `test_docx_lost_placeholder_is_marked`; INT-0030 Consequences |
| C-002 | **Fixed, with a test.** A number or letter before a root that has an index is kept apart from it: `2 ³√x` beside `2³√x`. | `row()` in `scripts/rehype-math.mjs`; six cases added to `test_math_title_text_neighbours`; INT-0030 Consequences |
| C-003 | **Tightened.** The test asserts the whole sentence, both of the document's own words in it, that its paragraph holds exactly the one formula `\frac{m}{V}`, and that the document holds exactly the two real equations. | `test_docx_token_in_text` |
| C-004 | **The regression fixed with a test; the rest recorded.** A paragraph's `$$` are now counted by reading inline code as Markdown does, not by a pattern: a backtick written with a backslash opens no code, a lone backtick is text, and `\$$` is not `$$`. A `$$` in a link's address or an HTML attribute directly above a fence still turns the fence over, and the build names it; that is in INT-0030's Consequences with the way round it (a blank line). | `fencesIn()` in `scripts/remark-math-dollars.mjs`; three cases added to `test_dollars_code_above_fence`; INT-0030 Consequences |
| C-005 | **Corrected.** The records no longer say in the past tense what `test-report.md` will hold; the first review's answers say 28 cases, and say the CI citation is written with the report; the comment in `row()` says what the test says. A formula that is all comment (`$%x$`) is now one that cannot be read, with a case in `test_math_empty`. The report says whether any test passed only on a retry. | `unit-tests.md`, `integration-tests.md`, `e2e-tests.md`, `critique-round-1.md`; `mathml()` in `scripts/rehype-math.mjs` |
