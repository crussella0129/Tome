import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import { fromMarkdown } from 'mdast-util-from-markdown';
import { mathFromMarkdown } from 'mdast-util-math';
import { visit } from 'unist-util-visit';
import remarkAlerts from '../../../scripts/remark-alerts.mjs';
import remarkMathDollars, {
  fenceClosed,
  mathSyntax,
  setApart,
} from '../../../scripts/remark-math-dollars.mjs';

// How Tome reads a formula in Markdown (INT-0030, T-077). "The reader" is
// remark-parse with remark-gfm and the plugin, as Astro composes them.

const R = String.raw;
const lines = (...parts: string[]) => parts.join('\n');

type Node = {
  type: string;
  value?: string;
  url?: string;
  children?: Node[];
  [key: string]: unknown;
};

function read(source: string, withPlugin = true): Node {
  const processor = unified().use(remarkParse).use(remarkGfm).use(remarkAlerts);
  if (withPlugin) processor.use(remarkMathDollars);
  return processor.runSync(processor.parse(source), { value: source }) as unknown as Node;
}

function all(tree: Node, ...types: string[]): Node[] {
  const found: Node[] = [];
  visit(tree as never, (node: Node) => {
    if (types.includes(node.type)) found.push(node);
  });
  return found;
}
/** The value of every formula, in order, marked `inline:` or `apart:`. */
const formulas = (tree: Node) =>
  all(tree, 'inlineMath', 'math').map(
    (node) => `${node.type === 'math' ? 'apart' : 'inline'}:${node.value}`,
  );
const inline = (source: string) => all(read(source), 'inlineMath').map((node) => node.value);
/** The text of a tree, formulas and code left out. */
const text = (tree: Node) =>
  all(tree, 'text')
    .map((node) => node.value)
    .join('');
const kinds = (tree: Node) => (tree.children ?? []).map((node) => node.type);
const none = (source: string) => expect(formulas(read(source)), source).toEqual([]);

