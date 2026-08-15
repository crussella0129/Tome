# INT-0011 — Richer content rendering (admonitions, footnotes, print)

<!-- sprint-loop-intent-v2 -->
- **Intent ID:** INT-0011
- **State:** realized
- **Work evidence:** [Sprint 13 build plan (T-029–T-031)](../sprints/s13/sprint-plans/build-plan.md)
- **Completion evidence:** [T-029–T-031 completion (Sprint 13)](../work/completed-tasks.md#t-029-sprint-13)
- **Code evidence:** [admonitions remark plugin](../../scripts/remark-alerts.mjs), [admonition + footnote styling](../../src/styles/prose.css), [print stylesheet](../../src/styles/print.css)
- **Test evidence:** [Sprint 13 test report](../sprints/s13/sprint-tests/test-report.md)
- **Documentation evidence:** [README — Content rendering](../../README.md#content-rendering)

## Intent

Render three content features real mdBooks rely on, so Tome is a faithful reader:
GitHub-style **admonitions/callouts** (`> [!NOTE]` … `NOTE`/`TIP`/`IMPORTANT`/
`WARNING`/`CAUTION`) as titled, sacred-styled blocks; **footnotes** (already parsed
by GFM) styled and navigable; and a **print stylesheet** that hides the app chrome
so a chapter prints or exports to PDF cleanly. All server-rendered — no new client
JavaScript.

## Acceptance criteria

1. A `> [!TYPE]` blockquote (`TYPE` ∈ NOTE/TIP/IMPORTANT/WARNING/CAUTION) renders as
   a titled admonition block (a container carrying `admonition` + `admonition-<type>`
   classes and a title), styled in the sacred idiom; an ordinary blockquote (no
   marker) is left unchanged.
2. GFM footnotes render with a working reference → footnote → back-reference chain,
   styled sacredly (the footnotes section, the superscript refs, the backref); the
   auto-generated "Footnotes" label does not appear in the "on this page" rail.
3. A print stylesheet hides the sidebar, the on-this-page rail, the search control,
   the pager, and the theme control, and formats the chapter for print (readable
   ink-on-white, nothing clipped), so the browser's Print / Save-as-PDF yields a
   clean chapter.
4. Tests prove the admonition transform, the footnote link chain, and that print
   media hides the chrome; the bundled sample demonstrates an admonition and a
   footnote.

## Rationale

Tome renders standard Markdown but not the admonitions and footnotes real
documentation uses, and its on-screen chrome makes printing/PDF messy. These are
fidelity gaps for a general mdBook reader, distinct from the navigation and search
outcomes already delivered.

## Alternatives

- Depend on a callout plugin (e.g. `remark-github-blockquote-alert`) or mdbook-admonish
  output. Rejected: a small custom remark plugin gives control over the sacred markup
  and the five types and keeps the toolchain lean (only `unist-util-visit`, already
  resolvable, promoted to a direct dependency).
- Render admonitions client-side. Rejected: a remark plugin renders them at build
  (zero JS), consistent with the rest of Tome.

## Consequences

- A remark plugin runs at build via `markdown.remarkPlugins`; footnotes need only
  styling (already parsed by Astro's default GFM); print is CSS-only (`@media print`).
- The admonition plugin's scope is a plain `[!TYPE]` marker at the very start of a
  blockquote's first paragraph; markup beyond that (inline-formatted markers, nested
  quotes) is out of scope.
- To avoid ink-on-paper "rainbow" slop, admonition types share one sacred panel form
  and are distinguished by their title plus a restrained accent (the rubric/amber
  focus accent for the attention types, subdued ink for note/tip).

## Transition history

- 2026-08-15: created as `proposed` during Sprint 13 research — a content-fidelity
  outcome (admonitions, footnote styling, print) after the reader's navigation and
  search were delivered.
- 2026-08-15: `proposed → planned` — Sprint 13 plans T-029 (admonitions remark plugin
  + styling), T-030 (footnote styling + rail filter + print stylesheet), and T-031
  (sample + E2E + README), covering all four criteria.
- 2026-08-15: `planned → active` — Sprint 13 Build Phase began implementing
  T-029–T-031 against the locked plans.
- 2026-08-15: `active → realized` — T-029–T-031 delivered all four criteria:
  GitHub-style admonitions via a remark plugin (`> [!TYPE]` → titled sacred blocks;
  plain blockquotes untouched), sacred footnote styling with the auto "Footnotes"
  heading filtered out of the on-this-page rail, and a print stylesheet hiding the
  chrome — all server-rendered, proven by 83 unit + 15 E2E and demonstrated in the
  sample. Enabling remark plugins required swapping this Astro's default Markdown
  processor to `@astrojs/markdown-remark`; the swap was validated regression-free
  across every build gate (heading-slug parity, image optimization, footnotes, code
  styling all preserved).
