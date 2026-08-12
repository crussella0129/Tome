# Sprint 6 Integration Gates

All three build-level gates restore `src/content/books/` to HEAD on success and
failure (idempotent, per the Sprint 4/5 hygiene). Verified tree-clean after each.

## `check_multibook` (new — T-022) — CI + local
`node scripts/check-multibook.mjs` → **OK**. Builds two tomes
(`TOME_BOOKS=fixtures/handbook,fixtures/docs-book`) and asserts the adaptive
multi-tome shape:
- Namespaced chapter routes exist: `/handbook`, `/handbook/first`,
  `/handbook/section/nested`, `/docs-book`, `/docs-book/overview`,
  `/docs-book/details/deep`.
- The root-level `/first` and `/overview` are **absent** (they belong to a tome now).
- `/` is the Bibliotheca, linking + titling both tomes.
- A chapter page (`/handbook/first`) carries the sidebar switcher: a link to the
  sibling tome and `aria-current="true"` on the active tome.
- Restores the library and rebuilds the default. Wired into CI as the "Multi-book
  build gate" step.

## `check_external_build` (regression — single external book) — CI + local
`node scripts/check-external-build.mjs` → **OK** for both fixtures. A single
external book now flows through `load-books` and **replaces the whole library**
(single-tome mode → root routes): handbook renders at `/first` with its relative
image optimized to `/_astro/`; the config-less docs-book is detected (`docs/`) and
renders at `/overview` + `/details/deep` with the directory-name title. Proves
C-001 (T-019 keeps external single-book loading green).

## `check_live_reload` (regression — dev-only) — local
`node scripts/check-live-reload.mjs` → **OK**. `predev` now runs `load-books`
(single `TOME_BOOK` → `books/<slug>/`); the live-reload integration syncs edits
into the same `books/<slug>/` dir. Edited a chapter on disk during `dev` and the
reader reflected it with no restart; tree restored clean.
