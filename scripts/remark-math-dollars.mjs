// How Tome reads a formula in Markdown (INT-0030): `$…$` within a line,
// `$$…$$` set apart. It reads them with `micromark-extension-math` and
// `mdast-util-math`, the two packages `remark-math` is made of, and changes
// three things about how they read.
//
// 1. Money. The package pairs a single `$` with the next one, whatever stands
//    between, so "It costs $5 and then $10" would be set as a formula. Here a
//    pair of single dollar signs is a formula only when no space follows the
//    first, no space stands before the second, and no digit follows the second
//    (the rule pandoc uses). A `$` that fails is left as text and reading goes
//    on, so a real formula later in the same line is still found.
//
//    The package looks for the closing sign in the raw characters ahead, before
//    any of them has been read as Markdown. So the same look ahead also refuses
//    a pair whose closing sign belongs to something else: one inside inline
//    code that begins after the opening sign, one written `\$`, and one inside
//    the address of a link. A formula between single dollar signs therefore
//    cannot hold a backtick, `](` or `://`; write it with `$$`.
//
// 2. Fences. A `$$` fence is a line that holds `$$` and nothing else. The
//    package would take whatever follows an opening `$$` on its line as a
//    label and read on to a line that is only `$$`, or to the end of the
//    document, losing the first line of `$$\begin{aligned}` and everything
//    after it.
//
// 3. Set apart. A formula written `$$…$$` within a paragraph is set apart when
//    it has its line, or lines, to itself: alone in its paragraph, or on lines
//    of a longer one, which is then divided around it.
import { mathFromMarkdown } from 'mdast-util-math';
import { math } from 'micromark-extension-math';
import { visit } from 'unist-util-visit';

const DOLLAR = 36;
const SPACE = 32;
const BACKSLASH = 92;
const BACKTICK = 96;
const COLON = 58;
const SLASH = 47;
const RIGHT_BRACKET = 93;
const LEFT_PARENTHESIS = 40;

/** A space, a tab, a line end, or the end of the text. @param {number | null} code */
const isSpace = (code) => code === null || code < 0 || code === SPACE;
/** @param {number | null} code */
const isDigit = (code) => code !== null && code >= 48 && code <= 57;

/**
 * Succeeds when the `$` here would open a formula; never consumes for real,
 * because it is only ever run through `effects.check`.
 * @type {import('micromark-util-types').Tokenizer}
 */
function tokenizePairing(effects, ok, nok) {
  /** The two characters before the one in hand. @type {(number | null)[]} */
  const before = [null, null];

  /** @param {import('micromark-util-types').State} next */
  const done = (next) => (/** @type {number | null} */ code) => {
    effects.exit('mathDollarProbe');
    return next(code);
  };
  /** @param {number | null} code */
  const keep = (code) => {
    before[0] = before[1];
    before[1] = code;
  };

  /** @type {import('micromark-util-types').State} */
  const inside = (code) => {
    // No closing sign in this paragraph: `remark-math` leaves it as text too.
    if (code === null) return done(ok)(code);
    const [earlier, previous] = before;
    // Inline code begins, or a link's address: what follows is not a formula's.
    if (code === BACKTICK) return done(nok)(code);
    if (code === LEFT_PARENTHESIS && previous === RIGHT_BRACKET) return done(nok)(code);
    if (code === SLASH && previous === SLASH && earlier === COLON) return done(nok)(code);
    if (code === DOLLAR) {
      // `remark-math` would close here; a space before it, or a backslash
      // (the sign is written `\$`), says this was never a formula.
      if (isSpace(previous) || previous === BACKSLASH) return done(nok)(code);
      effects.consume(code);
      return afterCloser;
    }
    keep(code);
    effects.consume(code);
    return inside;
  };

  /** @type {import('micromark-util-types').State} */
  const afterCloser = (code) => {
    if (code === DOLLAR) {
      // A run of two is not what closes a single sign; keep looking.
      keep(DOLLAR);
      keep(DOLLAR);
      effects.consume(code);
      return inside;
    }
    return done(isDigit(code) ? nok : ok)(code);
  };

  return (code) => {
    effects.enter('mathDollarProbe');
    effects.consume(code);
    return (next) => {
      // `$$`: `remark-math`'s own business.
      if (next === DOLLAR) return done(ok)(next);
      if (isSpace(next)) return done(nok)(next);
      return inside(next);
    };
  };
}

