# INT-0002 — Load arbitrary external mdBooks

<!-- sprint-loop-intent-v2 -->
- **Intent ID:** INT-0002
- **State:** active
- **Work evidence:** [Sprint 2 build plan (T-010–T-012)](../sprints/s2/sprint-plans/build-plan.md), [Sprint 2 test plan](../sprints/s2/sprint-plans/test-plan.md)
- **Completion evidence:** none
- **Code evidence:** none
- **Test evidence:** [Sprint 2 test report](../sprints/s2/sprint-tests/test-report.md)
- **Documentation evidence:** none

## Intent

Tome should render **any** mdBook on disk, not only the bundled sample. Given a
path to an mdBook project, it discovers `book.toml` and `src/SUMMARY.md`,
resolves the chapter Markdown relative to the summary, and renders it through the
same ink-on-old-paper sacred surface built in [INT-0001](INT-0001-tome-ink-on-paper-mdbook-viewer.md).

This is the capability INT-0001 explicitly deferred (its non-goals named
"pointing Tome at an arbitrary external book directory"). INT-0001 realized the
viewer against a bundled book; INT-0002 generalizes the *source*.

**Boundaries.** Still a viewer (no editing/authoring, no `mdbook build`). The
existing parser (`src/lib/summary.ts`), token layer, and reader components are
reused; the new surface is book *discovery* and file resolution. Configuration
of which book to load (env var, config, or CLI arg) is part of this intent.

**Non-goals (for now).** Multi-book libraries, live reload of a running mdBook
process, and full-text search remain separate future intents.

## Acceptance criteria

1. Given a path to an external mdBook directory, Tome resolves its
   `src/SUMMARY.md` and renders every non-draft chapter at the correct route.
2. Chapter links in `SUMMARY.md` resolve to the corresponding Markdown files on
   disk (including nested paths and folder `README.md` index chapters).
3. A missing/invalid book path fails with a clear, actionable error rather than a
   silent blank render.
4. The bundled sample still works as the default when no external book is
   configured (no regression to INT-0001).

## Rationale

The whole point of a "viewer" is to view arbitrary books; the bundled sample was
a Sprint 0/1 vehicle to build the surface first. Reusing INT-0001's parser and
components keeps this to a source-resolution problem, not a rebuild.

## Alternatives

- **Keep only the bundled book.** Rejected: contradicts "viewer"; the sample was
  always a stand-in.
- **Copy an external book into `src/content/` at build.** A possible
  implementation of criterion 1, to be weighed in that sprint's plan against
  reading the book directory directly.

## Consequences

- Introduces configuration (which book to load) and filesystem/path-resolution
  edge cases (absolute vs relative links, `..` escapes) that need their own tests.
- The build's content pipeline must handle content outside `src/content/`.
- The book to load is selected by a **build-time `TOME_BOOK` environment
  variable** naming the mdBook root; a prebuild step copies its `<src>` tree into
  `src/content/book/` so the existing render pipeline is reused. When `TOME_BOOK`
  is **unset the step is a no-op** and the committed sample renders (the INT-0001
  fallback). A future sprint may add a config-file/CLI form, but `TOME_BOOK` is
  the baseline interface.

## Transition history
- 2026-08-11: created as `proposed` during Sprint 1 Loop (carry-forward from the
  T-101 backlog; distinct outcome from the now-realized INT-0001).
- 2026-08-11: `proposed → planned` — Sprint 2 build/test plans (T-010–T-012) accepted; first external-book slice (criteria 1–4).
- 2026-08-11: `planned → active` — Sprint 2 Build Phase began implementing T-010–T-012.
