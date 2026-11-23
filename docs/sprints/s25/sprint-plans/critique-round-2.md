# Plan Critique — Sprint 25 (second review)

The second review, of the plans as revised after the first
(`critique-round-1.md`). It found fourteen of the first round's responses to
hold outright and the rest to hold with a residue, raised again below; the
clause-to-test counts complete for all eight tasks; and the plugin order,
the heading collector, the gate helper's test seam, the listing mode and the
lazy load of the document stage sound against the code. It returned `block`
on its first two concerns. "Why it matters" is condensed from the reviewer's
report; each "Suggested response" ends with what was done, and with what was
tried in the scratch folder where a fact was in doubt.

## Concerns

### C-001: `$$` with anything else on its fence line eats the rest of the chapter, or loses the formula
- **Where:** `build-plan.md` T-077 clause 5; `test-plan.md` `test_dollars_set_apart`; INT-0030 AC1
- **Quote:** "WHEN `$$` opens and closes on lines of their own, THEN the reader SHALL yield a set-apart formula as `remark-math` does"
- **Failure mode:** missing-risk
- **Why it matters:** The package takes what follows an opening `$$` on its line as a label and reads on to a line that is only `$$`, or to the end of the document. A paper's usual `$$\begin{aligned}` … `\end{aligned}$$` would lose its first line and take the rest of the chapter; `$$a = b` then `$$` would vanish without a message.
- **Suggested response:** fix-in-plan — applied. Confirmed by trial. T-077 now composes the package's two parts itself and wraps its fence: a fence line must hold `$$` and nothing else, and such a line under a paragraph with an unclosed `$$` closes that formula. A `$$…$$` formula that has its lines to itself in a paragraph is set apart. Sixteen shapes were tried with the draft; the three the reviewer named each give one set-apart formula and keep the paragraph after it (`test_dollars_fences`, `test_dollars_not_a_fence`; the first shape is on the fixture page and in the gate). Two things remain as recorded limits, each pinned by a test and stated in INT-0030 and the tutorial: a line of such a formula that begins with a list mark is read as a list, the formula then showing as the text typed; and a fence never closed takes the rest of the document, which a new clause shows as typed and names, and never lays out (`test_dollars_unclosed_fence`, `test_math_unclosed_fence`).

### C-002: T-084's example title cannot come from `formulaText()`, and a title "by what it shows" can state different mathematics
- **Where:** `build-plan.md` T-084 clause 1, T-078 clause 12, T-082 clause 7
- **Quote:** "(`# Proof that $\sqrt{2}$ is irrational` is titled `Proof that √2 is irrational`)"
- **Failure mode:** plan-test-mismatch
- **Why it matters:** Temml writes a root with no character for its sign, so that title would read "Proof that 2 is irrational"; `\frac{1}{2}` would read `12`.
- **Suggested response:** fix-in-plan — applied. A new exported `titleText()` (T-078 clause 12, `test_math_title_text`) writes a formula on one line that keeps what the layout says (`√2`, `(a+b)/c`, `x²`, `E = mc²`) and gives `null` where the layout has no such form (a matrix, an accent, a limit above a sign), in which case the formula is shown as typed. It was drafted and tried on eighteen formulas. T-082's and T-084's titles use it, and so do a heading's text in the search index and in the "on this page" rail (T-079, which gains `src/pages/[...slug].astro`; checked on a built page by the gate and in both engines). A heading's address stays the flattened text, because the page makes it so. INT-0030 records all of it.

### C-003: Two phone-width assertions in T-081: one cannot hold, one cannot fail
- **Where:** `build-plan.md` T-081 clauses 6 and 9
- **Quote:** "each either fit or have a scroll width greater than their own width"
- **Failure mode:** plan-test-mismatch
- **Why it matters:** The wide numbered equation scrolls at 390 px, so its number is past the box's edge; and "fits or overflows" is true of every element.
- **Suggested response:** fix-in-plan — applied: the wide numbered equation is numbered `(2)` on the second page and, at 390 px, its box is scrolled to its end before its number is measured; the two wide boxes must have a scroll width greater than their width with `overflow-x: auto`; the long formula within a line must be inside the column or its box wider inside than out.

