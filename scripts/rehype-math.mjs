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
/**
 * Past this many characters of laid-out text, a formula within a line is
 * "long" and gets a box of its own. Sixteen characters are about 250 px at the
 * reader's largest text, which fits the column of a narrow phone; a formula of
 * twenty-eight was seen to run 30 px past a 412 px column in WebKit.
 */
const LONG = 16;

/**
 * Temml's MathML for a formula, or `null` when it cannot be laid out. Commands
 * that could reach outside the formula (`\href`, `\includegraphics`, `\class`)
 * are refused by Temml unless trusted, and are never trusted here.
 * @param {string} tex
 * @param {boolean} display
 * @returns {string | null}
 */
function mathml(tex, display) {
  // Nothing between the dollar signs is nothing to lay out: shown as typed,
  // and named, like any formula that cannot be read.
  // So is a formula that is all comment (`%` to the end of its line).
  const shown = tex.replace(/(\\*)%.*$/gm, (rest, slashes) =>
    slashes.length % 2 === 1 ? rest : slashes,
  );
  if (shown.trim() === '') return null;
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

/** The first element a node shows: itself, or the first inside a grouping element. @param {any} node @returns {string} */
function firstTag(node) {
  const held = GROUPS.has(node.tagName) ? elementsOf(node) : [];
  return held.length > 0 ? firstTag(held[0]) : node.tagName;
}

/**
 * What a raised character could not be a power of: a space, an opening
 * bracket, or a sign that joins two things.
 */
const AFTER_WHICH_NO_POWER = /[\s([{+\-−±×·⋅∗/=<>≤≥≠≈,;:]$/u;

/** What a grouping element holds, in order. @param {any} node @returns {string} */
function row(node) {
  let out = '';
  let previous = '';
  for (const child of node.children) {
    const text = plain(child);
    const first = child.type === 'element' ? firstTag(child) : '';
    if (/[\p{L}\p{N}]$/u.test(out) && first === 'mfrac') {
      // `3\frac{1}{2}` is three and a half, not thirty-one halves; and two
      // fractions side by side are two fractions.
      out += ' ';
    } else if (first === 'mroot' && out !== '' && !AFTER_WHICH_NO_POWER.test(out)) {
      // A root's index is written raised before it, where a power of what
      // stands before it would be: `2\sqrt[3]{x}` is twice a cube root, not
      // two cubed times a root, and so after a bracket, a bar or `!`.
      out += ' ';
    } else if (/\d$/.test(out) && /^\d/.test(text)) {
      // Two numbers that the page shows apart are a product: `\sqrt{2}3` is
      // not `\sqrt{23}`. (Digits typed with a space between them, `2 3`, are
      // one number to TeX and to the page, and so here.)
      out += '·';
    } else if (PARTED.has(previous) && /^\d/.test(text)) {
      out += '·';
    }
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
      // With no bar it is a stack, as in a binomial coefficient, and a stroke
      // would read as a division.
      if (/^0(?:[a-z%]*)$/.test(String(node.properties?.linethickness ?? '').trim())) {
        throw new NoPlainForm('a fraction with no bar');
      }
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
 * The labels a formula's LaTeX holds, in order, its comments left out.
 * @param {string} tex
 * @returns {string[]}
 */
function labelsIn(tex) {
  const shown = tex.replace(/(\\*)%.*$/gm, (rest, slashes) =>
    slashes.length % 2 === 1 ? rest : slashes,
  );
  return [...shown.matchAll(/\\label\s*\{([^{}]*)\}/g)].map((match) => match[1].trim());
}

/** What Temml writes on a row for a label: its letters, digits and `_`. */
const rowMark = (label) => label.replace(/[^A-Za-z0-9_]/g, '');

/**
 * Finish a laid-out formula: drop what `\label` wrote, give its numbered
 * tables a width WebKit keeps, and write the page's equation numbers in.
 * @param {any} math the formula's element
 * @param {{ next: number }} counter
 * @param {string} [tex] the formula's LaTeX, to read its labels from
 * @returns {{ label: string, row: any, number: string }[]} each label whose
 *   row takes a number, with that row and the number as the page shows it
 */
function settle(math, counter, tex = '') {
  /** The rows Temml marked for a label, in order, with its mark. */
  const marked = [];
  /** The cell of each row that holds its number or its tag. */
  const numbers = new Map();
  visit(math, 'element', (node, _index, parent) => {
    // `\label` writes an `id`. It is dropped here: with no link to follow it,
    // it could only clash with a heading's address. A label a link reaches is
    // given an `id` of Tome's own afterwards (see the plugin).
    if (node.properties && 'id' in node.properties) {
      if (node.tagName === 'mtr') marked.push({ row: node, mark: String(node.properties.id) });
      delete node.properties.id;
    }
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
    if (numbered) {
      node.properties.className = [...classes(node), 'tml-right'];
      if (parent) numbers.set(parent, node);
    }
  });
  // Each marked row takes the next label, in order, that its mark stands for.
  // A label that meets no row (inside `split`, or before the environment
  // begins) is one no link can reach; the others are served all the same.
  const labels = labelsIn(tex);
  const labelled = [];
  let from = 0;
  for (const { row, mark } of marked) {
    const at = labels.findIndex((label, index) => index >= from && rowMark(label) === mark);
    if (at === -1) continue;
    from = at + 1;
    const cell = numbers.get(row);
    const number = cell ? toString(cell).trim() : '';
    if (number !== '') labelled.push({ label: labels[at], row, number });
  }
  return labelled;
}

/**
 * The labels of a set-apart formula whose rows take a number on the page, in
 * order; none for a formula that cannot be laid out. A reference to any other
 * label of the formula has nothing to show.
 * @param {string} tex
 * @returns {string[]}
 */
export function numberedLabels(tex) {
  const math = mathElement(tex, true);
  if (math === null) return [];
  return settle(math, { next: 1 }, tex).map((entry) => entry.label);
}

/**
 * The elements that take a formula's place.
 * @param {string} tex
 * @param {boolean} display
 * @param {{ next: number }} counter
 * @param {(tex: string, unclosed: boolean) => void} unreadable called for a formula that is shown as typed
 * @param {boolean} [unclosed] the formula is what a fence took that was never closed
 * @param {{ label: string, row: any, number: string }[]} [labelled] takes the formula's numbered labels
 */
function layOut(tex, display, counter, unreadable, unclosed = false, labelled = []) {
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
  labelled.push(...settle(math, counter, tex));
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
    /** The page's labels whose rows take a number, as its formulas are laid out. */
    const labelled = [];
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
        parent.children[index] = layOut(tex, true, counter, unreadable, unclosed, labelled);
        return SKIP;
      }
      if (isMathCode(node)) {
        parent.children[index] = layOut(toString(node), false, counter, unreadable);
        return SKIP;
      }
    });
    linkLabels(tree, labelled);
  };
}

/**
 * Make each link to a numbered equation show that equation's number
 * (INT-0033). A link is one of these when its address, decoded, is `#` and the
 * label of a numbered row on the page, and its words are empty or are the
 * label: the two forms Tome writes for a paper and teaches for a chapter. Any
 * other link is left as it is, address and all, so a link a chapter already
 * has to a heading is never taken over.
 *
 * The row takes an `id` of Tome's own, `eq.` and the label: the full stop is
 * what no heading's address holds, so the two cannot clash. This step runs
 * before headings are given their addresses and cannot compare against them.
 * @param {any} tree
 * @param {{ label: string, row: any, number: string }[]} labelled
 */
function linkLabels(tree, labelled) {
  if (labelled.length === 0) return;
  /** The first row of each label: a second with the same label is not reached. */
  const rows = new Map();
  for (const entry of labelled) if (!rows.has(entry.label)) rows.set(entry.label, entry);
  const taken = new Set();
  const idOf = (entry) => {
    if (entry.id) return entry.id;
    const base = `eq.${entry.label.replace(/[^A-Za-z0-9_:-]/g, '-')}`;
    let id = base;
    for (let n = 2; taken.has(id); n++) id = `${base}-${n}`;
    taken.add(id);
    entry.id = id;
    entry.row.properties.id = id;
    return id;
  };
  const textAt = (parent, index) => {
    const node = parent.children[index];
    return node?.type === 'text' ? node.value : '';
  };
  visit(tree, 'element', (node, index, parent) => {
    if (node.tagName !== 'a' || typeof node.properties?.href !== 'string') return;
    if (!node.properties.href.startsWith('#')) return;
    let label;
    try {
      label = decodeURIComponent(node.properties.href.slice(1));
    } catch {
      return;
    }
    const entry = rows.get(label);
    const words = toString(node).trim();
    if (!entry || (words !== '' && words !== label)) return;
    node.properties.href = `#${idOf(entry)}`;
    // In brackets, once: a number written inside a pair already has them.
    const within =
      parent && index !== undefined
        ? textAt(parent, index - 1).endsWith('(') && textAt(parent, index + 1).startsWith(')')
        : false;
    const bare = entry.number.replace(/^\((.*)\)$/, '$1');
    node.children = [{ type: 'text', value: within ? bare : entry.number }];
    return SKIP;
  });
}
