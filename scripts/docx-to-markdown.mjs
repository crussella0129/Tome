// Turn a Word document (.docx) into Markdown that keeps its meaning (INT-0029).
//
// mammoth reads the document into HTML; rehype-remark turns that into Markdown.
// On the way this module holds the rules the two do not: one top heading per
// chapter, real footnotes, a table header, superscript and subscript kept, no
// link that is not a web or mail address, and a mark wherever something that
// carries meaning cannot be carried over (an equation, a chart, an image of a
// kind a browser does not show). It only reads: the caller writes the files.
import { readFile } from 'node:fs/promises';
import { basename, extname } from 'node:path';
import JSZip from 'jszip';
import mammoth from 'mammoth';
import { unified } from 'unified';
import rehypeParse from 'rehype-parse';
import rehypeRemark from 'rehype-remark';
import remarkGfm from 'remark-gfm';
import remarkStringify from 'remark-stringify';
import { SKIP, visit } from 'unist-util-visit';

/** What a chapter reads where something could not be carried over. */
export const MARKS = Object.freeze({
  equation: '[equation not shown]',
  figure: '[figure not shown]',
  image: '[image not shown]',
});

/** The kinds of image a browser shows, by the type Word records for them. */
const IMAGE_KINDS = new Map([
  ['image/png', 'png'],
  ['image/jpeg', 'jpg'],
  ['image/gif', 'gif'],
  ['image/webp', 'webp'],
]);

/** The parts of a Word file that hold its text. */
const TEXT_PARTS = /^word\/(document|footnotes|endnotes)\.xml$/;
/** A drawing whose graphic is a chart or a SmartArt diagram, not a picture. */
const FIGURE_GRAPHIC = /<a:graphicData\b[^>]*\buri="[^"]*\/(?:chart|chartex|diagram)"/;
const TITLE_CLASS = 'tome-title';
const UNSUPPORTED_IMAGE = 'tome-unsupported-image:';
const NOTE_ID = /^(foot|end)note-(\d+)$/;

const run = (text) => `<w:r><w:t xml:space="preserve">${text}</w:t></w:r>`;

/**
 * Replace what the Word reader would drop without a trace by a mark it will
 * carry: equations (Office Math), and drawings that are charts or diagrams.
 * @param {JSZip} zip the opened document, changed in memory only
 */
async function markUnreadable(zip) {
  let equations = 0;
  let figures = 0;
  for (const name of Object.keys(zip.files)) {
    if (!TEXT_PARTS.test(name)) continue;
    const xml = await zip.file(name).async('string');
    const marked = xml
      .replace(/<m:oMathPara\b[^>]*>[\s\S]*?<\/m:oMathPara>/g, () => {
        equations += 1;
        return run(MARKS.equation);
      })
      .replace(/<m:oMath\b[^>]*>[\s\S]*?<\/m:oMath>/g, () => {
        equations += 1;
        return run(MARKS.equation);
      })
      // A drawing sits inside a run, so only its text takes its place.
      .replace(/<w:drawing\b[^>]*>[\s\S]*?<\/w:drawing>/g, (drawing) => {
        if (!FIGURE_GRAPHIC.test(drawing)) return drawing;
        figures += 1;
        return `<w:t xml:space="preserve">${MARKS.figure}</w:t>`;
      });
    if (marked !== xml) zip.file(name, marked);
  }
  return { equations, figures };
}

/** The text of a hast node, tags left out. */
function textOf(node) {
  if (node.type === 'text') return node.value;
  return (node.children ?? []).map(textOf).join('');
}

const isElement = (node, tagName) => node?.type === 'element' && node.tagName === tagName;
const element = (tagName, properties, children) => ({
  type: 'element',
  tagName,
  properties,
  children,
});

/** A note's label: footnotes `1`, `2`, …; endnotes `e1`, `e2`, … so they never meet. */
function noteLabel(id) {
  const match = String(id).match(NOTE_ID);
  if (!match) return null;
  return match[1] === 'end' ? `e${match[2]}` : match[2];
}

/**
 * The Word reader writes a note as a superscript link and gathers the notes in
 * a numbered list at the end, each with a "↑" link back. Make each a footnote
 * reference and a footnote definition instead.
 */
