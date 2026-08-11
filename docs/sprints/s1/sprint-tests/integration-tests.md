# Sprint 1 Integration Tests

- **Runner:** shell + Vitest / Astro build
- **Head SHA:** `2ec25101eabcd61d3d2392713a29fb237a5a5d4b`

## Font asset produced by the build (`gate_font_fetch`)
- Command: `node scripts/fetch-fonts.mjs` then `npm run build`.
- Result — **pass**: the fetch wrote `mekzantine-mono.woff2` (17512 bytes) and
  `mekzantine.woff2` (15576 bytes) to `public/fonts/`; the built CSS references
  `/fonts/mekzantine-mono.woff2` and `/fonts/mekzantine.woff2` (no external host).
  Composes T-006 clauses 1–2 (script → build → shipped CSS). The script is
  idempotent (skips existing files) and non-fatal on network error.
