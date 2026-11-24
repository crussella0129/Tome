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

Sprint 26's Research tried each of these on one paper written in both
formats (`docs/sprints/s26/sprint-research/reader-trial.md`).

- **Pandoc.** It read the whole paper in both formats: the author's own
  commands written out, a second file pulled in, theorems and sections
  numbered, and every formula one that Tome's layout reads. It need not be a
  separate program a person installs: its official WebAssembly build comes
  by `npm` (56 MB, under the GPL). Its own Markdown puts a set-apart formula
  inside its paragraph, where Tome reads it as within the line, so Tome
  would take pandoc's tree and write the Markdown itself. It refuses a whole
  Typst document that uses a package or a function it does not carry.
- **A LaTeX reader installed by `npm`** (unified-latex, MIT). It parses
  LaTeX, but its Markdown lost the author's commands, the second file,
  every label, the footnote and the theorem blocks. Tome would have to write
  most of a LaTeX reader on top of it.
- **Typst's own compiler**, which can write HTML, also installed by `npm`.
  It resolves references and the bibliography, but its HTML export, which
  Typst calls "very incomplete", left out every formula.
- **Leave it to the author:** export to Word or Markdown first, which Tome
  already reads. Costs nothing, and loses the formulas in a Word export
  unless INT-0030's second part carries them.

## Consequences

- Depends on INT-0030 for the formulas.
- The choice between a separate program and a reader installed with Tome
  bears on [INT-0032](INT-0032-shared-ground-with-mdbook.md), which asks
  the same question of mdBook.
- Pandoc is under the GPL and Tome under the MIT licence. Called when a
  library is built, pandoc is in neither Tome's repository nor its desktop
  apps, which hold only the built pages. If the desktop app comes to build
  libraries itself
  ([INT-0020](INT-0020-native-library-folder-management.md)), pandoc would
  be shipped inside it, and the owner decides again.
- A paper is often several files. A LaTeX file that another pulls in is
  part of that paper and is not a chapter of its own.
- A Typst document that uses a package cannot be read by pandoc at all; it
  can only be shown as a chapter that says so.

## Transition history
- 2026-11-23: created as `proposed` in Sprint 25's Research, split from
  INT-0030.
- 2026-11-24: revised in Sprint 26's Research, still `proposed`. The owner
  chose this intent for the sprint ("LaTeX and Typst"). Alternatives now
  say what each reader did with a paper, and Consequences gained pandoc's
  licence, papers of several files, and the limit on Typst documents.
