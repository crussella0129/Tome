# Tome

An [mdBook](https://github.com/rust-lang/mdBook) viewer that renders a book's
source through the [sacred computer](https://github.com/internet-development/www-sacred)
component vocabulary (from Internet Development Studio), re-skinned into an
**ink-on-old-paper** aesthetic and set in Mekzantine.

Built with Astro + SolidJS + TypeScript + Tailwind v4 — zero JavaScript by
default, with only the table-of-contents sidebar hydrated as an island.

## Develop

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # static site in dist/
npm test         # unit + integration (Vitest)
npm run test:e2e # end-to-end (Playwright)
```

## View a book

By default Tome renders the bundled sample book under `src/content/book/`.

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

> Note: loading an external book overwrites `src/content/book/` at build time
> (a deploy-time action). Leave `TOME_BOOK` unset for normal development so the
> sample stays pristine.

### Live reload

During `npm run dev` with `TOME_BOOK` set, Tome watches the book's source and
re-syncs changed files into the reader — **edit a chapter on disk and the reader
updates with no restart**:

```bash
TOME_BOOK=/path/to/CubiKan npm run dev   # then edit CubiKan/docs/*.md live
```

This is a dev-only Astro integration (`astro:server:setup`); it has no effect on
`npm run build`.
