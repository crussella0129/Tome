# Test Critique — Sprint 24, second review

The second review, at head `28e3490`, confirmed that all fifteen responses to
the first review (`critique-round-1.md`) were in the code and that each new
assertion would fail under the old behaviour. It then returned **block**: two
of those fixes had introduced faults of their own. The reviewer confirmed each
by running the real `parseChapter()` and `convertDocx()` in memory.

This file records its five concerns, condensed from the report, and what was
done; every fix is in commit `f2ac541`. The verdict the report was written
under is in `critique.md`.

| # | Concern | Failure mode | Response |
|---|---|---|---|
| C-001 | The fix that let an inline tag join its neighbours in search text joined across every tag: `alpha<br>beta gamma` became `alphabeta gamma`, so `beta` could not be found. That reached existing mdBooks (a `<br>` in a table cell) and the cells this sprint writes (`First<br>second line`). A wordless block of HTML inside a list item or quotation was treated as inline. Older: adjacent cells of an HTML table ran together. The blocker. | EARS-coverage | Fixed. Only a tag that sits inside a word or phrase (`sub`, `sup`, `span`, `em` and their like, a named list) joins; every other tag parts its neighbours, and HTML directly inside a list item, quotation or note is a block. Cells of an HTML table are separate words. `test_search_text_drops_tags` gained ten assertions, `alpha<br>beta gamma` → `alpha beta gamma` and a two-line table cell among them, and a heading case. INT-0029's search consequence states the rule. |
| C-002 | A quotation of two paragraphs in a table cell split the row over three lines, the fault the cell change was made to remove; the nested-list path had no test; older, a table nested in a cell had its rows gathered into the outer table, so the inner row appeared twice. | negative-path | Fixed. In a cell, a quotation is its paragraphs, a nested list is indented, and a nested table is one line to a row; `headTables` no longer takes a nested table's rows. A second `test_docx_table_cells_stay_one_line` case holds all three in one table and asserts three table lines, the cell's exact content, and that the inner row appears once. |
| C-003 | The filter for what counts as left out excluded any reader message holding the word "style", so a symbol in a font named "Bookman Old Style", or a linked picture in a folder named "Style Guide", was left out in silence; it had also become an allow-list of four words with one wording tested. | negative-path | Fixed. Only the reader's two style messages are passed over, each by its own wording, and everything else is listed again. A new `test_docx_reader_messages` case asserts the "Bookman Old Style" symbol is listed. INT-0029 records that a linked picture is named by the load and leaves no mark. |
| C-004 | A full image path was tested with forward slashes only and was not percent-decoded as a relative one is; on systems without drive letters a full path stays a site address, which the intent did not say. | weak-assertion | Fixed. The drive-letter spelling is decoded; a new case covers backslashes and `%20` (it runs where full paths begin with a drive letter). INT-0029's consequence states the limit elsewhere. |
| C-005 | `Block Text` was mapped but untested; `e2e-tests.md` said "both builds" of a gate that makes three; `test_describe_left_out` was recorded as covering every kind's words, though two are asserted in other tests. | evidence-drift | Fixed. `test_docx_block_quotes` holds a `Block Text` paragraph and expects three quotations; both record lines are corrected. |
