// Lays each formula out when the library is built (INT-0030). The Markdown
// reader (remark-math-dollars.mjs) hands a formula on as `code.language-math`;
// this turns it into the browser's own mathematics (MathML), written by Temml,
// so the page a reader loads holds the finished equation and no script.
//
// Four things here are for Safari's engine (WebKit), each found and tested in
// Sprint 25's research and plan reviews:
//  - Temml's option to keep the LaTeX source inside the formula is left off:
//    WebKit does not paint a table of formulas inside that wrapper.
//  - A set-apart formula sits in a wrapper that is a size container, and a
//    numbered formula's table takes its width in container units: WebKit gives
//    a percent width nothing inside a grid or flex item, and the reader is one.
//  - Equation numbers are written in here, counted down the page: the wrapper
//    would start a stylesheet counter afresh at every formula.
//  - A long formula within a line gets a box of its own: Chrome's engine breaks
//    it at Temml's soft breaks, WebKit breaks no formula, so there it scrolls.
import { fromHtml } from 'hast-util-from-html';
import { toString } from 'hast-util-to-string';
import temml from 'temml';
import { SKIP, visit } from 'unist-util-visit';
import { UNCLOSED } from './remark-math-dollars.mjs';

/** How much of an unreadable formula a message quotes. */
const QUOTED = 60;
/** Past this many characters of laid-out text, a formula within a line is "long". */
const LONG = 30;

/**
 * Temml's MathML for a formula, or `null` when it cannot be laid out. Commands
 * that could reach outside the formula (`\href`, `\includegraphics`, `\class`)
 * are refused by Temml unless trusted, and are never trusted here.
 * @param {string} tex
 * @param {boolean} display
 * @returns {string | null}
 */
function mathml(tex, display) {
  let markup;
  try {
    markup = temml.renderToString(tex, {
      displayMode: display,
      throwOnError: true,
      // A long formula within a line may break after a relation or an
      // operator, as TeX breaks one, so it cannot widen a narrow page.
      ...(display ? {} : { wrap: 'tex' }),
    });
  } catch {
    return null;
  }
  // A reference to an equation's number (`\ref`, `\eqref`) comes out as an
  // empty link for a script to fill in. Tome runs none, so it is not offered.
  return markup.includes('tml-ref') ? null : markup;
}

/**
 * The `math` element for a formula, as Temml writes it, or `null`.
 * @param {string} tex
 * @param {boolean} display
 * @returns {any | null}
 */
function mathElement(tex, display) {
  const markup = mathml(tex, display);
  if (markup === null) return null;
  const fragment = fromHtml(markup, { fragment: true });
  return fragment.children.find((child) => child.type === 'element') ?? null;
}

/** @param {any} node @returns {string[]} */
const classes = (node) =>
  Array.isArray(node?.properties?.className) ? node.properties.className : [];
/** Whether a table cell holds a row's number or its tag. @param {any} cell */
function holdsNumber(cell) {
  let found = false;
  visit(cell, 'element', (inner) => {
    if (classes(inner).includes('tml-eqn') || classes(inner).includes('tml-tag')) found = true;
  });
  return found;
}

/**
 * Whether a formula can be laid out, within a line or set apart. A numbered
 * environment and `\tag` are read only set apart.
 * @param {string} tex
 * @param {boolean} [display]
 */
export function readable(tex, display = false) {
  return mathml(tex, display) !== null;
}

/**
 * The text of a formula as laid out, nothing between its parts: `E = mc^2` is
 * `E=mc2`. It is what the page's heading collector reads from the same
 * elements, and what search finds a formula by. A row's number or tag is no
 * part of it. `null` when the formula cannot be laid out.
 * @param {string} tex
 * @param {boolean} [display]
 * @returns {string | null}
 */
export function formulaText(tex, display = false) {
  const math = mathElement(tex, display);
  if (math === null) return null;
  visit(math, 'element', (node, index, parent) => {
    if (node.tagName !== 'mtd' || !parent || index === undefined || !holdsNumber(node)) return;
    parent.children.splice(index, 1);
    return index;
  });
  return toString(math);
}

/**
 * A formula as it was typed, dollar signs and all: what the page shows for one
 * it cannot lay out, and what search holds for it.
 * @param {string} tex
 * @param {boolean} display
 */
export function asTyped(tex, display) {
  return display ? `$$${tex}$$` : `$${tex}$`;
}

// --- A formula on one line of plain text ------------------------------------

