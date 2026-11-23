# INT-0026 — Tome as a document editor

<!-- sprint-loop-intent-v2 -->
- **Intent ID:** INT-0026
- **State:** proposed
- **Work evidence:** none
- **Completion evidence:** none
- **Code evidence:** none
- **Test evidence:** none
- **Documentation evidence:** none

## Intent

Tome becomes a place to write as well as to read. Today it is a reader of
mdBooks. The owner, on 21 November 2026, while planning Cruor's accented
letters and mathematical symbols "so I can write papers in it": "This may also
lead us to turn tome into a .md editor that also takes word doc/ docs docs in
addition to being just a .md book reader."

So Tome edits Markdown, and it opens and saves the documents people write
papers in: Word (`.docx`) and Google Docs. What is written is set in Cruor,
the owner's typeface, including its mathematical symbols.

What this is for, in the owner's words of 23 November 2026: "I want Tome to
be a timeless place for someone to store the compartments of their mind,
digitally."

The owner set the order the same day: "editing Tome to accept Word Docs
Markdown to start, LaTeX/Typst once we have that down (perhaps in the next
sprint as you said)." So the work comes in three steps, each its own intent:

1. Reading a Markdown file or a Word document as a tome:
   [INT-0029](INT-0029-documents-as-tomes.md).
2. Mathematics, and documents written in LaTeX and Typst:
   [INT-0030](INT-0030-mathematics-and-code.md).
3. Editing and saving, which is what remains here.

## Acceptance criteria

To be settled when a sprint plans it. The owner's words set the outline:

1. Tome opens a Markdown file, lets it be edited, and saves it, alongside
   reading mdBooks as now.
2. Tome opens a Word document (`.docx`) and a Google Docs document, shows it
   in its themes, and saves edits back in a form the owner can return to
   Word or Docs.
3. Writing a paper works: headings, body text, and mathematical symbols typed
   as Unicode text (the symbols Cruor draws from Sprint 5 of the Cruor
   project). Equations laid out by an engine, as LaTeX or Typst set them,
   wait on Cruor's OpenType MATH table, which the owner placed after
   Cruor's Sprint 5.

Showing a Word document (the first half of criterion 2) is INT-0029, and
laying out equations is INT-0030. What stays here is editing, and saving in
a form Word or Docs can take back.

## Rationale

The owner writes papers and wants to write them in Cruor, in the reader Tome
already is. Cruor's Sprint 5 adds the accented letters, Greek for
mathematics, and the Mathematical Operators block; Tome's editor is where
those are used.

## Alternatives

- Keep Tome a reader and write elsewhere. The owner asked for the editor.
- Markdown alone. The owner named Word and Docs as well.

## Consequences

- Google Docs needs an account and its API; how Tome reaches it (export and
  import of files, or a live connection) is a choice for the sprint that
  plans it.
- This moves in tandem with Cruor: the symbols Tome can show are the symbols
  Cruor draws ([INT-0027](INT-0027-cruor-typefaces.md)).
- An editor must write to the owner's disk while the reader is open. Tome
  is a static site built ahead of time, and its desktop shells give the page
  no access to files (Sprint 24's research). So the editor lives in the
  desktop app and needs a narrow, named way to read and write a document;
  the browser build stays a reader.

## Transition history
- 2026-11-21: created as `proposed` from the owner's words in the Cruor
  project's Sprint 5 Research ("make sure to add all of that to Tome
  specifically as this will all move in tandem").
- 2026-11-23: revised in Sprint 24's Research, still `proposed`. Added the
  owner's statement of purpose and order of work, and split reading
  (INT-0029) and mathematics (INT-0030) into intents of their own.
