# Sprint 26 Research: readers of LaTeX and Typst, tried on one paper

One short paper was written twice, in LaTeX (`samples/paper.tex`, which pulls
in `samples/appendix.tex`) and in Typst (`samples/paper.typ`, which pulls in
`samples/appendix.typ`). It holds what a paper holds: a title, authors and an
abstract; sections with labels; a theorem, a proof and a lemma; a numbered
equation, an aligned derivation, a matrix and a case split; two commands of
the author's own (`\R`, `\norm`); a price and a percent sign; a footnote; a
citation and a bibliography; lists; a table and a figure with captions and
references to them; a quotation; code.

Four readers were tried on it, each installed by `npm` into a scratch folder
outside the repository. Neither pandoc nor Typst is otherwise installed where
the trial ran. Node 24.

## 1. What each reader made of the paper

| | pandoc 3.10 (`pandoc-wasm` 1.1.0) | unified-latex 1.8.4 | Typst's compiler (`typst-ts-node-compiler` 0.7.0), HTML | `tex2typst` 0.6.2 |
|---|---|---|---|---|
| reads | LaTeX and Typst | LaTeX | Typst | formulas only |
| licence | GPL-2.0-or-later | MIT | Apache-2.0 | Apache-2.0 |
| size installed | 56 MB (one `.wasm` file) | 20 MB | 50 MB (a program for each platform) | 0.5 MB |
| result kept | `evidence/pandoc-latex.md`, `evidence/pandoc-typst.md` | `evidence/unified-latex.md` | `evidence/typst-compiler.html` | section 4 |

### LaTeX

| what the paper holds | pandoc | unified-latex |
|---|---|---|
| the author's own commands | written out (`\R` as `\mathbb{R}`, `\norm{x}` as `\left\lVert x \right\rVert`) | left as typed, so the layout engine would not know them |
| the second file (`\input`) | read in place | the word "appendix" |
| labels and references | sections, theorems, the table and the figure get their numbers ("Section 2", "Theorem 1"); an equation's reference stays `[eq:gauss]` | the label's name as text ("See Section sec:result") |
| theorem, proof, lemma | a block each, numbered, with the name and the end mark | the words run on, no name |
| footnote | a footnote | its words run into the sentence |
| table and figure | a table; a figure with its caption | a table with an empty row; the picture and both captions run together |
| citation with a `.bib` file | "(Gauss 1801)" and a reference list | the key as text |
| citation with `thebibliography` | the citation is lost; the list is kept as a paragraph | the key as text |
| title, authors, abstract | not in the text; given beside it as the document's properties | the abstract's words, no title |
| what it does not know | left out, each named with its line and column | left as words or dropped, 32 messages |
| formulas Tome's layout reads | 16 of 16 | not tried: the author's commands are not written out |

### Typst

| what the paper holds | pandoc | Typst's own compiler, HTML |
|---|---|---|
| formulas | each written in LaTeX notation; Tome's layout reads 15 of 15 | **none**: every formula is left out and its sentence cut in pieces |
| the author's own functions (`norm`, `RR`) | worked out | — |
| the second file (`#include`) | read in place | read in place |
| references to labels | the label's name (`[sec-result]`) | resolved ("Section 1.2", "Equation 1") |
| bibliography | the heading, no entries | entries and numbered citations |
| table and figure | a table whose first row is not a heading; a figure with its caption | a table; a figure with the picture inside the page |
| footnote | a footnote | a footnote |

Typst's own documentation says of its HTML export: "The feature is still
very incomplete and only available for experimentation behind a feature
flag. Do not use this feature for production use cases." The trial shows
what that means for a paper: no formulas at all.

Two small faults in pandoc's reading of Typst formulas: a full stop typed
after a fraction (`(n(n+1))/2.`) came out inside the denominator, and the
thin space of `dif` was lost (`xdx`).

## 2. What stops pandoc's Typst reader

