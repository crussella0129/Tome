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
  side of both numbers.
- **Resolved during T-080 (a reset the plan did not know of):** Tailwind's
  reset takes the padding off every element, the cells of a formula among
  them, so a matrix and a set of cases stood with their rows run together in
  the real reader, though not in the trial pages, which had no reset.
  `math.css` gives a formula's cells the padding the browsers' own sheet
  for mathematics gives them. T-081 measures a matrix's rows.
- **Resolved during T-080 (how a clause is tested):** the clause says
  `math.css` holds "no `http:` or `https:` address anywhere". Temml's rules,
  taken whole as the plan says, hold one picture written into the sheet as
  a `data:` address (the arrow of `\cancelto`), whose SVG names its
  namespace, `http://www.w3.org/2000/svg`. That is a name, not a place a
  browser fetches from. The test checks that every `url()` is the font
  package's file or a `data:` picture, that there is no `@import`, and that
  no `http` remains once that namespace is set aside; T-081 checks in a
  browser that every request goes to Tome's own origin.
