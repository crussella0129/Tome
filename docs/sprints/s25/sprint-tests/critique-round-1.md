# Test Critique — Sprint 25, round 1

> The first independent review of the Test phase, kept as it was written,
> at head `1e782cf`. Its verdict was `block`. The answers follow it. The
> final review is `critique.md`.

Read-only review at head `1e782cf` (records committed at `1c95ab5`). Nothing in the project was edited; no gate, build or Playwright run was started. I ran 12 of the sprint's Vitest files (122/122 passed), `npx vitest list` (35 files, 318 cases, matching `unit-tests.md` file by file), and probe scripts kept in a scratch folder outside the repository (`dollars.mjs`, `layout.mjs`, `search.mjs`, `word.mjs`). The probes drive the project's own plugins through unified, not an Astro build.

## Concerns

### C-001: With CRLF line ends, a `$$…$$` line with text under it is not set apart, and a numbered one becomes unreadable
- **Where:** `scripts/remark-math-dollars.mjs` `startsLine` / `divide()`; T-077 clause 7; INT-0030 AC1; `test_dollars_set_apart`, `test_search_set_apart_environment` (LF only).
- **Quote:** `node.type === 'text' && /^[ \t]*\n/.test(node.value)`
- **Failure mode:** EARS-coverage (a real fault on an input no test tries)
- **Why it matters:** The text after the formula begins `\r\n`, so the pattern fails and the formula stays inline. `"Text above\r\n$$ x = y $$\r\nand below."` gives `<p>Text above <math>…</math> and below.</p>`; with `\n` it gives paragraph, `div.tome-math`, paragraph. Worse, `$$\begin{align}`…`\end{align}$$` with a text line directly under it is laid out and numbered `(1)` with LF, but with CRLF is a `tome-math-error` reading `$\begin{align}…$` plus a build warning. Search agrees with the page, so both are wrong together. Every fixture is LF on disk (`git ls-files --eol`: `w/lf`), so neither the Windows run nor CI can see this; CRLF is what Windows editors and `autocrlf=true` checkouts write.
- **Suggested response:** add-test (CRLF twins of `test_dollars_set_apart`, `test_dollars_not_a_fence` and `test_search_set_apart_environment`) and fix `startsLine`/`flush` to accept `\r?\n`. A fence, a formula over a line end, and `$$…$$` as the last line already work with CRLF.

### C-002: `$$` inside inline code directly above a fence flips the fence, and the rest of the chapter is taken
- **Where:** `scripts/remark-math-dollars.mjs` `openInParagraph()`; T-077 clauses 5 and 9; INT-0030 AC4; not in INT-0030 Consequences.
- **Quote:** `return (text.match(/\$\$/g) ?? []).length % 2 === 1;`
- **Failure mode:** negative-path
- **Why it matters:** The count is over raw paragraph text, code spans included. Input: ``Write `$$` on its own line:`` / `$$` / `a = b` / `$$` / blank / `After the formula.` / `## Later heading` / `Later text.` Output: `<p>Write <code>$$</code> on its own line: $$ a = b</p>`, then one `code.tome-math-error` holding `After the formula. ## Later heading Later text.`, with the warning "a $$ fence was never closed". The formula is never laid out and the later heading is gone from the page. Clause 5 promises a fence under "a paragraph that has no unclosed `$$` in it"; a `$$` in code is not one, and AC4 says a dollar sign in code is never a formula. A sentence naming `$$` in code just above a formula is what documentation about mathematics looks like (the tutorial does it, saved only by a blank line).
- **Suggested response:** add-test and fix (leave code spans, and `$$` pairs already closed, out of the count); or, if left, record it in INT-0030 Consequences and have the tutorial say to leave a blank line before a `$$` line.