const SUPERSCRIPT = new Map(
  Object.entries({
    0: '⁰',
    1: '¹',
    2: '²',
    3: '³',
    4: '⁴',
    5: '⁵',
    6: '⁶',
    7: '⁷',
    8: '⁸',
    9: '⁹',
    '+': '⁺',
    '-': '⁻',
    '−': '⁻',
    '=': '⁼',
    '(': '⁽',
    ')': '⁾',
    n: 'ⁿ',
    i: 'ⁱ',
  }),
);
const SUBSCRIPT = new Map(
  Object.entries({
    0: '₀',
    1: '₁',
    2: '₂',
    3: '₃',
    4: '₄',
    5: '₅',
    6: '₆',
    7: '₇',
    8: '₈',
    9: '₉',
    '+': '₊',
    '-': '₋',
    '−': '₋',
    '=': '₌',
    '(': '₍',
    ')': '₎',
    a: 'ₐ',
    e: 'ₑ',
    i: 'ᵢ',
    j: 'ⱼ',
    k: 'ₖ',
    m: 'ₘ',
    n: 'ₙ',
    o: 'ₒ',
    t: 'ₜ',
    x: 'ₓ',
  }),
);
/** Signs set with a space either side. */
const RELATIONS = new Set([...'=<>≤≥≠≈≡∼≃≅→←↔⇒⇐⇔∈∉⊂⊆⊃⊇∝']);
/** Characters Temml writes that show nothing (a function applied, an unseen times). */
const INVISIBLE = new RegExp(
  `[${String.fromCharCode(0x2061)}-${String.fromCharCode(0x2064)}]`,
  'g',
);
/** Elements that only group what they hold. */
const GROUPS = new Set(['math', 'mrow', 'mstyle', 'mpadded']);
/** Elements after which a number must be parted from them. */
const PARTED = new Set(['msqrt', 'mroot', 'mfrac']);

/** Thrown for a layout with no honest one-line form; never leaves this file. */
class NoPlainForm extends Error {}

/** @param {any} node @returns {any[]} */
const elementsOf = (node) =>
  node.children.filter((/** @type {any} */ child) => child.type === 'element');

/** Whether a part is one token: a letter, a symbol or a number of any length. @param {any} node */
function single(node) {
  if (node.type !== 'element') return false;
  if (['mi', 'mn', 'mo'].includes(node.tagName)) return true;
  const held = elementsOf(node);
  return GROUPS.has(node.tagName) && held.length === 1 && single(held[0]);
}

/** Whether text already stands in one pair of round brackets. @param {string} text */
function bracketed(text) {
  if (!text.startsWith('(') || !text.endsWith(')')) return false;
  let depth = 0;
  for (let index = 0; index < text.length; index += 1) {
    if (text[index] === '(') depth += 1;
    if (text[index] === ')') depth -= 1;
    if (depth === 0 && index < text.length - 1) return false;
  }
  return true;
}

/** @param {string} text */
const inBrackets = (text) => ([...text].length <= 1 || bracketed(text) ? text : `(${text})`);

/**
 * A part of a root, a fraction, a power or an index: in brackets unless it is
 * one token, so that it is never run together with what stands beside it.
 * @param {any} node
 */
function part(node) {
  const text = plain(node).trim();
  return single(node) ? text : inBrackets(text);
}

/**
 * An exponent or an index: raised or lowered where Unicode has every character
 * of it, and written after `^` or `_` where it has not.
 * @param {any} node
 * @param {Map<string, string>} table
 * @param {string} mark
 */
function raised(node, table, mark) {
  const text = plain(node).trim();
  const characters = [...text];
  if (characters.length > 0 && characters.every((character) => table.has(character))) {
    return characters.map((character) => table.get(character)).join('');
  }
  return `${mark}${single(node) ? text : inBrackets(text)}`;
}

/** What a grouping element holds, in order. @param {any} node @returns {string} */
function row(node) {
  let out = '';
  let previous = '';
  for (const child of node.children) {
    const text = plain(child);
    // `\sqrt{2}3` is not `\sqrt{23}`: a number after a root or a fraction is
    // parted from it.
    if (PARTED.has(previous) && /^\d/.test(text)) out += '·';
    out += text;
    if (child.type === 'element') {
      const held = GROUPS.has(child.tagName) ? elementsOf(child) : [];
      previous = held.length > 0 ? held[held.length - 1].tagName : child.tagName;
    }
  }
  return out;
}

/** @param {any} node @returns {string} */
function plain(node) {
  if (node.type === 'text') return node.value.replace(INVISIBLE, '');
  if (node.type !== 'element') return '';
  if (GROUPS.has(node.tagName)) return row(node);
  const held = elementsOf(node);
  switch (node.tagName) {
    case 'mi':
    case 'mn':
    case 'mtext':
      return toString(node).replace(INVISIBLE, '');
    case 'mo': {
      const sign = toString(node).replace(INVISIBLE, '');
      return RELATIONS.has(sign) ? ` ${sign} ` : sign;
    }
    case 'mspace':
      return ' ';
    case 'msqrt':
      return `√${held.length === 1 ? part(held[0]) : inBrackets(row(node).trim())}`;
    case 'mroot':
      return `${raised(held[1], SUPERSCRIPT, '^')}√${part(held[0])}`;
    case 'mfrac':
      return `${part(held[0])}/${part(held[1])}`;
    case 'msup':
      return `${part(held[0])}${raised(held[1], SUPERSCRIPT, '^')}`;
    case 'msub':
      return `${part(held[0])}${raised(held[1], SUBSCRIPT, '_')}`;
    case 'msubsup':
      return `${part(held[0])}${raised(held[1], SUBSCRIPT, '_')}${raised(held[2], SUPERSCRIPT, '^')}`;
    default:
      throw new NoPlainForm(node.tagName);
  }
}