/** @type {import('micromark-util-types').Tokenizer} */
function tokenizeMoney(effects, ok, nok) {
  /** @type {import('micromark-util-types').State} */
  const literal = (code) => {
    effects.enter('data');
    effects.consume(code);
    effects.exit('data');
    return ok;
  };
  // A formula: fail here, and the next construct for `$` (remark-math's) reads
  // it. Not a formula: take the sign as plain text.
  return (code) => effects.check({ tokenize: tokenizePairing, partial: true }, nok, literal)(code);
}

/**
 * Succeeds when a line that opens with `$$` holds nothing after the dollar
 * signs: a fence. Only ever run through `effects.check`.
 * @type {import('micromark-util-types').Tokenizer}
 */
function tokenizeBareFence(effects, ok, nok) {
  /** @param {import('micromark-util-types').State} next */
  const done = (next) => (/** @type {number | null} */ code) => {
    effects.exit('mathDollarProbe');
    return next(code);
  };
  /** @type {import('micromark-util-types').State} */
  const afterDollars = (code) => {
    if (code === DOLLAR || code === SPACE || code === -2 || code === -1) {
      effects.consume(code);
      return afterDollars;
    }
    // A line end or the end of the text: a fence. Anything else: not one.
    return done(code === null || code < -2 ? ok : nok)(code);
  };
  return (code) => {
    effects.enter('mathDollarProbe');
    effects.consume(code);
    return afterDollars;
  };
}

/**
 * Whether the paragraph being read, which the line in hand might interrupt,
 * holds a `$$` that nothing has closed yet (an odd number of them).
 * @param {import('micromark-util-types').TokenizeContext} context
 */
function openInParagraph(context) {
  let chunk;
  for (let index = context.events.length - 1; index >= 0; index -= 1) {
    const token = context.events[index][1];
    if (token.type === 'chunkContent') {
      chunk = token;
      break;
    }
    if (token.type !== 'lineEnding' && token.type !== 'linePrefix') break;
  }
  let text = '';
  for (; chunk; chunk = chunk.previous) text = `${context.sliceSerialize(chunk)}\n${text}`;
  // A `$$` named in inline code is not one that opens a formula.
  const outsideCode = text.replace(/(`+)(?!`)[\s\S]*?(?<!`)\1(?!`)/g, '');
  return (outsideCode.match(/\$\$/g) ?? []).length % 2 === 1;
}

/**
 * The syntax of formulas, as Tome reads it: `micromark-extension-math`, with
 * its fence wrapped and the rule for single dollar signs set before its own.
 *
 * A `$$` fence must have its line to itself. The package takes whatever
 * follows an opening `$$` on its line as a label and then reads on to a line
 * that is only `$$`, or to the end of the document; so a paper's usual
 * `$$\begin{aligned}` … `\end{aligned}$$` would lose its first line and take
 * the rest of the chapter with it. Here that line is ordinary text, and the
 * formula is read as `$$…$$` within it.
 *
 * And a `$$` line directly under a paragraph that has an unclosed `$$` in it
 * closes that formula; it does not open a fence. (`$$a = b` and then `$$` on
 * the next line is one formula, not a line of text and a fence left open.)
 *
 * And the rule for single dollar signs, above, is tried before the package's.
 *
 * For a parser that is not a remark pipeline (the search index), pass this
 * with `mathFromMarkdown()` of `mdast-util-math`.
 * @returns {import('micromark-util-types').Extension[]}
 */
export function mathSyntax() {
  const base = math();
  const fence = /** @type {import('micromark-util-types').Construct} */ (
    /** @type {any} */ (base.flow)[DOLLAR]
  );
  /** @type {import('micromark-util-types').Construct} */
  const bareFence = {
    ...fence,
    tokenize(effects, ok, nok) {
      if (this.interrupt && openInParagraph(this)) return nok;
      const read = fence.tokenize.call(this, effects, ok, nok);
      return (code) =>
        effects.check({ tokenize: tokenizeBareFence, partial: true }, read, nok)(code);
    },
  };
  return [
    { flow: { [DOLLAR]: bareFence }, text: base.text },
    // Listed later, so tried first.
    { text: { [DOLLAR]: { name: 'mathDollar', tokenize: tokenizeMoney } } },
  ];
}

/** @param {any} node @param {string} source */
const inDoubleDollars = (node, source) => {
  const start = node?.position?.start.offset;
  return node?.type === 'inlineMath' && typeof start === 'number' && source.startsWith('$$', start);
};
// A line end, as Unix writes it or as Windows does (`\r\n`), with any spaces
// left beside it.
const LINE_END_LAST = /\r?\n[ \t]*$/;
const LINE_END_FIRST = /^[ \t]*\r?\n/;
/** Whether a formula's neighbour leaves it its line: nothing, or text broken at that side. */
const endsLine = (/** @type {any} */ node) =>
  node === undefined || (node.type === 'text' && LINE_END_LAST.test(node.value));
