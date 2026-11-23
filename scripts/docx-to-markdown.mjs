// Turn a Word document (.docx) into Markdown that keeps its meaning (INT-0029).
//
// mammoth reads the document into HTML; rehype-remark turns that into Markdown.
// On the way this module holds the rules the two do not: one top heading per
// chapter, real footnotes, a table header, superscript and subscript kept, no
// link that is not a web or mail address, an equation carried over as LaTeX
// notation (INT-0030), and a mark wherever something that carries meaning
// cannot be carried over (an equation the converter does not know, a chart, an
// image of a kind a browser does not show). It only reads: the caller writes
// the files.
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
import { ommlToLatex } from './omml-to-latex.mjs';
import { readable, titleText } from './rehype-math.mjs';

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
 * What stands for a carried-over equation between the document's XML and the
 * finished Markdown: letters and digits only, so the Word reader and the
 * Markdown writer both carry it untouched.
 */
const EQUATION_TOKEN = /tomeEquation(\d+)carried/g;
const equationToken = (index) => `tomeEquation${index}carried`;

/**
 * Replace what the Word reader would drop without a trace by something it will
 * carry: an equation (Office Math) by a token that stands for its LaTeX, or by
 * a mark when the converter does not know it; a drawing that is a chart or a
 * diagram by a mark.
 * @param {JSZip} zip the opened document, changed in memory only
 * @returns {Promise<{ equations: number, figures: number, carried: { latex: string, display: boolean, cell: boolean }[] }>}
 *   `equations` counts those left out; `carried` holds the LaTeX of the rest,
 *   by the number in each token.
 */
async function markUnreadable(zip) {
  let equations = 0;
  let figures = 0;
  const carried = [];
  const equation = (xml) => {
    // Laid out once here: LaTeX the layout engine refuses is never written.
    const latex = ommlToLatex(xml, { readable });
    if (latex === null) {
      equations += 1;
      return run(MARKS.equation);
    }
    carried.push({ latex, display: false, cell: false });
    return run(equationToken(carried.length - 1));
  };
  for (const name of Object.keys(zip.files)) {
    if (!TEXT_PARTS.test(name)) continue;
    const xml = await zip.file(name).async('string');
    const marked = xml
      .replace(/<m:oMathPara\b[^>]*>[\s\S]*?<\/m:oMathPara>/g, equation)
      .replace(/<m:oMath\b[^>]*>[\s\S]*?<\/m:oMath>/g, equation)
      // A drawing sits inside a run, so only its text takes its place.
      .replace(/<w:drawing\b[^>]*>[\s\S]*?<\/w:drawing>/g, (drawing) => {
        if (!FIGURE_GRAPHIC.test(drawing)) return drawing;
        figures += 1;
        return `<w:t xml:space="preserve">${MARKS.figure}</w:t>`;
      });
    if (marked !== xml) zip.file(name, marked);
  }
  return { equations, figures, carried };
}

/**
 * Where each carried-over equation stands, which decides how it is written: one
 * that is a paragraph of its own is set apart; one in a table cell must not
 * hold a `|`, which would end the cell.
 * @param {any} tree the document as HTML
 * @param {{ latex: string, display: boolean, cell: boolean }[]} carried
 */
function placeEquations(tree, carried) {
  if (carried.length === 0) return;
  const tokens = (text) => [...text.matchAll(EQUATION_TOKEN)].map((match) => Number(match[1]));
  const walk = (node, inCell, inHeading) => {
    if (node.type === 'text') {
      for (const index of tokens(node.value)) if (inCell) carried[index].cell = true;
      return;
    }
    if (node.type !== 'element' && node.type !== 'root') return;
    const cell = inCell || node.tagName === 'td' || node.tagName === 'th';
    const heading = inHeading || /^h[1-6]$/.test(node.tagName ?? '');
    // A paragraph that is one equation and nothing else; a list item's one
    // paragraph is written as the item itself.
    if ((node.tagName === 'p' || node.tagName === 'li') && !cell && !heading) {
      const text = textOf(node).trim();
      const only = tokens(text);
      if (only.length === 1 && text === equationToken(only[0])) carried[only[0]].display = true;
    }
    for (const child of node.children ?? []) walk(child, cell, heading);
  };
  walk(tree, false, false);
}

/**
 * A carried-over equation as the Markdown holds it, written so that Tome's own
 * reader (remark-math-dollars.mjs) reads exactly this LaTeX back.
 * @param {{ latex: string, display: boolean, cell: boolean }} equation
 * @param {string | undefined} next the character that follows it in the Markdown
 */
