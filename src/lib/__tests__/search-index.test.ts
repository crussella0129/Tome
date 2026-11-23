import { describe, it, expect } from 'vitest';
import { buildSearchIndex, parseChapter } from '../search-index';
import { makeBook } from '../book';

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
