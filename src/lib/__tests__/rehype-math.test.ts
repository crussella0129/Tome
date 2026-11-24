import { describe, it, expect, vi, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeRaw from 'rehype-raw';
import { rehypeHeadingIds } from '@astrojs/markdown-remark';
import { toString } from 'hast-util-to-string';
import { visit } from 'unist-util-visit';
import { VFile } from 'vfile';
import remarkMathDollars from '../../../scripts/remark-math-dollars.mjs';
import rehypeMath, {
  asTyped,
  formulaText,
  numberedLabels,
  readable,
  titleText,
} from '../../../scripts/rehype-math.mjs';

// Laying a formula out when the library is built (INT-0030, T-078). Every test
// composes remark-parse, remark-gfm, the Markdown plugin, remark-rehype and the
// layout plugin; "as Astro" adds Astro's own heading collector and rehype-raw
// after it, in Astro's order.

const R = String.raw;
const lines = (...parts: string[]) => parts.join('\n');

type Hast = {
  type: string;
  tagName?: string;
  value?: string;
  properties?: Record<string, unknown>;
  children?: Hast[];
};

function render(source: string, { asAstro = false, path = 'chapters/proof.md' } = {}) {
  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkMathDollars)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeMath);
  if (asAstro) processor.use(rehypeHeadingIds).use(rehypeRaw);
  const file = new VFile({ value: source, path });
  const tree = processor.runSync(processor.parse(file), file) as unknown as Hast;
  return { tree, messages: file.messages.map((message) => message.reason) };
}

const classesOf = (node: Hast): string[] =>
  Array.isArray(node.properties?.className) ? (node.properties!.className as string[]) : [];
const is = (node: Hast, tagName: string, className?: string) =>
  node.type === 'element' &&
  node.tagName === tagName &&
  (className === undefined || classesOf(node).includes(className));

function all(tree: Hast, tagName: string, className?: string): Hast[] {
  const found: Hast[] = [];
  visit(tree as never, 'element', (node: Hast) => {
    if (is(node, tagName, className)) found.push(node);
  });
  return found;
}
const elements = (node: Hast) => (node.children ?? []).filter((child) => child.type === 'element');
const text = (node: Hast) => toString(node as never);
/** Every equation number or tag on the page, in order. */
const numbers = (tree: Hast) =>
  all(tree, 'mtd', 'tml-right')
    .map((cell) => text(cell).trim())
    .filter((value) => /^\([^()]+\)$/.test(value));

const fixture = (name: string) =>
  readFileSync(join(process.cwd(), 'fixtures', 'proofs', name), 'utf8');
const PAGES = ['1-proof.md', '2-more.md'].map(fixture);

afterEach(() => {
  vi.restoreAllMocks();
});

