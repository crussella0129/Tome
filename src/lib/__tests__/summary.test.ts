import { describe, it, expect } from 'vitest';
import { parseSummary, flattenChapters } from '../summary';
import type { ChapterNode, PartTitleNode } from '../summary.types';

// A representative book exercising every shape at once.
const FULL = `# Summary

[Introduction](intro.md)

# Part One

- [Chapter 1](ch1.md)
  - [Section 1.1](ch1/one.md)
  - [Draft section]()
- [Chapter 2](ch2.md)

---

[Appendix](appendix.md)
`;

describe('parseSummary', () => {
  it('captures the leading title heading', () => {
    expect(parseSummary(FULL).title).toBe('Summary');
  });

  // EARS clause 1
  it('test_summary_nested_chapters: preserves parent/child nesting depth', () => {
    const toc = parseSummary(FULL);
    const ch1 = toc.nodes.find(
      (n): n is ChapterNode => n.kind === 'chapter' && n.title === 'Chapter 1',
    );
    expect(ch1).toBeDefined();
    expect(ch1!.depth).toBe(0);
    expect(ch1!.children).toHaveLength(2);
    const nested = ch1!.children[0]!;
    expect(nested.title).toBe('Section 1.1');
    expect(nested.depth).toBe(1);
    expect(nested.href).toBe('ch1/one.md');
  });

  it('nests three levels deep', () => {
    const toc = parseSummary(
      ['- [A](a.md)', '  - [B](b.md)', '    - [C](c.md)'].join('\n'),
    );
    const a = toc.nodes[0] as ChapterNode;
    const b = a.children[0]!;
    const c = b.children[0]!;
    expect([a.depth, b.depth, c.depth]).toEqual([0, 1, 2]);
    expect(c.title).toBe('C');
  });

  // EARS clause 2
  it('test_summary_part_title: emits a part-title node', () => {
    const toc = parseSummary('# Summary\n\n# Part One\n\n- [Ch](ch.md)');
    const part = toc.nodes.find(
      (n): n is PartTitleNode => n.kind === 'part-title',
    );
    expect(part).toBeDefined();
    expect(part!.title).toBe('Part One');
  });

  // EARS clause 3
  it('test_summary_prefix_and_suffix: marks prefix and suffix chapters', () => {
    const toc = parseSummary(FULL);
    const intro = toc.nodes.find(
      (n): n is ChapterNode => n.kind === 'chapter' && n.title === 'Introduction',
    );
    const appendix = toc.nodes.find(
      (n): n is ChapterNode => n.kind === 'chapter' && n.title === 'Appendix',
    );
    expect(intro?.section).toBe('prefix');
    expect(appendix?.section).toBe('suffix');
  });

  // EARS clause 4
  it('test_summary_draft_entry: marks unlinked entries as drafts', () => {
    const toc = parseSummary('- [Real](real.md)\n  - [Draft]()');
    const real = toc.nodes[0] as ChapterNode;
    const draft = real.children[0]!;
    expect(draft.draft).toBe(true);
    expect(draft.href).toBeUndefined();
    expect(real.draft).toBe(false);
    expect(real.href).toBe('real.md');
  });

  // EARS clause 5
  it('test_summary_separator: emits a separator node in order', () => {
    const toc = parseSummary('- [A](a.md)\n\n---\n\n[After](after.md)');
    const kinds = toc.nodes.map((n) => n.kind);
    expect(kinds).toEqual(['chapter', 'separator', 'chapter']);
  });

  it('ignores stray prose and blank lines', () => {
    const toc = parseSummary('# Summary\n\nSome intro prose.\n\n- [Ch](ch.md)');
    expect(toc.nodes).toHaveLength(1);
    expect(toc.nodes[0]!.kind).toBe('chapter');
  });

  it('handles tab-indented nesting', () => {
    const toc = parseSummary('- [A](a.md)\n\t- [B](b.md)');
    const a = toc.nodes[0] as ChapterNode;
    expect(a.children[0]!.title).toBe('B');
    expect(a.children[0]!.depth).toBe(1);
  });
});

describe('flattenChapters', () => {
  it('yields linked chapters in reading order, dropping drafts', () => {
    const toc = parseSummary(FULL);
    const titles = flattenChapters(toc).map((c) => c.title);
    expect(titles).toEqual([
      'Introduction',
      'Chapter 1',
      'Section 1.1',
      'Chapter 2',
      'Appendix',
    ]);
  });
});
