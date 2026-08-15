Finalized - DO NOT EDIT

# Sprint 13 Build Plan

## Intents
- [INT-0011](../../../intents/INT-0011-richer-content-rendering.md) — state: planned; acceptance criteria covered: 1, 2, 3, 4 (admonitions, footnote styling + rail filter, print stylesheet, and proof). On green, INT-0011 is eligible for `realized`.

## Schema Tree
- Sprint Goal: richer content rendering — admonitions, footnotes, print
  - Admonitions
    - T-029: remark alerts plugin + styling
  - Footnotes & print
    - T-030: footnote styling + rail filter + print stylesheet
  - Proof & docs
    - T-031: sample + E2E + README

## Execution Sequence

### T-029: Admonitions remark plugin + styling
- **Intent:** [INT-0011](../../../intents/INT-0011-richer-content-rendering.md)
- **Touches:** `scripts/remark-alerts.mjs` (new), `astro.config.mjs` (`markdown.remarkPlugins`), `package.json` (`unist-util-visit` direct dep), `src/styles/prose.css` (admonition styling), `src/lib/__tests__/remark-alerts.test.ts` (new)
- **Depends on:** (none)
- **Acceptance criterion:** INT-0011 criterion 1 — GitHub-style admonitions render as titled sacred blocks; ordinary blockquotes unchanged.
- **Success criterion (EARS):**
  - **WHEN** a blockquote's first paragraph begins with `[!TYPE]` (`TYPE` ∈ NOTE/TIP/IMPORTANT/WARNING/CAUTION, case-insensitive), **THEN** the plugin **SHALL** strip the marker, prepend an `admonition-title` paragraph carrying the type's label, and set the container to `<div class="admonition admonition-<type>">`.
  - **WHEN** a blockquote does not begin with a valid `[!TYPE]` marker, **THEN** it **SHALL** be left unchanged (still a `<blockquote>`).
- **Notes:** `visit(tree, 'blockquote', …)` from `unist-util-visit`; match `^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*` on the first paragraph's leading `text` node, strip the marker (and following newline), drop the paragraph if it becomes empty, then set `node.data.hName='div'` + `node.data.hProperties.className`. Sacred styling in `prose.css`: one panel form (bordered, hard offset), an uppercase title, and a restrained accent — the rubric/amber focus accent for the attention types (important/warning/caution), subdued ink for note/tip; no rainbow. Unit-tested on a `mdast-util-from-markdown` tree: a marker yields the `div` + classes + title; a plain blockquote is untouched.

### T-030: Footnote styling + rail filter + print stylesheet
- **Intent:** [INT-0011](../../../intents/INT-0011-richer-content-rendering.md)
- **Touches:** `src/styles/prose.css` (footnote styling), `src/pages/[...slug].astro` (drop `footnote-label` from the rail headings), `src/styles/print.css` (new), `src/styles/tokens.css` (import `print.css`)
- **Depends on:** (none)
- **Acceptance criterion:** INT-0011 criteria 2 (footnotes styled; rail clean) and 3 (print stylesheet).
- **Success criterion (EARS):**
  - **WHEN** a chapter has GFM footnotes, **THEN** the footnotes section, the superscript refs, and the back-references **SHALL** be styled in the sacred idiom, and the auto-generated `footnote-label` heading **SHALL NOT** appear in the "on this page" rail.
  - **WHEN** the page is rendered for `print` media, **THEN** the sidebar, the on-this-page rail, the search control, the pager, and the theme control **SHALL** be `display:none`, and the chapter **SHALL** flow full-width in ink-on-white.
- **Notes:** footnote styling targets `.footnotes`, `sup a[data-footnote-ref]`, `.data-footnote-backref`. Rail filter: `mod.getHeadings().filter((h) => h.depth >= 2 && h.depth <= 3 && h.slug !== 'footnote-label')`. `print.css` is a scoped `@media print` block, imported after the other layers in `tokens.css`.

### T-031: Sample + E2E + README
- **Intent:** [INT-0011](../../../intents/INT-0011-richer-content-rendering.md)
- **Touches:** a bundled sample chapter under `src/content/books/tome/`, `e2e/reader.spec.ts`, `README.md`
- **Depends on:** T-029, T-030
- **Acceptance criterion:** INT-0011 criterion 4 — the features work in a real browser and the sample demonstrates them.
- **Success criterion (EARS):**
  - **WHEN** the sample chapter (with an admonition + a footnote) is built, **THEN** the E2E **SHALL** find the admonition block (its `admonition-<type>` class + title) and a footnote reference that links to its note and back; **WHEN** `print` media is emulated, **THEN** the sidebar / rail / search / pager **SHALL** be hidden.
- **Notes:** add a tasteful `> [!NOTE]` (and/or `> [!WARNING]`) block + a `[^n]` footnote to a sample chapter. Playwright `emulateMedia({ media: 'print' })` asserts the chrome is `display:none`. README documents admonitions, footnotes, and printing.
