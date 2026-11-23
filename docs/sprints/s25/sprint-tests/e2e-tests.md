# Sprint 25 End-to-End Verification

- **Tested head:** `1e782cf`. Every suite and gate below was run on this
  Windows machine at `b39d962` (the build's last task) and again at
  `1e782cf`, and each exited 0 both times: `npx playwright test`,
  `check:math`, `check:documents`, `check:external`, `check:multibook`,
  `check:search`, and `check:electron` with
  `TOME_CONFIG=fixtures/empty-library.toml`.
- **Status:** possible, and run. Browsers: Chromium 151 and WebKit 26.5 as
  Playwright 1.62 provides them.

## `check:math`: formulas in two engines

`e2e/math.spec.ts` against the build of `fixtures/proofs/`, in two projects.
**20 passed, 0 failed: the same ten tests in Chromium and in WebKit.** A
test that passed in one engine only would be a failure; none did. Every test
waits for the mathematical font and for `document.fonts.ready` before it
measures.

| Test | Clause | What it measured, in both engines |
|---|---|---|
| `test_math_boxes` | T-081 5 | every `math` element on both pages is wider and taller than 1 px |
| `test_math_positions` | T-081 5 | the numerator's bottom is at or above the denominator's top; the radical is at least as tall as the fraction under it; the sum's upper limit is above the middle of its sign and the lower below; the matrix's four cells stand in two rows and two columns; its bracket is at least 1.5 times a bracket in a line of text; the derivation's two equals signs are within 1.5 px; a set-apart summation sign is taller than one within a line; on the line with a short formula and a long one in its box, the first letters' tops are within 2 px |
| `test_math_equation_numbers` | T-081 6 | at 1100 px and at 390 px: `(1)`, `(2)`, `(3)` on the first page; `(1)`, `(2)`, `(7)` on the second; each within 4 px of its box's right edge and 24 px or more from its formula. The wide numbered equation fits at 1100 px and scrolls at 390 px, where its box is scrolled to its end first |
| `test_math_font_and_requests` | T-081 7 | a face `Tome Math` with status `loaded`; `document.fonts.check()` true for `∑√α`; more than three `http` requests, all to the page's own origin, the font file among them; no console error |
| `test_math_theme_colour_and_paint` (three tests: Light, Dark, Sanguine Atonement) | T-081 8 | an inline formula's colour equals its paragraph's, a set-apart one's the prose's; a formula within a line, a set-apart fraction, and the formula in a heading each change at least 2% of the pixels of their box (the same rectangle of the page photographed with the element and with it hidden) |
| `test_math_phone_width` | T-081 9 | at 390 px neither page is wider than its window; no `.tome-math` or `.tome-math-long` is scrollable up and down; the wide set-apart formula and the wide numbered equation are wider inside than out with `overflow-x: auto`; the long inline formula's box ends inside its column |
| `test_math_rail` | T-081 10 | the rail lists `The E = mc² law`, linked to `#the-emc2-law`, and a plain heading as itself; following the entry from the foot of the page brings the heading into view |
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
  is loaded and used for `∑√α`; every request went to `app://tome`, the font
  file among them.
- `check:external`, `check:multibook`, `check:search`: exit 0, unchanged.
- `check:livereload`, which Sprint 24 found intermittent (T-075), exited 0 on
  both of its two runs at `b39d962`. It was not run again at `1e782cf`,
  whose one change is to the Word converter.

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

Captured at `b39d962` from the built site, 1100 px wide, full page, in
`evidence/`:

- the guide's chapter: `tutorial-{light,dark,sanguine}-{chromium,webkit}.jpg`;
- the first fixture page: `proof-1-…`; the second: `proof-2-…`;
- the document Word saved (`integration-tests.md`), at `1e782cf`:
  `word-saved-light-{chromium,webkit}.jpg`.

Looked at, of the twenty: the guide's chapter in Light in WebKit, and the
Word-saved document in Light in WebKit. In both, each formula stands where
its source says, numbers are at the right edge, a matrix and cases keep
their rows apart, and source in code is shown as code. Earlier captures of
both fixture pages in the three themes and both engines were looked at
during T-080 (`completed-tasks.md`, T-080); the two faults named above were
found that way. The other captures here were made for the record and were
not each looked at.

One thing seen that no test measures: formulas are set at the size of the
text around them, and beside the reader's display typeface they look small.
That is a matter of taste for the owner, and the font is one setting.
