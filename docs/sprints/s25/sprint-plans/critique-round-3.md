# Plan Critique — Sprint 25 (third review)

The third review, kept narrow: whether the second round's eight concerns
were answered, and a screen of what that revision changed. It found six
responses to hold outright and two (the plain-text title form, the search
by symbol name) to hold in the main with a residue. It verified every
task's clause count and every clause a test cites, and checked the new work
against the page, the search code, the document stage, the Word converter
and the tutorial's tests. It returned `block` on its first two concerns,
"each a locked test whose expected result contradicts the code as tried or
its own clause", needing "a few lines of plan text, with no change of scope
or design". "Why it matters" is condensed from the reviewer's report; each
"Suggested response" ends with what was done.

## Concerns

### C-001: `formulaText()` is read "within a line", where Temml refuses every numbered environment and `\tag`
- **Where:** `build-plan.md` T-078 clause 12, T-079 clause 1, T-081 clause 4; `test-plan.md` `test_math_exports`
- **Quote:** "`formulaText(tex)` **SHALL** be the text of the `math` element the plugin writes for it within a line"
- **Failure mode:** plan-test-mismatch
- **Why it matters:** Temml reads `equation`, `align`, `gather` and `\tag` only when set apart. Read within a line they are unreadable, so the commonest set-apart formulas of a proof would be indexed as typed, and the gate's own page would fail its clause.
- **Suggested response:** fix-in-plan — applied. Confirmed by trial: `\begin{equation} E = mc^2 \end{equation}` throws within a line and gives `E=mc2` set apart. `formulaText()` takes the same `display` argument `readable()` has and leaves out the cell that holds a number or tag (clause 12, `test_math_exports`); T-079 reads a set-apart formula set apart, and a number or tag is no part of search text (clause 1, new `test_search_set_apart_environment`); INT-0030 says so.

### C-002: `titleText()` can still give two different formulas the same title
- **Where:** `build-plan.md` T-078 clause 12; `test-plan.md` `test_math_title_text`
- **Quote:** "`e^{i\pi}` → `e^iπ`"
- **Failure mode:** plan-test-mismatch
- **Why it matters:** A run of letters and digits was never bracketed, so `\sqrt{2x}` and `\sqrt{2}x` both read `√2x`, and a braced base lost its brackets.
- **Suggested response:** fix-in-plan — applied. The clause states the rule: every part of a root, a fraction, a power or an index is in round brackets unless it is one letter, one symbol or one number, or stands in brackets already. The draft was changed to that rule and tried: `√(2x)` beside `√2x`, `e^(iπ)`, `(a+b)²` for both `{a+b}^2` and `(a+b)^2`, `√10`, `x^(ab)` beside `x^ab`. The test's expected values were corrected and the reviewer's cases added.

### C-003: A heading shown as `E = mc²` is no longer found, or opened at its section, by typing the formula
- **Where:** `build-plan.md` T-079 clauses 1 and 5; `src/lib/search.ts`
- **Quote:** "so a result reads `The E = mc² law`"
- **Failure mode:** intent-drift
- **Why it matters:** Search reads only a to z and digits, so `mc²` was the word `mc`; the query `mc2` would match no heading.
- **Suggested response:** fix-in-plan — applied: a new T-079 clause folds raised and lowered characters to the plain ones when text is split into words, in the index and in the query (`search.ts` and its test join T-079; `test_search_words_fold_raised` runs `search('mc2', …)` against such a heading). It is a table of those characters, not a general normalization, so every other word is split as before. INT-0030 records it.

### C-004: The rail's mechanism changes headings that hold no formula, and its clause has no test when T-079 lands
- **Where:** `build-plan.md` T-079 clause 6
- **Quote:** "uses its text where a slug matches"
- **Failure mode:** plan-test-mismatch
- **Why it matters:** The index's text for a heading with a line break already differs from the page's, so substituting wherever a slug matched would change rail entries the clause says stay as they were.
- **Suggested response:** fix-in-plan — applied: a pure `formulaHeadings()` gives text for exactly the headings that hold a formula, and the page uses it for those slugs only; `test_search_formula_headings` is a unit test in T-079 with a `<br>` heading in it; the gate and the browser check stay as the built-page proof.

### C-005: The Word converter's "pass over what Word adds" is not bounded by a test
- **Where:** `build-plan.md` T-082 clauses 1 and 3
- **Quote:** "**SHALL** return nothing for the whole equation, never part of it"
- **Failure mode:** missing-risk
- **Why it matters:** The draft passed over every element outside the equation markup, so a tracked change or a link that wraps part of an equation would drop or keep runs silently.
- **Suggested response:** fix-in-plan — applied: clause 3 returns nothing for an element of another kind that itself holds part of the equation, and `test_omml_unknown_is_nothing` tries a tracked insertion round a run. A document with tracked changes is read at the Test phase if one can be had.

### C-006: T-078's and T-080's tests read fixture pages that T-081 creates
- **Where:** `test-plan.md` `test_math_nothing_unsafe`, `test_math_exports`, `test_math_css_rules`
- **Quote:** "every formula of the two fixture pages"
- **Failure mode:** hidden-dep
- **Why it matters:** Those tests could not run when their own task landed.
- **Suggested response:** fix-in-plan — applied: the two pages are made in T-078 (its Touches), and T-081 reads them.

### C-007: Small residues
- **Where:** `test-plan.md` `test_docx_equations_read_back`, Intent Traceability AC7; `build-plan.md` T-081 clause 5; `sprint-meta.md`
- **Quote:** "holds a dollar sign, a backtick, `](` or `://`, or ends in a backslash or a dollar sign"
- **Failure mode:** plan-test-mismatch
- **Why it matters:** A clause named cases its test did not try; a clause said "the first page" of a measurement on the second; the table worded AC7 with a consequence; the metadata left an intent out.
- **Suggested response:** fix-in-plan — applied: the read-back test tries an equation holding `://`; "ends in a backslash" is removed from the clause, since the converter writes no LaTeX that ends in one; T-081 clause 5 says "the pages"; the table says which words come from Consequences; INT-0026 is in the metadata's line.

## Confidence
block
