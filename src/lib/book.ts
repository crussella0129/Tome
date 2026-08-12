import { parseSummary, flattenChapters } from './summary';
import { hrefToSlug } from './paths';
import type { BookToc, ChapterNode } from './summary.types';

// The library: every tome's spine + metadata, eagerly imported as raw text /
// JSON (Vite globs). The committed sample lives at `books/tome/`; the loader
// (load-book.mjs / load-books.mjs) replaces or adds sibling tomes at build time.
const summaryRaws = import.meta.glob('../content/books/*/SUMMARY.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;
const bookMetas = import.meta.glob('../content/books/*/book.meta.json', {
  import: 'default',
  eager: true,
}) as Record<string, { title?: string | null }>;

/** The tome slug embedded in a `../content/books/<slug>/…` glob key. */
function slugOfKey(key: string): string {
  return key.match(/\/books\/([^/]+)\//)?.[1] ?? '';
}

/**
 * A tome's display title: the `book.toml` title (via `book.meta.json`) when
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
  /** Within-tome slug; `''` is the tome's own index. */
  slug: string;
  chapter: ChapterNode;
  prev?: ChapterNode;
  next?: ChapterNode;
}

export interface Book {
  /** Directory name under `src/content/books/`. Unique in the library. */
  slug: string;
  title: string | undefined;
  toc: BookToc;
  /** Every linked, non-draft chapter of this tome, in reading order. */
  chapters: ChapterRoute[];
}

/**
 * The within-tome routes for one parsed toc: one per linked, non-draft chapter,
 * in reading order, each carrying its prev/next neighbour for the pager.
 */
export function chapterRoutesFor(toc: BookToc): ChapterRoute[] {
  const chapters = flattenChapters(toc);
  return chapters.map((chapter, i) => ({
    slug: hrefToSlug(chapter.href!),
    chapter,
    prev: chapters[i - 1],
    next: chapters[i + 1],
  }));
}

/** Assemble a {@link Book} from its slug, raw SUMMARY, and meta title. */
export function makeBook(
  slug: string,
  summaryRaw: string,
  metaTitle: string | null | undefined,
): Book {
  const parsed = parseSummary(summaryRaw);
  const title = resolveTitle(metaTitle, parsed.title);
  const toc = title === undefined ? parsed : { ...parsed, title };
  return { slug, title, toc, chapters: chapterRoutesFor(toc) };
}

/** Every tome in the library, sorted by slug for a stable order. */
export function books(): Book[] {
  const out: Book[] = [];
  for (const [key, raw] of Object.entries(summaryRaws)) {
    const slug = slugOfKey(key);
    const meta = bookMetas[key.replace(/SUMMARY\.md$/, 'book.meta.json')];
    out.push(makeBook(slug, raw, meta?.title));
  }
  return out.sort((a, b) => a.slug.localeCompare(b.slug));
}

/**
 * The full route slug for a chapter. Adaptive: with a single tome the reader is
 * the whole site, so chapters sit at the root (`''`/`getting-started`); with
 * several tomes each is namespaced under its slug (`tome`/`tome/getting-started`).
 */
export function pageSlug(bookSlug: string, within: string, multi: boolean): string {
  if (!multi) return within;
  return within === '' ? bookSlug : `${bookSlug}/${within}`;
}

/** A rendered chapter page: its owning tome + within-tome route. */
export interface ChapterPage {
  kind: 'chapter';
  /** Full route slug; `''` is the site index (single-tome root chapter only). */
  routeSlug: string;
  book: Book;
  route: ChapterRoute;
}

/** The library index page (`/`), present only when there is more than one tome. */
export interface BibliothecaPage {
  kind: 'bibliotheca';
  routeSlug: '';
  books: Book[];
}

export type TomePage = ChapterPage | BibliothecaPage;

/**
 * The adaptive page set for the whole library. One tome → its chapters at the
 * root, no Bibliotheca. More than one → every chapter namespaced under its tome
 * slug, plus the Bibliotheca at `/`.
 */
export function tomePages(list: Book[]): TomePage[] {
  const multi = list.length > 1;
  const pages: TomePage[] = [];
  if (multi) pages.push({ kind: 'bibliotheca', routeSlug: '', books: list });
  for (const book of list) {
    for (const route of book.chapters) {
      pages.push({
        kind: 'chapter',
        routeSlug: pageSlug(book.slug, route.slug, multi),
        book,
        route,
      });
    }
  }
  return pages;
}

/** True when a glob key resolves to this chapter's source file within its tome. */
export function isContentKeyFor(
  globKey: string,
  bookSlug: string,
  href: string,
): boolean {
  const clean = href.trim().replace(/^\.\//, '');
  return globKey.endsWith(`content/books/${bookSlug}/${clean}`);
}