### C-004: Where a long formula within a line sits on its line is neither stated nor measured
- **Where:** `build-plan.md` T-078 clause 7, T-080 clause 3
- **Quote:** "`.tome-math-long` SHALL be an inline box no wider than its line"
- **Failure mode:** missing-risk
- **Why it matters:** An inline block that scrolls takes its bottom edge as its baseline, so every formula past 30 characters would ride above its line.
- **Suggested response:** fix-in-plan — applied. Tried three ways in both engines: as an inline block set to the middle, the first letter of a long formula stood 1.3 to 2.1 px off a short one's on the same line; as an inline flex box it stood 0.0 px off in both engines, with no page wider than its window. T-080 names `display: inline-flex`; T-081 measures the two letters within 2 px.

### C-005: Search cannot find a formula made of Greek letters or symbols, and T-079 removes the only words it had
- **Where:** `build-plan.md` T-079 clause 1; `src/lib/search.ts`
- **Quote:** "and SHALL NOT hold its LaTeX commands or its dollar signs."
- **Failure mode:** intent-drift
- **Why it matters:** Search splits text into runs of a to z and digits. `$\alpha + \beta$`, found today by typing `alpha`, would be found by nothing.
- **Suggested response:** fix-in-plan — applied: the name of a command whose whole output is one character outside ASCII (`alpha`, `le`, `infty`, `sum`) is a word in the search text; a command that builds a structure adds none (`test_search_symbol_names`). The test that decides which commands those are was tried on nineteen. INT-0030 records it as the one exception to "not by its LaTeX commands"; the owner is told in the sprint's report.

### C-006: No equation saved by Word itself is in any test, and reading a real paper is conditional
- **Where:** `test-plan.md` End-to-End; `research-report.md` section 4
- **Quote:** "a real Word paper with equations, if the owner supplies one"
- **Failure mode:** missing-risk
- **Why it matters:** Sprint 24's faults all came from files Word saved, which carry properties on nearly every element; AC3 could pass on the fixture while most real equations stay marked.
- **Suggested response:** fix-in-plan — applied, with one honest limit. The converter passes over what Word adds that changes nothing (clause 1), and one test equation is written in the shape Word saves; it is hand-written to that shape, not copied, and the plan says so. The Test phase reads documents Word or Google Docs saved, the owner's or from a public test collection, and reports carried over against marked with the element that stopped each; if none can be had, the report says AC3 rests on the fixture and hand-written equations, as a caveat and not a pass.

### C-007: Intent bookkeeping left by the revision
- **Where:** INT-0030 header; INT-0026; INT-0029 Boundaries; `build-plan.md` Intents
- **Quote:** "Work evidence: Sprint 25 build plan (T-077 to T-083)"
- **Failure mode:** intent-drift
- **Why it matters:** The intent is the authority and must agree with the plan.
- **Suggested response:** fix-in-plan — applied: INT-0030's Work evidence names T-077 to T-084; INT-0026's second step and INT-0029's boundary send LaTeX and Typst documents to INT-0033; INT-0026 and INT-0029 each have a transition entry for this sprint's edits; INT-0026 is in the build plan's Intents as a constraint.

### C-008: Small test and dependency residues
- **Where:** `test-plan.md` `test_dollars_recorded_limits`, `test_docx_equations_read_back`; `build-plan.md` T-084
- **Quote:** "`test_dollars_recorded_limits` (notes)"
- **Failure mode:** plan-test-mismatch
- **Why it matters:** A test traced to notes; the read-back test did not try the refusals the revision added; a shared test file's order was undeclared; a chapter's place could break a neighbour test.
- **Suggested response:** fix-in-plan — applied: T-077 has a clause for the recorded limits; the read-back test tries an equation that ends in a dollar sign, one that holds a backtick and one that holds `](`, and T-082's clause says such an equation is written so that it is still read; T-084 depends on T-082; the chapter goes in the Guide part after "Panels & Tables", so `test_pager_prev_next` passes unedited and `test_books_library` is revised.

## Confidence
block