### C-003: `titleText()` gives two different formulas the same text, and writes a binomial as a fraction
- **Where:** `scripts/rehype-math.mjs` `row()` / `case 'mfrac'`; T-078 clause 12; INT-0030 Consequences ("brackets wherever two formulas would otherwise read the same"; no honest one-line form means shown as typed); `test_math_title_text`.
- **Quote:** "so that what a root, a fraction or a power holds is never run together with what stands beside it"
- **Failure mode:** weak-assertion (the 27 cases only try a number *after* a root or fraction)
- **Why it matters:** These reach a document's title, the rail and search results (AC7). Measured:
  - `3\frac{1}{2}` gives `31/2`, the same as `\frac{31}{2}`; `12\frac{3}{4}` gives `123/4`; `1 \frac{1}{2}` gives `11/2`; `2 3^2` gives `23²`.
  - `\frac{a}{b}\frac{c}{d}` gives `a/bc/d`, the same as typing `a/bc/d`.
  - `\binom{n}{k}` and `n \choose k` give `(n/k)`; `\genfrac{}{}{0pt}{}{n}{k}` and `a \atop b` give `n/k` and `a/b`. A stack with no bar is read as a division. The Word converter writes exactly that `\genfrac` for a no-bar fraction, so a Word title holding a binomial reads `(n/k)`.
  - Through `parseChapter`, the heading `## Binomial $\binom{n}{k}$ and mixed $3\frac{1}{2}$` is indexed as `Binomial (n/k) and mixed 31/2`.
- **Suggested response:** tighten-assertion and fix: part a number that directly *precedes* a fraction, root or power with a numeric base; return `null` for an `mfrac` with `linethickness` 0. Add those cases to `test_math_title_text`. (`f'(x)` gives `f^′(x)`, which is clumsy rather than wrong.)