describe('formulas laid out', () => {
  // T-078 clause 1
  it('test_math_inline: a formula within a line becomes a math element', () => {
    const { tree } = render('Inline $x^2$ here.');
    const math = all(tree, 'math');
    expect(math).toHaveLength(1);
    expect(math[0].properties?.display).toBeUndefined();
    expect(all(tree, 'code', 'language-math')).toHaveLength(0);
    expect(text(all(tree, 'p')[0])).toBe('Inline x2 here.');
  });

  // T-078 clause 2
  it('test_math_set_apart_wrapper: a set-apart formula stands in its own wrapper', () => {
    for (const source of [lines('$$', 'z', '$$'), '$$z$$', lines('```math', 'z', '```')]) {
      const { tree } = render(source);
      const wrappers = all(tree, 'div', 'tome-math');
      expect(wrappers, source).toHaveLength(1);
      const held = elements(wrappers[0]);
      expect(held).toHaveLength(1);
      expect(held[0].tagName).toBe('math');
      expect(held[0].properties?.display).toBe('block');
      expect(all(tree, 'pre')).toHaveLength(0);
      expect(text(wrappers[0])).toBe('z');
    }
  });

  // T-078 clause 2, as Astro
  it('test_math_set_apart_through_raw: no paragraph holds a set-apart formula', () => {
    for (const source of [
      lines('Text above', '$$ x = y $$', 'and below.'),
      lines('- item', '', '  $$a$$'),
      lines('> quote', '>', '> $$b$$'),
      lines('## A heading', '', 'Text.', '', '$$', 'c', '$$', '', 'After.'),
    ]) {
      const { tree } = render(source, { asAstro: true });
      expect(all(tree, 'div', 'tome-math'), source).toHaveLength(1);
      for (const paragraph of all(tree, 'p')) {
        expect(all(paragraph, 'div'), source).toHaveLength(0);
        expect(text(paragraph).trim(), source).not.toBe('');
      }
    }
  });

  // T-078 clause 3
  it('test_math_nothing_unsafe: a laid-out formula holds nothing that reaches outside it', () => {
    for (const page of PAGES) {
      const { tree } = render(page);
      const formulas = all(tree, 'math');
      expect(formulas.length).toBeGreaterThan(5);
      for (const math of formulas) {
        visit(math as never, 'element', (node: Hast) => {
          expect(['semantics', 'annotation', 'annotation-xml', 'script', 'a']).not.toContain(
            node.tagName,
          );
          for (const name of Object.keys(node.properties ?? {})) {
            expect(name.toLowerCase()).not.toMatch(/^on/);
            expect(['id', 'href', 'src']).not.toContain(name);
          }
        });
      }
    }
  });

  // T-078 clause 4
  it('test_math_table_width: a numbered table takes its width in container units', () => {
    for (const tex of [
      R`\begin{equation} E = mc^2 \end{equation}`,
      R`\begin{align} a &= b \\ c &= d \end{align}`,
      R`\begin{gather} a = b \\ c = d \end{gather}`,
      R`x = y \tag{7}`,
    ]) {
      const { tree } = render(lines('$$', tex, '$$'));
      const tables = all(tree, 'mtable');
      expect(String(tables[0].properties?.style), tex).toContain('width:100cqi');
      for (const table of tables)
        expect(String(table.properties?.style ?? '')).not.toMatch(/width:\s*100%/);
    }
  });

  // T-078 clause 5
  it('test_math_numbers: numbers count down the page and start again on the next', () => {
    const page = lines(
      '$$',
      R`\begin{align} a &= b \\ c &= d \end{align}`,
      '$$',
      '',
      '$$',
      R`\begin{equation} E = mc^2 \end{equation}`,
      '$$',
      '',
      '$$',
      R`\begin{align*} a &= b \end{align*}`,
      '$$',
      '',
      '$$',
      R`\begin{align} a &= b \nonumber \\ c &= d \notag \\ e &= f \end{align}`,
      '$$',
      '',
      '$$',
      R`x = y \tag{7}`,
      '$$',
      '',
      '$$',
      R`\begin{gather} a = b \\ c = d \end{gather}`,
      '$$',
    );
    const { tree } = render(page);
    expect(numbers(tree)).toEqual(['(1)', '(2)', '(3)', '(4)', '(7)', '(5)', '(6)']);
    expect(all(tree, 'span', 'tml-eqn')).toHaveLength(0);
    let placeholders = 0;
    visit(tree as never, 'element', (node: Hast) => {
      if (classesOf(node).includes('tml-eqn')) placeholders += 1;
    });
    expect(placeholders).toBe(0);
    // The starred environment holds no number.
    expect(numbers(all(tree, 'div', 'tome-math')[2])).toEqual([]);

    // A second file through the same processor starts at one.
    const second = render(lines('$$', R`\begin{equation} a = b \end{equation}`, '$$'));
    expect(numbers(second.tree)).toEqual(['(1)']);
  });

  // T-078 clause 6
  it('test_math_constructs: each construct is laid out with the element it needs', () => {
    const apart = (tex: string) => all(render(lines('$$', tex, '$$')).tree, 'math')[0];
    const has = (math: Hast, tagName: string) => all(math, tagName).length > 0;

    expect(has(apart(R`\frac{a}{b}`), 'mfrac')).toBe(true);
    expect(has(apart(R`\sqrt[3]{x+1}`), 'mroot')).toBe(true);

    const sum = apart(R`\sum_{i=1}^{n} i^2`);
    const limits = [...all(sum, 'munderover'), ...all(sum, 'msubsup')];
    expect(limits).toHaveLength(1);
    expect(text(limits[0])).toContain('∑');

    const matrix = apart(R`\begin{pmatrix} a & b \\ c & d \end{pmatrix}`);
    expect(all(matrix, 'mtable')).toHaveLength(1);
    expect(all(matrix, 'mtd')).toHaveLength(4);
    const brackets = all(matrix, 'mo').filter((mo) => ['(', ')'].includes(text(mo)));
    expect(brackets).toHaveLength(2);
    for (const bracket of brackets) expect(bracket.properties?.stretchy).not.toBe('false');

    const cases = apart(R`f(x) = \begin{cases} 1 & x > 0 \\ 0 & \text{otherwise} \end{cases}`);
    expect(all(cases, 'mtable')).toHaveLength(1);
    expect(all(cases, 'mo').some((mo) => text(mo) === '{')).toBe(true);

    const aligned = apart(R`\begin{align} (a+b)^2 &= (a+b)(a+b) \\ &= a^2 + 2ab + b^2 \end{align}`);
    const rows = all(aligned, 'mtr');
    expect(rows).toHaveLength(2);
    expect(elements(rows[0]).length).toBe(elements(rows[1]).length);

    const numbered = apart(R`\begin{equation} E = mc^2 \end{equation}`);
    expect(all(numbered, 'mtable')).toHaveLength(1);
    expect(numbers(numbered)).toEqual(['(1)']);
  });

  // T-078 clause 7
  it('test_math_long_inline: a long formula within a line gets a box of its own', () => {
    const terms = Array.from({ length: 18 }, (_, index) => `a_{${index + 1}}`).join(' + ');
    const long = render(`A long one $${terms} = S$ here.`).tree;
    const boxes = all(long, 'span', 'tome-math-long');
    expect(boxes).toHaveLength(1);
    expect(elements(boxes[0]).map((node) => node.tagName)).toEqual(['math']);

    const short = render('A short one $x^2$ here.').tree;
    expect(all(short, 'span', 'tome-math-long')).toHaveLength(0);
    expect(all(short, 'math')).toHaveLength(1);
  });
});

