# Sprint 10 Integration Gates

## `check_search` (new — T-025) — CI + local
`node scripts/check-search.mjs` → **OK**. Builds the site twice and runs the real
scorer against the emitted index (it imports `src/lib/search.ts`; Node 24 strips
the type-only import):
- **Single-tome:** `dist/search-index.json` is emitted; a `/getting-started`
  record carries the heading slug `the-summary-is-the-spine`; `search('panels', index)`
  resolves to `/components/panels`.
- **Two-tome** (`TOME_BOOKS=fixtures/handbook,fixtures/docs-book`): record URLs are
  namespaced (`/handbook/first`, `/docs-book/…`); `search('nested', index)` resolves
  to a `/handbook/…` URL.
- Restores `src/content/books/` to HEAD and rebuilds the default (tree clean).
Wired into CI as the "Search build gate" step beside the multi-book gate.

## `check_external_build` (regression) — CI + local
`node scripts/check-external-build.mjs` → **OK** for both fixtures (handbook +
relative image, config-less docs-book). Search adds only a `/search-index.json`
endpoint, so single-external-book rendering is unaffected.

## `check_multibook` (regression) — CI + local
`node scripts/check-multibook.mjs` → **OK** — two-tome Bibliotheca + namespaced
routes + switcher unchanged; the added search endpoint co-exists.

## `check_live_reload` (regression) — local — **FAIL (pre-existing, unrelated to INT-0008)**
`node scripts/check-live-reload.mjs` → **FAIL**: after editing the handbook
fixture's `first.md`, the reader does not reflect the edit. **Root cause
(diagnosed):** the dev log shows `ImageNotFound: ../assets/parent-plate.svg`. The
handbook fixture gained a **parent-relative image** in Sprint 9 (commit `fc1b8f4`,
T-206/INT-0007). The live-reload watcher's `syncPath` raw-copies the changed
chapter **without** the parent-asset rewriting that `load-books`/`parent-assets.mjs`
applies at build time, so the synced chapter's `../assets/parent-plate.svg`
reference fails Astro's image pipeline and the page errors.

**Proven unrelated to this sprint:** the offending reference is a Sprint-9 fixture
artifact, and the Sprint-10 diff (`0f57881..HEAD`) touches **none** of the
live-reload / parent-asset path (`scripts/book-source.mjs`, `astro.config.mjs`,
`scripts/load-books.mjs`, `scripts/parent-assets.mjs`, `fixtures/`). The same
failure reproduces on the base commit. This gate is **local-only (not in CI)**, so
Sprint 10's PR CI is unaffected. Filed as backlog **T-209** (make the dev watcher
parent-asset-aware) — it belongs to INT-0007, which itself scoped out live edits to
book-root siblings.
