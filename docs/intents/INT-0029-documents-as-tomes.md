# INT-0029 — Markdown files and Word documents as tomes

<!-- sprint-loop-intent-v2 -->
- **Intent ID:** INT-0029
- **State:** planned
- **Work evidence:** [Sprint 24 build plan (T-065–T-074)](../sprints/s24/sprint-plans/build-plan.md)
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

1. A manifest `[[book]]` path, a `TOME_BOOK` or `TOME_BOOKS` entry, and
   `npm run books:add` each accept a `.md` file, a `.docx` file, or a folder
   of such files with no `SUMMARY.md`. Each becomes a tome with a title, a
   slug and a spine, and appears in the Bibliotheca, the sidebar and search.
   A path that is none of these, or a folder with no documents, fails with
   a message that names the path and what Tome accepts.
2. A single document is a tome of one chapter. A folder of documents is a
   tome with one chapter per document, read to any depth. Documents
   directly in the folder come first, then each subfolder as a named part
   of the spine; within each, the order is by name, with numbers in numeric
   order, and a `README.md` or `index.md` in the folder itself is the
   tome's opening page. A tome's title is a single document's own title,
   else its file name, and a folder's name; a `title` in the manifest wins.
   A tome's own address (`/` in a library of one, `/<slug>` in a library of
   several) opens its opening page, or its first chapter when it has none.
3. From a Word document the reader shows headings, paragraphs, bold, italic,
   strikethrough, superscript and subscript, lists, links, tables, footnotes
   and images. Each chapter has one top heading. Where the document has a
   Title, that is the top heading, Heading 1 and 2 become the sections the
   "on this page" rail lists, and Heading 3 sits below them. Where it has no
   Title, its one Heading 1 is the top heading; with none or several, the
   file's name is. Footnotes work as Tome's footnotes do
   ([INT-0011](INT-0011-richer-content-rendering.md)): reference, note, and
   the way back. A table has a header row. Images of a kind a browser shows
   (PNG, JPEG, GIF, WebP) are served from files staged with the tome.
4. What carries meaning is not left out in silence. Each of these is marked
   in the chapter where it stood, and the load names the document and what
   was left out:
   - an equation (until INT-0030);
   - a chart or a diagram in a Word document;
   - an image that cannot be shown: a Word image of another kind, or an
     image a Markdown document points to that is missing, lies outside its
     folder, or is of a kind the build cannot read;
   - a Word document in a folder that cannot be opened, whose chapter says
     so in place of its text.

   Anything else the Word reader says it did not recognise is named by the
   load. Layout and decoration are not carried over and not reported: page
   headers and footers, comments, colours, fonts and underlining.
5. A link in a Word document whose target is not a web address or a mail
   address is shown as plain text.
6. The source documents are never changed, and nothing is written beside
   them.
7. Loading an mdBook folder is unchanged: the existing unit tests, end-to-end
   tests and build gates pass as they are. The one exception is the two
   tests that assert a folder holding only loose Markdown is refused
   (`test_source_none_errors` and `test_books_add_rejects_invalid`): such a
   folder now loads, so they assert the refusal of a folder with no
   documents.
8. Tests cover each kind of entry, the Word features of criterion 3, the
   marks and reports of criterion 4 and the links of criterion 5, on a Word
   fixture kept in the repository. A chapter of the bundled Tome book tells a
   person how to add a document.

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
- **Copy a folder of documents whole, as an mdBook's source is copied.**
  Folder and file names with spaces or brackets then become routes and
  break the spine's links. Staging each document under a safe name, with
  only the images it points to, avoids that and keeps a notes folder's
  other files out of the library.
- **Refuse the library when a note's image is missing, or when one Word
  document in a folder cannot be opened.** The first is what an mdBook's
  image outside its source does today. A folder of notes often holds a
  broken image or a half-copied file, and one should not stop the rest
  from being read; each is marked and reported instead (criterion 4). An
  entry that names one document directly is different: if that document
  cannot be opened there is nothing to read, so the load fails and
  `books:add` refuses it.

## Consequences

- Tome takes on a Word reader as a dependency. The one tried in Sprint 24's
  research does not clean what it reads, so criterion 5 is Tome's to hold.
- Equations in Word documents are marked and reported, and not shown,
  until INT-0030.
- Cross-references and a table of contents inside a Word document are
  shown as plain text: the places they point to do not survive conversion.
- A Markdown document is shown as written. Its `##` and `###` headings are
  the sections the "on this page" rail lists, as in any chapter; a note
  that uses several `#` headings has none listed.
- A block of settings at the top of a Markdown document (YAML front
  matter) is left out of the staged copy, so it is not shown, searched or
  acted on. Its `title`, when it has one and the document has no top
  heading, names the chapter.
- An image a Markdown document includes as HTML (`<img>`) is not staged.
  The load names the document; the image does not show.
- A Markdown document's images are staged when they are PNG, JPEG, GIF,
  WebP, SVG or AVIF. A file with one of those names that is damaged is
  not caught by the load and stops the build, as it does in an mdBook.
- A link from one document to another (`[see](Other Note.md)`) leads
  nowhere: Tome does not turn a link to a file into a link to its chapter,
  for an mdBook or for a note. This matters more for a folder of notes
  that point at each other. It is left for the editor
  ([INT-0026](INT-0026-document-editor.md)), where notes are written and
  linked.
- A drawn shape in a Word document that holds no text is not carried over
  and not reported; the Word reader gives no sign of it. Charts and
  diagrams are found by Tome itself (criterion 4).
- Search no longer takes HTML tags for words. An mdBook chapter that holds
  HTML is searched by its words alone, where before `sup` or `div` could
  be found as if written in it. Nothing else about an mdBook's search
  changes.
- A folder is read to any depth, leaving out dot-folders, version control,
  dependency and build folders (`node_modules`, `target`, `dist`, `vendor`,
  `__pycache__`, `venv`, `site-packages`), and any subfolder that is itself
  an mdBook. There is no limit of depth or number.
- A folder that has a `book.toml` or a `SUMMARY.md` is always an mdBook.
  If it is a broken one, it fails as it does now and is not read as loose
  documents.
- A path with a comma in it cannot be given through `TOME_BOOKS`, which
  separates paths by commas. This was already so for mdBook folders; the
  manifest and `TOME_BOOK` take any path.
- In `npm run dev`, a change to a document is seen after a restart. Live
  reload ([INT-0009](INT-0009-live-reload-parent-assets.md)) stays a
  feature of mdBook folders until the editor (INT-0026) needs more.
- A tome with no opening page shows its first chapter at its own address.
  This holds for an mdBook too, where that address had no page before: `/`
  in a library of one, and in a library of several the page the sidebar's
  title links to. The Bibliotheca and the switcher open such a tome at its
  first chapter, as they already do.
- How a document or a loose folder is found and added from inside the app is
  [INT-0031](INT-0031-files-simple-to-find.md) and
  [INT-0020](INT-0020-native-library-folder-management.md).

## Transition history
- 2026-11-23: created as `proposed` in Sprint 24's Research, from the owner's
  words opening the sprint.
- 2026-11-23: `proposed` → `planned`. The owner approved Sprint 24's plan.
  The plan and its first review made the criteria final: a folder is read
  to any depth in a stated order, `/` opens a lone tome, each chapter has
  one top heading, what carries meaning and is left out is marked in the
  chapter, links within a document are shown as text, and two existing
  tests that asserted the refusal of loose Markdown change with it. The
  second review added: a tome's own address in a library of several, a
  document in a folder that cannot be opened, charts and diagrams, which
  kinds of image a note may hold, and what the rail lists.
