// A Word equation to LaTeX notation (INT-0030). Word keeps an equation in its
// own markup, Office Math (`m:oMath`), where each construct is a plain
// structure: a fraction holds a numerator and a denominator. This reads that
// structure and writes the LaTeX for it, one rule per element. Letters, digits
// and symbols are written as themselves (`α`, `≤`, `∑`); only the characters
// LaTeX gives a meaning are written another way.
//
// It converts a whole equation or nothing. An element with no rule here, a
// bracket or accent it does not know, or a result the layout engine refuses,
// gives `null`, and the caller keeps its mark for that equation.
import { DOMParser } from '@xmldom/xmldom';

/** Thrown inside the walk for anything without a rule; never leaves this file. */
class Unknown extends Error {}

const BACKSLASH = String.fromCharCode(92);
const cmd = (/** @type {string} */ name) => BACKSLASH + name;

/** Characters LaTeX gives a meaning, and how each is written to show as itself. */
const SPECIAL = new Map([
  [BACKSLASH, `${cmd('backslash')} `],
  ['{', cmd('{')],
  ['}', cmd('}')],
  ['#', cmd('#')],
  ['%', cmd('%')],
  ['&', cmd('&')],
  ['_', cmd('_')],
  ['$', cmd('$')],
  ['^', `${cmd('text')}{${cmd('textasciicircum')}}`],
  ['~', `${cmd('text')}{${cmd('textasciitilde')}}`],
]);

/** A bracket character to what follows `\left` or `\right`. */
const DELIMITERS = new Map([
  ['(', '('],
  [')', ')'],
  ['[', '['],
  [']', ']'],
  ['{', cmd('{')],
  ['}', cmd('}')],
  ['|', cmd('vert')],
  ['‖', cmd('Vert')],
  ['⟨', cmd('langle')],
  ['⟩', cmd('rangle')],
  ['〈', cmd('langle')],
  ['〉', cmd('rangle')],
  ['⌊', cmd('lfloor')],
  ['⌋', cmd('rfloor')],
  ['⌈', cmd('lceil')],
  ['⌉', cmd('rceil')],
  ['', '.'],
]);

/** A pair of brackets to the matrix environment that draws them. */
const MATRIX = new Map([
  ['()', 'pmatrix'],
  ['[]', 'bmatrix'],
  ['{}', 'Bmatrix'],
  ['||', 'vmatrix'],
  ['‖‖', 'Vmatrix'],
]);

/** A combining mark over a letter to its command. */
const ACCENTS = new Map([
  [0x0302, 'hat'],
  [0x0303, 'tilde'],
  [0x0304, 'bar'],
  [0x0305, 'overline'],
  [0x0307, 'dot'],
  [0x0308, 'ddot'],
  [0x20d7, 'vec'],
  [0x0301, 'acute'],
  [0x0300, 'grave'],
  [0x0306, 'breve'],
  [0x030c, 'check'],
  // The spacing forms Word sometimes stores instead.
  [0x5e, 'hat'],
  [0x7e, 'tilde'],
  [0xaf, 'bar'],
  [0x2192, 'vec'],
]);

/** Names LaTeX has a command for. */
const FUNCTIONS = new Set(
  (
    'sin cos tan cot sec csc arcsin arccos arctan sinh cosh tanh coth ' +
    'log ln lg exp lim liminf limsup max min sup inf det gcd deg dim ker hom arg Pr'
  ).split(' '),
);

/** How a run's style (`m:sty`, `m:scr`) is written. */
const STYLES = new Map([
  ['b', 'mathbf'],
  ['bi', 'boldsymbol'],
  ['p', 'mathrm'],
  ['double-struck', 'mathbb'],
  ['fraktur', 'mathfrak'],
  ['script', 'mathcal'],
  ['sans-serif', 'mathsf'],
  ['monospace', 'mathtt'],
]);

/** @param {any} node */
const local = (node) => String(node.nodeName ?? '').replace(/^.*:/, '');
/** @param {any} node */
const prefix = (node) =>
  String(node.nodeName ?? '').includes(':') ? node.nodeName.split(':')[0] : '';
/** @param {any} node @returns {any[]} */
const elements = (node) =>
  Array.from(node.childNodes ?? []).filter((child) => child.nodeType === 1);
/** @param {any} node @param {string} name @returns {any | undefined} */
const child = (node, name) =>
  elements(node).find((each) => prefix(each) === 'm' && local(each) === name);
/** @param {any} node @param {string} name @returns {any[]} */
const children = (node, name) =>
  elements(node).filter((each) => prefix(each) === 'm' && local(each) === name);

/** Whether an element holds any of the equation's own markup. @param {any} node @returns {boolean} */
const holdsMath = (node) => elements(node).some((each) => prefix(each) === 'm' || holdsMath(each));

