import { describe, it, expect } from 'vitest';
import { search } from '../search';
import type { SearchRecord } from '../search-index';

const records: SearchRecord[] = [
  {
    tomeSlug: 'tome',
    tomeTitle: 'Tome',
    chapterTitle: 'Components',
    url: '/components',
    headings: [
      { text: 'Components', slug: 'components', depth: 1 },
      { text: 'Panels and tables', slug: 'panels-and-tables', depth: 2 },
    ],
    text: 'Components include panels and tables. Widgets live here too.',
  },
  {
    tomeSlug: 'tome',
    tomeTitle: 'Tome',
    chapterTitle: 'About',
    url: '/about',
    headings: [{ text: 'About', slug: 'about', depth: 1 }],
    text: 'This page mentions components once, in the body only.',
  },
];

describe('search', () => {
  it('test_search_ranks_title_over_body: a title/heading match outranks a body-only match', () => {
    const hits = search('components', records);
    expect(hits).toHaveLength(2);
    expect(hits[0]!.record.chapterTitle).toBe('Components'); // title match first
    expect(hits[1]!.record.chapterTitle).toBe('About'); // body-only second
    expect(hits[0]!.score).toBeGreaterThan(hits[1]!.score);
    // A title-only match links to the page, with no section anchor.
    expect(hits[1]!.url).toBe('/about');
  });

  it('test_search_prefix_multiterm: prefix matches, all terms required, section anchor attached', () => {
    // Prefix: "comp" → "components".
    expect(search('comp', records).map((h) => h.record.chapterTitle)).toContain('Components');

    // A section match deep-links to that heading's anchor.
    const panels = search('panels tables', records);
    expect(panels).toHaveLength(1);
    expect(panels[0]!.url).toBe('/components#panels-and-tables');

    // Multi-term is AND: "widgets" only exists in the Components record.
    const both = search('components widgets', records);
    expect(both).toHaveLength(1);
    expect(both[0]!.record.chapterTitle).toBe('Components');
  });

  it('test_search_empty_and_noresults: empty/whitespace and no-match both return []', () => {
    expect(search('', records)).toEqual([]);
    expect(search('   ', records)).toEqual([]);
    expect(search('zzzznomatch', records)).toEqual([]);
  });
});
