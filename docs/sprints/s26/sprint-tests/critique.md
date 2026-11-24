# Test Critique — Sprint 26

This is a read-only fifth review. The tested code is `c9f4e2e`. While I worked, the head moved to `4d5ac91`, which holds records only: `git diff c9f4e2e HEAD -- scripts src fixtures` is empty. I edited, staged and built nothing, and `git status` was empty at the end.

**How I checked.** I ran every reproduction through Tome's own `readPaper()` + `writePaper()`, or `resolveSource()` + `readDocuments()`/`prepareDocument()`, with the installed `pandoc-wasm`. The papers were my own, in a scratch folder outside the repository, and every run had a time limit. To compare with the code before, I loaded the reader from `43c9a66` (`git show` into the scratch folder) and gave it the same `convert`. `npx vitest run src/lib/__tests__/pandoc-read.test.ts`: all 32 tests passed.

**The five fixtures, end to end, are unchanged from what the tests and INT-0033 say.**
- `latex/paper.tex`:
  - The title is "A Short Paper on Sums".
  - The seven headings, ending in Appendix, Closing and References, are as asserted.
  - `[LaTeX not shown]` appears 3 times.
  - `leftOut` kinds are citation, command (`\today`), latex ×3 (`\appcmd` with `file: appendix.tex`) and reference.
  - One staged picture.
- `typst/paper.typ`:
  - Same title.
  - `leftOut` `[]`.
  - The appendix, closing and reference list are read.
  - One staged picture.
- `uses-a-package.typ` is refused with `"uses-a-package.typ" (line 1, column 2): HOME not defined`. The reason uses the real name, not the stand-in.
- No `tomefile` appears anywhere in any of the results.

### Concerns of the fifth review

