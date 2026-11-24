# Test Critique — Sprint 26

This is a read-only third review at head `2c27689`, with the tested code at `5662158`. Nothing in the repository was edited, staged or built, and `git status` was empty before and after. I ran every reproduction through Tome's own `readPaper()`, `prepareDocument()` and `resolveSource()` with the installed `pandoc-wasm` 1.1.0, using papers I wrote in a scratch folder outside the repository. Each run had a time limit. Where Tome refused a paper, I also gave the same paper straight to pandoc's `convert`. I ran `npx vitest run src/lib/__tests__/pandoc-to-markdown.test.ts`, and all 40 tests passed. As asked, I do not raise the staleness of the result records.

## Concerns

### C-001: an included LaTeX file vanishes, with nothing counted, when its `\input` falls in what Tome wrongly takes for code (a regression from the C-006 fix)
- **Where:** `readLatex()` in `scripts/pandoc-read.mjs`: the rename through `outsideCode(…, LATEX_CODE, …)`, and the `decided` set; `test_pandoc_code_untouched`; INT-0033 AC5 ("Nothing vanishes without a word").
- **Quote:** "the argument that names a file is rewritten outside code only"
- **Failure mode:** negative-path
- **Why it matters:**
  - **What Tome takes for code.** `LATEX_CODE` treats any `\begin{verbatim|lstlisting|minted}` up to the next `\end{…}` of that name as code. That includes a `\begin` in a comment, and one inside `\lstinline`, which is not in the pattern.
  - **What follows.** An `\input{chapters/x}` in that stretch is no longer renamed to its stand-in. Pandoc asks for the file again, but the path is already in `decided`, so it is skipped and never put in `missing`.
  - **The result.** The whole included file is missing from the page, and `leftOut` is `[]`. At `2fe447b` the rename ran over the whole file, so these papers were read correctly.
  - **Wider point.** Whenever a supplied file's rename does not take, the loss is silent.
- **Suggested response:** add-test, and fix in two parts:
  - When pandoc asks again for a path already in `decided`, push it to `missing`, so a failed rename is never silent.
  - Do not let a `\begin` inside a comment start a code region: strip comments before matching code, as `refuseCycle` does.
- **Reproduction:** every case below has a `chapters/intro.tex` holding `INTRO CHAPTER WORDS.`
  - **A commented `\begin`:** the body is `First words.` / `% \begin{verbatim} (old listing removed)` / `\input{chapters/intro}` / a real `\begin{verbatim}` … `\end{verbatim}` / `Last words.`
    - Out: `First words.`, the code block and `Last words.`, with no intro and `leftOut` `[]`.
  - **Inside `\lstinline`:** `Use \lstinline|\begin{verbatim}| for code.` / `\input{chapters/intro}` / a real verbatim block. Same result.
  - **A half-commented listing:** `%\begin{lstlisting}` / `%old` / `\input{chapters/intro}` / a real `lstlisting`. Same result.

### C-002: a Typst chapter's own file is replaced by the paper-root file of the same name, with nothing counted
- **Where:** `readTypst()` in `scripts/pandoc-read.mjs`, the search for the file that names what pandoc asked for (`for (const [holder, text] of [...supply.texts])`); INT-0033 AC2 and AC5. This predates `2fe447b` (the same loop is in `8353ba9`); neither earlier round found it.
- **Quote:** "Pandoc asks for a file by the words that name it; find who names it."
- **Failure mode:** weak-assertion
- **Why it matters:** This is the same kind of fault as round 2's blocking C-002, but for text instead of pictures. In a Typst paper, a chapter's include is read from the chapter's own folder.
  - **Why it happens.** Pandoc's message names only the words, so Tome takes the first file read that holds that string anywhere: in code, a comment or a plain string. It then resolves the path from that file's folder.
  - **What the reader sees.** A file in the paper's folder is given to pandoc under its own name. So once `notes.typ` from the paper's folder is supplied, a chapter's `#include "notes.typ"` gets that file in place of `ch1/notes.typ`. The chapter shows another file's words, with no mark and no count.
- **Suggested response:** add-test (a file of one name in the paper's folder and in a chapter's folder, each with different words), and fix:
  - Give every Typst file other than the paper's own a stand-in name.
  - When the file found does not settle pandoc's question, go on to the next file that names it, so the chapter's own string is reached and rewritten.
