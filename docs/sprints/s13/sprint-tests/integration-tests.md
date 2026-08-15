# Sprint 13 Integration Gates

## Markdown-processor swap — the sprint's key regression surface
Admonitions needed a **remark plugin**, but this Astro's default Markdown processor
("Sätteri") does not run remark/rehype plugins — `remarkPlugins` requires
**@astrojs/markdown-remark** (the unified/remark processor), installed in T-029.
Swapping the processor changes *all* Markdown rendering, so every gate was re-run to
prove no regression. All green, tree restored clean:

- `node scripts/check-search.mjs` → **OK** (single + multi). Proves **heading-slug
  parity is preserved** under the new processor — the search index's heading slugs still
  match the rendered `id`s, so search + the on-this-page rail keep working.
- `node scripts/check-external-build.mjs` → **OK** (both fixtures). Proves **image
  optimization is preserved** — the handbook's in-source relative image and the
  parent-relative asset still emit as `/_astro/…` and render.
- `node scripts/check-multibook.mjs` → **OK** (two-tome Bibliotheca + namespaced routes
  + switcher + Pager).
- `node scripts/check-live-reload.mjs` → **OK** (live edit reflects + parent image
  resolves under the new processor).

Plus footnotes still render (`<section data-footnotes>`), heading `id`s are still
github-slugs, and `syntaxHighlight: false` still holds (code renders monochrome).
