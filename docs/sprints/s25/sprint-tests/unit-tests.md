# Sprint 25 Unit Verification

- **Tested head:** `1e782cf` (the eight tasks, then one Test-phase fix found
  by reading a document Word saved; see `integration-tests.md`).
  `npx vitest run` on this Windows machine: **35 files, 318 tests: 317
  passed, 0 failed, 1 skipped**. Before the sprint the suite was 30 files,
  258 tests.
- The one skip is the loader case for a note named `Summary.md`, which needs
  a file system that tells it from `SUMMARY.md`; it runs in CI on Linux, where
  the staging case for a drive-letter path is skipped instead. The CI run and
  its totals are in `test-report.md`.
- The suite was also run whole at each task's commit, with these totals
  (passed, and 1 skipped each time): T-077 270, T-078 286, T-079 295, T-080
  299, T-081 303, T-082 313, T-084 315, T-083 317.
- `npx astro check`: 0 errors, 0 warnings.
- **Stubs:** one. `console.warn` is spied in `rehype-math.test.ts`, to read
  the line the build prints for an unreadable formula. Everything else is
  real: the real Markdown parser with Tome's own plugins, the real layout
  engine (Temml), Astro's own heading collector and `rehype-raw` where a test
  says "as Astro", the real Word reader on a `.docx` zipped from
  `fixtures/word/paper/`, real temporary folders, and spawned processes for
  the gates and the config.

New and changed files, with their counts:

| File | Tests | Task |
|---|---|---|
| `remark-math-dollars.test.ts` (new) | 13/13 | T-077 (and the config clause of T-078) |
| `rehype-math.test.ts` (new) | 16/16 | T-078 |
| `search-index.test.ts` | 18/18 (8 new; the 10 earlier unedited) | T-079 |
| `search.test.ts` | 4/4 (1 new; the 3 earlier unedited) | T-079 |
| `styles/__tests__/math.test.ts` (new) | 4/4 | T-080 |
| `fixture-commands.test.ts` | 11/11 (2 new; 1 list extended) | T-081 |
| `fixture-gate.test.ts` | 18/18 (1 new) | T-081 |
| `ci-workflow.test.ts` | 1/1 (two assertions added) | T-081 |
| `omml-to-latex.test.ts` (new) | 4/4 | T-082 |
| `docx-to-markdown.test.ts` | 32/32 (7 new, 2 of them replacing cases of the same name; 2 edited) | T-082 |
| `document-stage.test.ts` | 12/12 (2 new; 1 edited) | T-082, T-084 |
| `load-books.test.ts` | 42/43, 1 skipped (1 new; 2 edited) | T-082 |
| `tutorial-math.test.ts` (new) | 1/1 | T-083 |
| `tutorial.test.ts` | 6/6 (1 new) | T-083 |
| `book.test.ts` | 11/11 (one line added) | T-083 |

## T-077 — formulas in Markdown, and money left alone

`remark-math-dollars.test.ts`. "The reader" is `remark-parse` with
`remark-gfm`, `remarkAlerts` and the plugin, as Astro composes them.

