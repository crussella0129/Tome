# INT-0003 — Richer external-book support

<!-- sprint-loop-intent-v2 -->
- **Intent ID:** INT-0003
- **State:** active
- **Work evidence:** [Sprint 3 build plan (T-013–T-014)](../sprints/s3/sprint-plans/build-plan.md), [Sprint 3 test plan](../sprints/s3/sprint-plans/test-plan.md), [Sprint 5 build plan (T-017–T-018)](../sprints/s5/sprint-plans/build-plan.md)
- **Completion evidence:** none
- **Code evidence:** [check-external-build.mjs](../../scripts/check-external-build.mjs), [live-reload integration](../../astro.config.mjs), [book-source.mjs](../../scripts/book-source.mjs)
- **Test evidence:** [Sprint 3 test report](../sprints/s3/sprint-tests/test-report.md), [Sprint 5 test report](../sprints/s5/sprint-tests/test-report.md)
- **Documentation evidence:** [README — Live reload](../../README.md)

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

## Transition history
- 2026-08-11: created as `proposed` during Sprint 2 Loop (carry-forward of the
  fidelity/breadth work deferred by the now-realized INT-0002).
- 2026-08-11: `proposed → planned` — Sprint 3 plans (T-013–T-014) accepted; delivers criterion 1 (relative images) and gates it in CI. Criteria 2–3 remain.
- 2026-08-11: `planned → active` — Sprint 3 Build Phase began implementing T-013–T-014.
- 2026-08-11: Sprint 3 delivered **criterion 1** (relative-image fidelity), enforced by a CI build gate; remains `active` for criterion 2 (multi-book, backlog T-202) and criterion 3 (live reload, backlog T-204).
- 2026-08-11: corrected the State field to `active` (it had been left at `planned` since the Sprint 3 `planned → active` history entry). Sprint 5 (T-017–T-018) plans accepted to deliver **criterion 3** (live reload); criterion 2 remains.
- 2026-08-11: Sprint 5 delivered **criterion 3** (live reload of the active external book during `dev`), proven by the `check_live_reload` gate (edit → reader updates, no restart); remains `active` for criterion 2 (multi-book, backlog T-202).
