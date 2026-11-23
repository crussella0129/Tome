# Sprint 24 Test Report

## Intent Verification
| Intent | Acceptance criterion | EARS / tests | Result | Intent evidence update |
|--------|----------------------|---------------|--------|------------------------|
| [INT-0029](../../../intents/INT-0029-documents-as-tomes.md) | AC1 — a manifest path, `TOME_BOOK(S)` and `books:add` accept a `.md`, a `.docx`, or a folder of them; each appears in the Bibliotheca, sidebar and search; anything else is refused by name | T-065, T-067, T-069, T-070, T-071, T-073 / `test_source_*`, `test_loader_markdown_file`, `test_loader_word_file`, `test_loader_document_folder`, `test_loader_mixes_kinds`, `test_loader_document_failure_keeps_library`, `test_books_add_*`, E2E `test_documents_root_and_sidebar`, `test_documents_search`, gate `check_documents_bibliotheca`, `check_documents_single_word` | **pass** | Test evidence links this report |
| [INT-0029](../../../intents/INT-0029-documents-as-tomes.md) | AC2 — one chapter per document; folder order, parts, opening page; titles; a tome's own address opens it | T-065, T-068, T-069, T-070 / `test_source_order` (two cases), `test_source_staged_names`, `test_spine_round_trip`, `test_prepare_markdown_title`, `test_loader_document_titles`, `test_pages_*`, `test_entries_rootless_tome`, `test_docx_line_breaks`, gate `check_documents_bibliotheca` | **pass** | (as above) |
| [INT-0029](../../../intents/INT-0029-documents-as-tomes.md) | AC3 — headings, emphasis, lists, links, tables, footnotes, quotations and images from Word; one top heading; images staged | T-066, T-068, T-069 / the 27 `docx-to-markdown.test.ts` cases, `test_prepare_word`, `test_loader_word_images_apart`, E2E `test_documents_word_chapter`, `test_documents_nested_word_image`; twelve files saved by Word read by eye | **pass** | (as above) |
| [INT-0029](../../../intents/INT-0029-documents-as-tomes.md) | AC4 — what carries meaning is marked and reported; anything else the reader did not recognise is named; decoration is neither | T-066, T-068, T-069 / `test_docx_marks_are_literal`, `test_docx_equations_marked`, `test_docx_figures_marked`, `test_docx_unsupported_image`, `test_docx_reader_messages` (four cases), `test_docx_decoration_is_silent`, `test_prepare_markdown_missing_image` (four cases), `test_prepare_unreadable_word`, `test_describe_left_out`, `test_loader_reports_left_out` (two cases), `test_loader_folder_unreadable_document`, E2E `test_documents_word_chapter`, `test_documents_markdown_images` | **pass** (caveat: `[figure not shown]` and `[document not shown]` are asserted in Markdown and in the loader's output, not in a built page) | (as above) |
| [INT-0029](../../../intents/INT-0029-documents-as-tomes.md) | AC5 — a link that is not a web or mail address is plain text | T-066 / `test_docx_unsafe_links`, `test_docx_decoration_is_silent` (field cross-references), E2E `test_documents_no_unsafe_links` | **pass** | (as above) |
| [INT-0029](../../../intents/INT-0029-documents-as-tomes.md) | AC6 — sources never changed; nothing written beside them | T-066, T-068, T-069, T-071 / `test_docx_source_untouched`, the before-and-after snapshot in every `document-stage.test.ts` case, `test_loader_sources_untouched`, the source hashes in `test_books_add_documents` | **pass** | (as above) |
| [INT-0029](../../../intents/INT-0029-documents-as-tomes.md) | AC7 — mdBook folders load exactly as before, with two named tests changed | T-065, T-067, T-069, T-070, T-071, T-072 / `test_source_book_delegates`, `test_loader_book_unchanged` (digests reproduced from a clone at `06cdbcd`), the existing loader, discovery, book and search cases, `npx playwright test`, `check:external`, `check:multibook`, `check:search` | **pass** (caveat: `check:livereload` is intermittent, as it was before the sprint; see Failures) | (as above) |
| [INT-0029](../../../intents/INT-0029-documents-as-tomes.md) | AC8 — tests on a Word fixture kept in the repository; a chapter tells a person how to add a document | T-066, T-073, T-074 / `test_docx_fixture_builds`, `check:documents` in CI, `test_fixture_commands_refuse_dirty_content`, `test_documents_gate_cleans_up_on_failure`, `test_ci_workflow_valid`, `test_tutorial_covers_documents`, `test_config_template_mentions_documents` | **pass** | (as above) |

All eight criteria are proven by automated evidence at the tested head. The
"by eye" reading the test plan asked for was done on twelve documents saved by
Word itself, found online at the owner's direction in place of a paper of the
owner's own (`e2e-tests.md`, "By eye"). It found three faults, all fixed with
tests. What it did not cover is stated there: a document of the owner's own, a
Google Docs download, and an equation or a chart in a file Word wrote.

## Summary
- Unit and integration tests (Vitest): **258 tests in 30 files. 257 passed
  and 1 skipped on Windows; 257 passed and 1 skipped in CI on Linux; 0
  failed.** The two skips are different tests, each needing the other
  platform's file system, so every test passed at the tested head.
- E2E tests (Playwright, Chromium): **39 passed / 0 failed** on the default
  library; **6 passed / 0 failed** in the documents gate; 3 passed in the
  external-book gate.
- Build gates: `check:documents`, `check:external`, `check:multibook`,
  `check:search` each exit 0, locally and in CI.
- `astro check`: 0 errors, 0 warnings, 0 hints.
- Test critic: four reviews. The first raised fifteen concerns; the second
  and third each returned **block** on faults introduced by the fixes before
  them; the fourth returned **proceed-with-caveats** with six points, each
  fixed or deferred with a stated reason (`critique.md`).
- CI status: **green** on the tested head.

## CI Confirmation
- **Head SHA:** `36b5db1e311f9aa1cf5786777c8e03c45dd01c94`
- **CI run:** [45225743756](https://github.com/crussella0129/Tome/actions/runs/45225743756). Its log reads `Test Files 30 passed (30)` and `Tests 257 passed | 1 skipped (258)`, the one skip in `document-stage.test.ts` (the drive-letter path case), so the loader's `Summary.md` case, skipped on Windows, ran and passed there; `39 passed` for the default browser suite; `3 passed` in the external-book gate; `6 passed` and all three "OK" lines in the documents gate.
- **Conclusion:** success
- **Confirmations:** `verify` succeeded for checkout/setup-node v7, dependency
  installation, Type check, Unit & integration tests, End-to-end tests, and
  the External, Multi-book, Search and Documents build gates. CI also
  succeeded at each earlier Test-phase head: `ef6d924` (run 45209060941),
  `28e3490` (45212934496), `f2ac541` (45215384957), `19bbfc5` (45221983519).
- **Local confirmations at `36b5db1`:** `npx vitest run` 257 passed, 1
  skipped; `npx astro check` 0 errors; `npx playwright test` 39 passed;
  `check:documents`, `check:external`, `check:multibook`, `check:search` exit
  0. These were run on the working tree that became `36b5db1`.

## Failures
None against INT-0029's criteria at the tested head.

One departure from the locked test plan: it counted on `check:livereload`
passing as part of the proof that an mdBook's live reload is unchanged. That
gate is intermittent. It failed 2 of 4 runs at `f2ac541` and 1 of 4 at
`19bbfc5`. Repeated runs showed the same fault before the sprint (7 of 16 at
`06cdbcd`) at least as often as after (3 of 14 at `f2ac541`): the watcher logs
the sync of an edit, and the dev server sometimes keeps serving the old page.
The sprint's only change to that path runs before the watcher is added. So
criterion 7 holds for live reload on the grounds set out in `e2e-tests.md`
("Live reload"), not on that gate passing.

## Technical Debt Identified
- [INT-0009](../../../intents/INT-0009-live-reload-parent-assets.md) — live reload sometimes keeps serving the old chapter after syncing an edit. Older than this sprint; noted on the intent; queued as T-075.
- [INT-0008](../../../intents/INT-0008-in-book-search.md) — a heading that cites a note, or holds `--`, has a different address in search than on the page, so that result opens the chapter at its top. Older than this sprint for mdBooks; Word documents now reach it. Queued as T-076.
- [INT-0029](../../../intents/INT-0029-documents-as-tomes.md) — in search, two superscript markers run together, or one leading a heading or a block of raw HTML, still join the word after them. Stated as a limit in the intent; the rule was changed three times in this phase and each change introduced a fault, so it was left there.
- [INT-0030](../../../intents/INT-0030-mathematics-and-code.md) — equations are marked and counted, not shown. Charts and diagrams are marked too; no intent yet takes those up.
- [INT-0026](../../../intents/INT-0026-document-editor.md) — a link from one note to another file does not lead to its chapter; a changed document needs a restart in `npm run dev`.

## Coverage Observations
- The Word fixture is hand-written XML. Three faults were found only by
  reading files Word itself had saved, and each review after that found
  further cases by running the real functions on variants. A fixture corpus
  of real Word files would have found the first three sooner; the twelve
  used here are another project's and were not committed.
- No equation or chart in a file written by Word has been read. Those marks
  are proven on the fixture and its variants only.
- `[figure not shown]` and `[document not shown]` are not asserted in a built
  page. They are written by the same code as `[equation not shown]` and
  `[image not shown]`, which are.
- `verify_dev_serves_document` (the notice that live reload is off for
  documents) is a recorded local check, not in CI; its decision function is
  unit-tested in CI.
- The search-text rule was the least stable part of the sprint: it changed in
  every review round. Its tests now hold the inputs each review broke it with.