/**
 * A formula on one line of plain text, for a title, the rail or a search
 * result, keeping what the layout says: a root with its sign (`√2`), a fraction
 * with a stroke (`(a+b)/c`), a power raised (`x²`), a relation spaced
 * (`E = mc²`). `null` when the formula cannot be laid out, or when its layout
 * has no honest one-line form (a table, an accent, a limit above a sign); the
 * caller then shows the formula as typed.
 * @param {string} tex
 * @returns {string | null}
 */
export function titleText(tex) {
  const math = mathElement(tex, false);
  if (math === null) return null;
  try {
    return plain(math).replace(/\s+/g, ' ').trim();
  } catch (error) {
    if (error instanceof NoPlainForm) return null;
    throw error;
  }
}

// --- The plugin --------------------------------------------------------------

/** @param {any} node */
const isMathCode = (node) =>
  node?.type === 'element' && node.tagName === 'code' && classes(node).includes('language-math');

/**
 * Finish a laid-out formula: drop what `\label` wrote, give its numbered
 * tables a width WebKit keeps, and write the page's equation numbers in.
 * @param {any} math the formula's element
 * @param {{ next: number }} counter
 */
function settle(math, counter) {
  visit(math, 'element', (node) => {
    // `\label` writes an `id`; with no reference to follow it, it could only
    // clash with a heading's address.
    if (node.properties && 'id' in node.properties) delete node.properties.id;
    if (node.tagName === 'mtable' && typeof node.properties?.style === 'string') {
      node.properties.style = node.properties.style.replace(
        /(^|;)\s*width\s*:\s*100%/,
        '$1width:100cqi',
      );
    }
    if (node.tagName !== 'mtd') return;
    let numbered = false;
    visit(node, 'element', (inner, index, parent) => {
      if (classes(inner).includes('tml-tag')) numbered = true;
      if (classes(inner).includes('tml-eqn') && parent && index !== undefined) {
        parent.children[index] = { type: 'text', value: `(${counter.next})` };
        counter.next += 1;
        numbered = true;
        return SKIP;
      }
    });
    // The cell that holds a row's number or its tag is set at the right edge.
    // `tml-right` is Temml's own class for that, with the rule each engine
    // needs for it in Temml's stylesheet.
    if (numbered) node.properties.className = [...classes(node), 'tml-right'];
  });
}

/**
 * The elements that take a formula's place.
 * @param {string} tex
 * @param {boolean} display
 * @param {{ next: number }} counter
 * @param {(tex: string, unclosed: boolean) => void} unreadable called for a formula that is shown as typed
 * @param {boolean} [unclosed] the formula is what a fence took that was never closed
 */
function layOut(tex, display, counter, unreadable, unclosed = false) {
  // What an unclosed fence took is the rest of the document, not a formula.
  const math = unclosed ? null : mathElement(tex, display);
  if (math === null) {
    unreadable(tex, unclosed);
    return {
      type: 'element',
      tagName: 'code',
      properties: { className: ['tome-math-error'], title: 'This formula could not be read' },
      children: [{ type: 'text', value: asTyped(tex, display) }],
    };
  }
  settle(math, counter);
  if (display) {
    return {
      type: 'element',
      tagName: 'div',
      properties: { className: ['tome-math'] },
      children: [math],
    };
  }
  if (toString(math).length <= LONG) return math;
  return {
    type: 'element',
    tagName: 'span',
    properties: { className: ['tome-math-long'] },
    children: [math],
  };
}

/**
 * The rehype plugin. One page's formulas are numbered together, from 1.
 * @returns {(tree: any, file: import('vfile').VFile) => void}
 */
export default function rehypeMath() {
  return (tree, file) => {
    const counter = { next: 1 };
    /** @param {string} tex @param {boolean} unclosed */
    const unreadable = (tex, unclosed) => {
      const quoted = tex.replace(/\s+/g, ' ').trim().slice(0, QUOTED);
      const where = file.path ?? file.history?.[0] ?? 'a chapter';
      const what = unclosed ? 'a $$ fence was never closed' : 'a formula could not be read';
      file.message(`${what}: ${quoted}`, { source: 'tome-math' });
      console.warn(`math: ${where}: ${what} and is shown as typed: ${quoted}`);
    };
    visit(tree, 'element', (node, index, parent) => {
      if (!parent || index === undefined) return;
      if (node.tagName === 'pre') {
        const code = node.children.find(isMathCode);
        if (!code) return;
        const unclosed = classes(code).includes(UNCLOSED);
        // A fenced block's text ends with the line end before its closing fence.
        const tex = toString(code).replace(/\n$/, '');
        parent.children[index] = layOut(tex, true, counter, unreadable, unclosed);
        return SKIP;
      }
      if (isMathCode(node)) {
        parent.children[index] = layOut(toString(node), false, counter, unreadable);
        return SKIP;
      }
    });
  };
}
