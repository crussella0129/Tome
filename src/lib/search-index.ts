import { fromMarkdown } from 'mdast-util-from-markdown';
import GithubSlugger from 'github-slugger';
import { chapterUrlIn } from './paths';
import { isContentKeyFor, type Book } from './book';

/** A heading within a chapter, with the anchor Astro will render for it. */
export interface SearchHeading {
  text: string;
  /** github-slug of the heading text — matches Astro's rendered `id`. */
  slug: string;
  /** 1 for the chapter H1, 2+ for sections. */
  depth: number;
}

/** One searchable chapter: its identity, adaptive URL, headings, and body text. */
export interface SearchRecord {
  tomeSlug: string;
  tomeTitle: string;
  chapterTitle: string;
  /** The reader's adaptive route: `/<chapter>` (one tome) or `/<tome>/<chapter>`. */
  url: string;
  headings: SearchHeading[];
  text: string;
}

/** A minimal structural view of the mdast tree (avoids a hard `mdast` type dep). */
interface MdNode {
  type: string;
  value?: string;
  depth?: number;
  children?: MdNode[];
}

/** Concatenate the raw text of an inline subtree (for a heading's own text). */
function inlineText(node: MdNode): string {
  if (typeof node.value === 'string') return node.value;
  return (node.children ?? []).map(inlineText).join('');
}

function collapseWhitespace(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

/**
 * Parse a chapter's Markdown into `{ text, headings }`. Headings are slugged in
 * document order (including the H1) by one github-slugger, so dedupe suffixes
 * (`-1`, `-2`) match Astro's per-page `id`s. Fenced code blocks are excluded from
 * the searchable text; inline code is kept.
 */
export function parseChapter(raw: string): { text: string; headings: SearchHeading[] } {
  const tree = fromMarkdown(raw) as unknown as MdNode;
  const slugger = new GithubSlugger();
  const headings: SearchHeading[] = [];
  const parts: string[] = [];

  const walk = (node: MdNode): void => {
    if (node.type === 'code') return; // skip fenced code entirely
    if (node.type === 'heading') {
      const text = inlineText(node);
      headings.push({ text, slug: slugger.slug(text), depth: node.depth ?? 1 });
      parts.push(text);
      return; // heading text captured; don't descend again
    }
    if (typeof node.value === 'string') {
      parts.push(node.value); // text, inlineCode
      return;
    }
    for (const child of node.children ?? []) walk(child);
  };
  walk(tree);

  return { text: collapseWhitespace(parts.join(' ')), headings };
}

/**
 * Build the search index for the whole library. One record per linked, non-draft
 * chapter, with the reader's adaptive URL. `rawByKey` maps a Vite glob key
 * (`../content/books/<tome>/<file>.md`) to that file's raw Markdown.
 */
export function buildSearchIndex(
  library: Book[],
  rawByKey: Record<string, string>,
): SearchRecord[] {
  const multi = library.length > 1;
  const records: SearchRecord[] = [];
  for (const book of library) {
    for (const route of book.chapters) {
      const href = route.chapter.href!;
      const entry = Object.entries(rawByKey).find(([key]) =>
        isContentKeyFor(key, book.slug, href),
      );
      const { text, headings } = parseChapter(entry?.[1] ?? '');
      records.push({
        tomeSlug: book.slug,
        tomeTitle: book.title ?? book.slug,
        chapterTitle: route.chapter.title,
        url: chapterUrlIn(multi ? book.slug : '', href),
        headings,
        text,
      });
    }
  }
  return records;
}
