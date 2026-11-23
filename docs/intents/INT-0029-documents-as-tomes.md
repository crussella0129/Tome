# INT-0029 — Markdown files and Word documents as tomes

<!-- sprint-loop-intent-v2 -->
- **Intent ID:** INT-0029
- **State:** proposed
- **Work evidence:** none
- **Completion evidence:** none
- **Code evidence:** none
- **Test evidence:** none
- **Documentation evidence:** none

## Intent

Tome reads a Markdown file and a Word document (`.docx`) as it reads an
mdBook. Today every tome must be a folder with a `SUMMARY.md`; a single
document, or a folder of loose documents, is refused. The owner, on
23 November 2026: "editing Tome to accept Word Docs Markdown to start,
LaTeX/Typst once we have that down (perhaps in the next sprint as you said)."

A library entry may name:

- one Markdown file;
- one Word document; or
- a folder of Markdown files and Word documents that has no `SUMMARY.md`.

Each becomes a tome. Its chapters are read, navigated and searched like any
other tome's, in every theme and in the browser, Electron and Tauri builds.

This is the reading half of [INT-0026](INT-0026-document-editor.md), and it
comes first. Boundaries:

- **Reading only.** Editing a document and saving it back is INT-0026.
- **Google Docs** reaches Tome as the `.docx` file Google Docs downloads. A
  connection to a Google account is INT-0026.
- **Equations** in a Word document, and documents written in LaTeX or Typst,
  are [INT-0030](INT-0030-mathematics-and-code.md).
- The older `.doc` format is not read.
- mdBook folders load exactly as they do now.

## Acceptance criteria

To be made final by the sprint's plan.

1. A manifest `[[book]]` path, a `TOME_BOOK` or `TOME_BOOKS` entry, and
   `npm run books:add` each accept a `.md` file, a `.docx` file, or a folder
   of such files with no `SUMMARY.md`. Each becomes a tome with a title, a
   slug and a spine, and appears in the Bibliotheca, the sidebar and search.
   A path that is none of these, or an empty folder, fails with a message
   that names the path and what Tome accepts.
2. A single document is a tome of one chapter, and the "on this page" rail
   lists its sections. A folder of documents is a tome with one chapter per
   document, in a stated and stable order. A tome's title is the document's
   own title, else its file or folder name; a `title` in the manifest wins.
3. From a Word document the reader shows headings, paragraphs, bold, italic,
   strikethrough, superscript and subscript, lists, links, tables, footnotes
   and images. Footnotes work as Tome's footnotes do
   ([INT-0011](INT-0011-richer-content-rendering.md)): reference, note, and
   the way back. A table has a header row. Images are served from files
   staged with the tome.
4. Nothing is left out silently. Where a Word document holds something Tome
   does not carry over (an equation, until INT-0030), the load names the
   document and what was left out.
5. A link in a Word document whose target is not a web address, a mail
   address or a place in the same document is shown as plain text.
6. The source documents are never changed, and nothing is written beside
   them.
7. Loading an mdBook folder is unchanged: the existing unit tests, end-to-end
   tests and build gates pass as they are.
8. Tests cover each kind of entry, the Word features of criterion 3, the
   report of criterion 4 and the links of criterion 5, on a Word fixture
   kept in the repository. A chapter of the bundled Tome book tells a person
   how to add a document.

## Rationale

What the owner writes and is sent is not all mdBooks: it is notes in single
Markdown files and papers in Word. Tome cannot be "a timeless place for
someone to store the compartments of their mind, digitally" (the owner,
23 November 2026) while it turns those away.

Reading comes before editing because an editor needs a program that can
write to the owner's disk while the reader is open, and Tome today is a
static site built ahead of time. Reading needs none of that: a document is
turned into Markdown when the library is built, and from there every part
of Tome already works.

## Alternatives

- **Require a `SUMMARY.md` beside every document.** That is the present
  state, and it is why loose documents cannot be read.
- **Show a Word document's HTML directly, without making Markdown of it.**
  Search, the "on this page" rail and footnotes all read Markdown, so each
  would need a second path. Markdown is also the form an editor will change
  (INT-0026).
- **Convert with pandoc.** It reads Word well, but it is a separate program
  every person and the CI would have to install. A library installed with
  Tome's other packages needs nothing more.

## Consequences

- Tome takes on a Word reader as a dependency. The one tried in Sprint 24's
  research does not clean what it reads, so criterion 5 is Tome's to hold.
- Equations in Word documents are reported and not shown until INT-0030.
- How a document or a loose folder is found and added from inside the app is
  [INT-0031](INT-0031-files-simple-to-find.md) and
  [INT-0020](INT-0020-native-library-folder-management.md).

## Transition history
- 2026-11-23: created as `proposed` in Sprint 24's Research, from the owner's
  words opening the sprint.
