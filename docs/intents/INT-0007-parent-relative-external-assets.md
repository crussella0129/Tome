# INT-0007 — Parent-relative external assets

<!-- sprint-loop-intent-v2 -->
- **Intent ID:** INT-0007
- **State:** realized
- **Work evidence:** [T-206 Sprint 9 build plan](../sprints/s9/sprint-plans/build-plan.md#t-206-prepare-and-verify-tome-private-parent-relative-image-assets)
- **Completion evidence:** [T-206 completion (Sprint 9)](../work/completed-tasks.md#t-206-sprint-9)
- **Code evidence:** [parent-asset preparation](../../scripts/parent-assets.mjs), [atomic external-book loader](../../scripts/load-books.mjs), [external build gate](../../scripts/check-external-build.mjs), [external Chromium specification](../../e2e/external-book.spec.ts)
- **Test evidence:** [Sprint 9 test report](../sprints/s9/sprint-tests/test-report.md)
- **Documentation evidence:** [canonical handbook parent-relative example](../../fixtures/handbook/src/first.md)

## Intent

Let external mdBook chapters safely render local Markdown images that live
inside the configured book root but outside its declared source directory. A
book using `src/chapter.md` and `assets/plate.svg` should therefore be able to
reference `![Plate](../assets/plate.svg)` without exposing unrelated host files
or mixing assets between tomes.

## Acceptance criteria

1. When a local inline Markdown image resolves outside an external book's
   detected source directory but remains inside that book's root, Tome copies
   only the referenced file into a tome-private content location and rewrites
   the copied chapter so Astro can process it.
2. Parent-relative asset preparation completes for every configured tome before
   the destination library is replaced. A missing file, directory target, or
   lexical/symlink escape outside the book root fails clearly with the chapter
   and offending destination and leaves the existing library untouched.
3. Existing source-contained relative images and non-local destinations remain
   unchanged, and identically named parent assets from different tomes remain
   isolated by their tome directories.
4. The canonical external-book gate proves a genuine book-root sibling image is
   emitted as an optimized `/_astro/` asset; Chromium visibly renders and
   decodes it with sacred-prose image styling while the existing in-source image
   regression remains green.

## Rationale

INT-0003 proved ordinary chapter-relative images located under the declared
source directory. Real book layouts may keep shared artwork beside `src/`, and
the current loader drops those files because it copies only `sourceDir`.
Flattening the source into a tome directory then makes the unchanged `../` URL
point outside that tome. This is a distinct fidelity and containment outcome,
not unfinished work in the already-realized INT-0003.

## Alternatives

- Reopen INT-0003. Rejected because all of its recorded acceptance criteria are
  realized; terminal intent history should not move backward for a distinct
  edge-case outcome.
- Copy the whole external book root. Rejected because it could ingest unrelated
  files, configuration, or secrets and would still blur source-root semantics.
- Copy parent assets into a shared directory outside each tome. Rejected because
  multiple books could collide and escape the per-tome ownership boundary.

## Consequences

- The loader needs a Markdown-aware, referenced-only preparation step, using a
  direct maintained parser dependency, and a temporary staging boundary before
  its existing destructive library replace.
- Scope is local inline Markdown image syntax. Reference definitions, HTML
  `<img>`, CSS URLs, document links, and assets outside the configured book root
  remain unchanged or unsupported.
- Dev startup receives the prepared asset, but live edits to book-root siblings
  are not promised by this intent because the existing watcher owns only the
  detected source directory.
- INT-0004's authoritative declared-source behavior remains intact even when a
  source is outside or symlinked beyond the book root. Parent-asset targets are
  classified relative to that source but independently required to resolve
  inside the configured book root; the source itself is not treated as a trust
  boundary.

## Transition history

- 2026-08-13: created as `proposed` during Sprint 9 research after T-206 exposed
  a fidelity and containment outcome beyond realized INT-0003.
- 2026-08-13: `proposed → planned` — Sprint 9 plans T-206 as an atomic,
  Markdown-aware loader preparation step with containment, isolation, generated
  output, Chromium, and regression evidence for all four acceptance criteria.
- 2026-08-13: `planned → active` — Build Phase began executing T-206 against
  the locked Sprint 9 plans.
- 2026-08-13: `active → realized` — T-206 satisfied all four criteria: exact
  CommonMark destination rewriting copied referenced-only, book-confined assets;
  invalid later-tome targets preserved the prior library and cleaned staging;
  non-target, platform, external-source, and per-tome isolation behavior passed;
  and both relative-image classes optimized while Chromium decoded and styled
  the parent image. The final critique was clean and hosted CI run 31740605981
  passed at `777f6fe160bc7d111bbf8c99fca93e48004f9ee2`.