| Clause | Test | What it showed |
|---|---|---|
| 1 a pair hard against its text is a formula | `test_dollars_pair_is_formula` | `2x+1`, `a`; `5`; `n` and `k` from `$n$th` and `$k$-th`; a formula over a line end; `\{x\}` beside a lone price |
| 1 wherever its paragraph stands | `test_dollars_in_constructs` | one formula each in a list item, a quotation, an alert (still an alert), a footnote, two table cells (four cells still), a link's text (address unchanged), bold text |
| 2 a price is refused and reading goes on | `test_dollars_money_lines` | four lines with no formula and their text as typed; four lines where only the real formula is found |
| 3 a closing sign that belongs elsewhere | `test_dollars_closer_belongs_elsewhere` | a `$` in later inline code, `\$` in code, `\$` in text, an address in angle brackets, a link's address: no formula, the code and both addresses intact; with `` `code` and $b$ `` added, `b` is still found |
| 4 a lone or escaped sign | `test_dollars_lone_and_escaped` | no formula; `y` only |
| 5 `$$` lines | `test_dollars_fences` | after a blank line, with trailing spaces, under a line of text, in a list item, under a paragraph with a closed pair; a line `+ c` between fences is part of the formula and no list |
| 6 `$$` with text on its line | `test_dollars_not_a_fence` | `$$\begin{aligned}` … `\end{aligned}$$`, `$$a = b` then `$$`, and the aligned form closed on its own line: one set-apart formula each, the paragraph after it kept; in a quotation an inline formula; an unclosed `$$` in a paragraph is text |
| 7 set apart when it has its lines to itself | `test_dollars_set_apart` | alone, on a line of a paragraph (divided, no line end left), last line, in a list item, in a quotation; inline in the middle of a line, in bold, in a heading, in a table cell; `setApart()` on a tree parsed with `mathSyntax()` equals the plugin's tree for three documents |
| 8 an unclosed fence is marked | `test_dollars_unclosed_fence` | `fenceClosed()` false and the class set for two unclosed shapes; true and unset for seven closed ones |
| 9 code | `test_dollars_code_untouched` | two code spans, a `js` block, and a block holding `$$` lines |
| 10 no dollar sign, no change | `test_dollars_no_dollar_no_change` | three documents, trees deep-equal with and without the plugin |
| 11 the recorded limits | `test_dollars_recorded_limits` | `$B$2:$C$3` gives `2:`; `$a+$b` gives `a+`; `\|$a\|$b\|` in a table gives none; `$$ a = b` then `+ c $$` gives none, a paragraph and a list |
| 12 the config | `test_config_reads_math` | Node loads `astro.config.mjs` as Astro does: `remarkAlerts` and the plugin, the layout plugin under `rehypePlugins`, highlighting off |

## T-078 — each formula laid out when the library is built

`rehype-math.test.ts`.

| Clause | Test | What it showed |
|---|---|---|
| 1 inline | `test_math_inline` | one `math`, no `display`, no `language-math` |
| 2 set apart | `test_math_set_apart_wrapper` | a `$$` fence, a one-line `$$z$$`, a `math` code block: `div.tome-math` holding only `math[display=block]`, no `pre` |
| 2 outside any paragraph | `test_math_set_apart_through_raw` | as Astro, for a divided paragraph, a list item, a quotation and a formula under a heading: no `p` holds the wrapper, none is empty |
| 3 nothing that reaches outside | `test_math_nothing_unsafe` | every formula of the two fixture pages |
| 4 table width | `test_math_table_width` | `equation`, `align`, `gather`, `\tag`: `width:100cqi`, no percent width |
| 5 numbers | `test_math_numbers` | `(1)`, `(2)`, `(3)`, `(4)`, `(7)`, `(5)`, `(6)`; the starred environment none; no placeholder left; each number's cell `tml-right`; a second file starts at `(1)` |
| 6 the constructs | `test_math_constructs` | `mfrac`; `mroot`; one `munderover` or `msubsup` holding `∑`; a four-cell table between stretchy brackets; cases after a brace; two rows of equal cells; a table holding `(1)` |
| 7 a long formula within a line | `test_math_long_inline` | eighteen terms: the only child of `span.tome-math-long`; `x^2`: no wrapper. The threshold is 16 characters, not the plan's 30 (`sprint-meta.md`, Blockages); the test's two cases stand either side of both |
| 8 unreadable | `test_math_unreadable` | two error elements holding `asTyped()`, one message each of the first 60 characters on one line, `console.warn` twice with the chapter's path, the next paragraph rendered |
| 8 an unclosed fence | `test_math_unclosed_fence` | one error element holding all the fence took, one message saying "never closed", no `math` |
| 9 refused commands, references, labels | `test_math_refused_commands` | `\href`, `\url`, `\includegraphics`, `\class`, `\data`, `\ref`, `\eqref`: an error element each, no `a`, `img`, `href`, `src` or `data-`; `\label`: laid out, numbered, no `id` |
| 10 each formula on its own | `test_math_formulas_stand_alone` | a `\def` is known in its own formula and unknown in the next |
| 11 code, and no formula | `test_math_code_untouched`, `test_math_no_formula_no_change` | deep-equal with and without the plugin |
| 12 the exported functions | `test_math_exports`, `test_math_title_text` | for every formula of the fixture pages and four added: `readable()` true exactly when a `math` element is written, `formulaText()` its text less a number or tag cell, `asTyped()` the error element's text; twenty-seven `titleText()` values |
| 13 the config | `test_config_reads_math` | see T-077 |

