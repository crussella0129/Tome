# Sprint 14 — Integration Test Results

- **Tested head:** `da7af92de3ebadc65a31db47ecdccfc6bfc25da8`
- **Intent:** [INT-0012](../../intents/INT-0012-desktop-shell-electron.md)

## `serve-dist` reuse of the shared resolver (regression)

T-032 extracted `resolveDistPath` + `contentTypeFor` out of `serve-dist.mjs` into
the shared `scripts/dist-resolve.mjs` and rewired `serve-dist.mjs` to consume them.
The static server backs the **browser** Playwright suite's `webServer`, so that
suite is the integration proof that the extraction is behavior-preserving.

- **Runner:** `npm run test:e2e` (default `playwright.config.ts`, webServer =
  `npm run build && node scripts/serve-dist.mjs`). **Result: 15 passed / 15.**
- The reader, theming, images, on-this-page, keyboard nav, admonitions, footnotes,
  print, and search specs all render — i.e. routes (`/`, `/getting-started`,
  `/components/panels`, `/about`), `/_astro/*`, `/fonts/*`, and `/search-index.json`
  are still served correctly through the refactored resolver. A `null`/missing path
  still yields `404` (unchanged behavior).

## Build gates (integration, run at the build boundary — same gated tree)

| Gate | Command | Result |
|------|---------|--------|
| External single-book build | `npm run check:external` | pass (build complete; tree restored to HEAD) |
| Two-tome Bibliotheca build | `npm run check:multibook` | pass |
| Search index + query | `npm run check:search` | pass ("done — tree restored to HEAD") |
| Live-reload parent assets | `npm run check:livereload` | pass ("the live edit appeared and the parent image resolved, no restart") |

These exercise the full build pipeline the desktop shell consumes (`dist/` is the
shell's payload); their continued green confirms Sprint 14 did not disturb the
build, multi-book routing, search index, or the dev watcher.