describe('formulas that cannot be laid out', () => {
  // T-078 clause 8
  it('test_math_unreadable: shown as typed, named, and the build goes on', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const source = lines(
      R`A mistake: $\frac{a}{$ and after it.`,
      '',
      '$$',
      R`\frac{a}{`,
      R`  + \unknowncommand`,
      '$$',
      '',
      'The paragraph after it.',
    );
    const { tree, messages } = render(source, { path: 'chapters/1-proof.md' });
    const errors = all(tree, 'code', 'tome-math-error');
    expect(errors.map(text)).toEqual([
      R`$\frac{a}{$`,
      `$$${lines(R`\frac{a}{`, R`  + \unknowncommand`)}$$`,
    ]);
    expect(all(tree, 'math')).toHaveLength(0);
    expect(messages).toHaveLength(2);
    expect(messages[0]).toContain(R`\frac{a}{`);
    expect(messages[1]).toContain(R`\frac{a}{ + \unknowncommand`);
    for (const message of messages) expect(message).not.toMatch(/\n/);
    expect(warn).toHaveBeenCalledTimes(2);
    for (const [line] of warn.mock.calls) {
      expect(line).toContain('chapters/1-proof.md');
      expect(line).toContain(R`\frac{a}{`);
    }
    expect(all(tree, 'p').map(text)).toContain('The paragraph after it.');
  });

  // T-078 clause 8
  it('test_math_unclosed_fence: what a fence never closed took is shown as typed', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { tree, messages } = render(lines('$$', 'x = y$$', '', 'After.'));
    const errors = all(tree, 'code', 'tome-math-error');
    expect(errors).toHaveLength(1);
    expect(text(errors[0])).toBe(`$$${lines('x = y$$', '', 'After.')}$$`);
    expect(all(tree, 'math')).toHaveLength(0);
    expect(messages).toHaveLength(1);
    expect(messages[0]).toContain('never closed');
    expect(warn).toHaveBeenCalledTimes(1);
  });

  // T-078 clause 9
  it('test_math_refused_commands: no link, image or attribute comes from a formula', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    for (const tex of [
      R`\href{https://example.com}{x}`,
      R`\url{https://example.com}`,
      R`\includegraphics{a.png}`,
      R`\class{c}{x}`,
      R`\data{a=b}{x}`,
      R`x \ref{a}`,
      R`\eqref{a}`,
    ]) {
      // An address holds `://`, which single dollar signs refuse (T-077), so
      // those two are written with `$$`, as the tutorial tells an author to.
      const dollars = tex.includes('://') ? '$$' : '$';
      const { tree } = render(`Here ${dollars}${tex}${dollars} it is.`);
      expect(all(tree, 'code', 'tome-math-error').map(text), tex).toEqual([`$${tex}$`]);
      expect(all(tree, 'a')).toHaveLength(0);
      expect(all(tree, 'img')).toHaveLength(0);
      visit(tree as never, 'element', (node: Hast) => {
        for (const name of Object.keys(node.properties ?? {})) {
          expect(['href', 'src']).not.toContain(name);
          expect(name).not.toMatch(/^data/i);
        }
      });
    }

    const labelled = render(
      lines('$$', R`\begin{equation} a = b \label{eq:one} \end{equation}`, '$$'),
    ).tree;
    expect(all(labelled, 'math')).toHaveLength(1);
    expect(numbers(labelled)).toEqual(['(1)']);
    visit(labelled as never, 'element', (node: Hast) => {
      expect(Object.keys(node.properties ?? {})).not.toContain('id');
    });
  });

  // T-078 clause 10
  it('test_math_formulas_stand_alone: a command defined in one formula is unknown in the next', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { tree } = render(R`$\def\foo{y} \foo$ then $\foo$`);
    expect(all(tree, 'math')).toHaveLength(1);
    expect(all(tree, 'code', 'tome-math-error').map(text)).toEqual([R`$\foo$`]);
  });
});

