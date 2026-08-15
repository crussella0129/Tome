import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup, fireEvent } from '@solidjs/testing-library';
import SearchOverlay from '../SearchOverlay';
import type { SearchRecord } from '../../lib/search-index';

const records: SearchRecord[] = [
  {
    tomeSlug: 'tome',
    tomeTitle: 'Tome',
    chapterTitle: 'Components',
    url: '/components',
    headings: [{ text: 'Panels', slug: 'panels', depth: 2 }],
    text: 'components panels tables widgets',
  },
  {
    tomeSlug: 'tome',
    tomeTitle: 'Tome',
    chapterTitle: 'About',
    url: '/about',
    headings: [],
    text: 'about this project',
  },
];

afterEach(cleanup);

describe('SearchOverlay', () => {
  // T-024 clause 2: open, focus, type → adaptive result links.
  it('test_search_overlay_opens_and_lists: opens, focuses input, deep-links results', () => {
    const { getByRole, queryByRole } = render(() => (
      <SearchOverlay records={records} libraryWide={true} />
    ));
    expect(queryByRole('dialog')).toBeNull(); // closed initially

    fireEvent.click(getByRole('button', { name: /search the library/i }));
    expect(getByRole('dialog')).toBeTruthy();

    const input = getByRole('combobox') as HTMLInputElement;
    expect(document.activeElement).toBe(input); // focus moved to the query field

    // A section match deep-links to the heading anchor.
    fireEvent.input(input, { target: { value: 'panels' } });
    const link = getByRole('link', { name: /Components/ });
    expect(link).toHaveAttribute('href', '/components#panels');
  });

  // T-024 clause 1 + designed states.
  it('test_search_overlay_escape_closes: Escape closes and restores focus; states never blank', () => {
    const { getByRole, queryByRole, getByText } = render(() => (
      <SearchOverlay records={records} libraryWide={true} />
    ));
    const trigger = getByRole('button', { name: /search the library/i });
    fireEvent.click(trigger);
    const input = getByRole('combobox') as HTMLInputElement;

    // Empty query → the designed hint panel.
    expect(getByText(/Search every tome/i)).toBeTruthy();

    // A no-match query → the designed empty panel.
    fireEvent.input(input, { target: { value: 'zzznope' } });
    expect(getByText(/No matches/i)).toBeTruthy();

    // Escape closes the dialog and returns focus to the trigger.
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });
});
