# Plan Critique — Sprint 25 (first review)

The first review of the plans, before the revision that answers it. It
returned `block`. The reviewer read the plans against the code and found the
plugin order, the chapter path, the absence of client script, the bundled
books' dollar signs and the clause-to-test count sound. "Why it matters" is
condensed from the reviewer's report; each "Suggested response" ends with
what was done. Facts the reviewer could not check (the packages were not
installed in the project) were tried in a scratch folder before the plans
were revised, and the result is given.

## Concerns

### C-001: The money rule lets a `$` inside inline code, or a `\$`, close a formula
- **Where:** `build-plan.md` T-077 clauses 3 and 5; `test-plan.md` `test_dollars_code_untouched`; `math-trial.md` section 3
- **Quote:** "WHEN a dollar sign stands inside inline code or a code block, THEN it SHALL NOT open or close a formula"
- **Failure mode:** plan-test-mismatch
- **Why it matters:** The look ahead walked raw characters to the next `$` and knew nothing of code, escapes or links, and neither does `remark-math`. A price followed later in the paragraph by `` `$x` ``, `\$` or a link whose address holds `$` became one formula. Two of this sprint's own documents tripped it.
- **Suggested response:** fix-in-plan — applied. Tried and confirmed: all five of the reviewer's lines became formulas. T-077 gains a clause: the look ahead refuses a pair when a backtick, `](` or `://` stands between the signs or the closing sign follows a backslash. With that, all five yield no formula and the code and links are intact (`test_dollars_closer_belongs_elsewhere`); T-079 reads the same lines (`test_search_money_lines`). The cost, a formula between single dollar signs cannot hold those characters, is in INT-0030.

### C-002: T-081's gate clause contradicts T-079 on the same fixture
- **Where:** `build-plan.md` T-081 clause 3 against T-079 clause 2
- **Quote:** "the search index SHALL hold `E=mc2` for the first page and not `\frac`"
- **Failure mode:** plan-test-mismatch
- **Why it matters:** The first fixture page holds the unreadable `$\frac{a}{$`, which search must hold as typed.
- **Suggested response:** fix-in-plan — applied: the record holds `\frac` only inside `$\frac{a}{$` and holds no `\sqrt`, `\sum` or `\begin`.

### C-003: A formula in a chapter's title has no clause, and a Word title would show the place-holder
- **Where:** `build-plan.md` T-082; `scripts/docx-to-markdown.mjs` `settleHeadings`; `scripts/document-stage.mjs` `prepareMarkdown`
- **Quote:** "`scripts/document-stage.mjs` needs no change"
- **Failure mode:** hidden-dep
- **Why it matters:** A Word title is taken while it still holds the converter's token; a Markdown document's title is taken by a parser that does not know formulas. Sidebar, tab and Bibliotheca would show a token or raw LaTeX.
- **Suggested response:** fix-in-plan — applied. One rule for plain-text places: a formula reads as `formulaText()`. T-082 gains a clause and `test_docx_title_with_equation`; a new task T-084 covers `prepareMarkdown` (`test_prepare_markdown_title_formula`, `test_prepare_markdown_title_unchanged`). INT-0030 records it, and that a title typed into `SUMMARY.md` is shown as typed.

### C-004: A set-apart Word equation inside a list item, quotation or footnote breaks its container
- **Where:** `build-plan.md` T-082 clause 4
- **Quote:** "`$$` on lines of its own above and below for an equation that is a paragraph of its own"
- **Failure mode:** EARS-vague
- **Why it matters:** Three lines put into finished Markdown lose the list's indent or the quotation's mark on lines two and three.
- **Suggested response:** fix-in-plan — applied: a set-apart equation is written on one line as a paragraph of its own, which T-077 sets apart wherever the paragraph stands (tried in a list item and a quotation). `test_docx_equation_in_containers` covers a list item, a quotation and a footnote.

