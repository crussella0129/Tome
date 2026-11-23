import { describe, it, expect } from 'vitest';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import { rehypeHeadingIds } from '@astrojs/markdown-remark';
import { VFile } from 'vfile';
import { buildSearchIndex, formulaHeadings, parseChapter } from '../search-index';
import { search } from '../search';
import { makeBook } from '../book';
import remarkMathDollars from '../../../scripts/remark-math-dollars.mjs';
import rehypeMath from '../../../scripts/rehype-math.mjs';

const SUMMARY = [
  '# Tome',
  '',
  '[Intro](README.md)',
  '',
  '- [Getting Started](getting-started.md)',
  '- [Unwritten]()',
].join('\n');

// A chapter whose fenced code block contains heading-like lines that must NOT
// become real headings or leak into the searchable text.
const GETTING_STARTED = [
  '# Getting Started',
  '',
  'Welcome, reader.',
  '',
  '## The summary is the spine',
  '',
  'Prose about the spine and `inlineToken` code.',
  '',
  '```md',
  '# FencedHeading',
  'FENCEDTOKEN should not be indexed',
  '```',
].join('\n');

const README = '# Intro\n\nA short introduction.\n';

function sampleLibrary(slug = 'tome') {
  const raw: Record<string, string> = {
    [`../content/books/${slug}/README.md`]: README,
    [`../content/books/${slug}/getting-started.md`]: GETTING_STARTED,
  };
  return { book: makeBook(slug, SUMMARY, 'Tome'), raw };
}

describe('buildSearchIndex', () => {
  it('test_search_index_covers_chapters: one record per non-draft chapter, code fences excluded', () => {
    const { book, raw } = sampleLibrary();
    const records = buildSearchIndex([book], raw);

    // Two linked chapters; the draft "Unwritten" contributes no record.
    expect(records.map((r) => r.chapterTitle)).toEqual(['Intro', 'Getting Started']);
    for (const r of records) {
      expect(r.text.length).toBeGreaterThan(0);
      expect(r.tomeSlug).toBe('tome');
      expect(r.tomeTitle).toBe('Tome');
    }

    const gs = records.find((r) => r.chapterTitle === 'Getting Started')!;
    expect(gs.text).toContain('spine');
    expect(gs.text).toContain('inlineToken'); // inline code kept
    expect(gs.text).not.toContain('FENCEDTOKEN'); // fenced code dropped
  });

  it('test_search_index_heading_slugs: headings slugged in document order, github-slugger parity + dedupe', () => {
    const { book, raw } = sampleLibrary();
    const gs = buildSearchIndex([book], raw).find((r) => r.chapterTitle === 'Getting Started')!;

    // H1 + the one real H2; the fenced "# FencedHeading" is not a heading.
    expect(gs.headings).toEqual([
      { text: 'Getting Started', slug: 'getting-started', depth: 1 },
      { text: 'The summary is the spine', slug: 'the-summary-is-the-spine', depth: 2 },
    ]);

    // Dedupe including the H1 participates: matches Astro's per-page ids.
    const { headings } = parseChapter('# Notes\n\n## Notes\n\n## Notes\n');
    expect(headings.map((h) => h.slug)).toEqual(['notes', 'notes-1', 'notes-2']);
  });

  it('test_search_index_adaptive_url: root at `/` for one tome, namespaced for many', () => {
    const one = sampleLibrary('tome');
    const single = buildSearchIndex([one.book], one.raw);
    expect(single.find((r) => r.chapterTitle === 'Intro')!.url).toBe('/'); // root chapter
    expect(single.find((r) => r.chapterTitle === 'Getting Started')!.url).toBe('/getting-started');

    const a = sampleLibrary('alpha');
    const b = sampleLibrary('beta');
    const multi = buildSearchIndex(
      [makeBook('alpha', SUMMARY, 'Alpha'), makeBook('beta', SUMMARY, 'Beta')],
      { ...a.raw, ...b.raw },
    );
    const alphaGs = multi.find(
      (r) => r.tomeSlug === 'alpha' && r.chapterTitle === 'Getting Started',
    )!;
    const alphaIntro = multi.find((r) => r.tomeSlug === 'alpha' && r.chapterTitle === 'Intro')!;
    expect(alphaIntro.url).toBe('/alpha'); // root chapter → tome index
    expect(alphaGs.url).toBe('/alpha/getting-started');
  });
});

