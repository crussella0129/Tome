# INT-0033 — LaTeX and Typst documents read as tomes

<!-- sprint-loop-intent-v2 -->
- **Intent ID:** INT-0033
- **State:** active
- **Work evidence:** [Sprint 26 build plan](../sprints/s26/sprint-plans/build-plan.md) (T-086 to T-094)
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

Settled in Sprint 26's Plan phase, from the plan the owner approved on
24 November 2026.

1. A library entry may name a `.tex` or a `.typ` file, and a folder of
   documents may hold them; each is read as a chapter. A paper of several
   files is one chapter: in a folder, a `.tex` file with no `\documentclass`
   and a `.typ` file that another includes or imports are parts of a paper
   and not chapters of their own. `books:add` takes the two kinds, as it takes a
   Markdown file and a Word document.
2. The paper's title is the chapter's title, with its authors and date
   beneath and its abstract under "Abstract". Sections become headings.
   Lists, tables, figures with their pictures and captions, footnotes,
   quotations, code, and theorem and proof blocks are shown.
3. The formulas are laid out as INT-0030 lays them out, a set-apart one set
   apart and a numbered one numbered. A formula that cannot be laid out
   takes the `[equation not shown]` mark and is counted.
4. A reference to a section, theorem, table or figure shows what it refers
   to and leads there; a reference to a numbered equation shows that
   equation's number. A citation shows its entry: author and year from a
   `.bib` file, or the entry's number from a list kept in the paper.
5. What cannot be carried over is marked where it stood
   (`[LaTeX not shown]`, `[image not shown]`) and named, with its file
   when that is not the paper's own, when the library is built. A drawing
   or a command that holds words is marked; a bare command, most often
   spacing or type, is named in the build's report without a mark; a
   command Tome knows to be layout, holding nothing of the paper's, is
   passed over. A reference or a citation that leads nowhere
   is shown as written and counted. A document the reader refuses outright
   becomes a chapter that says so, with the reader's own reason in the
   build's report, or stops the load when it was named on its own. Nothing
   vanishes without a word.
6. The source is never changed, and no file outside the paper's own folder
   is read, a picture included. Nothing is fetched from the network. The reader is loaded only
   when a library holds such a document.
7. The tutorial and the README say what is read, what is marked, what a
   Typst document may not use, and by what program and under what licence
   the reading is done.

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
- The owner's choices of 24 November 2026, from the approved plan: pandoc
  is installed by `npm` and adds 56 MB to an install; Typst is read within
  the limit above and is not left for a later sprint; a figure kept as PDF
  or EPS takes the image mark, since a browser shows neither as a picture;
  live reload stays off for a paper, as for any document.
- Pandoc is asked for the document as a tree, and Tome writes the Markdown
  itself, because pandoc's own Markdown puts a set-apart formula inside its
  paragraph. A LaTeX paper is read twice: once to learn what pandoc skips,
  once from a copy held in memory in which each skipped piece is a word
  Tome knows. The setting that would hand such pieces back (`raw_tex`) also
  hands back references, labels and the second file unread.
- A section, table or figure is numbered only by a reference to it: Tome
  shows the number pandoc gives the reference and works out none of its
  own. A Typst reference shows the heading's words, or "the table", "the
  figure", "the equation", because pandoc numbers nothing in a Typst paper.
- A reference to an equation shows its number in brackets, once. This also
  works in a Markdown chapter (`[](#eq:gauss)`), which
  [INT-0030](INT-0030-mathematics-and-code.md) had left out.
- Not read: a TikZ drawing or any other picture drawn by commands, a
  command from a package pandoc does not know, a bibliography in Typst's
  own format (Hayagriva), and what a paper's class or packages do to its
  look.
- Limits found in the first review of Sprint 26's plan, each tried and
  left as it is:
  - A number in a reference is pandoc's and may differ from the PDF's:
    pandoc counts each subfigure, and numbers a section after `\appendix`
    where LaTeX letters it.
  - `\cref` and `\autoref` show the bare number, without the word LaTeX
    would put before it; a reference that names several labels at once is
    shown as written and counted.
  - A reference to a labelled item of a list shows the label and leads to
    the item; Tome numbers nothing itself.
  - A caption inside an environment pandoc does not know (`algorithm`) is
    dropped by pandoc with no notice, so Tome cannot name it.
  - An author's affiliation, keywords and the like, set by commands before
    the text begins, are not shown; each is named in the build's report.
  - The day a library is built is never written: `\today` is treated as a
    command that is not read.
  - A bare command pandoc does not know is named in the report and takes no
    mark, though a few print a word or a sign (`\etal`, `\checkmark`).
  - A `.bbl` file is not read, so a paper kept without its `.bib` shows its
    citations as keys.
  - A table inside `\resizebox` takes the mark and loses its caption, which
    pandoc drops with no notice.
  - A Typst paper's authors are shown as the paper sets them in its text;
    what `#set document(author: …)` holds is not written, since Typst does
    not print it.
