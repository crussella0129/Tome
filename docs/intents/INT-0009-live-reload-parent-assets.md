# INT-0009 — Live-reload fidelity for parent-relative assets

<!-- sprint-loop-intent-v2 -->
- **Intent ID:** INT-0009
- **State:** realized
- **Work evidence:** [Sprint 11 build plan (T-209)](../sprints/s11/sprint-plans/build-plan.md)
- **Completion evidence:** [T-209 completion (Sprint 11)](../work/completed-tasks.md#t-209-sprint-11)
- **Code evidence:** [per-chapter parent-asset prep](../../scripts/parent-assets.mjs), [dev watcher wiring](../../astro.config.mjs), [extended live-reload gate](../../scripts/check-live-reload.mjs)
- **Test evidence:** [Sprint 11 test report](../sprints/s11/sprint-tests/test-report.md)
- **Documentation evidence:** none

## Intent

When an external book is loaded in `dev` and the reader edits a chapter that
references a **parent-relative** inline image (`![](../assets/plate.svg)` — the
INT-0007 case), the edit reflects in the reader without a manual rebuild and
without breaking the image, by applying the same parent-asset preparation to the
live-synced chapter that the build-time loader applies. This closes the gap
INT-0007 deferred: it prepared parent assets only at build/load time, while the
live-reload watcher raw-copies edited chapters and loses the URL rewrite.

## Acceptance criteria

1. When a watched chapter containing a parent-relative inline image is edited
   during `dev`, the live-reload sync rewrites the synced chapter's parent-relative
   image URL(s) to the tome-private staged asset and ensures the referenced asset
   is present, so the edited chapter renders (no `ImageNotFound`) and the edit
   appears without a restart.
2. The live-reload parent-asset handling enforces the same containment as the
   build path — targets confined to the book root; lexical and symlink escapes
   rejected — and leaves in-source images and non-local URLs unchanged.
3. Editing a chapter with no parent-relative image continues to sync and reflect
   exactly as before (no regression to INT-0003 live reload), and ordinary
   in-source relative images keep working.
4. The `check_live_reload` gate proves an edit to the canonical handbook chapter
   (which references a book-root sibling image) reflects in the reader with the
   image still resolving — the gate that currently fails is green again.

## Rationale

INT-0007 delivered build-time parent-asset rendering and explicitly deferred live
edits to such chapters ("live edits to book-root siblings are not promised by
this intent"). Sprint 10 surfaced that this gap actively **breaks** live reload for
any chapter referencing a parent asset: the watcher's raw `syncPath` overwrites
the build-time-rewritten chapter with the original `../assets/…` URL, so Astro's
image pipeline throws `ImageNotFound`. Making live editing work for parent-asset
chapters is a distinct fidelity outcome, not unfinished INT-0003/INT-0007 work.

## Alternatives

- Reopen INT-0007. Rejected: it is realized with every criterion met; a distinct
  live-edit outcome is a new intent (mirroring INT-0003 → INT-0007 for the
  original parent-asset slice).
- Re-run the whole-tome `prepareParentAssets` on each edit. Rejected: it guards
  against a preexisting reserved asset directory (correct at build time) and would
  throw on the already-staged dev tree; it is also heavier than a per-file rewrite.
- Exclude parent-asset chapters from live reload, or just document the limitation.
  Rejected: live reload should not silently break for a supported book layout.

## Consequences

- `parent-assets.mjs` gains a per-chapter preparation path that reuses the build
  path's span classification + containment checks, but reuses the already-staged
  tome-private asset directory instead of guarding against its existence.
- The dev watcher (`astro.config.mjs`) needs the book `root` (already returned by
  `resolveBookSource`) in addition to `sourceDir`/`dest`.
- Scope stays inline Markdown images inside the book root (as INT-0007). Live
  edits to the parent **asset file itself** remain out of scope — the watcher owns
  only the detected source directory — so only chapter edits are covered.

## Transition history

- 2026-08-14: created as `proposed` during Sprint 11 research — picks up the
  live-edit slice INT-0007 deferred, after Sprint 10 found it breaks the
  `check_live_reload` gate.
- 2026-08-14: `proposed → planned` — Sprint 11 plans T-209: a per-chapter
  parent-asset preparation reusing the build path's classification + containment,
  wired into the dev watcher, with the extended `check_live_reload` gate proving all
  four criteria.
- 2026-08-14: `planned → active` — Sprint 11 Build Phase began implementing T-209
  against the locked plans.
- 2026-08-14: `active → realized` — T-209 delivered all four criteria: a per-chapter
  `prepareChapterParentAssets` (sharing the build path's containment classifier,
  reusing the already-staged reserved dir) wired into the dev watcher after
  `syncPath` for `.md`; unit-tested for rewrite/copy, containment parity, and
  in-source no-op; and proven end to end by the extended `check_live_reload` gate —
  editing a parent-asset chapter now reflects **and** the parent image resolves via
  the tome-private staged asset (the Sprint-10 failure is fixed). The build path is
  untouched (extract-only refactor; its 5 tests + `check_external_build` stay green).