const startsLine = (/** @type {any} */ node) =>
  node === undefined || (node.type === 'text' && LINE_END_FIRST.test(node.value));

/**
 * The set-apart form, exactly as the package writes it for `$$` fences.
 * @param {any} formula an inline formula
 */
function asSetApart(formula) {
  return {
    type: 'math',
    meta: null,
    value: formula.value,
    position: formula.position,
    data: {
      hName: 'pre',
      hChildren: [
        {
          type: 'element',
          tagName: 'code',
          properties: { className: ['language-math', 'math-display'] },
          children: [{ type: 'text', value: formula.value }],
        },
      ],
    },
  };
}

/**
 * A paragraph divided around each `$$…$$` formula that has its line to itself.
 * `null` when it holds none.
 * @param {any} paragraph
 * @param {string} source the whole document
 * @returns {any[] | null}
 */
function divide(paragraph, source) {
  const children = paragraph.children;
  if (!children.some((/** @type {any} */ child) => inDoubleDollars(child, source))) return null;
  /** @type {any[]} */
  const out = [];
  /** @type {any[]} */
  let line = [];
  const flush = () => {
    // Drop the line ends that stood against a formula.
    const first = line[0];
    const last = line[line.length - 1];
    if (first?.type === 'text') first.value = first.value.replace(LINE_END_FIRST, '');
    if (last?.type === 'text') last.value = last.value.replace(LINE_END_LAST, '');
    const kept = line.filter((child) => child.type !== 'text' || child.value !== '');
    if (kept.length > 0) out.push({ type: 'paragraph', children: kept });
    line = [];
  };
  let divided = false;
  children.forEach((/** @type {any} */ child, /** @type {number} */ index) => {
    const alone =
      inDoubleDollars(child, source) &&
      endsLine(children[index - 1]) &&
      startsLine(children[index + 1]);
    if (!alone) {
      line.push(child);
      return;
    }
    flush();
    out.push(asSetApart(child));
    divided = true;
  });
  flush();
  return divided ? out : null;
}

/** The class on a set-apart formula whose fence was never closed. */
export const UNCLOSED = 'math-unclosed';

/**
 * Whether a set-apart formula was closed: a fence by a later line that is
 * only `$$`, a `$$…$$` formula by its closing `$$`.
 * @param {any} node a `math` node, with its position
 * @param {string} source the whole document
 */
export function fenceClosed(node, source) {
  const start = node?.position?.start.offset;
  const end = node?.position?.end.offset;
  if (typeof start !== 'number' || typeof end !== 'number') return true;
  const lines = source.slice(start, end).split(/\r?\n/);
  const bare = /^[ \t>]*\${2,}[ \t]*$/;
  // Written within a paragraph: it has no fence lines to speak of.
  if (!bare.test(lines[0])) return true;
  return lines.length > 1 && bare.test(lines[lines.length - 1]);
}

/**
 * The tree step, on a tree parsed with `mathSyntax()`: marks a fence that was
 * never closed, and sets apart each `$$…$$` formula that has its lines to
 * itself. Exported so that search sets apart exactly what the page does.
 * @param {any} tree changed in place
 * @param {string} source the document the tree was parsed from
 */
export function setApart(tree, source) {
  // A fence that was never closed took the rest of the document. Say so on
  // the node, so it is shown as typed and never laid out.
  visit(tree, 'math', (node) => {
    if (fenceClosed(node, source)) return;
    const code = node.data?.hChildren?.[0];
    if (code?.properties) {
      code.properties.className = [...(code.properties.className ?? []), UNCLOSED];
    }
  });
  visit(tree, 'paragraph', (paragraph, index, parent) => {
    if (!parent || index === undefined) return;
    const parts = divide(paragraph, source);
    if (!parts) return;
    parent.children.splice(index, 1, ...parts);
    return index + parts.length;
  });
}

/**
 * The remark plugin. It takes the place of `remark-math`: it reads formulas
 * with the same two packages that plugin is made of, by Tome's rules.
 * @this {import('unified').Processor}
 */
export default function remarkMathDollars() {
  const data =
    /** @type {{ micromarkExtensions?: unknown[], fromMarkdownExtensions?: unknown[] }} */ (
      this.data()
    );
  (data.micromarkExtensions ??= []).push(...mathSyntax());
  (data.fromMarkdownExtensions ??= []).push(mathFromMarkdown());

  return (/** @type {any} */ tree, /** @type {import('vfile').VFile} */ file) => {
    setApart(tree, String(file.value ?? ''));
  };
}