### C-004: Two Word equations with nothing between them are written `$a$$b$`, one unreadable formula, and nothing is reported left out
- **Where:** `scripts/docx-to-markdown.mjs` `dollarForm()` / `writeEquations()`; T-082 clause 5; INT-0030 AC3; `test_docx_equations_read_back`.
- **Quote:** "every carried-over equation **SHALL** be read as a formula with exactly the LaTeX the converter returned"
- **Failure mode:** EARS-coverage
- **Why it matters:** `dollarForm` looks only at whether the next character is a digit. Replacing the fixture's first equation with `<m:oMath>a</m:oMath><m:oMath>b</m:oMath>` gives Markdown `Density is $a$$b$(see the table)…`. T-077's reader reads one formula `a$$b`; the page shows `code.tome-math-error` `$a$$b$`; `leftOut` is `[]`. Both equations are lost with no mark and no count; only the build's generic warning appears. With a space between them it works. Two related cases from the same substitute-after-writing design:
  - Word text ending in `\` directly before an equation writes `Density is \$\frac{m}{V}$…`, so the formula becomes text.
  - Document text holding a word like `tomeEquation9carried` makes `convertDocx` throw `TypeError: Cannot read properties of undefined (reading 'cell')`.
- **Suggested response:** add-test (adjacent equations; text ending in a backslash) and fix: write a separator or the `$$` form when the neighbour is `$` or another token, and ignore tokens with no entry. Rare shapes, but the failure is silent in the left-out report, which is what AC3 leans on.

### C-005: The browser tests load the mathematical font themselves, so they cannot show that formulas are set in it
- **Where:** `e2e/math.spec.ts` `open()` and `test_math_font_and_requests`; `e2e/electron.spec.ts` `test_electron_math_chapter`; T-081 clause 7, T-083 clause 4; INT-0030 AC1 ("from Tome's own files").
- **Quote:** `await document.fonts.load('16px "Tome Math"', '∑√α');`
- **Failure mode:** weak-assertion
- **Why it matters:** That call fetches the face whether or not any `math` element uses it. The three assertions after it (`Tome Math:loaded`, `document.fonts.check(...)`, a request for `stix-two-math…woff2`) would pass with `math { font-family }` missing or overridden; `check()` proves no coverage for a face with no `unicode-range`. On Windows a system font (Cambria Math) would then satisfy every position test. I read the built CSS in `dist/_astro` and the rule and face are there, so this is weak evidence, not a fault.
- **Suggested response:** tighten-assertion: assert `getComputedStyle(math).fontFamily` starts with `Tome Math`, and check the face is `loaded` after `document.fonts.ready` alone, before any forced load.

### C-006: The radical check cannot fail, and the cell-padding fix (Blockage 2) has no test that would catch its loss
- **Where:** `e2e/math.spec.ts` `test_math_positions`; `sprint-meta.md` Blockages 2; `src/styles/math.css` `math mtd`; `math.test.ts`.
- **Quote:** `expect(radical!.height).toBeGreaterThanOrEqual(held!.height);` and "T-081 measures a matrix's rows."
- **Failure mode:** weak-assertion
- **Why it matters:** `radical` is the `msqrt` element's box, which encloses its own `mfrac` child, so the comparison holds whether or not the radical sign stretches. The matrix check asks only that row middles differ by more than 5 px and columns line up; rows "run together" by Tailwind's reset would still pass, and no unit test names the `math mtd { padding }` rule. The Blockage is an honest account of a fault found by eye, but "T-081 measures a matrix's rows" claims more than the test does.
- **Suggested response:** tighten-assertion: assert a gap between row boxes (or a cell's computed padding above 0), and add `math mtd` to `test_math_css_rules`. For the radical, compare against a measured value or a painted strip, or say in the report that it is a containment check only.

### C-007: The long-formula threshold (Blockage 1) is not pinned by any test
- **Where:** `rehype-math.test.ts` `test_math_long_inline`; `scripts/rehype-math.mjs` `LONG = 16`; T-078 clause 7 (locked at 30).
- **Quote:** "`test_math_long_inline` tries eighteen terms and `x^2`, on either side of both numbers"
- **Failure mode:** weak-assertion
- **Why it matters:** The departure is an honest reading (30 broke T-081's phone-width clause in WebKit; the change strengthens "neither can widen the page"). But the test passes for any threshold from 3 to about 70, so the number the sprint changed is the one thing it does not hold. The 28-character case that prompted the change is not a test.
- **Suggested response:** tighten-assertion: one formula of 16 laid-out characters (no box) and one of 17 (box).

### C-008: Converter rules beyond T-082's clause have no test, and three of them look wrong
- **Where:** `scripts/omml-to-latex.mjs` `toLatex()` (`box`, `borderBox`, `phant`, `groupChr`), `delimited()` (`\middle`, `Vmatrix`, angle and floor brackets), `ACCENTS` (acute, grave, breve, check, spacing forms), `STYLES` (`bi`, `sans-serif`, `monospace`); `test_omml_rules`.
- **Quote:** `return isOn(value(child(node, 'phantPr'), 'show')) || !child(node, 'phantPr') ? e() : …phantom…`
- **Failure mode:** EARS-coverage
- **Why it matters:** `unit-tests.md` says "one rule for each element", but these rules run on real documents with no case. Probed:
  - `m:phant` with properties but no `m:show` (a smash: `<m:phantPr><m:zeroDesc m:val="1"/>`) gives `a\phantom{b}c`, hiding `b`. With no `phantPr` it is shown. The rule is inconsistent with itself; I believe Word's default is "shown", but I did not check that against Word.
  - `m:borderBox` with all four sides hidden and a strike (a cancel) gives `\boxed{x}`: a box where Word shows a strike-through.
  - A `w:r` holding text inside `m:oMath` is dropped silently: `a+`, `<w:r><w:t>hello</w:t></w:r>`, `+b` gives `a++b`. Clause 3 says an element that holds part of the equation gives nothing for the whole.
  - The rest behaved: underbrace, overbrace, `\middle\vert`, `Vmatrix`, floor and angle brackets, `\boldsymbol`, `\mathsf`, `\mathtt`, nested fractions, an `eqArr` in square brackets, `<`, `>`, `&`, an only-spaces equation (marked and counted), and LaTeX Temml refuses (`\sinx`, `∫\limitsx`: marked).
- **Suggested response:** add-test for each extra rule; give up (`null`) on a `borderBox` with hidden sides or strikes and on a non-math element holding text; settle the `phant` default against a file Word saved.

### C-009: By-eye evidence at the tested head is two captures of twenty, none in Chromium, Dark or Sanguine
- **Where:** `e2e-tests.md` "By eye"; test plan "By eye, captured into the test report: … in Light, Dark and Sanguine Atonement, in both engines".
- **Quote:** "The other captures here were made for the record and were not each looked at."
- **Failure mode:** evidence-drift
- **Why it matters:** The record is candid, but the plan's by-eye check is mostly unperformed at this head; the T-080 viewing predates T-081's fixture edits and the 30-to-16 change. Both faults the sprint found in layout were found by eye. I opened `proof-2-light-chromium.jpg` and `proof-1-sanguine-webkit.jpg`: formulas, numbers at the right edge, matrix and cases rows, the heading formula, the rail's `The E = mc² law`, and the long inline formula wrapping inside its box in Chromium all look right. That makes four of twenty.
- **Suggested response:** look at the remaining captures (at least one per theme per engine for each page) and record it, or carry the gap as a named caveat. The Tauri window not being opened is already stated plainly.

### C-010: Small behaviours not in INT-0030's recorded limits
- **Where:** INT-0030 Consequences; `scripts/rehype-math.mjs` `asTyped()`; `src/lib/search-index.ts`.
- **Quote:** "A formula that cannot be read is shown as it was typed"
- **Failure mode:** intent-coverage
- **Why it matters:** None is serious; each is a surprise an author could meet.
  - An unreadable `$$…$$` in the middle of a line, a heading or a cell is shown between single dollar signs (`## Law $$\begin{equation}a\end{equation}$$` shows `$\begin{equation}a\end{equation}$`). The plan's clause 8 specifies this and `test_math_refused_commands` asserts it, but it is not "as typed".
  - `%` starts a comment: `$r = 5% per year$` lays out and indexes as `r=5`, with no warning.
  - `$\text{\$5}$` is no formula at all (a `\$` before the closing sign refuses the pair). The Consequences list of what single dollar signs cannot hold names backtick, `](` and `://` but not `\$`.
  - `Costs $5 <span title="$x">here</span>.` yields the formula `5 <span title="` and breaks the tag; a `$` inside an inline HTML attribute is a variant of "the rule can still be fooled" that the text does not name.
  - Search has no GFM autolinks: `See www.e.test/$a and www.e.test/$b now` is no formula on the page, but search text is `See www.e.test/ aandwww.e.test/ b now`. T-079 clause 4's "as typed" does not hold there (only tables are a recorded exception).
  - An empty `$$`/`$$` fence gives an empty `math` element with no warning.
