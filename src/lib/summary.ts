import type {
  BookToc,
  ChapterNode,
  TocNode,
  TocSection,
} from './summary.types';

/** A markdown link on its own: `[title](href)`; href may be empty (draft). */
const LINK_RE = /^\[([^\]]*)\]\(([^)]*)\)$/;
/** A list item: `-`/`*`/`+` marker then a link. Leading indent captured. */
const LIST_ITEM_RE = /^(\s*)[-*+]\s+\[([^\]]*)\]\(([^)]*)\)\s*$/;
/** A heading line: one-or-more `#` then text. */
const HEADING_RE = /^(#{1,6})\s+(.*\S)\s*$/;
/** A thematic break: three or more `-`, `*`, or `_`. */
const SEPARATOR_RE = /^(?:-{3,}|\*{3,}|_{3,})$/;

/** Expand leading tabs to 4 spaces so indent math is uniform. */
function normalizeIndent(raw: string): string {
  return raw.replace(/\t/g, '    ');
}

function makeChapter(
  title: string,
  rawHref: string,
  section: TocSection,
  depth: number,
): ChapterNode {
  const href = rawHref.trim();
  return {
    kind: 'chapter',
    title: title.trim(),
    href: href.length > 0 ? href : undefined,
    draft: href.length === 0,
    section,
    depth,
    children: [],
  };
}

/**
 * Parse an mdBook `SUMMARY.md` into a {@link BookToc}.
 *
 * Pure and DOM-free. Recognizes: a leading title heading, prefix chapters,
 * part-title headings, a nested numbered chapter list (with draft entries),
 * separators, and suffix chapters. Unknown lines (prose, the mdBook
 * `# Summary` body, stray text) are ignored.
 */
export function parseSummary(markdown: string): BookToc {
  const lines = markdown.split(/\r?\n/);
  const nodes: TocNode[] = [];
  let title: string | undefined;
  let sawTitle = false;
  // Once the numbered section begins (first list item or part title), further
  // top-level links are suffix rather than prefix.
  let enteredNumbered = false;

  // Ancestor stack for numbered-chapter nesting, ordered shallow → deep.
  const stack: Array<{ indent: number; node: ChapterNode }> = [];

  const pushNumbered = (indent: number, node: ChapterNode): void => {
    // Pop ancestors that are as deep or deeper than this item.
    while (stack.length > 0 && stack[stack.length - 1]!.indent >= indent) {
      stack.pop();
    }
    const parent = stack[stack.length - 1];
    if (parent) {
      node.depth = parent.node.depth + 1;
      parent.node.children.push(node);
    } else {
      node.depth = 0;
      nodes.push(node);
    }
    stack.push({ indent, node });
  };

  for (const rawLine of lines) {
    const line = normalizeIndent(rawLine);
    const trimmed = line.trim();
    if (trimmed.length === 0) continue;

    // Numbered list item (possibly nested, possibly draft).
    const listMatch = line.match(LIST_ITEM_RE);
    if (listMatch) {
      enteredNumbered = true;
      const indent = listMatch[1]!.length;
      const node = makeChapter(listMatch[2]!, listMatch[3]!, 'numbered', 0);
      pushNumbered(indent, node);
      continue;
    }

    // Separator.
    if (SEPARATOR_RE.test(trimmed)) {
      stack.length = 0;
      nodes.push({ kind: 'separator' });
      continue;
    }

    // Heading: first one is the book title, the rest are part titles.
    const headingMatch = trimmed.match(HEADING_RE);
    if (headingMatch) {
      if (!sawTitle) {
        sawTitle = true;
        title = headingMatch[2]!.trim();
      } else {
        enteredNumbered = true;
        stack.length = 0;
        nodes.push({ kind: 'part-title', title: headingMatch[2]!.trim() });
      }
      continue;
    }

    // Bare top-level link: prefix (before numbered) or suffix (after).
    const linkMatch = trimmed.match(LINK_RE);
    if (linkMatch) {
      const section: TocSection = enteredNumbered ? 'suffix' : 'prefix';
      nodes.push(makeChapter(linkMatch[1]!, linkMatch[2]!, section, 0));
      continue;
    }

    // Anything else (prose, list intros) is ignored.
  }

  return title === undefined ? { nodes } : { title, nodes };
}

/**
 * Flatten a {@link BookToc} into linked chapters in reading order
 * (prefix → numbered depth-first → suffix), dropping drafts, separators, and
 * part titles. Useful for building routes and prev/next movement.
 */
export function flattenChapters(toc: BookToc): ChapterNode[] {
  const out: ChapterNode[] = [];
  const walk = (node: TocNode): void => {
    if (node.kind !== 'chapter') return;
    if (!node.draft && node.href) out.push(node);
    for (const child of node.children) walk(child);
  };
  for (const node of toc.nodes) walk(node);
  return out;
}
