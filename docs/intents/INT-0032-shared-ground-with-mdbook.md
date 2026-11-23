# INT-0032 — Nothing done twice that mdBook already does

<!-- sprint-loop-intent-v2 -->
- **Intent ID:** INT-0032
- **State:** proposed
- **Work evidence:** none
- **Completion evidence:** none
- **Code evidence:** none
- **Test evidence:** none
- **Documentation evidence:** none

## Intent

Find what Tome does that mdBook already does, and remove the repetition
where removing it is a gain. The owner, on 23 November 2026: "I've also
learned that, since mdbook pretty much works a lot like tome, we could
perhaps explore if we can refactor to eliminate redundancies."

This is an exploration first. Its first result is a written finding; a
refactor follows only where the finding supports one.

## Acceptance criteria

To be settled when a sprint plans it.

1. A written comparison names each thing both programs do, and for each
   says whether Tome keeps its own, takes mdBook's, or shares a test of the
   same behaviour.
2. Whatever is removed, the reader behaves as before: the existing tests and
   build gates hold it.
3. Tome still reads what is not an mdBook
   ([INT-0029](INT-0029-documents-as-tomes.md)), and still builds for a
   person who does not have mdBook installed, unless the owner decides
   otherwise.

## Rationale

Tome began as a viewer of mdBooks and wrote its own reading of their
format. What Sprint 24's research found repeated:

| what | Tome's own | mdBook's |
|---|---|---|
| the spine | `src/lib/summary.ts` parses `SUMMARY.md` | parses it into chapters |
| the book's settings | `scripts/book-source.mjs` reads three keys of `book.toml` by pattern | reads the whole file |
| admonitions | `scripts/remark-alerts.mjs` | on by default |
| footnotes, tables, strikethrough | Astro's Markdown | its own Markdown |
| search | `src/lib/search-index.ts` | its HTML renderer's search |

mdBook can hand a parsed book to another program: a renderer named in
`book.toml` under `[output.<name>]` receives "a JSON representation of the
book and configuration information" on standard input. Tome could be such a
renderer, and would then no longer parse `SUMMARY.md` or `book.toml`
itself.

## Alternatives

- **Keep both.** Costs nothing now; every mdBook feature Tome wants must
  then be written again (its `{{#include}}` of files, for one, which Tome
  does not have).
- **Tome as an mdBook renderer.** Removes the most, and brings mdBook's
  preprocessors with it. Every load would then need the mdBook program.
- **Use mdBook as a Rust library inside the Tauri shell.** Fits the port to
  Tauri, but the browser and Electron builds would not share it.

## Consequences

- Loose documents (INT-0029) are not mdBooks, so some reading of Tome's own
  stays whatever is decided.
- Tome's mathematics ([INT-0030](INT-0030-mathematics-and-code.md)) and
  mdBook's differ in how they are written; the comparison must say which a
  shared book uses.

## Transition history
- 2026-11-23: created as `proposed` in Sprint 24's Research, from the owner's
  words opening the sprint.