- **Suggested response:** defer-with-rationale: add them to INT-0030 Consequences (and `\%` to the tutorial), or reject individually with a reason.

### C-011: AC7's "opens at its section from a search result" is proved in pieces, not in a browser
- **Where:** INT-0030 AC7; `test_search_words_fold_raised`; gate `check_math_heading_slugs`; E2E `test_math_rail`.
- **Quote:** "a heading that holds a formula opens at its section from a search result"
- **Failure mode:** intent-coverage
- **Why it matters:** The chain is sound: `search('mc2')` over a hand-written record returns `/2-more#the-emc2-law`; the gate shows the built page's ids equal the built index's slugs; the rail click scrolls to the heading. But nothing runs `search()` over the *built* index, or types `mc2` into the search overlay on the proofs build. The gate checks the first page's text and only that the slug exists on the second.
- **Suggested response:** add-test (in `check-math.mjs`, `search('mc2', builtIndex)` returns `/2-more#the-emc2-law`), or state the chain in the test report as the evidence for AC7.

### C-012: Records point to a test report that is still empty for CI's result
- **Where:** `unit-tests.md` ("The CI run and its totals are in `test-report.md`"); `integration-tests.md` ("and in CI on Linux (`test-report.md`)").
- **Quote:** "The gates ran on this Windows machine at that head, and in CI on Linux"
- **Failure mode:** evidence-drift
- **Why it matters:** `test-report.md` has no content yet, so the Linux claim rests on a forward reference. It is true: `gh run list` shows CI run 45268114001 on `1e782cf` completed with success. The report must cite that run and its totals, including that the math gate ran in both engines on Ubuntu.
- **Suggested response:** defer-with-rationale (write it into `test-report.md`; nothing else to do).

## Confidence
block

Four faults in behaviour stand unfixed and unrecorded (C-001 to C-004). Each is small to fix with a test or to record as a limit; once that is done, what remains (C-005 to C-012) is assertion strength and record-keeping, and the verdict would be proceed-with-caveats.

