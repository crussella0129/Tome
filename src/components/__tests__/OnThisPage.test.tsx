import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@solidjs/testing-library';
import OnThisPage, { activeHeadingSlug, type Heading } from '../OnThisPage';

const headings: Heading[] = [
  { depth: 2, slug: 'alpha', text: 'Alpha' },
  { depth: 3, slug: 'beta', text: 'Beta' },
];

afterEach(cleanup);

describe('OnThisPage', () => {
  // T-026 clause 1: renders a server-side nav of anchor links.
  it('test_on_this_page_lists_headings: renders a nav of #slug anchor links', () => {
    const { getByRole } = render(() => <OnThisPage headings={headings} />);
    expect(getByRole('navigation', { name: /on this page/i })).toBeTruthy();
    expect(getByRole('link', { name: 'Alpha' })).toHaveAttribute('href', '#alpha');
    expect(getByRole('link', { name: 'Beta' })).toHaveAttribute('href', '#beta');
  });

  it('test_on_this_page_empty_no_rail: renders nothing without headings', () => {
    const { queryByRole } = render(() => <OnThisPage headings={[]} />);
    expect(queryByRole('navigation')).toBeNull();
  });
});

describe('activeHeadingSlug', () => {
  // T-026 clause 2 (pure active-selection, DOM-free — critique C-001).
  it('test_active_heading_selection: the last heading at/above the offset', () => {
    const hs: Heading[] = [
      { depth: 2, slug: 'a', text: 'A' },
      { depth: 2, slug: 'b', text: 'B' },
      { depth: 2, slug: 'c', text: 'C' },
    ];
    expect(activeHeadingSlug(hs, [200, 400, 600])).toBe('a'); // all below → first
    expect(activeHeadingSlug(hs, [-50, -10, 300])).toBe('b'); // two passed → second
    expect(activeHeadingSlug(hs, [-300, -200, -10])).toBe('c'); // all passed → last
    expect(activeHeadingSlug([], [])).toBeUndefined();
  });
});