A Typst document is a program, and pandoc carries its own small reading of
that language. Each of these was tried as a document of three lines:

| the document holds | result |
|---|---|
| a reference to a label that is not there | read; the name is shown |
| a picture that is not there | read; an empty picture |
| a function of the author's own | read |
| `#set` and `#show` rules | read, but a `#show` rule on headings made the heading plain text |
| a function it does not know (`#unknownfn(1)`) | **nothing**: `Identifier "unknownfn" not found` |
| a mathematical function it does not know | **nothing**: the same |
| a package (`#import "@preview/cetz:0.3.0": canvas`) | **nothing**: `HOME not defined` |

So pandoc reads a plain Typst document, and gives nothing for one that uses a
package or a function it does not carry. There is no half measure: the whole
document is refused, with the line and column of the first thing it could
not read.

## 3. What pandoc does with LaTeX it does not know

With pandoc's `raw_tex` setting on, a command or environment it does not know
is handed back where it stood, as typed:

```text
\section{One} Known \mycmd{kept} text. \begin{tikzpicture}\draw (0,0);\end{tikzpicture} End.
```

gives a raw piece `\mycmd{kept}` within the line and a raw block holding the
whole `tikzpicture`. With the setting off, both are dropped and named in a
list of warnings (`Skipped '\mycmd{kept?}' at p.tex line 4 column 25`). An
environment of the author's own keeps its words inside a block that carries
the environment's name. A file named by `\input` that is not there is named
(`Could not load include file absent.tex`), and the rest is read.

A formula holding a command the layout engine does not know
(`x = \badmacro{1}`) is still handed over as a formula. Whether it can be laid
out is then Tome's question, as it is for a Word equation.

## 4. Formulas of Typst turned to LaTeX by `tex2typst`

| Typst | result |
|---|---|
| `sum_(i=1)^n i = (n(n+1))/2` | `\sum_{i = 1}^n i = \frac{n(n + 1)}{2}` |
| `tr mat(a, b; c, d) = a + d` | `\tr \begin{pmatrix} a & b \\ c & d \end{pmatrix} = a + d` (`\tr` is no command) |
| `abs(x) = cases(…)` | `\abs(x) = \begin{cases}…` (`\abs` is no command) |
| `lr(\|\| x + y \|\|) <= …` | `. \| x + y \|. \le …` (stray full stops) |

It turns a formula and nothing else, and three of eight came out wrong. Since
pandoc turns the formulas itself, it is not needed.

## 5. Pandoc's Markdown, and why Tome should write its own

Pandoc can write Markdown with formulas between dollar signs
(`gfm-tex_math_gfm+tex_math_dollars`). Read back by Tome's own reader:

| | formulas found | set apart | unreadable |
|---|---|---|---|
| the LaTeX paper | 14 | 0 | 2 |
| the Typst paper | 15 | 0 | 0 |

Pandoc writes a set-apart formula inside its paragraph (`…then $$\begin{align}`),
and Tome sets a formula apart only when its fence stands on a line of its
own. So every one was read as a formula within a line, and the two that hold
a numbered environment could not be laid out there. Three dollar signs were
left as text.

Pandoc can instead hand over the document as a tree (`to: json`): 19 blocks
for the LaTeX paper, with each formula as a piece that says whether it is set
apart, and the title, authors, date and abstract beside the text. Taken from
the tree, Tome's layout read 16 of 16. Tome already writes Markdown from a
tree for a Word document, and already reads its own result back and counts
whatever did not come back as a formula (Sprint 25). The same writer can take
pandoc's tree.

## 6. Cost of running it

- The first paper took 1.7 s, the second 0.15 s; the program is loaded once.
- Memory in use after two conversions: 384 MB.
- Nothing is fetched while it runs; the `.wasm` file is in the package.
- Tome's desktop apps hold only the built pages (`dist`), so the program is
  not inside them. It runs when a library is built.
