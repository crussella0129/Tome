# Sprint 26 Research Report

## Intents Reviewed
- [INT-0033](../../../intents/INT-0033-latex-and-typst-documents.md) — selected and revised; relevance: the sprint's subject, chosen by the owner on 24 November 2026 ("LaTeX and Typst"); current state: proposed.
- [INT-0029](../../../intents/INT-0029-documents-as-tomes.md) — selected; relevance: the way a document becomes a tome, which a LaTeX or Typst document must follow; current state: realized.
- [INT-0030](../../../intents/INT-0030-mathematics-and-code.md) — selected; relevance: the formulas of a paper are laid out as this intent lays them out, and its check on a Word equation is the model for a paper's; current state: realized.
- [INT-0032](../../../intents/INT-0032-shared-ground-with-mdbook.md) — selected; relevance: asks of mdBook the question this sprint answers for pandoc, a separate program or a reader of Tome's own; current state: proposed.

## 1. Sprint Goal

A paper written in LaTeX (`.tex`) or in Typst (`.typ`) is read as a tome: a
library entry may name one, and a folder of documents may hold them. Its
sections become headings, its formulas are laid out as Sprint 25 lays them
out, and what cannot be carried over is marked where it stood and named when
the library is built. The source is never changed. The sprint does not edit
documents (INT-0026) and does not change how a Markdown or Word document is
read.

## 2. Existing Code Survey

| File | Relevance | Notes |
|------|-----------|-------|
| scripts/document-source.mjs | high | Names the kinds of document (`FORMATS`: `.md`, `.docx`), walks a folder, orders and names its documents. A new kind is added here. A LaTeX file pulled in by another (`\input`) must not become a chapter of its own |
| scripts/document-stage.mjs | high | `prepareDocument` gives each document's Markdown, title, files and what was left out; `describeLeftOut` words the report; `placeholderDocument` stands in for a Word document that cannot be opened |
| scripts/docx-to-markdown.mjs | high | Writes Markdown from a tree, with equations carried as place-holders, read back and counted (`placeholders`, `settleEquations`); the model for writing pandoc's tree |
| scripts/rehype-math.mjs | high | `readable(tex, display)` says whether a formula can be laid out; numbers equations down a page; drops what `\label` wrote |
| scripts/remark-math-dollars.mjs | high | The dollar rule: a formula is set apart only when its fence stands on a line of its own |
| scripts/load-books.mjs | medium | Stages a tome of documents and prints what each left out |
| scripts/find-books.mjs | medium | `books:find` and `books:add` share `resolveSource`, so they take a new kind with it |
| scripts/parent-assets.mjs | medium | Where a document's local pictures are copied; a paper's figures go the same way |
| scripts/check-documents.mjs | medium | The gate that builds a library of documents and opens it in a browser |
| fixtures/word/build-docx.mjs, fixtures/papers | medium | How the Word fixtures are made and where document fixtures live |
| src/lib/__tests__/document-source.test.ts, document-stage.test.ts, load-books.test.ts | medium | The tests a new kind extends |
| src/content/books/tome/find-your-books.md, write-mathematics.md | medium | The tutorial chapters that say what Tome reads and what is not laid out |
| .github/workflows/ci.yml | low | Node 24 and `npm ci`; a reader installed by `npm` needs no other step |
| src-tauri/tauri.conf.json | low | The desktop apps hold only the built pages (`dist`); nothing that runs at build is inside them |

## 3. External Sources

