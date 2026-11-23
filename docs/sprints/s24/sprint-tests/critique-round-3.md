# Test Critique — Sprint 24, third review

The third review, at head `f2ac541`, confirmed that all five responses to the
second review (`critique-round-2.md`) were in the code, and that the new
assertions fail under the code before them. It then returned **block** on new
findings around the line break. The reviewer confirmed each by running the
real `parseChapter()`, `search()`, `convertDocx()` and Astro's own Markdown
processor in memory.

This file records its seven concerns, condensed from the report, and what was
done; every fix is in commit `19bbfc5`. The verdict the report was written
under is in `critique.md`.

| # | Concern | Failure mode | Response |
|---|---|---|---|
| C-001 | Search still hid a word (a) after a Markdown line break that followed a joining tag (`m<sup>2</sup>` then a break then `Volume` gave `m2Volume`), which is what the converter writes for a superscript before a Word line break; (b) in a heading with a break, whose search text was its slug text (`AlphaBeta`), a fault one test pinned as correct; (c) after a leading superscript (`<sup>a</sup>Corresponding` gave `aCorresponding`). (a) and (b) blocked; (c) needed a decision. | EARS-coverage, weak-assertion | Fixed, by gathering search text on a plainer rule (`joinParts`). A line break is a separator. A joining tag joins what it holds to text hard against it before, and to the text after only if that first join happened, so `H<sub>2</sub>O` is `H2O` and `<sup>a</sup>Corresponding` is `a Corresponding`: that is the decision for (c), recorded in INT-0029. A heading is slugged by Astro's own rule and searched by its words, kept apart at a break; the pinned assertion now expects `Alpha Beta` with slug `alphabeta`. Three new test cases hold the reviewer's inputs. |
| C-002 | A Word line break (Shift+Enter) was in no test, and hid two faults: a Title set over two lines lost its space (`On the Weightof Obsidian`), and a break before superscript was written as a stray backslash with the break lost. | intent-coverage | Fixed. A line break counts as a space in a title, and is written `<br>` everywhere (paragraph, heading, table cell). `test_docx_line_breaks` breaks the Title, a heading, a plain paragraph and a paragraph before a superscript. |
| C-003 | A Title, or a lone Heading 1, inside a table left the chapter with no top heading; tables nested two deep share a line, against "one line to a row". | EARS-coverage | Fixed. Headings are settled from those outside tables; a Title in a table still heads the chapter and stays in its table; another heading in a table is cell text. A new `test_docx_heading_levels` case covers both. INT-0029 states both, and its nested-table sentence is narrowed. |
| C-004 | The load would report as "left out" a bookmark between two table rows (the table converts whole) and an undefined style whose ID holds a space; the linked-picture claim had no test. | negative-path | Fixed. Both messages are passed over by their own wording; a new `test_docx_reader_messages` case asserts them silent, proves its bookmark was really inserted, and asserts a linked picture is listed with no image and no mark. |
| C-005 | The tag pattern stopped at the first `>`, so an attribute or comment holding one leaked into the text and the slug. | EARS-coverage | Fixed. A tag or comment is matched whole (quoted attributes, comment bodies); the heading slug follows Astro's own rule for skipping a raw tag. Asserted for an attribute and a comment, in a heading and in a line. |
| C-006 | `check:livereload` is not a pass at the tested head; deferring it is sound, but the report must say what AC7 rests on, the measuring script was not kept, and the earlier passes were single runs. | flake-risk | Deferred with a reason, as the review advised. The report records the gate as intermittent, as before the sprint, and as a departure from the test plan; the script is kept as `evidence/live-reload-repeat.mjs`; INT-0009 carries a note; T-075 is queued. |
| C-007 | `unit-tests.md` credited a third review that had not yet happened. | evidence-drift | Fixed. The records are re-stamped at the new head with the reviews that did happen. |
