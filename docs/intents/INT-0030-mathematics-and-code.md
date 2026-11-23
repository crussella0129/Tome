# INT-0030 — Mathematics, code and proofs that can be read

<!-- sprint-loop-intent-v2 -->
- **Intent ID:** INT-0030
- **State:** proposed
- **Work evidence:** none
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

To be settled when a sprint plans it. The owner's words set the outline:

1. `$…$` within a line and `$$…$$` on its own lay out as equations in every
   theme, in the browser and both desktop shells, with no network.
2. A fraction, a root, a sum with limits, a matrix, an aligned derivation
   and a numbered equation each lay out correctly: enough to write a proof.
3. A Word document's equations appear as equations.
4. Inline code and code blocks stay clearly apart from prose and from
   mathematics.
5. A sum of money written with a dollar sign stays a sum of money.
6. A formula that cannot be read is shown as it was typed and named when
   the library is built; it does not stop the build or vanish.

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
    out itself: Chrome's did so correctly, and Safari's needed two faults
    worked around.
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
  The sprint that plans this confirms which the owner meant.
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

## Transition history
- 2026-11-23: created as `proposed` in Sprint 24's Research, from the owner's
  words opening the sprint.
- 2026-11-23: revised in Sprint 25's Research. Whole LaTeX and Typst
  documents moved to INT-0033; the engines tried were recorded under
  Alternatives; criteria for sums of money and for unreadable formulas were
  added. State unchanged.
