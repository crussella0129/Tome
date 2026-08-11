import { describe, it, expect } from 'vitest';
import { hrefToSlug, chapterUrl } from '../paths';

describe('hrefToSlug', () => {
  // T-011 clause 2
  it('test_paths_nested_and_readme: nested paths and folder index chapters', () => {
    expect(hrefToSlug('a/b.md')).toBe('a/b');
    expect(hrefToSlug('a/README.md')).toBe('a');
    expect(hrefToSlug('README.md')).toBe('');
    expect(hrefToSlug('./ch1/one.md')).toBe('ch1/one');
    expect(hrefToSlug('guide/index.md')).toBe('guide');
    expect(hrefToSlug('intro.md#section')).toBe('intro'); // anchor dropped
  });

  // T-011 clause 3
  it('test_paths_reject_traversal: `..` never escapes the book root', () => {
    const escaped = hrefToSlug('../secret.md');
    expect(escaped.startsWith('..')).toBe(false);
    expect(escaped).toBe('secret');

    expect(hrefToSlug('../../etc/passwd.md').startsWith('..')).toBe(false);
    expect(hrefToSlug('a/../b.md')).toBe('b'); // resolved, not escaped
    expect(chapterUrl('../secret.md')).toBe('/secret'); // not /../secret
  });
});
