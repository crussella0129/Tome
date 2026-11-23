# Find Your Books

Tome reads mdBooks. A folder is a book when it has a `SUMMARY.md` at its root,
in `src/`, in `docs/`, or wherever its `book.toml` `[book].src` points. If you
have used mdBook, read Rust's documentation offline, or run Sprint Loops (every
project's `docs/` is a Book), you probably have dozens already.

## Let Tome look

From the Tome folder:

```bash
npm run books:find
```

This scans your home folder five levels deep and lists every folder Tome's own
loader would accept, using the same rules it uses to load books:

```text
Found 4 books under /home/you (depth 5):

  #  CHAPTERS  LAYOUT       TITLE                 PATH
  1        39  docs/ ⟐      CubiKan               /home/you/CubiKan
  2        67  book.toml    The Holy Bible        /home/you/mdbible
  3       120  src/         The Rust Programming  /home/you/rust-book
  4         3  root         Obsidian Tablets      /home/you/dnd/tablets

  ⟐ = a Sprint Loops Project Book

Add one to your library:  npm run books:add -- "<path>"
```

- **CHAPTERS** counts linked chapters. Unwritten (draft) entries are not counted.
- **LAYOUT** shows where the chapters live: `src/`, `docs/`, the book's `root`,
  or a folder named in `book.toml`.
- A book's own `src/` or `docs/` folder is never listed as a second book.
  Several `book.toml` editions inside one checkout are listed separately.

Point it somewhere specific, or look deeper:

```bash
npm run books:find -- ~/Documents/dnd ../notes
npm run books:find -- --depth 8
```

> [!NOTE]
> The scan skips symlinks, hidden (dot) folders, version control,
> `node_modules`, build output, system folders, and cloud-sync roots such as
> OneDrive, iCloud, and Dropbox, because those are slow and may download files.
> To search one of them, name it:
> `npm run books:find -- "$HOME/OneDrive/Campaigns"`.

## Look yourself

Any search for `book.toml` or `SUMMARY.md` works. A hit at
`.../docs/SUMMARY.md` or `.../src/SUMMARY.md` means the book is the folder
*above* `docs/` or `src/`.

PowerShell (Windows):

```powershell
Get-ChildItem -Path $HOME -Recurse -Depth 5 -File -Include book.toml, SUMMARY.md -ErrorAction SilentlyContinue |
  Where-Object FullName -notmatch '\\(node_modules|\.git)\\' |
  Select-Object -ExpandProperty FullName
```

bash or zsh (macOS, Linux, WSL):

```bash
find ~ -maxdepth 5 \( -name node_modules -o -name .git \) -prune -o \
  \( -name book.toml -o -name SUMMARY.md \) -print
```

## Add a book to your library

```bash
npm run books:add -- ../my-campaign
npm run books:add -- "C:\Users\you\Documents\Tablets" --title "The Obsidian Tablets" --slug tablets
```

`books:add` checks that the folder loads, refuses duplicates, and appends the
book to **`tome.local.toml`**. That is your personal manifest. Git ignores it,
so your library never shows up as a change in the Tome checkout. You can edit it
by hand:

```toml
owner = "The Gamemaster"     # the Bibliotheca masthead: "The Bibliotheca of …"

[[book]]
path = "../my-campaign"      # absolute, or relative to this file
title = "The Obsidian Tablets"
slug = "tablets"             # the URL segment: /tablets/…
```

Then run `npm run dev` and open <http://localhost:4321>. With one book, its
chapters sit at the root. With several, `/` is the Bibliotheca and each book
lives under `/<slug>/`. To remove a book, delete its `[[book]]` entry.

Where Tome looks, highest priority first:

1. `TOME_BOOKS="/a,/b"` or `TOME_BOOK="/a"` in the environment.
2. `TOME_CONFIG=<file>`, when set.
3. `tome.local.toml`, when it exists.
4. `tome.config.toml`, the tracked template, which is empty by default.
5. Otherwise, this sample library.

Books are copied into `src/content/library/`, which is generated and
git-ignored. The copy leaves out `.git`, `node_modules`, `target/`, and
mdBook's own rendered `book/` output. The sample in `src/content/books/` is
never touched.

