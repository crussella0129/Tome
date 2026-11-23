# INT-0030 — Mathematics, code and proofs that can be read

<!-- sprint-loop-intent-v2 -->
- **Intent ID:** INT-0030
- **State:** planned
- **Work evidence:** [Sprint 25 build plan](../sprints/s25/sprint-plans/build-plan.md) (T-077 to T-084)
- **Completion evidence:** none
- **Code evidence:** none
- **Test evidence:** none
- **Documentation evidence:** none

## Intent

Mathematics written in a document is set as mathematics, and code is set as
code, so that a paper, a proof and a project's intents all read well in
Tome. The owner, on 23 November 2026: "We want easy and seamless LaTeX (so
like full OpenMath abilities of making  and inline code so that intents,
code, and proofs can all be read."

Two things follow, in this order:

1. Mathematics written in LaTeX notation inside a Markdown document, within
   a line and set apart on its own, is laid out as an equation.
2. An equation in a Word document
   ([INT-0029](INT-0029-documents-as-tomes.md)) is carried over and laid out
   the same way.

Reading a whole document written in LaTeX or in Typst as a tome was the
third part of this intent. It is a different kind of work, reading a
document format, where these two are laying out formulas, and it now
stands on its own as
[INT-0033](INT-0033-latex-and-typst-documents.md).

Inline code and code blocks are already set apart from prose; this intent
holds them to the same standard beside mathematics.

## Acceptance criteria

Settled in Sprint 25's plan, which the owner approved on 23 November 2026.

1. A formula written `$…$` within a line is laid out within the line. One
   written `$$…$$` on lines of its own, or alone in its paragraph, is set
   apart. This holds in Light, Dark and Sanguine Atonement, in Chrome's
   engine and in Safari's (between them the engines of the browser and of
   both desktop apps), from Tome's own files: nothing is fetched from the
   network, and no script is added to a chapter.
2. A fraction, a root, a sum with limits, a matrix, an aligned derivation
   and a numbered equation each lay out correctly: enough to write a
   proof. Equation numbers count from 1 down each page and stand at the
   right edge.
3. A Word document's equations appear as equations, carried over as LaTeX
   notation in the converted Markdown. One the converter does not know
   keeps the mark `[equation not shown]` and is counted in the build's
   report.
4. Inline code and code blocks stay clearly apart from prose and from
   mathematics; a dollar sign inside code is never a formula.
5. A sum of money written with a dollar sign stays a sum of money.
6. A formula that cannot be read is shown as it was typed and named, with
   its chapter, when the library is built; it does not stop the build or
   vanish.
7. Search finds a formula by what it shows, and a heading that holds a
   formula opens at its section from a search result.
8. A chapter of the tutorial tells a person how to write a formula.

## Rationale

The owner writes papers and proofs, and keeps project intents that hold
code. Tome today shows `$x^2$` as the characters typed.

## Alternatives

- **Unicode symbols only**, as
  [INT-0026](INT-0026-document-editor.md) first outlined. That writes
  x² but not a fraction or an aligned derivation.
- **mdBook's own mathematics.** It asks for `\\(` and `\\[` in the source
  and loads MathJax in the reader; the owner asked for easy and seamless.
- **Which engine lays out the formulas.** Sprint 25's Research tried three
  on one sample, each run when the library is built so that no script is
  added to a chapter:
  - *The browser's own mathematics (MathML), written by Temml, with a
    mathematical font bundled in Tome.* The smallest pages (about 5 KB for
    the sample against 22 KB and 46 KB). It follows the theme's colour and
    takes whatever mathematical font it is given, so it is the only one of
    the three that can later be set in Cruor. Each browser engine lays it
    out itself: Chrome's did so correctly, and Safari's showed three faults,
    each with a correction (Consequences).
  - *KaTeX.* Looks the same in every engine, because it carries its own
    typeface and stylesheet (about 300 KB of fonts). It cannot be set in
    another typeface.
  - *MathJax, as drawn shapes.* Needs no font or stylesheet and looks the
    same everywhere; the formulas are pictures, so their text cannot be
    selected, and it too cannot be set in another typeface.

  Research recommends the first. The choice is the owner's, at the plan.

## Consequences

- "OpenMath" in the owner's words is read here as "everything mathematics
  needs". OpenMath is also the name of a standard for the meaning of
  formulas, and the Cruor project plans an OpenType MATH table (its T-196).
  Sprint 25's plan put this reading to the owner in so many words ("Say so
  if you meant the standard"); the owner approved the plan and did not say
  otherwise. The standard is not part of this intent.
- Equations are set in Cruor only when Cruor has its mathematical symbols
  (its T-205) and its MATH table (T-196). Until then they are set in the
  layout engine's own mathematical font.
- Which engine lays out equations is for the sprint that plans it. One that
  works when the library is built keeps Tome's chapters free of script.
- A dollar sign gains a meaning in every book Tome reads. A line such as
  "It costs $5 and then $10" would be read as a formula by the usual rule;
  Tome needs a stricter one, and Research showed one working. A book that
  wants a formula such a rule refuses can write `\$` or `$$`.
- A Word equation is carried over as LaTeX notation in the converted
  Markdown, not as a finished picture of the formula, so the converted
  document stays one a person could edit
  ([INT-0026](INT-0026-document-editor.md)).
