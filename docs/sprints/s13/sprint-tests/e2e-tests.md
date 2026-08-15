# Sprint 13 E2E Tests (Playwright)

`npx playwright test` → **15 passed / 0 failed / 15 total**. New this sprint
(`e2e/reader.spec.ts`):

- `test_reader_admonition_rendered` (INT-0011 #1/#4) — the sample `/getting-started`
  renders `.admonition.admonition-tip` (title "Tip") and `.admonition.admonition-warning`
  (title "Warning").
- `test_reader_footnote_links` (INT-0011 #2) — the ref `sup a[data-footnote-ref]` →
  `#user-content-fn-spine`; the footnotes `<section>` is styled (non-zero top border, the
  sacred set-off — C-001) and the ref is raised (Tailwind superscript, `top < 0`);
  activating the ref jumps to the note and the note's `.data-footnote-backref` points
  back to the ref.
- `test_reader_print_hides_chrome` (INT-0011 #3) — under `emulateMedia({ media: 'print' })`,
  the sidebar (`nav[aria-label="Table of contents"]`), `.searchbar`, `.rail-col`, and
  `.pager` compute `display:none`, while `article.tome-prose` stays visible.

## Regression (unchanged, green)
The prior 12 reader/search specs stay green — the sacred prose, code, image, theme,
reduced-motion, sidebar-focus, search, on-this-page, and keyboard-nav specs all pass
under the swapped Markdown processor.
