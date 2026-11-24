# Test Critique — Sprint 26

This is a read-only fourth review at head `860b165`, with the tested code at `43c9a66`. Nothing in the repository was edited, staged or built, and `git status` was empty before and after.

**How I checked.** I ran every reproduction through Tome's own `readPaper()` + `writePaper()`, or `resolveSource()` + `prepareDocument()`, with the installed `pandoc-wasm` 1.1.0. The papers were my own, in a scratch folder outside the repository, and every run had a time limit. `npx vitest run src/lib/__tests__/pandoc-read.test.ts`: all 28 tests passed. As asked, I do not raise the staleness of the result records or any recorded limit whose record is true.

## Concerns

### C-001: an odd backtick now hides everything up to the next inline raw (a regression from letting Typst raw span lines)
- **Where:** `TYPST_CODE` in `scripts/pandoc-read.mjs`. It was `` `[^`\n]*` `` at `5662158` and is `` `[^`]*` `` now. Three places use it: `typstFilesNamed()`, the holder search (`text.replace(TYPST_CODE, '')`) and `picturesFromRoot()`. Test: `test_pandoc_more_code_shapes`, which has only a balanced pair. Criteria: INT-0033 AC1 and AC5.
- **Quote:** "Code in a Typst file: a raw block, or raw text, which may run over a line end."
- **Failure mode:** negative-path
- **Why it matters:** The pattern pairs single backticks that Typst never pairs. An escaped `` \` `` in prose, a backtick in a `//` comment, or one inside a string is paired with the opening backtick of the next real inline raw, and everything between counts as raw.
  - **The include is hidden.** An `#include` in that stretch names nothing. The holder search then cannot find who names the file, so the whole paper is refused, with the false reason "ch1/ch1.typ could not be read: it is not a file in the paper's folder". The included file also becomes a chapter of its own.
  - **In a chapter, the picture path is hidden.** It is not rewritten, so the paper-root picture of the same name is shown with no word, `leftOut` `[]`. This is round 2's C-002 fault again. With only the chapter's picture present, it takes the mark and is counted.
  - **The old pattern read all of these correctly**, because the odd backtick had no partner on its own line.
- **Suggested response:** add-test (each of the three shapes below), and fix: find inline raw only after blanking `` \` `` escapes, comments and strings. Keep the offsets, so the spans stay true.
- **Reproduction:**
  - **Escaped backtick:** `main.typ` = `= Main` / ``Write \` for a backtick.`` / `#include "ch1/ch1.typ"` / ``Use `code` here.``, with `ch1/ch1.typ` present. `readPaper` refuses the paper as above. In a folder, `stage` gives a placeholder for `main.typ` and a separate chapter `ch1/ch1.typ`.
  - **Backtick in a comment:** `` // the ` key is odd `` before `#include "intro.typ"`, then later inline raw. Same refusal, and `intro.typ` becomes its own chapter.
  - **Backtick in a string:** `` #let tick = "`" `` instead of the comment. Same result.
  - **Picture:** `ch1/ch1.typ` holds ``Write \` …`` / `#image("fig.png")` / ``Use `code` here.``, and `fig.png` and `ch1/fig.png` have different bytes. Both images on the page are `./__tome_parent_assets__/fig.png`, only the root file is staged, and `leftOut` is `[]`.

### C-002: `quietOnly` passes over a paragraph that has no words, and the passed-over block is then deleted
- **Where:** `quietOnly()` and `arrangeBibliography()` in `scripts/pandoc-to-markdown.mjs` (`blocks.slice(0, headed ? place : from)`); test `test_paper_list_heading_words`; criteria INT-0033 AC2 and AC5.
- **Quote:** "A paragraph between them that holds only layout the page does not show (`\bibliographystyle{plain}`) is passed over."
- **Failure mode:** weak-assertion
- **Why it matters:**
  - **What counts as quiet.** `quietOnly` judges by `wordsOf()`, which returns `''` for `Math` and `Note`. So a paragraph holding only a set-apart formula, only a footnote, or a quiet command plus inline math is "quiet".
  - **What is lost.** When a list-naming heading stands before such a paragraph, the blocks from the heading to the list are dropped. The formula or footnote vanishes, and `leftOut` is `[]`.
  - **The test** checks only which headings are written, never that a passed-over block held nothing.
  - **The shape** is uncommon. It is new in `43c9a66`.
- **Suggested response:** tighten-assertion and fix: pass over a paragraph only when every inline in it is a `Str` of quiet tokens, or `Space`/`SoftBreak`. Do not judge by `wordsOf`.
- **Reproduction:** each paper has `\section*{References}`, then the extra paragraph, then a two-item `thebibliography`.
  - `\[ E = mc^2 \]`: the formula is gone.
  - `\footnote{… SOURCE NOTE WORDS.}`: the note is gone.
  - `\bibliographystyle{plain} $x^2 + y^2$`: the formula is gone.
  - In each case the page reads `## References` and then the list, with `leftOut` `[]`.
  - **What held:** an image-only paragraph keeps its alt text "image" and is kept. A `\label{refs}` paragraph keeps its anchor.

### C-003: matching a `%` comment first makes the record "the day a library is built is never written" false, and lets a stand-in name into shown code
- **Where:** `LATEX_CODE_SOURCE` and `TODAY_OR_CODE`, the `renamed`/`forced` fallback in `readLatex()`, and `refuseCycle()`, all in `scripts/pandoc-read.mjs`. Records: INT-0033 Consequences, "The day a library is built is never written", and "A file named only in code the paper shows names nothing". Test: `test_pandoc_asked_again`, which asserts the forced rewrite in the source but never what the page shows.
- **Quote:** "`\today` outside code is a piece of its own, so the day is never written."
- **Failure mode:** weak-assertion
- **Why it matters:** `(?<!\\)%[^\n]*` takes a `%` that LaTeX and pandoc read as a character to be a comment. The `\lstinline` alternative excludes the brace form, and `\iffalse … \fi` swallows an `\else` branch that LaTeX prints. Each of these hides real text from Tome, in three ways.
  - **The build date is written.** A `\today` after them is left for pandoc, which writes the date.
    - `See \url{http://x.org/a%20b}, built \today.` gives "built 2026-11-24."
    - `\href{https://doi.org/10.1000/a%2Fb}{doi}, \today.` writes the date as well.
    - So does `Type \lstinline{x % y} on \today.`.
    - So does `\iffalse` / `draft` / `\else` / `Printed \today.` / `\fi`.
    - At `5662158` the first three were replaced, because `%` was not in `TODAY_OR_CODE`.
  - **A stand-in name reaches shown code.** When an over-wide code region hides a real `\input`, the forced fallback rewrites that argument in every text, real code included.
    - `Use \lstinline[language=C]|\begin{verbatim}| here.`, then `\input{chapters/intro}`, then a verbatim showing `\input{chapters/intro}`: the code block on the page reads `\input{tomefile1}`.
    - `Row one\\% \begin{verbatim} old` in place of the first line does the same.
    - The intro's words are read, so only the shown code is changed, with no word.
  - **A cycle is hidden.** The same shapes hide a real self-`\input` from `refuseCycle`, and the build hangs (exit 124 at 40 s) instead of refusing. `See \url{http://x.org/a%20b} and \input{paper} here.` hangs; the plain `\input{paper}` is refused in 0.2 s. Such a paper also loops in LaTeX, so this is minor, and the `\url` case already hung at `5662158`.
- **Suggested response:** add-test and fix:
  - Do not take a `%` inside a `\url`/`\href` argument for a comment.
  - Accept `\lstinline[…]` and `\lstinline{…}`.
  - End an `\iffalse` region at `\else` as well.
  - In the forced fallback, rewrite outside code first, and only then everywhere.
  - Or, failing those, correct the two records.

### C-004: a Typst stand-in name can still reach the page, and the paper's own name can still answer for a chapter's file (round 3's C-002, residue)
- **Where:** `readTypst()` in `scripts/pandoc-read.mjs`: the holder rewrite `part.replaceAll(`"${literal}"`, `"${name}"`)`, and the paper's own file kept under its own name (`flat: true`). Criteria: INT-0033 AC2 and AC5.
- **Quote:** "Every file but the paper's own takes a stand-in name: a file of the same name beside the paper could otherwise answer for a chapter's."
- **Failure mode:** negative-path
- **Why it matters:**
  - **Any string is rewritten.** The holder rewrite changes every string equal to the asked-for name, not only include arguments. A string that the paper shows takes the stand-in. This is silent, but needs an uncommon shape.
  - **The paper's own name still answers.** The paper's own file keeps its real name in pandoc's flat map. A chapter that includes a sibling with the paper's file name gets the paper itself, and the paper is refused as a cycle with a false trail. Typst would read the sibling. This case is loud.
- **Suggested response:** add-test, and fix:
  - Rewrite only the string that is an `include`/`import` argument.
  - Give the paper's own file a stand-in too, or settle a request against the asking file's folder before the flat map can answer it.
- **Reproduction:**
  - **A shown string:** `main.typ` = `Source file: #raw("notes.typ")` / `#include "ch1/ch1.typ"`; `ch1/ch1.typ` includes `"notes.typ"`, and both `notes.typ` files exist. The chapter is right, but the page shows "Source file: `tomefile2.typ`".
  - **The paper's own name:** `main.typ` includes `"ch1/index.typ"`, which includes `"main.typ"`, and `ch1/main.typ` exists. The paper is refused with "its files pull each other in without end: main.typ → ch1/index.typ → main.typ".

## The third round's concerns, judged at `43c9a66`

- **C-001 is closed.**
  - The reviewer's three papers read correctly (commented `\begin{verbatim}`, `\lstinline|\begin{verbatim}|`, half-commented `lstlisting`), with no `tomefile` on the page and `missing` `[]`.
  - Variations held as to content: `\verb|%|` before an `\input`, and `\url{…%20…}` with an `\input` on the same line.
  - The `\lstinline[…]` and `\\%` shapes also read the file, but leak a stand-in into shown code (C-003 above).
- **C-002 is closed for the reported shapes.**
  - Both orders work, and so does a name only in a comment.
  - These also held:
    - two chapters `a/a.typ` and `b/b.typ`, each including its own `part.typ`;
    - two chapters including one shared file (`"../common/c.typ"` and `"/common/c.typ"`);
    - one chapter included twice;
    - `#import "lib/defs.typ": greet`.
  - The residue is C-004 above.
- **C-003 is closed.**
  - The test cases hold.
  - So do `#figure(` over several lines with `image(width: 80%, "fig.png")` and a caption holding quotes, and `#box(image(height: 2em, "fig.png"))`.
  - Prose is left as written.
  - A path held in a variable (`#let p = "fig.png"` / `#image(p)`) in a chapter still shows the paper-root picture. I take that as within the recorded pattern limit.
- **C-004 is closed.**
  - `grid` and `align` hold.
  - So do `#if true { include "a.typ" } else [#include "b.typ"]` and `#stack(dir: ltr, spacing: 1em, include "c.typ")`: one chapter, and the false branch is shown by neither.
- **C-005 is closed for the listed shapes.** A nested `\if…\fi` inside `\iffalse` ends at the first `\fi`, as pandoc itself does: pandoc shows the rest and counts the stray `\fi`, so Tome and pandoc agree. `\finally` does not end the region. `\today` after `\iffalse … \fi` on one line is counted, not written. The `comment` environment is dropped by pandoc and names nothing.
- **C-006 is closed.**
  - These held:
    - "Acknowledgements and References" becomes the list's heading, and nothing is lost;
    - a "Literature review" section with content keeps its words, and the list gets its own `## References`;
    - "Notes" and "Further Reading" are kept, followed by `## References`, as designed.
  - Still open: a `\phantomsection` paragraph between the heading and the list gives two "References" headings, because it is counted, not quiet. Nothing is lost.
  - The new fault is C-002 above.

**Other things I tried, beyond the third round's concerns:**
- A loop of includes held from a variable (`#for c in ("a.typ", "b.typ") { include c }`) reads correctly in the paper. Both files are also chapters of their own, so the text appears twice. I take this as within the recorded limit "code is found by pattern, not by a parser", but the record could name it.

## Confidence

proceed-with-caveats

No concern loses or replaces content without a word in an ordinary paper:
- **C-001** refuses the paper with a reason, or needs same-named pictures in the root and a chapter, plus an odd backtick.
- **C-002** needs a formula or footnote alone between a list-naming heading and the list.
- **C-003** and **C-004** need uncommon shapes.

Even so:
- **C-001 and C-002 are regressions from `43c9a66`.** Each has a small, local fix, and each should get a test.
- **C-003 makes a recorded promise false.** Fix the code or correct the record before the report.

## Responses (the sprint's author)

Answered in the commit that follows this review's record (`git log`), each fix with a test checked to fail with its fix undone.

| Concern | Answer |
|---|---|
| C-001 a lone backtick | Fixed by reading Typst raw text within one line again, as at `5662158`. `test_pandoc_odd_backtick` (escaped, in a comment, in a string), `test_prepare_paper_odd_backtick` (a chapter's picture, and no part made a chapter). Raw text that runs over a line end and names a file is recorded in INT-0033 as a limit, being far rarer than a lone backtick. |
| C-002 `quietOnly` | Fixed: a paragraph is passed over only when every inline in it is a space or the words of pieces passed over. `test_paper_list_heading_keeps_content` (a set-apart formula, a note, a layout command with a formula). `\phantomsection` joins the layout commands, so it is passed over. |
| C-003 `%` and `\today` | Fixed: the address of a `\url` or `\href` is matched before a comment; a `%` after an even run of backslashes begins a comment; `\lstinline` is code in its option and brace forms; `\iffalse` ends at `\else` as well as `\fi`. The record "the day a library is built is never written" holds for every shape the review gave: `test_pandoc_today_after_percent`, `test_pandoc_lstinline_forms` (no stand-in name in shown code). A stand-in name reaching shown code in some other uncommon shape is recorded as a limit. |
| C-004 Typst names | Fixed: a Typst file is named only by a call that reads one (`include`, `import`, `read`, `csv`, `json`, `yaml`, `toml`, `xml`, `cbor`), so a shown string is left; and the paper's own file takes a stand-in name too, so a chapter's file of the same name is read. `test_pandoc_typst_names_only_in_calls`. A file included from a variable is recorded as a limit. |