- The owner chose the browser's own mathematics (MathML) with a bundled
  mathematical font, from the three engines above, in approving Sprint
  25's plan. The font is STIX Two Math, installed with Tome and never
  committed. It is one setting, so a Cruor mathematical font takes its
  place when the Cruor framework ships one
  ([INT-0027](INT-0027-cruor-typefaces.md)). The owner, on 23 November
  2026: "we have made Cruor fonts nerd and math capable as a heads up. The
  idea is to have aesthetic math and code". The Cruor build looked at that
  day held no MATH table yet, so nothing in this intent waits on it.
- Safari's engine needs three corrections that are Tome's to keep (no
  source annotation inside a formula, a sized wrapper round a set-apart
  formula, equation numbers written at build time). A check in that
  engine holds them.
- Referring to an equation by its number is not part of this intent yet. A
  formula that holds `\ref` or `\eqref` is treated as one that cannot be
  read; `\label` is accepted and leaves nothing on the page.
- A command defined in one formula (`\def`, `\newcommand`) is not known in
  the next: each formula is read on its own.
- A formula can hold no link, image or attribute of its own: the commands
  that would write one are refused, and such a formula is shown as typed.
- Search finds a formula by what it shows (`E=mc2`), not by its LaTeX
  commands. A formula is a word of its own there, so `$n$th` is found as
  `n` and `th`. One exception keeps what search could do before: search
  reads only the letters a to z and digits, so a formula of Greek letters
  and signs would be found by nothing; the name a symbol was typed with
  (`alpha` for `\alpha`, `le` for `\le`) is therefore a word too. And a
  raised or lowered character counts as the plain one when search splits
  text into words, so a heading shown as `E = mc²` is found by `mc2`. An
  equation's number or tag is no part of what search reads.
- A sidebar, a tab, the "on this page" rail and a list of results are plain
  text. There a formula is written on one line so that it still says what
  it said: `√2`, `(a+b)/c`, `x²`, `E = mc²`, with brackets wherever two
  formulas would otherwise read the same (`√(2x)` beside `√2x`). This
  holds for a title Tome
  takes from a document (a Word paper's title, a Markdown document's first
  heading) and for a heading in the rail and in search. A formula with no
  honest one-line form (a matrix, an accent, a limit set above a sign) is
  shown there as typed. A title an author types into an mdBook's
  `SUMMARY.md` is shown as typed. A heading's address is made from the
  formula's flattened text (`the-emc2-law`), because that is how the page
  itself makes it.
- `$$…$$` is set apart when it has its line or lines to itself: between
  `$$` lines of their own, alone in its paragraph, or on lines of a longer
  paragraph, which is then divided around it. Inside a heading, a table
  cell, emphasis or a link, and in the middle of a line, it stays within
  the line. A fenced code block in the language `math` is a set-apart
  formula, as on GitHub.
- A `$$` fence is a line that holds `$$` and nothing else, closed by another
  such line. Between two such lines a formula is taken exactly as typed.
  `$$` with something after it on its line is not a fence: the formula is
  read within its paragraph, so a line of it that begins with a list mark
  (`+ c`) is read as a list, and the formula is then shown as the text
  typed. A formula of several lines is safest between `$$` lines.
- A fence that is never closed takes the rest of the document, as an
  unclosed code fence does in any Markdown. What it took is shown as typed
  and named when the library is built; it is never laid out as mathematics.
- The rule for dollar signs looks ahead in the raw text. It refuses a pair
  whose second sign is inside inline code, is written `\$`, or is inside a
  link's address; so a formula between single dollar signs cannot hold a
  backtick, `](` or `://`, and one that must is written with `$$`.
- The rule can still be fooled. Two dollar signs in one paragraph, each
  hard against text and outside code, are a formula: `$HOME/$USER` and
  `$B$2:$C$3` among them. Nothing reports that a formula was laid out, only
  that one could not be read; a count of formulas per chapter was weighed
  and left out as noise for a book that is mostly mathematics. Such text
  belongs in code, and the tutorial says so.
- In a table, a `|` inside a formula ends the cell, as it does for any
  text there; `\vert` is written instead. Search does not read tables as
  the page does (it never has), so dollar signs in two cells of one row
  can pair in search where they do not on the page.
- A formula within a line that is longer than a line breaks where TeX would
  break it in Chrome's engine. Safari's breaks no formula, so there it
  scrolls within the line. Neither can widen the page.
- Safari itself, on a Mac, an iPhone or an iPad, was not run. The check
  runs the open-source build of its engine that the test runner provides,
  on Windows and on Linux.
- A book written for mdBook's own mathematics (`\\(` … `\\)`) is not laid
  out. [INT-0032](INT-0032-shared-ground-with-mdbook.md) weighs that.
- Firefox was not tried.

## Transition history
- 2026-11-23: created as `proposed` in Sprint 24's Research, from the owner's
  words opening the sprint.
- 2026-11-23: revised in Sprint 25's Research. Whole LaTeX and Typst
  documents moved to INT-0033; the engines tried were recorded under
  Alternatives; criteria for sums of money and for unreadable formulas were
  added. State unchanged.
- 2026-11-23: `proposed` to `planned` in Sprint 25's Plan phase. The owner
  approved the plan; the acceptance criteria were settled and the chosen
  engine recorded under Consequences.
- 2026-11-23: revised in Sprint 25's Plan phase to answer three plan reviews.
  Consequences gained what the plans decide: how a `$$` fence is read, what
  plain-text places show, how search finds symbols, the limits of the rule
  for dollar signs, and what was not run. State unchanged.
