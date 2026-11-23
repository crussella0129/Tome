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
 * Tags that sit inside a word or a phrase without parting it (`H<sub>2</sub>O`
 * is the word `H2O`). Every other tag parts what it stands between: `<br>`,
 * `<hr>`, `<img>`, a comment, and anything that makes a block.
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

/**
 * One HTML tag or comment, whole: a `>` inside a quoted attribute or inside a
 * comment does not end it.
 */
const TAG_SOURCE = `<!--[\\s\\S]*?-->|</?[A-Za-z][^\\s>/]*(?:"[^"]*"|'[^']*'|[^'">])*>`;
const TAG = new RegExp(TAG_SOURCE, 'g');
const SINGLE_TAG = new RegExp(`^(?:${TAG_SOURCE})$`);

function tagName(tag: string): string {
  return (tag.match(/^<\/?([A-Za-z][^\s>/]*)/)?.[1] ?? '').toLowerCase();
}
const joins = (tag: string): boolean => JOINING_TAGS.has(tagName(tag));

/**
 * The words of a block of raw HTML, its tags left out. A joining tag leaves
 * nothing in its place; any other tag leaves a space, so `<td>a</td><td>b</td>`
 * is two words and `<div>H<sub>2</sub>O</div>` is `H2O`.
 */
function htmlWords(value: string): string {
  return value.replace(TAG, (tag) => (joins(tag) ? '' : ' '));
}

function collapseWhitespace(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

/**
 * The text Astro slugs for a heading's `id`: every text and inline-code value,
 * joined as they stand, with a raw HTML node skipped whole when it is one tag
 * (the rule in Astro's own heading collector). A line break adds nothing. The
 * slug made from this is the `id` on the built page.
 */
function slugText(node: MdNode): string {
  if (node.type === 'html') return /^\n?<.*>\n?$/.test(node.value ?? '') ? '' : (node.value ?? '');
  if (typeof node.value === 'string') return node.value;
  return (node.children ?? []).map(slugText).join('');
}

/**
 * A heading's words, for reading and for search. As `slugText`, but a line
 * break and any tag that is not a joining tag keep the words either side
 * apart, so both halves of `Alpha<br>Beta` can be found.
 */
function headingWords(node: MdNode): string {
  if (node.type === 'break') return ' ';
  if (node.type === 'html') return htmlWords(node.value ?? '');
  if (typeof node.value === 'string') return node.value;
  return (node.children ?? []).map(headingWords).join('');
}

// What a line of a chapter is gathered into before it is joined: runs of text,
// the opening and closing of a joining tag, and separators.
const OPEN = Symbol('a joining tag opens');
const CLOSE = Symbol('a joining tag closes');
const SEPARATOR = Symbol('the words either side are apart');
type Part = string | symbol;

/**
 * Join the gathered parts into text. Runs of text are set apart by a space, as
 * they always were. The one exception: text hard against a joining tag joins
 * what the tag holds (`x<sup>2</sup>` is `x2`), and what follows the tag joins
 * on in turn only if that first join happened (`H<sub>2</sub>O` is `H2O`, but
 * `<sup>a</sup>Corresponding` is `a Corresponding`: nothing stood before the
 * tag, so the word after it is left whole to be found). A separator ends every
 * join.
 */
function joinParts(parts: Part[]): string {
  const out: string[] = [];
  const open: boolean[] = [];
  let attach = false; // the next run continues the last with no space between
  let inLine = false; // a run has been seen since the last separator
  for (const part of parts) {
    if (part === SEPARATOR) {
      attach = false;
      inLine = false;
      open.length = 0;
    } else if (part === OPEN) {
      // Only a letter or a digit hard before the tag makes a word of the two:
      // `(<sup>a</sup>Corresponding` and `,<sup>2</sup>Department` do not join.
      const joined = inLine && /[\p{L}\p{N}]$/u.test(out[out.length - 1] ?? '');
      open.push(joined);
      attach = joined;
    } else if (part === CLOSE) {
      attach = open.pop() ?? false;
    } else if (typeof part === 'string') {
      if (attach && out.length > 0 && /^\S/.test(part)) out[out.length - 1] += part;
      else out.push(part);
      attach = false;
      inLine = true;
    }
  }
  return collapseWhitespace(out.join(' '));
}

/**
 * Parse a chapter's Markdown into `{ text, headings }`. Headings are slugged in
 * document order (including the H1) by one github-slugger, so dedupe suffixes
 * (`-1`, `-2`) match Astro's per-page `id`s. Fenced code blocks are excluded from
 * the searchable text; inline code is kept. HTML tags are never text: a tag
 * inside a word joins it (`H<sub>2</sub>O` is found as `H2O`), and any other
 * tag, or a line break, keeps its neighbours apart.
 */
export function parseChapter(raw: string): { text: string; headings: SearchHeading[] } {
  const tree = fromMarkdown(raw) as unknown as MdNode;
  const slugger = new GithubSlugger();
  const headings: SearchHeading[] = [];
  const parts: Part[] = [];

  const walk = (node: MdNode, parent?: MdNode): void => {
    if (node.type === 'code') return; // skip fenced code entirely
    if (node.type === 'heading') {
      const forSlug = slugText(node);
      const words = headingWords(node);
      // A heading with no tag and no line break reads exactly as it is slugged.
      const text = words === forSlug ? forSlug : collapseWhitespace(words);
      headings.push({ text, slug: slugger.slug(forSlug), depth: node.depth ?? 1 });
      parts.push(SEPARATOR, text, SEPARATOR);
      return; // heading text captured; don't descend again
    }
    if (node.type === 'break') {
      parts.push(SEPARATOR); // a line break parts the words either side of it
      return;
    }
    if (node.type === 'html') {
      const value = node.value ?? '';
      const withinLine = parent !== undefined && !BLOCK_PARENTS.has(parent.type);
      const tag = value.trim();
      if (withinLine && SINGLE_TAG.test(tag) && joins(tag)) {
        // `<sup>` opens, `</sup>` closes; `<wbr>` and `<x/>` do both at once.
        const closes = tag.startsWith('</');
        const alone = tag.endsWith('/>') || tagName(tag) === 'wbr';
        if (!closes) parts.push(OPEN);
        if (closes || alone) parts.push(CLOSE);
      } else {
        // Any other tag within a line, and every block of HTML, stands apart.
        parts.push(SEPARATOR, htmlWords(value), SEPARATOR);
      }
      return;
    }
    if (typeof node.value === 'string') {
      parts.push(node.value); // text, inlineCode
      return;
    }
    // A paragraph is a line of its own: nothing joins across its ends.
    if (node.type === 'paragraph') parts.push(SEPARATOR);
    for (const child of node.children ?? []) walk(child, node);
    if (node.type === 'paragraph') parts.push(SEPARATOR);
  };
  walk(tree);

  return { text: joinParts(parts), headings };
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
      const entry = Object.entries(rawByKey).find(([key]) => isContentKeyFor(key, book.slug, href));
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
