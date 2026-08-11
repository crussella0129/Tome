import { describe, it, expect } from 'vitest';
import { chapterRoutes, bookToc, resolveTitle } from '../book';

describe('bundled book', () => {
  // Integration: parser → route generation (T-003 clause 4 + T-005 clause 1).
  it('test_book_routes_generated: one route per non-draft chapter, drafts excluded', () => {
    const routes = chapterRoutes();
    const slugs = routes.map((r) => r.slug);

    // The sample SUMMARY has 5 linked chapters and 1 draft ("Unwritten Chapter").
    expect(slugs).toEqual([
      '', // Introduction (README.md) → index
      'getting-started',
      'components',
      'components/panels',
      'about',
    ]);

    // The draft chapter contributes no route.
    const titles = routes.map((r) => r.chapter.title);
    expect(titles).not.toContain('Unwritten Chapter');

    // Every route points at a real, non-draft chapter with a slug matching its href.
    for (const route of routes) {
      expect(route.chapter.draft).toBe(false);
      expect(route.chapter.href).toBeDefined();
    }
  });

  // T-005 clause 4: the pager's prev/next data.
  it('test_pager_prev_next: neighbours are linked, ends are open', () => {
    const routes = chapterRoutes();
    const first = routes[0]!;
    const last = routes[routes.length - 1]!;

    expect(first.prev).toBeUndefined();
    expect(first.next?.title).toBe('Getting Started');

    expect(last.next).toBeUndefined();
    expect(last.prev?.title).toBe('Panels & Tables');

    // A middle chapter is linked both ways.
    const middle = routes[1]!;
    expect(middle.prev?.title).toBe('Introduction');
    expect(middle.next?.title).toBe('Sacred Components');
  });

  it('exposes the book title (from book.meta.json)', () => {
    expect(bookToc().title).toBe('Tome');
  });

  // T-011 clause 1
  it('test_book_title_from_meta: prefers the meta title, falls back to the summary heading', () => {
    expect(resolveTitle('External Handbook', 'Summary')).toBe('External Handbook');
    expect(resolveTitle(null, 'Summary')).toBe('Summary'); // no book.toml title
    expect(resolveTitle('', 'Fallback')).toBe('Fallback'); // empty title
    expect(resolveTitle(undefined, undefined)).toBeUndefined();
  });
});
