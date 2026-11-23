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

/**
 * The words of a raw HTML node, its tags left out. Within a line a tag is a
 * node of its own (`<sup>`), so nothing is left; a block keeps what its tags
 * enclose (`<div>words</div>` → `words`).
 */
function htmlWords(value: string): string {
  return value.replace(/<[^>]*>/g, '');
}

/** Stands where a tag within a line was, so its neighbours join without a space. */
const GLUE = String.fromCharCode(0);
const GLUE_WITH_SPACES = new RegExp(` ?${GLUE} ?`, 'g');

/**
 * Concatenate the raw text of an inline subtree (for a heading's own text).
 * HTML tags are skipped, as Astro skips them when it gives the heading its id.
 */
function inlineText(node: MdNode): string {
  if (node.type === 'html') return htmlWords(node.value ?? '');
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
 * the searchable text; inline code is kept. HTML tags are left out of both the
 * text and a heading's own text, so `H<sub>2</sub>O` is found as its words.
 */
export function parseChapter(raw: string): { text: string; headings: SearchHeading[] } {
  const tree = fromMarkdown(raw) as unknown as MdNode;
  const slugger = new GithubSlugger();
  const headings: SearchHeading[] = [];
  const parts: string[] = [];

  const walk = (node: MdNode, parent?: MdNode): void => {
    if (node.type === 'code') return; // skip fenced code entirely
    if (node.type === 'heading') {
      const text = inlineText(node);
      headings.push({ text, slug: slugger.slug(text), depth: node.depth ?? 1 });
      parts.push(text);
      return; // heading text captured; don't descend again
    }
    if (node.type === 'html') {
      // The words, never the tags. A tag within a line (`H<sub>2</sub>O`) joins
      // the text on either side of it, as it does in a heading; a block of HTML
      // stands apart like any other block.
      const words = htmlWords(node.value ?? '');
      parts.push(parent && parent.type !== 'root' && !words.trim() ? GLUE : words);
      return;
    }
    if (typeof node.value === 'string') {
      parts.push(node.value); // text, inlineCode
      return;
    }
    const start = parts.length;
    for (const child of node.children ?? []) walk(child, node);
    if (node.type === 'paragraph') {
      // A tag at either end of a paragraph has no neighbour in it to join, and
      // must not join this paragraph to the block before or after.
      while (parts.length > start && parts[parts.length - 1] === GLUE) parts.pop();
      while (parts.length > start && parts[start] === GLUE) parts.splice(start, 1);
    }
  };
  walk(tree);

  const joined = parts.join(' ').replace(GLUE_WITH_SPACES, '');
  return { text: collapseWhitespace(joined), headings };
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
