# Sprint 25 End-to-End Verification

- **Tested head:** `0eb7dd4`. Every suite and gate below was run on this
  Windows machine at `b39d962` (the build's last task), at `1e782cf`, and
  at the head that answers each of four reviews of the tests (`9cf62ed`,
  `b452443`, `bf7ff46`, `0eb7dd4`), and each exited 0 every time: `npx
  playwright test`, `check:math`, `check:documents`, `check:external`,
  `check:multibook`, `check:search`, and `check:electron` with
  `TOME_CONFIG=fixtures/empty-library.toml`. `test-report.md`, written
  after the final review, cites the CI run on Linux.
- **Status:** possible, and run. Browsers: Chromium 151 and WebKit 26.5 as
  Playwright 1.62 provides them.

## `check:math`: formulas in two engines

`e2e/math.spec.ts` against the build of `fixtures/proofs/`, in two projects.
**22 passed, 0 failed: the same eleven tests in Chromium and in WebKit**
(twenty at `1e782cf`; one test was added and three were tightened to answer
the first review; the later reviews changed none of them). A test that passed in one engine only would be a failure; none
did. No test fetches the mathematical font: each waits until the page's own
formulas have brought a `Tome Math` face to `loaded`, then for
`document.fonts.ready`, before it measures. A page whose formulas did not
use the font would time out there.

| Test | Clause | What it measured, in both engines |
|---|---|---|
| `test_math_boxes` | T-081 5 | every `math` element on both pages is wider and taller than 1 px |
| `test_math_positions` | T-081 5 | the numerator's bottom is at or above the denominator's top; the radical sign's own ink, found by photographing the strip left of the fraction with the root shown and hidden, spans at least nine tenths of the fraction's height; the sum's upper limit is above the middle of its sign and the lower below; the matrix's four cells stand in two rows and two columns, each cell's padding is more than 1 px above and below, and the second row's letters begin below the first row's by at least that padding; its bracket is at least 1.5 times a bracket in a line; the two equals signs of the derivation line up within 1.5 px; a set-apart sum's sign is taller than one in a line |
| `test_math_equation_numbers` | T-081 6 | at 1100 px and at 390 px: `(1)`, `(2)`, `(3)` on the first page; `(1)`, `(2)`, `(7)` on the second; each within 4 px of its box's right edge and 24 px or more from its formula. The wide numbered equation fits at 1100 px and scrolls at 390 px, where its box is scrolled to its end first |
| `test_math_font_and_requests` | T-081 7 | a face `Tome Math` with status `loaded`, brought in by the page and not by the test; every `math` element's computed font family is one value and begins with `Tome Math`; `document.fonts.check()` true for `∑√α`; more than three `http` requests, all to the page's own origin, the font file among them; no console error |
| `test_math_theme_colour_and_paint` (three tests: Light, Dark, Sanguine Atonement) | T-081 8 | an inline formula's colour equals its paragraph's, a set-apart one's the prose's; a formula within a line, a set-apart fraction, and the formula in a heading each change at least 2% of the pixels of their box (the same rectangle of the page photographed with the element and with it hidden) |
| `test_math_phone_width` | T-081 9 | at 390 px neither page is wider than its window; no `.tome-math` or `.tome-math-long` is scrollable up and down; the wide set-apart formula and the wide numbered equation are wider inside than out with `overflow-x: auto`; the long inline formula's box ends inside its column |
| `test_math_rail` | T-081 10 | the rail lists `The E = mc² law`, linked to `#the-emc2-law`, and a plain heading as itself; following the entry from the foot of the page brings the heading into view |
| `test_math_search_opens_section` (added in the Test phase) | INT-0030 AC7; T-079 5, 9 | on the built pages, typing `mc2` into the search gives a first result that reads `The E = mc² law` and links to `/2-more#the-emc2-law`; following it opens that page with the heading in view; typing `alpha` gives a first result on the first page |
| `test_math_code_stays_code` | T-081 11 | `$x$` is one `code` element with no formula in it; the code block holds `'$5'`; the price line stands |

Two things were found by this check while it was being written, and fixed
before the task was committed: a matrix and a set of cases stood with their
rows run together in the real reader (a reset in Tome's stylesheet), and a
formula of 28 characters ran past its column in WebKit (the threshold for a
long formula's box). Both are in `sprint-meta.md`, Blockages.

## `check:documents`: a Word document's equations

`e2e/documents.spec.ts`, Chromium, against a folder of documents with two
Word papers. **6 passed, 0 failed.** `test_documents_word_chapter` (edited,
T-082 clause 10): the Word chapter shows no `[equation not shown]` and two
`math` elements; the one within a line has `Density is` directly before it
and `(see the table)` directly after, and holds an `mfrac`; one is set
apart; both have boxes. The other five tests are unedited.

## The default suite and the desktop app

- `npx playwright test` (Chromium, the bundled library): **40 passed, 0
  failed**; 39 before the sprint. The new one, `test_reader_math_chapter`
  (T-083 clause 3): the guide's chapter shows eight or more `math` elements,
  each wider and taller than 1 px, no error element, no `language-math`, its
  source in code, the price line, and its sidebar entry marked current.
- `check:electron`, run on the committed sample: **7 passed, 0 failed**; 6
  before. The new one, `test_electron_math_chapter` (T-083 clause 4): in the
  desktop app the chapter shows its formulas with boxes; a face `Tome Math`
  is loaded (by the page, not by the test), the formula's computed font
  family begins with `Tome Math`, and it is used for `∑√α`; every request
  went to `app://tome`, the font file among them.
- `check:external`, `check:multibook`, `check:search`: exit 0, unchanged.
- `check:livereload`, which Sprint 24 found intermittent (T-075), exited 0 on
  both of its two runs at `b39d962`. It was not run again at the later
  heads: nothing those commits change is read by it.

## Not run

- **Safari itself**, on a Mac, an iPhone or an iPad. Playwright's WebKit is
  the open-source build of Safari's engine, on Windows here and on Linux in
  CI; it is not Apple's browser, and its fonts and text are not Apple's.
- **Firefox.** Its browser for the test runner is not installed.
- **The Tauri app.** It has no automated run, and a native window cannot be
  looked at from this session, so the Windows build was not opened by eye
  either. Its engines are Chromium on Windows and WebKit on Linux and macOS,
  the two tested above.

## By eye

Captured at `9cf62ed` (no later commit changes what a page shows) from the
built site, 1100 px wide, full page, in
`evidence/` (the captures made at `b39d962` were replaced by these):

- the guide's chapter: `tutorial-{light,dark,sanguine}-{chromium,webkit}.jpg`;
- the first fixture page: `proof-1-…`; the second: `proof-2-…`;
- the document Word saved (`integration-tests.md`), at `1e782cf`:
  `word-saved-light-{chromium,webkit}.jpg`.

Looked at, at this head:

- **All twelve captures of the two fixture pages**: each page in Light, Dark
  and Sanguine Atonement, in Chromium and in WebKit. In every one: each
  formula stands where its source says; the fraction, both roots, the sum
  with its limits, the matrix and the cases are whole, with their rows
  apart; the derivation's equals signs are in line; numbers `(1)`, `(2)`,
  `(3)` and `(1)`, `(2)`, `(7)` are at the right edge; the formula in the
  heading is in the heading's colour and size; the rail reads `The E = mc²
  law`; the price line, the mistake shown as typed and underlined, and code
  are as written; formulas take the theme's colour.
- **The guide's chapter in all six**, cut into halves so the text could be
  read: both halves in Light in Chromium and in Dark in WebKit, and one
  half each in Light in WebKit, Dark in Chromium, and Sanguine Atonement in
  both engines. Each formula stands under its source; the new line about
  `\%` shows `5%`.

Three things seen that are as designed and worth a reader's knowing:

- In WebKit the long formula within a line stays on one line and is cut at
  the column's edge, to be scrolled; in Chromium it breaks over lines. Both
  are what INT-0030's Consequences say.
- In Sanguine Atonement, whose text is larger, the wide numbered equation
  no longer fits the column at 1100 px: it is cut at the edge and its
  number `(2)` is out of sight until the box is scrolled. That is the
  phone-width behaviour `test_math_equation_numbers` measures, met at a
  desktop width.
- The Word-saved captures were not retaken; nothing since `1e782cf` changes
  what that page shows.

One thing seen that no test measures: formulas are set at the size of the
text around them, and beside the reader's display typeface they look small.
That is a matter of taste for the owner, and the font is one setting.
