# Explorer findings (Sprint 22 research)

Observed on the user's active checkout while resuming Sprint 21. Personal paths
and the personal book's content are deliberately not recorded here.

## What adding one personal book did

1. **Tracked manifest edited.** The only documented persistent path is adding a
   `[[book]]` entry to the tracked `tome.config.toml`, so personal library state
   lives in a file every pull and commit sees.
2. **Committed sample deleted from the working tree.** `load-books.mjs` replaces
   `src/content/books/` wholesale. `git status` then shows all twelve sample
   files (`tome/`, `marginalia/`) as deleted and the personal book as untracked.
   A careless `git add -A` would delete the sample and commit the personal book.
3. **Fixture gates refuse in the active checkout.** INT-0021's guard correctly
   refuses dirty content, so every `check:*` gate (and the default Playwright
   build) must run in a disposable checkout while a personal library is loaded.
4. **`.git` copied into the library.** For a root-layout book (sources beside
   `book.toml`), the loader copies the whole root. The personal library copy
   was byte-identical to its source apart from `book.meta.json`, including the
   source repository's `.git/` (≈ 35 MB in total). mdBook's rendered `book/`
   output, `node_modules/`, or `target/` would be copied the same way.

## Discovery scan

A bounded scan of the home directory (depth 5, pruning `node_modules`, `.git`,
`target`, `AppData`, cloud-sync roots) for `book.toml` / `SUMMARY.md` found
about 50 hits in under 90 seconds:

- most are Sprint Loops Project Books (`docs/SUMMARY.md`, no `book.toml`),
  which Tome can already read;
- several are nested `book.toml` editions inside one checkout (distinct books
  that must each be listed);
- one is a root-layout book (the case that exposed finding 4);
- naive matching double-counts a book's `src/` or `docs/` source directory as a
  separate root, so discovery must collapse a detected source dir into its book.

## Deployment gaps

- The README shows `TOME_BOOK=… npm run dev` but not how to *find* a book, how
  to keep personal books out of git, or how to get the reader onto a tablet.
- `dist/` is a static site with root-absolute links: it works served from a
  domain root (LAN `astro preview --host`, Netlify/Cloudflare Pages, a custom
  domain) but not from a sub-path such as `user.github.io/repo/`.
- No service worker: an iPad "Add to Home Screen" shortcut needs the host to be
  reachable.
