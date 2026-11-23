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

Three things follow, in this order:

1. Mathematics written in LaTeX notation inside a Markdown document, within
   a line and set apart on its own, is laid out as an equation.
2. An equation in a Word document
   ([INT-0029](INT-0029-documents-as-tomes.md)) is carried over and laid out
   the same way.
3. A document written in LaTeX or in Typst is read as a tome. The owner
   placed this after Word and Markdown: "LaTeX/Typst once we have that down
   (perhaps in the next sprint as you said)."

Inline code and code blocks are already set apart from prose; this intent
holds them to the same standard beside mathematics.

## Acceptance criteria

To be settled when a sprint plans it. The owner's words set the outline:

1. `$…$` within a line and `$$…$$` on its own lay out as equations in every
   theme, in the browser and both desktop shells, with no network.
2. A fraction, a root, a sum with limits, a matrix, an aligned derivation
   and a numbered equation each lay out correctly: enough to write a proof.
3. A Word document's equations appear as equations.
4. A `.tex` and a `.typ` document load as tomes.
5. Inline code and code blocks stay clearly apart from prose and from
   mathematics.

## Rationale

The owner writes papers and proofs, and keeps project intents that hold
code. Tome today shows `$x^2$` as the characters typed.

## Alternatives

- **Unicode symbols only**, as
  [INT-0026](INT-0026-document-editor.md) first outlined. That writes
  x² but not a fraction or an aligned derivation.
- **mdBook's own mathematics.** It asks for `\\(` and `\\[` in the source
  and loads MathJax in the reader; the owner asked for easy and seamless.

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

## Transition history
- 2026-11-23: created as `proposed` in Sprint 24's Research, from the owner's
  words opening the sprint.