### C-005: A literal dollar sign in a Word document's text is not escaped
- **Where:** `build-plan.md` T-082 clauses 4–5
- **Quote:** "the Markdown's own escaping SHALL NOT have changed a character of the LaTeX"
- **Failure mode:** EARS-vague
- **Why it matters:** The converter knows exactly which dollar signs are text, yet left them to the heuristic.
- **Suggested response:** fix-in-plan — applied: a clause that every `$` of the document's own text is written `\$`, and `test_docx_dollar_in_text`.

### C-006: The Word converter can return wrong mathematics for a known element with an unknown property
- **Where:** `build-plan.md` T-082 clauses 1 and 3
- **Quote:** "WHEN an equation holds an element the converter has no rule for"
- **Failure mode:** EARS-vague
- **Why it matters:** A fraction with no bar is a binomial; a run may be double-struck; a bracket may have one side. `readable()` accepts the wrong LaTeX for each.
- **Suggested response:** fix-in-plan — applied: clause 1 names the property values that have rules (kinds of fraction, hidden limits, an unnamed sign, an empty bracket side, run styles); clause 3 returns nothing for a bracket, accent, grouping mark, kind of fraction or run style with no rule. Tests added for each. A draft converter was tried on forty-four equations before locking.

### C-007: "Alone in its paragraph" is not pinned down at the HTML level, and a `$$…$$` line inside a paragraph falls between clauses
- **Where:** `build-plan.md` T-077 clause 4, T-078 clause 2
- **Quote:** "an inline formula that is its paragraph's only child and whose source starts with `$$` is given the set-apart form"
- **Failure mode:** plan-test-mismatch
- **Why it matters:** A block inside a paragraph is re-parsed by `rehype-raw` into empty paragraphs, and no test ran that step. A `$$ x = y $$` line directly under a text line is common in notes.
- **Suggested response:** fix-in-plan — applied: the paragraph is replaced by, or divided around, a set-apart node that is a sibling of paragraphs; a `$$…$$` formula with a line of a paragraph to itself is set apart; in the middle of a line or inside a heading, cell, emphasis or link it stays inline. `test_math_set_apart_through_raw` runs `rehype-raw` and asserts no `p` parent and no empty `p`. INT-0030 states the rule.

### C-008: A fenced code block in the language `math` is both "a formula" and "code in any language"
- **Where:** `build-plan.md` T-078 clauses 1 and 9; T-079 clause 6
- **Quote:** "a code block in any language … SHALL be unchanged"
- **Failure mode:** EARS-vague
- **Why it matters:** The two clauses gave opposite answers, and page and search could disagree.
- **Suggested response:** fix-in-plan — applied: a `math` code block is a set-apart formula, as on GitHub, on the page (T-078 clauses 2 and 11) and in search (T-079 clauses 1 and 6), with a test on each side. INT-0030 records it.

### C-009: `\ref` / `\eqref`, `\label` ids and macros that persist are unspecified; one Temml claim looks wrong
- **Where:** `build-plan.md` T-078 clauses 3 and 8
- **Quote:** "or does not have (`\href`)"
- **Failure mode:** EARS-vague
- **Why it matters:** A real paper uses these, and each could put a link or an `id` on the page.
- **Suggested response:** fix-in-plan — applied. Tried: `\href` and `\url` throw; `\ref` and `\eqref` write an empty `a` of class `tml-ref`; `\label` writes an `id`; a `\def` or `\newcommand` in one formula is unknown in the next. T-078: a formula with `\ref` or `\eqref` is unreadable and named; `\label` is laid out and leaves no `id`; each formula is read on its own (`test_math_refused_commands`, `test_math_formulas_stand_alone`). INT-0030 and the tutorial say so.

### C-010: The theme check does not prove a formula can be seen in Sanguine Atonement
- **Where:** `build-plan.md` T-081 clause 7; `src/styles/sanguine.css`
- **Quote:** "the computed colour of a `math` element SHALL equal that of the paragraph it stands in."
- **Failure mode:** plan-test-mismatch
- **Why it matters:** Sanguine headings are gradient text with a transparent fill, which a formula in a heading inherits; a set-apart formula is not in a paragraph; computed colour passes when nothing is painted.
- **Suggested response:** fix-in-plan — applied: T-080 gives a formula in a Sanguine heading a fill of its own (`sanguine.css` joins its files); T-081 compares a set-apart formula with the prose and checks by pixels that an inline formula, a set-apart one and one in a heading are painted, in three themes and both engines.

