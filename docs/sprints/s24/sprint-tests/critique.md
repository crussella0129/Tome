# Test Critique — Sprint 24

Fourth and final review, at head `19bbfc5`. The three before it are recorded
in `critique-round-1.md` (fifteen concerns), `critique-round-2.md` (five,
verdict block) and `critique-round-3.md` (seven, verdict block).

The reviewer confirmed all seven third-round responses in the code and tests,
with one half-miss raised below as C-005. It then tried to break the rewritten
search rule and the line-break handling by running the real `parseChapter()`,
`search()`, `convertDocx()` and Astro's own Markdown processor in memory:
about 75 Markdown inputs for search, 44 headings compared against Astro's ids,
and about 50 Word variants. What held: every Word variant gave exactly one
top heading (a Title in a table, in a nested table, two Titles, no heading at
all); titles came out right over a line break, a tab and a no-break space;
tables stayed whole with a break, a pipe, a superscript, a heading, an empty
cell, and merged or missing cells; and every slug matched Astro's id but for
the two cases in C-004.

"Why it matters" is condensed from the reviewer's report; each "Suggested
response" ends with what was done. The fixes are in the commit that follows
`19bbfc5`. The reviewer wrote that none of these needs a further review if
handled as suggested.

## Concerns

### C-001: A section heading set over two lines runs its words together in the "on this page" rail
- **Where:** `scripts/docx-to-markdown.mjs` (the `br` handler); `src/pages/[...slug].astro` and `src/components/OnThisPage.tsx`; `docx-to-markdown.test.ts`; INT-0029 Consequences
- **Quote:** "A line break inside a Word paragraph, heading or title is kept as a line break, and the words either side of it stay apart"
- **Failure mode:** weak-assertion
- **Why it matters:** Writing a heading's break as `<br>` made the page's own reading of the heading skip it, so "The Quarry⏎Northern Face" was listed in the rail as "The QuarryNorthern Face". The third round's fix introduced this, and its test pinned the Markdown form that caused it.
- **Suggested response:** tighten-assertion — done. Inside a heading or a title a break is now a space (`unbreakHeadings`), so the heading is one line wherever the page lists it; `test_docx_line_breaks` expects `## The Quarry Northern Face` and `# On the Weight of Obsidian`. INT-0029's sentence says so.

### C-002: A page break or column break inside a paragraph joins the words either side, with no report
- **Where:** `scripts/docx-to-markdown.mjs` (`STYLE_MAP`); INT-0029 Consequences; no test
- **Quote:** "A line break inside a Word paragraph, heading or title is kept as a line break"
- **Failure mode:** intent-coverage
- **Why it matters:** The Word reader drops a page or column break, so `lastword` + page break + `Firstword` came out as `lastwordFirstword`, lost to search; the same in a Title or a table cell.
- **Suggested response:** add-test — done, with the fix: both breaks are mapped to a line break. A second `test_docx_line_breaks` case puts a page break in a paragraph, in the Title and in a table cell, and a column break in a paragraph, and asserts no two words ran together.

### C-003: The "word after a leading marker is left whole" rule holds only for one marker at the start of a line of Markdown
- **Where:** `src/lib/search-index.ts` (`htmlWords`, `headingWords`, `joinParts`); `search-index.test.ts`; INT-0029 Consequences
- **Quote:** "Where nothing stands before such a tag, the word after it is left whole"
- **Failure mode:** EARS-coverage
- **Why it matters:** In a heading or a block of raw HTML the rule was not applied, and in a line of text a bracket, a comma or a second marker before the tag counted as "something before", so the word after was joined and lost to search. All rare; the page itself is right.
- **Suggested response:** defer-with-rationale — partly fixed, the rest deferred with the limit stated. Fixed: only a letter or a digit hard before the tag joins, so `(<sup>a</sup>Corresponding` and `,<sup>2</sup>Department` leave the word whole (asserted). Deferred: two markers run together, and a marker leading a heading or a block of raw HTML, still join the word after them. INT-0029's sentence now says exactly that. The reason for stopping here: each further case needs the rule applied to more kinds of text, and three rounds of changes to this rule each introduced a fault of their own.

### C-004: A section heading that cites a note is slugged differently from the page's id
- **Where:** `src/lib/search-index.ts`; INT-0029 Consequences; `scripts/check-documents.mjs` (`check_documents_heading_ids`, fixture only)
- **Quote:** "its address on the page is made as the page makes it"
- **Failure mode:** weak-assertion
- **Why it matters:** The page numbers a note by its order while search slugs its label, and the page sets `--` as a dash; a search result for such a section opens the chapter at its top. Nothing is lost. The rule is older than the sprint for mdBooks, and Word documents now reach it.
- **Suggested response:** defer-with-rationale — done. INT-0029's consequences name both exceptions, and making search and the page agree is queued as T-076 under the search intent.

### C-005: The "between two cells" half of the bookmark pass-over never matches
- **Where:** `scripts/docx-to-markdown.mjs` (`NOT_OMISSIONS`); `docx-to-markdown.test.ts` (rows only)
- **Quote:** "A bookmark between two rows or cells: the table is converted whole."
- **Failure mode:** negative-path
- **Why it matters:** The Word reader's wording for cells is "…in table row, cell merging may be incorrect", which the pattern did not match, so a bookmark between two cells was still reported as left out.
- **Suggested response:** tighten-assertion — done. The pattern matches both wordings, and the test puts a bookmark between two cells as well as between two rows and expects no report.

### C-006: The records do not name the CI run that passed the one case skipped locally
- **Where:** `unit-tests.md`; `integration-tests.md` loader row for `Summary.md`
- **Quote:** "it is skipped on this Windows machine and runs in CI on Linux"
- **Failure mode:** evidence-drift
- **Why it matters:** No record showed the `Summary.md` case passing at the tested head, though it did in CI; and "unedited" was not quite true of one existing test, which had a line re-wrapped.
- **Suggested response:** tighten-assertion on the record — done. The records name the CI run, its head and its totals, say which case each platform skips, and say "unedited but for a line wrap".

## Confidence
proceed-with-caveats