- **Reproduction:** `ch1/ch1.typ` holds `== One` / `#include "notes.typ"`. `notes.typ` holds `ROOT NOTES WORDS`, and `ch1/notes.typ` holds `CHAPTER NOTES WORDS`.
  - `main.typ` = `#include "notes.typ"` / `#include "ch1/ch1.typ"`. Out: `ROOT NOTES WORDS` under "One"; `CHAPTER NOTES WORDS` appears nowhere; `leftOut` `[]`.
  - The two includes the other way round: the same result.
  - `main.typ` names `notes.typ` only in a comment (`// #include "notes.typ"`): the chapter still shows the paper-root file, an old draft the paper never includes.

### C-003: a Typst picture with a named argument before its path still shows the paper-root picture, or is marked although it is there (round 2's C-002 is only partly closed)
- **Where:** `picturesFromRoot()` in `scripts/pandoc-read.mjs` (`/\b(image\s*\(\s*)"([^"\n]+)"/g`); `test_prepare_paper_pictures_same_name`; INT-0033 AC2 and AC5.
- **Quote:** "each `image("…")` path is written from the paper's folder (`/ch1/fig.png`), so each chapter's picture is found beside it and nowhere else"
- **Failure mode:** weak-assertion
- **Why it matters:**
  - **Named argument first.** Typst accepts named arguments in any order, but the rewrite matches a path only when it comes first. With `image(width: 50%, "fig.png")` in a chapter, the path is left as it is, and the stage looks for it in the paper's folder only. The result is round 2's fault exactly: the paper-root picture, or the mark for a picture that is beside its file.
  - **Prose changed.** The rewrite also changes prose. In markup, `image("fig.png")` with no `#` is text, and the page shows `image(“/ch1/fig.png”)`.
  - **The test.** It uses only `image("…")` with the path first.
- **Suggested response:** tighten-assertion and fix:
  - Rewrite the first positional string of an `image(` call.
  - Rewrite only where code stands (after `#`, or inside code), as `typstFilesNamed` does.
- **Reproduction:**
  - **Named argument first, with the paper-root file present:** `main.typ` holds `#image("fig.png")` and `#include "ch1/ch1.typ"`. `ch1/ch1.typ` holds `#image(width: 50%, "fig.png")`. `fig.png` and `ch1/fig.png` have different bytes.
    - Out: both images are `./__tome_parent_assets__/fig.png`, only the paper-root file is staged, and `leftOut` is `[]`.
  - **Named argument first, with only `ch1/fig.png`:** `\[image not shown\]`, and the picture is counted as `fig.png`.
  - **Prose:** `Write image("fig.png") in your file.` in a chapter becomes `Write image(“/ch1/fig.png”) in your file.`
  - **What held:**
    - raw blocks and inline raw are left alone;
    - `../figs/a.png` from a chapter is staged;
    - `../../outside.png` takes the mark and is counted;
    - `figure(image("fig.png"), caption: …)` works, and so does a picture two folders down;
    - round 2's two-chapter case works.

### C-004: an include after a comma is no longer seen, so its file is a chapter of its own as well (a regression from the shared `typstFilesNamed`)
- **Where:** `typstFilesNamed()` in `scripts/pandoc-read.mjs`, now used by `scripts/document-source.mjs`; `test_source_typst_include_in_code`; INT-0033 AC1.
- **Quote:** "`include "…"` where code stands (after `{`, `;`, `(`, `=`, `=>` or at a line's start)"
- **Failure mode:** intent-coverage
- **Why it matters:**
  - **The regression.** At `2fe447b`, `\b(?:include|import)…` saw every include. Now an `include` after `,` or `+`, or after any operator not in the list, names nothing.
  - **What the reader sees.** Each such file becomes a chapter and is also shown inside the paper, so its text appears twice.
  - **The test.** Its fixture has no argument after the first.
- **Suggested response:** add-test (`#grid(columns: 2, include "a.typ", include "b.typ")`), and accept `,` and the binary operators before `include`.
- **Reproduction:** `main.typ` = `#grid(columns: 2, include "a.typ", include "b.typ")` / `#align(center, include "c.typ")`.
  - `resolveSource()` lists `a.typ`, `b.typ`, `c.typ` and `main.typ`. The main chapter already shows `AAA words`, `BBB words` and `CCC words`.