/**
 * A property's value: `<m:xPr><m:name m:val="…"/></m:xPr>`. `undefined` when
 * the property is absent; `''` when it is present with an empty value.
 * @param {any} properties @param {string} name @returns {string | undefined}
 */
function value(properties, name) {
  const property = properties && child(properties, name);
  if (!property) return undefined;
  return property.getAttribute('m:val') ?? property.getAttribute('val') ?? '';
}
/** Word writes "on" as `1`, `on`, `true`, or the bare element. @param {string | undefined} raw */
const isOn = (raw) => raw !== undefined && raw !== '0' && raw !== 'off' && raw !== 'false';

/** @param {string} text @param {boolean} aligned whether `&` is an alignment mark here */
function escapeText(text, aligned) {
  let out = '';
  for (const character of text) {
    if (character === '&' && aligned) out += '&';
    else out += SPECIAL.get(character) ?? character;
  }
  return out;
}

/** One thing LaTeX takes whole without braces: a letter, a digit, a symbol. @param {string} latex */
const isSingle = (latex) => [...latex].length === 1 && !SPECIAL.has(latex);
/** @param {string} latex */
const group = (latex) => `{${latex}}`;
/** As a base or an argument that follows a command: braced unless it is one character. @param {string} latex */
const atom = (latex) => (isSingle(latex) ? latex : group(latex));

/**
 * @typedef {{ aligned: boolean }} Context
 */

/** The plain text of a run or of everything under a node. @param {any} node @returns {string} */
function plainText(node) {
  if (prefix(node) === 'm' && local(node) === 't') return node.textContent ?? '';
  return elements(node)
    .filter((each) => !local(each).endsWith('Pr'))
    .map(plainText)
    .join('');
}

/** @param {any} run @param {Context} context */
function runToLatex(run, context) {
  const text = children(run, 't')
    .map((each) => each.textContent ?? '')
    .join('');
  if (text === '') return '';
  const properties = child(run, 'rPr');
  if (properties && child(properties, 'nor') && isOn(value(properties, 'nor'))) {
    return `${cmd('text')}{${escapeText(text, false)}}`;
  }
  const escaped = escapeText(text, context.aligned);
  const script = value(properties, 'scr');
  const weight = value(properties, 'sty');
  // A style with no rule here would change what the letters mean.
  if (script !== undefined && script !== 'roman' && !STYLES.has(script)) {
    throw new Unknown(`script ${script}`);
  }
  if (weight !== undefined && weight !== 'i' && !STYLES.has(weight)) {
    throw new Unknown(`style ${weight}`);
  }
  const style = STYLES.get(script ?? '') ?? STYLES.get(weight ?? '');
  // An upright run of letters is a name (as Word writes "sin" in a function);
  // an upright run of anything else is the same as no style at all.
  if (style === 'mathrm' && !/^[\p{L}]+$/u.test(text)) return escaped;
  return style ? `${cmd(style)}{${escaped}}` : escaped;
}

/** Everything under an argument element (`m:e`, `m:num`, `m:sub`, …). @param {any} node @param {Context} context */
function inner(node, context) {
  if (!node) return '';
  return elements(node)
    .map((each) => toLatex(each, context))
    .join('')
    .trim();
}

/** A function's name as LaTeX: its command when LaTeX has one. @param {string} name */
function functionName(name) {
  const trimmed = name.trim();
  if (FUNCTIONS.has(trimmed)) return cmd(trimmed);
  return `${cmd('operatorname')}{${escapeText(trimmed, false)}}`;
}

/** @param {string | undefined} raw @param {string} fallback */
function delimiter(raw, fallback) {
  const character = raw ?? fallback;
  const latex = DELIMITERS.get(character);
  if (latex === undefined) throw new Unknown(`bracket ${character}`);
  return latex;
}

/** The rows of a matrix. @param {any} matrix @param {Context} context */
function matrixRows(matrix, context) {
  return children(matrix, 'mr')
    .map((row) =>
      children(row, 'e')
        .map((cell) => inner(cell, context))
        .join(' & '),
    )
    .join(` ${BACKSLASH}${BACKSLASH} `);
}

/** The rows of aligned lines. @param {any} array */
function alignedRows(array) {
  return children(array, 'e')
    .map((row) => inner(row, { aligned: true }))
    .join(` ${BACKSLASH}${BACKSLASH} `);
}

/** The one element an argument holds, when it holds exactly one. @param {any} argument */
function only(argument) {
  const held = elements(argument).filter((each) => !local(each).endsWith('Pr'));
  return held.length === 1 ? held[0] : undefined;
}

