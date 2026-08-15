# INT-0014 — Discoverable library (Bibliotheca by default)

<!-- sprint-loop-intent-v2 -->
- **Intent ID:** INT-0014
- **State:** planned
- **Work evidence:** [Sprint 15 build plan (T-036, T-037)](../sprints/s15/sprint-plans/build-plan.md)
- **Completion evidence:** none
- **Code evidence:** none
- **Test evidence:** none
- **Documentation evidence:** none

## Intent

The library structure is discoverable and navigable out of the box. Today the
default build ships a single tome, so the Bibliotheca index and the sidebar
tome-switcher — which only render for a library of two or more tomes — never
appear, yet search invites the reader to "search every tome." Ship a curated
**second** bundled sample tome so the Bibliotheca and the switcher are visible
with zero configuration, and make the reader's copy honest about how many tomes
the library actually holds.

## Acceptance criteria

1. The default build (no `TOME_BOOK*` env, no `tome.config.toml`) ships **two**
   bundled sample tomes, so `/` renders the Bibliotheca (both tomes listed as
   working links) and each chapter's sidebar shows the tome switcher with a
   Bibliotheca link — the library superstructure is visible with no configuration.
2. Cross-tome navigation works with **no JavaScript**: from any chapter a visible
   link reaches the Bibliotheca and the switcher opens a sibling tome; from the
   Bibliotheca every tome opens. Single-tome mode (`TOME_BOOK=…`) is unchanged —
   root routes, no switcher, no Bibliotheca.
3. Library-wide search stays honest about the library: every result is attributed
   to its tome, and the trigger/hint/empty copy reads as library-wide when several
   tomes exist and does **not** imply multiple tomes when only one exists
   (single-tome copy softened).
4. Tests assert the default build is multi-tome (Bibliotheca + switcher present,
   both tomes routed and cross-navigable, library-wide search returns hits across
   tomes), and the single-tome mode remains covered.

## Rationale

Adaptive routing makes `/` a chapter for one tome and the Bibliotheca for many,
and the switcher renders only for 2+ tomes — so with the single bundled sample
there is no visible way to "operate the Bibliotheca superstructure," and the
"every tome" search copy contradicts the one-tome reality. A second curated
sample tome makes the library self-evident and turns the landing page into the
library shelf, which is the correct mental model for a *Bibliotheca of Tomes*.

## Alternatives

- Surface a library affordance even with a single tome. Rejected for now: a
  one-item Bibliotheca is noise, and it would not fix the "every tome" copy;
  shipping a real second tome both demonstrates the feature and makes the
  multi-tome copy correct.
- Leave discoverability to the README. Rejected: the UI should be self-evident.

## Consequences

- The committed default library becomes **two** tomes (a second curated sample
  under `src/content/books/`); `load-books`' no-op default now yields a
  Bibliotheca. Single-tome loading via `TOME_BOOK`/`TOME_BOOKS`/config is
  unchanged.
- Because `/` becomes the Bibliotheca rather than a chapter, the default reader,
  search, and Electron E2E (which currently open `/` expecting the "Introduction"
  chapter + sidebar) must be updated to open the Bibliotheca and navigate into a
  tome. This ripple is accounted for in planning.

## Transition history

- 2026-08-15: created as `proposed` during Sprint 15 research — the reader could
  not discover how to navigate between tomes because the single bundled sample
  hides the Bibliotheca and switcher (they render only for 2+ tomes).
- 2026-08-15: `proposed → planned` — Sprint 15 plans T-036 (a curated second
  bundled sample tome making the default a 2-tome Bibliotheca, with the reader/
  search/electron E2E migrated to the multi-tome default) and T-037 (tome-count-
  aware search copy), covering all four criteria.
