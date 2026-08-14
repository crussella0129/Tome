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
    const alphaGs = multi.find((r) => r.tomeSlug === 'alpha' && r.chapterTitle === 'Getting Started')!;
    const alphaIntro = multi.find((r) => r.tomeSlug === 'alpha' && r.chapterTitle === 'Intro')!;
    expect(alphaIntro.url).toBe('/alpha'); // root chapter → tome index
    expect(alphaGs.url).toBe('/alpha/getting-started');
  });
});
