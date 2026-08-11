Finalized - DO NOT EDIT

# Sprint 0 Test Plan

## Intent Traceability
| Intent | Acceptance criterion | Build task / EARS clause | Verification |
|--------|----------------------|--------------------------|--------------|
| [INT-0001](../../../intents/INT-0001-tome-ink-on-paper-mdbook-viewer.md) | 7: `astro check` passes; gates green | T-001 / WHEN `astro check` runs THEN toolchain SHALL report zero errors | `gate_astro_check` |
| [INT-0001](../../../intents/INT-0001-tome-ink-on-paper-mdbook-viewer.md) | 7: build succeeds (Vite pin) | T-001 / WHEN `npm run build` runs THEN Astro SHALL emit a static build with no duplicate-Vite error | `gate_astro_build` |
| [INT-0001](../../../intents/INT-0001-tome-ink-on-paper-mdbook-viewer.md) | 3: body text meets WCAG AA on paper | T-002 / WHEN ink text sits on the paper ground in each theme THEN contrast SHALL be ≥ 4.5:1 | `test_ink_on_paper_contrast_aa` |
| [INT-0001](../../../intents/INT-0001-tome-ink-on-paper-mdbook-viewer.md) | 4: token layer, no raw values in components | T-002 / WHEN the audit scans `src/` THEN it SHALL report zero raw-hex/arbitrary-value violations | `gate_neutronium_audit` |
| [INT-0001](../../../intents/INT-0001-tome-ink-on-paper-mdbook-viewer.md) | 3: ink-on-paper surface active | T-002 / WHEN `theme-ink-paper` is set THEN `--theme-background` SHALL resolve to the parchment token | `test_paper_theme_active` |
| [INT-0001](../../../intents/INT-0001-tome-ink-on-paper-mdbook-viewer.md) | 3: warm-dark theme active | T-002 / WHEN `theme-terminal-dark` is set THEN `--theme-background` SHALL resolve to the warm-dark token | `test_dark_theme_active` |
| [INT-0001](../../../intents/INT-0001-tome-ink-on-paper-mdbook-viewer.md) | 1: nested numbered chapters | T-003 / WHEN given nested numbered chapters THEN it SHALL preserve nesting depth | `test_summary_nested_chapters` |
| [INT-0001](../../../intents/INT-0001-tome-ink-on-paper-mdbook-viewer.md) | 1: part titles | T-003 / WHEN given a part-title line THEN it SHALL emit a part-title node | `test_summary_part_title` |
| [INT-0001](../../../intents/INT-0001-tome-ink-on-paper-mdbook-viewer.md) | 1: prefix/suffix chapters | T-003 / WHEN given a prefix or suffix chapter THEN it SHALL mark it prefix/suffix | `test_summary_prefix_and_suffix` |
| [INT-0001](../../../intents/INT-0001-tome-ink-on-paper-mdbook-viewer.md) | 1: draft entries | T-003 / WHEN given a draft entry THEN it SHALL mark the node draft with no href | `test_summary_draft_entry` |
| [INT-0001](../../../intents/INT-0001-tome-ink-on-paper-mdbook-viewer.md) | 1: separators | T-003 / WHEN given a separator THEN it SHALL emit a separator node | `test_summary_separator` |
| [INT-0001](../../../intents/INT-0001-tome-ink-on-paper-mdbook-viewer.md) | 2: sidebar lists chapters | T-004 / WHEN TocSidebar renders with a toc THEN it SHALL render every linkable chapter as an anchor | `test_sidebar_lists_chapter_links` |
| [INT-0001](../../../intents/INT-0001-tome-ink-on-paper-mdbook-viewer.md) | 2: current chapter marked | T-004 / WHEN a toc entry matches the active slug THEN it SHALL carry `aria-current="page"` | `test_sidebar_marks_current` |
| [INT-0001](../../../intents/INT-0001-tome-ink-on-paper-mdbook-viewer.md) | 6: collapse interaction | T-004 / WHEN the collapse toggle is activated THEN the open-state SHALL flip | `test_sidebar_toggle_collapses` |
| [INT-0001](../../../intents/INT-0001-tome-ink-on-paper-mdbook-viewer.md) | 6: focus-visible state | T-004 / WHEN a sidebar anchor is focused THEN a visible focus-visible indicator SHALL be present | `test_sidebar_focus_visible` |
| [INT-0001](../../../intents/INT-0001-tome-ink-on-paper-mdbook-viewer.md) | 2: chapter renders in layout | T-005 / WHEN a chapter route is requested THEN it SHALL render the Markdown as HTML in BookLayout with the sidebar | `test_reader_renders_chapter_and_toc` |
| [INT-0001](../../../intents/INT-0001-tome-ink-on-paper-mdbook-viewer.md) | 5: code block styling | T-005 / WHEN a chapter has a fenced code block THEN it SHALL render inside sacred code styling | `test_chapter_code_block_styled` |
| [INT-0001](../../../intents/INT-0001-tome-ink-on-paper-mdbook-viewer.md) | 5: prose element styling | T-005 / WHEN a chapter has headings/lists/blockquote THEN each SHALL carry sacred prose styling | `test_chapter_prose_elements_styled` |
| [INT-0001](../../../intents/INT-0001-tome-ink-on-paper-mdbook-viewer.md) | 2: prev/next movement | T-005 / WHEN on a chapter with an adjacent chapter THEN a prev/next link SHALL be present | `test_pager_prev_next` |