- Limits found in the first review of Sprint 26's tests, each tried and
  left as it is:
  - A caption inside `wrapfigure` or `sidewaystable` is dropped by pandoc
    with no notice. (`table*` is read as a table, with its caption.)
  - In a Typst paper the words after a citation (`@gauss[p.~5]`) are
    dropped by pandoc.
  - A Typst paper whose bibliography is a Hayagriva `.yml` shows its
    citations as keys, each counted.
  - Authors set with a class's own commands (`\IEEEauthorblockN`) are not
    shown under the title; the commands are named in the report.
  - A second `thebibliography` in one paper is not read as a list; a rule
    of `booktabs` with a range (`\cmidrule{2-3}`) leaves the range in a
    cell; `multicols` leaves its number in the text.
  - A cell that spans columns or rows keeps its place, and the cells it
    covers are written empty, since a Markdown table has no spanning cell.
  - A paper whose files pull each other in without end is refused, as
    LaTeX cannot set it either. A file named only in code the paper shows
    names nothing. A cycle made through a command of the paper's own
    (`\newcommand{\chap}[1]{\input{#1}}`) or a Typst variable is not seen, and
    pandoc does not finish reading such a paper: the build does not end.
    Bounding a reading's time needs pandoc run apart from the build (a
    worker), which this sprint does not do.
  - Which text of a file is code is read by pattern, not by a parser: in a
    Typst file a line of prose that begins `include "…"` or `import "…"` is
    taken for code that names that file. A file pandoc asks for again,
    because its name stood where Tome took the text for code, is named
    wherever it stands; if pandoc asks for it after that, the report names
    it as not read.
    Raw text in a Typst file is read within one line, so raw text that runs
    over a line end and names a file is taken for a name; a file included
    from a variable (`#for c in ("a.typ",) { include c }`) is read in the
    paper and is also a chapter of its own; and in an uncommon shape a
    file's stand-in name can reach code the paper shows.
  - A BibTeX key with a colon (`@knuth:1984`) in a Typst paper is read by
    pandoc as the key `knuth` and the text `:1984`; the report names
    `knuth` as a citation with no entry. `#cite(<knuth:1984>)` works.
- Which commands are layout, and so passed over, is a list in Tome
  (`scripts/pandoc-to-markdown.mjs`). A command missing from it is never
  lost without a word: with an argument it is marked, bare it is named in
  the report. The list will grow as papers show need.
- No paper written by anyone but the sprint's author has been tried. The
  owner was asked for one of their own twice and none has been given;
  fetching one from elsewhere needs the owner's leave.

## Transition history
- 2026-11-23: created as `proposed` in Sprint 25's Research, split from
  INT-0030.
- 2026-11-24: revised in Sprint 26's Research, still `proposed`. The owner
  chose this intent for the sprint ("LaTeX and Typst"). Alternatives now
  say what each reader did with a paper, and Consequences gained pandoc's
  licence, papers of several files, and the limit on Typst documents.
- 2026-11-24: `proposed` to `planned` in Sprint 26's Plan phase. The owner
  approved the sprint's plan; the acceptance criteria are settled as seven,
  and Consequences record the choices made in it and what is not read.
- 2026-11-24: revised in Sprint 26's Plan phase, still `planned`, to answer
  the first review of the plans. Criteria 1, 5 and 6 are worded more
  closely (a Typst file that is imported, which skipped pieces are marked,
  pictures); Consequences gained the limits the review found and the note
  that no paper of another's has been tried. The work is nine tasks.
- 2026-11-24: revised again in Sprint 26's Plan phase, still `planned`, to
  answer the second review of the plans. Criterion 1 names `books:add`
  alone, as INT-0029 does; criterion 5 says a layout command is passed over
  only when it holds nothing of the paper's; Consequences gained four more
  limits.
- 2026-11-24: `planned` to `active` in Sprint 26's Build phase, as T-086
  began. The plans were locked after a second review returned
  proceed-with-caveats and its concerns were answered in them.
- 2026-11-24: revised in Sprint 26's Test phase, still `active`, to record
  the limits the first review of the tests found and left as they are.
- 2026-11-24: revised again in Sprint 26's Test phase, still `active`: two
  more limits from the second review of the tests.
- 2026-11-24: revised again in Sprint 26's Test phase, still `active`: what
  the third review of the tests found about reading code by pattern.
- 2026-11-24: revised again in Sprint 26's Test phase, still `active`: what
  the fourth review of the tests found about reading code by pattern.
