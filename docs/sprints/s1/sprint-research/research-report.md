# Sprint 1 Research Report

## Intents Reviewed
- [INT-0001](../../../intents/INT-0001-tome-ink-on-paper-mdbook-viewer.md) — selected; relevance: this sprint completes the acceptance criteria Sprint 0 only began (5 images, 6 reduced-motion) and hardens delivery (7 via CI) plus clears the font-CDN debt; current state: `active`. No criteria change — the desired outcome is unchanged; the sprint finishes it.

## 1. Sprint Goal

Harden and finish the Tome foundation so INT-0001's acceptance criteria are fully
met for the bundled book. Four bounded pieces: (a) remove the runtime dependency
on the Mekzantine CDN by self-hosting the font from Tome's own origin; (b) add an
image to the sample book and prove criterion 5's image styling; (c) prove
criterion 6's `prefers-reduced-motion` behaviour with an E2E test; (d) wire a
GitHub Actions CI that runs `astro check` + Vitest + Playwright on `work → base`
PRs so criterion 7's gates are enforced remotely. On success INT-0001 becomes
eligible for `realized` (all seven criteria satisfied for the bundled book;
arbitrary-book-directory support remains a separate, later intent).

## 2. Existing Code Survey

| File | Relevance | Notes |
|------|-----------|-------|
| `src/styles/fonts.css` | high | Currently `@font-face` → S3 CDN woff2 for Mekzantine(Mono). Self-hosting rewrites `src` to a local origin path. |
| `src/styles/tokens.css` | high | `--font-family-mono` already has a `ui-monospace … monospace` fallback; `@media (prefers-reduced-motion: reduce)` already zeroes transitions/animations — the reduced-motion E2E asserts this existing rule. |
| `src/styles/prose.css` | med | `.tome-prose img` already bordered/fluid — the image chapter exercises it; no change likely needed. |
| `src/content/book/**` + `src/lib/book.ts` | med | Sample book + route loader; the image chapter adds content (and, if a new chapter, one route). |
| `src/pages/[...slug].astro` | low | Catch-all route; unaffected unless a new chapter file is added. |
| `e2e/reader.spec.ts` | high | Playwright suite; gains an image assertion and a reduced-motion test. |
| `playwright.config.ts` / `package.json` | high | `webServer` already builds+previews; CI reuses `npm run build` + `npx playwright test`. |
| `.github/dependabot.yml` | med | Already targets `dev` for github-actions updates; the new CI workflow is the first actions manifest it will track. |
| `astro.config.mjs` | low | `syntaxHighlight:false` set; static output — `public/` is served verbatim, the natural home for a self-hosted font or image. |

## 3. External Sources

- [Playwright — CI (GitHub Actions)](https://playwright.dev/docs/ci-intro) — canonical workflow: `actions/checkout`, `actions/setup-node`, `npm ci`, `npx playwright install --with-deps`, `npx playwright test`, upload `playwright-report/`. Our `webServer` builds the site, so CI runs the production build too; a 60-min timeout is recommended.
- [www-sacred `global-fonts.css`](https://raw.githubusercontent.com/internet-development/www-sacred/main/global-fonts.css) — the Mekzantine(Mono) woff2 lives on Internet Development's public S3 CDN and is toggled by `body.font-use-*`. sacred itself is MIT and served for free reuse, **but no explicit licence is published for the Mekzantine font binary** (a targeted web search returned no Mekzantine licence documentation). Redistributing the binary in a *public* repo is therefore a copyright risk.
- [Playwright `emulateMedia`](https://playwright.dev/docs/emulation#color-scheme-and-media) — `page.emulateMedia({ reducedMotion: 'reduce' })` drives the reduced-motion assertion: with it set, a transitioning element's computed `transition-duration` collapses to ~0 per our token rule.

## 4. Risks, Unknowns, Dependencies

- **Risk (legal): Mekzantine licence is undocumented.** Vendoring the woff2 into the public repo could redistribute a copyrighted font without a licence. **Mitigation / recommended:** self-host by *fetching* the font at build time into `public/fonts/` (git-ignored) rather than committing the binary — the deployed site serves it from its own origin (runtime CDN dependency dropped) without the repo redistributing it. Vendoring (committing the file) stays an option **only if the user confirms redistribution rights**; surface this at plan approval.
- **Risk: build-time fetch needs network.** The prebuild fetch adds a one-time network call at build/CI. Mitigation: cache in CI; keep the `monospace` fallback so a failed fetch degrades gracefully, never breaks the reader.
- **Risk: CI Playwright flake/time.** Browser install + build can be slow. Mitigation: `--with-deps`, install only chromium, generous timeout, run on PRs to `main` and pushes to `dev`.
- **Unknown: image pipeline.** Simplest robust path is an SVG in `public/` referenced by absolute URL from a chapter (`/images/…svg`), bypassing Astro's asset transform entirely and avoiding any third-party image licence. I will author the SVG (sacred-styled) myself.
- **Dependency: `workflow` gh scope** (present) to push a `.github/workflows/` file; the file ships in the sprint PR and runs on GitHub after merge.

## 5. Recommended Approach

Primary: (a) **Self-host font via a prebuild fetch script** (`scripts/fetch-fonts.mjs`) that downloads the Mekzantine(Mono) woff2 into `public/fonts/` (git-ignored), wired as a `prebuild`/`predev` npm hook; rewrite `fonts.css` `src` to `/fonts/…woff2`; keep the fallback stack. This drops the runtime CDN dependency without redistributing the binary. (b) **Image chapter:** author a sacred-style SVG in `public/images/`, reference it from a sample chapter, and assert it renders bordered. (c) **Reduced-motion:** Playwright `emulateMedia({ reducedMotion: 'reduce' })` + assert a transition collapses to ~0. (d) **CI:** `.github/workflows/ci.yml` on PRs to `main` and pushes to `dev` running `npm ci`, `astro check`, `vitest run`, `playwright install --with-deps chromium`, `playwright test`.

Alternative considered: **vendor** the woff2 (commit it). Rejected as the default on the licence risk above; available if the user confirms rights.

Rationale: finishes exactly the criteria INT-0001 already promised with the least new surface, respects the font licence uncertainty, and makes the green gates reproducible in CI rather than only locally.

## Artifacts
- Reviewed intent: [INT-0001](../../../intents/INT-0001-tome-ink-on-paper-mdbook-viewer.md) (unchanged criteria; this sprint completes 5–7).
- Prior provenance: [Sprint 0 test report](../../s0/sprint-tests/test-report.md) named images + reduced-motion + CI as the exact deferrals this sprint closes.