## T-079 — search, heading addresses and the rail

`search-index.test.ts` and `search.test.ts`. The ten earlier cases of the
first and the three of the second pass unedited (clause 7).

| Clause | Test | What it showed |
|---|---|---|
| 1 found by what it shows | `test_search_formula_text` | `Energy E=mc2 here.`; `ab` between two paragraphs from a `$$` fence and from a `math` block; `sinx` with no invisible character |
| 1 a numbered environment | `test_search_set_apart_environment` | between `$$` lines, on one line alone, and hard against its fences: `E=mc2`, no `begin`; a tagged equation without its tag |
| 2 symbol names | `test_search_symbol_names` | `alpha beta le gamma` added, and `search('alpha')` finds the chapter; `\frac` and `\sqrt` add nothing |
| 3 unreadable, and an unclosed fence | `test_search_unreadable_formula` | held as typed |
| 4 money | `test_search_money_lines` | seven lines keep every dollar sign; a link's address is not search text |
| 5 a heading's address and text | `test_search_heading_formula_slug` | seven headings rendered as Astro renders them, with its own `rehypeHeadingIds`: every slug equals the page's `id`, the repeat `-1` in both; texts `The E = mc² law`, `Why a/b matters`, the unreadable one and a matrix as typed |
| 6 the rail's text | `test_search_formula_headings` | one entry for the formula heading; none for a `<br>` heading or a plain one |
| 8 code | `test_search_formula_in_code` | `$x$` in inline code is text of the code; a `js` block is left out |
| 9 raised and lowered characters | `test_search_words_fold_raised` | `e`, `mc2`, `and`, `ai`; accented words split as before; `search('mc2')` opens at `#the-emc2-law` |

## T-080 — the font and the styles

`styles/__tests__/math.test.ts`; `fonts.test.ts` and `contrast.test.ts` pass
unedited (clause 7).

| Clause | Test | What it showed |
|---|---|---|
| 1 the token | `test_math_font_token` | defined once, `'Tome Math'` first and `math` last; `math.css` imported |
| 2 the face | `test_math_font_from_package` | exactly one `@font-face`, no `unicode-range`, its file in the package and holding a `MATH` table (read from the WOFF2 table directory); every `url()` the package's file or a `data:` picture; no font file tracked. How the "no `http:`" clause is tested is in `sprint-meta.md`, Blockages |
| 3, 4, 6 boxes, Temml's rules, print | `test_math_css_rules` | the three boxes' rules; every rule of `Temml-STIX2.css` for a class Temml wrote into the fixture pages present word for word; no `STIX2`, no counter; `print.css` |
| 5 Sanguine headings | `test_math_sanguine_heading_rule` | a fill that is not transparent, no stroke |

## T-082 — a Word document's equations

`omml-to-latex.test.ts` and `docx-to-markdown.test.ts`.