describe('formulas in Markdown: single dollar signs', () => {
  // T-077 clause 1
  it('test_dollars_pair_is_formula: a pair hard against its text is a formula', () => {
    expect(inline('$2x+1$ and $a$ are both formulas.')).toEqual(['2x+1', 'a']);
    expect(inline('Just $5$ alone.')).toEqual(['5']);
    expect(inline('The $n$th term and the $k$-th.')).toEqual(['n', 'k']);
    expect(inline('Over two lines $a +\nb$ here.')).toEqual(['a +\nb']);
    expect(inline(R`A set $\{x\}$ and a price of $5.`)).toEqual([R`\{x\}`]);
  });

  // T-077 clause 1
  it('test_dollars_in_constructs: a formula is found wherever its paragraph stands', () => {
    const list = read('- item $a^2$ here');
    expect(formulas(list)).toEqual(['inline:a^2']);
    expect(kinds(list)).toEqual(['list']);

    const quote = read('> quote $b^2$ here');
    expect(formulas(quote)).toEqual(['inline:b^2']);
    expect(kinds(quote)).toEqual(['blockquote']);

    const alert = read('> [!NOTE]\n> mind $c^2$ here');
    expect(formulas(alert)).toEqual(['inline:c^2']);
    expect(
      (alert.children![0] as Node & { data?: { hProperties?: { className?: string[] } } }).data
        ?.hProperties?.className,
    ).toEqual(['admonition', 'admonition-note']);

    const note = read('A note[^1].\n\n[^1]: holds $d^2$ here');
    expect(formulas(note)).toEqual(['inline:d^2']);
    expect(all(note, 'footnoteDefinition')).toHaveLength(1);

    const table = read(lines('| a | b |', '|---|---|', R`| $x_1$ | $\lvert y \rvert$ |`));
    expect(formulas(table)).toEqual(['inline:x_1', R`inline:\lvert y \rvert`]);
    expect(all(table, 'tableCell')).toHaveLength(4);

    const link = read('[link $e^2$](https://example.com/a) after');
    expect(formulas(link)).toEqual(['inline:e^2']);
    expect(all(link, 'link').map((node) => node.url)).toEqual(['https://example.com/a']);

    const bold = read('**bold $f^2$ here**');
    expect(formulas(bold)).toEqual(['inline:f^2']);
    expect(all(bold, 'strong')).toHaveLength(1);
  });

  // T-077 clause 2
  it('test_dollars_money_lines: a price is not a formula, and a formula after it still is', () => {
    for (const line of [
      'It costs $5 and then $10 for two things.',
      'Between $5 and$10 nothing.',
      'A $ b $ c.',
      'USD$5 and CAD$6.',
    ]) {
      const tree = read(line);
      expect(formulas(tree), line).toEqual([]);
      expect(text(tree), line).toBe(line);
    }
    expect(inline('It costs $5 and $x$ is a number.')).toEqual(['x']);
    expect(inline('Price $5, formula $x^2$, price $7.')).toEqual(['x^2']);
    expect(inline('Paid $5.00 (was $7.50); so $d = 2.5$.')).toEqual(['d = 2.5']);
    expect(inline('**bold $5 and $x$ here** and $z$.')).toEqual(['x', 'z']);
  });

  // T-077 clause 3
  it('test_dollars_closer_belongs_elsewhere: a closing sign in code, an escape or a link is refused', () => {
    const inCode = read('Costs $5 (see `$x`).');
    expect(formulas(inCode)).toEqual([]);
    expect(all(inCode, 'inlineCode').map((node) => node.value)).toEqual(['$x']);

    const escapeInCode = read('Pay $5 or write `\\$`.');
    expect(formulas(escapeInCode)).toEqual([]);
    expect(all(escapeInCode, 'inlineCode').map((node) => node.value)).toEqual(['\\$']);

    const escaped = read('Costs $5 (not \\$x).');
    expect(formulas(escaped)).toEqual([]);
    expect(text(escaped)).toBe('Costs $5 (not $x).');

    const autolink = read('Pay $5 at <https://e.test/?a=$b>');
    expect(formulas(autolink)).toEqual([]);
    expect(all(autolink, 'link').map((node) => node.url)).toEqual(['https://e.test/?a=$b']);

    const address = read('$5 [pay](https://e.test/?q=$a)');
    expect(formulas(address)).toEqual([]);
    expect(all(address, 'link').map((node) => node.url)).toEqual(['https://e.test/?q=$a']);

    // Reading goes on: a real formula later in the same line is still found.
    for (const line of [
      'Costs $5 (see `$x`).',
      'Pay $5 or write `\\$`.',
      'Costs $5 (not \\$x).',
      'Pay $5 at <https://e.test/?a=$b>',
      '$5 [pay](https://e.test/?q=$a)',
    ]) {
      expect(inline(`${line} \`code\` and $b$`), line).toEqual(['b']);
    }
  });

  // T-077 clause 4
  it('test_dollars_lone_and_escaped: a lone sign and an escaped one are text', () => {
    none('Ends with a price of $5');
    const escaped = read('Escaped \\$5 and \\$10 here, then $y$.');
    expect(formulas(escaped)).toEqual(['inline:y']);
    expect(text(escaped)).toBe('Escaped $5 and $10 here, then .');
  });

  // T-077 clause 9
  it('test_dollars_code_untouched: a dollar sign in code is never a formula', () => {
    const spans = read('Code `$x$` and `costs $5 and $6` stay code.');
    expect(formulas(spans)).toEqual([]);
    expect(all(spans, 'inlineCode').map((node) => node.value)).toEqual(['$x$', 'costs $5 and $6']);

    const block = read(lines('```js', 'const a = "$a$";', '```'));
    expect(formulas(block)).toEqual([]);
    expect(all(block, 'code').map((node) => node.value)).toEqual(['const a = "$a$";']);

    const fenceInBlock = read(lines('```', '$$', 'x', '$$', '```'));
    expect(formulas(fenceInBlock)).toEqual([]);
    expect(all(fenceInBlock, 'code').map((node) => node.value)).toEqual(['$$\nx\n$$']);
  });

  // T-077 clause 10
  it('test_dollars_no_dollar_no_change: a document with no dollar sign is read as before', () => {
    for (const source of [
      'Plain prose with *emphasis*, `code` and a [link](https://example.com).\n\nAnother paragraph.',
      lines('| a | b |', '|---|---|', '| 1 | 2 |'),
      '> [!WARNING]\n> Be careful.\n\n- one\n- two',
    ]) {
      expect(read(source, true), source).toEqual(read(source, false));
    }
  });

  // T-077 clause 11
  it('test_dollars_recorded_limits: the cases INT-0030 records behave as recorded', () => {
    expect(inline('Cells $B$2:$C$3 in a sheet.')).toEqual(['2:']);
    expect(inline('Sum $a+$b here.')).toEqual(['a+']);

    const row = read(lines('| a | b |', '|---|---|', '|$a|$b|'));
    expect(formulas(row)).toEqual([]);

    const listMark = read(lines('$$ a = b', '+ c $$'));
    expect(formulas(listMark)).toEqual([]);
    expect(kinds(listMark)).toEqual(['paragraph', 'list']);
    expect(text(listMark.children![0])).toBe('$$ a = b');
  });
});

