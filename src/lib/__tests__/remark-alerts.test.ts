import { describe, it, expect } from 'vitest';
import { fromMarkdown } from 'mdast-util-from-markdown';
import remarkAlerts from '../../../scripts/remark-alerts.mjs';

// Parse Markdown to an mdast tree and run the plugin's transformer over it.
function transform(markdown: string) {
  const tree = fromMarkdown(markdown) as any;
  remarkAlerts()(tree);
  return tree;
}

describe('remarkAlerts', () => {
  // T-029 clause 1
  it('test_remark_alerts_transforms: a `[!TYPE]` blockquote becomes a titled admonition', () => {
    const bq = transform('> [!WARNING]\n> Be careful.\n').children[0];
    expect(bq.type).toBe('blockquote');
    expect(bq.data.hName).toBe('div');
    expect(bq.data.hProperties.className).toEqual(['admonition', 'admonition-warning']);

    // Title paragraph prepended.
    expect(bq.children[0].data.hProperties.className).toEqual(['admonition-title']);
    expect(bq.children[0].children[0].value).toBe('Warning');
    // Body text with the marker removed.
    expect(bq.children[1].children[0].value).toBe('Be careful.');

    // Case-insensitive; every type maps to a title.
    const note = transform('> [!note]\n> hi\n').children[0];
    expect(note.data.hProperties.className).toEqual(['admonition', 'admonition-note']);
    expect(note.children[0].children[0].value).toBe('Note');
  });

  // T-029 clause 2
  it('test_remark_alerts_leaves_plain_blockquote: no marker / bogus marker is unchanged', () => {
    const plain = transform('> Just a quote.\n').children[0];
    expect(plain.type).toBe('blockquote');
    expect(plain.data?.hName).toBeUndefined();
    expect(plain.children[0].children[0].value).toBe('Just a quote.');

    const bogus = transform('> [!FOO]\n> nope\n').children[0];
    expect(bogus.data?.hName).toBeUndefined();
    expect(bogus.children[0].children[0].value).toBe('[!FOO]\nnope');
  });
});
