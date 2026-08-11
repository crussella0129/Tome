# INT-0003 — Richer external-book support

<!-- sprint-loop-intent-v2 -->
- **Intent ID:** INT-0003
- **State:** proposed
- **Work evidence:** none
- **Completion evidence:** none
- **Code evidence:** none
- **Test evidence:** none
- **Documentation evidence:** none

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
