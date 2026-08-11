/**
 * The navigation model produced from an mdBook `src/SUMMARY.md`.
 *
 * mdBook's SUMMARY grammar has five shapes we preserve:
 * - a book **title** (`# Summary`),
 * - **prefix** chapters (top-level links before the numbered section),
 * - **part titles** (`# Heading` inside the numbered section),
 * - **numbered** chapters (a nested list, `- [Name](path.md)`), and
 * - **suffix** chapters (top-level links after the numbered section),
 * with `---` **separators** and unlinked **draft** entries.
 */

/** Which region of the book a chapter belongs to. */
export type TocSection = 'prefix' | 'numbered' | 'suffix';

export interface ChapterNode {
  kind: 'chapter';
  /** Link text. */
  title: string;
  /** Raw link target, or `undefined` for a draft (empty `()`). */
  href?: string;
  /** True when the entry has no link target. */
  draft: boolean;
  /** Region of the book this chapter sits in. */
  section: TocSection;
  /** 0-based nesting depth (numbered chapters only; prefix/suffix are 0). */
  depth: number;
  /** Nested numbered chapters. Empty for prefix/suffix and leaf chapters. */
  children: ChapterNode[];
}

export interface PartTitleNode {
  kind: 'part-title';
  title: string;
}

export interface SeparatorNode {
  kind: 'separator';
}

export type TocNode = ChapterNode | PartTitleNode | SeparatorNode;

export interface BookToc {
  /** The book title from the leading `# ...`, if present. */
  title?: string;
  /** Top-level nodes in source order. Numbered chapters carry their children. */
  nodes: TocNode[];
}
