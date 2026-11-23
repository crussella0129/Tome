# Sprint 25 Research Report

## Intents Reviewed
- [INT-0030](../../../intents/INT-0030-mathematics-and-code.md) — revised; relevance: the sprint's target, formulas in Markdown and in Word documents laid out as equations; whole LaTeX and Typst documents were moved out of it, the engines tried were recorded, and two criteria were added; current state: proposed.
- [INT-0033](../../../intents/INT-0033-latex-and-typst-documents.md) — created; relevance: reading a `.tex` or `.typ` document as a tome, split from INT-0030; not this sprint's work; current state: proposed.
- [INT-0029](../../../intents/INT-0029-documents-as-tomes.md) — selected (compatibility boundary); relevance: the Word converter whose `[equation not shown]` mark this sprint replaces by the equation; current state: realized.
- [INT-0027](../../../intents/INT-0027-cruor-typefaces.md) — selected (constraint); relevance: Cruor is to become Tome's typeface, so the way formulas are laid out must be able to take a Cruor mathematical font when one exists; current state: proposed.
- [INT-0008](../../../intents/INT-0008-in-book-search.md) — selected (compatibility boundary); relevance: search reads each chapter's Markdown, which will now hold LaTeX notation; current state: realized.
- [INT-0026](../../../intents/INT-0026-document-editor.md) — selected (constraint); relevance: a converted document should stay one a person could edit, which decides how a Word equation is carried over; current state: proposed.

## 1. Sprint Goal
Lay out mathematics. A formula written in LaTeX notation in any Markdown
chapter, within a line (`$…$`) or set apart (`$$…$$`), is shown as an
equation in every theme, in the browser and in both desktop apps, with
nothing fetched from the network and no script added to the page. A sum of
money written with a dollar sign stays a sum of money. An equation in a
Word document is carried over as LaTeX notation and laid out the same way,
in place of the mark Sprint 24 left. A formula that cannot be read is shown
as typed and named in the build's output. Reading whole LaTeX or Typst
documents is recorded as INT-0033 and is not built in this sprint; nor are
the Cruor typefaces, theme files or the editor.

## 2. Existing Code Survey
| File | Relevance | Notes |
|------|-----------|-------|
| astro.config.mjs | high | The Markdown settings: highlighting off, one remark plugin (`remarkAlerts`). The formula steps are added here, so every chapter of every tome gets them |
| scripts/remark-alerts.mjs | medium | The pattern for a Markdown plugin of Tome's own, with its unit test |
| src/pages/[...slug].astro | medium | Renders each chapter; a formula is part of the chapter's HTML and needs no change here unless the math stylesheet is loaded per page |
| src/layouts/BookLayout.astro | high | The reader is a grid. In Safari's engine a formula table inside a grid item loses its width (trial, section 4), so the correction is needed in Tome |
| src/styles/prose.css | high | Styles for code and tables in a chapter; gains the styles for formulas, for a set-apart formula that is wider than the column, and for a formula that could not be read |
| src/styles/tokens.css | medium | Font and colour tokens per theme; a token for the mathematical font belongs here, so a theme can change it later (INT-0028) |
| src/styles/fonts.css | medium | How the text fonts are declared; the mathematical font is declared beside them |
| scripts/fetch-fonts.mjs | medium | Fetches the text fonts at build because they may not be committed; the mathematical font comes from `npm` under an open licence, so it needs no fetch |
| src/styles/sanguine.css | low | The Sanguine theme; formulas must follow its colour, which all three engines did |
| src/styles/print.css | low | Printing; a formula must not be cut at a page's edge |
| src/lib/search-index.ts | high | Reads each chapter's raw Markdown with a parser that does not know formulas, so `$\frac{a}{b}$` is indexed as typed. What search makes of a formula is to be decided |
| scripts/docx-to-markdown.mjs | high | `markUnreadable` replaces each Word equation by `[equation not shown]` and counts it. The equation is converted here instead; one that cannot be keeps the mark |
| scripts/document-stage.mjs | medium | Builds the "left out" report for a document; equations carried over leave it, those that could not be stay in it |
| fixtures/word/paper/ | medium | The Word fixture already holds two equations (a fraction within a line and one set apart); it gains harder ones |
| scripts/check-documents.mjs | medium | The documents gate asserts the equation mark today; that assertion changes |
| e2e/documents.spec.ts | medium | The same, in the browser |
| playwright.config.ts | high | Chromium only. A WebKit project for the formula checks is new; WebKit for the test runner is installed here, and CI installs only Chromium today |
| .github/workflows/ci.yml | medium | Installs Chromium for the end-to-end tests; gains WebKit and its system packages on Ubuntu |
| src-tauri/tauri.conf.json | low | No content security policy in either desktop app, so inline styles on a formula and a bundled font load |
| src/content/books/tome/ | medium | The tutorial book; gains a chapter on writing formulas. It holds a dollar sign only inside code today, so the new rule changes nothing in it |

