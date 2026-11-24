# Test Critique — Sprint 25

Final review of the Test phase, read-only, at head `e2d16f7` on `dev`. The records name `0eb7dd4` as the tested head; `e2d16f7` adds records only (`git diff 0eb7dd4 e2d16f7 --stat` lists four files under `sprint-tests/`). It follows four earlier rounds, kept verbatim beside it with the author's answer to every concern (`critique-round-1.md` to `critique-round-4.md`), and checks the answers to the fourth. Nothing in the project was edited; `git status` is clean after my runs.

## Concerns

### C-001: `sprint-meta.md` does not record the fourth round's changes to the converter — caveat
- **Where:** `docs/sprints/s25/sprint-meta.md`, Blockages; `scripts/docx-to-markdown.mjs` at `0eb7dd4`.
- **Quote:** "equation that does not come back as a formula (`bf7ff46`; `sprint-tests/critique-round-3.md`). That check is more than T-082's locked clauses ask for"
- **Failure mode:** evidence-drift
- **Why it matters:** Blockages is where each departure from the locked plan is kept, and it stops at the third round. `0eb7dd4` changed behaviour again:
  - the check asks the layout engine about each equation as written where it stands;
  - a title names the mark for a refused equation, where T-082 clause 7 gives the mark only "when the converter returns nothing";
  - a place-holder that stands twice is counted once.
  
  INT-0030's Consequences and the three test records do say all this; only this file is behind.
