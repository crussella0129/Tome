# Sprint 13 Test Report

## Intent Verification
| Intent | Acceptance criterion | EARS / tests | Result | Intent evidence update |
|--------|----------------------|---------------|--------|------------------------|
| [INT-0011](../../../intents/INT-0011-richer-content-rendering.md) | 1 — admonition transform; plain blockquote unchanged | T-029 `test_remark_alerts_transforms`, `test_remark_alerts_leaves_plain_blockquote`; E2E `test_reader_admonition_rendered` | **pass** | Test evidence adds this report |
| [INT-0011](../../../intents/INT-0011-richer-content-rendering.md) | 2 — footnotes styled; rail excludes `footnote-label` | E2E `test_reader_footnote_links` + build (rail has no `#footnote-label`) | **pass** | (as above) |
| [INT-0011](../../../intents/INT-0011-richer-content-rendering.md) | 3 — print hides chrome | E2E `test_reader_print_hides_chrome` | **pass** | (as above) |
| [INT-0011](../../../intents/INT-0011-richer-content-rendering.md) | 4 — features work in a browser; sample demonstrates them | T-031 E2E (above); sample `getting-started` | **pass** | (as above) |

All four INT-0011 criteria are met → **INT-0011 is eligible for `realized`** (Loop Phase).

## Summary
- Unit: **83 passed / 0 failed** (Vitest, 16 files) — incl. the admonition-plugin transform.
- E2E: **15 passed / 0 failed** (Playwright) — 3 new content specs + the prior 12.
- Gates: `check_search`, `check_external_build`, `check_multibook`, `check_live_reload`
  — all **OK**, tree clean. These prove the **Markdown-processor swap** (Sätteri →
  @astrojs/markdown-remark, needed for remark plugins) is regression-free: heading-slug
  parity, image optimization, footnotes, and syntaxHighlight all preserved.
- `astro check`: **0 errors / 0 warnings / 0 hints** · audit: **passed**.
- CI status: green **expected** on the PR (all CI-run gates green locally).

## Tested head
- **Head SHA:** `28a5a61e0e9da69703a82e983d907b85407fb30a` (tip of `dev`).
- Local canonical-runner: `vitest` 83 · `playwright` 15 · `check_search` OK ·
  `check_external_build` OK · `check_multibook` OK · `check_live_reload` OK ·
  `astro check` 0 errors · audit passed. CI conclusion to be observed on the Sprint 13 PR.

## Failures
None. (One Windows-only `load-books.test.ts` temp-cleanup `EPERM` flake cleared on
re-run — Linux CI unaffected; see `unit-tests.md`.)

## Technical Debt Identified
- The recurring Windows-only `load-books.test.ts` temp-cleanup `EPERM` is cosmetic
  (CI is Linux); a future hardening could retry the `rmSync` or use a longer teardown.
- Admonition scope is a plain `[!TYPE]` marker at a blockquote's start; richer markers
  are out of scope. No new backlog opened.

## Coverage Observations
INT-0011 is proven at unit (the pure remark transform: marker → titled admonition;
plain/bogus untouched) and browser (admonitions rendered with class + title; the
footnote ref → note → back-ref chain plus sacred styling; print media hides the chrome)
levels, with the sample chapter demonstrating both. Critically, the necessary
Markdown-processor swap was validated regression-free across every build gate —
heading-slug parity (search + rail), image optimization, footnotes, and code styling
all preserved.
