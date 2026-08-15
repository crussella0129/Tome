# Sprint 13 Research Report

## Intents Reviewed

- [INT-0011 — Richer content rendering (admonitions, footnotes, print)](../../intents/INT-0011-richer-content-rendering.md)
  — **created** this sprint (`proposed`). A distinct content-fidelity outcome after
  navigation (INT-0010) and search (INT-0008); a new chapter.

## 1. Sprint Goal

Three content-fidelity features, all server-rendered: GitHub-style **admonitions**
(`> [!TYPE]` → titled sacred blocks, via a build-time remark plugin); **footnote**
sacred styling + keeping the auto "Footnotes" label out of the on-this-page rail;
and a **print stylesheet** (`@media print`) that hides the app chrome for a clean
chapter PDF. Delivers INT-0011's four criteria.

## 2. Existing Code Survey

| File | Relevance |
|------|-----------|
| astro.config.mjs | `markdown: { syntaxHighlight: false }` — add `remarkPlugins: [remarkAlerts]`. The plugin lives beside the other build scripts. |
| src/styles/prose.css | Styles `.tome-prose blockquote/code/pre/table`. Gets the admonition + footnote styling (sacred panels, superscript refs, backref). |
| src/pages/[...slug].astro | Computes the rail headings from `mod.getHeadings()`; add a filter dropping the GFM `footnote-label` heading (criterion 2). |
| src/components/OnThisPage.tsx | The rail — the `footnote-label` filter can also/instead live here; chosen at plan time. |
| src/styles/tokens.css | Imports the style layers + owns the `--theme-*` palette the admonition accents draw from; will import a new `print.css`. |
| src/content/books/tome/*.md | The bundled sample — add an admonition + a footnote to a chapter to demonstrate (criterion 4) and drive the E2E. |
| e2e/reader.spec.ts | Existing reader specs + `body.js-nav`/prose patterns; add admonition-renders, footnote-link, and print-hides-chrome checks. |
| package.json | Promote `unist-util-visit` (v5, already resolvable) to a direct dependency for the plugin. |
| README.md | Documents features; add a content-rendering note. |
| dist probe (this phase) | Empirical: GFM **footnotes already render** (`<section data-footnotes>`, `data-footnote-ref`, `.data-footnote-backref`), and `> [!NOTE]` stays a plain `<blockquote>` with literal `[!NOTE]` — so alerts need the plugin and footnotes need only styling. The `footnote-label` H2 currently leaks into `getHeadings()` → the rail. |

## 3. External Sources

- [GitHub — alerts/admonitions syntax (`> [!NOTE]` …)](https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax#alerts)
- [remark — authoring plugins; `data.hName`/`hProperties` for the rehype element](https://github.com/remarkjs/remark/blob/main/doc/plugins.md)
- [unist-util-visit — tree traversal](https://github.com/syntax-tree/unist-util-visit)
- [GFM footnotes (remark-gfm, on by default in Astro)](https://github.com/remarkjs/remark-gfm)
- [MDN — printing & `@media print`](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_media_queries/Printing)

## 4. Risks, Unknowns, Dependencies

- **Alert marker parsing.** `> [!NOTE]\n> text` parses to one blockquote paragraph
  with text `"[!NOTE]\ntext"`. Mitigation: match `^\[!(TYPE)\]\s*` on the first text
  node, strip it (+ the following newline), prepend a title paragraph, and set
  `data.hName='div'` + `hProperties.className`. Unit-test the transform on a parsed tree.
- **Not breaking ordinary blockquotes.** Only blockquotes whose first paragraph starts
  with a valid `[!TYPE]` are transformed; everything else is untouched (tested).
- **Footnote rail leak.** The GFM `footnote-label` heading appears in `getHeadings()`.
  Mitigation: filter `slug === 'footnote-label'` where the rail headings are computed.
- **Print fidelity.** Hidden chrome (sidebar/rail/search/pager/theme) + ink-on-white +
  no clipped grid columns. Mitigation: a scoped `@media print` block; verified by a
  Playwright `emulateMedia({ media: 'print' })` check that the chrome is `display:none`.
- **Aesthetic (no rainbow).** Five alert types must stay sacred. Mitigation: one panel
  form, title + restrained accent (rubric/amber for attention types, subdued for note/tip).
- **Dependency.** `unist-util-visit` promoted to a direct dep; no other new runtime dep.

## 5. Recommended Approach

- **Admonitions (T-029):** `scripts/remark-alerts.mjs` — a remark plugin visiting
  `blockquote` nodes; when the first paragraph's leading text is `[!TYPE]`, strip the
  marker, prepend a `admonition-title` paragraph with the type's label, and set the
  container to `<div class="admonition admonition-<type>">`. Wire into
  `astro.config.mjs` `markdown.remarkPlugins`. Sacred styling in `prose.css`. Unit-test
  the transform (parse → plugin → assert `hName`/classes/title; a plain blockquote is
  unchanged).
- **Footnotes + rail filter + print (T-030):** style `.footnotes`, the `sup`
  `data-footnote-ref`, and `.data-footnote-backref` in `prose.css`; filter
  `footnote-label` out of the rail headings; add `src/styles/print.css` (`@media print`)
  imported by `tokens.css`, hiding the chrome and formatting the chapter.
- **Sample + proof + docs (T-031):** add an admonition + a footnote to a sample chapter;
  E2E — the admonition renders with its class/title, a footnote ref links to its note
  and back, and under `print` media the sidebar/rail/search/pager are hidden; README
  documents admonitions, footnotes, and printing.

## Artifacts

- [INT-0011 — Richer content rendering](../../intents/INT-0011-richer-content-rendering.md) (created)
- This report; empirical render probe (footnotes render; `> [!NOTE]` does not);
  `unist-util-visit@5.1.0` resolvable; `markdown` config confirmed in `astro.config.mjs`.