### C-005: code shapes the guard and the rename still miss (round 2's C-001 and C-006 are closed for the listed shapes only)
- **Where:** `LATEX_CODE`, `TYPST_CODE` and `refuseCycle()` in `scripts/pandoc-read.mjs`; `test_pandoc_code_names_nothing`, `test_pandoc_code_untouched`; INT-0033 Consequences ("A file named only in code the paper shows names nothing").
- **Quote:** "A file named only in code the paper shows names nothing."
- **Failure mode:** weak-assertion
- **Why it matters:** That record is false for these shapes, and each was checked against pandoc directly, which reads every one of them.
  - **fancyvrb's `Verbatim`** (common in papers) is read by pandoc as code, but Tome does not treat it as code.
    - `build.tex` holding `\begin{Verbatim}` / `\input{build}` / `\end{Verbatim}` is refused with "`build.tex → build.tex`".
    - A `Verbatim` that shows `\input{chapters/intro}` beside the real `\input` shows `\input{tomefile1}` on the page.
  - **Text pandoc never reads.** A `comment` environment, or `\iffalse … \fi`, that holds an `\input` back to the paper is refused ("`paper.tex → intro.tex → paper.tex`"; "`paper.tex → paper.tex`"). Pandoc reads both papers in under a second.
  - **Typst inline raw across a line** is read by pandoc as code but missed by `TYPST_CODE`.
    - `` See `x `` / `` #include "main.typ"` here. `` is refused.
    - In a folder, `` write `#import "x.typ" `` / `` #include "extra.typ"` at the top `` makes `extra.typ` a part, although nothing includes it. `resolveSource()` lists only `main.typ`, and `extra.typ` is in no chapter at all, with nothing said.
  - **Typst prose at the start of a line.** `import "a.typ" with one line.` inside `a.typ` is refused as a cycle.
- **Suggested response:** add `Verbatim` (and `BVerbatim`/`LVerbatim`) and `comment` to `LATEX_CODE`, and let `` `…` `` span lines in `TYPST_CODE`. For the rest, record them, or defer-with-rationale.

### C-006: a heading in another language or wording is no longer taken for the list's heading
- **Where:** `LIST_HEADINGS` and `arrangeBibliography()` in `scripts/pandoc-to-markdown.mjs`; `test_paper_own_bibliography_heading_kept`.
- **Quote:** "is the list's heading only when its words name a list (References, Bibliography, Works cited, Literature, and the French and German words)"
- **Failure mode:** weak-assertion
- **Why it matters:** Before the fix, any heading directly before the list was taken. Other words now give two headings: for example `\section*{Referencias}`, "Literature Cited", "References and Notes", or "Notes and References". A LaTeX paper that writes `\section*{References}` and then `\bibliographystyle{…}` before `\bibliography{…}` also gives two `## References`, because the skipped style command's paragraph stands between them. Nothing is lost, but it shows on the page.
- **Suggested response:** defer-with-rationale (record it), or widen the pattern to words that begin or end with a list's name, and pass over an empty paragraph made from a skipped piece.
- **Reproduction:** `\section*{Referencias}` directly before `\begin{thebibliography}{9}` gives `## Referencias` and then `## References`.

## The second round's concerns, judged at `5662158`

- **C-001 is closed for the reviewer's papers.** These now read correctly: the `verbatim`, the `lstlisting` back to `thesis`, the `\verb`, the Typst raw block, and the Typst prose. The macro and variable cycles are truthfully recorded in INT-0033 and *Find Your Books*. The fix introduced new faults (C-001 above) and still misses some shapes (C-005).
- **C-002 is closed for `image("…")` with the path first.** Both chapters show their own picture. The rest is C-003 above.
- **C-003 is closed.** `table*` in `verbatim`, `lstlisting` and `\verb` is shown as written, and a real `table*` keeps its caption and label.
- **C-004 is closed.**
  - `@sec:a.b` beside `<sec>` leads to "Two".
  - With `<sec>`, `<sec:a>` and `<sec:a.b>`, each of `@sec:a.b` and `@sec:a` leads to its own heading.
  - `@sec.` at a sentence's end is left alone.
  - The BibTeX key with a colon is recorded truthfully.
