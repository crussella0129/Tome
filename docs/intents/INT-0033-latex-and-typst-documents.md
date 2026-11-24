# INT-0033 — LaTeX and Typst documents read as tomes

<!-- sprint-loop-intent-v2 -->
- **Intent ID:** INT-0033
- **State:** proposed
- **Work evidence:** none
- **Completion evidence:** none
- **Code evidence:** none
- **Test evidence:** none
- **Documentation evidence:** none

## Intent

A document written in LaTeX (`.tex`) or in Typst (`.typ`) is read as a
tome, as a Markdown file and a Word document already are
([INT-0029](INT-0029-documents-as-tomes.md)). The owner, on 23 November
2026, placed this after Word and Markdown: "LaTeX/Typst once we have that
down (perhaps in the next sprint as you said)."

This was the third part of
[INT-0030](INT-0030-mathematics-and-code.md). It stands apart because it is
a different kind of work. INT-0030 lays out formulas written inside a
document Tome already reads. This intent reads a whole document format:
its sections, lists, figures, tables, citations, cross-references and the
author's own commands, as well as its formulas.

## Acceptance criteria

To be settled when a sprint plans it. In outline:

1. A library entry may name a `.tex` or a `.typ` file, and a folder of
   documents may hold them; each is read as a chapter.
2. Sections become headings, and the formulas are laid out as INT-0030 lays
   them out.
3. What cannot be carried over is marked where it stood and named when the
   library is built, as for a Word document.
4. The source is never changed.

## Rationale

The owner writes papers and proofs, and a paper often exists only as its
LaTeX source. Once formulas are laid out (INT-0030), most of what a LaTeX
paper holds has a place to land.

## Alternatives

- **Call pandoc.** It reads both formats well and writes Markdown. It is a
  separate program a person building Tome would have to install; `npm ci`
  does not bring it.
- **A LaTeX reader installed by `npm`.** Sprint 25's Research did not try
  one. A paper's own macros and packages are where such readers fall short.
- **Typst's own compiler**, which can write HTML. Also a separate program,
  or a large WebAssembly build of it.
- **Leave it to the author:** export to Word or Markdown first, which Tome
  already reads. Costs nothing, and loses the formulas in a Word export
  unless INT-0030's second part carries them.

## Consequences

- Depends on INT-0030 for the formulas.
- The choice between a separate program and a reader installed with Tome
  bears on [INT-0032](INT-0032-shared-ground-with-mdbook.md), which asks
  the same question of mdBook.

## Transition history
- 2026-11-23: created as `proposed` in Sprint 25's Research, split from
  INT-0030.
