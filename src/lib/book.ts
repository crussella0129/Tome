import { parseSummary, flattenChapters } from './summary';
import { hrefToSlug } from './paths';
import type { BookToc, ChapterNode } from './summary.types';
// The active book's spine, imported as raw text (Vite `?raw`). This is the
// committed sample by default, or an external book that load-book.mjs copied in.
import summaryRaw from '../content/book/SUMMARY.md?raw';
// Real title from book.toml (via load-book.mjs). Committed `{ "title": "Tome" }`
// for the sample; may be `{ "title": null }` for a book without a book.toml title.
import bookMeta from '../content/book/book.meta.json';

/**
 * The book's display title: the `book.toml` title (from `book.meta.json`) when
 * present, falling back to the SUMMARY.md first heading. External mdBooks often
 * start SUMMARY.md with `# Summary`, so book.toml is the correct title source.
 */
export function resolveTitle(
  metaTitle: string | null | undefined,
  summaryTitle: string | undefined,
): string | undefined {
  return metaTitle || summaryTitle;
}

export interface ChapterRoute {
  /** Route slug; `''` is the index (`/`). */
  slug: string;
  chapter: ChapterNode;
  prev?: ChapterNode;
  next?: ChapterNode;
}

/** The parsed table of contents for the active book, with its resolved title. */
export function bookToc(): BookToc {
  const toc = parseSummary(summaryRaw);
  const title = resolveTitle(
    (bookMeta as { title?: string | null }).title,
    toc.title,
  );
  return title === undefined ? toc : { ...toc, title };
}

/**
 * One route per linked, non-draft chapter, in reading order, each carrying its
 * previous/next neighbour for the pager. Drafts and separators produce no route.
 */
export function chapterRoutes(): ChapterRoute[] {
  const chapters = flattenChapters(bookToc());
  return chapters.map((chapter, i) => ({
    slug: hrefToSlug(chapter.href!),
    chapter,
    prev: chapters[i - 1],
    next: chapters[i + 1],
  }));
}

/** True when a glob key resolves to this chapter's source file. */
export function isContentKeyFor(globKey: string, href: string): boolean {
  const clean = href.trim().replace(/^\.\//, '');
  return globKey.endsWith(`content/book/${clean}`);
}