/** @param {any} node @param {Context} context @returns {string} */
function delimited(node, context) {
  const properties = child(node, 'dPr');
  const open = value(properties, 'begChr') ?? '(';
  const close = value(properties, 'endChr') ?? ')';
  const parts = children(node, 'e');
  if (parts.length === 1) {
    const held = only(parts[0]);
    if (held && prefix(held) === 'm' && local(held) === 'm') {
      const environment = MATRIX.get(open + close);
      if (environment) {
        return `${cmd('begin')}{${environment}} ${matrixRows(held, context)} ${cmd('end')}{${environment}}`;
      }
    }
    if (held && prefix(held) === 'm' && local(held) === 'eqArr' && open === '{' && close === '') {
      return `${cmd('begin')}{cases} ${alignedRows(held)} ${cmd('end')}{cases}`;
    }
  }
  const separator = delimiter(value(properties, 'sepChr'), '|');
  const body = parts.map((part) => inner(part, context)).join(` ${cmd('middle')}${separator} `);
  return `${cmd('left')}${delimiter(open, '(')} ${body} ${cmd('right')}${delimiter(close, ')')}`;
}

/** @param {any} node @param {Context} context @returns {string} */
function nary(node, context) {
  const properties = child(node, 'naryPr');
  const sign = value(properties, 'chr') ?? '∫';
  if ([...sign].length !== 1) throw new Unknown(`operator ${sign}`);
  const placement = value(properties, 'limLoc');
  const limits =
    placement === 'undOvr' ? cmd('limits') : placement === 'subSup' ? cmd('nolimits') : '';
  const lower = isOn(value(properties, 'subHide')) ? '' : inner(child(node, 'sub'), context);
  const upper = isOn(value(properties, 'supHide')) ? '' : inner(child(node, 'sup'), context);
  const body = inner(child(node, 'e'), context);
  return (
    sign +
    limits +
    (lower ? `_${group(lower)}` : '') +
    (upper ? `^${group(upper)}` : '') +
    (body ? ` ${body}` : '')
  );
}

/** @param {any} node @param {Context} context @returns {string} */
function func(node, context) {
  const name = child(node, 'fName');
  const argument = inner(child(node, 'e'), context);
  const held = name && only(name);
  let head;
  if (held && prefix(held) === 'm' && local(held) === 'r') head = functionName(plainText(held));
  else head = inner(name, context);
  return argument ? `${head} ${argument}` : head;
}

/** A limit written under (or over) its word. @param {any} node @param {Context} context @param {boolean} under */
function limit(node, context, under) {
  const base = child(node, 'e');
  const bound = inner(child(node, 'lim'), context);
  const held = base && only(base);
  const word = held && prefix(held) === 'm' && local(held) === 'r' ? plainText(held).trim() : '';
  if (word && /^[\p{L}]+$/u.test(word) && word.length > 1) {
    return `${functionName(word)}${under ? '_' : '^'}${group(bound)}`;
  }
  return `${cmd(under ? 'underset' : 'overset')}${group(bound)}${group(inner(base, context))}`;
}

/** @param {any} node @param {Context} context @returns {string} */
function accent(node, context) {
  const properties = child(node, 'accPr');
  const mark = value(properties, 'chr') ?? String.fromCodePoint(0x0302);
  const command = ACCENTS.get(mark.codePointAt(0) ?? -1);
  if (!command || [...mark].length !== 1) throw new Unknown(`accent ${mark}`);
  return `${cmd(command)}${group(inner(child(node, 'e'), context))}`;
}

/** A brace over or under an expression. @param {any} node @param {Context} context */
function groupCharacter(node, context) {
  const properties = child(node, 'groupChrPr');
  const mark = value(properties, 'chr') ?? '⏟';
  const body = group(inner(child(node, 'e'), context));
  if (mark === '⏟') return `${cmd('underbrace')}${body}`;
  if (mark === '⏞') return `${cmd('overbrace')}${body}`;
  throw new Unknown(`group character ${mark}`);
}

/** @param {any} node @param {Context} context @returns {string} */
function fraction(node, context) {
  const kind = value(child(node, 'fPr'), 'type') ?? 'bar';
  const top = inner(child(node, 'num'), context);
  const bottom = inner(child(node, 'den'), context);
  if (kind === 'bar') return `${cmd('frac')}${group(top)}${group(bottom)}`;
  if (kind === 'skw' || kind === 'lin') return `${group(top)}/${group(bottom)}`;
  if (kind === 'noBar') return `${cmd('genfrac')}{}{}{0pt}{}${group(top)}${group(bottom)}`;
  throw new Unknown(`fraction ${kind}`);
}