- **Suggested response:** tighten-assertion (add the sentence, naming `0eb7dd4` and `critique-round-4.md`).
- **Response (the sprint's author):** done, in the records only. `sprint-meta.md`, Blockages, now names
  `0eb7dd4` and `critique-round-4.md` and says what changed there: the layout question, the
  title naming the mark for a refused equation, and the once-only count.

### C-002: Three small things no known input reaches are still unheld — caveat
- **Where:** `convertDocx()` and `settleEquations()` in `scripts/docx-to-markdown.mjs`; `test_docx_cell_words_with_bar_is_marked`; INT-0030 Consequences.
- **Quote:** "A title names the mark when its chapter shows the mark."
- **Failure mode:** weak-assertion
- **Why it matters:** None of these is a fault I could produce from a document.
  - **The reading back on the converter's own path is still only seen passing.** With `convertDocx` altered in memory to ask the layout engine but read nothing back unless a reader is handed in, all three files stay green (97 passed, 1 skipped). The new end-to-end refusal comes from the layout question, not from the reading back. No document makes Tome's reader refuse an equation the layout engine accepts (none in 4,752 + 8,400 conversions), so such a test cannot be written without a seam. The wiring in question is one argument.
  - **The mode the layout engine is asked in is not held.** With the `equation.display` argument dropped, all tests pass. It changes nothing I could find: of 81 LaTeX forms the converter writes, none is readable in one mode and not the other.
  - **The quoted sentence holds for a refusal, not for a place-holder changed past knowing.** `settleEquations()` returns the refused set, which does not include what the debris branch marked, so the title would still name the equation there. No shape is known to reach that branch through `convertDocx`.
- **Suggested response:** defer-with-rationale (a line in `unit-tests.md` for the first two; soften the sentence, or pass the debris set too, for the third).
- **Response (the sprint's author):** deferred, with the reasons the review itself gives, and
  written into `test-report.md` under Coverage Observations. No document is known that Tome's
  reader refuses and the layout engine accepts (none in 13,152 conversions), so the reading
  back on the converter's own path can be seen refusing only through a stand-in reader; the
  check itself is held with Tome's own reader by `test_docx_unread_equation_is_marked`, and
  the wiring is one argument. None of the 81 forms the converter writes is readable in one
  mode and not the other. The sentence in INT-0030 is narrowed to what holds: a title names
  the mark for an equation the check refused.

### C-003: An equation flagged as a paragraph of its own but sharing it with a note reference, a line break or a picture is shown within the line — caveat (cosmetic; not from this round)
- **Where:** `placeEquations()` in `scripts/docx-to-markdown.mjs`; T-082 clauses 4 and 5.
- **Quote:** `if (only.length === 1 && text === marks.token(only[0])) carried[only[0]].display = true;`
- **Failure mode:** EARS-coverage
- **Why it matters:** The test for "a paragraph of its own" looks at the paragraph's text only. Measured:
  - an equation followed by a footnote reference is written `$$z+1$$[^1]`;
  - followed or preceded by a line break, `$$z+1$$<br>` and `<br>$$z+1$$`;
  - beside a picture, `$$z+1$$![…](./image-1.png)`.
  
  The page reads each as a formula within its line, not set apart. The formula is right, nothing is lost and nothing is an error; a displayed equation that carries a footnote mark simply looks smaller than in Word. I should have seen it in round 4: it predates that round.
- **Suggested response:** defer-with-rationale (record it in Consequences), or add-test with a fix later.
- **Response (the sprint's author):** deferred. It loses nothing and is no error; it is
  recorded in INT-0030's Consequences and queued as T-085. No source or test was changed
  after this review, so the evidence it reviewed is the evidence the report cites.

## Confidence
proceed-with-caveats

No concern is a block. All four round-4 answers are resolved, and each new test fails when its fix is removed. What remains is a record one sentence behind (C-001), three things no known input reaches (C-002), and one cosmetic edge that loses nothing (C-003).

**The four round-4 answers.** Checked by running the project's tests with each fix removed in memory (a vitest config outside the project; nothing on disk changed). Unaltered, `docx-to-markdown`, `document-stage` and `load-books` give 97 passed, 1 skipped.
- **C-001 (plain words holding a bar, in a cell): resolved.**
  - The shape is now the mark in its cell with a count of 1. This holds as a whole cell, with words and a second equation round it, in a header cell, twice in one cell (count 2), in a heading, a list and a table inside a cell, and after a backslash before `(after)` (no link).
  - Outside a cell (a paragraph, a heading, a list item, alone) the same equation is a formula with nothing left out.
  - Without the layout question, or asking about the LaTeX as converted and not as written, `test_docx_cell_words_with_bar_is_marked` fails.
- **C-002 (the production path, and order): resolved as asked.** My two alterations from round 4 now fail: the check used only when a reader is handed in fails `test_docx_cell_words_with_bar_is_marked`; a comparison that ignores order fails `test_docx_read_back_is_in_order`. The residue is the first point of C-002 above.
- **C-003 (the mark after a backslash, the title, the count): resolved.**
  - `Before \`, an equation, `(after)`, refused, gives `Before \\\[equation not shown](after)`: no link, and the same with two backslashes.
  - The title reads `On the Weight of [equation not shown]` when the chapter shows the mark, and `√2` when it does not.
  - A Title set in a table gives two marks and a count of one equation.
  - Removing the backslash rule from either branch, the once-only count, or the title rule each fails `test_docx_refusal_mark_is_text`.
- **C-004 (stubs): resolved.** `unit-tests.md` names the stand-in reader.

**What the last changes could have broken.**
- The layout question refused nothing that lays out: equations alone in a paragraph, a list item and a quotation are set apart; those in a heading and a cell stay within the line; none became an error.
- The matrix, run again: 4,752 conversions, 0 silent, 0 place-holders, 0 formulas from the document's own dollar signs, 0 disagreements between the check's reader and the page's, and **0 error elements** (34 in round 4). Those 34 are now the mark, each counted.
- Round 3's matrix, run again: 8,400 conversions, none silent.
- Cost is unchanged: 10 ms for the fixture; 321 ms for a paper of 1,102 equations, 61 ms of it the reading back. The loop still ends, with one reading per refused equation.

**Records.**
- `npx vitest list` gives 35 files and 337 cases; `docx-to-markdown.test.ts` has 43, of which 11 were added in the Test phase, as `unit-tests.md` says.
- The ten sprint test files ran 165 passed, 1 skipped.
- The rows for the three new tests match the code.
- `integration-tests.md` reports my matrix and its 34 correctly, and explains the 168 that the round-3 program lists.
- The heads are named honestly in all three records.

**The eight failure modes.** Traceability is complete: the gap under AC3 from round 4 is closed. Assertions: C-002. Stubs: two, both named, and the stand-in reader replaces a contract, not an implementation. No integration drift and no E2E cop-out. Negative paths are held by three refusal tests. Flake risk is low: the random place-holder reaches no compared output and the loop is bounded. Evidence drift: C-001 only.

**Not run.** No build, gate, Playwright or Electron run, no network, and Word was not driven. The gate and browser results in the records were judged by reading. Probes and outputs are in a scratch folder outside the repository: `mutate5.config.mjs` holds the alterations, `precheck.mjs` is the layout question and C-003, `matrix.mjs` with `matrix5.out` is the matrix, and `refuse.mjs` with `refuse5.out` is the mark.
