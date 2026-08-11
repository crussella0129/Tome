# Sprint 3 Integration Tests

- **Head SHA:** `a72a22bcff289d2938acb4f20be0b414914f4ec1`

## External build gate (`scripts/check-external-build.mjs`, local + CI)
- `check_external_build` — **pass**: `node scripts/check-external-build.mjs` built with
  `TOME_BOOK=fixtures/handbook`, then asserted (a) `dist/first/` present, (b)
  `dist/getting-started/` absent, and (c) the fixture chapter's **relative** image
  rendered as `<img src="/_astro/plate.<hash>.svg">` in `dist/first/index.html`
  (Astro's image service optimized it). Restored `src/content/book/` to HEAD
  (`git status` on the dir clean afterward) and rebuilt the default. Covers T-013
  clauses 1–2 (INT-0003 criterion 1) and is the gate step T-014 wired into CI.
