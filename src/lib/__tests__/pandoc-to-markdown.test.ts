import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import { unified } from 'unified';
import {
  LATEX_MARK,
  LAYOUT_COMMANDS,
  oneLine,
  writePaper,
} from '../../../scripts/pandoc-to-markdown.mjs';
import { formulaText, readable } from '../../../scripts/rehype-math.mjs';
import remarkMathDollars from '../../../scripts/remark-math-dollars.mjs';

// INT-0033 — pandoc's tree written as the Markdown of a chapter. A tree is
// written out here as pandoc's JSON, so these tests do not run pandoc; the two
// kept trees are what `readPaper()` gives for the fixtures, and
// pandoc-read.test.ts compares them with a fresh reading.
const kept = (name: string) =>
  JSON.parse(readFileSync(join(process.cwd(), 'src/lib/__tests__/papers', name), 'utf8'));
const latex = kept('latex-tree.json');
const typst = kept('typst-tree.json');

type Json = Record<string, unknown>;
type Md = { type: string; value?: string; children?: Md[]; [key: string]: unknown };

// --- pandoc's JSON, briefly -------------------------------------------------
const NO_ATTR = ['', [], []];
const str = (c: string): Json => ({ t: 'Str', c });
const sp: Json = { t: 'Space' };
/** Words as pandoc gives them: `Str` and `Space` in turn. */
const inl = (words: string): Json[] =>
  words.split(' ').flatMap((word, i) => (i === 0 ? [str(word)] : [sp, str(word)]));
const para = (...c: (Json | Json[])[]): Json => ({ t: 'Para', c: c.flat() });
const plain = (...c: (Json | Json[])[]): Json => ({ t: 'Plain', c: c.flat() });
const header = (level: number, words: string, id = ''): Json => ({
  t: 'Header',
  c: [level, [id, [], []], inl(words)],
});
const math = (tex: string, display = false): Json => ({
  t: 'Math',
  c: [{ t: display ? 'DisplayMath' : 'InlineMath' }, tex],
});
const wrap = (t: string, ...c: (Json | Json[])[]): Json => ({ t, c: c.flat() });
const linkTo = (address: string, words: string): Json => ({
  t: 'Link',
  c: [NO_ATTR, inl(words), [address, '']],
});
const cell = (...blocks: Json[]): unknown[] => [NO_ATTR, { t: 'AlignDefault' }, 1, 1, blocks];
const row = (...cells: unknown[][]): unknown[] => [NO_ATTR, cells];
const table = (
  aligns: string[],
  head: unknown[][],
  body: unknown[][],
  caption: Json[] = [],
): Json => ({
  t: 'Table',
  c: [
    NO_ATTR,
    [null, caption],
    aligns.map((t) => [{ t }, { t: 'ColWidthDefault' }]),
    [NO_ATTR, head],
    [[NO_ATTR, 0, [], body]],
    [NO_ATTR, []],
  ],
});
const metaInlines = (words: string): Json => ({ t: 'MetaInlines', c: inl(words) });
const doc = (blocks: Json[], meta: Json = {}) => ({ blocks, meta });
const piece = (contents: string, token: string, more: Json = {}) => ({
  contents,
  source: 'paper.tex',
  line: 7,
  token,
  placed: true,
  ...more,
});

// --- reading the Markdown back ----------------------------------------------
const reader = unified().use(remarkParse).use(remarkGfm).use(remarkMathDollars);
const read = (markdown: string): Md => reader.runSync(reader.parse(markdown), markdown) as Md;
function all(tree: Md, type: string): Md[] {
  const found: Md[] = [];
  const walk = (node: Md) => {
    if (node.type === type) found.push(node);
    (node.children ?? []).forEach(walk);
  };
  walk(tree);
  return found;
}
const textOf = (node: Md): string =>
  node.type === 'text' || node.type === 'inlineCode'
    ? String(node.value)
    : (node.children ?? []).map(textOf).join('');
/** The formulas Tome's reader finds, in order, with whether each is set apart. */
const formulas = (tree: Md) => {
  const at = (node: Md) => (node.position as { start: { offset: number } }).start.offset;
  const found: (Md & { apart: boolean })[] = [
    ...all(tree, 'inlineMath').map((n) => ({ ...n, apart: false })),
    ...all(tree, 'math').map((n) => ({ ...n, apart: true })),
  ];
  return found.sort((a, b) => at(a) - at(b));
};
const write = (blocks: Json[], more: Json = {}) =>
  writePaper({
    tree: doc(blocks, (more.meta as Json) ?? {}),
    fallbackTitle: 'paper',
    name: 'paper.tex',
    ...more,
  });