function liftNotes(tree) {
  const definitions = [];
  visit(tree, 'element', (node, index, parent) => {
    if (!parent || index === undefined || node.tagName !== 'ol') return;
    const items = node.children.filter((child) => child.type === 'element');
    const isNoteList =
      items.length > 0 &&
      items.every((item) => item.tagName === 'li' && noteLabel(item.properties?.id));
    if (!isNoteList) return;
    for (const item of items) {
      visit(item, 'element', (child, at, owner) => {
        const href = String(child.properties?.href ?? '');
        if (
          owner &&
          at !== undefined &&
          child.tagName === 'a' &&
          /^#(foot|end)note-ref-/.test(href)
        ) {
          owner.children.splice(at, 1);
          return [SKIP, at];
        }
      });
      definitions.push(
        element('tome-notedef', { label: noteLabel(item.properties.id) }, item.children),
      );
    }
    parent.children.splice(index, 1);
    return [SKIP, index];
  });

  visit(tree, 'element', (node, index, parent) => {
    if (!parent || index === undefined || node.tagName !== 'sup') return;
    const inner = node.children.filter((child) => child.type === 'element');
    if (inner.length !== 1 || inner[0].tagName !== 'a') return;
    const label = noteLabel(String(inner[0].properties?.href ?? '').replace(/^#/, ''));
    if (!label) return;
    parent.children[index] = element('tome-noteref', { label }, []);
  });

  tree.children.push(...definitions);
}

/**
 * One top heading per chapter. With a Title, every other heading moves one
 * level down. Without one, a lone Heading 1 stands; otherwise the fallback
 * name is the top heading, and several Heading 1 all move down beneath it.
 * @returns {string} the chapter's title
 */
function settleHeadings(tree, fallbackTitle) {
  const headings = [];
  visit(tree, 'element', (node) => {
    if (/^h[1-6]$/.test(node.tagName)) headings.push(node);
  });
  const hasClass = (node) => [node.properties?.className ?? []].flat().includes(TITLE_CLASS);
  const title = headings.find((node) => node.tagName === 'h1' && hasClass(node));
  const shiftDown = (nodes) => {
    for (const node of nodes) node.tagName = `h${Math.min(Number(node.tagName[1]) + 1, 6)}`;
  };
  for (const node of headings) if (node.properties) delete node.properties.className;

  if (title) {
    shiftDown(headings.filter((node) => node !== title));
    return textOf(title).trim() || fallbackTitle;
  }
  const tops = headings.filter((node) => node.tagName === 'h1');
  if (tops.length === 1) return textOf(tops[0]).trim() || fallbackTitle;
  if (tops.length > 1) shiftDown(headings);
  tree.children.unshift(element('h1', {}, [{ type: 'text', value: fallbackTitle }]));
  return fallbackTitle;
}

/** The rows of a table, not those of a table nested in one of its cells. */
function rowsOf(table) {
  const rows = [];
  const walk = (node) => {
    for (const child of node.children ?? []) {
      if (isElement(child, 'tr')) rows.push(child);
      else if (child.type === 'element' && child.tagName !== 'table') walk(child);
    }
  };
  walk(table);
  return rows;
}

/** A Word table has no header row of its own: its first row becomes one. */
function headTables(tree) {
  visit(tree, 'element', (node) => {
    if (node.tagName !== 'table') return;
    if (node.children.some((child) => isElement(child, 'thead'))) return;
    const rows = rowsOf(node);
    if (rows.length === 0) return;
    const [first, ...rest] = rows;
    for (const cell of first.children) if (isElement(cell, 'td')) cell.tagName = 'th';
    node.children = [element('thead', {}, [first]), element('tbody', {}, rest)];
  });
}

/**
 * A Markdown table cell holds one line. A Word cell may hold several
 * paragraphs, a list, a quotation or a table of its own, any of which would
 * break the table apart. So each cell's blocks are set on one line with a line
 * break between them: a list's items are marked as text (`• item`, `1. item`,
 * indented when nested), a quotation is its paragraphs, and a nested table is
 * one line to a row with ` / ` between its cells.
 */
function flattenCells(tree) {
  const text = (value) => ({ type: 'text', value });
  const indent = String.fromCharCode(160).repeat(2); // two no-break spaces a level
  const CONTAINERS = new Set(['blockquote', 'div', 'section', 'article']);
  const lines = (nodes, depth, out) => {
    for (const node of nodes) {
      if (node.type === 'text' && !node.value.trim()) continue;
      if (isElement(node, 'p') || /^h[1-6]$/.test(node.tagName ?? '')) {
        out.push(node.children);
      } else if (isElement(node, 'ul') || isElement(node, 'ol')) {
        const items = node.children.filter((child) => isElement(child, 'li'));
        items.forEach((item, i) => {
          const marker = node.tagName === 'ol' ? `${i + 1}. ` : '• ';
          const own = [];
          const nested = [];
          for (const child of item.children) {
            if (isElement(child, 'ul') || isElement(child, 'ol')) nested.push(child);
            else if (isElement(child, 'p')) own.push(...child.children);
            else own.push(child);
          }
          out.push([text(`${indent.repeat(depth)}${marker}`), ...own]);
          lines(nested, depth + 1, out);
        });
      } else if (isElement(node, 'table')) {
        for (const row of rowsOf(node)) {
          const cells = row.children.filter((c) => isElement(c, 'td') || isElement(c, 'th'));
          out.push(
            cells.flatMap((cell, i) => {
              const inner = lines(cell.children, 0, []).flatMap((block, j) =>
                j === 0 ? block : [text(' '), ...block],
              );
              return i === 0 ? inner : [text(' / '), ...inner];
            }),
          );
        }
      } else if (node.type === 'element' && CONTAINERS.has(node.tagName)) {
        lines(node.children, depth, out);
      } else {
        out.push([node]);
      }
    }
    return out;
  };
  visit(tree, 'element', (node) => {
    if (node.tagName !== 'td' && node.tagName !== 'th') return;
    const blocks = lines(node.children, 0, []).filter((block) => block.length > 0);
    node.children = blocks.flatMap((block, i) =>
      i === 0 ? block : [element('tome-br', {}, []), ...block],
    );
    return SKIP;
  });
}

/** Keep a link only when it leads to a web or mail address; else keep its text. */
function plainUnsafeLinks(tree) {
  visit(tree, 'element', (node, index, parent) => {
    if (!parent || index === undefined || node.tagName !== 'a') return;
    const href = node.properties?.href;
    if (typeof href === 'string' && /^(?:https?:|mailto:)/i.test(href.trim())) return;
    parent.children.splice(index, 1, ...node.children);
    return [SKIP, index];
  });
}

/** An image of a kind a browser does not show becomes a mark. */
function markUnsupportedImages(tree) {
  visit(tree, 'element', (node, index, parent) => {
    if (!parent || index === undefined || node.tagName !== 'img') return;
    if (!String(node.properties?.src ?? '').startsWith(UNSUPPORTED_IMAGE)) return;
    parent.children[index] = { type: 'text', value: MARKS.image };
  });
}

/** Superscript and subscript have no Markdown of their own: keep them as HTML. */
const kept = (tag) => (state, node) => [
  { type: 'html', value: `<${tag}>` },
  ...state.all(node),
  { type: 'html', value: `</${tag}>` },
];

const handlers = {
  sup: kept('sup'),
  sub: kept('sub'),
  // A line break inside a table cell (see flattenCells).
  'tome-br': () => ({ type: 'html', value: '<br>' }),
  'tome-noteref': (_state, node) => ({
    type: 'footnoteReference',
    identifier: String(node.properties.label),
    label: String(node.properties.label),
  }),
  'tome-notedef': (state, node) => ({
    type: 'footnoteDefinition',
    identifier: String(node.properties.label),
    label: String(node.properties.label),
    children: state.toFlow(state.all(node)),
  }),
};

/**
 * The reader's messages that do not mean something was left out: a style it
 * has no mapping for, a style a document names but never defines (the text is
 * kept in both cases), and its doubt that a browser can show an image (which
 * is counted as an image, not here). Each is matched by its own wording, so a
 * message that merely holds the word "style" (a font named "Bookman Old
 * Style", a folder named "Style Guide") is still an omission.
 */
const NOT_OMISSIONS = [
  /^Unrecognised (?:paragraph|run|table) style\b/i,
  /\bstyle with ID \S+ was referenced but not defined\b/i,
  /unlikely to display in web browsers/i,
];

/** A reader message that says something was left out. */
function isOmission(message) {
  return !NOT_OMISSIONS.some((pattern) => pattern.test(message));
}

/**
 * How Word's paragraph styles become HTML, beyond the reader's own defaults.
 * The Title heads the chapter (see settleHeadings); Word's quotation styles
 * are block quotations.
 */
const STYLE_MAP = [
  `p[style-name='Title'] => h1.${TITLE_CLASS}:fresh`,
  "p[style-name='Quote'] => blockquote > p:fresh",
  "p[style-name='Intense Quote'] => blockquote > p:fresh",
  "p[style-name='Block Text'] => blockquote > p:fresh",
];

/**
 * Convert one Word document.
 *
 * @param {string | Buffer} input the file's path, or its bytes
 * @param {{ name?: string, fallbackTitle?: string, mediaPath?: string }} [options]
 *   `name` is what messages call the document (default: the path's file name);
 *   `fallbackTitle` heads a document with no usable heading of its own
 *   (default: the name without its extension); `mediaPath` is where the caller
 *   will put the images, as the chapter refers to it (default `.`).
 * @returns {Promise<{
 *   markdown: string,
 *   title: string,
 *   images: { name: string, bytes: Buffer }[],
 *   leftOut: { kind: 'equation' | 'figure' | 'image' | 'other', count: number, detail?: string }[],
 * }>}
 */
export async function convertDocx(input, options = {}) {
  const name = options.name ?? (typeof input === 'string' ? basename(input) : 'document.docx');
  const fallbackTitle = options.fallbackTitle ?? (basename(name, extname(name)) || 'Untitled');
  const mediaPath = (options.mediaPath ?? '.').replace(/\/+$/, '');

  let zip;
  try {
    zip = await JSZip.loadAsync(typeof input === 'string' ? await readFile(input) : input);
    if (!zip.file('word/document.xml')) throw new Error('no word/document.xml');
  } catch (error) {
    throw new Error(
      `${name} could not be read as a Word document (${error instanceof Error ? error.message : error}).`,
    );
  }

  const { equations, figures } = await markUnreadable(zip);
  const images = [];
  const unsupported = new Map();
  let result;
  try {
    result = await mammoth.convertToHtml(
      { buffer: await zip.generateAsync({ type: 'nodebuffer' }) },
      {
        styleMap: STYLE_MAP,
        convertImage: mammoth.images.imgElement(async (image) => {
          const kind = IMAGE_KINDS.get(image.contentType);
          if (!kind) {
            unsupported.set(image.contentType, (unsupported.get(image.contentType) ?? 0) + 1);
            return { src: `${UNSUPPORTED_IMAGE}${image.contentType}` };
          }
          const file = `image-${images.length + 1}.${kind}`;
          images.push({ name: file, bytes: await image.readAsBuffer() });
          return { src: `${mediaPath}/${file}` };
        }),
      },
    );
  } catch (error) {
    throw new Error(
      `${name} could not be read as a Word document (${error instanceof Error ? error.message : error}).`,
    );
  }

  let title = fallbackTitle;
  const file = await unified()
    .use(rehypeParse, { fragment: true })
    .use(() => (tree) => {
      liftNotes(tree);
      title = settleHeadings(tree, fallbackTitle);
      headTables(tree);
      flattenCells(tree);
      plainUnsafeLinks(tree);
      markUnsupportedImages(tree);
    })
    .use(rehypeRemark, { handlers })
    .use(remarkGfm)
    .use(remarkStringify, { bullet: '-', emphasis: '_', rule: '-' })
    .process(result.value);

  const leftOut = [];
  if (equations > 0) leftOut.push({ kind: 'equation', count: equations });
  if (figures > 0) leftOut.push({ kind: 'figure', count: figures });
  for (const [type, count] of unsupported) leftOut.push({ kind: 'image', count, detail: type });
  const others = new Map();
  for (const { message } of result.messages) {
    if (isOmission(message)) others.set(message, (others.get(message) ?? 0) + 1);
  }
  for (const [detail, count] of others) leftOut.push({ kind: 'other', count, detail });

  return { markdown: String(file), title, images, leftOut };
}
