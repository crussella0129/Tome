# Sprint 0 Test Report

## Intent Verification
| Intent | Acceptance criterion | EARS / tests | Result | Intent evidence update |
|--------|----------------------|---------------|--------|------------------------|
| [INT-0001](../../../intents/INT-0001-tome-ink-on-paper-mdbook-viewer.md) | 1 — parse SUMMARY (parts, prefix/suffix, nesting, drafts, separators) | T-003 / `test_summary_*` (5) | pass | Test evidence links this report |
| [INT-0001](../../../intents/INT-0001-tome-ink-on-paper-mdbook-viewer.md) | 2 — sidebar TOC, select a chapter, read it, prev/next | T-004 `test_sidebar_lists_chapter_links`/`_marks_current`; T-005 `test_reader_renders_chapter_and_toc`, `test_book_routes_generated`, `test_pager_prev_next` | pass | Test evidence links this report |
| [INT-0001](../../../intents/INT-0001-tome-ink-on-paper-mdbook-viewer.md) | 3 — ink-on-paper surface, body text ≥ WCAG AA | T-002 `test_ink_on_paper_contrast_aa`, `test_paper_theme_active`, `test_dark_theme_active` | pass | Test evidence links this report |
| [INT-0001](../../../intents/INT-0001-tome-ink-on-paper-mdbook-viewer.md) | 4 — everything via `--theme-*` tokens; no raw values in components | T-002 `gate_neutronium_audit` | pass | Test evidence links this report |
| [INT-0001](../../../intents/INT-0001-tome-ink-on-paper-mdbook-viewer.md) | 5 — Markdown element coverage (headings, lists, code, quotes, tables, links, images) | T-005 `test_chapter_code_block_styled`, `test_chapter_prose_elements_styled` | partial | begun; images deferred (see critique C-001) |
| [INT-0001](../../../intents/INT-0001-tome-ink-on-paper-mdbook-viewer.md) | 6 — designed states, theme switch, prefers-reduced-motion | T-004 `test_sidebar_toggle_collapses`, `test_sidebar_focus_visible`; `test_dark_theme_active` | pass (partial) | reduced-motion implemented in tokens, not E2E-asserted; begun |
| [INT-0001](../../../intents/INT-0001-tome-ink-on-paper-mdbook-viewer.md) | 7 — `astro check` clean, audit clean, wired gates green | T-001 `gate_astro_check`/`gate_astro_build`; `gate_neutronium_audit` | pass | Test evidence links this report |

INT-0001 is a whole-project intent; Sprint 0 fully satisfies criteria 1–4 and 7
and begins 5–6. It therefore stays `active` (not `realized`) — later sprints
complete the remaining criteria.

## Summary
- Unit tests: 18 passed / 0 failed / 18 total
- Integration tests: 3 passed / 0 failed / 3 total (in the same Vitest run; 21 total Vitest)
- E2E tests: 6 passed / 0 failed / 6 total
- CI status: not-configured

## CI Confirmation
- **Head SHA:** `3e950befa8e9047cf9eca77ae765bc5787e8a324` (implementation under test; the Test Phase then extended `e2e/reader.spec.ts` for criterion-5 coverage)
- **CI run:** none
- **Conclusion:** success (local)
- **Confirmations:** CI not configured — local confirmations only:
  - `npx vitest run` → `Test Files 4 passed (4) · Tests 21 passed (21)`
  - `npx playwright test` → `6 passed (3.1s)`
  - `npx astro check` → `0 errors, 0 warnings, 0 hints`
  - `npx astro build` → 5 static routes (`/`, `/getting-started`, `/components`, `/components/panels`, `/about`)
  - `bash <neutronium>/scripts/audit.sh src/` → audit passed

## Failures
None.

## Technical Debt Identified
- Criterion 5 **image** rendering styled in `prose.css` but unexercised (no image in the sample book) — add an image-bearing chapter in a later sprint.
- `prefers-reduced-motion` honoured in tokens but not asserted by an E2E test.
- Mekzantine loads from a CDN; self-hosting the woff2 is a planned hardening (fallback stack already in place).
- No CI workflow yet; the remote profile (github/dev) exists but is unwired.

## Coverage Observations
Every locked EARS clause has at least one named, executed, passing test, and
every intent acceptance criterion the sprint targets is verified or explicitly
begun-with-deferral. Assertions check the SHALL response directly (exact theme
`rgb`, contrast ≥ 4.5, `aria-current`, `:focus-visible` + non-zero outline,
bordered panels). Tests are deterministic: inline SUMMARY fixtures, a bundled
sample book, and Playwright against a fresh production build.