## 3. External Sources
- [remark-math](https://github.com/remarkjs/remark-math/tree/main/packages/remark-math) — reads `$…$` and `$$…$$` in Markdown and hands each formula on as a `code` element with the class `language-math`; `singleDollarTextMath` is on by default and is all or nothing, which is why a rule of Tome's own is needed for money.
- [rehype-katex](https://github.com/remarkjs/remark-math/tree/main/packages/rehype-katex) — lays those elements out with KaTeX when the page is built; the page must load KaTeX's stylesheet and fonts.
- [rehype-mathjax](https://github.com/remarkjs/remark-math/tree/main/packages/rehype-mathjax) — the same with MathJax, as SVG by default, needing no stylesheet or font.
- [Temml documentation](https://temml.org/docs/en/administration) — `renderToString(tex, { displayMode, throwOnError, annotate, … })` writes MathML; supports the AMS environments, `\tag` and `\label`; references to an equation only through a step run in the browser; its stylesheets name the mathematical fonts it was tested with.

## 4. Risks, Unknowns, Dependencies
- **Risk — the browser's own mathematics differs between engines.** The
  trial found three faults in Safari's engine and a tested correction for
  each (`math-trial.md`, section 4). More may exist in constructs the trial
  did not reach. Only a gate that lays formulas out in WebKit keeps this
  honest; without one the choice of MathML is not safe.
- **Risk — CI cost.** WebKit for the test runner needs its own download and
  system packages on Ubuntu. If CI cannot carry it, the WebKit check runs
  only on a developer's machine and the report must say so.
- **Risk — the dollar sign.** Every book Tome reads is affected. The rule
  tried leaves prices alone in fifteen sample lines, and a formula it
  refuses can be written `$$…$$`. A book with unusual dollar signs may
  still surprise its owner; the build should make a formula's presence easy
  to see.
- **Risk — a long formula.** A set-apart formula wider than the reading
  column must scroll within itself, not widen the page, on a phone
  especially. Not tried.
- **Risk — mdBooks written for mdBook's own mathematics** use `\\( … \\)`
  and `\\[ … \\]`. Tome will not lay those out. Stated in the tutorial; a
  matter for INT-0032.
- **Unknown — Firefox.** Not tried: its browser for the test runner is not
  installed. Temml is developed against Firefox, so it is the least likely
  to disappoint, but that is not evidence.
- **Unknown — search.** Whether a formula's source is searchable as typed,
  left out, or reduced to its letters.
- **Unknown — Word files in the wild.** The trial used hand-written
  equation markup. The owner's own paper, or a Google Docs download with
  equations, should be read at the Test phase.
- **Unknown — "OpenMath".** INT-0030 reads the owner's word as "everything
  mathematics needs". The plan states that reading for the owner to
  confirm.
- **Dependency:** `remark-math` 6.0.0 and `temml` 0.14.0 (MIT), both run
  only when the library is built. `@fontsource/stix-two-math` 5.3.0 (the
  STIX Two Math font, SIL Open Font Licence), installed by `npm`, never
  committed. `@xmldom/xmldom`, already present through the Word reader, to
  read Word's equation markup.
- **Dependency — none on Cruor.** Formulas are set in STIX Two Math until
  Cruor has its mathematical symbols and MATH table. The font is one token
  in the stylesheet, so the change is one line when it comes.

## 5. Recommended Approach
Primary: lay formulas out as the browser's own mathematics (MathML),
written by Temml when the library is built, set in a mathematical font
bundled with Tome. Add `remark-math`, the money rule, and one rehype step
of Tome's own that turns each formula into MathML, writes equation numbers
down the page, wraps a set-apart formula so Safari's engine keeps its
width, and shows an unreadable formula as typed while naming it in the
build's output. Convert a Word document's equations to LaTeX notation with
a converter of Tome's own (about thirty rules), leaving the existing mark
where a rule is missing. Cover it with unit tests of the money rule, the
rehype step and the Word converter; a build gate over a page of formulas;
and a browser check in Chromium and in WebKit. Add a tutorial chapter.

Alternative considered: KaTeX. It looks the same in every engine without
any correction of Tome's, and would be the safer choice if formulas were
never to be set in anything but KaTeX's own typeface. It carries about
300 KB of fonts and a stylesheet, and a page of formulas is five times the
size.

Alternative considered: MathJax as drawn shapes. The same everywhere with
nothing else to ship, but the pages are ten times the size and a formula's
text cannot be selected.

Alternative considered: carry a Word equation over as finished MathML. The
converted Markdown would then hold a block nobody could edit, and the
MathML the existing package writes uses elements browsers no longer lay
out.

Rationale: the owner's plan is for Tome to be set in Cruor, and Cruor is
to have a MATH table. Only the browser's own mathematics lays a formula out
from the font it is given; the other two would keep formulas in their own
typeface for good, beside Cruor text. It is also a web standard that needs
nothing of Tome at reading time, which suits a place meant to last. Its
cost is that engines differ; the trial found the differences that matter
for INT-0030's criteria and a correction for each, and the plan must hold
them with a WebKit gate. The engine is the owner's choice: the plan puts
it to them with the side-by-side captures.

## Artifacts
- `math-trial.md` — the trial: three engines on one sample, the rule for sums of money with its code and results, the faults found in Safari's engine and their corrections, and Word's equations converted.
- `evidence/compare-chromium-paper.png` — the three engines side by side in Chromium.
- `evidence/compare-webkit-paper.png` — the same in WebKit, with the corrections applied to the MathML column.
- `evidence/compare-chromium-sanguine.png` — the same on the Sanguine ground, Chromium.
- `evidence/compare-webkit-sanguine.png` — the same on the Sanguine ground, WebKit.
- `evidence/word-equations-chromium.png` — Word equations: straight to MathML, as LaTeX, and that LaTeX laid out.