describe('what is not a formula', () => {
  const plain = (source: string) =>
    unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkMathDollars)
      .use(remarkRehype, { allowDangerousHtml: true });

  // T-078 clause 11
  it('test_math_code_untouched: code of any other kind is unchanged', () => {
    const source = lines(
      'Inline `code` and `$x$`.',
      '',
      '```js',
      'const a = "$a$";',
      '```',
      '',
      '```',
      'no language',
      '```',
      '',
      '<code class="language-js">raw</code>',
    );
    const without = plain(source);
    const expected = without.runSync(without.parse(source), { value: source });
    expect(render(source).tree).toEqual(expected);
  });

  // T-078 clause 11
  it('test_math_no_formula_no_change: a chapter with no formula is unchanged', () => {
    const source = lines(
      '# A chapter',
      '',
      'Prose with *emphasis*.',
      '',
      '| a | b |',
      '|---|---|',
      '| 1 | 2 |',
    );
    const without = plain(source);
    const expected = without.runSync(without.parse(source), { value: source });
    expect(render(source).tree).toEqual(expected);
  });
});

describe('the functions other steps build on', () => {
  /** Every formula of the fixture pages, with whether it is set apart. */
  function fixtureFormulas() {
    const found: { tex: string; display: boolean }[] = [];
    for (const page of PAGES) {
      const processor = unified().use(remarkParse).use(remarkGfm).use(remarkMathDollars);
      const tree = processor.runSync(processor.parse(page), { value: page });
      visit(tree as never, (node: { type: string; value?: string; lang?: string }) => {
        if (node.type === 'inlineMath') found.push({ tex: node.value!, display: false });
        if (node.type === 'math') found.push({ tex: node.value!, display: true });
        if (node.type === 'code' && node.lang === 'math')
          found.push({ tex: node.value!, display: true });
      });
    }
    return found;
  }

  // T-078 clause 12
  it('test_math_exports: readable, formulaText and asTyped agree with the plugin', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const formulas = [
      ...fixtureFormulas(),
      { tex: R`\frac{a}{`, display: false },
      { tex: R`\ref{a}`, display: false },
      { tex: R`\foo`, display: false },
      { tex: R`\begin{equation} E = mc^2 \end{equation}`, display: false },
    ];
    expect(formulas.length).toBeGreaterThan(25);
    let unreadable = 0;
    for (const { tex, display } of formulas) {
      const source = display ? lines('$$', tex, '$$') : `Here $${tex}$ it is.`;
      const { tree } = render(source);
      const math = all(tree, 'math');
      const errors = all(tree, 'code', 'tome-math-error');
      expect(math.length + errors.length, tex).toBe(1);
      expect(readable(tex, display), tex).toBe(math.length === 1);
      if (math.length === 1) {
        // The element's text, less any cell that holds a number or a tag.
        const cells = all(math[0], 'mtd', 'tml-right').filter((cell) =>
          /^\([^()]+\)$/.test(text(cell).trim()),
        );
        let expected = text(math[0]);
        for (const cell of cells) expected = expected.replace(text(cell), '');
        expect(formulaText(tex, display), tex).toBe(expected);
      } else {
        unreadable += 1;
        expect(formulaText(tex, display), tex).toBeNull();
        expect(asTyped(tex, display), tex).toBe(text(errors[0]));
      }
    }
    expect(unreadable).toBe(5); // the fixture's one mistake and the four added here

    expect(formulaText('E = mc^2')).toBe('E=mc2');
    expect(formulaText(R`\frac{a}{b}`)).toBe('ab');
    expect(formulaText(R`\begin{equation} E = mc^2 \end{equation}`)).toBeNull();
    expect(formulaText(R`\begin{equation} E = mc^2 \end{equation}`, true)).toBe('E=mc2');
    expect(formulaText(R`x = y \tag{7}`, true)).toBe('x=y');
    expect(asTyped('x', false)).toBe('$x$');
    expect(asTyped('x', true)).toBe('$$x$$');
  });

  // T-078 clause 12
  it('test_math_title_text: a formula on one line keeps what its layout says', () => {
    const cases: [string, string | null][] = [
      [R`\sqrt{2}`, '√2'],
      [R`\sqrt[3]{x+1}`, '³√(x+1)'],
      [R`\frac{1}{2}`, '1/2'],
      [R`\frac{a+b}{c}`, '(a+b)/c'],
      [R`x^2 \ge 0`, 'x² ≥ 0'],
      ['E = mc^2', 'E = mc²'],
      ['a_i', 'aᵢ'],
      ['x^{n+1}', 'xⁿ⁺¹'],
      [R`e^{i\pi}`, 'e^(iπ)'],
      [R`\sqrt{2x}`, '√(2x)'],
      [R`\sqrt{2}x`, '√2x'],
      [R`\frac{1}{2x}`, '1/(2x)'],
      [R`\frac{1}{2}x`, '1/2x'],
      ['{a+b}^2', '(a+b)²'],
      ['(a+b)^2', '(a+b)²'],
      [R`\sqrt{10}`, '√10'],
      ['x^{ab}', 'x^(ab)'],
      [R`\sqrt{2}3`, '√2·3'],
      [R`\sqrt{23}`, '√23'],
      [R`\frac{1}{2}3`, '1/2·3'],
      [R`\frac{1}{23}`, '1/23'],
      [R`\alpha \le \beta`, 'α ≤ β'],
      [R`\begin{pmatrix} a & b \\ c & d \end{pmatrix}`, null],
      [R`\hat{x}`, null],
      [R`\sum\limits_{i=1}^{n} i`, null],
      [R`\frac{a}{`, null],
      [R`\ref{a}`, null],
    ];
    for (const [tex, expected] of cases) expect(titleText(tex), tex).toBe(expected);
  });
});

