# INT-0008 — In-book search

<!-- sprint-loop-intent-v2 -->
- **Intent ID:** INT-0008
- **State:** realized
- **Work evidence:** [Sprint 10 build plan (T-023–T-025)](../sprints/s10/sprint-plans/build-plan.md)
- **Completion evidence:** [T-023–T-025 completion (Sprint 10)](../work/completed-tasks.md#t-023-sprint-10)
- **Code evidence:** [search index builder](../../src/lib/search-index.ts), [pure scorer](../../src/lib/search.ts), [index endpoint](../../src/pages/search-index.json.ts), [search overlay island](../../src/components/SearchOverlay.tsx), [search build gate](../../scripts/check-search.mjs)
- **Test evidence:** [Sprint 10 test report](../sprints/s10/sprint-tests/test-report.md)
- **Documentation evidence:** [README — Search](../../README.md#search)

## Intent

Let a reader search the full text of the library from any page and jump straight
to the matching chapter — and the matching heading within it — without leaving
Tome. Search is keyboard-first (a visible control and the `/` shortcut), ranks
title and heading matches above body matches, and is styled in the sacred idiom.
The reader page stays zero-JavaScript-by-default until search is invoked.

## Acceptance criteria

1. A build-time search index covers every chapter of every tome — chapter title,
   heading text, and body text — derived from the same Markdown the reader sees,
   and is served as a static JSON asset the reader loads on demand (it is not
   shipped in the initial page HTML/JS).
2. From any chapter a reader can open a search overlay (a visible control **and**
   the `/` key), type a query, and see ranked results that update as they type;
   each result links to the chapter's adaptive URL and deep-links to the most
   relevant heading (`#slug`) when the match is within a section. `Escape` closes
   the overlay; the keyboard selects and opens a result.
3. Ranking prefers title/heading matches over body matches and supports
   prefix and multi-term queries; the empty-query state and the no-results state
   are each a designed panel, never a blank.
4. Adaptive + zero-JS + accessible: with one tome results link to `/<chapter>`,
   with several to `/<tome>/<chapter>`; the overlay is a single island (a page
   ships no search JS until it hydrates), traps focus while open, exposes the
   listbox/option roles, honors `prefers-reduced-motion`, and a build gate proves
   the emitted index plus an end-to-end query path.

## Rationale

Tome renders books, loads external ones, presents a multi-tome Bibliotheca, and
resolves relative and parent-relative assets (INT-0001–INT-0007), but offers no
way to *find* content across chapters. Full-text search is a baseline expectation
of any book reader — mdBook itself ships it — and discovery is the natural next
reader capability now that viewing and loading are complete.

## Alternatives

- A prebuilt static-search tool (e.g. Pagefind) that indexes the built HTML.
  Rejected for this cut: it adds a separate binary/WASM build step and its own UI
  conventions; a small build-time JSON index plus one sacred island keeps the
  toolchain and the aesthetic under our control for a book-sized corpus.
  Reconsider if corpora grow very large.
- Ship a search library (MiniSearch / FlexSearch) inside the island. Considered;
  a dependency-free tokenized scorer is sufficient for this corpus and keeps the
  island lean. A small library is an acceptable follow-up if ranking needs grow.
- Server-side search. Rejected: Tome is a static site with no server.

## Consequences

- A new static endpoint emits the index; it grows with the corpus (a large
  external book yields a large JSON), so the index stores trimmed, tokenizable
  text and is fetched lazily on first open, not eagerly.
- Heading deep-links depend on Astro's github-slugger heading `id`s; the index
  must compute the same slugs (per-chapter, matching Astro's per-page dedupe).
- The `/` shortcut needs an always-hydrated (`client:idle`) island; it must not
  fire while the reader is typing in an input or with modifier keys held.
- Scope is text search of Markdown chapter content. Code-semantics search,
  typo-tolerant fuzzy matching beyond prefixes, cross-tome ranking tuning, and
  search over images or draft chapters are out of scope for the first cut.

## Transition history

- 2026-08-14: created as `proposed` during Sprint 10 research — the first
  reader-discovery outcome after INT-0001–INT-0007 delivered viewing, external
  loading, the multi-tome Bibliotheca, and asset fidelity.
- 2026-08-14: `proposed → planned` — Sprint 10 plans (T-023–T-025) accepted: a
  build-time index endpoint + pure scorer (T-023), a keyboard-first sacred
  overlay island (T-024), and a CI build gate + docs (T-025) covering all four
  acceptance criteria.
- 2026-08-14: `planned → active` — Sprint 10 Build Phase began implementing
  T-023–T-025 against the locked plans.
- 2026-08-14: `active → realized` — Sprint 10 delivered all four criteria: a
  build-time `dist/search-index.json` covering every chapter with github-slugger
  heading parity (T-023), a keyboard-first sacred overlay (`/`, focus trap,
  listbox, adaptive deep links) mounted as one `client:idle` island (T-024), and a
  CI `check_search` gate proving the index + a real query end to end for single-
  and multi-tome builds (T-025). 72/72 unit, 9/9 E2E, `check_search`/`check_external`/
  `check_multibook` green, `astro check` clean. (An unrelated, pre-existing
  live-reload × parent-asset failure — Sprint-9 fixture, INT-0007 domain — was
  diagnosed and filed as T-209; it does not touch INT-0008.)