function dollarForm(equation, next) {
  // In a table cell a `|` ends the cell, whatever stands round it.
  const latex = equation.cell ? equation.latex.replaceAll('|', '\\vert ') : equation.latex;
  // Single dollar signs refuse a formula that holds a dollar sign, a backtick,
  // `](` or `://`, and one followed by a digit; two dollar signs take all of
  // those. A formula that ends in a dollar sign is kept clear of the two that
  // close it by a space.
  const single =
    !equation.display &&
    !/[$`]/.test(latex) &&
    !latex.includes('](') &&
    !latex.includes('://') &&
    !/\d/.test(next ?? '');
  if (single) return `$${latex}$`;
  // A space each side is dropped again by the reader, as for inline code.
  return latex.endsWith('$') ? `$$ ${latex} $$` : `$$${latex}$$`;
}

/** Exchange each token in a finished Markdown document for its equation. */
function writeEquations(markdown, carried) {
  return markdown.replace(EQUATION_TOKEN, (token, index, offset) =>
    dollarForm(carried[Number(index)], markdown[offset + token.length]),
  );
}

/**
 * A title is plain text: a sidebar and a tab cannot show a formula. An equation
 * in it is written on one line that keeps what it says (`√2`), or, where it has
 * no such form, between dollar signs as the chapter has it.
 */
function titleWithEquations(title, carried) {
  return title.replace(EQUATION_TOKEN, (token, index) => {
    const { latex } = carried[Number(index)];
    return titleText(latex) ?? `$${latex}$`;
  });
}

/**
 * The text of a hast node, tags left out. A line break counts as a space, so a
 * title set over two lines ("On the Weight⏎of Obsidian") keeps its words apart.
 */
function textOf(node) {
  if (node.type === 'text') return node.value;
  if (isElement(node, 'br')) return ' ';
  return (node.children ?? []).map(textOf).join('');
}
const oneLine = (text) => text.replace(/\s+/g, ' ').trim();

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
  // A heading inside a table is not a heading of the chapter: a table cell
  // holds one line, so it becomes that cell's text (flattenCells). Only the
  // headings outside tables are settled here.
  const headings = [];
  const inTables = [];
  const gather = (node, inTable) => {
    for (const child of node.children ?? []) {
      if (child.type !== 'element') continue;
      if (/^h[1-6]$/.test(child.tagName)) (inTable ? inTables : headings).push(child);
      gather(child, inTable || child.tagName === 'table');
    }
  };
  gather(tree, false);
  const hasClass = (node) => [node.properties?.className ?? []].flat().includes(TITLE_CLASS);
  const isTitle = (node) => node.tagName === 'h1' && hasClass(node);
  const title = headings.find(isTitle);
  // A Title set inside a table (a cover laid out as one) still names the
  // chapter: its words head the chapter, and stay in the table as they were.
  const coverTitle = title ? undefined : inTables.find(isTitle);
  const shiftDown = (nodes) => {
    for (const node of nodes) node.tagName = `h${Math.min(Number(node.tagName[1]) + 1, 6)}`;
  };
  for (const node of [...headings, ...inTables]) {
    if (node.properties) delete node.properties.className;
  }
  const head = (text) => {
    tree.children.unshift(element('h1', {}, [{ type: 'text', value: text }]));
    return text;
  };

  if (title) {
    shiftDown(headings.filter((node) => node !== title));
    return oneLine(textOf(title)) || fallbackTitle;
  }
  if (coverTitle && oneLine(textOf(coverTitle))) {
    shiftDown(headings);
    return head(oneLine(textOf(coverTitle)));
  }
  const tops = headings.filter((node) => node.tagName === 'h1');
  if (tops.length === 1) return oneLine(textOf(tops[0])) || fallbackTitle;
  if (tops.length > 1) shiftDown(headings);
  return head(fallbackTitle);
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
      i === 0 ? block : [element('br', {}, []), ...block],
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
  // A line break is written `<br>`, in a paragraph, a heading or a table cell
  // alike. Markdown's own break (a backslash before the line's end) cannot be
  // written inside a table cell or a heading, and beside kept HTML it came out
  // as a stray backslash with the break lost.
  br: () => ({ type: 'html', value: '<br>' }),
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
  /\bstyle with ID .+? was referenced but not defined\b/i,
  /unlikely to display in web browsers/i,
  // A bookmark between two rows or cells: the table is converted whole.
  /^unexpected non-(?:row|cell) element in table(?: row)?, cell merging may be incorrect$/i,
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
  // The reader drops a page or column break unless told otherwise, which runs
  // the words either side of it together. Keep each as a line break.
  "br[type='page'] => br",
  "br[type='column'] => br",
];

/**
 * A heading is one line: a line break inside it becomes a space. Kept as
 * `<br>`, the break would be skipped when the page reads the heading's text,
 * and "The Quarry⏎Northern Face" would be listed as "The QuarryNorthern Face".
 */
function unbreakHeadings(tree) {
  visit(tree, 'element', (node) => {
    if (!/^h[1-6]$/.test(node.tagName)) return;
    visit(node, 'element', (child, index, parent) => {
      if (!parent || index === undefined || child.tagName !== 'br') return;
      parent.children[index] = { type: 'text', value: ' ' };
    });
  });
}

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

  const { equations, figures, carried } = await markUnreadable(zip);
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
      unbreakHeadings(tree);
      title = settleHeadings(tree, fallbackTitle);
      headTables(tree);
      flattenCells(tree);
      plainUnsafeLinks(tree);
      markUnsupportedImages(tree);
      placeEquations(tree, carried);
    })
    .use(rehypeRemark, { handlers })
    .use(remarkGfm)
    .use(remarkStringify, {
      bullet: '-',
      emphasis: '_',
      rule: '-',
      // Tome reads `$…$` as a formula (INT-0030). A dollar sign the document's
      // own text holds is written `\$`, so the only bare ones in the result
      // are those round an equation.
      unsafe: [{ character: '$', inConstruct: 'phrasing' }],
    })
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

  return {
    markdown: writeEquations(String(file), carried),
    title: titleWithEquations(title, carried),
    images,
    leftOut,
  };
}