### C-011: The font package and Temml's stylesheet are unverified, and the browser check would not catch the likely fault
- **Where:** `build-plan.md` T-080 clauses 2 and 4; T-081 clauses 4 and 6
- **Quote:** "declared from the `@fontsource/stix-two-math` package's own files"
- **Failure mode:** missing-risk
- **Why it matters:** A face limited by `unicode-range` would leave radicals and large operators to a system font; the wrong Temml sheet would bring a second font file.
- **Suggested response:** fix-in-plan — applied. Checked: the package ships one file that is the whole font (5,169 glyphs, MATH table), but its stylesheet limits the face to Latin by `unicode-range`. T-080 declares the face itself from that file with no range, and takes Temml's rules from `Temml-STIX2.css`, which needs no second font. T-081 measures a radical over a fraction and a set-apart against an inline summation sign, asks `document.fonts.check()` for `∑√α`, and awaits `document.fonts.ready` before measuring.

### C-012: "Safari's engine" is proven on a stand-in, and the CI fallback contradicts its own test
- **Where:** `build-plan.md` T-081 clause 11 and Notes; T-083 clause 4
- **Quote:** "If WebKit cannot be installed on CI's Ubuntu image, the step is left out of CI"
- **Failure mode:** e2e-drift
- **Why it matters:** Playwright's WebKit is not Safari; tolerances come from one Windows trial; the fallback would fail the planned CI test; `check:electron` builds whatever the machine's manifest names.
- **Suggested response:** fix-in-plan — applied in part, with a stated deferral. The fallback is removed: CI installs WebKit and runs the gate, and a failure there is answered. T-083's clause names the manifest the Electron check is run with. The plans and INT-0030 say Safari itself was not run. Not done: a run under WSL before fixing tolerances; CI's Ubuntu is the second system, the measured values are well inside the tolerances (0 px against 4, 59 px against 24), and the Test phase treats a failure there as a failure.

### C-013: `test_math_e2e_mode` may not be runnable inside Vitest
- **Where:** `test-plan.md` "The gates as programs"
- **Quote:** "`playwright.config.ts` loaded with `TOME_MATH_E2E=1`"
- **Failure mode:** plan-test-mismatch
- **Why it matters:** Importing Playwright's test module inside Vitest risks a clash of `expect`.
- **Suggested response:** fix-in-plan — applied: the test spawns `npx playwright test --list` with and without the variable and reads the list.

### C-014: Several gate clauses cannot be measured as written
- **Where:** `build-plan.md` T-081 clauses 2 and 6; T-078 clause 7
- **Quote:** "no page SHALL hold a `script` that the default build's same page kind does not"
- **Failure mode:** EARS-vague
- **Why it matters:** No defined comparison of scripts; "one line" fails on a second transform or a line end; `data:` requests; "exactly as typed" rebuilt two ways.
- **Suggested response:** fix-in-plan — applied: no chapter's `article` holds a `script`; at least one line, white space collapsed, from both output streams; every `http(s)` request; and one exported `asTyped()` used by the page and by search, with the clause saying what it holds.

### C-015: The dollar-sign risk's own mitigation has no task, and the owner's existing library is not looked at
- **Where:** `research-report.md` section 4
- **Quote:** "the build should make a formula's presence easy to see."
- **Failure mode:** missing-risk
- **Why it matters:** A wrongly paired `$a+$b` lays out silently.
- **Suggested response:** defer-with-rationale, recorded in INT-0030: a count of formulas per chapter on every build is noise for a book that is mostly mathematics, so it is left out, and the intent says the rule can be fooled and by what. `test_dollars_recorded_limits` pins those cases. At the Test phase the owner's own library is built once and every formula found outside the tutorial is put to the owner in the conversation; nothing of that library is written into the repository.

