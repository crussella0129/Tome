# Test Critique — Sprint 13

## Concerns

### C-001: The sprint swapped the entire Markdown processor mid-build
- **Where:** T-029 — `@astrojs/markdown-remark` installed; `markdown.remarkPlugins` set.
- **Quote:** "this Astro's default Markdown processor ('Sätteri') does not run remark/rehype plugins".
- **Failure mode:** integration-drift
- **Why it matters:** changing the processor affects **all** Markdown rendering, far
  beyond admonitions; a subtle regression (heading ids, footnotes, images, code) could
  silently break search, the on-this-page rail, or asset handling.
- **Suggested response:** defer-with-rationale — this is the necessary realization of the
  *planned* approach (the plan called for `markdown.remarkPlugins`, which this Astro only
  runs via `@astrojs/markdown-remark`), not an unplanned scope change. The regression is
  covered comprehensively and specifically: `check_search` proves **heading-slug parity**
  (search + rail still resolve), `check_external_build` proves **image optimization**
  (`/_astro/…` + parent assets), `check_multibook`/`check_live_reload` build chapters end
  to end, and the full Vitest (83) + Playwright (15) suites are green. Every invariant
  Tome depends on was re-verified. Not a block.

### C-002: A Windows-only test flake persists
- **Where:** `unit-tests.md` — `load-books.test.ts` `EPERM` on temp-dir cleanup.
- **Quote:** "intermittently hits a Windows-only `EPERM` on temp directory cleanup".
- **Failure mode:** flake-risk
- **Why it matters:** it reddens the local Windows run intermittently.
- **Suggested response:** defer-with-rationale — Windows-only (the subprocess briefly
  holds a handle when `rmSync` runs); it does not occur on the Linux CI runner, all 83
  tests pass, and it cleared on re-run. Documented as cosmetic debt for a future teardown
  hardening; orthogonal to INT-0011.

## Confidence
proceed-with-caveats
