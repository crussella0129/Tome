# Sprint 12 Integration Gates (regression)

Sprint 12's own verification is component + E2E (see those files). The build gates
run as regression, since the reader-nav changes touch chapter rendering
(`[...slug].astro`, `BookLayout`, `Pager`). All green, tree restored clean:

- `node scripts/check-external-build.mjs` → **OK** (handbook + relative image;
  config-less docs-book).
- `node scripts/check-multibook.mjs` → **OK** (two-tome Bibliotheca + namespaced
  routes + switcher). Also exercises the **Pager multi-tome fix** — pager links are
  now namespaced (`/handbook/section/nested` → prev `/handbook/first`).
- `node scripts/check-search.mjs` → **OK** (single + multi; index emitted, adaptive
  URLs, query resolves).
- `node scripts/check-live-reload.mjs` → **OK** (edit reflects + parent image
  resolves; the reader-nav islands don't disturb dev).

The "on this page" rail is server-rendered, so chapters build unchanged; a chapter
with no H2/H3 renders no rail (verified: `about`, the Introduction index).
