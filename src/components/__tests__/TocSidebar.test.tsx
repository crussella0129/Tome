import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup, fireEvent } from '@solidjs/testing-library';
import TocSidebar from '../TocSidebar';
import { parseSummary } from '../../lib/summary';

const toc = parseSummary(
  [
    '# Handbook',
    '',
    '- [Intro](intro.md)',
    '- [Chapter 1](ch1.md)',
    '  - [Section](ch1/section.md)',
    '- [Draft]()',
  ].join('\n'),
);

afterEach(cleanup);

describe('TocSidebar', () => {
  // T-004 EARS clause 1
  it('test_sidebar_lists_chapter_links: renders every linkable chapter as an anchor', () => {
    const { getAllByRole, queryByText } = render(() => (
      <TocSidebar toc={toc} activeSlug="" bookTitle="Handbook" />
    ));
    const hrefs = getAllByRole('link').map((a) => a.getAttribute('href'));
    // Brand link ("/") plus the three linkable chapters.
    expect(hrefs).toContain('/intro');
    expect(hrefs).toContain('/ch1');
    expect(hrefs).toContain('/ch1/section');
    // The draft is not a link.
    const draft = queryByText('Draft');
    expect(draft?.tagName.toLowerCase()).not.toBe('a');
  });

  // T-004 EARS clause 2
  it('test_sidebar_marks_current: marks the active chapter with aria-current', () => {
    const { getByRole } = render(() => (
      <TocSidebar toc={toc} activeSlug="ch1/section" bookTitle="Handbook" />
    ));
    const current = getByRole('link', { name: 'Section' });
    expect(current).toHaveAttribute('aria-current', 'page');
    const other = getByRole('link', { name: 'Intro' });
    expect(other).not.toHaveAttribute('aria-current');
  });

  // T-021 clause 1: with several tomes, a switcher lists them (active marked) + a
  // Bibliotheca link; with one tome, no switcher renders.
  const twoBooks = [
    { slug: 'alpha', title: 'Alpha', href: '/alpha' },
    { slug: 'beta', title: 'Beta', href: '/beta' },
  ];

  it('test_sidebar_book_switcher: multi-tome switcher lists tomes, marks the active, links the Bibliotheca', () => {
    const { getByRole } = render(() => (
      <TocSidebar
        toc={toc}
        activeSlug=""
        bookTitle="Current Tome"
        bookSlug="alpha"
        books={twoBooks}
        activeBook="alpha"
      />
    ));
    const active = getByRole('link', { name: 'Alpha' });
    expect(active).toHaveAttribute('href', '/alpha');
    expect(active).toHaveAttribute('aria-current', 'true');

    const other = getByRole('link', { name: 'Beta' });
    expect(other).toHaveAttribute('href', '/beta');
    expect(other).not.toHaveAttribute('aria-current');

    const biblio = getByRole('link', { name: 'Bibliotheca' });
    expect(biblio).toHaveAttribute('href', '/');
  });

  it('test_sidebar_book_switcher: a single tome renders no switcher', () => {
    const { queryByText, queryByRole } = render(() => (
      <TocSidebar toc={toc} activeSlug="" bookTitle="Handbook" />
    ));
    expect(queryByText('Tomes')).toBeNull();
    expect(queryByRole('link', { name: 'Bibliotheca' })).toBeNull();
  });

  // T-004 EARS clause 3
  it('test_sidebar_toggle_collapses: the toggle flips the open-state', () => {
    const { getByRole, container } = render(() => (
      <TocSidebar toc={toc} activeSlug="" bookTitle="Handbook" />
    ));
    const nav = container.querySelector('nav')!;
    const toggle = getByRole('button', { name: 'Toggle table of contents' });

    expect(nav.getAttribute('data-open')).toBe('true');
    expect(toggle).toHaveAttribute('aria-expanded', 'true');

    fireEvent.click(toggle);
    expect(nav.getAttribute('data-open')).toBe('false');
    expect(toggle).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(toggle);
    expect(nav.getAttribute('data-open')).toBe('true');
  });
});
