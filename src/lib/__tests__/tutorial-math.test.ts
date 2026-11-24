// Runs in the default (jsdom) environment: it lays the chapter out, and with
// Vitest's node environment the shared config still resolves the Markdown
// parser's browser build, which needs a `document`.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import { visit } from 'unist-util-visit';
import remarkMathDollars from '../../../scripts/remark-math-dollars.mjs';
import rehypeMath from '../../../scripts/rehype-math.mjs';

const R = String.raw;
const read = (path: string) => readFileSync(path, 'utf8');

// INT-0030 AC8 (T-083) — the guide tells a person how to write a formula.
describe('writing mathematics, in the guide', () => {
  const path = 'src/content/books/tome/write-mathematics.md';
  const chapter = read(path);
  const joined = chapter.replace(/\s+/g, ' ');
  /** The chapter's code, where a formula's source is shown and not laid out. */
  const code = [...chapter.matchAll(/(`{3,})[^\n]*\n([\s\S]*?)\n\1|`([^`\n]+)`/g)]
    .map((match) => match[2] ?? match[3] ?? '')
    .join('\n');

  it('test_tutorial_covers_mathematics: how to write a formula, and what to know', () => {
    // Linked from the guide's spine, in the Guide part after "Panels & Tables".
    const summary = read('src/content/books/tome/SUMMARY.md');
    expect(summary).toMatch(
      /\[Panels & Tables\]\(components\/panels\.md\)\n- \[Write Mathematics\]\(write-mathematics\.md\)/,
    );

    // Shown as source, in code.
    for (const source of [
      R`$\pi r^2$`, // within a line
      '$$', // set apart
      '```math', // a code block in the language `math`
      R`\frac`,
      R`\sqrt`,
      R`\sum`,
      'pmatrix',
      R`\begin{align}`,
      R`\begin{equation}`,
      R`\tag`,
      R`\$`,
      R`\vert`,
      R`\ref`,
      '$HOME', // a name that belongs in code
      R`\\(`, // mdBook's own form
    ]) {
      expect(code, source).toContain(source);
    }
    // Said in words.
    for (const words of [
      'A line that holds `$$` and nothing else opens a formula, and the next such line closes it',
      'Numbers count from one down each page',
      'no digit after the closing one', // why a price is not a formula
      'It costs $5 on Monday and $10 by Friday.',
      'A formula that cannot be read is shown as you typed it',
      'Each formula is read on its own',
      'is not laid out', // mdBook's own form
      'Word document',
    ]) {
      expect(joined, words).toContain(words);
    }

    // Laid out, by the rule and the plugin the build uses.
    const processor = unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkMathDollars)
      .use(remarkRehype)
      .use(rehypeMath);
    const tree = processor.runSync(processor.parse(chapter), { value: chapter });
    const found: Record<string, number> = {};
    const numbers: string[] = [];
    let errors = 0;
    let textOf = '';
    visit(
      tree as never,
      (node: {
        type: string;
        tagName?: string;
        value?: string;
        properties?: { className?: string[] };
      }) => {
        if (node.type === 'text') textOf += node.value;
        if (node.type !== 'element') return;
        found[node.tagName!] = (found[node.tagName!] ?? 0) + 1;
        if (node.properties?.className?.includes('tome-math-error')) errors += 1;
        if (node.tagName === 'code' && node.properties?.className?.includes('language-math'))
          errors += 1;
      },
    );
    visit(tree as never, 'text', (node: { value: string }) => {
      if (/^\(\d+\)$/.test(node.value)) numbers.push(node.value);
    });
    expect(errors).toBe(0);
    // A fraction, a root, a sum with limits, a matrix, a derivation and a
    // numbered equation, each laid out.
    expect(found.mfrac).toBeGreaterThanOrEqual(1);
    expect((found.msqrt ?? 0) + (found.mroot ?? 0)).toBeGreaterThanOrEqual(2);
    expect((found.munderover ?? 0) + (found.msubsup ?? 0)).toBeGreaterThanOrEqual(1);
    expect(found.mtable).toBeGreaterThanOrEqual(3); // the matrix, the derivation, the equation
    expect(numbers).toEqual(['(1)', '(2)', '(3)']);
    // The price line is still a price line.
    expect(textOf).toContain('It costs $5 on Monday and $10 by Friday.');
  });
});