### C-016: The long-formula risk is covered for set-apart formulas only
- **Where:** `build-plan.md` T-080 clause 3; T-081 clause 8
- **Quote:** "`.tome-math` SHALL be a size container"
- **Failure mode:** missing-risk
- **Why it matters:** A long formula within a line cannot wrap and widens a phone page; `overflow-x: auto` brings a vertical scroll bar when a formula's ink leaves its box.
- **Suggested response:** fix-in-plan — applied. Tried at 390 px: with Temml's soft breaks Chrome's engine wraps a long inline formula, Safari's does not (the page became 774 px wide); and Chrome's engine reported set-apart boxes 1 to 3 px taller than their height. T-078 wraps a long inline formula in a box of its own; T-080 styles it to scroll within the line, and gives `.tome-math` padding and no vertical scroll. Measured after: both pages 390 px wide in both engines, no box scrollable up and down. T-081 checks a long inline formula, a wide numbered equation, and numbers at 390 px.

### C-017: Bookkeeping: a test with no clause, changed files with no test, an unnamed test file, and a slug test that could be circular
- **Where:** `test-plan.md` T-078 and T-079 unit tests; `build-plan.md` T-078, T-081 and T-083 Touches
- **Quote:** "`test_formula_text` (notes)"
- **Failure mode:** plan-test-mismatch
- **Why it matters:** Contracts other tasks build on had no clause; the gate helper's new path had no test; a file that must change was not named.
- **Suggested response:** fix-in-plan — applied: T-078 has a clause for its exported functions (`test_math_exports`) and for the config's rehype step; T-081 has a clause and test for the helper's build-and-return path; `book.test.ts` is named in T-083; the slug test renders with Astro's real `rehypeHeadingIds` and compares its ids with `parseChapter()`'s.

### C-018: An INT-0029 guarantee loses its only case when the fixture's equations are carried over
- **Where:** `build-plan.md` T-082 clause 7; `test_docx_marks_are_literal`
- **Quote:** "edited only where they asserted an equation's mark or its count"
- **Failure mode:** intent-drift
- **Why it matters:** The proof that a mark followed by `(see the table)` cannot form a link would be dropped while the mark still exists.
- **Suggested response:** fix-in-plan — applied: the revised tests change the fixture's first equation to an unknown one and keep the literal-mark assertions on it; T-082's clause on the mark says "as literal text that can never form a link".

### C-019: Decisions and unknowns that live only in the plan, and stale intent text
- **Where:** INT-0030 Consequences and Alternatives; INT-0026 criterion 3
- **Quote:** "The sprint that plans this confirms which the owner meant."
- **Failure mode:** intent-drift
- **Why it matters:** The intent is the authority; the plan is provenance.
- **Suggested response:** fix-in-plan — applied: INT-0030 records how the reading of "OpenMath" was put to the owner and answered, says three faults in both places, and gains the consequences that lived only in the plans (no link or image from a formula, a formula as a word of its own in search, titles, the set-apart rule, the `math` block, references, labels and macros, the limits of the dollar rule, tables, long formulas, Safari itself not run). INT-0026 criterion 3 points at INT-0030.

### C-020: Formulas inside other Markdown constructs are untested, and search reads tables differently from the page
- **Where:** `test-plan.md` T-077, T-078 and T-079 unit tests; `src/lib/search-index.ts`
- **Quote:** "`**bold $5 and $x$ here** and $z$.` → `x`, `z`"
- **Failure mode:** plan-test-mismatch
- **Why it matters:** No test put a formula in a table cell, list item, quotation, alert, footnote or link text; in a table a `|` inside a formula ends the cell; search does not parse tables.
- **Suggested response:** fix-in-plan — applied, with one limit recorded. `test_dollars_in_constructs` has a case per construct, the table one written with `\lvert`; the tutorial says to write `\vert` in a table; T-079's clause on money speaks of lines outside a table, and INT-0030 records that search has never read tables as the page does.

## Confidence
block