/** The Markdown under the title. */
const body = (markdown: string) => markdown.replace(/^# .*\n+/, '');

describe('pandoc-to-markdown.mjs — the title and what stands under it (INT-0033 AC2)', () => {
  it('test_paper_title: the paper’s own title, or the file’s name', () => {
    const titled = write([para(inl('Text.'))], { meta: { title: metaInlines('A Short Paper') } });
    expect(titled.markdown.startsWith('# A Short Paper\n')).toBe(true);
    expect(titled.title).toBe('A Short Paper');
    const untitled = write([para(inl('Text.'))]);
    expect(untitled.markdown.startsWith('# paper\n')).toBe(true);
    expect(untitled.title).toBe('paper');
    const formula = write([para(inl('Text.'))], {
      meta: { title: { t: 'MetaInlines', c: [...inl('Why'), sp, math(String.raw`x^2 \ge 0`)] } },
    });
    expect(formula.title).toBe('Why x² ≥ 0');
    expect(formulas(read(formula.markdown)).map((f) => f.value)).toEqual([String.raw`x^2 \ge 0`]);
  });

  it('test_paper_title_note_and_piece: a note and a skipped piece are kept out of the title', () => {
    const out = write([para(inl('Text.'))], {
      meta: {
        title: {
          t: 'MetaInlines',
          c: [
            ...inl('On Sums'),
            { t: 'Note', c: [para(inl('Thanks to the fund.'))] },
            sp,
            str('tokA'),
          ],
        },
        author: { t: 'MetaList', c: [metaInlines('A. Writer')] },
      },
      skipped: [piece(String.raw`\mycmd{x}`, 'tokA')],
    });
    expect(out.title).toBe('On Sums');
    const tree = read(out.markdown);
    expect(textOf(all(tree, 'heading')[0])).toBe('On Sums');
    const paragraphs = all(tree, 'paragraph').map(textOf);
    expect(paragraphs.slice(0, 2)).toEqual(['A. Writer', 'Thanks to the fund.']);
    expect(out.markdown).not.toContain('tokA');
    expect(out.markdown).not.toContain(LATEX_MARK.slice(1));
    expect(out.leftOut).toMatchObject([{ kind: 'command', name: String.raw`\mycmd` }]);
  });

  it('test_paper_heading_levels: a section is one level under the title', () => {
    const out = write([header(1, 'One'), header(2, 'Two'), header(3, 'Three'), header(6, 'Six')], {
      meta: { title: metaInlines('The Paper') },
    });
    expect(all(read(out.markdown), 'heading').map((h) => [h.depth, textOf(h)])).toEqual([
      [1, 'The Paper'],
      [2, 'One'],
      [3, 'Two'],
      [4, 'Three'],
      [6, 'Six'],
    ]);
    // A Typst paper writes its title as its first heading: one `#`, and the rest as they are.
    const own = writePaper({
      tree: doc([header(1, 'The Paper'), header(2, 'Introduction'), header(3, 'Lists')], {
        title: metaInlines('The Paper'),
      }),
      format: 'typst',
      name: 'paper.typ',
      fallbackTitle: 'paper',
    });
    expect(all(read(own.markdown), 'heading').map((h) => [h.depth, textOf(h)])).toEqual([
      [1, 'The Paper'],
      [2, 'Introduction'],
      [3, 'Lists'],
    ]);
    // The Typst fixture is such a paper.
    const fixture = writePaper({ tree: typst.tree, format: 'typst', name: 'paper.typ' });
    const headings = all(read(fixture.markdown), 'heading').map((h) => [h.depth, textOf(h)]);
    expect(headings.filter(([, words]) => words === 'A Short Paper on Sums')).toEqual([
      [1, 'A Short Paper on Sums'],
    ]);
    expect(headings).toContainEqual([2, 'Introduction']);
    expect(headings).toContainEqual([3, 'Lists and a table']);
  });

  it('test_paper_front_matter: authors and date, then the abstract', () => {
    const meta = {
      title: metaInlines('The Paper'),
      author: { t: 'MetaList', c: [metaInlines('A. Writer'), metaInlines('B. Reader')] },
      date: metaInlines('November 2026'),
      abstract: { t: 'MetaBlocks', c: [para(inl('We prove it.'))] },
    };
    const out = write([para(inl('Text.'))], { meta });
    expect(body(out.markdown)).toBe(
      '_A. Writer, B. Reader, November 2026_\n\n**Abstract**\n\nWe prove it.\n\nText.\n',
    );
    // A date that is empty, or only the word that stands for `\today`.
    for (const date of [
      { t: 'MetaInlines', c: [] },
      { t: 'MetaInlines', c: [str('tokT')] },
    ]) {
      const dated = write([para(inl('Text.'))], {
        meta: { ...meta, date, abstract: undefined },
        skipped: [piece(String.raw`\today`, 'tokT')],
      });
      expect(body(dated.markdown)).toBe('_A. Writer, B. Reader_\n\nText.\n');
    }
    expect(
      body(write([para(inl('Text.'))], { meta: { title: metaInlines('The Paper') } }).markdown),
    ).toBe('Text.\n');
    // Typst does not print what `#set document(author: …)` holds.
    const typstOut = writePaper({
      tree: doc([para(inl('Text.'))], { title: metaInlines('T'), author: meta.author }),
      format: 'typst',
    });
    expect(body(typstOut.markdown)).toBe('Text.\n');
  });
});

describe('pandoc-to-markdown.mjs — what a paper holds (INT-0033 AC2)', () => {
  it('test_paper_node_rules: each kind of node reads back as that kind', () => {
    const cases: [string, Json[], string, string][] = [
      ['emphasis', [para(wrap('Emph', inl('leaned words')))], 'emphasis', 'leaned words'],
      ['strong', [para(wrap('Strong', inl('strong words')))], 'strong', 'strong words'],
      ['struck', [para(wrap('Strikeout', inl('struck words')))], 'delete', 'struck words'],
      ['code', [para({ t: 'Code', c: [NO_ATTR, 'a_b * c'] })], 'inlineCode', 'a_b * c'],
      ['link', [para(linkTo('https://example.org/a', 'the archive'))], 'link', 'the archive'],
      [
        'bullets',
        [{ t: 'BulletList', c: [[plain(inl('one'))], [plain(inl('two'))]] }],
        'list',
        'onetwo',
      ],
      [
        'quotation',
        [{ t: 'BlockQuote', c: [para(inl('Quoted words.'))] }],
        'blockquote',
        'Quoted words.',
      ],
      ['rule', [para(inl('a')), { t: 'HorizontalRule' }, para(inl('b'))], 'thematicBreak', ''],
    ];
    for (const [label, blocks, type, words] of cases) {
      const found = all(read(write(blocks).markdown), type);
      expect(found, label).toHaveLength(1);
      expect(textOf(found[0]), label).toBe(words);
    }
    const one = (blocks: Json[]) => read(write(blocks).markdown);
    // A paragraph, a line break, and quoted text.
    expect(textOf(all(one([para(inl('Plain words.'))]), 'paragraph')[0])).toBe('Plain words.');
    expect(body(write([para(inl('one'), { t: 'LineBreak' }, inl('two'))]).markdown)).toBe(
      'one<br>two\n',
    );
    expect(
      body(write([para({ t: 'Quoted', c: [{ t: 'DoubleQuote' }, inl('so')] })]).markdown),
    ).toBe('“so”\n');
    // A numbered list keeps its first number.
    const numbered = all(
      one([
        {
          t: 'OrderedList',
          c: [
            [3, { t: 'Decimal' }, { t: 'Period' }],
            [[plain(inl('three'))], [plain(inl('four'))]],
          ],
        },
      ]),
      'list',
    )[0];
    expect([numbered.ordered, numbered.start]).toEqual([true, 3]);
    // A code block keeps its language.
    const code = all(
      one([{ t: 'CodeBlock', c: [['', ['python'], []], 'print(1)\n# not a heading'] }]),
      'code',
    )[0];
    expect([code.lang, code.value]).toEqual(['python', 'print(1)\n# not a heading']);
    // A footnote.
    const noted = one([para(inl('Words'), { t: 'Note', c: [para(inl('A note.'))] })]);
    expect(all(noted, 'footnoteReference')).toHaveLength(1);
    expect(textOf(all(noted, 'footnoteDefinition')[0])).toBe('A note.');
    // Raised and lowered text.
    expect(
      body(
        write([
          para(str('x'), wrap('Superscript', str('2')), str('y'), wrap('Subscript', str('i'))),
        ]).markdown,
      ),
    ).toBe('x<sup>2</sup>y<sub>i</sub>\n');
    // A definition list: a bullet for each term, the term in bold first.
    const defined = write([
      {
        t: 'DefinitionList',
        c: [
          [inl('Sum'), [[plain(inl('what adding gives.'))]]],
          [inl('Product'), [[plain(inl('what multiplying gives.'))]]],
        ],
      },
    ]);
    expect(body(defined.markdown)).toBe(
      '- **Sum**: what adding gives.\n- **Product**: what multiplying gives.\n',
    );
    // Underlining, small capitals and a span are their words, and nothing is counted.
    const dressed = write([
      para(wrap('Underline', inl('under')), sp, wrap('SmallCaps', inl('caps')), sp, {
        t: 'Span',
        c: [NO_ATTR, inl('span')],
      }),
    ]);
    expect(body(dressed.markdown)).toBe('under caps span\n');
    expect(dressed.leftOut).toEqual([]);
  });

  it('test_paper_table: cells, alignments, a heading row and a caption', () => {
    const paper = body(
      writePaper({ tree: latex.tree, skipped: latex.skipped, name: 'paper.tex' }).markdown,
    );
    const sums = all(read(paper), 'table')[0];
    expect(sums.align).toEqual(['left', 'right', 'right']);
    expect((sums.children ?? []).map((r) => (r.children ?? []).map(textOf))).toEqual([
      ['', 'sum', 'square'],
      ['1', '1', '1'],
      ['2', '3', '4'],
      ['3', '6', '9'],
    ]);
    expect(all(sums, 'inlineMath').map((f) => f.value)).toEqual(['n']);
    expect(paper).toMatch(/\| 3 +\| +6 \| +9 \|\n\n(?:.*\n)?.*The first three sums\./);

    // No heading row from pandoc: the first row heads the table.
    const headless = write([
      table(
        ['AlignDefault', 'AlignDefault'],
        [],
        [
          row(cell(plain(inl('a'))), cell(plain(inl('b')))),
          row(cell(plain(inl('c'))), cell(plain(inl('d')))),
        ],
      ),
    ]);
    const rows = (all(read(headless.markdown), 'table')[0].children ?? []).map((r) =>
      (r.children ?? []).map(textOf),
    );
    expect(rows).toEqual([
      ['a', 'b'],
      ['c', 'd'],
    ]);
    // A cell of two paragraphs is one line; a caption stands directly under.
    const tall = write([
      table(
        ['AlignLeft'],
        [row(cell(plain(inl('head'))))],
        [row(cell(para(inl('first')), para(inl('second | third'))))],
        [plain(inl('What it shows.'))],
      ),
    ]);
    expect(body(tall.markdown)).toMatch(
      /^\| head +\|\n\| :-+ \|\n\| first<br>second \\\| third \|\n\nWhat it shows\.\n$/,
    );
  });

  it('test_paper_figure: the picture, its caption, and the address for the stage to settle', () => {
    const out = write([
      {
        t: 'Figure',
        c: [
          ['fig:t', [], []],
          [null, [plain(inl('A triangle of dots.'))]],
          [plain({ t: 'Image', c: [NO_ATTR, [], ['figures/triangle.png', '']] })],
        ],
      },
    ]);
    expect(out.images).toEqual([
      { url: 'figures/triangle.png', placeholder: 'tome-paper-image-0' },
    ]);
    expect(body(out.markdown)).toBe('![](tome-paper-image-0)\n\nA triangle of dots.\n');
  });

  it('test_paper_own_blocks: a theorem, a proof, and an environment pandoc does not know', () => {
    const paper = body(
      writePaper({ tree: latex.tree, skipped: latex.skipped, name: 'paper.tex' }).markdown,
    );
    expect(paper).toContain('**Theorem 1** (Gauss). _For every whole number $n \\ge 1$,_');
    expect(paper).toContain('_Proof._ By induction.');
    expect(paper).toContain('\n\n◻\n');
    expect(paper).toContain('**Lemma 2**.');
    const own = write([
      { t: 'Div', c: [['', ['myenv'], []], [para(inl('Inside my own environment.'))]] },
    ]);
    expect(body(own.markdown)).toBe('Inside my own environment.\n');
  });

  it('test_paper_text_stays_text: nothing the paper’s words hold becomes Markdown', () => {
    for (const words of [
      'It costs $5 to print this paper, and 50% of it is formulas.',
      '*not emphasis*',
      '_nor this_',
      '[not](a link)',
      'a \\ backslash',
      '<b>not bold</b>',
      '- not a list',
      '# not a heading',
      '1. not numbered',
      '$a$ and $b$',
    ]) {
      const tree = read(body(write([para(inl(words))]).markdown));
      expect(tree.children, words).toHaveLength(1);
      expect(tree.children![0].type, words).toBe('paragraph');
      expect(textOf(tree.children![0]), words).toBe(words);
      for (const type of [
        'emphasis',
        'strong',
        'link',
        'html',
        'list',
        'heading',
        'inlineMath',
        'math',
      ]) {
        expect(all(tree, type), `${words}: ${type}`).toEqual([]);
      }
    }
  });

  it('test_paper_unsafe_links: only an address a browser may follow is a link', () => {
    for (const address of [
      'javascript:alert(1)',
      'file:///c:/x',
      'data:text/html,x',
      'vbscript:x',
    ]) {
      const tree = read(write([para(linkTo(address, 'the words'))]).markdown);
      expect(all(tree, 'link'), address).toEqual([]);
      expect(textOf(all(tree, 'paragraph')[0]), address).toBe('the words');
    }
    for (const address of ['https://example.org', 'http://example.org/a', 'mailto:a@example.org']) {
      expect(
        all(read(write([para(linkTo(address, 'the words'))]).markdown), 'link')[0].url,
        address,
      ).toBe(address);
    }
  });

  it('test_paper_deterministic: the same tree is the same Markdown', () => {
    const once = writePaper({ tree: latex.tree, skipped: latex.skipped, name: 'paper.tex' });
    const twice = writePaper({ tree: latex.tree, skipped: latex.skipped, name: 'paper.tex' });
    expect(twice.markdown).toBe(once.markdown);
    expect(twice.leftOut).toEqual(once.leftOut);
  });
});

describe('pandoc-to-markdown.mjs — formulas (INT-0033 AC3)', () => {
  it('test_paper_formula_one_line: comments dropped, lines joined, nothing Markdown can take for a block', () => {
    const typed = String.raw`\begin{equation}
\label{eq:one}
a = b % a comment with $ in it
  + c
- d \% e
\end{equation}`;
    const one = String.raw`\begin{equation} \label{eq:one} a = b + c - d \% e \end{equation}`;
    expect(oneLine(typed)).toBe(one);
    const out = write([para(inl('Before'), math(typed, true), inl('after.'))]);
    expect(out.markdown).toContain(`$$${one}$$`);
    expect(formulas(read(out.markdown))).toMatchObject([{ value: one, apart: true }]);
    expect(out.leftOut).toEqual([]);
    // Lines that Markdown would take for a quotation, a heading's underline or a list.
    // (`#` cannot begin a line of a formula: it is TeX's own parameter sign.)
    const blocks = 'a\n> b\n= c\n- d\n+ e\n* f';
    const second = write([para(math(blocks, true))]);
    expect(formulas(read(second.markdown))).toMatchObject([
      { value: oneLine(blocks), apart: true },
    ]);
    expect(second.leftOut).toEqual([]);
    // A line that ends in a comment is joined to the next as TeX joins them.
    expect(oneLine('\\text{foo%\n  bar}')).toBe('\\text{foobar}');
    expect(oneLine('a \\\\% c\nb')).toBe('a \\\\ b');
    expect(oneLine('\\alpha% c\nb')).toBe('\\alpha b');
    expect(oneLine('a = b\n% only a comment\n+ c')).toBe('a = b + c');
  });

  it('test_paper_formulas: within a line, set apart, and where nothing can stand apart', () => {
    const inline = write([
      para(inl('For'), sp, math(String.raw`n \ge 1`), str(','), sp, inl('so.')),
    ]);
    expect(body(inline.markdown)).toBe('For $n \\ge 1$, so.\n');
    expect(formulas(read(inline.markdown))).toMatchObject([
      { value: String.raw`n \ge 1`, apart: false },
    ]);

    const apart = read(
      body(
        write([para(inl('words before'), sp, math('a = b', true), sp, inl('words after'))])
          .markdown,
      ),
    );
    expect(apart.children!.map((node) => node.type)).toEqual(['paragraph', 'math', 'paragraph']);
    expect(
      apart.children!.map((node) => (node.type === 'math' ? node.value : textOf(node))),
    ).toEqual(['words before', 'a = b', 'words after']);

    const held = write([
      table(
        ['AlignDefault'],
        [row(cell(plain(math('c = d', true))))],
        [row(cell(plain(inl('x'))))],
      ),
      header(1, 'h'),
      { t: 'Header', c: [1, NO_ATTR, [str('On'), sp, math('e = f', true)]] },
      para({ t: 'Link', c: [NO_ATTR, [math('g = h', true)], ['https://example.org', '']] }),
      {
        t: 'Figure',
        c: [NO_ATTR, [null, [plain(math('i = j', true))]], [plain(inl('pictured'))]],
      },
    ]);
    const found = formulas(read(held.markdown));
    expect(found.map((f) => [f.value, f.apart])).toEqual([
      ['c = d', false],
      ['e = f', false],
      ['g = h', false],
      ['i = j', false],
    ]);
    expect(held.leftOut).toEqual([]);
  });

  it('test_paper_formula_set_apart_in_emphasis: the emphasis is divided with the paragraph', () => {
    const paper = read(
      body(writePaper({ tree: latex.tree, skipped: latex.skipped, name: 'paper.tex' }).markdown),
    );
    const at = paper.children!.findIndex((node) => textOf(node).startsWith('Theorem 1 (Gauss).'));
    const [words, formula] = paper.children!.slice(at, at + 2);
    expect(all(words, 'emphasis').map(textOf)).toEqual(['For every whole number ,']);
    expect(formula.type).toBe('math');
    expect(String(formula.value)).toContain(String.raw`\begin{equation}`);

    const both = read(
      body(write([para(wrap('Emph', inl('a'), sp, math('x = y', true), sp, inl('b')))]).markdown),
    );
    expect(both.children!.map((node) => node.type)).toEqual(['paragraph', 'math', 'paragraph']);
    expect(all(both, 'emphasis').map(textOf)).toEqual(['a', 'b']);
  });

  it('test_paper_formulas_read_back: every formula of the paper comes back, and can be laid out', () => {
    const carried: { tex: string; display: boolean }[] = [];
    const collect = (value: unknown) => {
      if (Array.isArray(value)) return value.forEach(collect);
      if (value && typeof value === 'object') {
        const node = value as { t?: string; c?: [{ t: string }, string] };
        if (node.t === 'Math')
          carried.push({ tex: oneLine(node.c![1]), display: node.c![0].t === 'DisplayMath' });
        else Object.values(value).forEach(collect);
      }
    };
    // In the order the chapter has them: the abstract, the text, then the notes.
    collect(latex.tree.meta.abstract);
    const notes: unknown[] = [];
    const withoutNotes = JSON.parse(JSON.stringify(latex.tree.blocks), (_key, value) => {
      if (value && value.t === 'Note') {
        notes.push(value);
        return { t: 'Str', c: '' };
      }
      return value;
    });
    collect(withoutNotes);
    collect(notes);
    expect(carried.length).toBeGreaterThanOrEqual(16);
    const out = writePaper({ tree: latex.tree, skipped: latex.skipped, name: 'paper.tex' });
    const found = formulas(read(out.markdown));
    expect(found.map((f) => f.value)).toEqual(carried.map((f) => f.tex));
    for (const formula of found) {
      expect(readable(String(formula.value), formula.apart), String(formula.value)).toBe(true);
    }
    expect(out.leftOut.filter((entry: { kind: string }) => entry.kind === 'equation')).toEqual([]);
    expect(out.markdown).not.toContain('[equation not shown]');
  });

  it('test_paper_formula_refused_is_marked: a formula that cannot be laid out where it stands', () => {
    const aligned = String.raw`\begin{align} a &= b \end{align}`;
    const out = write([
      para(inl('See'), sp, math(String.raw`x = \badmacro{1}`, true)),
      table(
        ['AlignDefault'],
        [row(cell(plain(inl('head'))))],
        [row(cell(plain(math(aligned, true))))],
      ),
    ]);
    expect(out.markdown.split('\\[equation not shown]').length - 1).toBe(2);
    expect(out.leftOut).toEqual([{ kind: 'equation', count: 2 }]);
    expect(formulas(read(out.markdown))).toEqual([]);
  });
});

describe('pandoc-to-markdown.mjs — what pandoc skipped (INT-0033 AC5)', () => {
  const marks = (markdown: string) => markdown.split(`\\${LATEX_MARK}`).length - 1;

  it('test_paper_skipped_marked: a drawing, and a command that holds words', () => {
    const drawing =
      String.raw`\begin{tikzpicture}` +
      '\n    ' +
      String.raw`\draw (0,0);` +
      '\n    ' +
      String.raw`\end{tikzpicture}`;
    const skipped = [
      piece(String.raw`\mycmd{x}`, 'tokA', { line: 4 }),
      piece(String.raw`\other[opt]`, 'tokB', { line: 5 }),
      piece(drawing, 'tokC', { line: 6 }),
      piece(String.raw`\appcmd{y}`, 'tokD', { line: 2, source: 'appendix.tex' }),
      piece(String.raw`\noindent{\bf Keywords:}`, 'tokE'),
      piece(String.raw`\centering{\includegraphics{a.png}}`, 'tokF'),
      piece(String.raw`\color{red}{Red words}`, 'tokG'),
      piece(String.raw`\begin{definition}[Compactness]`, 'tokH'),
    ];
    const out = write(
      [
        para(inl('We write tokA here and tokB there.')),
        para(str('tokC')),
        para(inl('In the appendix tokD stands.')),
        para(inl('tokE sums. tokF tokG tokH')),
      ],
      { skipped },
    );
    expect(marks(out.markdown)).toBe(8);
    expect(body(out.markdown).split('\n')[0]).toBe(
      `We write \\${LATEX_MARK} here and \\${LATEX_MARK} there.`,
    );
    for (const entry of skipped) expect(out.markdown).not.toContain(entry.token);
    // The mark is text, and stays text though a definition of that name is in the chapter.
    const tree = read(`${out.markdown}\n${LATEX_MARK}: https://example.org\n`);
    expect(all(tree, 'linkReference')).toEqual([]);
    expect(all(tree, 'link')).toEqual([]);
    expect(out.leftOut.map((entry: { kind: string }) => entry.kind)).toEqual(
      Array(8).fill('latex'),
    );
    expect(out.leftOut.slice(0, 4)).toMatchObject([
      { name: String.raw`\mycmd`, line: 4, detail: String.raw`\mycmd at line 4` },
      { name: String.raw`\other`, line: 5 },
      { name: 'tikzpicture', line: 6, detail: 'tikzpicture at line 6' },
      {
        name: String.raw`\appcmd`,
        line: 2,
        file: 'appendix.tex',
        detail: String.raw`\appcmd in appendix.tex at line 2`,
      },
    ]);
    for (const entry of out.leftOut.slice(0, 3)) expect(entry).not.toHaveProperty('file');
    expect(out.leftOut.slice(4).map((entry) => entry.name)).toEqual([
      String.raw`\noindent`,
      String.raw`\centering`,
      String.raw`\color`,
      'definition',
    ]);
  });

  it('test_paper_skipped_counted_only: a bare command, and a piece with no place', () => {
    const bare = write([para(inl('a tokA b'))], { skipped: [piece(String.raw`\myname`, 'tokA')] });
    expect(body(bare.markdown)).toBe('a b\n');
    expect(bare.leftOut).toMatchObject([{ kind: 'command', count: 1, name: String.raw`\myname` }]);
    // Hard against the words either side, as `x\quad y` leaves it.
    const glued = write([para(str('x'), sp, str('tokAy'))], {
      skipped: [piece(String.raw`\myname `, 'tokA')],
    });
    expect(body(glued.markdown)).toBe('x y\n');
    const unplaced = write([para(inl('Text.'))], {
      skipped: [piece(String.raw`\mycmd{x}`, 'tokA', { placed: false })],
    });
    expect(body(unplaced.markdown)).toBe('Text.\n');
    expect(unplaced.leftOut).toMatchObject([
      { kind: 'command', count: 1, name: String.raw`\mycmd` },
    ]);
    for (const out of [bare, glued, unplaced]) {
      expect(out.markdown).not.toContain('tokA');
      expect(marks(out.markdown)).toBe(0);
    }
  });

  it('test_paper_layout_commands_quiet: a command that only lays the page out is passed over', () => {
    expect(LAYOUT_COMMANDS.size).toBeGreaterThanOrEqual(70);
    for (const [name, takes] of LAYOUT_COMMANDS) {
      const argument = '{1em}'.repeat(takes);
      for (const contents of [
        `\\${name}`,
        `\\${name}*`,
        `\\${name} `,
        `\\${name}${argument}`,
        `\\${name}*[t]${argument}`,
      ]) {
        const out = write([para(inl('x tokA y'))], { skipped: [piece(contents, 'tokA')] });
        expect(body(out.markdown), contents).toBe('x y\n');
        expect(out.leftOut, contents).toEqual([]);
      }
      // One group more than it takes holds something of the paper's.
      const more = write([para(inl('x tokA y'))], {
        skipped: [piece(`\\${name}${argument}{Words}`, 'tokA')],
      });
      expect(marks(more.markdown), name).toBe(1);
      expect(more.leftOut, name).toMatchObject([{ kind: 'latex' }]);
    }
    for (const contents of [
      String.raw`\begin{myenv}`,
      String.raw`\end{myenv}`,
      String.raw`\bibitem{gauss}`,
      String.raw`\begin{thebibliography}`,
      String.raw`\end{thebibliography}`,
    ]) {
      const out = write([para(inl('x tokA y'))], { skipped: [piece(contents, 'tokA')] });
      expect(body(out.markdown), contents).toBe('x y\n');
      expect(out.leftOut, contents).toEqual([]);
    }
    const styled = write([para(inl('x tokA y'))], {
      skipped: [piece(String.raw`\mystyle{x}`, 'tokA', { source: 'house.sty' })],
    });
    expect(body(styled.markdown)).toBe('x y\n');
    expect(styled.leftOut).toEqual([]);
    // In the paper itself: `x\quad y` is two words and no mark.
    const paper = writePaper({ tree: latex.tree, skipped: latex.skipped, name: 'paper.tex' });
    expect(paper.markdown).toContain('and set x y apart.');
  });

  it('test_paper_unknown_node: a kind with no rule keeps its words and is counted', () => {
    const out = write([
      para(inl('before'), sp, { t: 'Invented', c: [str('kept')] }, sp, inl('after')),
      { t: 'InventedBlock', c: [para(inl('block words'))] },
    ]);
    expect(body(out.markdown)).toBe('before kept after\n\nblock words\n');
    expect(out.leftOut).toEqual([
      { kind: 'node', count: 1, detail: 'Invented' },
      { kind: 'node', count: 1, detail: 'InventedBlock' },
    ]);
  });
});

describe('pandoc-to-markdown.mjs — references (INT-0033 AC4, AC5)', () => {
  /** A reference as pandoc gives a LaTeX paper's: the label as an attribute, its words the number. */
  const ref = (label: string, words: string, type = 'ref'): Json => ({
    t: 'Link',
    c: [
      [
        '',
        [],
        [
          ['reference-type', type],
          ['reference', label],
        ],
      ],
      [str(words)],
      [`#${label}`, ''],
    ],
  });
  /** A reference as pandoc gives a Typst paper's. */
  const typstRef = (label: string): Json => ({
    t: 'Link',
    c: [['', ['ref'], []], [str(`[${label}]`)], [`#${label}`, '']],
  });
  const label = (id: string): Json => ({ t: 'Span', c: [[id, [], []], []] });
  const paperMarkdown = () =>
    body(writePaper({ tree: latex.tree, skipped: latex.skipped, name: 'paper.tex' }).markdown);
  const linksOf = (markdown: string) =>
    all(read(markdown), 'link').map((link) => [textOf(link), link.url]);
  /** The block that stands directly after an anchor of its own paragraph. */
  const after = (markdown: string, id: string): string => {
    const blocks = markdown.split('\n\n');
    const at = blocks.indexOf(`<a id="${id}"></a>`);
    expect(at, id).toBeGreaterThanOrEqual(0);
    return blocks[at + 1];
  };

  it('test_paper_references: a number that leads to an anchor before what it names', () => {
    const paper = paperMarkdown();
    expect(after(paper, 'ref-sec-result')).toBe('## The result');
    expect(after(paper, 'ref-thm-gauss')).toMatch(/^\*\*Theorem 1\*\* \(Gauss\)\./);
    expect(after(paper, 'ref-tab-sums')).toMatch(/^\| \$n\$/);
    expect(after(paper, 'ref-fig-triangle')).toMatch(/^!\[/);
    expect(linksOf(paper)).toEqual(
      expect.arrayContaining([
        ['2', '#ref-sec-result'],
        ['1', '#ref-thm-gauss'],
        ['2', '#ref-lem-norm'],
        ['1', '#ref-tab-sums'],
        ['1', '#ref-fig-triangle'],
        ['1', '#ref-sec-intro'],
      ]),
    );
    // Search computes a heading's address from the heading alone: it is untouched.
    expect(all(read(paper), 'heading').map(textOf)).toContain('The result');

    // Two labels that differ only in what an anchor cannot hold; one nothing refers to.
    const out = write([
      header(1, 'One', 'a:b'),
      header(1, 'Two', 'a.b'),
      header(1, 'Three', 'unreferred'),
      para(inl('See'), sp, ref('a:b', '1'), sp, inl('and'), sp, ref('a.b', '2'), str('.')),
    ]);
    const markdown = body(out.markdown);
    expect(after(markdown, 'ref-a-b')).toBe('## One');
    expect(after(markdown, 'ref-a-b-2')).toBe('## Two');
    expect(linksOf(markdown)).toEqual([
      ['1', '#ref-a-b'],
      ['2', '#ref-a-b-2'],
    ]);
    expect(markdown).not.toContain('unreferred');
    expect(markdown.split('<a id=').length - 1).toBe(2);
    expect(out.leftOut).toEqual([]);
  });

  it('test_paper_caption_numbers: a caption takes the number a reference shows, and no other', () => {
    const paper = paperMarkdown();
    expect(paper).toContain('\n\n_Table 1._ The first three sums.\n');
    expect(paper).toContain('\n\n_Figure 1._ A triangle of dots.\n');
    const second = (): Json => ({
      ...table(
        ['AlignDefault'],
        [row(cell(plain(inl('h'))))],
        [row(cell(plain(inl('x'))))],
        [plain(inl('A caption.'))],
      ),
    });
    const referred = second();
    (referred.c as unknown[])[0] = ['tab:one', [], []];
    const out = body(
      write([referred, second(), para(inl('See'), sp, ref('tab:one', '1'), str('.'))]).markdown,
    );
    expect(out.split('_Table 1._ A caption.').length - 1).toBe(1);
    expect(out.split('A caption.').length - 1).toBe(2);
    expect(out).toMatch(/\n\nA caption\.\n/);
  });

  it('test_paper_equation_reference: a link the page will write the number into, or none', () => {
    const numbered = String.raw`\begin{equation}\label{eq:gauss} a = b \end{equation}`;
    const out = write([
      para(
        inl('See'),
        sp,
        ref('eq:gauss', '[eq:gauss]', 'eqref'),
        sp,
        inl('and'),
        sp,
        ref('eq:gauss', '[eq:gauss]'),
        str('.'),
      ),
      para(math(numbered, true)),
    ]);
    expect(linksOf(out.markdown)).toEqual([
      ['eq:gauss', '#eq:gauss'],
      ['eq:gauss', '#eq:gauss'],
    ]);
    expect(out.markdown).not.toContain('<a id=');
    expect(out.leftOut).toEqual([]);
    const spaced = write([
      para(ref('eq:a b', '[eq:a b]', 'eqref')),
      para(math(String.raw`\begin{equation}\label{eq:a b} a = b \end{equation}`, true)),
    ]);
    expect(linksOf(spaced.markdown)).toEqual([['eq:a b', '#eq:a%20b']]);

    // A label whose row shows no number, and one in a formula that cannot be shown.
    const cases: [string, string][] = [
      [
        'eq:in',
        String.raw`\begin{equation}\begin{split} a &= b \label{eq:in} \\ &= c \end{split}\end{equation}`,
      ],
      ['eq:no', String.raw`\begin{align} a &= b \label{eq:no} \notag \\ c &= d \end{align}`],
      ['eq:star', String.raw`\begin{equation*}\label{eq:star} a = b \end{equation*}`],
      ['eq:bad', String.raw`\begin{equation}\label{eq:bad} a = \badmacro{1} \end{equation}`],
    ];
    for (const [name, tex] of cases) {
      const dead = write([
        para(inl('See'), sp, ref(name, `[${name}]`, 'eqref'), str('.')),
        para(math(tex, true)),
      ]);
      expect(linksOf(dead.markdown), name).toEqual([]);
      expect(body(dead.markdown).split('\n')[0], name).toBe(`See \\[${name}].`);
      expect(
        dead.leftOut.filter((entry: { kind: string }) => entry.kind === 'reference'),
        name,
      ).toEqual([{ kind: 'reference', count: 1, detail: name }]);
    }
    // A numbered formula in a table cell is written within the line, where it has no number.
    const inCell = write([
      table(
        ['AlignDefault'],
        [row(cell(plain(inl('h'))))],
        [row(cell(plain(math(numbered, true))))],
      ),
      para(ref('eq:gauss', '[eq:gauss]', 'eqref')),
    ]);
    expect(linksOf(inCell.markdown)).toEqual([]);
    expect(inCell.leftOut).toContainEqual({ kind: 'reference', count: 1, detail: 'eq:gauss' });
  });

  it('test_paper_item_label: a label pandoc keeps as a mark within a line', () => {
    const out = write([
      {
        t: 'BulletList',
        c: [[plain(label('it:one'), inl('The first point.'))], [plain(inl('The second.'))]],
      },
      para(inl('See item'), sp, ref('it:one', '[it:one]'), str('.')),
    ]);
    expect(body(out.markdown)).toBe(
      '- <a id="ref-it-one"></a>The first point.\n- The second.\n\nSee item [\\[it:one\\]](#ref-it-one).\n',
    );
    expect(linksOf(out.markdown)).toEqual([['[it:one]', '#ref-it-one']]);
    expect(out.leftOut).toEqual([]);
  });

  it('test_paper_reference_not_followed: shown as written, and counted', () => {
    const paper = writePaper({ tree: latex.tree, skipped: latex.skipped, name: 'paper.tex' });
    expect(paper.markdown).toContain('See \\[nowhere], the same book again');
    expect(paper.leftOut.filter((entry: { kind: string }) => entry.kind === 'reference')).toEqual([
      { kind: 'reference', count: 1, detail: 'nowhere' },
    ]);
    const several = write([
      header(1, 'A', 'sec:a'),
      header(1, 'B', 'sec:b'),
      para(inl('See'), sp, ref('sec:a,sec:b', '[sec:a,sec:b]'), str('.')),
    ]);
    expect(linksOf(several.markdown)).toEqual([]);
    expect(body(several.markdown)).toContain('See \\[sec:a,sec:b].');
    expect(several.leftOut).toEqual([{ kind: 'reference', count: 1, detail: 'sec:a,sec:b' }]);
  });

  it('test_paper_typst_references: a label names what stands before it', () => {
    const paper = body(
      writePaper({ tree: typst.tree, format: 'typst', name: 'paper.typ' }).markdown,
    );
    expect(after(paper, 'ref-sec-result')).toBe('## The result');
    expect(after(paper, 'ref-tab-sums')).toMatch(/^\| \$n\$/);
    expect(after(paper, 'ref-fig-triangle')).toMatch(/^!\[/);
    expect(after(paper, 'ref-eq-gauss')).toMatch(/^\$\$\\sum/);
    expect(linksOf(paper)).toEqual(
      expect.arrayContaining([
        ['The result', '#ref-sec-result'],
        ['the equation', '#ref-eq-gauss'],
        ['the table', '#ref-tab-sums'],
        ['the figure', '#ref-fig-triangle'],
      ]),
    );
    expect(paper).not.toContain('<span');
    for (const block of paper.split('\n\n')) expect(block.trim()).not.toBe('');
    // A label nothing refers to leaves nothing behind.
    expect(paper).not.toContain('sec-intro');
    expect(paper).not.toContain('sec-appendix');

    // No blank line after the heading: the label is the first inline of the next paragraph.
    const close = body(
      writePaper({
        tree: doc([
          header(1, 'Close', ''),
          para(label('sec-close'), sp, inl('Words that follow.')),
          para(inl('Some words'), label('here'), str('.')),
          para(
            inl('See'),
            sp,
            typstRef('sec-close'),
            sp,
            inl('and'),
            sp,
            typstRef('here'),
            str('.'),
          ),
        ]),
        format: 'typst',
      }).markdown,
    );
    expect(close).toBe(
      '<a id="ref-sec-close"></a>\n\n## Close\n\nWords that follow.\n\nSome words<a id="ref-here"></a>.\n\n' +
        'See [Close](#ref-sec-close) and [\\[here\\]](#ref-here).\n',
    );
  });
});

describe('pandoc-to-markdown.mjs — citations and the reference list (INT-0033 AC4, AC5)', () => {
  const linksOf = (markdown: string) =>
    all(read(markdown), 'link').map((link) => [textOf(link), link.url]);
  const citations = (out: { leftOut: { kind: string }[] }) =>
    out.leftOut.filter((entry) => entry.kind === 'citation');
  /** A citation as `citeproc` leaves it, with `link-citations`: words, and a link for each entry. */
  const worked = (...keys: [string, string][]): Json => ({
    t: 'Cite',
    c: [
      keys.map(([key]) => ({
        citationId: key,
        citationPrefix: [],
        citationSuffix: [],
        citationMode: { t: 'NormalCitation' },
      })),
      [
        str('('),
        ...keys.flatMap(([key, words], i) => [
          ...(i > 0 ? [str(';'), sp] : []),
          { t: 'Link', c: [NO_ATTR, inl(words), [`#ref-${key}`, '']] } as Json,
        ]),
        str(')'),
      ],
    ],
  });
  const entry = (key: string, words: string): Json => ({
    t: 'Div',
    c: [[`ref-${key}`, ['csl-entry'], []], [para(inl(words))]],
  });
  const refs = (...entries: Json[]): Json => ({
    t: 'Div',
    c: [['refs', ['references', 'csl-bib-body'], []], entries],
  });
  /** A citation pandoc did not work out: the keys, and what the citation carries. */
  const cite = (
    keys: string[],
    {
      prefix = '',
      suffix = '',
      mode = 'NormalCitation',
    }: { prefix?: string; suffix?: string; mode?: string } = {},
  ): Json => ({
    t: 'Cite',
    c: [
      keys.map((key, i) => ({
        citationId: key,
        citationPrefix: i === 0 && prefix ? inl(prefix) : [],
        citationSuffix: i === keys.length - 1 && suffix ? inl(suffix) : [],
        citationMode: { t: mode },
      })),
      [{ t: 'RawInline', c: ['latex', String.raw`\cite{${keys.join(',')}}`] }],
    ],
  });
  /** The paper's own list, as it reaches the tree: words that stand for its three kinds of piece. */
  const ownList = (): { blocks: Json[]; skipped: Json[] } => ({
    blocks: [
      para(
        str('tokB9'),
        sp,
        str('tokG'),
        sp,
        inl('C. F. Gauss, Disquisitiones, 1801.'),
        sp,
        str('tokE'),
        sp,
        inl('L. Euler, Introductio, 1748.'),
        sp,
        str('tokZ'),
      ),
    ],
    skipped: [
      piece(String.raw`\begin{thebibliography}`, 'tokB'),
      piece(String.raw`\bibitem{gauss}`, 'tokG'),
      piece(String.raw`\bibitem[Eul48]{euler}`, 'tokE'),
      piece(String.raw`\end{thebibliography}`, 'tokZ'),
    ],
  });

  it('test_paper_citeproc_citations: pandoc’s words, each entry’s a link to that entry', () => {
    const out = write([
      para(inl('Known'), sp, worked(['gauss', 'Gauss 1801'], ['euler', 'Euler 1748']), str('.')),
      para(
        inl('Again'),
        sp,
        worked(['gauss', 'Gauss 1801'], ['nobody', 'nobody?']),
        sp,
        inl('and'),
        sp,
        worked(['nobody', 'nobody?']),
        str('.'),
      ),
      refs(
        entry('euler', 'Euler, Leonhard. 1748. Introductio.'),
        entry('gauss', 'Gauss, Carl Friedrich. 1801. Disquisitiones.'),
      ),
    ]);
    const markdown = body(out.markdown);
    expect(markdown).toContain(
      'Known ([Gauss 1801](#ref-ref-gauss); [Euler 1748](#ref-ref-euler)).',
    );
    expect(markdown).toContain('Again ([Gauss 1801](#ref-ref-gauss); nobody?) and (nobody?).');
    expect(citations(out)).toEqual([{ kind: 'citation', count: 1, detail: 'nobody' }]);
    // Each link leads to the anchor before its own entry.
    const blocks = markdown.split('\n\n');
    expect(blocks[blocks.indexOf('<a id="ref-ref-gauss"></a>') + 1]).toMatch(
      /^Gauss, Carl Friedrich\./,
    );
    expect(blocks[blocks.indexOf('<a id="ref-ref-euler"></a>') + 1]).toMatch(/^Euler, Leonhard\./);
    // In the Typst paper.
    const paper = writePaper({ tree: typst.tree, format: 'typst', name: 'paper.typ' });
    expect(linksOf(paper.markdown)).toContainEqual(['Gauss 1801', '#ref-ref-gauss']);
    expect(citations(paper)).toEqual([]);
  });

  it('test_paper_reference_list: one heading, at the sections’ level, and nothing for an empty list', () => {
    const headings = (markdown: string) =>
      all(read(markdown), 'heading').map((h) => [h.depth, textOf(h)]);
    const listed = write([
      para(inl('Text.')),
      refs(entry('a', 'Entry A.'), entry('b', 'Entry B.')),
    ]);
    expect(body(listed.markdown)).toBe(
      'Text.\n\n## References\n\n<a id="ref-ref-a"></a>\n\nEntry A.\n\n<a id="ref-ref-b"></a>\n\nEntry B.\n',
    );
    // Pandoc's own heading before the list is that heading, at the sections' level.
    const headed = write(
      [para(inl('Text.')), header(1, 'References'), refs(entry('a', 'Entry A.'))],
      {
        meta: { title: metaInlines('T') },
        format: 'typst',
      },
    );
    expect(headings(headed.markdown)).toEqual([
      [1, 'T'],
      [2, 'References'],
    ]);
    const paper = writePaper({ tree: typst.tree, format: 'typst', name: 'paper.typ' });
    expect(headings(paper.markdown).filter(([, words]) => words === 'References')).toEqual([
      [2, 'References'],
    ]);
    expect(headings(paper.markdown).filter(([depth]) => depth === 1)).toEqual([
      [1, 'A Short Paper on Sums'],
    ]);
    // An empty list: neither it nor the heading pandoc wrote for it.
    const empty = write([para(inl('Text.')), header(1, 'References'), refs()], { format: 'typst' });
    expect(body(empty.markdown)).toBe('Text.\n');
  });

  it('test_paper_own_bibliography: a numbered list, and each citation its entry’s number', () => {
    const { blocks, skipped } = ownList();
    const out = write(
      [
        para(
          inl('One'),
          sp,
          cite(['gauss']),
          str(','),
          sp,
          inl('two'),
          sp,
          cite(['gauss', 'euler']),
          str(','),
        ),
        para(
          inl('three'),
          sp,
          cite(['gauss'], { suffix: 'p. 3' }),
          str(','),
          sp,
          inl('four'),
          sp,
          cite(['gauss'], { prefix: 'see', suffix: 'ch. 2' }),
          str(','),
        ),
        para(inl('five'), sp, cite(['euler'], { mode: 'AuthorInText' }), str('.')),
        ...blocks,
      ],
      { skipped },
    );
    const markdown = body(out.markdown);
    expect(markdown).toContain(
      '## References\n\n1. <a id="ref-bib-gauss"></a>C. F. Gauss, Disquisitiones, 1801.\n' +
        '2. <a id="ref-bib-euler"></a>L. Euler, Introductio, 1748.\n',
    );
    const text = all(read(markdown), 'paragraph').map(textOf);
    expect(text.slice(0, 3)).toEqual([
      'One [1], two [1, 2],',
      'three [1, p. 3], four [see 1, ch. 2],',
      'five [2].',
    ]);
    expect(linksOf(markdown)).toEqual([
      ['1', '#ref-bib-gauss'],
      ['1', '#ref-bib-gauss'],
      ['2', '#ref-bib-euler'],
      ['1', '#ref-bib-gauss'],
      ['1', '#ref-bib-gauss'],
      ['2', '#ref-bib-euler'],
    ]);
    // The number that sets the list's width, and the words that stood for its pieces, are gone.
    expect(markdown).not.toMatch(/\b9\b/);
    expect(markdown).not.toMatch(/tok[BGEZ]/);
    expect(markdown).not.toContain(LATEX_MARK.slice(1));
    expect(out.leftOut).toEqual([]);
    // In the paper itself.
    const paper = writePaper({ tree: latex.tree, skipped: latex.skipped, name: 'paper.tex' });
    // (The paper ties the citation to the name with `~`, a space that does not break.)
    expect(paper.markdown).toMatch(/known to Gauss\u00a0\\\[\[1\]\(#ref-bib-gauss\)\]\./);
    expect(paper.markdown).toContain(
      '1. <a id="ref-bib-gauss"></a>C. F. Gauss, _Disquisitiones Arithmeticae_, 1801.',
    );
    expect(paper.markdown).not.toMatch(/^9 /m);
  });

  it('test_paper_citation_no_entry: the key in brackets, counted once', () => {
    const { blocks, skipped } = ownList();
    const partly = write([para(cite(['gauss', 'missing']), sp, cite(['missing'])), ...blocks], {
      skipped,
    });
    expect(all(read(body(partly.markdown)), 'paragraph').map(textOf)[0]).toBe(
      '[1, missing] [missing]',
    );
    expect(linksOf(partly.markdown)).toEqual([['1', '#ref-bib-gauss']]);
    expect(citations(partly)).toEqual([{ kind: 'citation', count: 1, detail: 'missing' }]);
    // No list at all.
    const none = write([para(cite(['a']), sp, cite(['b', 'a']))]);
    expect(body(none.markdown)).toBe('\\[a] \\[b, a]\n');
    expect(citations(none)).toEqual([
      { kind: 'citation', count: 1, detail: 'a' },
      { kind: 'citation', count: 1, detail: 'b' },
    ]);
    // A Typst `@name` that is no label, in a paper with no list Tome can read.
    const typstCite: Json = {
      t: 'Cite',
      c: [
        [
          {
            citationId: 'nowhere',
            citationPrefix: [],
            citationSuffix: [],
            citationMode: { t: 'NormalCitation' },
          },
        ],
        [str('[nowhere]')],
      ],
    };
    const lone = write([para(inl('See'), sp, typstCite, str('.'))], { format: 'typst' });
    expect(body(lone.markdown)).toBe('See \\[nowhere].\n');
    expect(citations(lone)).toEqual([{ kind: 'citation', count: 1, detail: 'nowhere' }]);
    // In the paper itself.
    const paper = writePaper({ tree: latex.tree, skipped: latex.skipped, name: 'paper.tex' });
    expect(paper.markdown).toContain(
      'the same book again \\[[1](#ref-bib-gauss), missing], and one page of it \\[[1](#ref-bib-gauss), p.',
    );
    expect(citations(paper)).toEqual([{ kind: 'citation', count: 1, detail: 'missing' }]);
  });
});

// Found by the first review of the tests (sprint-tests/critique-round-1.md).
describe('pandoc-to-markdown.mjs — what the first test review found', () => {
  const R = String.raw;
  const linksOf = (markdown: string) =>
    all(read(markdown), 'link').map((link) => [textOf(link), link.url]);
  /** A cell that spans `rows` rows and `cols` columns. */
  const spanning = (rows: number, cols: number, ...blocks: Json[]): unknown[] => [
    NO_ATTR,
    { t: 'AlignDefault' },
    rows,
    cols,
    blocks,
  ];
  const cellsOf = (markdown: string) =>
    (all(read(markdown), 'table')[0].children ?? []).map((r) => (r.children ?? []).map(textOf));

  it('test_paper_table_spans: a cell that spans keeps every other cell under its own heading', () => {
    const across = write([
      table(
        ['AlignLeft', 'AlignRight', 'AlignRight'],
        [row(cell(plain(inl('Method'))), cell(plain(inl('a'))), cell(plain(inl('b'))))],
        [
          row(spanning(1, 2, plain(inl('Total'))), cell(plain(inl('9')))),
          row(cell(plain(inl('Lasso'))), cell(plain(inl('1'))), cell(plain(inl('2')))),
        ],
      ),
    ]);
    expect(cellsOf(across.markdown)).toEqual([
      ['Method', 'a', 'b'],
      ['Total', '', '9'],
      ['Lasso', '1', '2'],
    ]);
    const down = write([
      table(
        ['AlignLeft', 'AlignRight', 'AlignRight'],
        [row(cell(plain(inl('Method'))), cell(plain(inl('a'))), cell(plain(inl('b'))))],
        [
          row(spanning(2, 1, plain(inl('Ridge'))), cell(plain(inl('5'))), cell(plain(inl('6')))),
          row(cell(plain(inl('50'))), cell(plain(inl('60')))),
          row(cell(plain(inl('Lasso'))), cell(plain(inl('1'))), cell(plain(inl('2')))),
        ],
      ),
    ]);
    expect(cellsOf(down.markdown)).toEqual([
      ['Method', 'a', 'b'],
      ['Ridge', '5', '6'],
      ['', '50', '60'],
      ['Lasso', '1', '2'],
    ]);
    // Both at once: a cell two wide and two deep.
    const both = write([
      table(
        ['AlignDefault', 'AlignDefault', 'AlignDefault'],
        [row(cell(plain(inl('x'))), cell(plain(inl('y'))), cell(plain(inl('z'))))],
        [row(spanning(2, 2, plain(inl('Big'))), cell(plain(inl('1')))), row(cell(plain(inl('2'))))],
      ),
    ]);
    expect(cellsOf(both.markdown)).toEqual([
      ['x', 'y', 'z'],
      ['Big', '', '1'],
      ['', '', '2'],
    ]);
    for (const out of [across, down, both]) expect(out.leftOut).toEqual([]);
  });

  it('test_paper_cell_double_bar: a norm in a table cell shows what the paper wrote', () => {
    const cases = [R`\|x\|_2`, R`|x|`, R`\left\| y \right\|`, R`a \\| b`];
    const out = write([
      table(
        ['AlignDefault'],
        [row(cell(plain(inl('Formula'))))],
        cases.map((tex) => row(cell(plain(math(tex))))),
      ),
    ]);
    const found = formulas(read(out.markdown));
    expect(found).toHaveLength(cases.length);
    found.forEach((formula, i) => {
      expect(String(formula.value), cases[i]).not.toContain('|');
      expect(formulaText(String(formula.value)), cases[i]).toBe(formulaText(cases[i]!));
    });
    expect(String(found[0].value)).toBe(R`\Vert x\Vert _2`);
    expect(out.leftOut).toEqual([]);
  });

  it('test_paper_other_properties: what pandoc reads into the paper’s properties is written', () => {
    const out = write([para(inl('Text.'))], {
      meta: {
        title: metaInlines('Main Title'),
        subtitle: metaInlines('The Subtitle Words'),
        author: { t: 'MetaList', c: [metaInlines('Jane Doe')] },
        dedication: { t: 'MetaBlocks', c: [para(inl('For my teachers.'))] },
        'link-citations': { t: 'MetaBool', c: true },
        bibliography: { t: 'MetaString', c: 'refs.bib' },
      },
    });
    expect(body(out.markdown)).toBe(
      '_Jane Doe_\n\nThe Subtitle Words\n\nFor my teachers.\n\nText.\n',
    );
    expect(out.leftOut).toEqual([]);
  });

  it('test_paper_own_link_to_label: a link the writer made to a label leads to its anchor', () => {
    const out = write([
      header(1, 'One', 'sec:x'),
      para(inl('See'), sp, linkTo('#sec:x', 'these words'), str('.')),
    ]);
    expect(body(out.markdown)).toBe(
      '<a id="ref-sec-x"></a>\n\n## One\n\nSee [these words](#ref-sec-x).\n',
    );
    // A link to a label that is nowhere is left as its words.
    const lost = write([para(linkTo('#nowhere', 'lost words'))]);
    expect(linksOf(lost.markdown)).toEqual([]);
    expect(body(lost.markdown)).toBe('lost words\n');
  });

  it('test_paper_empty_emphasis: emphasis with nothing in it writes nothing', () => {
    const out = write([
      para(str('a'), wrap('Emph', []), str('b'), sp, wrap('Strong', []), sp, wrap('Strikeout', [])),
    ]);
    expect(body(out.markdown)).toBe('ab\n');
    expect(out.markdown).not.toContain('&#x');
    expect(out.markdown).not.toContain('**');
  });

  it('test_paper_own_bibliography_heading_and_twice: the paper’s own heading, and a key given twice', () => {
    const out = write(
      [
        header(1, 'References'),
        para(
          str('tokB9'),
          sp,
          str('tokA1'),
          sp,
          inl('First entry.'),
          sp,
          str('tokA2'),
          sp,
          inl('Second entry, same key.'),
          sp,
          str('tokZ'),
        ),
      ],
      {
        skipped: [
          piece(R`\begin{thebibliography}`, 'tokB'),
          piece(R`\bibitem{a}`, 'tokA1'),
          piece(R`\bibitem{a}`, 'tokA2', { line: 8 }),
          piece(R`\end{thebibliography}`, 'tokZ'),
        ],
      },
    );
    const markdown = body(out.markdown);
    expect(all(read(markdown), 'heading').map(textOf)).toEqual(['References']);
    expect(markdown.split('id="ref-bib-a"').length - 1).toBe(1);
    expect(markdown).toContain(
      '1. <a id="ref-bib-a"></a>First entry.\n2. Second entry, same key.\n',
    );
  });

  it('test_paper_typst_colon_labels: a Typst label with a colon or a full stop is a reference', () => {
    const cite = (key: string): Json => ({
      t: 'Cite',
      c: [
        [
          {
            citationId: key,
            citationPrefix: [],
            citationSuffix: [],
            citationMode: { t: 'NormalCitation' },
          },
        ],
        [str(`[${key}]`)],
      ],
    });
    const label = (id: string): Json => ({ t: 'Span', c: [[id, [], []], []] });
    const out = writePaper({
      tree: doc([
        header(1, 'Intro'),
        para(label('sec:intro')),
        para(math('a = b', true), sp, label('eq.one')),
        para(
          inl('See'),
          sp,
          cite('sec'),
          str(':intro'),
          sp,
          inl('and'),
          sp,
          cite('eq'),
          str('.one.'),
          sp,
          inl('Not'),
          sp,
          cite('fig'),
          str(':gone'),
        ),
      ]),
      format: 'typst',
    });
    const markdown = body(out.markdown);
    expect(linksOf(markdown)).toEqual([
      ['Intro', '#ref-sec-intro'],
      ['the equation', '#ref-eq-one'],
    ]);
    // A full stop that ends the sentence is the sentence's.
    expect(markdown).toContain('[the equation](#ref-eq-one).');
    // A label that is nowhere is still a citation with no entry.
    expect(markdown).toContain('Not \\[fig]:gone');
    expect(out.leftOut).toEqual([{ kind: 'citation', count: 1, detail: 'fig' }]);
  });
});

// Found by the second review of the tests (sprint-tests/critique-round-2.md).
describe('pandoc-to-markdown.mjs — what the second test review found', () => {
  const R = String.raw;
  const linksOf = (markdown: string) =>
    all(read(markdown), 'link').map((link) => [textOf(link), link.url]);
  const ref = (label: string, words: string): Json => ({
    t: 'Link',
    c: [
      [
        '',
        [],
        [
          ['reference-type', 'ref'],
          ['reference', label],
        ],
      ],
      [str(words)],
      [`#${label}`, ''],
    ],
  });
  const ownList = (): { blocks: Json[]; skipped: Json[] } => ({
    blocks: [para(str('tokB9'), sp, str('tokA'), sp, inl('The one entry.'), sp, str('tokZ'))],
    skipped: [
      piece(R`\begin{thebibliography}`, 'tokB'),
      piece(R`\bibitem{a}`, 'tokA'),
      piece(R`\end{thebibliography}`, 'tokZ'),
    ],
  });

  it('test_paper_own_bibliography_heading_kept: the list keeps the heading’s anchor, and only a list’s heading', () => {
    const { blocks, skipped } = ownList();
    const named = write(
      [
        para(inl('See Section'), sp, ref('sec:refs', '2'), str('.')),
        header(1, 'References', 'sec:refs'),
        ...blocks,
      ],
      { skipped },
    );
    const markdown = body(named.markdown);
    expect(linksOf(markdown)).toEqual([['2', '#ref-sec-refs']]);
    expect(markdown).toContain(
      '<a id="ref-sec-refs"></a>\n\n## References\n\n1. <a id="ref-bib-a"></a>The one entry.',
    );
    expect(markdown.split('## References').length - 1).toBe(1);
    // A heading that names no list stays the paper's, and the list has its own.
    const conclusion = write([header(1, 'Conclusion'), ...blocks], { skipped });
    expect(all(read(conclusion.markdown), 'heading').map(textOf)).toEqual([
      'paper',
      'Conclusion',
      'References',
    ]);
    // The same for the list `citeproc` makes.
    const entry: Json = { t: 'Div', c: [['ref-a', ['csl-entry'], []], [para(inl('Entry A.'))]] };
    const worked = write([
      para(ref('sec:bib', '3')),
      header(1, 'Bibliography', 'sec:bib'),
      { t: 'Div', c: [['refs', ['references'], []], [entry]] },
    ]);
    expect(linksOf(worked.markdown)).toEqual([['3', '#ref-sec-bib']]);
    expect(body(worked.markdown)).toContain(
      '<a id="ref-sec-bib"></a>\n\n## Bibliography\n\n<a id="ref-ref-a"></a>',
    );
  });

  it('test_paper_own_link_nowhere: a link of the writer’s own to no label is its words, counted', () => {
    const out = write([para(inl('See'), sp, linkTo('#sec:none', 'nowhere'), str('.'))]);
    expect(linksOf(out.markdown)).toEqual([]);
    expect(body(out.markdown)).toBe('See nowhere.\n');
    expect(out.leftOut).toEqual([{ kind: 'reference', count: 1, detail: 'sec:none' }]);
  });

  it('test_paper_typst_label_after_shorter: `@sec:a.b` leads to its own label, though `<sec>` exists', () => {
    const label = (id: string): Json => ({ t: 'Span', c: [[id, [], []], []] });
    const typstRef = (id: string): Json => ({
      t: 'Link',
      c: [['', ['ref'], []], [str(`[${id}]`)], [`#${id}`, '']],
    });
    const out = writePaper({
      tree: doc([
        header(1, 'Intro'),
        para(label('sec')),
        header(1, 'Two'),
        para(label('sec:a.b')),
        para(
          inl('Then'),
          sp,
          typstRef('sec'),
          str(':a.b.'),
          sp,
          inl('and'),
          sp,
          typstRef('sec'),
          str('.'),
        ),
      ]),
      format: 'typst',
    });
    expect(linksOf(out.markdown)).toEqual([
      ['Two', '#ref-sec-a-b'],
      ['Intro', '#ref-sec'],
    ]);
    expect(body(out.markdown)).toContain('Then [Two](#ref-sec-a-b). and [Intro](#ref-sec).');
    expect(out.leftOut).toEqual([]);
  });
});