- **C-005 is closed.**
  - A referred `\section{References}\label{sec:refs}` before the list keeps `id="ref-sec-refs"`.
  - `\section{Conclusion}` before the list stays, followed by `## References`.
  - `\hyperref[nolabel]{…}` is counted, and so is the bad escape `#%zz`. A link to `#` alone is its words, uncounted, which is harmless.
  - A heading "References" that is not before a list, or that stands between two lists, is left in place.
  - A Typst `#bibliography(…, title: [Works Cited])` keeps its title.
  - Pandoc's own Typst "References" heading after the paper's `= References` gives two headings, as Typst itself would.
  - The new counting in `link()` raises nothing false for `citeproc` links, `\hyperlink` to a `\hypertarget`, `\autoref`, footnotes or Typst `#outline()`.
- **C-006 is closed for `verbatim`, `lstlisting`, `minted`, `\verb` (also `\verb*` with `+` or `=`) and Typst raw.** It is still open for `Verbatim` (C-005 above).
- **C-007 is closed.** The test counts readings of the real `convert` (three at most) and times nothing, and the 120 s timeout still catches a hang.
- **C-008** is acknowledged as pending, and not re-raised.

**Other things I tried that held:**
- A `\begin{verbatim}` that is never closed swallows nothing. Pandoc refuses the paper with its own reason.
- Four backticks holding three: neither the guard nor the rename touches what is inside.
- A string holding three backticks before an include.
- A raw block that names a nested file which is also really included.
- `\verb|x|`, then `\input{…}`, then `\verb|y|`, all on one line.

## Confidence

block

The block rests on C-001 and C-002. In both, a reader of the page meets text that is missing (C-001) or replaced by another file's (C-002), the build's report says nothing, and the current tests pass either way. That is AC5's "nothing vanishes without a word", which is the reason round 2's C-002 blocked.

- **C-001** is a regression introduced by this round's fix.
- **C-002** is older, and neither earlier round found it.

Both need an uncommon shape, but each fix is small. For C-001, count a path pandoc asks for again. For C-002, give Typst files other than the paper's own a stand-in name, and keep looking past a file that does not settle pandoc's question. C-003 to C-006 can proceed with caveats: fix them, or record them in INT-0033.

## Responses (the sprint's author)

Answered in `43c9a66`. Each fix has a test, checked to fail with its fix undone.

| Concern | Answer |
|---|---|
| C-001 a lost included file | Fixed in both parts the review asked for. The pattern for LaTeX code now matches a `%` comment first where it begins, so a `\begin{verbatim}` in a comment starts nothing, and it knows `\lstinline`. And a file pandoc asks for again, because its argument was not rewritten, is rewritten wherever it stands; asked for after that, it is in `missing` and the report names it. No path pandoc asks for can now be lost without a word. `test_pandoc_commented_begin` (the reviewer's three papers, and code the paper shows left as written, which only the comment fix keeps), `test_pandoc_asked_again` (stand-in: rewritten on the second asking, named as not read on the third). |
| C-002 a chapter's own file | Fixed as the review suggested: every Typst file but the paper's own takes a stand-in name, so a file beside the paper never answers for a chapter's; and a file that names the asked-for file only in raw text is passed over. `test_pandoc_typst_same_name_file` (both orders, and a name only in a comment of the paper's). |
| C-003 a picture after a named argument | Fixed: a Typst picture's path is the call's first string that is not a named argument's value, and only an `image(` where code stands is rewritten, so prose is left as written. `test_prepare_paper_picture_named_argument` (`width: 50%`, `alt: "A dog"`, and the prose line). |
| C-004 an include after a comma | Fixed: `,` and `+` are places where code stands. `test_prepare_paper_typst_include_after_comma` (the reviewer's `grid` and `align`, through `resolveSource()` and the stage). |
| C-005 code shapes | Fixed: `Verbatim`, `BVerbatim`, `LVerbatim`, the `comment` environment and `\iffalse … \fi` are not text that names a file, and Typst raw text may run over a line end. `test_pandoc_more_code_shapes`. Recorded in INT-0033: code is found by pattern, not by a parser, so a Typst line of prose that begins `import "…"` is still taken for code. |
| C-006 the list's heading in other words | Fixed: a heading whose words name a list anywhere (`Referencias`, `Literature Cited`, `References and Notes`, `Notes and References`) is the list's, and a paragraph between it and the list holding only layout the page does not show (`\bibliographystyle{plain}`) is passed over; one with the paper's own words is not. `test_paper_list_heading_words`. |