## Unit Tests

### T-002 unit tests
- **Intent:** [INT-0001](../../../intents/INT-0001-tome-ink-on-paper-mdbook-viewer.md)
- `test_ink_on_paper_contrast_aa`: for **each** theme in `src/styles/theme.ts` (`theme-ink-paper`, `theme-terminal-dark`), the WCAG contrast ratio between its `text` and `background` colors → ≥ 4.5:1. Covers T-002 EARS clause 1.
- Stubs: none (pure color math against the theme constants module).

### T-003 unit tests
- **Intent:** [INT-0001](../../../intents/INT-0001-tome-ink-on-paper-mdbook-viewer.md)
- `test_summary_nested_chapters`: numbered list with 2 levels of nesting → tree where child node is under its parent at depth 2. (EARS clause 1)
- `test_summary_part_title`: input with `# Part One` → a `part-title` node with text "Part One". (EARS clause 2)
- `test_summary_prefix_and_suffix`: top-level links before the numbered list → `prefix`; after `---` following the numbered list → `suffix`. (EARS clause 3)
- `test_summary_draft_entry`: `- [Draft]()` → node `{ kind: 'chapter', draft: true, href: undefined }`. (EARS clause 4)
- `test_summary_separator`: `---` line → a `separator` node in output order. (EARS clause 5)
- Stubs: none (pure parser; fixtures are inline SUMMARY.md strings).

### T-004 component tests (`@solidjs/testing-library`)
- **Intent:** [INT-0001](../../../intents/INT-0001-tome-ink-on-paper-mdbook-viewer.md)
- `test_sidebar_lists_chapter_links`: render `TocSidebar` with a fixture toc of N linkable chapters → N `<a>` with matching `href`s. (T-004 EARS clause 1)
- `test_sidebar_marks_current`: render with `activeSlug` set to one entry → that anchor has `aria-current="page"`, others do not. (T-004 EARS clause 2)
- `test_sidebar_toggle_collapses`: click the collapse toggle → the sidebar root's collapsed state/class flips; click again → restores. (T-004 EARS clause 3)
- Stubs: fixture `BookToc`; `localStorage` from jsdom.

### T-005 component tests
- **Intent:** [INT-0001](../../../intents/INT-0001-tome-ink-on-paper-mdbook-viewer.md)
- `test_pager_prev_next`: given a chapter with previous and next neighbors, `Pager` renders a prev link to the previous href and a next link to the next href; at the first chapter the prev link is absent/disabled, at the last the next link is absent/disabled. (T-005 EARS clause 4)
- Stubs: fixture neighbor chapter objects.

## Integration Tests

### Book routing integration
- **Intents:** [INT-0001](../../../intents/INT-0001-tome-ink-on-paper-mdbook-viewer.md)
- `test_book_routes_generated`: composes **T-003 clause 4** (draft → no href) and **T-005 clause 1** (a requested chapter route renders) — parse the bundled sample `SUMMARY.md`, then assert `[...slug].astro`'s `getStaticPaths` yields exactly one route per **non-draft** chapter (draft entries produce no route), and each route's slug matches the parsed href. Verifies the parser → route-generation seam (integration composition, not a new clause).

## End-to-End Tests
- **Status:** possible (Playwright against the production build).
- `test_reader_renders_chapter_and_toc`: load a chapter page → the sidebar lists the sample book's chapters AND the chapter's Markdown (its `<h1>` + body) is rendered in the content region. (T-005 EARS clause 1)
- `test_chapter_code_block_styled`: on a chapter containing a fenced code block → the rendered `<pre>`/code carries the sacred code styling (monospace computed font + bordered panel class). (T-005 EARS clause 2)
- `test_chapter_prose_elements_styled`: on a chapter with headings/lists/blockquote → each element carries the sacred prose styling. (T-005 EARS clause 3)
- `test_paper_theme_active`: default load → computed `--theme-background` equals the parchment token value. (T-002 EARS clause 3)
- `test_dark_theme_active`: after switching to `theme-terminal-dark` → computed `--theme-background` equals the warm-dark token value. (T-002 EARS clause 4)
- `test_sidebar_focus_visible`: Tab to a sidebar anchor → a visible focus-visible outline/indicator is applied (non-empty computed outline or focus style). (T-004 EARS clause 4)

### Gates (enabling, T-001)
- `gate_astro_check`: `npx astro check` → zero errors. (T-001 EARS clause 1)
- `gate_astro_build`: `npm run build` → static build, no duplicate-Vite plugin error. (T-001 EARS clause 2)
- `gate_neutronium_audit`: `bash <neutronium-skill>/scripts/audit.sh src/` → no violations. (T-002 EARS clause 2)
