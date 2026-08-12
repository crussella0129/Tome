# INT-0003 — Richer external-book support

<!-- sprint-loop-intent-v2 -->
- **Intent ID:** INT-0003
- **State:** realized
- **Work evidence:** [Sprint 3 build plan (T-013–T-014)](../sprints/s3/sprint-plans/build-plan.md), [Sprint 3 test plan](../sprints/s3/sprint-plans/test-plan.md), [Sprint 5 build plan (T-017–T-018)](../sprints/s5/sprint-plans/build-plan.md), [Sprint 6 build plan (T-019–T-022)](../sprints/s6/sprint-plans/build-plan.md)
- **Completion evidence:** [T-019–T-022 completion (Sprint 6)](../work/completed-tasks.md#t-019-sprint-6), [T-014 completion (Sprint 3)](../work/completed-tasks.md#t-014-sprint-3), [T-018 completion (Sprint 5)](../work/completed-tasks.md#t-018-sprint-5) — criterion 2 (the Bibliotheca) delivered; with criteria 1 (Sprint 3) and 3 (Sprint 5) already met, all three are satisfied.
- **Code evidence:** [book.ts — adaptive library/routing](../../src/lib/book.ts), [load-books.mjs — TOML/env loader](../../scripts/load-books.mjs), [Bibliotheca.astro](../../src/components/Bibliotheca.astro), [check-multibook.mjs](../../scripts/check-multibook.mjs), [check-external-build.mjs](../../scripts/check-external-build.mjs), [live-reload integration](../../astro.config.mjs), [book-source.mjs](../../scripts/book-source.mjs)
- **Test evidence:** [Sprint 3 test report](../sprints/s3/sprint-tests/test-report.md), [Sprint 5 test report](../sprints/s5/sprint-tests/test-report.md), [Sprint 6 test report](../sprints/s6/sprint-tests/test-report.md)
- **Documentation evidence:** [README — Live reload](../../README.md), [README — The Bibliotheca](../../README.md#the-bibliotheca--a-library-of-books)

## Intent

Extend external-book loading ([INT-0002](INT-0002-load-external-mdbooks.md), which
loads one book via `TOME_BOOK`) toward the fidelity and breadth real mdBooks
expect: chapter-**relative images/assets** that resolve correctly, a **multi-book**
library (choose among several books), and optionally **live reload** while an
external book changes on disk.

## Acceptance criteria

1. A chapter that references a relative image (`![](./diagram.png)`) renders that
   image, sourced from the external book, styled by the sacred prose layer.
2. Tome can present more than one book and let the reader switch between them.
3. (Optional) Editing a chapter of the active external book during `dev` reflects
   in the reader without a manual rebuild.

## Rationale

INT-0002 proved the load-and-render path for a single book with absolute-path
assets; relative assets and multiple books are the natural next expectations for
a general viewer, deferred there to keep that slice bounded.

## Alternatives

- Fold into INT-0002. Rejected: INT-0002's acceptance criteria are met and it is
  realized; these are distinct new outcomes.

## Consequences

- Relative-asset resolution likely needs an Astro asset-pipeline or rewrite step
  for copied external content.
- Multi-book introduces selection/state and route namespacing per book.
- **Multi-book design (criterion 2), decided with the user:** the library ("the
  **Bibliotheca**") is configured by a committed **`tome.config.toml`**
  (`[[book]]` entries) with a `TOME_BOOKS`/`TOME_BOOK` **env override**; routing is
  **adaptive** — one tome stays at root `/<chapter>` (no churn), multiple tomes are
  namespaced `/<tome>/<chapter>` with `/` as the Bibliotheca index and a sidebar
  switcher. "Bibliotheca" is used as one tasteful touch, not across the whole UI.
- A **desktop shell** to browse a local Bibliotheca is deliberately **out of
  scope here** — it becomes its own future intent (Electron-first per standing
  guidance), wrapping this web library.

## Transition history
- 2026-08-11: created as `proposed` during Sprint 2 Loop (carry-forward of the
  fidelity/breadth work deferred by the now-realized INT-0002).
- 2026-08-11: `proposed → planned` — Sprint 3 plans (T-013–T-014) accepted; delivers criterion 1 (relative images) and gates it in CI. Criteria 2–3 remain.
- 2026-08-11: `planned → active` — Sprint 3 Build Phase began implementing T-013–T-014.
- 2026-08-11: Sprint 3 delivered **criterion 1** (relative-image fidelity), enforced by a CI build gate; remains `active` for criterion 2 (multi-book, backlog T-202) and criterion 3 (live reload, backlog T-204).
- 2026-08-11: corrected the State field to `active` (it had been left at `planned` since the Sprint 3 `planned → active` history entry). Sprint 5 (T-017–T-018) plans accepted to deliver **criterion 3** (live reload); criterion 2 remains.
- 2026-08-11: Sprint 5 delivered **criterion 3** (live reload of the active external book during `dev`), proven by the `check_live_reload` gate (edit → reader updates, no restart); remains `active` for criterion 2 (multi-book, backlog T-202).
- 2026-08-12: `active → realized` — Sprint 6 (T-019–T-022) delivered **criterion 2** (the Bibliotheca: a `tome.config.toml`/env-configured multi-book library, adaptive routing — one tome at the root, many namespaced under `/<tome>/` with a `/` library index + sidebar switcher, owner defaulting to the OS user), proven end to end by the `check_multibook` gate (two fixture tomes → namespaced routes + Bibliotheca + switcher) now run in CI. All three acceptance criteria (relative images, multi-book, live reload) are met, so INT-0003 is **realized**.