- [unified-latex](https://github.com/siefkenj/unified-latex) — a LaTeX parser for JavaScript, MIT. Its README warns it works "unless you do complicated things like redefine control sequences"; it names no step that writes out an author's own commands.
- [pandoc-wasm](https://www.npmjs.com/package/pandoc-wasm) — "the official pandoc WASM binary distributed by the Pandoc project", GPL-2.0-or-later; `convert(options, stdin, files)` takes its input files as an object and needs no other download.
- [Typst: HTML export](https://typst.app/docs/reference/html/) — "still very incomplete and only available for experimentation behind a feature flag. Do not use this feature for production use cases." Latest release named: 0.15.1.
- [typst.ts: the Node compiler](https://myriad-dreamin.github.io/typst.ts/cookery/guide/all-in-one-node.html) — `NodeCompiler` with `html` and `tryHtml`, "using the experimental HTML export".
- [tex2typst](https://github.com/qwinsi/tex2typst) — turns formulas between TeX and Typst, both ways, Apache-2.0; formulas only.

## 4. Risks, Unknowns, Dependencies

- **Risk (licence):** pandoc is under the GPL (version 2 or later) and Tome
  is under the MIT licence. Tome would call pandoc when a library is built,
  as a dependency `npm` installs; pandoc would not be inside Tome's
  repository, nor inside the desktop apps, which hold only the built pages.
  If Tome's desktop app later builds libraries itself
  ([INT-0020](../../../intents/INT-0020-native-library-folder-management.md)),
  pandoc would be shipped inside it, and the question comes back. This is
  the owner's decision, and the plan puts it to them.
- **Risk (size):** 56 MB more for everyone who installs Tome, whether or not
  they keep a paper. It can be an optional dependency, loaded only when a
  library names a `.tex` or `.typ` file, as the Word reader is loaded only
  for a Word document.
- **Risk (Typst):** pandoc refuses a whole Typst document that uses a
  package or a function it does not carry (`reader-trial.md`, section 2).
  Many real Typst documents use packages. Such a document can only be shown
  as a chapter that says it could not be read, with pandoc's own line and
  reason in the build's report.
- **Risk (set-apart formulas):** pandoc's own Markdown puts a set-apart
  formula inside its paragraph, where Tome reads it as within the line
  (section 5). Tome must write the Markdown itself from pandoc's tree.
- **Risk (what is silently lost):** with pandoc's defaults, a command it
  does not know is dropped. Its `raw_tex` setting hands such a piece back
  where it stood, so Tome can mark it (section 3).
- **Risk (a folder of LaTeX):** a paper is often several files. A file
  pulled in by another must be part of that paper and not a chapter of its
  own; and pandoc must be given every file a paper pulls in, from within the
  folder and nowhere else.
- **Unknown:** how real papers fare. The trial is one paper written for it.
  The owner was asked for a paper of their own and none has been given;
  the plan asks again, and proposes fixtures drawn from the trial's paper.
- **Unknown:** figures kept as PDF or EPS, which is usual in LaTeX. A
  browser shows neither as a picture; they would take the mark an unreadable
  picture already takes.
- **Unknown:** an equation's number in a reference. Pandoc numbers sections,
  theorems, tables and figures and leaves an equation's reference as its
  label; Tome numbers equations itself when it builds a page.
- **Dependency:** INT-0030's layout (`readable`, the dollar rule, the
  read-back check) and INT-0029's staging of documents, both realized.

## 5. Recommended Approach

Primary: read both formats with pandoc, installed by `npm` as its official
WebAssembly build, and take the document from it as a tree, not as Markdown.
A new module of Tome's own writes that tree as Markdown the way
`docx-to-markdown.mjs` writes a Word document's: headings, lists, tables,
figures, footnotes, theorem blocks and code, each formula between dollar
signs, set apart on lines of its own, and read back by Tome's reader so that
any formula which would not show is marked and counted. A piece pandoc does
not know (`raw_tex`) takes a mark where it stood and is named in the build's
report with its file and line. The title, authors and abstract come from the
tree's properties. `document-source.mjs` gains the two kinds, and a rule
that a `.tex` file with no `\documentclass` is part of another document.

For Typst, the same path, with its limits stated: a plain Typst document is
read; one that pandoc refuses becomes a chapter saying so, and the build
names the line and the reason.

Alternative considered: unified-latex (MIT, small). It parses LaTeX but its
Markdown lost the author's commands, the second file, every label, the
footnote and the theorem blocks (`reader-trial.md`, section 1). Tome would
have to write most of a LaTeX reader on top of it, and would still have no
Typst.

Alternative considered: Typst's own compiler for Typst. It resolves
references and the bibliography, which pandoc does not, but its HTML export
leaves out every formula. It could be looked at again when Typst's HTML
export carries mathematics.

Alternative considered: a pandoc the person installs themselves, called as a
program. No licence question and nothing added to `npm ci`, but then `npm
ci` is no longer all a person needs, and CI needs a step of its own.

Rationale: pandoc is the only reader tried that carried the whole paper, in
both formats, and every formula it handed over was one Tome's layout reads.
What it gets wrong is where Tome already has its own answer: writing the
Markdown, and saying what was left out.

## Artifacts
- `reader-trial.md` — the trial: what each reader made of the paper, what stops pandoc's Typst reader, what pandoc does with LaTeX it does not know, and its cost
- `samples/paper.tex`, `samples/appendix.tex` — the paper in LaTeX
- `samples/paper.typ`, `samples/appendix.typ`, `samples/refs.yml` — the paper in Typst
- `samples/figures/triangle.png` — its figure
- `evidence/pandoc-latex.md`, `evidence/pandoc-typst.md` — pandoc's Markdown for each
- `evidence/unified-latex.md` — unified-latex's Markdown for the LaTeX paper
- `evidence/typst-compiler.html` — the Typst compiler's HTML, with no formulas in it
