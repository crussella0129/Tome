import { describe, it, expect } from 'vitest';
import { searchScopeCopy } from '../search-copy';

describe('searchScopeCopy', () => {
  it('test_search_copy_library_wide: reads library-wide with several tomes', () => {
    const copy = searchScopeCopy(true);
    expect(copy.trigger).toBe('Search the library');
    expect(copy.dialogLabel).toBe('Search the library');
    expect(copy.hint.toLowerCase()).toContain('every tome');
  });

  it('test_search_copy_single_tome: does not imply multiple tomes with one', () => {
    const copy = searchScopeCopy(false);
    expect(copy.trigger).toBe('Search this tome');
    expect(copy.dialogLabel).toBe('Search this tome');
    // Must not claim a library / "every tome" when there is only one.
    expect(copy.trigger.toLowerCase()).not.toContain('library');
    expect(copy.hint.toLowerCase()).not.toContain('every tome');
  });
});
