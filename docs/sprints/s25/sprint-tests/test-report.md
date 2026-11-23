# Sprint 25 Test Report

## Intent Verification
| Intent | Acceptance criterion | EARS / tests | Result | Intent evidence update |
|--------|----------------------|---------------|--------|------------------------|
| [INT-0030](../../../intents/INT-0030-mathematics-and-code.md) | AC1 — `$…$` is laid out within its line and `$$…$$` set apart, in Light, Dark and Sanguine Atonement, in Chrome's engine and Safari's, from Tome's own files, with no script added to a chapter | T-077, T-078, T-080, T-081 / `test_dollars_pair_is_formula`, `test_dollars_set_apart`, `test_dollars_fences`, `test_dollars_crlf`, `test_math_inline`, `test_math_set_apart_wrapper`, `test_math_set_apart_through_raw`, `test_math_font_from_package`; gate `check_math_built_pages` (no `script` in a chapter); E2E in both engines: `test_math_boxes`, `test_math_font_and_requests` (every request to the page's own origin; every formula set in `Tome Math`, loaded by the page), `test_math_theme_colour_and_paint` in the three themes; `test_electron_math_chapter` | pass | Test evidence links this report; eligible for realized after completion evidence |
| [INT-0030](../../../intents/INT-0030-mathematics-and-code.md) | AC2 — a fraction, a root, a sum with limits, a matrix, an aligned derivation and a numbered equation lay out correctly; numbers count from 1 down each page at the right edge | T-078, T-080, T-081 / `test_math_constructs`, `test_math_numbers`, `test_math_table_width`, `test_math_css_rules`; E2E in both engines: `test_math_positions` (the radical's own ink, the matrix's rows held apart, the equals signs in line), `test_math_equation_numbers` (at 1100 px and 390 px), `test_math_phone_width` | pass | as above |
| [INT-0030](../../../intents/INT-0030-mathematics-and-code.md) | AC3 — a Word document's equations appear as equations, carried over as LaTeX; one the converter does not know keeps the mark and is counted | T-082 / `test_omml_rules`, `test_omml_trial_faults`, `test_omml_other_rules`, `test_omml_unknown_is_nothing`, `test_omml_other_unknowns`, `test_docx_equations_carried`, `test_docx_equations_read_back`, `test_docx_equation_in_containers`, `test_docx_adjacent_equations`, `test_docx_equation_beside_emphasis`, `test_docx_cell_equation_ends_in_bar`, `test_docx_unread_equation_is_marked`, `test_docx_unread_equation_is_reported`, `test_docx_cell_words_with_bar_is_marked`, `test_docx_equations_marked`, `test_loader_word_equations`, `test_loader_reports_left_out`; E2E `test_documents_word_chapter`; two documents Word itself saved (33 equations, all carried over) | pass | as above |
| [INT-0030](../../../intents/INT-0030-mathematics-and-code.md) | AC4 — code stays apart from prose and from mathematics; a dollar sign inside code is never a formula | T-077, T-078, T-079, T-081 / `test_dollars_code_untouched`, `test_dollars_closer_belongs_elsewhere`, `test_dollars_code_above_fence`, `test_math_code_untouched`, `test_search_formula_in_code`; E2E `test_math_code_stays_code` in both engines | pass | as above |
| [INT-0030](../../../intents/INT-0030-mathematics-and-code.md) | AC5 — a sum of money written with a dollar sign stays a sum of money | T-077, T-079, T-082 / `test_dollars_money_lines`, `test_dollars_lone_and_escaped`, `test_search_money_lines`, `test_docx_dollar_in_text`; gate `check_math_built_pages` (the price line as typed); the owner's library read at the Test phase (1,290 files, no formula found) | pass | as above |
| [INT-0030](../../../intents/INT-0030-mathematics-and-code.md) | AC6 — a formula that cannot be read is shown as typed and named, with its chapter, when the library is built; the build goes on | T-077, T-078, T-081 / `test_math_unreadable`, `test_math_unclosed_fence`, `test_math_refused_commands`, `test_math_empty`, `test_dollars_unclosed_fence`; gate `check_math_build_output` (the build's own output names `1-proof.md` and the formula) | pass | as above |
| [INT-0030](../../../intents/INT-0030-mathematics-and-code.md) | AC7 — search finds a formula by what it shows; a heading that holds a formula opens at its section from a search result | T-079, T-081 / `test_search_formula_text`, `test_search_set_apart_environment`, `test_search_symbol_names`, `test_search_heading_formula_slug`, `test_search_words_fold_raised`; gate `check_math_heading_slugs`; E2E in both engines: `test_math_search_opens_section` (typing `mc2` opens `/2-more#the-emc2-law` in view), `test_math_rail` | pass | as above |
| [INT-0030](../../../intents/INT-0030-mathematics-and-code.md) | AC8 — a chapter of the tutorial tells a person how to write a formula | T-083 / `test_tutorial_covers_mathematics`, `test_tutorial_covers_documents`, `test_books_library`; E2E `test_reader_math_chapter`, `test_electron_math_chapter` | pass | as above |
| [INT-0029](../../../intents/INT-0029-documents-as-tomes.md) | Boundary — everything else a Word document keeps, and what is left out, is as before; equations are no longer among what is left out, except those the converter does not know | T-082 clause 9 / the other 25 cases of `docx-to-markdown.test.ts` (two edited where they listed equations), the other 39 loader cases unedited, `check:documents` 6/6 | pass | Consequences revised in the Plan phase; no state change |
| [INT-0008](../../../intents/INT-0008-in-book-search.md) | Boundary — prose with no dollar sign is indexed exactly as before | T-079 clause 7 / the ten earlier `search-index.test.ts` cases and three `search.test.ts` cases unedited; `check:search` | pass | none |

## Summary
- Unit and integration tests (Vitest): **337 tests in 35 files. 336 passed
  and 1 skipped on Windows; 336 passed and 1 skipped in CI on Linux; 0
  failed.** The two skips are different tests, each needing the other
  platform's file system, so every test passed at the tested head. Before
  the sprint the suite was 258 tests in 30 files.
- E2E tests (Playwright): **22 passed / 0 failed** in the mathematics gate,
  the same eleven tests in Chromium and in WebKit; **40 passed / 0 failed**
  on the default library (Chromium); **6 passed / 0 failed** in the
  documents gate; 3 passed in the external-book gate; **7 passed / 0
  failed** in the desktop app (Electron, run on this machine only).
- Build gates: `check:math`, `check:documents`, `check:external`,
  `check:multibook`, `check:search` each exit 0, locally and in CI.
- `astro check`: 0 errors, 0 warnings.
- Test critic: five reviews. The first three each returned **block**, each
  on a real fault no test had tried; the fourth returned
  **proceed-with-caveats**; the fifth, by the same reviewer on the answers to
  the fourth, returned **proceed-with-caveats** with three points, one done
  in the records and two deferred with reasons (`critique.md`; the earlier
  rounds are `critique-round-1.md` to `critique-round-4.md`).
- CI status: **green** on the tested head.

## CI Confirmation
- **Head SHA:** `e2d16f73e6fbc721cc08a90cfeabe6fbd005af20`. The tested code
  is `0eb7dd4`; `e2d16f7` adds four record files under `sprint-tests/` and
  nothing else. The commit that carries this report adds records only, too.
- **CI run:** [45286819729](https://github.com/crussella0129/Tome/actions/runs/45286819729).
  Its log reads `Test Files 35 passed (35)` and `Tests 336 passed | 1
  skipped (337)`, the one skip in `document-stage.test.ts` (the drive-letter
  path case), so the loader's `Summary.md` case, skipped on Windows, ran and
  passed there; `40 passed` for the default browser suite; `3 passed` in the
  external-book gate; `6 passed` and `check-documents: all document checks
  passed`; `22 passed` and `check-math: all mathematics checks passed`, in
  Chromium and WebKit on Ubuntu. CI allows a failed browser test one retry;
  the log has no retry and no test marked flaky.
- **Conclusion:** success
- **Confirmations:** `verify` succeeded for checkout/setup-node v7,
  dependency installation, Type check, Unit & integration tests, Install
  Playwright browsers (Chromium and WebKit), End-to-end tests, and the
  External, Multi-book, Search, Documents and Mathematics build gates. CI
  also succeeded at each earlier head of the Build's end and the Test phase:
  `b39d962` (run 45264701530), `1e782cf` (45268114001), `9cf62ed`
  (45273999528), `e1bee88` (45275134399), `49df08e` (45278177324),
  `f162064` (45282369997).
- **Local confirmations at `0eb7dd4`:** `npx vitest run` 336 passed, 1
  skipped; `npx astro check` 0 errors; `npx playwright test` 40 passed;
  `check:math` 22 passed; `check:documents` 6 passed; `check:external`,
  `check:multibook`, `check:search` exit 0; `check:electron` 7 passed, on
  the committed sample library. Each was run on a clean tree at that commit.

## Failures
None against INT-0030's criteria at the tested head.

The phase did find faults, and corrected them in the phase with a test each;
none needed a new design. They are set out in `sprint-meta.md`, Blockages,
and in the five review records:

- A file Word itself saved showed a style wrapped round a sign as well as
  its letter.
- The first review: a `$$…$$` line with Windows line ends was not set apart;
  `$$` in inline code directly above a fence turned the fence over; a
  plain-text title ran a whole number into a fraction and wrote a binomial
  as a division; two Word equations side by side became one unreadable
  formula with nothing reported.
- The second, third and fourth reviews each found another shape in which a
  Word equation was neither a formula nor counted: beside bold or italic
  text; at the end of a table cell after a bar; plain words holding a bar,
  in a table cell. After the third, the converter was given a check of the
  promise itself: it reads its own result back with Tome's reader, asks the
  layout engine about each equation as written, and writes the mark, and
  counts, for any equation that fails either. Two matrices of conversions
  the reviewers ran (8,400 and 4,752) now find no equation that is neither.

Not run, and so not claimed: Safari itself on a Mac, an iPhone or an iPad
(the check runs the open-source build of its engine); Firefox; the Tauri
app's window. `check:livereload`, intermittent since before Sprint 24
(T-075), passed both of its runs at `b39d962` and was not run at the later
heads, which change nothing it reads.

## Technical Debt Identified
- [INT-0030](../../../intents/INT-0030-mathematics-and-code.md) — a Word equation that shares its paragraph with a note reference, a line break or a picture is written within the line, not set apart. Nothing is lost. Queued as T-085.
- [INT-0030](../../../intents/INT-0030-mathematics-and-code.md) — the rule for dollar signs can still be fooled, and a `$$` in a link's address or an HTML attribute directly above a `$$` line takes the rest of the chapter. Each is recorded in the intent's Consequences with the way round it, each is held by a test, and the build names the second. Left as limits: the rule was the owner's choice over a looser one.
- [INT-0030](../../../intents/INT-0030-mathematics-and-code.md) — referring to an equation by its number (`\ref`) is not offered, and a command defined in one formula is not known in the next.
- [INT-0027](../../../intents/INT-0027-cruor-typefaces.md) — formulas are set in STIX Two Math, and beside the reader's display typeface they look small. The font is one setting; a Cruor mathematical font takes its place when the Cruor build has a MATH table, which the build looked at on 23 November 2026 did not.
- [INT-0033](../../../intents/INT-0033-latex-and-typst-documents.md) — whole LaTeX and Typst documents are not read. Split from INT-0030 in Research; proposed.
- [INT-0032](../../../intents/INT-0032-shared-ground-with-mdbook.md) — a book written for mdBook's own mathematics (`\\(` … `\\)`) is not laid out.
- [INT-0009](../../../intents/INT-0009-live-reload-parent-assets.md) — T-075, and [INT-0008](../../../intents/INT-0008-in-book-search.md) — T-076, both older than this sprint and untouched by it.

## Coverage Observations
- The Word fixture is hand-written XML. Every fault in carrying an equation
  over was found by something other than the planned tests: a file Word
  saved, or a reviewer converting variants by the thousand. The check the
  converter now makes of its own result is the answer to that; the planned
  cases alone would have passed a converter that lost equations in four
  common shapes.
- Three things the final review found unheld, which no known input reaches
  (`critique.md`, C-002). The reading back on the converter's own path is
  seen refusing only through a stand-in reader, because no document is
  known that Tome's reader refuses and the layout engine accepts; with
  Tome's own reader the check is held directly
  (`test_docx_unread_equation_is_marked`). No test holds which mode the
  layout engine is asked in; none of the 81 forms the converter writes
  differs between the two. And a title would still name an equation whose
  place-holder was changed past knowing, which nothing is known to cause.
- Two documents written by Word were read (33 equations). They were typed
  in Word's linear form; equations built through its ribbon, a paper of the
  owner's own, and a Google Docs download were not.
- The browser checks measure positions and painted ink, so they hold in any
  engine, and all pass in both. What a formula looks like is also a matter
  for the eye: eighteen captures at `9cf62ed` were looked at
  (`e2e-tests.md`, "By eye"), and no later commit changes what a page shows.
- By-eye and by-test evidence is from Playwright's WebKit on Windows and
  Ubuntu. Apple's own Safari has other fonts and text; it was not run.
