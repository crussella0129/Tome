# INT-0004 — Flexible book source detection

<!-- sprint-loop-intent-v2 -->
- **Intent ID:** INT-0004
- **State:** planned
- **Work evidence:** [Sprint 4 build plan (T-015–T-016)](../sprints/s4/sprint-plans/build-plan.md), [Sprint 4 test plan](../sprints/s4/sprint-plans/test-plan.md)
- **Completion evidence:** none
- **Code evidence:** none
- **Test evidence:** none
- **Documentation evidence:** none

## Intent

Tome should load real books that don't match the strict "`book.toml` + `src/SUMMARY.md`"
shape that [INT-0002](INT-0002-load-external-mdbooks.md) assumed. Many books —
including a Sprint-Loops Project Book like **CubiKan** — have **no `book.toml`**
and keep their source in `docs/` rather than `src/`. Today those require a
hand-built wrapper (a `book.toml` declaring `src = "docs"`); this intent makes
`TOME_BOOK=/path/to/such/a/book` **just work**.

Given a book root, Tome auto-detects the source directory by locating `SUMMARY.md`
across candidate locations, honors an explicit `book.toml` `src` when present, and
falls back to the root directory name for the title when `book.toml` has none.

**Boundaries.** Still one book at a time (multi-book is INT-0003 #2); still a
build-time load. This is purely about *discovering* a book's source and title
more flexibly; rendering, routing, and styling are unchanged (reused from
INT-0001/0002).

**Non-goals.** Guessing a title from prose, deep mdBook config beyond `src`,
or supporting non-mdBook TOC formats.

## Acceptance criteria

1. Given a book root **without** `book.toml`, Tome auto-detects the source by
   finding `SUMMARY.md` in candidate locations — `src/`, then `docs/`, then the
   root itself — first match wins, and renders that book.
2. Given a book **with** `book.toml` declaring `src`, that `src` is honored
   (backward-compatible with INT-0002).
3. When `book.toml` has no title (or there is no `book.toml`), the book title
   falls back to the **root directory's name** (then to the `SUMMARY.md` heading).
4. When no `SUMMARY.md` is found in any candidate location, the build fails with a
   clear error that **lists the locations tried**.
5. No regression: a standard mdBook (`book.toml` + `src/`) and the bundled sample
   still load exactly as before.

## Rationale

The CubiKan demo showed the strict assumption forces manual wrapping for common
real-world layouts. A short, ordered auto-detection (`src` → `docs` → root)
covers the overwhelming majority with no configuration, making "point Tome at any
book" true in practice.

## Alternatives

- Require every book to carry a `book.toml`. Rejected: books like CubiKan don't,
  and demanding one defeats "point at any book".
- Deep mdBook-config emulation. Rejected: out of proportion; two fields plus a
  short detection order suffice.

## Consequences

- A declared `book.toml` `src` is **authoritative**: it is used exactly, and a
  missing `SUMMARY.md` there is an error (not silently overridden). Auto-detection
  (`src` → `docs` → root) applies only when no `src` is declared; an ambiguous
  root resolves deterministically by that order.
- Title-from-directory-name is a heuristic; an explicit `book.toml` title always
  wins.

## Transition history
- 2026-08-11: created as `proposed` during Sprint 4 research (motivated by the
  CubiKan demo, which required a hand-built wrapper under the INT-0002 shape).
- 2026-08-11: `proposed → planned` — Sprint 4 plans (T-015–T-016) accepted; delivers all five criteria (source/title auto-detection).
- 2026-08-11: `planned → active` — Sprint 4 Build Phase began implementing T-015–T-016.
