// Runs in the default (jsdom) environment, as parent-assets.test.ts does. With
// Vitest's node environment the shared config still resolves the Markdown
// parser's browser build, which needs a `document`.
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative, sep } from 'node:path';
import JSZip from 'jszip';
import { fromMarkdown } from 'mdast-util-from-markdown';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import { buildDocx, PAPER_PARTS } from '../../../fixtures/word/build-docx.mjs';
import { convertDocx, MARKS } from '../../../scripts/docx-to-markdown.mjs';
import remarkMathDollars from '../../../scripts/remark-math-dollars.mjs';

// INT-0029 AC3–AC6, AC8 — a Word document becomes Markdown that keeps its meaning.

interface MdNode {
  type: string;
  value?: string;
  children?: MdNode[];
}

/** What a chapter reads: the text of its Markdown, escapes resolved. */
function reads(markdown: string): string {
  const parts: string[] = [];
  const walk = (node: MdNode): void => {
    if (node.type === 'text' && typeof node.value === 'string') parts.push(node.value);
    for (const child of node.children ?? []) walk(child);
  };
  walk(fromMarkdown(markdown) as unknown as MdNode);
  return parts.join('');
}

function nodesOfType(markdown: string, types: string[]): MdNode[] {
  const found: MdNode[] = [];
  const walk = (node: MdNode): void => {
    if (types.includes(node.type)) found.push(node);
    for (const child of node.children ?? []) walk(child);
  };
  walk(fromMarkdown(markdown) as unknown as MdNode);
  return found;
}