| Clause | Test | What it showed |
|---|---|---|
| 1 one rule for each element | `test_omml_rules` | forty-one equations give the LaTeX named and `readable()` accepts each; two equations in one paragraph as `gathered`; an equation in the shape Word saves (hand-written) gives the same LaTeX as without Word's properties; a bookmark is passed over; and, added at the Test phase from a file Word saved, a double-struck run holding `∈R` gives `x∈\mathbb{R}` |
| 1 the trial's four faults | `test_omml_trial_faults` | `pmatrix`; `aligned` with its `&`; `\sin θ`; `\lim_{n→∞} a` |
| 2 characters | `test_omml_characters` | symbols as themselves; ten of LaTeX's own characters each shown by `formulaText()` |
| 3 nothing for what has no rule | `test_omml_unknown_is_nothing` | ten kinds, a tracked insertion and a link round a run among them; XML not well formed; an empty equation; LaTeX the layout engine refuses |
| 4 written between dollar signs | `test_docx_equations_carried` | `$\frac{m}{V}$` in its line, `$$E=mc^{2}$$` as a paragraph; no backslash doubled; no mark, no token |
| 5 read back exactly | `test_docx_equations_read_back` | the fixture, and six variants (before a digit; holding a dollar sign, a backtick, `://`, `](`; ending in a dollar sign) |
| 4, 5 in containers | `test_docx_equation_in_containers` | a table cell (`a\vert b`, cells unchanged), a heading (inline), a list item, a quotation and a footnote (set apart inside each) |
| 6 a dollar sign of the document's own | `test_docx_dollar_in_text` | written `\$`; the paragraph holds exactly one formula |
| 7 a title | `test_docx_title_with_equation` | `On the Weight of √2`; a matrix between dollar signs; the mark for an unknown one; never a token |
| 8 the mark, and the count | `test_docx_equations_marked`, `test_docx_marks_are_literal` | one mark, directly before `(see the table)`, as text that forms no link; the other equation carried; the count 1, and no entry when all are carried |
| 9 everything else as before | the other 25 cases of `docx-to-markdown.test.ts` | pass; two edited (`[]` where two equations were listed) |

## T-084 — a Markdown document's title

`document-stage.test.ts`.

| Clause | Test | What it showed |
|---|---|---|
| 1, 2 | `test_prepare_markdown_title_formula` | `√2` and `x² ≥ 0` in the title; an unreadable formula, a matrix and a price as typed; the Markdown itself unchanged; nothing written |
| 3 | `test_prepare_markdown_title_unchanged`, and the ten earlier cases unedited | a heading with emphasis, code and a tag; a document with no heading |

## T-083 — the tutorial

| Clause | Test | What it showed |
|---|---|---|
| 1 | `test_tutorial_covers_mathematics` (`tutorial-math.test.ts`) | linked after "Panels & Tables"; fifteen things shown as source; eight said in words; laid out by the build's own plugins: a fraction, roots, a sum with limits, three tables, numbers `(1)`, `(2)`, `(3)`, no error element, the price line |
| 2 | `test_tutorial_covers_documents` (`tutorial.test.ts`) | the guide and the README say equations are carried over and name the mark; the README links the chapter |
| 5 | `test_books_library`, `test_pager_prev_next` (`book.test.ts`) | the chapter in its place; the last chapter's neighbours unedited |

## Existing tests edited, and why

Each was edited only where it asserted an equation's mark or count, or to
list the new chapter or gate:

- `docx-to-markdown.test.ts`: `test_docx_marks_are_literal` and
  `test_docx_equations_marked` now run on the paper with its first equation
  made unknown (the literal-mark proof kept); `test_docx_reader_messages` and
  `test_docx_decoration_is_silent` expect `[]` where they expected two
  equations.
- `document-stage.test.ts`: `test_prepare_word` expects `[]` and the equation
  in the staged Markdown.
- `load-books.test.ts`: the two `test_loader_reports_left_out` cases (one
  unknown equation is reported as `left out 1 equation`; the chart case
  reports no equations).
- `book.test.ts`: one slug added to `test_books_library`.
- `fixture-commands.test.ts`: `check-math.mjs` added to the refusal list.
- `ci-workflow.test.ts`: two assertions added.
- `remark-math-dollars.test.ts`: `test_config_reads_math`, written in T-077,
  gained the rehype assertion in T-078.