describe('formulas in Markdown: `$$`', () => {
  // T-077 clause 5
  it('test_dollars_fences: `$$` lines hold a formula exactly as typed', () => {
    const plain = read(lines('Before.', '', '$$', 'a = b', '$$', '', 'After.'));
    expect(formulas(plain)).toEqual(['apart:a = b']);
    expect(kinds(plain)).toEqual(['paragraph', 'math', 'paragraph']);

    expect(formulas(read(lines('$$  ', 'a = b', '$$')))).toEqual(['apart:a = b']);

    const underText = read(lines('Text', '$$', 'a = b', '$$', 'more text.'));
    expect(formulas(underText)).toEqual(['apart:a = b']);
    expect(kinds(underText)).toEqual(['paragraph', 'math', 'paragraph']);
    expect(text(underText)).toBe('Textmore text.');

    const inList = read(lines('- item', '', '  $$', '  a = b', '  $$', '', 'After.'));
    expect(formulas(inList)).toEqual(['apart:a = b']);
    expect(kinds(inList)).toEqual(['list', 'paragraph']);
    expect(all(inList.children![0], 'math')).toHaveLength(1);

    const underClosedPair = read(
      lines('Para with $$y$$ closed', '$$', 'a = b', '$$', 'more text.'),
    );
    expect(formulas(underClosedPair)).toEqual(['inline:y', 'apart:a = b']);

    // What a line of the formula begins with does not matter between fences.
    const listMark = read(lines('so we get', '$$', 'a = b', '+ c', '$$', 'more text.'));
    expect(formulas(listMark)).toEqual(['apart:a = b\n+ c']);
    expect(all(listMark, 'list')).toHaveLength(0);
  });

  // T-077 clause 6
  it('test_dollars_not_a_fence: `$$` with text on its line loses nothing after it', () => {
    const aligned = read(
      lines(R`$$\begin{aligned}`, R`a &= b \\`, '  &= c', R`\end{aligned}$$`, '', 'After stays.'),
    );
    expect(formulas(aligned)).toEqual([
      `apart:${lines(R`\begin{aligned}`, R`a &= b \\`, '  &= c', R`\end{aligned}`)}`,
    ]);
    expect(kinds(aligned)).toEqual(['math', 'paragraph']);
    expect(text(aligned)).toBe('After stays.');

    const closesAlone = read(lines('$$a = b', '$$', '', 'After stays.'));
    expect(formulas(closesAlone).map((value) => value.trim())).toEqual(['apart:a = b']);
    expect(kinds(closesAlone)).toEqual(['math', 'paragraph']);
    expect(text(closesAlone)).toBe('After stays.');

    const alignedClosesAlone = read(
      lines(R`$$\begin{aligned}`, 'a &= b', R`\end{aligned}`, '$$', '', 'After stays.'),
    );
    expect(formulas(alignedClosesAlone).map((value) => value.trim())).toEqual([
      `apart:${lines(R`\begin{aligned}`, 'a &= b', R`\end{aligned}`)}`,
    ]);
    expect(kinds(alignedClosesAlone)).toEqual(['math', 'paragraph']);
    expect(text(alignedClosesAlone)).toBe('After stays.');

    const inQuote = read(lines('> quote $$a = b', '> $$', '', 'After stays.'));
    expect(formulas(inQuote).map((value) => value.trim())).toEqual(['inline:a = b']);
    expect(kinds(inQuote)).toEqual(['blockquote', 'paragraph']);
    expect(text(inQuote.children![1])).toBe('After stays.');

    const unclosed = read(lines('A paragraph with $$ unclosed', '', 'After stays.'));
    expect(formulas(unclosed)).toEqual([]);
    expect(kinds(unclosed)).toEqual(['paragraph', 'paragraph']);
  });

  // T-077 clause 7
  it('test_dollars_set_apart: `$$…$$` with its lines to itself is set apart', () => {
    const alone = read('$$z$$');
    expect(formulas(alone)).toEqual(['apart:z']);
    expect(kinds(alone)).toEqual(['math']);

    const between = read(lines('Text above', '$$ x = y $$', 'and below.'));
    expect(formulas(between)).toEqual(['apart:x = y']);
    expect(kinds(between)).toEqual(['paragraph', 'math', 'paragraph']);
    expect(all(between, 'text').map((node) => node.value)).toEqual(['Text above', 'and below.']);

    const last = read(lines('Text above', '$$ x = y $$'));
    expect(kinds(last)).toEqual(['paragraph', 'math']);
    expect(all(last, 'text').map((node) => node.value)).toEqual(['Text above']);

    const inList = read(lines('- item', '', '  $$a$$'));
    expect(kinds(inList)).toEqual(['list']);
    expect(formulas(inList)).toEqual(['apart:a']);

    const inQuote = read(lines('> quote', '>', '> $$b$$'));
    expect(kinds(inQuote)).toEqual(['blockquote']);
    expect(formulas(inQuote)).toEqual(['apart:b']);

    // In the middle of a line, or where a block cannot stand, it stays inline.
    expect(formulas(read('a $$y$$ c'))).toEqual(['inline:y']);
    expect(formulas(read('**bold $$y$$**'))).toEqual(['inline:y']);
    expect(formulas(read('## $$y$$'))).toEqual(['inline:y']);
    expect(formulas(read(lines('| a |', '|---|', '| $$y$$ |')))).toEqual(['inline:y']);

    // The step on its own, on a tree parsed without remark, gives the same tree.
    for (const source of [
      lines('Text above', '$$ x = y $$', 'and below.'),
      lines(R`$$\begin{aligned}`, 'a &= b', R`\end{aligned}$$`, '', 'After.'),
      lines('$$', 'never closed'),
    ]) {
      const tree = fromMarkdown(source, {
        extensions: mathSyntax(),
        mdastExtensions: [mathFromMarkdown()],
      }) as unknown as Node;
      setApart(tree, source);
      const viaPlugin = unified().use(remarkParse).use(remarkMathDollars);
      expect(tree, source).toEqual(viaPlugin.runSync(viaPlugin.parse(source), { value: source }));
    }
  });

  // T-077 clause 8
  it('test_dollars_unclosed_fence: a fence never closed is marked, and only that', () => {
    const closedOrNot = (source: string) =>
      all(read(source), 'math').map((node) => fenceClosed(node, source));
    const marked = (source: string) =>
      all(read(source), 'math').map((node) =>
        (
          node as Node & { data?: { hChildren?: { properties?: { className?: string[] } }[] } }
        ).data?.hChildren?.[0]?.properties?.className?.includes('math-unclosed'),
      );

    const never = lines('$$', 'never closed', '', 'After.');
    expect(closedOrNot(never)).toEqual([false]);
    expect(marked(never)).toEqual([true]);

    const closesWithText = lines('$$', 'x = y$$', '', 'After.');
    expect(closedOrNot(closesWithText)).toEqual([false]);
    expect(marked(closesWithText)).toEqual([true]);

    for (const source of [
      lines('Before.', '', '$$', 'a = b', '$$', '', 'After.'),
      lines('- item', '', '  $$', '  a = b', '  $$'),
      lines('> $$', '> a = b', '> $$'),
      lines(R`$$\begin{aligned}`, 'a &= b', R`\end{aligned}$$`, '', 'After.'),
      lines('$$a = b', '$$', '', 'After.'),
      lines('Text above', '$$ x = y $$', 'and below.'),
      '$$z$$',
    ]) {
      expect(closedOrNot(source), source).toEqual([true]);
      expect(marked(source), source).toEqual([false]);
    }
  });
});