// Found by the Test phase's review: inputs the cases above did not try.
describe('laid out: what the first cases did not try', () => {
  // T-078 clause 7 — the threshold itself: sixteen characters, and one more.
  it('test_math_long_threshold: a box of its own begins past sixteen characters', () => {
    const letters = 'abcdefghijklmnopq';
    const sixteen = render(`A formula $${letters.slice(0, 16)}$ here.`).tree;
    expect(text(all(sixteen, 'math')[0]!)).toHaveLength(16);
    expect(all(sixteen, 'span', 'tome-math-long')).toHaveLength(0);
    const seventeen = render(`A formula $${letters}$ here.`).tree;
    expect(text(all(seventeen, 'math')[0]!)).toHaveLength(17);
    expect(all(seventeen, 'span', 'tome-math-long')).toHaveLength(1);
    // The formula of twenty-eight that ran past its column in WebKit.
    const seen = render(
      'Short $d_1 + d_2 + d_3 + d_4 + d_5 + d_6 + d_7 + d_8 + d_9 = V$ here.',
    ).tree;
    expect(text(all(seen, 'math')[0]!)).toHaveLength(28);
    expect(all(seen, 'span', 'tome-math-long')).toHaveLength(1);
  });

  // T-078 clause 8 — nothing between the dollar signs is nothing to lay out.
  it('test_math_empty: an empty formula is shown as typed and named', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { tree, messages } = render(lines('Before.', '', '$$', '$$', '', 'After.'));
    expect(all(tree, 'math')).toHaveLength(0);
    expect(all(tree, 'code', 'tome-math-error').map(text)).toEqual(['$$$$']);
    expect(messages).toHaveLength(1);
    expect(warn).toHaveBeenCalledTimes(1);
    // Within a line too: spaces between two pairs of dollar signs.
    const inline = render('An $$ $$ here.');
    expect(all(inline.tree, 'math')).toHaveLength(0);
    expect(all(inline.tree, 'code', 'tome-math-error').map(text)).toEqual(['$ $']);
    expect(inline.messages).toHaveLength(1);
    expect(warn).toHaveBeenCalledTimes(2);
    // A formula that is all comment shows nothing, so it is one too; a
    // percent sign written `\%` is not a comment.
    const comment = render('A $%x$ here.');
    expect(all(comment.tree, 'math')).toHaveLength(0);
    expect(all(comment.tree, 'code', 'tome-math-error').map(text)).toEqual(['$%x$']);
    expect(warn).toHaveBeenCalledTimes(3);
    expect(readable('%x')).toBe(false);
    expect(readable(R`5\%`)).toBe(true);
    expect(readable(R`a \\% b`)).toBe(true);
    warn.mockRestore();
    expect(readable('')).toBe(false);
    expect(readable('   ', true)).toBe(false);
    expect(formulaText('')).toBeNull();
    expect(titleText(' ')).toBeNull();
  });

  // T-078 clause 2 — with Windows line ends, as Astro runs it.
  it('test_math_crlf: a numbered derivation in a file with Windows line ends is laid out and numbered', () => {
    const CRLF = String.fromCharCode(13, 10);
    const source = [
      R`$$\begin{align}`,
      'a &= b',
      R`\end{align}$$`,
      'a line of text directly under it',
    ].join(CRLF);
    const { tree } = render(source, { asAstro: true });
    expect(all(tree, 'code', 'tome-math-error')).toHaveLength(0);
    expect(all(tree, 'div', 'tome-math')).toHaveLength(1);
    expect(numbers(tree)).toEqual(['(1)']);
    expect(all(tree, 'p').map(text)).toEqual(['a line of text directly under it']);
  });

  // T-078 clause 12 — a title must not read as another formula would.
  it('test_math_title_text_neighbours: a number before a fraction, two fractions, a stack with no bar', () => {
    const cases: [string, string | null][] = [
      [R`3\frac{1}{2}`, '3 1/2'], // three and a half, not thirty-one halves
      [R`\frac{31}{2}`, '31/2'],
      [R`12\frac{3}{4}`, '12 3/4'],
      [R`x\frac{1}{2}`, 'x 1/2'],
      [R`\frac{a}{b}\frac{c}{d}`, 'a/b c/d'], // two fractions, not `a/bc/d`
      [R`2\sqrt{3}`, '2√3'],
      // Twice a cube root is not two cubed times a root (the second review).
      [R`2\sqrt[3]{x}`, '2 ³√x'],
      [R`2^3\sqrt{x}`, '2³√x'],
      [R`x\sqrt[n]{y}`, 'x ⁿ√y'],
      [R`x^n\sqrt{y}`, 'xⁿ√y'],
      [R`x^2\sqrt[3]{y}`, 'x² ³√y'],
      [R`\sqrt[3]{x}`, '³√x'],
      // And after a bracket, a bar or `!` (the third review).
      [R`(a+b)\sqrt[3]{x}`, '(a+b) ³√x'],
      [R`(a+b)^3\sqrt{x}`, '(a+b)³√x'],
      [R`|x|\sqrt[3]{y}`, '|x| ³√y'],
      [R`|x|^3\sqrt{y}`, '|x|³√y'],
      [R`n!\sqrt[3]{y}`, 'n! ³√y'],
      // After a sign that joins two things there is nothing to be a power of.
      [R`2+\sqrt[3]{x}`, '2+³√x'],
      [R`a = \sqrt[3]{x}`, 'a = ³√x'],
      [R`(\sqrt[3]{x})`, '(³√x)'],
      // A stack with no bar is not a division: no honest one-line form.
      [R`\binom{n}{k}`, null],
      [R`n \choose k`, null],
      [R`\genfrac{}{}{0pt}{}{n}{k}`, null],
      [R`a \atop b`, null],
      // As TeX itself sets `2 3^2`: the same marks as `23^2`.
      ['2 3^2', '23²'],
      ['23^2', '23²'],
    ];
    for (const [tex, expected] of cases) expect(titleText(tex), tex).toBe(expected);
  });
});

