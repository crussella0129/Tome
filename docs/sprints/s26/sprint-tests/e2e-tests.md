# Sprint 26 End-to-End Verification

- **Tested code:** `ec59737`. Every suite and gate below was run on this
  Windows machine at that commit, in one pass with nothing changed in the
  checkout before or after, and each exited 0: `npx vitest run` (456
  passed, 1 skipped), `npx astro check`,
  `check:math`, `check:documents`, `check:external`, `check:multibook`,
  `check:search`, `npx playwright test` and `check:electron`, the last two
  with `TOME_CONFIG=fixtures/empty-library.toml`. They were run the same
  way, and passed, at the end of the build (`8353ba9`) and after each of the
  first four reviews' answers (`21ad786`, `2c27689`, `860b165`,
  `98e138e`). CI on Linux is cited in `test-report.md`.
- **Status:** possible, and run. Browsers: Chromium and WebKit as Playwright
  provides them.
- The answers to the reviews changed the reader, the writer and the stage,
  not the fixtures' result: the kept trees were remade at each change and
  the browser tests below are unedited, and all ten pass at the tested code.

## `check:documents`: its fourth build, the papers

The gate's three earlier builds and their checks are unchanged, and
`e2e/documents.spec.ts` ran as before: **6 passed, in Chromium**. Then the
gate builds a temporary folder holding copies of `fixtures/latex` and
`fixtures/typst`, checks what was built and printed, and runs
`e2e/papers.spec.ts` in two projects: **10 passed, 0 failed: the same five
tests in Chromium and in WebKit**.

| Check | Clause | What it found |
|---|---|---|
| gate `check_papers_routes` (`checkPapers()`) | T-093 1 | routes `/latex/paper`, `/typst/paper` and `/typst/uses-a-package`; no route whose address holds `appendix`, `closing` or `house`; the search index holds exactly those three addresses |
| gate `check_papers_output` (`checkPapers()`) | T-093 2 | of the lines the build printed, two say `left out`: one for `latex/paper.tex` naming `tikzpicture`, `\mycmd`, `\appcmd in appendix.tex`, `nowhere` and `missing`; one for `typst/uses-a-package.typ` with `the whole document` and `HOME not defined`; none for `typst/paper.typ` |

| Test | Clause | What it measured, in both engines |
|---|---|---|
| `test_papers_latex` | T-093 3 | one `h1`, `A Short Paper on Sums`; the paragraph after it is `A. Writer, B. Reader` in emphasis; then `Abstract`, then the abstract; the year of the build is nowhere in the paper. The five headings, each once, and the contents list reads `Introduction`, `The result`, `Lists and a table`, `Appendix`, `Closing`, `References`. `Theorem 1 (Gauss).` and `Proof.` with `By induction.`. 16 or more `math` elements, no `[equation not shown]`, no formula shown as typed. In the first set-apart formula the cell `(1)` has its right edge within 2 px of the box's; the second holds `(2)`. The link in "for its statement" reads `(1)`; clicked, the element its address names holds `(1)` and is in the viewport, and it is the one `id` in that formula. The link reading `2` after "See Section" leads to an anchor whose next block is `The result`, in the viewport. One table of four rows and three heading cells, its last row `3`, `6`, `9`, captioned `Table 1. The first three sums.`. One picture, decoded with a natural width above zero, from the page's own origin, captioned `Figure 1. A triangle of dots.`. The footnote's mark leads to `A note at the foot`. The citation reads `[1].`, its link leads into view, and `References` is followed by a list of one item, Gauss's book. The page's text holds `[LaTeX not shown]` three times and `and set x y apart.`; no link reads `LaTeX not shown`, `nowhere` or `missing`; `See [nowhere], the same book again [1, missing], and one page of it [1, p` as text; `It costs $5 to print this paper, and 50% of it is formulas.`. No `id` stands twice; every link in the paper beginning `#` names an element of the page. At 412 px the page's scroll width is no more than its window's |
| `test_papers_typst` | T-093 4 | one `h1`; the five headings; `A. Writer` once in the paper; 15 or more `math` elements, none left out or shown as typed; a list, a table of four rows, one picture decoded, the footnote; `the house says so, loudly!`. The link in the sentence about the statement reads `The result` and leads to an anchor whose next block is that heading, in the viewport; one link reads `the equation`. The citation reads `(Gauss 1801)`, its link leads into view, and the page's one heading `References` is an `H2` over `Gauss, Carl Friedrich. 1801. Disquisitiones Arithmeticae.`. Nothing reads `not shown`. No `id` twice, no dead link |
| `test_papers_refused` | T-093 5 | the page of `uses-a-package`: `[document not shown] uses-a-package.typ could not be read as a Typst document.`, and the sidebar's link to it |
| `test_papers_search` | T-093 6 | `zymurgy`, a word that stands only in the LaTeX paper's second file: one result, the LaTeX paper, which opens with the word on the page. `Closing`, the heading of a section read from a file in a folder of its own: two results, `/latex/paper#closing` and `/typst/paper#closing`; the first opens at that heading, in the viewport |
| `test_papers_sidebar` | T-093 7 | three chapters, `A Short Paper on Sums` twice and `uses-a-package`, at `/latex/paper`, `/typst/paper`, `/typst/uses-a-package`; the parts `latex` and `typst`; no address holds `appendix`, `closing` or `house` |