// INT-0029 (T-067) — HTML tags are never search words.
describe('parseChapter with HTML', () => {
  it('test_search_text_drops_tags: the words between tags are kept, the tags are not', () => {
    const { text } = parseChapter(
      'x<sup>2</sup> and <span class="a">b</span>\n\n<div>block words</div>',
    );
    // A tag within a line joins its neighbours (`x2`), as it does in a heading;
    // a block of HTML stands apart. Nothing of a tag is left.
    expect(text).toBe('x2 and b block words');
  });

  it('test_search_text_drops_tags: a formula in a line is found as one word', () => {
    const { text } = parseChapter('Washed in H<sub>2</sub>O, area x<sup>2</sup>.');
    expect(text).toBe('Washed in H2O, area x2.');
  });

  // Only tags that sit inside a word join it. A line break, a rule or a block
  // keeps the words either side apart, or the second could not be found.
  it('test_search_text_drops_tags: a line break, a rule and a cell boundary part their words', () => {
    expect(parseChapter('alpha<br>beta gamma').text).toBe('alpha beta gamma');
    expect(parseChapter('alpha<br/>beta<br />gamma').text).toBe('alpha beta gamma');
    expect(parseChapter('one <img src="x.png" alt="">two').text).toBe('one two');
    // A two-line table cell, as a Word cell with two paragraphs becomes.
    expect(parseChapter('| Tablet |\n| - |\n| First<br>second line |').text).toContain(
      'First second line',
    );
    // HTML inside a list item or a quotation is a block there, not part of a line.
    expect(parseChapter('- one\n\n  <hr>\n\n  two').text).toBe('one two');
    expect(parseChapter('> quoted\n>\n> <hr>\n>\n> again').text).toBe('quoted again');
    // Adjacent cells of an HTML table are separate words.
    expect(parseChapter('<table><tr><td>alpha</td><td>beta</td></tr></table>').text).toBe(
      'alpha beta',
    );
    // A joining tag inside a block of HTML still joins.
    expect(parseChapter('<div>Washed in H<sub>2</sub>O</div>').text).toBe('Washed in H2O');
    // A span keeps a word whole; a tag at a paragraph's end joins nothing across blocks.
    expect(parseChapter('re<span>mark</span>able\n\nnext').text).toBe('remarkable next');
    expect(parseChapter('ends <b>bold</b>\n\n<i>starts</i> here').text).toBe(
      'ends bold starts here',
    );
  });

  it('test_search_text_drops_tags: a heading is slugged as the page’s id is, and read by its words', () => {
    // The id skips every tag; the words either side of a break stay apart.
    const broken = parseChapter('## Alpha<br>Beta');
    expect(broken.headings).toEqual([{ text: 'Alpha Beta', slug: 'alphabeta', depth: 2 }]);
    expect(broken.text).toBe('Alpha Beta');
    // A Markdown line break inside a heading (as a Word heading with one becomes).
    const setext = parseChapter('The Quarry\\\nNorthern Face\n----------\n');
    expect(setext.headings).toEqual([
      { text: 'The Quarry Northern Face', slug: 'the-quarrynorthern-face', depth: 2 },
    ]);
    // A `>` inside an attribute or a comment does not end the tag.
    expect(parseChapter('## A <span title="a>b">c</span> d').headings[0]).toMatchObject({
      text: 'A c d',
      slug: 'a-c-d',
    });
    expect(parseChapter('## A <!-- x > y --> B').headings[0]).toMatchObject({ slug: 'a--b' });
  });

  it('test_search_text_drops_tags: a line break parts words, with or without a tag beside it', () => {
    // What the Word converter writes for a superscript followed by a line break.
    expect(parseChapter('Area 20 m<sup>2</sup><br>Volume five').text).toBe(
      'Area 20 m2 Volume five',
    );
    // Markdown's own two breaks: a backslash, and two trailing spaces.
    expect(parseChapter('Area 20 m<sup>2</sup>\\\nVolume five').text).toBe(
      'Area 20 m2 Volume five',
    );
    expect(parseChapter('first line  \n<b>Second</b> half').text).toBe('first line Second half');
    expect(parseChapter('alpha<img src="a>b.png">beta').text).toBe('alpha beta');
    expect(parseChapter('one <!-- a > b --> two').text).toBe('one two');
  });

  it('test_search_text_drops_tags: a tag joins what follows only if it joined what came before', () => {
    // Nothing stands before the tag, so the word after it is left whole.
    expect(parseChapter('<sup>2</sup>Guild of Masons').text).toBe('2 Guild of Masons');
    expect(parseChapter('<sup>a</sup>Corresponding author').text).toBe('a Corresponding author');
    expect(parseChapter('See note <sup>1</sup>and on').text).toBe('See note 1 and on');
    // Only a letter or a digit before the tag makes a word of the two: a
    // bracket or a comma does not, so the word after the marker is left whole.
    expect(parseChapter('(<sup>a</sup>Corresponding author)').text).toBe(
      '( a Corresponding author)',
    );
    expect(parseChapter('<sup>1</sup>,<sup>2</sup>Department of Stone').text).toBe(
      '1 , 2 Department of Stone',
    );
    // Hard against the text before it, it joins on both sides.
    expect(parseChapter('H<sub>2</sub>O and CO<sub>2</sub>.').text).toBe('H2O and CO2.');
    expect(parseChapter('H<sub><i>2</i></sub>O').text).toBe('H2O');
    expect(parseChapter('re<wbr>mark<wbr/>able').text).toBe('remarkable');
    expect(parseChapter('<SUP>x</SUP>y and a<SUB>1</SUB>b').text).toBe('x y and a1b');
  });

  it('test_search_text_drops_tags: a heading with a tag is slugged by its words', () => {
    const { headings, text } = parseChapter('## Washing in H<sub>2</sub>O\n\nRinsed.');
    expect(headings).toEqual([{ text: 'Washing in H2O', slug: 'washing-in-h2o', depth: 2 }]);
    expect(text).toBe('Washing in H2O Rinsed.');
  });
});