### C-001: a Typst file included through a variable now refuses the whole paper, with a false reason, and the record added in `c9f4e2e` says the opposite (regression)
- **Where:** `readTypst()` holder search in `scripts/pandoc-read.mjs`, which now matches only `TYPST_FILE_CALL`. INT-0033 Consequences, the limit added in `c9f4e2e`. Criteria AC1 and AC5.
- **Quote:** "a file included from a variable (`#for c in ("a.typ",) { include c }`) is read in the paper and is also a chapter of its own"
- **Failure mode:** negative-path
- **Why it matters:**
  - **The cause.** Pandoc asks for the file by its words. The holder search now accepts the name only when it follows `include(`/`read(`/…, so a name held in `#let` or in an array is found nowhere.
  - **The result.** The paper is refused with "a.typ could not be read: it is not a file in the paper's folder". The file is there.
  - **In a folder,** the paper becomes a "[document not shown]" placeholder, and each included file becomes a chapter of its own.
  - **Named on its own,** the paper stops the load.
  - **At `43c9a66` every case below read correctly** (checked by loading that commit's reader).
  - **The shape is ordinary.** A chapter list looped with `include` is a usual way to lay out a Typst thesis or book. The record's own example fails.
  - **What keeps it out of `block`:** the reader is told that the paper was refused, so the loss is not silent. The reason given is false.
- **Suggested response:** add-test and fix.
  - When no call names the asked-for file, fall back to any string outside raw text, as at `43c9a66`.
  - Or: now that the paper's own file has a stand-in, supply a root-level ask under its own name.
  - Add a test using the record's example.
  - Until it is fixed, the record is false.
- **Reproduction:** `main.typ` = `= Main` / `#for c in ("a.typ", "b.typ") { include c }`, with `a.typ` and `b.typ` present. These are refused the same way:
  - the record's one-element form;
  - `#let ch = "ch1.typ"` / `#include ch`;
  - `#let chapters = ("intro.typ", "method.typ")` / `#for c in chapters { include c }`;
  - `#let f = "data.csv"` / `#let rows = csv(f)`.

### C-002: a `%` in `\nolinkurl` still writes the build day
- **Where:** `LATEX_CODE_SOURCE` in `scripts/pandoc-read.mjs`: only `\url` and `\href` addresses are matched before a comment. The record is INT-0033 Consequences, "The day a library is built is never written".
- **Quote:** "The record "the day a library is built is never written" holds for every shape the review gave"
- **Failure mode:** weak-assertion
- **Why it matters:** `See \nolinkurl{a%20b}, built \today.` gives "See `a%20b`, built 2026-11-24." with `leftOut` `[]`.
  - Pandoc reads the `%` as a character. Tome takes it for a comment, so `\today` is never made a piece.
  - The record is unqualified and is false for this shape. The shape is uncommon.
  - (`\path{a%20b}` is refused by pandoc itself, with its reason.)
- **Suggested response:** add-test, and either add `nolinkurl` (and the like) to the address alternative or qualify the record.

### C-003: a stand-in name still reaches prose, which the record does not cover (round 4's C-004, residue)
- **Where:** the holder rewrite with `TYPST_FILE_CALL` in `readTypst()`. It matches the call words anywhere, prose included, unlike `typstFilesNamed()`, which needs `TYPST_CODE_PLACE`. The record is INT-0033's "a file's stand-in name can reach code the paper shows".
- **Quote:** "in an uncommon shape a file's stand-in name can reach code the paper shows"
- **Failure mode:** negative-path
- **Why it matters:** the paper's own words are replaced with no word.
  - `We include "ch1/ch1.typ" below, and import "ch1/ch1.typ" too.` before a real `#include "ch1/ch1.typ"`: the page reads "We include “tomefile1.typ” below, and import “tomefile1.typ” too."
  - `The data is read with the call read("data/table.csv") as shown.` shows `read(“tomefile1.csv”)`.
  - The shape is uncommon, but this is prose, not code, so the record is narrower than the behaviour.
- **Suggested response:** tighten. Rewrite only where code stands (`TYPST_CODE_PLACE`, comments blanked, as `typstFilesNamed` does). Or widen the record to "text or code the paper shows".

### C-004: a lone triple backtick still pairs across lines (round 4's C-001, residue from `5662158`)
- **Where:** `TYPST_CODE`'s block alternative `` (`{3,})[\s\S]*?\1 `` in `scripts/pandoc-read.mjs`.
- **Quote:** "a lone backtick, escaped or in a comment or a string, would then pair with the next raw text and hide all between: a line is the safer reach."
- **Failure mode:** negative-path
- **Why it matters:** the round-4 fix covers one backtick, not a fence. A ```` ``` ```` in a `//` comment or a string pairs with the next real raw block and hides everything between.
  - **Comment, then include:** `// fences are written ``` in Typst`, then `#include "intro.typ"`, then a raw block. The paper is refused with "intro.typ could not be read: it is not a file in the paper's folder". The same happens with `#let fence = "```"`.
  - **In a chapter, before a picture:** the chapter's `#image("fig.png")` is not rewritten. The root `fig.png` (different bytes) is shown instead, with `leftOut` `[]`, which is silent.
  - The shape is uncommon.
- **Suggested response:** defer-with-rationale. Record it beside the one-line raw limit, or blank comments and strings before finding fences.

### C-005: a formula alone beside the list's begin or end, in the same paragraph, is dropped (round 4's C-002, sibling, from T-091)
- **Where:** `arrangeBibliography()` in `scripts/pandoc-to-markdown.mjs`: `const words = (inlines) => (wordsOf(inlines).trim() ? [...] : [])` applied to `before` and `after`.
- **Quote:** "a formula, a note or a word of the paper's own makes the paragraph the paper's."
- **Failure mode:** negative-path
- **Why it matters:** `quietOnly` was fixed, but the same `wordsOf` test still decides `before` and `after`.
  - `\section*{References}` / `$x^2$` / `\begin{thebibliography}{9}` with no blank line: the formula vanishes.
  - So does `\end{thebibliography}` / `\[ y = 2 \]` with no blank line.
  - In both cases `leftOut` is `[]`. The shape is contrived. (Words in those places are kept.)
- **Suggested response:** add-test and fix: keep `before` and `after` when they hold any inline that is not a space.

### The fourth round's concerns, judged at `c9f4e2e`

- **C-001 is closed.**
  - The three reproductions read the chapter: escaped backtick, backtick in a comment, backtick in a string.
  - The picture reproduction shows `ch1/fig.png` with `leftOut` `[]`.
  - Variations held: `/* ` */`, and a lone backtick in a comment before a `#figure(image(...))` in a chapter.
  - Residue is C-004.
- **C-002 is closed.**
  - A set-apart formula, a footnote, and `\bibliographystyle{plain} $x^2 + y^2$` are each kept, under two "References" headings.
  - Variations passed over to one heading with nothing lost:
    - `\phantomsection` alone;
    - `\phantomsection` + `\addcontentsline{toc}{section}{References}`;
    - `\label{refs}`, `\nocite{*}`, `\vspace{1em}\noindent`, `\bibliographystyle{plain}~`.
  - A word or `\texttt{x}` is kept.
  - Sibling is C-005.
- **C-003 is closed for the shapes given.**
  - `\url`, `\href`, `\lstinline{…}` and `\iffalse…\else`: the day is counted, not written.
  - `\lstinline[language=C]|\begin{verbatim}|` and `Row one\\%`: the intro is read, and the shown code keeps `\input{chapters/intro}`.
  - The `\url` cycle is refused in a few milliseconds.
  - Variations held:
    - `\url {…%…}` (a space before the brace);
    - `\url` with `\input` on the same line;
    - `\\\%` (odd run) and `\\\\%` (even run);
    - `\lstinline[language=C]{a % b}` and `\verb!%!`;
    - `\iffalse \input{gone} \else \input{intro} \fi`, which reads the intro;
    - a `\url{` inside verbatim;
    - an `\href` text over a line end.
  - A nested `\ifx…\else` inside `\iffalse` ends at the inner `\else`, as pandoc does; the stray `\fi` is counted.
  - Residue is C-002.
- **C-004 is closed for the shapes given.**
  - `#raw("notes.typ")` stays `notes.typ`, and the chapter reads `ch1/notes.typ`.
  - In the own-name case `ch1/main.typ` is read.
  - Cycle messages use real names: "main.typ → main.typ", and "main.typ → ch1/ch1.typ → main.typ" through `../main.typ`.
  - Refusal reasons use real names.
  - The paper's root and `/`-rooted pictures, and a chapter's picture, are staged correctly with the main file under a stand-in.
  - `csv("data.csv")` in a chapter reads.
  - Residue is C-003, and the new regression is C-001.

### The eight failure modes, briefly
1. **Trace:** no new gap at AC level, except that C-001 leaves INT-0033's own record unproved (and false).
2. **Weak assertion:** the new tests assert content, not just headings. The `\today` record is asserted only for the given shapes (C-002).
3. **Stub leakage:** none. The new tests use real pandoc, or hand-built trees that are pandoc's shape.
4. **Integration drift:** none. `test_prepare_paper_odd_backtick` goes through `resolveSource` and `prepareDocument`.
5. **E2E cop-out:** none seen.
6. **Negative paths:** C-001 and C-003 to C-005.
7. **Flake risk:** low. `test_pandoc_today_after_percent` compares with `new Date().getFullYear()`, which is fine outside a New Year's midnight. Pandoc runs are bounded by per-test timeouts.
8. **Evidence drift:** not raised, as instructed.

### Confidence of the fifth review
proceed-with-caveats

No concern loses or replaces content without a word in an ordinary paper:
- **C-001** is an ordinary shape, but the paper is refused with a reason (a false one).
- **C-002 to C-005** need uncommon shapes.

Even so:
- **C-001 is a regression introduced by the fourth round's answer.** It makes a record written in that same commit false. Fix it (or at least correct the record and the false reason) and add a test before `test-report.md`.
- **C-002 and C-003** each make a record narrower than the behaviour. Correct the record or the code.

## Responses (the sprint's author)

Answered in `e897481`, each fix with a test checked to fail with its fix undone.

| Concern | Answer |
|---|---|
| C-001 a file named in a variable | Fixed: when no call names the asked-for file where code stands, any string outside raw text is tried. `test_pandoc_typst_files_from_variables` (the record's loop, a one-element loop, `#let ch` then `#include ch`, a csv path in a variable). |
| C-002 `\nolinkurl` | Fixed: it joins `\url` and `\href` as an address matched before a comment. `test_pandoc_today_after_nolinkurl`. |
| C-003 prose rewritten | Fixed for calls: a file is named by a call only where code stands, so `We include "ch1.typ"` in prose is left (same test). INT-0033 now says a stand-in name can reach "text or code the paper shows" in an uncommon shape, which covers the string fallback. |
| C-004 a fence in a comment | Deferred and recorded in INT-0033 beside the one-line raw limit. |
| C-005 a formula beside the list | Fixed: what stands beside the list in its paragraph is kept when it holds any inline but spaces. `test_paper_formula_beside_list`. |

## Check of the answers, by the same reviewer

This is a read-only judgement of the answers to the fifth review, at `e897481`, which is the code under test and the head. I edited, staged and built nothing in the repository, and `git status` was empty at the end.

**How I checked.**
- I re-ran every reproduction from my earlier report through `readPaper()` + `writePaper()`, or `resolveSource()` + `readDocuments()`/`prepareDocument()`, with the installed `pandoc-wasm`. The papers were my own, outside the repository, and every run had a time limit.
- To compare with the code before, I loaded the reader from `43c9a66` and gave it the same `convert`.
- `npx vitest run src/lib/__tests__/pandoc-read.test.ts`: all 34 tests passed.

## Concerns

### C-001: a call that cannot be served still rules out the string fallback (residue of the fifth review's C-001)
- **Where:** `readTypst()` in `scripts/pandoc-read.mjs`. The pattern is chosen once per request: `holders.some(... named(placedCall) ...) ? placedCall : TYPST_STRING`. There is no fallback when the call-holders supply nothing. Criteria AC1 and AC5.
- **Quote:** "only when no file holds such a call for the asked-for name does it fall back to any string outside raw text"
- **Failure mode:** negative-path
- **Why it matters:**
  - **The cause.** A call that names the same file, but cannot be served, rules out the fallback. Such a call can be commented out, or inside a function never called, in another folder.
  - **The result.** The holder that really asks is never looked at. The paper is refused with "intro.typ could not be read: it is not a file in the paper's folder", and the file is there.
  - **Both shapes are uncommon,** and the paper is refused with a reason (a false one), so nothing is lost without a word.
- **Reproduction:**
  - **A commented call:** `main.typ` holds `// #include "intro.typ"` and `#include "ch1/ch1.typ"`. `ch1/ch1.typ` holds `#let parts = ("intro.typ",)` and `#for c in parts { include c }`. Only `ch1/intro.typ` exists. The paper is refused.
  - **A call never made:** `main.typ` holds `#import "lib/defs.typ": later`, where `lib/defs.typ` is `#let later() = include "intro.typ"`. Main also holds `#let parts = ("intro.typ",)` and `#for c in parts { include c }`. Root `intro.typ` exists. The paper is refused.
- **Suggested response:** add-test and fix: when the call pass supplies nothing, run the string pass before refusing.

### C-002: a Typst paper that includes 20 or more files is refused with a false reason (found this round, from before `43c9a66`)
- **Where:** `readTypst()`: `if (!asked || count >= LIMITS.readings - 1) throw error;` with `LIMITS.readings` = 20. Pandoc's Typst reader stops at the first missing file, so every included file costs one reading. Not recorded in INT-0033 Consequences or the tutorial's limits. Criteria AC1 and AC5.
- **Quote:** "A Typst paper that never stops asking is refused with pandoc's reason." (test comment in `test_pandoc_limits`)
- **Failure mode:** negative-path
- **Why it matters:**
  - **The result.**
    - A `main.typ` with 19 `#include "ch/pN.typ"` lines is read.
    - With 20 or 25 lines it is refused with "ch/p19.typ: withBinaryFile: does not exist (No such file or directory)", though the file is there.
    - It was the same at `43c9a66`. The fallback did not cause this.
    - The same holds for a chapter list in a variable.
    - LaTeX is unaffected: 25 `\input`s are read, because pandoc reports them all in one reading.
  - **The shape is ordinary.** A thesis or book in Typst split into 20 or more files is a realistic paper. The whole paper becomes a placeholder chapter.
  - **What keeps it out of `block`:** the paper is refused with a word, although the reason is false.
  - **The test only covers a chain.** `test_pandoc_limits` asserts the limit for an endless chain, which is right, but not for a wide paper that ends.
- **Suggested response:** fix or record before the report.
  - Either bound Typst readings by the file limit, or by readings that supply nothing new, rather than by 20.
  - Or refuse with a reason that names the limit, and record it in INT-0033 and in the tutorial's limits.
  - Add a test with 25 includes.

### C-003: the fallback still rewrites a string the paper shows (recorded; noted only)
- **Where:** the `TYPST_STRING` rewrite in `readTypst()`. The record is INT-0033's "in an uncommon shape a file's stand-in name can reach text or code the paper shows".
- **Quote:** "In fallback mode a string is rewritten wherever it stands"
- **Failure mode:** negative-path
- **Why it matters:** the record is now true, so this is noted, not raised.
  - **Prose in another file.** `main.typ` holds the prose `The old file was "part.typ" once.`, and `ch1/ch1.typ` holds `#let p = "part.typ"` / `#include p`. Both `part.typ` files exist.
    - The chapter correctly reads `ch1/part.typ`.
    - But main's prose shows "“tomefile2.typ”", and the root `part.typ` is read for nothing.
    - With no root `part.typ`, the prose is left.
  - **A shown string in the same file.** `#raw("intro.typ")` and a quoted "intro.typ" in the file holding the chapter list both show `tomefile1.typ`.
- **Suggested response:** defer-with-rationale. This is within the record. Optionally, try the string pass on the asking file first.

## The fifth review's concerns, judged at `e897481`

- **C-001 is closed for its shapes.**
  - These now read in the paper, and match `43c9a66`:
    - the two-file loop;
    - the record's one-element loop;
    - `#let ch` / `#include ch`;
    - a two-chapter list in a variable;
    - `csv(f)`;
    - `#bibliography("refs.bib")`.
  - On the coordinator's question about the wrong holder:
    - **Two chapters in two folders,** each with `#let p = "part.typ"` / `#include p`, read `a/part.typ` and `b/part.typ` correctly.
    - **A variable in a chapter and the name in prose in the paper:** the right file is read, and the prose shows a stand-in (C-003).
    - **A variable ahead of a call in another file:** settled correctly over two readings, because a holder that is not rewritten keeps asking.
    - **A loop until the read limit:** it happens only through the wide-paper limit (C-002), not through the fallback.
    - **An odd `"` earlier on the line** (`// 5" wide`) did not break pairing.
  - **Residue:** C-001 above.
  - **Not a fault:** a joined name (`base + ".typ"`) is refused, as at `43c9a66`. This is within "found by pattern".
- **C-002 is closed.** `See \nolinkurl{a%20b}, built \today.` gives "built ." with `\today` counted.
- **C-003 is closed for calls in prose.**
  - `We include "ch1/ch1.typ" …` and `read("data/table.csv")` in prose are left as written.
  - `#raw("notes.typ")` is left.
  - The own-name case still reads `ch1/main.typ`.
  - Cycles and refusals use real names.
  - The fallback's leak is within the widened record (C-003 above).
- **C-004 is deferred and recorded,** and the record is true: a ```` ``` ```` in a comment still refuses `intro.typ` with the false reason. The single-backtick shapes and the chapter-picture shapes still hold.
- **C-005 is closed.**
  - `$x^2$` before `\begin{thebibliography}` in the same paragraph is kept, and so is `\[ y = 2 \]` after `\end{thebibliography}`.
  - The quiet cases still pass over to one heading:
    - `\bibliographystyle`, `\phantomsection`, `\phantomsection` + `\addcontentsline`;
    - `\label`, `\nocite{*}`, `\vspace\noindent`, `~`.
  - The fourth review's formula, note, and layout-plus-formula cases keep their content.

## The eight failure modes, briefly
1. **Trace:** nothing new at AC level, beyond C-002, a limit that touches AC1 and is recorded nowhere.
2. **Weak assertion:** the new tests assert words and the absence of `tomefile`. `test_pandoc_limits` asserts the Typst limit only for a chain (C-002).
3. **Stub leakage:** none.
4. **Integration drift:** none.
5. **E2E cop-out:** none.
6. **Negative paths:** C-001 and C-002.
7. **Flake risk:** low. The `\today` tests compare with the current year, which is fine outside New Year's midnight.
8. **Evidence drift:** not raised, as instructed.

## Confidence
proceed-with-caveats

All five concerns of the fifth review are closed or truly recorded. No open concern loses or replaces content without a word:
- **C-001** needs an uncommon shape and refuses with a reason.
- **C-002** refuses with a reason.
- **C-003** is within its record.

**C-002 should be fixed, or recorded and its reason corrected, before `test-report.md`.** It is the one open fault an ordinary paper can meet (a Typst book of 20 or more files), and its reason ("does not exist") is false.

## Responses to the check (the sprint's author)

Answered in `ec59737`, each fix with a test checked to fail with its fix undone. No source or test was changed after this.

| Concern | Answer |
|---|---|
| C-001 a call that cannot be served | Fixed: the call pass and then the string pass are each tried before the paper is refused. `test_pandoc_typst_string_after_call` (the reviewer's two papers). |
| C-002 twenty or more Typst files | Fixed: a Typst paper's readings are bounded by the files it may pull in (200, or 20 MB), not by twenty readings, since pandoc's Typst reader asks for one file a reading; past the limit the paper is refused with the limit as its reason. `test_pandoc_typst_many_files` (twenty-five files, read); `test_pandoc_limits` now shows a chain refused with pandoc's reason after a reading for each file, and a paper past the limit refused naming it. Recorded in INT-0033. |
| C-003 the fallback's rewrite | Within the record, as the check says; left. |