## Add a document

Tome also reads what is not an mdBook: a Markdown file, a Word document, or a
folder of them. No `SUMMARY.md` is needed, and your files are only read, never
changed.

```bash
npm run books:add -- ~/notes/ideas.md
npm run books:add -- "C:\Users\you\Documents\Thesis draft.docx"
npm run books:add -- ~/notes
```

The same paths work in `tome.local.toml`:

```toml
[[book]]
path = "../papers/thesis-draft.docx"
title = "Thesis Draft"
```

A single file becomes a tome of one chapter. A folder becomes a tome with one
chapter per `.md` and `.docx` file, at any depth:

- The folder's own documents come first, by name, with numbers counted as
  numbers: `2-notes.md` sorts before `10-notes.md`.
- Each subfolder becomes a part of the sidebar, named for the subfolder.
- A `README.md` (or `index.md`) in the folder opens the tome. Without one, the
  first document does.
- Dot-folders, `.git`, `node_modules`, `target`, `dist`, `vendor` and `venv`
  are skipped, and so is any subfolder that is itself an mdBook.

**Google Docs.** In the document, choose File → Download → Microsoft Word
(.docx), then add the downloaded file.

### What carries over from Word

Headings, bold, italic, strikethrough, superscript and subscript, lists, links
to web and mail addresses, tables, footnotes and endnotes, block quotations
(Word's Quote styles), and pictures (PNG, JPEG, GIF, WebP). The document's
Title heads the page, and its headings become the page's sections. A list or
several paragraphs inside a table cell stay in the cell, one to a line. An
equation is carried over and laid out as mathematics, as
[Write Mathematics](write-mathematics.md) describes.

Some things are not shown yet. Where one stood, the page says so:

| In the document | On the page |
|---|---|
| An equation Tome cannot convert (one inside a tracked change, for example) | `[equation not shown]` |
| A chart or a SmartArt diagram | `[figure not shown]` |
| A picture of another kind (EMF, TIFF, HEIC), or one a note points to that is missing | `[image not shown]` |
| A Word file in a folder that cannot be opened | a chapter that reads `[document not shown]` |
| A cross-reference or a table of contents entry | its words, without the link |

The build prints a line for each document that left something out, for example
`left out 1 equation`. Page headers and footers, comments, colours, fonts and
underlining are not carried over and are not reported.

### What to know about Markdown notes

- A settings block at the top of a note (front matter between `---` lines) is
  left out of the page. Its `title` names the chapter when the note has no
  `#` heading.
- A link from one note to another file, such as `[see](other-note.md)`, does
  not lead to that note's chapter yet.
- A picture written as HTML (`<img src="…">`) is not copied; write it as
  `![alt](picture.png)`.

`npm run dev` shows a document, but a change to it appears only after a
restart. Live editing covers mdBook folders.

## For agents

A recipe a coding agent can follow without guessing:

1. **Discover:** `npm run books:find -- --json` (add folders or `--depth` as
   needed). The output is one JSON document:

   ```json
   {
     "version": 1,
     "roots": ["/home/you"],
     "depth": 5,
     "books": [
       {
         "path": "/home/you/dnd/tablets",
         "sourceDir": "/home/you/dnd/tablets",
         "title": "Obsidian Tablets",
         "chapters": 3,
         "layout": "root",
         "sprintBook": false
       }
     ],
     "skipped": [{ "path": "/home/you/broken", "reason": "book.toml declares src=…" }]
   }
   ```

2. **Choose** by `title` or `path` with the user. Never pick from `skipped`.
3. **Add:** `npm run books:add -- "<path>"`. A non-zero exit means the folder
   will not load; stderr says why.
4. **Build:** `npm run build`. Exit 0 means every listed book rendered.
   Then confirm `dist/index.html` exists, plus `dist/<slug>/index.html` when
   there are several books.
5. **Hand off:** `npm run dev` (or `npm run preview -- --host` for a tablet; see
   *Take It to the Table*).

Agent rules: put personal books in `tome.local.toml`, never in
`tome.config.toml`. Never commit `tome.local.toml` or `src/content/library/`.
Ask before scanning cloud-sync folders.