const count = (text: string, needle: string) => text.split(needle).length - 1;
const headings = (markdown: string) => markdown.split('\n').filter((line) => /^#{1,6} /.test(line));

type Swap = (text: string) => string;
const variant = (documentXml: Swap, others: Record<string, string | Buffer | Swap> = {}) =>
  buildDocx(PAPER_PARTS, { replace: { 'word/document.xml': documentXml, ...others } });

const TITLE = /<w:p><w:pPr><w:pStyle w:val="Title"\/><\/w:pPr>.*?<\/w:p>/;
const beforeEnd = (xml: string) => (text: string) =>
  text.replace('<w:sectPr/>', `${xml}<w:sectPr/>`);
const drawing = (uri: string, inner: string) =>
  `<w:p><w:r><w:t xml:space="preserve">before </w:t></w:r><w:r><w:drawing><wp:inline>` +
  `<wp:extent cx="1" cy="1"/><wp:docPr id="9" name="x"/><a:graphic><a:graphicData uri="${uri}">` +
  `${inner}</a:graphicData></a:graphic></wp:inline></w:drawing></w:r>` +
  `<w:r><w:t xml:space="preserve"> after</w:t></w:r></w:p>`;
const SHAPE = 'http://schemas.microsoft.com/office/word/2010/wordprocessingShape';

describe('docx-to-markdown.mjs — the sample paper', () => {
  let paper: Awaited<ReturnType<typeof convertDocx>>;
  beforeAll(async () => {
    paper = await convertDocx(await buildDocx(), { name: 'paper.docx', mediaPath: './media' });
  });

  it('test_docx_fixture_builds: the parts zip into a Word file the reader opens', async () => {
    const parts: string[] = [];
    const walk = (dir: string) => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = join(dir, entry.name);
        if (entry.isDirectory()) walk(full);
        else parts.push(relative(PAPER_PARTS, full).split(sep).join('/'));
      }
    };
    walk(PAPER_PARTS);
    const zip = await JSZip.loadAsync(await buildDocx());
    const entries = Object.values(zip.files)
      .filter((entry) => !entry.dir)
      .map((entry) => entry.name);
    expect(entries.sort()).toEqual(parts.sort());
    expect(entries).toContain('word/document.xml');
    await expect(convertDocx(await buildDocx())).resolves.toBeDefined();
  });

  it('test_docx_text_and_inline: text, emphasis, lists and links; underline is plain', () => {
    const md = paper.markdown;
    expect(md).toContain('Plain words, **bold words**, _slanted words_, ~~struck words~~,');
    expect(md).toContain('- a chisel\n- a mallet');
    expect(md).toContain('1. score the face\n2. cut the channel');
    expect(md).toContain('[the source](https://example.com/source)');
    expect(md).toContain('[the scribe](mailto:scribe@example.com)');
    expect(md).toContain('Zyzzyva closes the paper.');
    expect(md).toContain(', underlined words and a note');
    expect(md).not.toMatch(/[*_]underlined words[*_]|<u>/);
  });

  it('test_docx_heading_levels: (a) a Title heads the chapter and the rest move down', () => {
    expect(paper.title).toBe('On the Weight of Obsidian');
    expect(headings(paper.markdown)).toEqual([
      '# On the Weight of Obsidian',
      '## The Quarry',
      '### Tools',
      '### Washing in H<sub>2</sub>O',
      '#### Links',
      '## The Measure',
    ]);
  });

  it('test_docx_footnotes: a reference where cited and a definition for each note', () => {
    const md = paper.markdown;
    expect(md).toContain('and a note[^1] and a second[^e1].');
    expect(md).toMatch(/^\[\^1\]: The quarry lies north of the river\.$/m);
    expect(md).toMatch(/^\[\^e1\]: Weighed on the mason's own scale\.$/m);
    expect(md).not.toContain('<sup>[^');
    expect(md).not.toContain('↑');
    expect(md).not.toMatch(/^\d+\. .*(quarry lies|mason's own)/m);
  });

  it('test_docx_table_header: the first row is the header', () => {
    const lines = paper.markdown.split('\n').filter((line) => line.startsWith('|'));
    expect(lines[0]).toMatch(/^\| Tablet\s+\| Weight\s+\|$/);
    expect(lines[1]).toMatch(/^\| -+ \| -+ \|$/);
    expect(lines[2]).toMatch(/^\| First\s+\| nine stone\s+\|$/);
    expect(lines).toHaveLength(3);
  });

  it('test_docx_superscript_subscript: kept as sup and sub, never flattened', () => {
    const md = paper.markdown;
    expect(md).toContain('The area is x<sup>2</sup>');
    expect(md).toContain('washed in H<sub>2</sub>O.');
    expect(md).not.toContain('x2');
    expect(md).not.toContain('H2O');
  });

  it('test_docx_unsafe_links: only web and mail addresses stay links', () => {
    const md = paper.markdown;
    expect(md).toContain('never the trapdoor, nor the cellar, and return to the quarry section.');
    expect(md).not.toContain('](javascript:');
    expect(md).not.toContain('](file:');
    expect(md).not.toContain('](#_');
    const links = nodesOfType(md, ['link']) as unknown as { url: string }[];
    expect(links.map((link) => link.url).sort()).toEqual([
      'https://example.com/source',
      'mailto:scribe@example.com',
    ]);
  });

  it('test_docx_images: the picture is returned and referenced under the media path', () => {
    expect(paper.images).toHaveLength(1);
    const [image] = paper.images;
    expect(image!.name).toBe('image-1.png');
    const original = readFileSync(join(PAPER_PARTS, 'word', 'media', 'plate.png'));
    expect(Buffer.compare(image!.bytes, original)).toBe(0);
    expect(paper.markdown).toContain('![A plate of the first tablet](./media/image-1.png)');
  });
});

describe('docx-to-markdown.mjs — variants of the paper', () => {
  const convert = async (bytes: Buffer, fallbackTitle = 'notes') =>
    convertDocx(bytes, { name: 'notes.docx', fallbackTitle });

  it("test_docx_heading_levels: (a') a heading never passes level 6", async () => {
    const out = await convert(
      await variant(
        beforeEnd(
          '<w:p><w:pPr><w:pStyle w:val="Heading6"/></w:pPr><w:r><w:t>Deepest</w:t></w:r></w:p>',
        ),
        {
          'word/styles.xml': (text) =>
            text.replace(
              '</w:styles>',
              '<w:style w:type="paragraph" w:styleId="Heading6"><w:name w:val="heading 6"/></w:style></w:styles>',
            ),
        },
      ),
    );
    expect(headings(out.markdown)).toContain('###### Deepest');
  });

  it('test_docx_heading_levels: (b) no Title and one Heading 1 leaves levels alone', async () => {
    const out = await convert(
      await variant((text) =>
        text
          .replace(TITLE, '')
          .replace(
            '<w:pStyle w:val="Heading1"/></w:pPr><w:r><w:t>The Measure',
            '<w:pStyle w:val="Heading2"/></w:pPr><w:r><w:t>The Measure',
          ),
      ),
    );
    expect(out.title).toBe('The Quarry');
    expect(headings(out.markdown)).toEqual([
      '# The Quarry',
      '## Tools',
      '## Washing in H<sub>2</sub>O',
      '### Links',
      '## The Measure',
    ]);
  });

  it('test_docx_heading_levels: (c) no Title and no Heading 1 is headed by the fallback', async () => {
    const out = await convert(
      await variant((text) => text.replace(TITLE, '').replaceAll('"Heading1"', '"Heading2"')),
    );
    expect(out.title).toBe('notes');
    expect(headings(out.markdown)).toEqual([
      '# notes',
      '## The Quarry',
      '## Tools',
      '## Washing in H<sub>2</sub>O',
      '### Links',
      '## The Measure',
    ]);
  });

  it('test_docx_heading_levels: (d) no Title and several Heading 1 all move down', async () => {
    const out = await convert(await variant((text) => text.replace(TITLE, '')));
    expect(out.title).toBe('notes');
    expect(headings(out.markdown)).toEqual([
      '# notes',
      '## The Quarry',
      '### Tools',
      '### Washing in H<sub>2</sub>O',
      '#### Links',
      '## The Measure',
    ]);
  });

  it('test_docx_figures_marked: charts and diagrams are marked; pictures, text boxes and shapes are not', async () => {
    const NS =
      'xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" ' +
      'xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape" ' +
      'xmlns:v="urn:schemas-microsoft-com:vml" ' +
      'xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" ' +
      'xmlns:dgm="http://schemas.openxmlformats.org/drawingml/2006/diagram"';
    const textBox =
      `<w:p><w:r><mc:AlternateContent><mc:Choice Requires="wps"><w:drawing><wp:inline>` +
      `<wp:extent cx="1" cy="1"/><wp:docPr id="8" name="box"/><a:graphic><a:graphicData uri="${SHAPE}">` +
      `<wps:wsp><wps:txbx><w:txbxContent><w:p><w:r><w:t>Boxed words survive</w:t></w:r></w:p>` +
      `</w:txbxContent></wps:txbx><wps:bodyPr/></wps:wsp></a:graphicData></a:graphic></wp:inline>` +
      `</w:drawing></mc:Choice><mc:Fallback><w:pict><v:shape><v:textbox><w:txbxContent><w:p><w:r>` +
      `<w:t>Boxed words survive</w:t></w:r></w:p></w:txbxContent></v:textbox></v:shape></w:pict>` +
      `</mc:Fallback></mc:AlternateContent></w:r></w:p>`;
    const added =
      drawing('http://schemas.openxmlformats.org/drawingml/2006/chart', '<c:chart r:id="rId77"/>') +
      drawing(
        'http://schemas.openxmlformats.org/drawingml/2006/diagram',
        '<dgm:relIds r:dm="rId78"/>',
      ) +
      textBox;
    const out = await convert(
      await variant((text) => beforeEnd(added)(text.replace('<w:document ', `<w:document ${NS} `))),
    );
    const text = reads(out.markdown);
    expect(count(text, `before ${MARKS.figure} after`)).toBe(2);
    expect(out.leftOut).toContainEqual({ kind: 'figure', count: 2 });
    expect(text).toContain('Boxed words survive');
    expect(out.images).toHaveLength(1); // the paper's picture is still a picture

    // A drawn shape with no text: the reader gives no sign of it, so nothing is
    // marked or listed. INT-0029 records this as a consequence.
    const shape = await convert(
      await variant((text) =>
        beforeEnd(drawing(SHAPE, '<wps:wsp><wps:spPr/><wps:bodyPr/></wps:wsp>'))(
          text.replace('<w:document ', `<w:document ${NS} `),
        ),
      ),
    );
    expect(reads(shape.markdown)).toContain('before after');
    expect(reads(shape.markdown)).not.toContain(MARKS.figure);
    expect(shape.leftOut.filter((entry) => entry.kind !== 'equation')).toEqual([]);
  });

  it('test_docx_unsupported_image: a picture a browser cannot show is marked and listed', async () => {
    const out = await convert(
      await buildDocx(PAPER_PARTS, {
        replace: {
          '[Content_Types].xml': (text) =>
            text.replace(
              '<Default Extension="png"',
              '<Default Extension="emf" ContentType="image/x-emf"/><Default Extension="png"',
            ),
          'word/_rels/document.xml.rels': (text) =>
            text.replace('media/plate.png', 'media/plate.emf'),
          'word/media/plate.emf': Buffer.from('not a real metafile'),
        },
      }),
    );
    expect(reads(out.markdown)).toContain(MARKS.image);
    expect(nodesOfType(out.markdown, ['image'])).toEqual([]);
    expect(out.images).toEqual([]);
    expect(out.leftOut).toContainEqual({ kind: 'image', count: 1, detail: 'image/x-emf' });
    expect(out.leftOut.filter((entry) => entry.kind === 'other')).toEqual([]);
  });

  it('test_docx_reader_messages: an unknown element is listed; an unmapped style is not', async () => {
    const out = await convert(
      await variant(
        beforeEnd(
          '<w:p><w:r><w:t>kept text</w:t></w:r><w:r><w:madeUpThing/></w:r></w:p>' +
            '<w:p><w:pPr><w:pStyle w:val="Fancy"/></w:pPr><w:r><w:t>Fancy styled text</w:t></w:r></w:p>' +
            // A style the document names but never defines, as Word's own
            // files do (seen in a real one: "Heading7 was referenced but not
            // defined"). The text is kept, so nothing was left out.
            '<w:p><w:pPr><w:pStyle w:val="Ghost"/></w:pPr><w:r><w:t>Ghost styled text</w:t></w:r></w:p>',
        ),
        {
          'word/styles.xml': (text) =>
            text.replace(
              '</w:styles>',
              '<w:style w:type="paragraph" w:styleId="Fancy"><w:name w:val="Fancy Quote"/></w:style></w:styles>',
            ),
        },
      ),
    );
    expect(out.markdown).toContain('kept text');
    expect(out.markdown).toContain('Fancy styled text');
    const others = out.leftOut.filter((entry) => entry.kind === 'other');
    expect(others).toHaveLength(1);
    expect(others[0]).toMatchObject({ count: 1 });
    expect(others[0]!.detail).toMatch(/madeUpThing/);
    expect(JSON.stringify(out.leftOut)).not.toMatch(/Fancy/);
    expect(out.markdown).toContain('Ghost styled text');
    expect(JSON.stringify(out.leftOut)).not.toMatch(/Ghost/);
  });

  // The next two rules came from reading files saved by Word itself (the pandoc
  // project's test documents), which the hand-written parts did not cover.
  it('test_docx_block_quotes: Word’s quotation styles are block quotations', async () => {
    const quote = (style: string, words: string) =>
      `<w:p><w:pPr><w:pStyle w:val="${style}"/></w:pPr><w:r><w:t>${words}</w:t></w:r></w:p>`;
    const out = await convert(
      await variant(
        beforeEnd(
          quote('Quote', 'First quoted line.') +
            quote('Quote', 'Second quoted line.') +
            '<w:p><w:r><w:t>Plain between.</w:t></w:r></w:p>' +
            quote('IntenseQuote', 'An intense line.') +
            '<w:p><w:r><w:t>Plain again.</w:t></w:r></w:p>' +
            quote('BlockText', 'A block text line.'),
        ),
        {
          'word/styles.xml': (text) =>
            text.replace(
              '</w:styles>',
              '<w:style w:type="paragraph" w:styleId="Quote"><w:name w:val="Quote"/></w:style>' +
                '<w:style w:type="paragraph" w:styleId="IntenseQuote"><w:name w:val="Intense Quote"/></w:style>' +
                '<w:style w:type="paragraph" w:styleId="BlockText"><w:name w:val="Block Text"/></w:style>' +
                '</w:styles>',
            ),
        },
      ),
    );
    expect(out.markdown).toContain('> First quoted line.\n>\n> Second quoted line.');
    expect(out.markdown).toContain('\nPlain between.\n');
    expect(out.markdown).toContain('> An intense line.');
    expect(out.markdown).toContain('> A block text line.');
    expect(nodesOfType(out.markdown, ['blockquote'])).toHaveLength(3);
  });

  it('test_docx_table_cells_stay_one_line: a quotation, a nested list and a table inside a cell', async () => {
    const para = (words: string, style = '') =>
      `<w:p>${style ? `<w:pPr><w:pStyle w:val="${style}"/></w:pPr>` : ''}<w:r><w:t>${words}</w:t></w:r></w:p>`;
    const item = (level: number, words: string) =>
      `<w:p><w:pPr><w:pStyle w:val="ListParagraph"/><w:numPr><w:ilvl w:val="${level}"/>` +
      `<w:numId w:val="1"/></w:numPr></w:pPr><w:r><w:t>${words}</w:t></w:r></w:p>`;
    const cell = (inner: string) => `<w:tc>${inner}</w:tc>`;
    const innerTable =
      `<w:tbl><w:tr>${cell(para('inner A'))}${cell(para('inner B'))}</w:tr>` +
      `<w:tr>${cell(para('inner C'))}${cell(para('inner D'))}</w:tr></w:tbl>`;
    const out = await convert(
      await variant(
        (text) =>
          text
            .replace(
              '<w:tc><w:p><w:r><w:t>First</w:t></w:r></w:p></w:tc>',
              cell(para('Quoted one.', 'Quote') + para('Quoted two.', 'Quote')),
            )
            .replace(
              '<w:tc><w:p><w:r><w:t>nine stone</w:t></w:r></w:p></w:tc>',
              cell(item(0, 'outer') + item(1, 'inner') + innerTable + para('after')),
            ),
        {
          'word/styles.xml': (text) =>
            text.replace(
              '</w:styles>',
              '<w:style w:type="paragraph" w:styleId="Quote"><w:name w:val="Quote"/></w:style></w:styles>',
            ),
          'word/numbering.xml': (text) =>
            text.replace(
              '<w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="bullet"/><w:lvlText w:val="•"/></w:lvl>',
              '<w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="bullet"/><w:lvlText w:val="•"/></w:lvl>' +
                '<w:lvl w:ilvl="1"><w:start w:val="1"/><w:numFmt w:val="bullet"/><w:lvlText w:val="o"/></w:lvl>',
            ),
        },
      ),
    );
    const rows = out.markdown.split('\n').filter((line) => line.startsWith('|'));
    // Still the header, the divider and one body row of two cells; and no line
    // of the chapter is a stray quotation or an extra table row.
    expect(rows).toHaveLength(3);
    for (const row of rows) expect(row.replace(/\\\|/g, '').split('|')).toHaveLength(4);
    expect(out.markdown).not.toMatch(/^> ?Quoted/m);
    expect(rows[2]).toContain('Quoted one.<br>Quoted two.');
    // The nested item is indented by two no-break spaces.
    const nbsp = String.fromCharCode(160);
    expect(rows[2]).toContain(`• outer<br>${nbsp}${nbsp}• inner<br>`);
    // The table inside the cell is one line to a row, and appears once.
    expect(rows[2]).toContain('inner A / inner B<br>inner C / inner D<br>after');
    expect(out.markdown.split('inner A')).toHaveLength(2);
  });

  it('test_docx_reader_messages: a message that merely holds the word "style" is still listed', async () => {
    // A symbol the reader cannot map, in a font whose name ends in "Style".
    const out = await convert(
      await variant(
        beforeEnd(
          '<w:p><w:r><w:t xml:space="preserve">A bullet </w:t></w:r>' +
            '<w:r><w:sym w:font="Bookman Old Style" w:char="F0B7"/></w:r>' +
            '<w:r><w:t xml:space="preserve"> here.</w:t></w:r></w:p>',
        ),
      ),
    );
    expect(out.markdown).toContain('A bullet');
    const others = out.leftOut.filter((entry) => entry.kind === 'other');
    expect(others).toHaveLength(1);
    expect(others[0]!.detail).toMatch(/Bookman Old Style/);
  });

  it('test_docx_reader_messages: remarks that leave nothing out are passed over; a linked picture is listed', async () => {
    const BETWEEN_ROWS = /<\/w:tr>\s*<w:tr>/;
    let bookmarked = false;
    const quiet = await convert(
      await variant((text) => {
        bookmarked = BETWEEN_ROWS.test(text);
        return beforeEnd(
          // An undefined style whose ID holds a space.
          '<w:p><w:pPr><w:pStyle w:val="My Style"/></w:pPr><w:r><w:t>Spaced style text</w:t></w:r></w:p>',
        )(
          // A bookmark between two rows, and one between two cells: the reader
          // remarks on each, and the table is whole.
          text
            .replace(
              BETWEEN_ROWS,
              '</w:tr><w:bookmarkStart w:id="9" w:name="between"/><w:bookmarkEnd w:id="9"/><w:tr>',
            )
            .replace(
              '<w:tc><w:p><w:r><w:t>First</w:t></w:r></w:p></w:tc>',
              '<w:tc><w:p><w:r><w:t>First</w:t></w:r></w:p></w:tc>' +
                '<w:bookmarkStart w:id="10" w:name="cells"/><w:bookmarkEnd w:id="10"/>',
            ),
        );
      }),
    );
    expect(bookmarked).toBe(true);
    expect(quiet.markdown).toContain('Spaced style text');
    expect(quiet.markdown).toMatch(/^\| First\s+\| nine stone\s+\|$/m);
    expect(quiet.leftOut).toEqual([]);

    // A picture the document links to and does not hold: named, with no mark,
    // since the reader does not say where it stood (INT-0029's consequences).
    const linked = await convert(
      await buildDocx(PAPER_PARTS, {
        replace: {
          'word/document.xml': (text) =>
            text.replace('<a:blip r:embed="rId5"/>', '<a:blip r:link="rId41"/>'),
          'word/_rels/document.xml.rels': (text) =>
            text.replace(
              '</Relationships>',
              '<Relationship Id="rId41" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" ' +
                'Target="file:///C:/Style%20Guide/plate.png" TargetMode="External"/></Relationships>',
            ),
        },
      }),
    );
    expect(linked.images).toEqual([]);
    expect(nodesOfType(linked.markdown, ['image'])).toEqual([]);
    const others = linked.leftOut.filter((entry) => entry.kind === 'other');
    expect(others).toHaveLength(1);
    expect(others[0]!.detail).toMatch(/external image/);
  });

  it('test_docx_line_breaks: a line break keeps words apart and is written as a break', async () => {
    const br = '<w:r><w:br/></w:r>';
    const out = await convert(
      await variant((text) =>
        beforeEnd(
          `<w:p><w:r><w:t>A line</w:t></w:r>${br}<w:r><w:t>broken.</w:t></w:r></w:p>` +
            `<w:p><w:r><w:t>Guild of Masons</w:t></w:r>${br}` +
            '<w:r><w:rPr><w:vertAlign w:val="superscript"/></w:rPr><w:t>a</w:t></w:r>' +
            '<w:r><w:t>Corresponding author</w:t></w:r></w:p>',
        )(
          text
            .replace(
              '<w:r><w:t>On the Weight of Obsidian</w:t></w:r>',
              `<w:r><w:t>On the Weight</w:t></w:r>${br}<w:r><w:t>of Obsidian</w:t></w:r>`,
            )
            .replace(
              '<w:r><w:t>The Quarry</w:t></w:r>',
              `<w:r><w:t>The Quarry</w:t></w:r>${br}<w:r><w:t>Northern Face</w:t></w:r>`,
            ),
        ),
      ),
    );
    // The title keeps its words apart, though it was set over two lines.
    expect(out.title).toBe('On the Weight of Obsidian');
    // A heading is one line: its break is a space, so the page's own reading of
    // the heading (the "on this page" rail, the id) keeps the words apart.
    expect(headings(out.markdown).slice(0, 2)).toEqual([
      '# On the Weight of Obsidian',
      '## The Quarry Northern Face',
    ]);
    expect(out.markdown).toContain('A line<br>broken.');
    expect(out.markdown).toContain('Guild of Masons<br><sup>a</sup>Corresponding author');
    // No stray backslash where a break met kept HTML.
    expect(out.markdown).not.toMatch(/\\ ?</);
  });

  it('test_docx_line_breaks: a page or column break inside a paragraph keeps its words apart', async () => {
    const page = '<w:r><w:br w:type="page"/></w:r>';
    const column = '<w:r><w:br w:type="column"/></w:r>';
    const out = await convert(
      await variant((text) =>
        beforeEnd(
          `<w:p><w:r><w:t>lastword</w:t></w:r>${page}<w:r><w:t>Firstword of the next page</w:t></w:r></w:p>` +
            `<w:p><w:r><w:t>leftcolumn</w:t></w:r>${column}<w:r><w:t>rightcolumn</w:t></w:r></w:p>`,
        )(
          text
            .replace(
              '<w:r><w:t>On the Weight of Obsidian</w:t></w:r>',
              `<w:r><w:t>On the Weight</w:t></w:r>${page}<w:r><w:t>of Obsidian</w:t></w:r>`,
            )
            .replace(
              '<w:tc><w:p><w:r><w:t>nine stone</w:t></w:r></w:p></w:tc>',
              `<w:tc><w:p><w:r><w:t>nine</w:t></w:r>${page}<w:r><w:t>stone</w:t></w:r></w:p></w:tc>`,
            ),
        ),
      ),
    );
    expect(out.title).toBe('On the Weight of Obsidian');
    expect(headings(out.markdown)[0]).toBe('# On the Weight of Obsidian');
    expect(out.markdown).toContain('lastword<br>Firstword of the next page');
    expect(out.markdown).toContain('leftcolumn<br>rightcolumn');
    expect(out.markdown).toMatch(/\| nine<br>stone\s+\|$/m);
    expect(out.markdown).not.toMatch(/lastwordFirstword|ninestone|Weightof|leftcolumnrightcolumn/);
  });

  it('test_docx_heading_levels: a Title or heading inside a table still leaves the chapter one top heading', async () => {
    const cover = (inner: string) => `<w:tbl><w:tr><w:tc>${inner}</w:tc></w:tr></w:tbl>`;
    const TITLE_PARAGRAPH =
      '<w:p><w:pPr><w:pStyle w:val="Title"/></w:pPr><w:r><w:t>On the Weight of Obsidian</w:t></w:r></w:p>';
    // A cover laid out as a table that holds the Title.
    const covered = await convert(
      await variant((text) => text.replace(TITLE_PARAGRAPH, cover(TITLE_PARAGRAPH))),
    );
    expect(covered.title).toBe('On the Weight of Obsidian');
    expect(headings(covered.markdown)).toEqual([
      '# On the Weight of Obsidian',
      '## The Quarry',
      '### Tools',
      '### Washing in H<sub>2</sub>O',
      '#### Links',
      '## The Measure',
    ]);
    expect(covered.markdown.indexOf('# On the Weight of Obsidian')).toBe(0);
    // The cover table is still there, holding the title's words as text.
    expect(covered.markdown).toMatch(/^\| On the Weight of Obsidian \|$/m);

    // No Title, and the only Heading 1 sits in a table: the file's name heads it.
    const boxed = await convert(
      await variant((text) =>
        text
          .replace(TITLE, '')
          .replace(
            '<w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:t>The Quarry</w:t></w:r></w:p>',
            cover(
              '<w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:t>The Quarry</w:t></w:r></w:p>',
            ),
          )
          .replace(
            '<w:pStyle w:val="Heading1"/></w:pPr><w:r><w:t>The Measure',
            '<w:pStyle w:val="Heading2"/></w:pPr><w:r><w:t>The Measure',
          ),
      ),
    );
    expect(boxed.title).toBe('notes');
    expect(headings(boxed.markdown)[0]).toBe('# notes');
    expect(headings(boxed.markdown).filter((line) => line.startsWith('# '))).toHaveLength(1);
    expect(boxed.markdown).toMatch(/^\| The Quarry \|$/m);
  });

  it('test_docx_table_cells_stay_one_line: paragraphs and lists in a cell do not break the table', async () => {
    const item = (num: number, words: string) =>
      `<w:p><w:pPr><w:pStyle w:val="ListParagraph"/><w:numPr><w:ilvl w:val="0"/>` +
      `<w:numId w:val="${num}"/></w:numPr></w:pPr><w:r><w:t>${words}</w:t></w:r></w:p>`;
    const out = await convert(
      await variant((text) =>
        text
          .replace(
            '<w:tc><w:p><w:r><w:t>First</w:t></w:r></w:p></w:tc>',
            `<w:tc><w:p><w:r><w:t>First</w:t></w:r></w:p><w:p><w:r><w:t>and second line</w:t></w:r></w:p></w:tc>`,
          )
          .replace(
            '<w:tc><w:p><w:r><w:t>nine stone</w:t></w:r></w:p></w:tc>',
            `<w:tc>${item(1, 'a chip')}${item(1, 'a crack')}${item(2, 'weighed')}${item(2, 'weighed again')}</w:tc>`,
          ),
      ),
    );
    const rows = out.markdown.split('\n').filter((line) => line.startsWith('|'));
    // Header, divider, and the one body row: the cell's blocks stayed on its line.
    expect(rows).toHaveLength(3);
    expect(rows[0]).toMatch(/^\| Tablet\s+\| Weight\s+\|$/);
    expect(rows[2]).toContain('First<br>and second line');
    expect(rows[2]).toContain('• a chip<br>• a crack<br>1. weighed<br>2. weighed again');
    // Each row is still one line of two cells.
    for (const row of rows) expect(row.split('|')).toHaveLength(4);
    expect(out.markdown).not.toMatch(/^- a chip|^\d+\. weighed/m);
  });

  // INT-0029 AC4: layout and decoration are not carried over and not reported.
  // If the reader warned about any of these, every real paper would print a
  // line of "elements the Word reader did not recognise".
  it('test_docx_decoration_is_silent: fonts, colours, comments, headers, bookmarks and field codes leave no report', async () => {
    const field = (code: string, shown: string) =>
      `<w:r><w:fldChar w:fldCharType="begin"/></w:r>` +
      `<w:r><w:instrText xml:space="preserve"> ${code} </w:instrText></w:r>` +
      `<w:r><w:fldChar w:fldCharType="separate"/></w:r>` +
      `<w:r><w:t>${shown}</w:t></w:r><w:r><w:fldChar w:fldCharType="end"/></w:r>`;
    const added =
      '<w:p><w:r><w:rPr><w:rFonts w:ascii="Garamond" w:hAnsi="Garamond"/><w:color w:val="FF0000"/>' +
      '<w:sz w:val="32"/><w:highlight w:val="yellow"/></w:rPr><w:t>Dressed words.</w:t></w:r></w:p>' +
      '<w:p><w:commentRangeStart w:id="0"/><w:r><w:t>Commented words.</w:t></w:r>' +
      '<w:commentRangeEnd w:id="0"/><w:r><w:commentReference w:id="0"/></w:r></w:p>' +
      '<w:p><w:bookmarkStart w:id="5" w:name="_Ref1"/><w:r><w:t>Marked place.</w:t></w:r>' +
      '<w:bookmarkEnd w:id="5"/></w:p>' +
      `<w:p><w:r><w:t xml:space="preserve">See </w:t></w:r>${field('REF _Ref1 \\h', 'the marked place')}` +
      `<w:r><w:t xml:space="preserve"> on page </w:t></w:r>${field('PAGEREF _Ref1 \\h', '7')}` +
      `<w:r><w:t xml:space="preserve"> or follow </w:t></w:r>${field('HYPERLINK \\l "_Ref1"', 'a field link')}` +
      '<w:r><w:t>.</w:t></w:r></w:p>';
    const out = await convert(
      await buildDocx(PAPER_PARTS, {
        replace: {
          'word/document.xml': (text) =>
            text.replace(
              '<w:sectPr/>',
              `${added}<w:sectPr><w:headerReference w:type="default" r:id="rId30"/>` +
                '<w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1440" w:bottom="1440"/></w:sectPr>',
            ),
          'word/_rels/document.xml.rels': (text) =>
            text.replace(
              '</Relationships>',
              '<Relationship Id="rId30" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/header" Target="header1.xml"/>' +
                '<Relationship Id="rId31" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/comments" Target="comments.xml"/>' +
                '</Relationships>',
            ),
          '[Content_Types].xml': (text) =>
            text.replace(
              '</Types>',
              '<Override PartName="/word/header1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml"/>' +
                '<Override PartName="/word/comments.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.comments+xml"/>' +
                '</Types>',
            ),
          'word/header1.xml':
            '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
            '<w:hdr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
            '<w:p><w:r><w:t>Running head words</w:t></w:r></w:p></w:hdr>',
          'word/comments.xml':
            '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
            '<w:comments xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
            '<w:comment w:id="0" w:author="A"><w:p><w:r><w:t>Margin remark words</w:t></w:r></w:p></w:comment>' +
            '</w:comments>',
        },
      }),
    );
    const text = reads(out.markdown);
    // The words are kept…
    expect(text).toContain('Dressed words.');
    expect(text).toContain('Commented words.');
    expect(text).toContain('Marked place.');
    expect(text).toContain('See the marked place on page 7 or follow a field link.');
    // …the header and the comment are not carried over…
    expect(text).not.toContain('Running head words');
    expect(text).not.toContain('Margin remark words');
    // …no link was made of a cross-reference…
    const links = nodesOfType(out.markdown, ['link']) as unknown as { url: string }[];
    expect(links.map((link) => link.url).sort()).toEqual([
      'https://example.com/source',
      'mailto:scribe@example.com',
    ]);
    // …and nothing is reported: the paper's two equations are carried over.
    expect(out.leftOut).toEqual([]);
  });
});

describe('docx-to-markdown.mjs — the source is only read (INT-0029 AC6)', () => {
  let tmp: string;
  const sha = (path: string) => createHash('sha256').update(readFileSync(path)).digest('hex');
  beforeAll(() => {
    tmp = mkdtempSync(join(tmpdir(), 'tome-docx-'));
  });
  afterAll(() => rmSync(tmp, { recursive: true, force: true }));

  it('test_docx_source_untouched: nothing is changed or written, on success or on error', async () => {
    const good = join(tmp, 'paper.docx');
    const bad = join(tmp, 'broken.docx');
    writeFileSync(good, await buildDocx());
    writeFileSync(bad, 'this is plain text, not a Word file\n');
    const before = { good: sha(good), bad: sha(bad), listing: readdirSync(tmp).sort() };

    const out = await convertDocx(good);
    expect(out.title).toBe('On the Weight of Obsidian');
    await expect(convertDocx(bad)).rejects.toThrow(
      /broken\.docx could not be read as a Word document/,
    );

    expect(sha(good)).toBe(before.good);
    expect(sha(bad)).toBe(before.bad);
    expect(readdirSync(tmp).sort()).toEqual(before.listing);
  });
});

// --- Equations carried over as LaTeX (INT-0030, T-082) -------------------------

const R = String.raw;
const eq = (inner: string) => `<m:oMath>${inner}</m:oMath>`;
const mr = (text: string) => `<m:r><m:t>${text}</m:t></m:r>`;
const FIRST_EQUATION =
  '<m:oMath><m:f><m:num><m:r><m:t>m</m:t></m:r></m:num><m:den><m:r><m:t>V</m:t></m:r></m:den></m:f></m:oMath>';
const AFTER_FIRST = '<w:r><w:t xml:space="preserve">(see the table) for every tablet.</w:t></w:r>';
const ROOT_TWO = eq(
  `<m:rad><m:radPr><m:degHide m:val="1"/></m:radPr><m:deg/><m:e>${mr('2')}</m:e></m:rad>`,
);
const MATRIX_EQUATION = eq(
  `<m:d><m:dPr><m:begChr m:val="("/><m:endChr m:val=")"/></m:dPr><m:e><m:m>` +
    `<m:mr><m:e>${mr('a')}</m:e><m:e>${mr('b')}</m:e></m:mr>` +
    `<m:mr><m:e>${mr('c')}</m:e><m:e>${mr('d')}</m:e></m:mr></m:m></m:e></m:d>`,
);
const UNKNOWN_EQUATION = eq(`<m:mystery>${mr('a')}</m:mystery>`);
const asPara = (equation: string) => `<w:p><m:oMathPara>${equation}</m:oMathPara></w:p>`;

/** The paper with its first equation exchanged for another. */
const withFirst = (equation: string, after = AFTER_FIRST) =>
  variant((text) => {
    expect(text).toContain(FIRST_EQUATION);
    expect(text).toContain(AFTER_FIRST);
    return text.replace(FIRST_EQUATION, equation).replace(AFTER_FIRST, after);
  });

interface Formula {
  type: string;
  value: string;
}
/** A document as Tome's own reader reads it (remark-math-dollars.mjs). */
function readBack(markdown: string) {
  const processor = unified().use(remarkParse).use(remarkGfm).use(remarkMathDollars);
  return processor.runSync(processor.parse(markdown), { value: markdown }) as unknown as MdNode;
}
function formulasIn(node: MdNode): Formula[] {
  const found: Formula[] = [];
  const walk = (each: MdNode): void => {
    if (each.type === 'inlineMath' || each.type === 'math') {
      found.push({ type: each.type, value: each.value ?? '' });
    }
    for (const child of each.children ?? []) walk(child);
  };
  walk(node);
  return found;
}
function nodesIn(node: MdNode, type: string): MdNode[] {
  const found: MdNode[] = [];
  const walk = (each: MdNode): void => {
    if (each.type === type) found.push(each);
    for (const child of each.children ?? []) walk(child);
  };
  walk(node);
  return found;
}

describe('docx-to-markdown.mjs — equations carried over', () => {
  const convert = async (bytes: Buffer, fallbackTitle = 'notes') =>
    convertDocx(bytes, { name: 'paper.docx', fallbackTitle });

  // T-082 clause 4
  it('test_docx_equations_carried: an equation is LaTeX between dollar signs where it stood', async () => {
    const out = await convert(await buildDocx());
    expect(out.markdown).toContain(R`Density is $\frac{m}{V}$(see the table) for every tablet.`);
    // The one that is a paragraph of its own: one line, two dollar signs.
    expect(out.markdown).toMatch(/(^|\n)\$\$E=mc\^\{2\}\$\$(\n|$)/);
    // No backslash of the LaTeX was doubled or dropped by the Markdown writer.
    expect(count(out.markdown, '\\frac')).toBe(1);
    expect(out.markdown).not.toContain('\\\\frac');
    expect(out.markdown).not.toContain(MARKS.equation);
    expect(out.markdown).not.toMatch(/tomeEquation/);
    expect(out.leftOut.filter((entry) => entry.kind === 'equation')).toEqual([]);
  });

  // T-082 clause 5
  it('test_docx_equations_read_back: Tome’s own reader reads back exactly the LaTeX written', async () => {
    const plain = formulasIn(readBack((await convert(await buildDocx())).markdown));
    expect(plain).toEqual([
      { type: 'inlineMath', value: R`\frac{m}{V}` },
      { type: 'math', value: 'E=mc^{2}' },
    ]);

    const cases: [string, string, string, string][] = [
      // label, the equation, the text after it, the LaTeX expected back
      ['directly before a digit', FIRST_EQUATION, '<w:r><w:t>2 parts.</w:t></w:r>', R`\frac{m}{V}`],
      ['holding a dollar sign', eq(mr('a$b')), AFTER_FIRST, R`a\$b`],
      ['ending in a dollar sign', eq(mr('cost=5$')), AFTER_FIRST, R`cost=5\$`],
      ['holding a backtick', eq(mr('a`b')), AFTER_FIRST, 'a`b'],
      ['holding ://', eq(mr('a://b')), AFTER_FIRST, 'a://b'],
      [
        'holding ](',
        eq(
          `<m:d><m:dPr><m:begChr m:val="["/><m:endChr m:val="]"/></m:dPr><m:e>${mr('a')}</m:e></m:d>${mr('(x)')}`,
        ),
        AFTER_FIRST,
        R`\left[ a \right](x)`,
      ],
    ];
    for (const [label, equation, after, expected] of cases) {
      const out = await convert(await withFirst(equation, after));
      const paragraph = nodesIn(readBack(out.markdown), 'paragraph').find((node) =>
        JSON.stringify(node).includes('Density is'),
      );
      expect(paragraph, label).toBeDefined();
      expect(formulasIn(paragraph!), label).toEqual([{ type: 'inlineMath', value: expected }]);
      expect(
        out.leftOut.filter((entry) => entry.kind === 'equation'),
        label,
      ).toEqual([]);
    }
  });

  // T-082 clauses 4, 5
  it('test_docx_equation_in_containers: in a cell, a heading, a list item, a quotation and a note', async () => {
    // A table cell: a `|` in the equation must not end the cell.
    const inCell = await convert(
      await variant((text) =>
        text.replace(
          '<w:tc><w:p><w:r><w:t>nine stone</w:t></w:r></w:p></w:tc>',
          `<w:tc><w:p><w:r><w:t xml:space="preserve">nine </w:t></w:r>${eq(mr('a|b'))}</w:p></w:tc>`,
        ),
      ),
    );
    const before = readBack((await convert(await buildDocx())).markdown);
    const table = readBack(inCell.markdown);
    expect(nodesIn(table, 'tableCell')).toHaveLength(nodesIn(before, 'tableCell').length);
    const cell = nodesIn(table, 'tableCell').find((node) => formulasIn(node).length > 0);
    expect(formulasIn(cell!)).toEqual([{ type: 'inlineMath', value: R`a\vert b` }]);

    // A heading: within its line.
    const inHeading = await convert(
      await variant((text) =>
        text.replace(
          '<w:r><w:t>The Measure</w:t></w:r>',
          `<w:r><w:t xml:space="preserve">The Measure of </w:t></w:r>${ROOT_TWO}`,
        ),
      ),
    );
    expect(inHeading.markdown).toContain(R`## The Measure of $\sqrt{2}$`);
    const heading = nodesIn(readBack(inHeading.markdown), 'heading').find((node) =>
      JSON.stringify(node).includes('The Measure'),
    );
    expect(formulasIn(heading!)).toEqual([{ type: 'inlineMath', value: R`\sqrt{2}` }]);

    // A list item, a quotation and a footnote, each holding an equation that
    // is a paragraph of its own: set apart inside its container.
    const listItem =
      '<w:p><w:pPr><w:pStyle w:val="ListParagraph"/><w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr></w:pPr>';
    const contained = await convert(
      await buildDocx(PAPER_PARTS, {
        replace: {
          'word/document.xml': (text: string) =>
            text
              .replace(
                `${listItem}<w:r><w:t>a mallet</w:t></w:r></w:p>`,
                `${listItem}<w:r><w:t>a mallet</w:t></w:r></w:p>${listItem}<m:oMathPara>${ROOT_TWO}</m:oMathPara></w:p>`,
              )
              .replace(
                '<w:sectPr/>',
                `<w:p><w:pPr><w:pStyle w:val="Quote"/></w:pPr><w:r><w:t>A quoted line.</w:t></w:r></w:p>` +
                  `<w:p><w:pPr><w:pStyle w:val="Quote"/></w:pPr><m:oMathPara>${MATRIX_EQUATION}</m:oMathPara></w:p><w:sectPr/>`,
              ),
          'word/styles.xml': (text: string) =>
            text.replace(
              '</w:styles>',
              '<w:style w:type="paragraph" w:styleId="Quote"><w:name w:val="Quote"/></w:style></w:styles>',
            ),
          'word/footnotes.xml': (text: string) =>
            text.replace(
              '</w:p>\n  </w:footnote>\n</w:footnotes>',
              `</w:p>${asPara(eq(mr('x=y')))}\n  </w:footnote>\n</w:footnotes>`,
            ),
        },
      }),
    );
    const tree = readBack(contained.markdown);
    const apartIn = (type: string) =>
      nodesIn(tree, type).flatMap((node) =>
        formulasIn(node).filter((formula) => formula.type === 'math'),
      );
    expect(apartIn('listItem')).toEqual([{ type: 'math', value: R`\sqrt{2}` }]);
    expect(apartIn('blockquote')).toEqual([
      { type: 'math', value: R`\begin{pmatrix} a & b \\ c & d \end{pmatrix}` },
    ]);
    expect(apartIn('footnoteDefinition')).toEqual([{ type: 'math', value: 'x=y' }]);
    expect(contained.leftOut.filter((entry) => entry.kind === 'equation')).toEqual([]);
  });

  // T-082 clause 6
  it('test_docx_dollar_in_text: a dollar sign the document’s own text holds stays a dollar sign', async () => {
    const out = await convert(
      await variant((text) =>
        text.replace(
          '<w:r><w:t xml:space="preserve">Density is </w:t></w:r>',
          '<w:r><w:t xml:space="preserve">It costs $a and $b; density is </w:t></w:r>',
        ),
      ),
    );
    expect(out.markdown).toContain(R`It costs \$a and \$b; density is $\frac{m}{V}$`);
    const paragraph = nodesIn(readBack(out.markdown), 'paragraph').find((node) =>
      JSON.stringify(node).includes('It costs'),
    );
    expect(formulasIn(paragraph!)).toEqual([{ type: 'inlineMath', value: R`\frac{m}{V}` }]);
    expect(reads(out.markdown)).toContain('It costs $a and $b; density is ');
  });

  // T-082 clause 7
  it('test_docx_title_with_equation: a title shows an equation on one line, never the place-holder', async () => {
    const titled = (equation: string) =>
      variant((text) =>
        text.replace(
          '<w:r><w:t>On the Weight of Obsidian</w:t></w:r></w:p>',
          `<w:r><w:t xml:space="preserve">On the Weight of </w:t></w:r>${equation}</w:p>`,
        ),
      );

    const root = await convert(await titled(ROOT_TWO));
    expect(root.title).toBe('On the Weight of √2');
    expect(root.markdown).toContain(R`# On the Weight of $\sqrt{2}$`);

    const matrix = await convert(await titled(MATRIX_EQUATION));
    expect(matrix.title).toBe(R`On the Weight of $\begin{pmatrix} a & b \\ c & d \end{pmatrix}$`);

    const unknown = await convert(await titled(UNKNOWN_EQUATION));
    expect(unknown.title).toBe(`On the Weight of ${MARKS.equation}`);

    for (const out of [root, matrix, unknown]) expect(out.title).not.toMatch(/tomeEquation/);
  });

  // T-082 clause 8
  it('test_docx_equations_marked: one the converter does not know keeps the mark and is counted', async () => {
    const out = await convert(await withFirst(UNKNOWN_EQUATION));
    const text = reads(out.markdown);
    expect(count(text, MARKS.equation)).toBe(1);
    expect(text).toContain(`Density is ${MARKS.equation}(see the table) for every tablet.`);
    // The other equation is still carried over.
    expect(out.markdown).toMatch(/(^|\n)\$\$E=mc\^\{2\}\$\$(\n|$)/);
    expect(out.leftOut).toContainEqual({ kind: 'equation', count: 1 });

    // With every equation carried over, none is listed.
    const whole = await convert(await buildDocx());
    expect(whole.leftOut.filter((entry) => entry.kind === 'equation')).toEqual([]);
  });

  // T-082 clause 8 (INT-0029: a mark can never form a link)
  it('test_docx_marks_are_literal: a mark is text and can never form a link', async () => {
    // "(see the table)" stands directly after the equation: a mark there must
    // not become the text of a link to "see the table".
    const md = (await convert(await withFirst(UNKNOWN_EQUATION))).markdown;
    expect(reads(md)).toContain(`Density is ${MARKS.equation}(see the table) for every tablet.`);
    const linkish = nodesOfType(md, ['link', 'linkReference', 'definition', 'imageReference']);
    for (const node of linkish) expect(JSON.stringify(node)).not.toContain('not shown');
    expect(nodesOfType(md, ['text']).some((node) => node.value?.includes(MARKS.equation))).toBe(
      true,
    );
  });
});

// Found by the Test phase's review: shapes the cases above did not try.
describe('docx-to-markdown.mjs — equations beside one another, and beside a backslash', () => {
  const convert = async (bytes: Buffer) => convertDocx(bytes, { name: 'paper.docx' });
  const density = (markdown: string) =>
    nodesIn(readBack(markdown), 'paragraph').find((node) =>
      JSON.stringify(node).includes('Density'),
    );

  // T-082 clause 5
  it('test_docx_adjacent_equations: two equations with nothing between them are two formulas', async () => {
    const out = await convert(await withFirst(`${eq(mr('a'))}${eq(mr('b'))}`));
    expect(out.markdown).toContain('Density is $a$ $b$(see the table)');
    expect(formulasIn(density(out.markdown)!)).toEqual([
      { type: 'inlineMath', value: 'a' },
      { type: 'inlineMath', value: 'b' },
    ]);
    expect(out.leftOut.filter((entry) => entry.kind === 'equation')).toEqual([]);

    // Three in a row, the middle one needing two dollar signs.
    const three = await convert(await withFirst(`${eq(mr('a'))}${eq(mr('c$d'))}${eq(mr('b'))}`));
    expect(formulasIn(density(three.markdown)!).map((formula) => formula.value)).toEqual([
      'a',
      R`c\$d`,
      'b',
    ]);
  });

  // T-082 clause 5
  it('test_docx_backslash_before_equation: a backslash of the document’s own does not unmake the formula', async () => {
    const out = await convert(
      await variant((text) =>
        text.replace(
          '<w:r><w:t xml:space="preserve">Density is </w:t></w:r>',
          '<w:r><w:t xml:space="preserve">Density is C:\\</w:t></w:r>',
        ),
      ),
    );
    expect(formulasIn(density(out.markdown)!)).toEqual([
      { type: 'inlineMath', value: R`\frac{m}{V}` },
    ]);
    expect(reads(out.markdown)).toContain('Density is C:\\');
  });

  // T-082 clause 7 (never the place-holder, and never a crash on one)
  it('test_docx_token_in_text: a document that holds the place-holder’s own letters is read as written', async () => {
    const out = await convert(
      await variant((text) =>
        text.replace(
          '<w:r><w:t xml:space="preserve">Density is </w:t></w:r>',
          '<w:r><w:t xml:space="preserve">Density tomeEquation9carried and tomeEquation0carried is </w:t></w:r>',
        ),
      ),
    );
    // The words stay words; the two real equations are still carried over.
    expect(reads(out.markdown)).toContain('Density tomeEquation9carried and ');
    expect(
      formulasIn(readBack(out.markdown)).filter((formula) => formula.value === 'E=mc^{2}'),
    ).toHaveLength(1);
    expect(out.leftOut.filter((entry) => entry.kind === 'equation')).toEqual([]);
  });
});