/** @param {any} node @param {Context} context @returns {string} */
function toLatex(node, context) {
  // Word's own elements inside an equation (a bookmark, a run's font) carry
  // nothing to lay out. One that holds part of the equation (a tracked
  // change, a link) is another matter: reading through it could keep text
  // that was struck out, so the whole equation is given up.
  if (prefix(node) !== 'm') {
    if (holdsMath(node)) throw new Unknown(`element ${node.nodeName} round part of an equation`);
    return '';
  }
  const name = local(node);
  if (name.endsWith('Pr')) return '';
  const e = () => inner(child(node, 'e'), context);
  switch (name) {
    case 'oMathPara': {
      // Several equations in one paragraph: one under another.
      const each = children(node, 'oMath').map((equation) => inner(equation, context));
      if (each.length <= 1) return each[0] ?? '';
      const rows = each.join(` ${BACKSLASH}${BACKSLASH} `);
      return `${cmd('begin')}{gathered} ${rows} ${cmd('end')}{gathered}`;
    }
    case 'oMath':
    case 'e':
    case 'box':
      return name === 'box' ? e() : inner(node, context);
    case 'r':
      return runToLatex(node, context);
    case 'f':
      return fraction(node, context);
    case 'rad': {
      const degree = isOn(value(child(node, 'radPr'), 'degHide'))
        ? ''
        : inner(child(node, 'deg'), context);
      return degree ? `${cmd('sqrt')}[${degree}]${group(e())}` : `${cmd('sqrt')}${group(e())}`;
    }
    case 'nary':
      return nary(node, context);
    case 'sSup':
      return `${atom(e())}^${group(inner(child(node, 'sup'), context))}`;
    case 'sSub':
      return `${atom(e())}_${group(inner(child(node, 'sub'), context))}`;
    case 'sSubSup':
      return `${atom(e())}_${group(inner(child(node, 'sub'), context))}^${group(inner(child(node, 'sup'), context))}`;
    case 'sPre':
      return `{}_${group(inner(child(node, 'sub'), context))}^${group(inner(child(node, 'sup'), context))}${atom(e())}`;
    case 'd':
      return delimited(node, context);
    case 'm':
      return `${cmd('begin')}{matrix} ${matrixRows(node, context)} ${cmd('end')}{matrix}`;
    case 'eqArr':
      return `${cmd('begin')}{aligned} ${alignedRows(node)} ${cmd('end')}{aligned}`;
    case 'func':
      return func(node, context);
    case 'limLow':
      return limit(node, context, true);
    case 'limUpp':
      return limit(node, context, false);
    case 'acc':
      return accent(node, context);
    case 'bar':
      return `${cmd(value(child(node, 'barPr'), 'pos') === 'bot' ? 'underline' : 'overline')}${group(e())}`;
    case 'groupChr':
      return groupCharacter(node, context);
    case 'borderBox':
      return `${cmd('boxed')}${group(e())}`;
    case 'phant':
      return isOn(value(child(node, 'phantPr'), 'show')) || !child(node, 'phantPr')
        ? e()
        : `${cmd('phantom')}${group(e())}`;
    default:
      throw new Unknown(`element m:${name}`);
  }
}

/**
 * The LaTeX for one Word equation, or `null`.
 * @param {string} xml one `<m:oMath>…</m:oMath>` or `<m:oMathPara>…</m:oMathPara>`, as it stands in the document
 * @param {{ readable?: (latex: string) => boolean }} [options] a last check on the result
 * @returns {string | null}
 */
export function ommlToLatex(xml, { readable } = {}) {
  // The fragment was cut from a document that declared its prefixes; declare
  // every prefix it uses, so it is well-formed on its own.
  const prefixes = new Set([...xml.matchAll(/<\/?([A-Za-z_][\w.-]*):/g)].map((match) => match[1]));
  for (const match of xml.matchAll(/\s([A-Za-z_][\w.-]*):[\w.-]+=/g)) prefixes.add(match[1]);
  prefixes.delete('xmlns');
  prefixes.delete('xml');
  const declarations = [...prefixes].map((each) => `xmlns:${each}="urn:tome:${each}"`).join(' ');
  let failed = false;
  let root;
  try {
    const document = new DOMParser({
      onError: (level) => {
        if (level !== 'warning') failed = true;
      },
    }).parseFromString(`<tome-math ${declarations}>${xml}</tome-math>`, 'text/xml');
    root = document.documentElement;
  } catch {
    return null;
  }
  if (failed || !root) return null;
  let latex;
  try {
    latex = elements(root)
      .map((each) => toLatex(each, { aligned: false }))
      .join('')
      .replace(/\s+/g, ' ')
      .trim();
  } catch (error) {
    if (error instanceof Unknown) return null;
    throw error;
  }
  if (latex === '') return null;
  if (readable && !readable(latex)) return null;
  return latex;
}