// --- Formulas (INT-0030, T-079) ----------------------------------------------

const R = String.raw;
const joined = (...parts: string[]) => parts.join('\n');

/** The heading ids and texts Astro's own collector gives a chapter, after the layout plugin. */
function pageHeadings(raw: string): { id: string; text: string }[] {
  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkMathDollars)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeMath)
    .use(rehypeHeadingIds);
  const file = new VFile({ value: raw, path: 'chapter.md' });
  processor.runSync(processor.parse(file), file);
  const collected = (file.data as { astro?: { headings?: { slug: string; text: string }[] } }).astro
    ?.headings;
  return (collected ?? []).map((heading) => ({ id: heading.slug, text: heading.text }));
}

describe('parseChapter with formulas', () => {
  // T-079 clause 1
  it('test_search_formula_text: a formula is found by what it shows', () => {
    const inline = parseChapter('Energy $E = mc^2$ here.').text;
    expect(inline).toBe('Energy E=mc2 here.');
    expect(inline).not.toMatch(/[$^]/);

    for (const formula of [
      joined('$$', R`\frac{a}{b}`, '$$'),
      joined('```math', R`\frac{a}{b}`, '```'),
    ]) {
      const text = parseChapter(joined('Before it.', '', formula, '', 'After it.')).text;
      expect(text, formula).toBe('Before it. ab After it.');
    }

    const applied = parseChapter(R`A sine $\sin x$ here.`).text;
    expect(applied).toBe('A sine sinx here.');
    expect(applied).not.toMatch(
      new RegExp(`[${String.fromCharCode(0x2061)}-${String.fromCharCode(0x2064)}]`),
    );
  });

  // T-079 clause 1
  it('test_search_set_apart_environment: a numbered environment is read set apart, its number left out', () => {
    for (const source of [
      joined('$$', R`\begin{equation} E = mc^2 \end{equation}`, '$$'),
      R`$$\begin{equation} E = mc^2 \end{equation}$$`,
      joined(R`$$\begin{align}`, 'E &= mc^2', R`\end{align}$$`),
    ]) {
      const text = parseChapter(joined('Before.', '', source, '', 'After.')).text;
      expect(text, source).toBe('Before. E=mc2 After.');
    }
    const tagged = parseChapter(joined('$$', R`x = y \tag{7}`, '$$')).text;
    expect(tagged).toBe('x=y');

    // With Windows line ends (found by the Test phase's review): read set
    // apart all the same, with a line of text directly under it.
    const crlf = [R`$$\begin{align}`, 'E &= mc^2', R`\end{align}$$`, 'Text under it.'].join(
      String.fromCharCode(13, 10),
    );
    expect(parseChapter(crlf).text).toBe('E=mc2 Text under it.');
  });

  // T-079 clause 2
  it('test_search_symbol_names: a symbol is found by the name it was typed with', () => {
    const greek = parseChapter(R`Take $\alpha + \beta \le \gamma$ here.`).text;
    expect(greek).toBe('Take α+β≤γ alpha beta le gamma here.');
    const record = {
      tomeSlug: 't',
      tomeTitle: 'T',
      chapterTitle: 'Greek',
      url: '/greek',
      headings: [],
      text: greek,
    };
    expect(search('alpha', [record]).map((hit) => hit.url)).toEqual(['/greek']);

    const built = parseChapter(R`Take $\frac{a}{b} + \sqrt{c}$ here.`).text;
    expect(built).toBe('Take ab+c here.');
    // A command that writes plain letters adds no second word.
    expect(parseChapter(R`A sine $\sin x$ here.`).text).toBe('A sine sinx here.');
  });

  // T-079 clause 3
  it('test_search_unreadable_formula: one that cannot be laid out is held as typed', () => {
    expect(parseChapter(R`A mistake $\frac{a}{$ here.`).text).toBe(R`A mistake $\frac{a}{$ here.`);
    const unclosed = parseChapter(
      joined('Before.', '', '$$', 'never closed', '', 'Later words.'),
    ).text;
    expect(unclosed).toBe('Before. $$never closed Later words.$$');
  });

  // T-079 clause 4
  it('test_search_money_lines: dollar signs that are not formulas are text', () => {
    for (const line of [
      'It costs $5 and then $10 for two things.',
      'Between $5 and$10 nothing.',
      'A $ b $ c.',
      'USD$5 and CAD$6.',
      'Costs $5 (see `$x`).',
      'Pay $5 or write `\\$`.',
      'Ends with a price of $5',
    ]) {
      // Inline code is read as its text, a run of its own, as it always was;
      // so the line is compared without regard to spaces.
      const squeezed = (value: string) => value.replace(/\s+/g, '');
      expect(squeezed(parseChapter(line).text), line).toBe(squeezed(line.replace(/`/g, '')));
      expect(parseChapter(line).text.match(/\$/g), line).toHaveLength(line.match(/\$/g)!.length);
    }
    expect(parseChapter('Costs $5 (not \\$x).').text).toBe('Costs $5 (not $x).');
    // A link is read as its words; its address was never search text.
    expect(parseChapter('$5 [pay](https://e.test/?q=$a) now').text).toBe('$5 pay now');
    expect(parseChapter('Pay $5 at <https://e.test/?a=$b>').text).toBe(
      'Pay $5 at https://e.test/?a=$b',
    );
  });

  // T-079 clause 5
  it('test_search_heading_formula_slug: a heading with a formula has the page’s own address', () => {
    const raw = joined(
      '# A chapter',
      '',
      R`## The $E = mc^2$ law`,
      '',
      R`## Why $\frac{a}{b}$ matters`,
      '',
      R`## Broken $\frac{a}{$ here`,
      '',
      R`## A matrix $\begin{pmatrix} a & b \\ c & d \end{pmatrix}$ here`,
      '',
      R`## The $E = mc^2$ law`,
      '',
      '## Plain words',
    );
    const page = pageHeadings(raw);
    const index = parseChapter(raw).headings;
    expect(index.map((heading) => heading.slug)).toEqual(page.map((heading) => heading.id));
    expect(index.map((heading) => heading.slug)).toContain('the-emc2-law');
    expect(index.map((heading) => heading.slug)).toContain('the-emc2-law-1');
    expect(index.map((heading) => heading.text)).toEqual([
      'A chapter',
      'The E = mc² law',
      'Why a/b matters',
      R`Broken $\frac{a}{$ here`,
      R`A matrix $\begin{pmatrix} a & b \\ c & d \end{pmatrix}$ here`,
      'The E = mc² law',
      'Plain words',
    ]);
    // Every heading object is the shape the index always had.
    for (const heading of index)
      expect(Object.keys(heading).sort()).toEqual(['depth', 'slug', 'text']);
  });

  // T-079 clause 6
  it('test_search_formula_headings: only a heading that holds a formula is given other text', () => {
    const raw = joined(
      '# A chapter',
      '',
      R`## The $E = mc^2$ law`,
      '',
      '## Alpha<br>Beta',
      '',
      '## Plain',
    );
    expect([...formulaHeadings(raw)]).toEqual([['the-emc2-law', 'The E = mc² law']]);
    expect(
      formulaHeadings(joined('# A chapter', '', '## Alpha<br>Beta', '', '## Plain')).size,
    ).toBe(0);
  });

  // T-079 clause 8
  it('test_search_formula_in_code: a formula’s source in code is code', () => {
    expect(parseChapter('Code `$x$` here.').text).toBe('Code $x$ here.');
    expect(
      parseChapter(joined('Before.', '', '```js', 'const a = "$a$";', '```', '', 'After.')).text,
    ).toBe('Before. After.');
  });
});
