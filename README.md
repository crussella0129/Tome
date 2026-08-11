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

The book's title comes from `book.toml` (`[book].title`); its chapters, nesting,
prefix/suffix, drafts, and separators come from `src/SUMMARY.md`. If `TOME_BOOK`
points at a directory without `<src>/SUMMARY.md`, the build stops with a clear
error. When `TOME_BOOK` is unset, the committed sample renders unchanged.

> Note: loading an external book overwrites `src/content/book/` at build time
> (a deploy-time action). Leave `TOME_BOOK` unset for normal development so the
> sample stays pristine.
