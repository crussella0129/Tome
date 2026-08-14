# Tome

An [mdBook](https://github.com/rust-lang/mdBook) viewer that renders a book's
source through the [sacred computer](https://github.com/internet-development/www-sacred)
component vocabulary (from Internet Development Studio), re-skinned into an
**ink-on-old-paper** aesthetic and set in Mekzantine.

Built with Astro + SolidJS + TypeScript + Tailwind v4 — zero JavaScript by
default, with only the table-of-contents sidebar and the search overlay hydrated
as islands.

## Develop

```bash
npm install
npm run dev            # http://localhost:4321
npm run build          # static site in dist/
npm test               # unit + integration (Vitest)
npm run test:e2e       # end-to-end (Playwright)
npm run check:external # external single-book build gate
npm run check:multibook # two-tome Bibliotheca build gate
npm run check:search   # search index + query build gate
```

## View a book

By default Tome renders the bundled sample book under `src/content/books/tome/`.

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
