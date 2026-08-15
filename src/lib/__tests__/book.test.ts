import { describe, it, expect } from 'vitest';
import {
  books,
  makeBook,
  tomePages,
  pageSlug,
  bibliothecaEntries,
  resolveTitle,
  type ChapterPage,
} from '../book';

describe('library (bundled book)', () => {
  // T-019 clause 1 / INT-0014: books() returns one entry per tome dir. The
  // default library ships two tomes (sorted by slug): "marginalia" and "tome".
  it('test_books_library: exposes the two bundled tomes (marginalia + tome)', () => {
    const lib = books();
    expect(lib.map((b) => b.slug)).toEqual(['marginalia', 'tome']);
    expect(lib.find((b) => b.slug === 'marginalia')!.title).toBe('Marginalia');

    const tome = lib.find((b) => b.slug === 'tome')!;
    expect(tome.title).toBe('Tome'); // from book.meta.json
    expect(tome.toc.nodes.length).toBeGreaterThan(0);

    // Integration: parser → within-tome routes (drafts excluded, in reading order).
    const slugs = tome.chapters.map((r) => r.slug);
    expect(slugs).toEqual([
      '', // Introduction (README.md) → tome index
      'getting-started',
      'components',
      'components/panels',
      'about',
    ]);
    const titles = tome.chapters.map((r) => r.chapter.title);
    expect(titles).not.toContain('Unwritten Chapter'); // the draft has no route
    for (const route of tome.chapters) {
      expect(route.chapter.draft).toBe(false);
      expect(route.chapter.href).toBeDefined();
    }
  });

  // T-005 clause 4: the pager's prev/next data, now per-tome.
  it('test_pager_prev_next: neighbours are linked, ends are open', () => {
    const routes = books().find((b) => b.slug === 'tome')!.chapters;
    const first = routes[0]!;
    const last = routes[routes.length - 1]!;

    expect(first.prev).toBeUndefined();
    expect(first.next?.title).toBe('Getting Started');

    expect(last.next).toBeUndefined();
    expect(last.prev?.title).toBe('Panels & Tables');

    const middle = routes[1]!;
    expect(middle.prev?.title).toBe('Introduction');
    expect(middle.next?.title).toBe('Sacred Components');
  });
});

describe('adaptive routing', () => {
  const alpha = makeBook(
    'alpha',
    ['# Alpha', '', '[Intro](README.md)', '', '- [One](one.md)'].join('\n'),
    null,
  );
  const beta = makeBook(
    'beta',
    ['# Beta', '', '[Intro](README.md)', '', '- [Two](two.md)'].join('\n'),
    null,
  );

  // T-019 clause 2 (single): one tome → bare root routes, no Bibliotheca.
  it('test_routes_adaptive_single_and_multi: one tome routes at the root', () => {
    const pages = tomePages([alpha]);
    expect(pages.every((p) => p.kind === 'chapter')).toBe(true);
    expect((pages as ChapterPage[]).map((p) => p.routeSlug)).toEqual(['', 'one']);
  });

  // T-019 clause 2 (multi): many tomes → namespaced routes + a `/` Bibliotheca.
  it('test_routes_adaptive_single_and_multi: many tomes are namespaced under a Bibliotheca', () => {
    const pages = tomePages([alpha, beta]);

    const biblio = pages.filter((p) => p.kind === 'bibliotheca');
    expect(biblio).toHaveLength(1);
    expect(biblio[0]!.routeSlug).toBe(''); // the Bibliotheca owns `/`

    const chapterSlugs = pages
      .filter((p): p is ChapterPage => p.kind === 'chapter')
      .map((p) => p.routeSlug);
    // Each tome's root chapter → `/<tome>`, deeper chapters → `/<tome>/<chapter>`.
    expect(chapterSlugs).toEqual(['alpha', 'alpha/one', 'beta', 'beta/two']);
    expect(chapterSlugs).not.toContain(''); // no chapter collides with the index
  });

  it('pageSlug: adaptive namespace prefixing', () => {
    expect(pageSlug('tome', '', false)).toBe(''); // single-tome root → site index
    expect(pageSlug('tome', 'intro', false)).toBe('intro');
    expect(pageSlug('tome', '', true)).toBe('tome'); // multi root → tome index
    expect(pageSlug('tome', 'intro', true)).toBe('tome/intro');
  });

  // T-021 clause 2: the Bibliotheca lists each tome as a titled, namespaced link.
  it('test_bibliotheca_lists_tomes: one titled entry per tome, namespaced href + count', () => {
    expect(bibliothecaEntries([alpha, beta])).toEqual([
      { slug: 'alpha', title: 'Alpha', href: '/alpha', count: 2 },
      { slug: 'beta', title: 'Beta', href: '/beta', count: 2 },
    ]);
  });
});

describe('title resolution', () => {
  // T-011 clause 1
  it('test_book_title_from_meta: prefers the meta title, falls back to the summary heading', () => {
    expect(resolveTitle('External Handbook', 'Summary')).toBe('External Handbook');
    expect(resolveTitle(null, 'Summary')).toBe('Summary'); // no book.toml title
    expect(resolveTitle('', 'Fallback')).toBe('Fallback'); // empty title
    expect(resolveTitle(undefined, undefined)).toBeUndefined();
  });
});
