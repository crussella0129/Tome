# Tome

An [mdBook](https://github.com/rust-lang/mdBook) viewer that renders a book's
source through the [sacred computer](https://github.com/internet-development/www-sacred)
component vocabulary (from Internet Development Studio), re-skinned into an
**ink-on-old-paper** aesthetic and set in Mekzantine.

Built with Astro + SolidJS + TypeScript + Tailwind v4 — zero JavaScript by
default, with only a few small islands hydrated (the table-of-contents sidebar,
the search overlay, and the in-chapter navigation aids).

## Develop

```bash
npm install
npm run dev            # http://localhost:4321
npm run build          # static site in dist/
npm run electron       # build, then open the desktop app
npm test               # unit + integration (Vitest)
npm run test:e2e       # end-to-end (Playwright)
npm run check:external # external single-book build gate
npm run check:multibook # two-tome Bibliotheca build gate
npm run check:search   # search index + query build gate
npm run check:electron # desktop-shell end-to-end gate (Playwright + Electron)
```

## View a book

By default Tome renders a bundled sample **library** of two tomes — *Tome* (the
guide you're reading) and *Marginalia* (a short companion) — under
`src/content/books/`. Because there are two, the site opens on the **Bibliotheca**
(the library shelf); pick a tome to start reading, and use the sidebar switcher to
cross between them. A single tome (see below) opens straight into the reader.

To view **any** mdBook, point `TOME_BOOK` at its root directory (the folder that
contains `book.toml` and a `src/SUMMARY.md`) — a prebuild step copies that book
into the reader:

```bash
TOME_BOOK=/path/to/your/mdbook npm run build
# or, live:
TOME_BOOK=/path/to/your/mdbook npm run dev
```

The book's chapters, nesting, prefix/suffix, drafts, and separators come from
`SUMMARY.md`. When `TOME_BOOK` is unset, the committed sample renders unchanged.

### Books without a `book.toml`

`book.toml` is **optional**. If it declares `[book].src`, that source is used
(and must contain `SUMMARY.md`). Otherwise Tome auto-detects the source by looking
for `SUMMARY.md` in this order:

1. `src/` (the mdBook default)
2. `docs/` (common for docs-first repos)
3. the root itself

So a config-less book whose source lives in `docs/` — for example a Sprint-Loops
Project Book — loads directly:

```bash
TOME_BOOK=/path/to/CubiKan npm run dev   # detects docs/, no book.toml needed
```

The title is taken from `book.toml` (`[book].title`) when present, otherwise the
**book root's directory name** (e.g. `CubiKan`), otherwise the `SUMMARY.md`
heading. If no `SUMMARY.md` is found in any candidate location, the build stops
with a clear error listing the paths it tried.

> Note: loading external books overwrites the content library
> `src/content/books/` at build time (a deploy-time action). Leave `TOME_BOOK` /
> `TOME_BOOKS` unset for normal development so the sample stays pristine.

### Live reload

During `npm run dev` with `TOME_BOOK` set, Tome watches the book's source and
re-syncs changed files into the reader — **edit a chapter on disk and the reader
updates with no restart**:

```bash
TOME_BOOK=/path/to/CubiKan npm run dev   # then edit CubiKan/docs/*.md live
```

This is a dev-only Astro integration (`astro:server:setup`); it has no effect on
`npm run build`.

## The Bibliotheca — a library of books

Tome can present **several books** at once. Point `TOME_BOOKS` at multiple book
roots (comma-separated), or list them in a committed `tome.config.toml`:

```bash
TOME_BOOKS=/path/to/rust-book,/path/to/CubiKan npm run build
```

```toml
# tome.config.toml
owner = "Ada"          # masthead reads "The Bibliotheca of Ada" (defaults to your OS user)

[[book]]
path = "../rust-book"

[[book]]
path  = "../CubiKan"
title = "CubiKan"      # optional — overrides the detected title
slug  = "cubikan"      # optional — the URL segment (defaults to the directory name)
```

**Routing is adaptive:**

- **One book** → its chapters sit at the root (`/`, `/getting-started`, …). A
  single book is the whole site, exactly as before.
- **Several books** → each is namespaced under its slug (`/rust-book/…`,
  `/cubikan/…`), `/` becomes the **Bibliotheca** (a library index listing every
  tome), and the sidebar gains a book switcher for jumping between them.

Precedence is `TOME_BOOKS` / `TOME_BOOK` (env) → `tome.config.toml` → the bundled
sample. Colliding slugs are de-duplicated (`guide`, `guide-2`). The Bibliotheca
masthead reads *“The Bibliotheca of &lt;owner&gt;”*, where `owner` defaults to your
OS login name — override it with the `owner` key or the `TOME_OWNER` env var.

The `check:multibook` gate builds a two-tome library from the fixtures and
asserts the namespaced routes, the Bibliotheca index, and the sidebar switcher.

## Search

Every page has a library-wide search. Press **`/`** (or click the search field)
to open a keyboard-first overlay: type to rank results across every tome —
titles and headings above body text — and open one to jump straight to that
chapter, deep-linking to the matching heading.

Search is built from a static index emitted at build time
(`dist/search-index.json`) covering each chapter's title, headings, and text. The
reader fetches it lazily on first open, so a page ships no search data until you
ask for it — the overlay is the only search JavaScript, hydrated when idle. In a
multi-tome library, results link to `/<tome>/<chapter>`; with a single tome, to
`/<chapter>`.

The `check:search` gate builds the site (single- and multi-tome) and asserts the
index is emitted with the right coverage and adaptive URLs, and that a real query
resolves to the expected chapter.

## Reading a chapter

Two in-chapter navigation aids appear while reading:

- **On this page** — on wide viewports, a rail beside the chapter lists its
  section headings (H2/H3) as links. It is server-rendered (the links work with
  no JavaScript) and, once hydrated, highlights the section you're currently
  scrolled to.
- **Keyboard chapter navigation** — press **`→`** or **`j`** for the next
  chapter, **`←`** or **`k`** for the previous one. The shortcuts stand down while
  you're typing in a field or the search overlay is open.

## Content rendering

Beyond standard Markdown, Tome renders:

- **Admonitions / callouts** — GitHub-style alerts. Start a blockquote with
  `> [!NOTE]` (or `TIP`, `IMPORTANT`, `WARNING`, `CAUTION`) and it becomes a titled,
  sacred-styled panel. Rendered at build time by a small remark plugin — no client JS.

  ```markdown
  > [!WARNING]
  > A book without a SUMMARY.md cannot be read.
  ```

- **Footnotes** — standard GFM footnotes (`text[^1]` … `[^1]: note`) render with a
  reference → note → back-reference chain, styled as a quiet apparatus at the foot of
  the chapter. (The auto "Footnotes" heading is kept out of the "on this page" rail.)

- **Print / PDF** — a print stylesheet hides the sidebar, the on-this-page rail, the
  search field, and the pager, so the browser's **Print / Save as PDF** yields a clean
  ink-on-white chapter.

## Desktop app

Tome ships a native **Electron** desktop shell that renders the built library
entirely **offline** — the Bibliotheca, the reader, search, and in-page navigation
all work with no dev server and no network.

```bash
npm run electron        # runs `astro build`, then opens the app
npm run electron:start  # opens the app against an existing dist/ (no rebuild)
```

The window loads `dist/` through a custom `app://tome/` protocol that maps
root-absolute URLs (routes, `/_astro/…`, `/fonts/…`, `/search-index.json`) onto the
built output. It is configured securely — context isolation on, Node integration
off, sandbox on — and the protocol serves only files resolved **inside** `dist/`.
Internal links stay in the window; external `http`/`https` links open in your OS
default browser. The main process is a single small file under `electron/`.

Zoom is handled so it can't break the layout: an accidental trackpad pinch or
Ctrl-wheel gesture is neutralized (it would otherwise shrink the viewport past a
responsive breakpoint and collapse the reader into the mobile drawer), while
deliberate keyboard zoom — including the native **Ctrl+0** reset — still works.

The app icon is a "T" in the reader's display font, and it **follows your system
theme** — the near-black tile in dark mode, the ink-on-parchment tile in light mode —
swapping live if you change the OS theme. Force one with `TOME_ICON`:

```bash
TOME_ICON=dark npm run electron:start   # or: light | auto (default = follow system)
```

The two icon variants are generated from the font by `node scripts/make-icon.mjs`
into `electron/assets/` (a multi-size `.ico` for Windows, a `.png` for Linux).

To package a **specific** book into the app, build it in first, then launch:

```bash
TOME_BOOK=/path/to/your/mdbook npm run electron
```

`npm run check:electron` proves the shell end to end (a chapter renders offline and
the search index is reachable) with Playwright driving a real Electron window.

> [!NOTE]
> This is the desktop shell itself. Opening an arbitrary local library from within
> the app (rebuilding against a chosen folder) and producing signed installers are
> planned follow-ups.