describe('formulas in the build', () => {
  // T-077 clause 12, T-078 clause 13
  it('test_config_reads_math: the Markdown settings list the two plugins, highlighting off', () => {
    // The config is loaded by Node itself, as Astro loads it, and reports its
    // own default export (under the test runner its file URLs are rewritten).
    const report = execFileSync(
      process.execPath,
      [
        '--input-type=module',
        '-e',
        `const { default: config } = await import('./astro.config.mjs');
         const names = (list) => (list ?? []).map((plugin) => plugin.name);
         console.log(JSON.stringify({
           highlight: config.markdown.syntaxHighlight,
           remark: names(config.markdown.remarkPlugins),
           rehype: names(config.markdown.rehypePlugins),
         }));`,
      ],
      { cwd: process.cwd(), encoding: 'utf8' },
    );
    const settings = JSON.parse(report.trim().split('\n').pop()!);
    expect(settings.highlight).toBe(false);
    expect(settings.remark).toEqual([remarkAlerts.name, remarkMathDollars.name]);
    expect(settings.rehype).toEqual(['rehypeMath']);
  });
});

// Found by the Test phase's review: inputs the cases above did not try.
describe('formulas in Markdown: line ends as Windows writes them, and code above a fence', () => {
  const CRLF = String.fromCharCode(13, 10);
  const windows = (...parts: string[]) => parts.join(CRLF);

  // T-077 clauses 5, 6, 7 — a file saved with `\r\n` line ends reads the same.
  it('test_dollars_crlf: every `$$` shape reads with Windows line ends as with Unix ones', () => {
    const shapes: string[][] = [
      ['Text above', '$$ x = y $$', 'and below.'],
      ['Text above', '$$ x = y $$'],
      ['Before.', '', '$$', 'a = b', '$$', '', 'After.'],
      ['Text', '$$', 'a = b', '+ c', '$$', 'more text.'],
      [R`$$\begin{align}`, 'a &= b', R`\end{align}$$`, 'a line of text directly under it'],
      [R`$$\begin{aligned}`, 'a &= b', R`\end{aligned}$$`, '', 'After stays.'],
      ['$$a = b', '$$', '', 'After stays.'],
      ['- item', '', '  $$', '  a = b', '  $$', '', 'After.'],
      ['It costs $5 and', 'then $10. And $x$ too.'],
    ];
    for (const shape of shapes) {
      const unix = read(lines(...shape));
      const win = read(windows(...shape));
      const label = shape.join(' / ');
      expect(kinds(win), label).toEqual(kinds(unix));
      // The same formulas, set apart or not, their own line ends aside.
      expect(
        formulas(win).map((value) => value.replaceAll(CRLF, '\n')),
        label,
      ).toEqual(formulas(unix));
      expect(
        all(win, 'math').map((node) => fenceClosed(node, windows(...shape))),
        label,
      ).toEqual(all(unix, 'math').map((node) => fenceClosed(node, lines(...shape))));
    }
    // And they are the shapes meant: set apart, with the text round them kept.
    const between = read(windows('Text above', '$$ x = y $$', 'and below.'));
    expect(kinds(between)).toEqual(['paragraph', 'math', 'paragraph']);
    expect(all(between, 'text').map((node) => node.value)).toEqual(['Text above', 'and below.']);
    const numbered = read(
      windows(R`$$\begin{align}`, 'a &= b', R`\end{align}$$`, 'a line of text directly under it'),
    );
    expect(kinds(numbered)).toEqual(['math', 'paragraph']);
  });

  // T-077 clauses 5, 9 — a `$$` named in inline code is not an unclosed formula.
  it('test_dollars_code_above_fence: `$$` in inline code directly above a fence leaves the fence a fence', () => {
    const tree = read(
      lines(
        'Write `$$` on its own line:',
        '$$',
        'a = b',
        '$$',
        '',
        'After the formula.',
        '',
        '## Later heading',
        '',
        'Later text.',
      ),
    );
    expect(kinds(tree)).toEqual(['paragraph', 'math', 'paragraph', 'heading', 'paragraph']);
    expect(formulas(tree)).toEqual(['apart:a = b']);
    expect(all(tree, 'inlineCode').map((node) => node.value)).toEqual(['$$']);
    expect(all(tree, 'math').map((node) => fenceClosed(node, ''))).toBeDefined();

    // Two code spans, and a longer run of backticks, are left out of the count too.
    const twice = read(lines('Use `$$` or ``a `$$` b`` here:', '$$', 'c = d', '$$', '', 'After.'));
    expect(formulas(twice)).toEqual(['apart:c = d']);
    expect(kinds(twice)).toEqual(['paragraph', 'math', 'paragraph']);

    // An unclosed `$$` outside code is still closed by the `$$` line under it.
    const open = read(lines('See `code` then $$a = b', '$$', '', 'After.'));
    expect(formulas(open).map((value) => value.trim())).toEqual(['inline:a = b']);
    expect(kinds(open)).toEqual(['paragraph', 'paragraph']);
  });
});
