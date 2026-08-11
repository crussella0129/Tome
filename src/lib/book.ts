import { parseSummary, flattenChapters } from './summary';
import { hrefToSlug } from './paths';
import type { BookToc, ChapterNode } from './summary.types';
// The bundled sample book's spine, imported as raw text (Vite `?raw`).
import summaryRaw from '../content/book/SUMMARY.md?raw';

export interface ChapterRoute {
  /** Route slug; `''` is the index (`/`). */
  slug: string;
  chapter: ChapterNode;
  prev?: ChapterNode;
  next?: ChapterNode;
}

/** The parsed table of contents for the bundled book. */
export function bookToc(): BookToc {
  return parseSummary(summaryRaw);
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
