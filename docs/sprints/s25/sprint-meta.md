# Sprint 25 Meta

- **Sprint number:** 25
- **Book schema version:** 2
- **Start timestamp:** 2026-11-23T17:30:26Z
- **End timestamp:** (filled at Loop Phase)
- **Model:** claude-fable-5-2
- **Bundle version:** 0.22.0
- **Exit status:** in-progress
- **Token count:** (filled at Loop Phase if observable)
- **Summary:** Lay out mathematics: a formula in a Markdown chapter or a Word document is shown as an equation, built into the page with a bundled mathematical font.
- **Intents:** [INT-0030](../../intents/INT-0030-mathematics-and-code.md) — planned; INT-0029 and INT-0008 realized compatibility boundaries; INT-0027 and INT-0026 proposed constraints. Recorded in Research and not built this sprint: INT-0033 (created).
- **Completion evidence:** (filled at Loop Phase)

## Blockages

- **Resolved during T-080 (a number in the locked plan):** T-078's clause
  gives a formula within a line a box of its own when its laid-out text is
  "longer than 30 characters". Looking at the built pages in Safari's
  engine, a formula of 28 characters ran 30 px past a 412 px reading column:
  that engine breaks no formula, and thirty characters is wider than a
  narrow column. T-081's clause that no page is wider than its window could
  not hold with that number. The threshold is 16 characters (about 250 px
  at the reader's largest text). The rule and its test are otherwise as
  planned; `test_math_long_inline` tries eighteen terms and `x^2`, on either
  side of both numbers. The Test phase's review found that this held for
  any threshold from 3 to about 70; `test_math_long_threshold` now holds the
  number itself, with a formula of 16 characters and one of 17.
- **Resolved during T-080 (a reset the plan did not know of):** Tailwind's
  reset takes the padding off every element, the cells of a formula among
  them, so a matrix and a set of cases stood with their rows run together in
  the real reader, though not in the trial pages, which had no reset.
  `math.css` gives a formula's cells the padding the browsers' own sheet
  for mathematics gives them. As built, T-081 checked only that a matrix's
  rows stood at different heights, which rows run together would also pass
  (the Test phase's review said so). `test_math_positions` now reads a
  cell's padding in the browser and asks that the second row's letters
  begin below the first row's by at least that much, and
  `test_math_css_rules` holds the rule.
- **Resolved during T-080 (how a clause is tested):** the clause says
  `math.css` holds "no `http:` or `https:` address anywhere". Temml's rules,
  taken whole as the plan says, hold one picture written into the sheet as
  a `data:` address (the arrow of `\cancelto`), whose SVG names its
  namespace, `http://www.w3.org/2000/svg`. That is a name, not a place a
  browser fetches from. The test checks that every `url()` is the font
  package's file or a `data:` picture, that there is no `@import`, and that
  no `http` remains once that namespace is set aside; T-081 checks in a
  browser that every request goes to Tome's own origin.
- **Resolved during the Test phase (source changed after Build):** Test
  found faults that tests had not tried, and they were corrected in the
  phase with a test each, not carried as failures: none needed a new
  design. A file Word itself saved showed a style wrapped round a sign
  (`1e782cf`). The independent review of the tests then found four more:
  a `$$…$$` line with Windows line ends was not set apart; `$$` inside
  inline code directly above a fence turned the fence over and the rest of
  the chapter was taken; a plain-text title ran a whole number into a
  fraction and wrote a binomial as a division; two Word equations with
  nothing between them became one unreadable formula with nothing reported.
  The review's record and each answer are in
  `sprint-tests/critique-round-1.md`. A second review found one more: a
  Word equation hard against bold or italic text was lost, and the
  place-holder that stood for it was shown in the chapter with nothing
  reported (`b452443`; `sprint-tests/critique-round-2.md`). A third found
  the same kind of loss by another road, a Word equation in a table cell
  that ends in a bar. Besides that fix, the converter now reads its own
  result back with Tome's reader and writes the mark, and counts, for any
  equation that does not come back as a formula (`bf7ff46`;
  `sprint-tests/critique-round-3.md`). That check is more than T-082's
  locked clauses ask for; it holds clause 5 itself and adds no behaviour a
  reader sees unless the clause would otherwise have been broken. A fourth
  review passed the phase with caveats, and its answers changed the
  converter once more (`0eb7dd4`; `sprint-tests/critique-round-4.md`): the
  check also asks the layout engine about each equation's LaTeX as it is
  written where it stands; a title names the mark for an equation the
  check refused, where T-082's clause 7 gives the mark only when the
  converter returns nothing; and a place-holder that stands twice in the
  text is one equation, counted once.