`test_papers_search` does not hold the plan's clause as written: see
"Departures" below.

## The other suites, unchanged and run

| Suite | Result | What it holds for this sprint |
|---|---|---|
| `npx playwright test` (default library, Chromium) | 40 passed | the reader, search, scaling and themes as before; `test_reader_math_chapter` opens *Write Mathematics*, which now names one of its equations and refers to it |
| `check:math` (`e2e/math.spec.ts`, Chromium and WebKit) | 22 passed | formulas are laid out and numbered as before T-090, which touched the step that lays them out |
| `check:external` | 3 passed | an external mdBook builds and reads as before |
| `check:multibook`, `check:search` | exit 0 | several tomes, and search across them, as before |
| `check:electron` | 7 passed | the desktop app opens the guide, *Write Mathematics* among its chapters |

## By eye

Captured at the tested head from a build of the two fixtures, at 1100 by 900,
into `evidence/`:

- `latex-light-chromium.jpg`, `latex-dark-chromium.jpg`,
  `latex-sanguine-chromium.jpg` and the same three for WebKit: the paper's
  title, authors and abstract, the links reading `[1]`, `2` and `(1)`, the
  theorem, and the numbered equation with `(1)` at the right edge.
- `typst-…` the same six for the Typst paper.
- `latex-table-figure-chromium.jpg`, `typst-table-figure-chromium.jpg`: the
  table, its caption, the picture and its caption.
- `latex-marks-chromium.jpg`: the list, the table and figure, the code, the
  three marks in their places, `[nowhere]` and `[1, missing]`.

What the eye adds to the tests: in all three themes and both engines the
formulas take the theme's colour and sit on the text's line; the anchors
written before headings add no visible gap. Two things a person may want
changed, neither a fault of this sprint's making: paragraphs in a paper stand
close together (the authors' line, `Abstract` and the abstract read as one
block, and a caption sits hard under its table), which is the reader's
existing spacing for any chapter; and the fixture's picture is 24 pixels
wide, so the figure looks small.

## Not run

- Safari itself, on macOS or iOS. WebKit as Playwright builds it is Safari's
  engine, not Safari.
- Firefox.
- The Tauri app's window. Its engines are the two tested.
- A paper written by anyone but this sprint's author. The owner was asked
  for one twice and none has been given; fetching one from elsewhere is a
  download the owner has not allowed.
- `check:livereload`, which this sprint's changes do not reach (live reload
  is off for documents, papers among them).

## Departures from the test plan, in these tests

- **Search.** The plan's clause says a word standing only in the LaTeX
  paper's appendix gives a result that "SHALL be the paper's `Appendix`
  section and SHALL open at it". Tome's search opens a section only for a
  match in a heading's own words, and the chapter for a match in its text
  (INT-0008, not changed here). `test_papers_search` holds what search does
  (above). Recorded in `sprint-meta.md`, Blockages. T-093 clause 6 is
  therefore not met: INT-0008 AC2 promises it ("deep-links to the most
  relevant heading when the match is within a section"), and backlog task
  T-096 carries it.
- **Names.** The plan calls the two gate checks `check_papers_routes` and
  `check_papers_output`; both are in the one function `checkPapers()` of
  `scripts/check-documents.mjs`, under comments of those names.
- **"Into view"** for an anchor of Tome's own is measured on the block
  directly after it, since the anchor is an empty mark with no height.
