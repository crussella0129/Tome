Finalized - DO NOT EDIT

# Sprint 13 Test Plan

## Intent Traceability
| Intent | Acceptance criterion | Build task / EARS clause | Verification |
|--------|----------------------|--------------------------|--------------|
| [INT-0011](../../../intents/INT-0011-richer-content-rendering.md) | 1 — admonition transform; plain blockquote unchanged | T-029 / WHEN `[!TYPE]` THEN div+classes+title; else unchanged | `test_remark_alerts_transforms`, `test_remark_alerts_leaves_plain_blockquote` |
| [INT-0011](../../../intents/INT-0011-richer-content-rendering.md) | 2 — footnotes styled; rail excludes `footnote-label` | T-030 + T-031 / footnote chain styled; rail filter | `test_reader_footnote_links`, `test_rail_excludes_footnote_label` (build) |
| [INT-0011](../../../intents/INT-0011-richer-content-rendering.md) | 3 — print hides chrome | T-030 / WHEN print media THEN chrome display:none | `test_reader_print_hides_chrome` |
| [INT-0011](../../../intents/INT-0011-richer-content-rendering.md) | 1/4 — admonition renders in browser | T-031 / admonition block + title present | `test_reader_admonition_rendered` |

## Unit Tests
### T-029
- **Intent:** [INT-0011](../../../intents/INT-0011-richer-content-rendering.md)
- `test_remark_alerts_transforms` (`remark-alerts.test.ts`): parsing `> [!WARNING]\n> Be careful.`
  and running the plugin yields a `blockquote` node with `data.hName='div'`,
  `hProperties.className` including `admonition` + `admonition-warning`, a leading
  `admonition-title` paragraph ("Warning"), and the body text `Be careful.` with the
  marker removed. Case-insensitive (`[!note]` → `admonition-note`).
- `test_remark_alerts_leaves_plain_blockquote` (`remark-alerts.test.ts`): a blockquote
  without a marker (`> Just a quote.`) is unchanged (no `hName`, no admonition class);
  a bogus marker (`> [!FOO]`) is also left as a plain blockquote.

## End-to-End / Build Tests
### T-030 / T-031
- **Intent:** [INT-0011](../../../intents/INT-0011-richer-content-rendering.md)
- `test_reader_admonition_rendered` (`e2e/reader.spec.ts`): the sample chapter renders a
  `.admonition.admonition-note` (or `-warning`) block with its title text visible.
- `test_reader_footnote_links` (`e2e/reader.spec.ts`): a footnote ref (`sup a[data-footnote-ref]`)
  links to `#…fn-…`; the footnote's back-reference (`.data-footnote-backref`) links back to
  the ref; both resolve to elements on the page. **Also asserts the sacred styling applied
  (C-001):** the footnotes `<section>` has a non-zero top border (the sacred set-off rule)
  and the ref is rendered superscript (`vertical-align: super`), mirroring
  `test_chapter_prose_elements_styled`'s computed-style pattern.
- `test_reader_print_hides_chrome` (`e2e/reader.spec.ts`): with `emulateMedia({ media: 'print' })`,
  the sidebar (`nav[aria-label="Table of contents"]`), the on-this-page rail, the search
  trigger, and the pager compute `display:none`, while the chapter article remains visible.
- `test_rail_excludes_footnote_label` (build assertion, in `check`/inline): the built sample
  chapter's on-this-page rail contains no `#footnote-label` link even though the footnotes
  section renders. (Verified by grepping the built HTML during the Build Phase.)

## Regression
Full Vitest + Playwright (existing 12) + `check_external_build` / `check_multibook` /
`check_search` / `check_live_reload` + `astro check` + audit stay green. Ordinary
blockquotes render unchanged; chapters without admonitions/footnotes are unaffected;
the print rules are inert on screen.