What held under checking:
- **Traceability:** every EARS clause of T-077 to T-084 has a named test that exists and asserts it. The only renamed location, `test_tutorial_covers_mathematics` in `tutorial-math.test.ts`, is recorded.
- **Counts and edits:** the counts and the list of edited tests in `unit-tests.md` match the files.
- **Heading addresses:** slugs agreed between page and index for 18 awkward headings.
- **Safety:** Temml refused every command that could write an attribute, link or image (`\id`, `\style`, `\htmlClass`, `\htmlData`, `\href{javascript:…}`); `\gdef` and `\newcommand` did not leak between formulas; `\label` left no `id`.
- **Money:** prices in emphasis, links, headings, tables, footnotes and ranges stayed prices.
- **Blockages:** 1 and 3 are honest readings of the locked clauses and weaken no promise; Blockage 2 is honest but overstates its test (C-006).
- **E2E flake risk:** `math.spec.ts` has no fixed sleeps; its `.nth()` selectors are order-dependent but each is followed by a structural query that would fail loudly, not pass falsely.
- **What was not run:** the records say so plainly (Safari itself, Firefox, Tauri, a paper of the owner's, Google Docs).

## Responses

Written by the sprint's author after the review. Every concern was taken.
The fixes and tests are in the commit that follows `1c95ab5`; the suite and
every gate were run again at that head (`unit-tests.md`,
`integration-tests.md`, `e2e-tests.md`).

| Concern | Answer | Where |
|---|---|---|
| C-001 | **Fixed, with tests.** A line end is now `\r?\n` wherever the set-apart rule looks for one. | `scripts/remark-math-dollars.mjs` (`LINE_END_FIRST`, `LINE_END_LAST`); `test_dollars_crlf`, `test_math_crlf`, and a CRLF case in `test_search_set_apart_environment` |
| C-002 | **Fixed, with a test.** Code spans are taken out of a paragraph's text before its `$$` are counted. | `openInParagraph()`; `test_dollars_code_above_fence` (the review's own input, and its twins) |
| C-003 | **Fixed, with a test.** A number hard against a fraction is kept apart from it (`3 1/2`), two fractions side by side are kept apart (`a/b c/d`), and a stack with no bar gives no one-line form, so it is shown as typed. `2 3^2` is left as `23²`: TeX itself sets those two digits together, so the one-line form says what the page says. | `row()`, `case 'mfrac'` in `scripts/rehype-math.mjs`; `test_math_title_text_neighbours`; INT-0030 Consequences |
| C-004 | **Fixed, with tests.** Two equations side by side are written with a space between them; an odd run of backslashes before an equation is doubled so the formula stands; the place-holder is made anew for each document with sixteen random letters, and one with no equation behind it is left as text. | `placeholders()`, `writeEquations()` in `scripts/docx-to-markdown.mjs`; `test_docx_adjacent_equations`, `test_docx_backslash_before_equation`, `test_docx_token_in_text` |
| C-005 | **Tightened.** The tests no longer fetch the font. `open()` waits for the page's own formulas to bring it in, and `test_math_font_and_requests` asserts that every `math` element's computed family begins with `Tome Math`. The desktop check does the same. | `e2e/math.spec.ts` `open()`, `test_math_font_and_requests`; `e2e/electron.spec.ts` `test_electron_math_chapter` |
| C-006 | **Tightened.** The radical's own ink is measured in the strip left of the fraction (photographed with the root shown and hidden) and must span nine tenths of the fraction's height. A matrix cell's padding is read in the browser, and the second row's letters must begin below the first row's by at least that much. `test_math_css_rules` holds the `math mtd` rule. Blockage 2 now says what the test did and does. | `paintedRows()`, `test_math_positions`; `src/styles/__tests__/math.test.ts`; `sprint-meta.md` |
| C-007 | **Tightened.** One formula of 16 laid-out characters (no box) and one of 17 (a box). | `test_math_long_threshold`; Blockage 1 |
| C-008 | **Fixed, with tests, and checked against Word.** A second document was written by Word itself with a phantom and a smash: Word writes `m:show m:val="0"` for what is hidden and no `m:show` for a smash, so a part is hidden only when Word says so. A box with a stroke or a hidden side, and text of Word's own inside an equation, now give nothing for the whole equation. Every other rule the review listed has a case. | `scripts/omml-to-latex.mjs`; `test_omml_other_rules` (28 cases), `test_omml_other_unknowns`; `integration-tests.md` |
| C-009 | **Done.** The captures were taken again at the new head and each was looked at; what was seen is in `e2e-tests.md`, "By eye". | `evidence/`, `e2e-tests.md` |
| C-010 | **Recorded**, and one fixed. The five edges kept are in INT-0030's Consequences, and the tutorial tells an author to write `\%`. An empty formula is no longer an empty `math` element: it is one that cannot be read, shown as typed and named by the build. | INT-0030; `write-mathematics.md`; `test_math_empty` |
| C-011 | **Test added, in a browser.** On the built formula pages, in both engines, typing `mc2` into the search gives a first result that reads `The E = mc² law` and links to `/2-more#the-emc2-law`; following it opens that section in view; `alpha` finds the first page. | `test_math_search_opens_section` |
| C-012 | **Taken.** `test-report.md` is written after the final review, and cites the CI run on the tested head, its totals, and whether any test passed only on a retry. | `test-report.md` |