// --- A link to a numbered equation (INT-0033, T-090) ------------------------
describe('a link to a numbered equation shows its number', () => {
  const GAUSS = lines('$$', R`\begin{equation}\label{eq:gauss} a = b \end{equation}`, '$$');
  /** Every `id` on the page, in order. */
  const ids = (tree: Hast): string[] => {
    const found: string[] = [];
    visit(tree as never, 'element', (node: Hast) => {
      if (typeof node.properties?.id === 'string') found.push(node.properties.id);
    });
    return found;
  };
  const links = (tree: Hast) =>
    all(tree, 'a').map((link) => ({ href: String(link.properties?.href), words: text(link) }));
  /** The row a link's address reaches, by its `id`. */
  const reached = (tree: Hast, href: string): Hast | undefined => {
    let found: Hast | undefined;
    visit(tree as never, 'element', (node: Hast) => {
      if (`#${node.properties?.id}` === href) found = node;
    });
    return found;
  };

  it('test_math_label_link: the row takes an id of Tome’s own, and the link reaches it', () => {
    const { tree } = render(lines(GAUSS, '', 'See [eq:gauss](#eq:gauss).'));
    expect(links(tree)).toEqual([{ href: '#eq.eq:gauss', words: '(1)' }]);
    expect(ids(tree)).toEqual(['eq.eq:gauss']);
    const row = reached(tree, '#eq.eq:gauss')!;
    expect(row.tagName).toBe('mtr');
    expect(all(tree, 'div', 'tome-math')).toHaveLength(1);
    expect(text(row)).toContain('(1)');

    // Two labels that differ only in what an id cannot hold: an id each.
    const two = render(
      lines(
        '$$',
        R`\begin{equation}\label{eq:a b} a = b \end{equation}`,
        '$$',
        '',
        '$$',
        R`\begin{equation}\label{eq:a.b} c = d \end{equation}`,
        '$$',
        '',
        'See [](#eq:a%20b) and [](#eq:a.b).',
      ),
    ).tree;
    expect(links(two)).toEqual([
      { href: '#eq.eq:a-b', words: '(1)' },
      { href: '#eq.eq:a-b-2', words: '(2)' },
    ]);
    expect(ids(two)).toEqual(['eq.eq:a-b', 'eq.eq:a-b-2']);
    expect(text(reached(two, '#eq.eq:a-b-2')!)).toContain('(2)');
  });

  it('test_math_label_link_words: the number in brackets, once; words of the writer’s own are left', () => {
    const page = (words: string) => render(lines(GAUSS, '', words)).tree;
    expect(links(page('See [eq:gauss](#eq:gauss).'))[0].words).toBe('(1)');
    expect(links(page('See [](#eq:gauss).'))[0].words).toBe('(1)');
    expect(links(page('see ([eq:gauss](#eq:gauss)) here'))[0].words).toBe('1');
    expect(links(page('see [eq:gauss](#eq:gauss)) here'))[0].words).toBe('(1)');
    const tagged = render(
      lines(
        '$$',
        R`\begin{equation} a = b \tag{A}\label{eq:t} \end{equation}`,
        '$$',
        '',
        'See [eq:t](#eq:t).',
      ),
    ).tree;
    expect(links(tagged)).toEqual([{ href: '#eq.eq:t', words: '(A)' }]);

    // A link with words of its own is not this step's: address and all are left.
    const own = page('See [words of mine](#eq:gauss).');
    expect(links(own)).toEqual([{ href: '#eq:gauss', words: 'words of mine' }]);
    expect(ids(own)).toEqual([]);
    // So a link a chapter already has to a heading is never taken over.
    const heading = render(
      lines(
        '# Pythagoras',
        '',
        '$$',
        R`\begin{equation}\label{pythagoras} a^2 + b^2 = c^2 \end{equation}`,
        '$$',
        '',
        'See [the theorem](#pythagoras).',
      ),
      { asAstro: true },
    ).tree;
    expect(links(heading)).toEqual([{ href: '#pythagoras', words: 'the theorem' }]);
    expect(ids(heading)).toEqual(['pythagoras']);
    // A link whose words are the label itself, or none, is taken for the
    // equation, though a heading holds the same address: that is the form the
    // guide teaches for an equation, and it says so (Write Mathematics).
    const same = render(
      lines(
        '# intro',
        '',
        '$$',
        R`\begin{equation}\label{intro} a = b \end{equation}`,
        '$$',
        '',
        'See [intro](#intro).',
      ),
      { asAstro: true },
    ).tree;
    expect(links(same)).toEqual([{ href: '#eq.intro', words: '(1)' }]);
    expect(ids(same).sort()).toEqual(['eq.intro', 'intro']);
  });

  it('test_math_label_rows: each label is matched to its own row', () => {
    const align = lines(
      '$$',
      R`\begin{equation} z = 0 \end{equation}`,
      '$$',
      '',
      '$$',
      R`\begin{align}`,
      R`  a &= b \label{eq:a} \\`,
      R`  c &= d \nonumber \\`,
      R`  e &= f \label{eq:c} % \label{eq:not}`,
      R`\end{align}`,
      '$$',
      '',
      'See [eq:a](#eq:a), [eq:c](#eq:c) and [eq:not](#eq:not).',
    );
    const { tree } = render(align);
    expect(numbers(tree)).toEqual(['(1)', '(2)', '(3)']);
    expect(links(tree)).toEqual([
      { href: '#eq.eq:a', words: '(2)' },
      { href: '#eq.eq:c', words: '(3)' },
      { href: '#eq:not', words: 'eq:not' },
    ]);
    expect(text(reached(tree, '#eq.eq:a')!)).toContain('(2)');
    expect(text(reached(tree, '#eq.eq:c')!)).toContain('(3)');
    expect(reached(tree, '#eq.eq:a')).not.toBe(reached(tree, '#eq.eq:c'));

    // What `subequations` gives: a label before the environment meets no row,
    // and the labels beside it are served all the same.
    const sub = render(
      lines(
        '$$',
        R`\label{eq:all}\begin{align} a &= b \label{eq:sa} \\ c &= d \label{eq:sb}\end{align}`,
        '$$',
        '',
        'See [eq:sa](#eq:sa), [eq:sb](#eq:sb) and [eq:all](#eq:all).',
      ),
    ).tree;
    expect(links(sub)).toEqual([
      { href: '#eq.eq:sa', words: '(1)' },
      { href: '#eq.eq:sb', words: '(2)' },
      { href: '#eq:all', words: 'eq:all' },
    ]);
  });

  it('test_math_numbered_labels: which labels of a formula take a number', () => {
    expect(numberedLabels(R`\begin{equation}\label{eq:one} a = b \end{equation}`)).toEqual([
      'eq:one',
    ]);
    expect(
      numberedLabels(
        R`\begin{align} a &= b \label{eq:a} \\ c &= d \nonumber \label{eq:b} \\ e &= f \label{eq:c} \end{align}`,
      ),
    ).toEqual(['eq:a', 'eq:c']);
    expect(numberedLabels(R`\begin{equation} a = b \tag{A}\label{eq:t} \end{equation}`)).toEqual([
      'eq:t',
    ]);
    expect(numberedLabels(R`\begin{equation*}\label{x} a = b \end{equation*}`)).toEqual([]);
    expect(
      numberedLabels(
        R`\begin{equation}\begin{split} a &= b \label{eq:in} \\ &= c \end{split}\end{equation}`,
      ),
    ).toEqual([]);
    expect(numberedLabels(R`a = b \label{eq:bare}`)).toEqual([]);
    expect(
      numberedLabels(R`\begin{equation} a = \badmacro{1} \label{eq:bad} \end{equation}`),
    ).toEqual([]);
  });

  it('test_math_label_unreached: a label no link reaches leaves nothing on the page', () => {
    expect(ids(render(GAUSS).tree)).toEqual([]);
    const other = render(lines(GAUSS, '', 'See [x](#nolabel) and [y](https://example.org).')).tree;
    expect(links(other)).toEqual([
      { href: '#nolabel', words: 'x' },
      { href: 'https://example.org', words: 'y' },
    ]);
    expect(ids(other)).toEqual([]);
    // A label on a row that has no number.
    const unnumbered = render(
      lines(
        '$$',
        R`\begin{align} a &= b \label{eq:n} \notag \\ c &= d \end{align}`,
        '$$',
        '',
        'See [eq:n](#eq:n).',
      ),
    ).tree;
    expect(links(unnumbered)).toEqual([{ href: '#eq:n', words: 'eq:n' }]);
    expect(ids(unnumbered)).toEqual([]);
    // Two formulas with one label: the link reaches the first.
    const twice = render(
      lines(
        '$$',
        R`\begin{equation}\label{eq:same} a = b \end{equation}`,
        '$$',
        '',
        '$$',
        R`\begin{equation}\label{eq:same} c = d \end{equation}`,
        '$$',
        '',
        'See [eq:same](#eq:same).',
      ),
    ).tree;
    expect(links(twice)).toEqual([{ href: '#eq.eq:same', words: '(1)' }]);
    expect(ids(twice)).toEqual(['eq.eq:same']);
  });

  it('test_math_no_link_no_change: a page with no link to a label is laid out as before', () => {
    const before = JSON.parse(
      readFileSync(
        join(process.cwd(), 'src/lib/__tests__/papers/proofs-before-links.json'),
        'utf8',
      ),
    );
    for (const name of ['1-proof.md', '2-more.md']) {
      vi.spyOn(console, 'warn').mockImplementation(() => {});
      const { tree } = render(fixture(name).replace(/\r\n/g, '\n'), { path: `chapters/${name}` });
      const plain = JSON.parse(
        JSON.stringify(tree, (key, value) => (key === 'position' ? undefined : value)),
      );
      expect(plain, name).toEqual(before[name]);
    }
    // A page of labelled formulas and of the writer's own links, to headings
    // and to labels, none in the form that asks for a number: laid out exactly
    // as the step did before it made links to equations (kept from `a6d02c8^`).
    const papers = join(process.cwd(), 'src/lib/__tests__/papers');
    const page = readFileSync(join(papers, 'labels-and-links.md'), 'utf8').replace(/\r\n/g, '\n');
    const { tree: labelsTree } = render(page, { path: 'chapters/labels.md' });
    expect(
      JSON.parse(
        JSON.stringify(labelsTree, (key, value) => (key === 'position' ? undefined : value)),
      ),
    ).toEqual(JSON.parse(readFileSync(join(papers, 'labels-before-links.json'), 'utf8')));
    const labelled = render(
      lines(
        GAUSS,
        '',
        '$$',
        R`\begin{align} a &= b \label{eq:a} \\ c &= d \label{eq:b} \end{align}`,
        '$$',
        '',
        'No link here, only [a site](https://example.org).',
      ),
    ).tree;
    expect(ids(labelled)).toEqual([]);
    expect(numbers(labelled)).toEqual(['(1)', '(2)', '(3)']);
  });
});
