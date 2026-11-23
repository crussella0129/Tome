# Word-to-Markdown conversion trial

Run on 23 November 2026 in a scratch folder outside the repository, with
`mammoth` 1.13.0, `rehype-parse`, `rehype-remark`, `remark-gfm` and
`remark-stringify` (current versions from npm), on Node 24.

## What was tried

A Word file was written with the `docx` package (9.16.0) holding: a Title
paragraph, two Heading 1 and one Heading 2, bold and italic runs, a
footnote, a link, a bulleted list, a 2 × 2 table, an equation (a fraction,
as Office Math), and a PNG image. It was converted in two steps:

```js
const result = await mammoth.convertToHtml(
  { path: docxPath },
  {
    styleMap: ["p[style-name='Title'] => h1.title:fresh"],
    convertImage: mammoth.images.imgElement(async (image) => {
      const name = `image-${++n}.${image.contentType.split('/')[1]}`;
      await writeFile(join(out, 'media', name), await image.readAsBuffer());
      return { src: `./media/${name}` };
    }),
  },
);
const markdown = String(
  await unified()
    .use(rehypeParse, { fragment: true })
    .use(rehypeRemark)
    .use(remarkGfm)
    .use(remarkStringify, { bullet: '-', emphasis: '_' })
    .process(result.value),
);
```

## What came out

```markdown
# A Paper

# First Part

Plain, **bold**, _italic_, a note[\[1\]](#footnote-1) and a [link](https://example.com/).

## A Section

- one
- two

|   |   |
| - | - |
| a | b |
| 1 | 2 |

Before the equation and after it.

![](./media/image-1.png)

# Second Part

Closing words.

1. The note itself. [↑](#footnote-ref-1)
```

The image was written to `media/image-1.png`. mammoth returned one message:

```json
{
  "type": "warning",
  "message": "An unrecognised element was ignored: {http://schemas.openxmlformats.org/officeDocument/2006/math}oMath"
}
```

## Findings

| Word content | Result | What the build must do |
|---|---|---|
| Title, headings | carried over; Title and Heading 1 both become `#` | decide how levels map (two `#` levels in one chapter) |
| bold, italic, lists, links | carried over | nothing |
| image | written to a file, referenced by a relative path | stage the files with the tome |
| table | carried over, with an empty header row | make the first row the header |
| footnote | a superscript link and a numbered list at the end, not a Markdown footnote | rewrite to `[^1]` and `[^1]: …` so Tome's footnotes apply |
| equation | dropped; only the warning says so | report it by document (INT-0029 criterion 4); carry it over in INT-0030 |

A second run, on HTML written by hand, tested the Markdown step alone:

| HTML | Markdown produced | Consequence |
|---|---|---|
| `x<sup>2</sup>`, `H<sub>2</sub>O` | `x2`, `H2O` | the meaning changes; superscript and subscript need a rule of their own |
| `<s>gone</s>` | `~~gone~~` | none |
| `<u>under</u>` | `*under*` | underline becomes emphasis |
| `<a href="javascript:alert(1)">` | `[bad](javascript:alert\(1\))` | the link survives; Tome must remove it (criterion 5) |
| `<a href="file:///c:/x">` | `[file](file:///c:/x)` | the same |
| a table with `<thead>` | a table with that header | none |
