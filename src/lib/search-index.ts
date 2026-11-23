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
 * Tags that sit inside a word or a phrase without parting it: the text on
 * either side of one is one run (`H<sub>2</sub>O` is `H2O`). Every other tag
 * parts what it stands between: `<br>`, `<hr>`, `<img>`, and anything that
 * makes a block (`alpha<br>beta` is two words).
 */
const JOINING_TAGS = new Set([
  'a',
  'abbr',
  'b',
  'bdi',
  'bdo',
  'cite',
  'code',
  'data',
  'del',
  'dfn',
  'em',
  'font',
  'i',
  'ins',
  'kbd',
  'mark',
  'q',
  's',
  'samp',
  'small',
  'span',
  'strong',
  'sub',
  'sup',
  'time',
  'u',
  'var',
  'wbr',
]);

/** Block containers: HTML directly inside one is a block, not part of a line. */
const BLOCK_PARENTS = new Set(['root', 'listItem', 'blockquote', 'footnoteDefinition']);

const TAG = /<[^>]*>/g;
function joins(tag: string): boolean {
  return JOINING_TAGS.has((tag.match(/^<\/?\s*([A-Za-z][\w-]*)/)?.[1] ?? '').toLowerCase());
}

/**
 * The words of raw HTML, its tags left out. A joining tag leaves nothing in
 * its place; any other tag leaves a space, so `<td>a</td><td>b</td>` is two
 * words and `<div>block words</div>` is `block words`.
 */
function htmlWords(value: string): string {
  return value.replace(TAG, (tag) => (joins(tag) ? '' : ' '));
}

/** Stands where a joining tag was within a line, so its neighbours meet. */
const GLUE = String.fromCharCode(0);
const GLUE_WITH_SPACES = new RegExp(` ?${GLUE} ?`, 'g');

/**
 * Concatenate the raw text of an inline subtree (for a heading's own text).
 * Every HTML tag is skipped outright, as Astro skips them when it gives the
 * heading its id, so the slug made here is that id.
 */
function inlineText(node: MdNode): string {
  if (node.type === 'html') return (node.value ?? '').replace(TAG, '');
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
      // The words, never the tags. Within a line, a joining tag alone
      // (`H<sub>2</sub>O`) lets the text either side of it meet; any other tag
      // (`alpha<br>beta`) keeps them apart. A block of HTML stands apart like
      // any other block.
      const value = node.value ?? '';
      const withinLine = parent !== undefined && !BLOCK_PARENTS.has(parent.type);
      const tags = value.match(TAG) ?? [];
      const onlyJoiningTags =
        tags.length > 0 && tags.every(joins) && !value.replace(TAG, '').trim();
      parts.push(withinLine && onlyJoiningTags ? GLUE : htmlWords(value));
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
