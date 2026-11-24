// Write a paper as the Markdown of a chapter (INT-0033): the tree pandoc gives
// for a LaTeX or Typst document (scripts/pandoc-read.mjs) becomes headings,
// paragraphs, lists, tables, figures, footnotes and formulas, as a Word
// document's does in docx-to-markdown.mjs.
//
// Pandoc can write Markdown itself, but it puts a set-apart formula inside its
// paragraph, where Tome reads it as within the line. So the Markdown is
// written here: each formula is carried as a place-holder, written between
// dollar signs once the text is finished, and read back by Tome's own reader
// (`settleEquations`), so that one which would not show is marked and counted.
//
// What pandoc skipped in a LaTeX paper stands in the tree as a word
// (`skipped[].token`). A drawing or a command that holds words takes the mark
// `[LaTeX not shown]`; a bare command is counted with no mark; a command known
// to be layout is passed over. The word itself is never written.
//
// A reference leads somewhere: to an anchor written before the heading,
// block, table or figure it names, with the number pandoc gave it; or to a
// numbered equation, whose number the page itself writes in (rehype-math.mjs).
// One that cannot be followed is shown as written and counted.
//
// A citation shows its entry: the words pandoc's `citeproc` worked out from a
// `.bib` file, each a link to its entry in the reference list; or, for a list
// kept in the paper (`thebibliography`), the entry's number. A key that is in
// no list is shown in square brackets and counted.
import remarkGfm from 'remark-gfm';
import remarkStringify from 'remark-stringify';
import { unified } from 'unified';
import { placeholders, settleEquations } from './docx-to-markdown.mjs';
import { numberedLabels, titleText } from './rehype-math.mjs';

/** What a chapter reads where a piece of LaTeX could not be carried over. */
export const LATEX_MARK = '[LaTeX not shown]';

/**
 * Commands that only lay a page out, each with the number of arguments in
 * braces it takes. A piece that is one of these, holding no more groups than
 * that, is passed over; holding more, it holds something of the paper's.
 */
export const LAYOUT_COMMANDS = new Map([
  ...[
    'maketitle',
    'centering',
    'raggedright',
    'raggedleft',
    'noindent',
    'indent',
    'par',
    'newpage',
    'clearpage',
    'cleardoublepage',
    'pagebreak',
    'linebreak',
    'nobreak',
    'smallskip',
    'medskip',
    'bigskip',
    'vfill',
    'hfill',
    'quad',
    'qquad',
    'tiny',
    'scriptsize',
    'footnotesize',
    'small',
    'normalsize',
    'large',
    'Large',
    'LARGE',
    'huge',
    'Huge',
    'sloppy',
    'protect',
    'relax',
    'null',
    'strut',
    'tableofcontents',
    'listoffigures',
    'listoftables',
    'printbibliography',
    'appendix',
    'frontmatter',
    'mainmatter',
    'backmatter',
    'allowdisplaybreaks',
    'makeatletter',
    'makeatother',
    'vskip',
    'hskip',
  ].map((name) => [name, 0]),
  ...[
    'bibliographystyle',
    'pagestyle',
    'thispagestyle',
    'pagenumbering',
    'vspace',
    'hspace',
    'phantom',
    'hphantom',
    'vphantom',
    'captionsetup',
    'color',
    'rowcolor',
    'cellcolor',
    'geometry',
    'hypersetup',
    'usepackage',
    'documentclass',
    'index',
    'enlargethispage',
    'linespread',
    'graphicspath',
  ].map((name) => [name, 1]),
  ...[
    'setlength',
    'addtolength',
    'setcounter',
    'addtocounter',
    'numberwithin',
    'markboth',
    'pdfbookmark',
  ].map((name) => [name, 2]),
  ['addcontentsline', 3],
]);

/** Link addresses written as links; any other is written as its words. */
const SAFE_ADDRESS = /^(?:https?:|mailto:)/i;

const text = (value) => ({ type: 'text', value });
const html = (value) => ({ type: 'html', value });

/**
 * A formula's LaTeX on one line. A `%` comment is dropped (a `\%` is kept); a
 * line that ended in a comment is joined to the next with nothing between, as
 * TeX joins them, unless it ends in a command, which a letter would lengthen;
 * every other line end, with the spaces round it, is one space.
 * @param {string} tex
 */
export function oneLine(tex) {
  let out = '';
  let space = false; // a line end that is a space is owed
  let bare = false; // the line before ended in a comment
  for (const raw of tex.split(/\r?\n/)) {
    const cut = raw.match(/^((?:[^\\%]|\\[\s\S])*?)%/);
    const commented = cut !== null;
    let piece = (commented ? cut[1] : raw).replace(/^\s+/, '');
    if (!commented) piece = piece.replace(/\s+$/, '');
    if (piece !== '') {
      if (out === '') out = piece;
      else if (space || !bare) out += ` ${piece}`;
      else out += (/\\(?:[A-Za-z]+|[^A-Za-z])$/.test(out) ? ' ' : '') + piece;
      space = false;
    }
    if (!commented) space = out !== '';
    bare = commented;
  }
  return out.trim();
}

/** The plain words of a pandoc subtree, formulas and notes left out. */
function wordsOf(node) {
  if (Array.isArray(node)) return node.map(wordsOf).join('');
  if (node === null || typeof node !== 'object') return '';
  switch (node.t) {
    case 'Str':
      return node.c;
    case 'Space':
    case 'SoftBreak':
    case 'LineBreak':
      return ' ';
    case 'Code':
      return node.c[1];
    case 'Math':
    case 'Note':
    case 'RawInline':
    case 'RawBlock':
      return '';
    case 'Quoted':
      return wordsOf(node.c[1]);
    case 'Link':
    case 'Image':
    case 'Span':
      return wordsOf(node.c[1]);
    case 'Cite':
      return wordsOf(node.c[1]);
    case 'Header':
      return wordsOf(node.c[2]);
    default:
      return node.c === undefined ? '' : wordsOf(node.c);
  }
}

/** A metadata value as a list of inlines. */
function metaInlines(value) {
  if (!value) return [];
  if (value.t === 'MetaInlines') return value.c;
  if (value.t === 'MetaString') return [{ t: 'Str', c: value.c }];
  if (value.t === 'MetaBlocks') {
    return value.c.flatMap((block) => (block.t === 'Para' || block.t === 'Plain' ? block.c : []));
  }
  return [];
}

/** A metadata value as a list of such lists (one for each author). */
function metaList(value) {
  if (!value) return [];
  if (value.t === 'MetaList') return value.c.map(metaInlines);
  return [metaInlines(value)];
}

/**
 * What a skipped piece is, read from the text pandoc reports for it.
 * @param {{ contents: string, source: string, placed: boolean }} entry
 * @returns {{ way: 'quiet' | 'mark' | 'count', label: string }}
 */
export function classify(entry) {
  const contents = entry.contents.trim();
  const environment = contents.match(/^\\(begin|end)\s*\{([^}]*)\}([\s\S]*)$/);
  if (environment) {
    const [, , name, rest] = environment;
    if (name === 'thebibliography') return { way: 'quiet', label: name };
    if (/\.sty$/i.test(entry.source)) return { way: 'quiet', label: name };
    if (rest.trim() === '') return { way: 'quiet', label: name };
    return { way: entry.placed ? 'mark' : 'count', label: name };
  }
  const command = contents.match(/^\\([A-Za-z@]+)\*?([\s\S]*)$/);
  if (!command) {
    // A control symbol (`\,`, `\!`): spacing.
    return {
      way: /^\\[^A-Za-z]$/.test(contents) ? 'quiet' : 'count',
      label: contents.slice(0, 30),
    };
  }
  const [, name, rest] = command;
  const label = `\\${name}`;
  if (name === 'bibitem' || /\.sty$/i.test(entry.source)) return { way: 'quiet', label };
  const groups = braceGroups(rest);
  if (LAYOUT_COMMANDS.has(name) && groups <= LAYOUT_COMMANDS.get(name))
    return { way: 'quiet', label };
  const argued = /^\s*[{[]/.test(rest);
  return { way: argued && entry.placed ? 'mark' : 'count', label };
}

/** How many groups in braces follow a command, arguments in square brackets apart. */
function braceGroups(rest) {
  let count = 0;
  let depth = 0;
  let square = 0;
  for (let i = 0; i < rest.length; i++) {
    const char = rest[i];
    if (char === '\\') {
      i += 1;
      continue;
    }
    if (depth === 0 && char === '[') square += 1;
    else if (depth === 0 && char === ']' && square > 0) square -= 1;
    else if (square > 0) continue;
    else if (char === '{') {
      if (depth === 0) count += 1;
      depth += 1;
    } else if (char === '}' && depth > 0) depth -= 1;
    else if (depth === 0 && !/\s/.test(char)) break;
  }
  return count;
}

/** Everything one conversion keeps as it goes. */
function makeContext({ skipped, format, name }) {
  const pieces = new Map(skipped.map((entry) => [entry.token, entry]));
  const pattern =
    pieces.size > 0
      ? new RegExp(
          [...pieces.keys()]
            .sort((a, b) => b.length - a.length)
            .map((token) => token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
            .join('|'),
          'g',
        )
      : null;
  return {
    format,
    name,
    marks: placeholders(),
    carried: [],
    leftOut: [],
    images: [],
    notes: [],
    pieces,
    pattern,
    counted: new Set(),
    shift: 1,
    refs: emptyReferences(),
    cites: { mode: 'none', own: new Map(), listed: new Set(), missing: new Set() },
  };
}

// --- References --------------------------------------------------------------

const isSpace = (node) => node?.t === 'Space' || node?.t === 'SoftBreak';
/** The label an empty mark carries: what pandoc leaves where a label stood. */
const markLabel = (node) =>
  node?.t === 'Span' && node.c[0][0] && node.c[1].length === 0 ? node.c[0][0] : null;

function emptyReferences() {
  return {
    /** label -> what it names: `{ kind, node }` */
    targets: new Map(),
    /** node -> the labels that name it */
    byNode: new Map(),
    /** label -> the words pandoc gave the first reference to it (its number), or null */
    referred: new Map(),
    /** the empty marks that are not written, their label naming what stands before */
    dropped: new Set(),
    /** a set-apart formula -> the label a Typst paper gave it */
    mathLabel: new Map(),
    /** labels of formulas whose rows take a number on the page */
    numbered: new Set(),
    /** label -> the anchor written for it */
    anchors: new Map(),
    taken: new Set(),
  };
}

/** What a link refers to, when it is a reference: its label or labels. */
function referenceOf(node) {
  const [, classes, pairs] = node.c[0];
  const named = pairs.find(([key]) => key === 'reference');
  if (named) return named[1];
  if (classes.includes('ref') && node.c[2][0].startsWith('#')) {
    try {
      return decodeURIComponent(node.c[2][0].slice(1));
    } catch {
      return node.c[2][0].slice(1);
    }
  }
  return null;
}

/**
 * Read a paper's labels and references before any of it is written: what each
 * label names, which labels are referred to, and which formulas' labels take a
 * number. A reference may stand before what it names, so this is a pass of
 * its own.
 * @param {any[]} top the paper's blocks
 * @param {string} format
 */
function surveyReferences(top, format) {
  const refs = emptyReferences();
  const target = (label, kind, node) => {
    if (!label || refs.targets.has(label)) return;
    refs.targets.set(label, { kind, node });
    refs.byNode.set(node, [...(refs.byNode.get(node) ?? []), label]);
  };
  const KIND = { Header: 'heading', Table: 'table', Figure: 'figure' };

  const inlines = (list, apart) => {
    list.forEach((node, i) => {
      switch (node.t) {
        case 'Math':
          if (node.c[0].t === 'DisplayMath' && apart) {
            for (const label of numberedLabels(oneLine(node.c[1]))) refs.numbered.add(label);
          }
          break;
        case 'Span': {
          const label = markLabel(node);
          if (label === null) {
            target(node.c[0][0], 'span', node);
            inlines(node.c[1], apart);
          } else if (!refs.dropped.has(node)) {
            let j = i - 1;
            while (j >= 0 && isSpace(list[j])) j -= 1;
            const before = list[j];
            if (
              format === 'typst' &&
              apart &&
              before?.t === 'Math' &&
              before.c[0].t === 'DisplayMath'
            ) {
              // A Typst label directly after a set-apart formula names that formula.
              target(label, 'equation', before);
              refs.mathLabel.set(before, label);
              refs.dropped.add(node);
            } else target(label, 'span', node);
          }
          break;
        }
        case 'Link': {
          const label = referenceOf(node);
          if (label !== null && !refs.referred.has(label)) {
            refs.referred.set(label, format === 'typst' ? null : wordsOf(node.c[1]).trim());
          }
          inlines(node.c[1], false);
          break;
        }
        case 'Note':
          blocks(node.c, true);
          break;
        case 'Quoted':
        case 'Cite':
          inlines(node.c[1], apart);
          break;
        case 'Emph':
        case 'Strong':
        case 'Strikeout':
        case 'Superscript':
        case 'Subscript':
        case 'SmallCaps':
        case 'Underline':
          inlines(node.c, apart);
          break;
        default:
      }
    });
  };
  const blocks = (list, apart) => {
    list.forEach((node, i) => {
      switch (node.t) {
        case 'Para':
        case 'Plain': {
          // A Typst label that is first in its paragraph names the heading,
          // table or figure before that paragraph.
          const first = node.c.find((inline) => !isSpace(inline));
          const label = format === 'typst' ? markLabel(first) : null;
          const before = list[i - 1];
          if (label !== null && before && KIND[before.t]) {
            target(label, KIND[before.t], before);
            refs.dropped.add(first);
          }
          inlines(node.c, apart);
          break;
        }
        case 'Header':
          target(node.c[1][0], 'heading', node);
          inlines(node.c[2], false);
          break;
        case 'Div':
          target(node.c[0][0], 'block', node);
          blocks(node.c[1], apart);
          break;
        case 'Table': {
          target(node.c[0][0], 'table', node);
          const [, caption, , head, bodies, foot] = node.c;
          const rows = [
            ...head[1],
            ...bodies.flatMap((part) => [...part[2], ...part[3]]),
            ...foot[1],
          ];
          for (const row of rows) for (const cell of row[1]) blocks(cell[4], false);
          blocks(caption?.[1] ?? [], false);
          break;
        }
        case 'Figure':
          target(node.c[0][0], 'figure', node);
          blocks(node.c[2], apart);
          blocks(node.c[1]?.[1] ?? [], false);
          break;
        case 'BulletList':
          node.c.forEach((item) => blocks(item, apart));
          break;
        case 'OrderedList':
          node.c[1].forEach((item) => blocks(item, apart));
          break;
        case 'DefinitionList':
          node.c.forEach(([term, definitions]) => {
            inlines(term, false);
            definitions.forEach((definition) => blocks(definition, apart));
          });
          break;
        case 'BlockQuote':
          blocks(node.c, apart);
          break;
        case 'LineBlock':
          node.c.forEach((lineOf) => inlines(lineOf, apart));
          break;
        default:
      }
    });
  };
  blocks(top, true);
  return refs;
}

/** The anchor a label is reached by: `ref-` and the label, made safe and its own. */
function anchorOf(ctx, label) {
  const { anchors, taken } = ctx.refs;
  if (anchors.has(label)) return anchors.get(label);
  const base = `ref-${label.replace(/[^A-Za-z0-9_-]/g, '-')}`;
  let id = base;
  for (let n = 2; taken.has(id); n++) id = `${base}-${n}`;
  taken.add(id);
  anchors.set(label, id);
  return id;
}

const anchorTag = (id) => html(`<a id="${id}"></a>`);
/** An anchor in a paragraph of its own, to stand directly before what it names. */
const anchorBlock = (id) => ({ type: 'paragraph', children: [anchorTag(id)] });

/** The anchors written before a heading, block, table or figure that is referred to. */
function anchorsBefore(node, ctx) {
  return (ctx.refs.byNode.get(node) ?? [])
    .filter((label) => ctx.refs.referred.has(label))
    .map((label) => anchorBlock(anchorOf(ctx, label)));
}

// --- Citations ---------------------------------------------------------------

/** Count a citation whose key is in no list, once for each key. */
function countMissing(ctx, key) {
  if (ctx.cites.missing.has(key)) return;
  ctx.cites.missing.add(key);
  ctx.leftOut.push({ kind: 'citation', count: 1, detail: key });
}

/** The inlines of blocks, run together, for a list that pandoc gave as paragraphs. */
function inlinesOf(blocks) {
  const out = [];
  for (const block of blocks) {
    const inner =
      block.t === 'Para' || block.t === 'Plain'
        ? block.c
        : block.t === 'Div'
          ? inlinesOf(block.c[1])
          : [{ t: 'Str', c: wordsOf(block) }];
    if (out.length > 0 && inner.length > 0) out.push({ t: 'Space' });
    out.push(...inner);
  }
  return out;
}

/**
 * Find the paper's reference list and put one node in its place.
 *
 * With `citeproc`, pandoc ends the paper with a block `refs` that holds an
 * entry for each key cited, and, for a Typst paper, writes a heading before it
 * even when the list is empty. A LaTeX paper's own list reaches the tree as
 * the words of its entries between the words that stand for three skipped
 * pieces: `\begin{thebibliography}`, each `\bibitem{key}`, and the `\end`.
 * @param {any[]} blocks the paper's blocks
 * @param {any} ctx
 * @returns {any[]} the blocks, with `TomeReferences` or `TomeBibliography` where the list stood
 */
function arrangeBibliography(blocks, ctx) {
  const at = blocks.findIndex((block) => block.t === 'Div' && block.c[0][0] === 'refs');
  if (at !== -1) {
    ctx.cites.mode = 'citeproc';
    const entries = blocks[at].c[1]
      .filter((block) => block.t === 'Div' && block.c[0][0])
      .map((block) => ({ id: block.c[0][0], blocks: block.c[1] }));
    for (const entry of entries) ctx.cites.listed.add(entry.id);
    const headed = blocks[at - 1]?.t === 'Header';
    // An empty list writes nothing, the heading pandoc wrote for it included.
    const list =
      entries.length > 0
        ? [{ t: 'TomeReferences', heading: headed ? blocks[at - 1].c[2] : null, entries }]
        : [];
    return [...blocks.slice(0, headed ? at - 1 : at), ...list, ...blocks.slice(at + 1)];
  }

  const pieces = [...ctx.pieces.values()].filter((entry) => entry.placed);
  const opening = pieces.find((entry) => /^\\begin\s*\{thebibliography\}/.test(entry.contents));
  const closing = pieces.find((entry) => /^\\end\s*\{thebibliography\}/.test(entry.contents));
  if (!opening || !closing) return blocks;
  const holds = (block, entry) => JSON.stringify(block).includes(entry.token);
  const from = blocks.findIndex((block) => holds(block, opening));
  const to = blocks.findIndex((block) => holds(block, closing));
  if (from === -1 || to < from) return blocks;

  const items = pieces.filter((entry) => /^\\bibitem\b/.test(entry.contents));
  const marks = new Map([opening, closing, ...items].map((entry) => [entry.token, entry]));
  const pattern = new RegExp(
    [...marks.keys()].map((token) => token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'),
    'g',
  );
  // Each word that stands for one of the list's pieces, apart from the text round it.
  const stream = [];
  for (const node of inlinesOf(blocks.slice(from, to + 1))) {
    if (node.t !== 'Str') {
      stream.push(node);
      continue;
    }
    let last = 0;
    for (const match of node.c.matchAll(pattern)) {
      if (match.index > last) stream.push({ t: 'Str', c: node.c.slice(last, match.index) });
      stream.push({ piece: marks.get(match[0]) });
      last = match.index + match[0].length;
    }
    if (last < node.c.length) stream.push({ t: 'Str', c: node.c.slice(last) });
  }
  const before = [];
  const after = [];
  const entries = [];
  let state = 'before';
  let width = false;
  for (const node of stream) {
    if (node.piece === opening) {
      state = 'in';
      width = true; // the number that sets the list's width follows, and is not written
      continue;
    }
    if (node.piece === closing) {
      state = 'after';
      continue;
    }
    if (node.piece) {
      const key = node.piece.contents
        .match(/\\bibitem\s*(?:\[[^\]]*\])?\s*\{([^}]*)\}/)?.[1]
        ?.trim();
      if (state === 'in') entries.push({ key: key ?? '', inlines: [] });
      width = false;
      continue;
    }
    if (state === 'before') before.push(node);
    else if (state === 'after') after.push(node);
    else if (width && node.t === 'Str') width = false;
    else if (entries.length > 0) entries[entries.length - 1].inlines.push(node);
  }
  ctx.cites.mode = 'own';
  entries.forEach((entry, index) => {
    if (!ctx.cites.own.has(entry.key)) ctx.cites.own.set(entry.key, index + 1);
  });
  const words = (inlines) => (wordsOf(inlines).trim() ? [{ t: 'Para', c: inlines }] : []);
  return [
    ...blocks.slice(0, from),
    ...words(before),
    { t: 'TomeBibliography', entries },
    ...words(after),
    ...blocks.slice(to + 1),
  ];
}

/** The anchor before an entry of the paper's own list. */
const ownAnchor = (ctx, key) => anchorOf(ctx, `bib:${key}`);

/**
 * A citation. Worked out by `citeproc`, it is pandoc's words, each entry's a
 * link to that entry. Otherwise it is the numbers of its entries in the
 * paper's own list, in square brackets, with what the citation carries before
 * and after them; a key in no list is the key itself, and is counted.
 */
function citation(node, ctx, where) {
  if (ctx.cites.mode === 'citeproc') return phrasing(node.c[1], ctx, { ...where, cite: true });
  const out = [text('[')];
  node.c[0].forEach((cited, index) => {
    if (index > 0) out.push(text(', '));
    const prefix = line(cited.citationPrefix ?? [], ctx);
    if (prefix.length > 0) out.push(...prefix, text(' '));
    const key = String(cited.citationId);
    const number = ctx.cites.own.get(key);
    if (number === undefined) {
      countMissing(ctx, key);
      out.push(text(key));
    } else {
      out.push({
        type: 'link',
        url: `#${ownAnchor(ctx, key)}`,
        title: null,
        children: [text(String(number))],
      });
    }
    const suffix = line(cited.citationSuffix ?? [], ctx);
    if (suffix[0]?.type === 'text') suffix[0].value = suffix[0].value.replace(/^[,\s]+/, '');
    if (shows(suffix)) out.push(text(', '), ...suffix);
  });
  out.push(text(']'));
  return out;
}

/** The reference list `citeproc` made: a heading, then each entry behind its anchor. */
function referenceList(node, ctx) {
  const heading = node.heading ? line(node.heading, ctx) : [];
  const out = [
    { type: 'heading', depth: 2, children: heading.length > 0 ? heading : [text('References')] },
  ];
  for (const entry of node.entries) {
    out.push(anchorBlock(anchorOf(ctx, entry.id)), ...flow(entry.blocks, ctx));
  }
  return out;
}

/** The paper's own list: a heading, then a numbered list, each item behind its anchor. */
function ownList(node, ctx) {
  return [
    { type: 'heading', depth: 2, children: [text('References')] },
    {
      type: 'list',
      ordered: true,
      start: 1,
      spread: false,
      children: node.entries.map((entry) =>
        item([
          {
            type: 'paragraph',
            children: [anchorTag(ownAnchor(ctx, entry.key)), ...line(entry.inlines, ctx)],
          },
        ]),
      ),
    },
  ];
}

/** A reference, written as a link to what it names, or as its words and counted. */
function referenceLink(node, label, ctx, inside) {
  const words = phrasing(node.c[1], ctx, inside);
  const single = !label.includes(',');
  const named = single ? ctx.refs.targets.get(label) : undefined;
  if (named) {
    let children = words;
    if (ctx.format === 'typst') {
      // Pandoc numbers nothing in a Typst paper: the words say what is named.
      if (named.kind === 'heading') children = [text(wordsOf(named.node).trim())];
      else if (named.kind === 'table') children = [text('the table')];
      else if (named.kind === 'figure') children = [text('the figure')];
      else if (named.kind === 'equation') children = [text('the equation')];
    }
    return [{ type: 'link', url: `#${anchorOf(ctx, label)}`, title: null, children }];
  }
  if (single && ctx.refs.numbered.has(label)) {
    // A numbered equation: the page writes the number in (rehype-math.mjs).
    return [{ type: 'link', url: `#${encodeURI(label)}`, title: null, children: [text(label)] }];
  }
  ctx.leftOut.push({ kind: 'reference', count: 1, detail: label });
  return words;
}

/** Count a skipped piece, once, by the way it is dealt with. */
function countPiece(ctx, entry, { mark }) {
  const { way, label } = classify(entry);
  if (ctx.counted.has(entry)) return way === 'mark' && mark;
  ctx.counted.add(entry);
  if (way === 'quiet') return false;
  const marked = way === 'mark' && mark;
  const elsewhere = entry.source && entry.source !== ctx.name ? entry.source : undefined;
  ctx.leftOut.push({
    kind: marked ? 'latex' : 'command',
    count: 1,
    detail: `${label}${elsewhere ? ` in ${elsewhere}` : ''} at line ${entry.line}`,
    name: label,
    ...(elsewhere ? { file: elsewhere } : {}),
    line: entry.line,
  });
  return marked;
}

/**
 * A run of text, with each word that stands for a skipped piece taken out:
 * the mark in its place, or one space.
 * @param {string} value
 * @param {any} ctx
 * @param {{ mark?: boolean }} [how] `mark: false` where a mark cannot stand (a title)
 */
function textWithPieces(value, ctx, { mark = true } = {}) {
  if (!ctx.pattern) return value;
  return value.replace(ctx.pattern, (token) => {
    const entry = ctx.pieces.get(token);
    return countPiece(ctx, entry, { mark }) ? LATEX_MARK : ' ';
  });
}

/** Carry a formula as a place-holder; `where` says whether it can stand apart. */
function carry(node, ctx, where) {
  const display = node.c[0].t === 'DisplayMath' && where.apart;
  ctx.carried.push({ latex: oneLine(node.c[1]), display, cell: Boolean(where.cell) });
  const index = ctx.carried.length - 1;
  return display ? { type: 'tomeDisplay', index } : text(ctx.marks.token(index));
}

/**
 * Pandoc's inlines as mdast phrasing. A set-apart formula that may stand apart
 * comes back as a `tomeDisplay` node, for `flow()` to divide its paragraph at.
 */
function phrasing(inlines, ctx, where) {
  const out = [];
  for (const node of inlines ?? []) {
    switch (node.t) {
      case 'Str':
        out.push(text(textWithPieces(node.c, ctx, where)));
        break;
      case 'Space':
      case 'SoftBreak':
        out.push(text(' '));
        break;
      case 'LineBreak':
        out.push(html('<br>'));
        break;
      case 'Emph':
        out.push({ type: 'emphasis', children: phrasing(node.c, ctx, where) });
        break;
      case 'Strong':
        out.push({ type: 'strong', children: phrasing(node.c, ctx, where) });
        break;
      case 'Strikeout':
        out.push({ type: 'delete', children: phrasing(node.c, ctx, where) });
        break;
      case 'Superscript':
        out.push(html('<sup>'), ...phrasing(node.c, ctx, where), html('</sup>'));
        break;
      case 'Subscript':
        out.push(html('<sub>'), ...phrasing(node.c, ctx, where), html('</sub>'));
        break;
      case 'Underline':
      case 'SmallCaps':
        out.push(...phrasing(node.c, ctx, where));
        break;
      case 'Span': {
        if (ctx.refs.dropped.has(node)) break;
        // A label pandoc keeps as a mark within the line: an anchor at its place.
        const named = ctx.refs.byNode.get(node) ?? [];
        for (const label of named) {
          if (ctx.refs.referred.has(label)) out.push(anchorTag(anchorOf(ctx, label)));
        }
        out.push(...phrasing(node.c[1], ctx, where));
        break;
      }
      case 'Quoted': {
        const double = node.c[0].t === 'DoubleQuote';
        out.push(
          text(double ? '“' : '‘'),
          ...phrasing(node.c[1], ctx, where),
          text(double ? '”' : '’'),
        );
        break;
      }
      case 'Code':
        out.push({ type: 'inlineCode', value: node.c[1] });
        break;
      case 'Math': {
        const carried = carry(node, ctx, where);
        const label = ctx.refs.mathLabel.get(node);
        if (label !== undefined && ctx.refs.referred.has(label)) {
          // A Typst formula that is referred to: an anchor before it.
          if (carried.type === 'tomeDisplay') carried.anchor = anchorOf(ctx, label);
          else out.push(anchorTag(anchorOf(ctx, label)));
        }
        out.push(carried);
        break;
      }
      case 'Link':
        out.push(...link(node, ctx, where));
        break;
      case 'Image': {
        const placeholder = `tome-paper-image-${ctx.images.length}`;
        ctx.images.push({ url: node.c[2][0], placeholder });
        out.push({ type: 'image', url: placeholder, alt: wordsOf(node.c[1]).trim(), title: null });
        break;
      }
      case 'Note': {
        // The number is kept while the note itself is written: it may hold a note.
        const place = ctx.notes.push(null) - 1;
        const identifier = String(place + 1);
        ctx.notes[place] = {
          type: 'footnoteDefinition',
          identifier,
          label: identifier,
          children: flow(node.c, ctx),
        };
        out.push({ type: 'footnoteReference', identifier, label: identifier });
        break;
      }
      case 'Cite':
        out.push(...citation(node, ctx, where));
        break;
      case 'RawInline':
        break;
      default:
        ctx.leftOut.push({ kind: 'node', count: 1, detail: String(node.t) });
        out.push(text(wordsOf(node)));
    }
  }
  return out;
}

/** A link: its address when it is one Tome writes, else its words. */
function link(node, ctx, where) {
  const inside = { ...where, apart: false };
  if (where.cite && node.c[2][0].startsWith('#ref-')) {
    // A citation's link to its entry, as `citeproc` writes it.
    const words = phrasing(node.c[1], ctx, inside);
    const id = node.c[2][0].slice(1);
    if (ctx.cites.listed.has(id)) {
      return [{ type: 'link', url: `#${anchorOf(ctx, id)}`, title: null, children: words }];
    }
    countMissing(ctx, id.replace(/^ref-/, ''));
    return words;
  }
  const label = referenceOf(node);
  if (label !== null) return referenceLink(node, label, ctx, inside);
  const children = phrasing(node.c[1], ctx, inside);
  const address = node.c[2][0];
  if (!SAFE_ADDRESS.test(address)) return children;
  return [{ type: 'link', url: address, title: null, children }];
}

/** Whether phrasing holds anything a reader would see. */
function shows(nodes) {
  return nodes.some((node) =>
    node.type === 'text'
      ? node.value.trim() !== ''
      : node.type !== 'html' || !/^<\/?(?:sup|sub)>$/.test(node.value),
  );
}

/** Join neighbouring text, make runs of spaces one, and trim the ends. */
function tidy(nodes) {
  const out = [];
  for (const node of nodes) {
    if (node.children && node.type !== 'tomeDisplay') node.children = tidyInner(node.children);
    const last = out[out.length - 1];
    if (node.type === 'text' && last?.type === 'text') last.value += node.value;
    else out.push(node);
  }
  for (const node of out)
    if (node.type === 'text') node.value = node.value.replace(/[ \t]{2,}/g, ' ');
  const first = out[0];
  if (first?.type === 'text') first.value = first.value.replace(/^\s+/, '');
  const end = out[out.length - 1];
  if (end?.type === 'text') end.value = end.value.replace(/\s+$/, '');
  return out.filter((node) => node.type !== 'text' || node.value !== '');
}

function tidyInner(nodes) {
  const out = [];
  for (const node of nodes) {
    if (node.children) node.children = tidyInner(node.children);
    const last = out[out.length - 1];
    if (node.type === 'text' && last?.type === 'text') last.value += node.value;
    else out.push(node);
  }
  for (const node of out)
    if (node.type === 'text') node.value = node.value.replace(/[ \t]{2,}/g, ' ');
  return out.filter((node) => node.type !== 'text' || node.value !== '');
}

/**
 * Divide phrasing at each set-apart formula, wherever it is nested in emphasis
 * or strong text: `[{ nodes }, { display }, { nodes }]`, the emphasis kept on
 * each side.
 */
function divide(nodes) {
  const parts = [{ nodes: [] }];
  const current = () => parts[parts.length - 1].nodes;
  for (const node of nodes) {
    if (node.type === 'tomeDisplay') {
      parts.push({ display: node.index, anchor: node.anchor }, { nodes: [] });
    } else if (holdsDisplay(node)) {
      for (const part of divide(node.children)) {
        if (part.display !== undefined) {
          parts.push({ display: part.display, anchor: part.anchor }, { nodes: [] });
        } else if (shows(part.nodes)) current().push({ ...node, children: tidy(part.nodes) });
      }
    } else {
      current().push(node);
    }
  }
  return parts;
}

function holdsDisplay(node) {
  return (node.children ?? []).some((child) => child.type === 'tomeDisplay' || holdsDisplay(child));
}

/** A set-apart formula that could not be set apart is written within its line. */
function inlineDisplays(nodes, ctx) {
  return nodes.map((node) => {
    if (node.type === 'tomeDisplay') {
      ctx.carried[node.index].display = false;
      return text(ctx.marks.token(node.index));
    }
    if (node.children) return { ...node, children: inlineDisplays(node.children, ctx) };
    return node;
  });
}

/** One paragraph of pandoc's as mdast flow: itself, or divided at its set-apart formulas. */
function paragraphs(inlines, ctx) {
  const out = [];
  for (const part of divide(phrasing(inlines, ctx, { apart: true }))) {
    if (part.display !== undefined) {
      if (part.anchor) out.push(anchorBlock(part.anchor));
      out.push({ type: 'paragraph', children: [text(ctx.marks.token(part.display))] });
      continue;
    }
    const children = tidy(part.nodes);
    if (shows(children)) out.push({ type: 'paragraph', children });
  }
  return out;
}

/** Phrasing for a place where nothing can stand apart: a heading, a cell, a caption. */
function line(inlines, ctx, where = {}) {
  return tidy(inlineDisplays(phrasing(inlines, ctx, { ...where, apart: false }), ctx));
}

/** The inlines of a list of blocks, for a place that holds one line. */
function lineOfBlocks(blocks, ctx, where = {}) {
  const out = [];
  for (const block of blocks ?? []) {
    const inlines =
      block.t === 'Para' || block.t === 'Plain' ? block.c : [{ t: 'Str', c: wordsOf(block) }];
    const part = line(inlines, ctx, where);
    if (part.length === 0) continue;
    if (out.length > 0) out.push(html('<br>'));
    out.push(...part);
  }
  return out;
}

const ALIGN = { AlignLeft: 'left', AlignRight: 'right', AlignCenter: 'center', AlignDefault: null };

function table(node, ctx) {
  const [, caption, specs, head, bodies, foot] = node.c;
  const rowsOf = (rows) =>
    rows.map((row) => row[1].map((cell) => lineOfBlocks(cell[4], ctx, { cell: true })));
  const heads = rowsOf(head[1]);
  const body = [
    ...bodies.flatMap((part) => [...rowsOf(part[2]), ...rowsOf(part[3])]),
    ...rowsOf(foot[1]),
  ];
  const rows = [...heads, ...body];
  if (rows.length === 0) return [];
  const width = Math.max(specs.length, ...rows.map((row) => row.length));
  const out = [
    {
      type: 'table',
      align: Array.from({ length: width }, (_, i) => ALIGN[specs[i]?.[0]?.t] ?? null),
      children: rows.map((row) => ({
        type: 'tableRow',
        children: Array.from({ length: width }, (_, i) => ({
          type: 'tableCell',
          children: row[i] ?? [],
        })),
      })),
    },
  ];
  const words = captionOf(caption, ctx, node);
  if (words.length > 0) out.push({ type: 'paragraph', children: words });
  return out;
}

/** A caption's one line, after the number a reference to it shows. */
function captionOf(caption, ctx, node) {
  const words = lineOfBlocks(caption?.[1] ?? [], ctx);
  if (words.length === 0) return words;
  return [...captionLead(node, ctx), ...words];
}

/**
 * What stands before a caption's words: `Table 1.` or `Figure 1.`, the number
 * being the one a reference to it shows. Tome works out no number of its own,
 * so a table or figure nothing refers to has its caption as written.
 */
function captionLead(node, ctx) {
  const number = ctx.refs.referred.get(node.c[0][0]);
  if (typeof number !== 'string' || !/^[0-9A-Za-z][0-9A-Za-z.]*$/.test(number)) return [];
  const kind = node.t === 'Table' ? 'Table' : 'Figure';
  return [{ type: 'emphasis', children: [text(`${kind} ${number}.`)] }, text(' ')];
}

function figure(node, ctx) {
  const [, caption, blocks] = node.c;
  const out = flow(blocks, ctx);
  const words = captionOf(caption, ctx, node);
  if (words.length > 0) out.push({ type: 'paragraph', children: words });
  return out;
}

const item = (children) => ({ type: 'listItem', spread: false, children });

/** Pandoc's blocks as mdast flow. */
function flow(blocks, ctx) {
  const out = [];
  for (const node of blocks ?? []) {
    switch (node.t) {
      case 'Para':
      case 'Plain':
        out.push(...paragraphs(node.c, ctx));
        break;
      case 'Header': {
        const children = line(node.c[2], ctx);
        if (children.length === 0) break;
        out.push(...anchorsBefore(node, ctx));
        out.push({ type: 'heading', depth: Math.min(6, node.c[0] + ctx.shift), children });
        break;
      }
      case 'BulletList':
        out.push({
          type: 'list',
          ordered: false,
          spread: false,
          children: node.c.map((blocksOfItem) => item(flow(blocksOfItem, ctx))),
        });
        break;
      case 'OrderedList':
        out.push({
          type: 'list',
          ordered: true,
          start: node.c[0][0],
          spread: false,
          children: node.c[1].map((blocksOfItem) => item(flow(blocksOfItem, ctx))),
        });
        break;
      case 'DefinitionList':
        out.push({
          type: 'list',
          ordered: false,
          spread: false,
          children: node.c.map(([term, definitions]) => {
            const body = flow(definitions.flat(), ctx);
            const lead = [{ type: 'strong', children: line(term, ctx) }, text(': ')];
            if (body[0]?.type === 'paragraph')
              body[0] = { ...body[0], children: [...lead, ...body[0].children] };
            else body.unshift({ type: 'paragraph', children: lead.slice(0, 1) });
            return item(body);
          }),
        });
        break;
      case 'BlockQuote':
        out.push({ type: 'blockquote', children: flow(node.c, ctx) });
        break;
      case 'CodeBlock':
        out.push({ type: 'code', lang: node.c[0][1][0] ?? null, meta: null, value: node.c[1] });
        break;
      case 'HorizontalRule':
        out.push({ type: 'thematicBreak' });
        break;
      case 'LineBlock':
        out.push(
          ...paragraphs(
            node.c.flatMap((inlines, i) => (i === 0 ? inlines : [{ t: 'LineBreak' }, ...inlines])),
            ctx,
          ),
        );
        break;
      case 'Table':
        out.push(...anchorsBefore(node, ctx), ...table(node, ctx));
        break;
      case 'Figure':
        out.push(...anchorsBefore(node, ctx), ...figure(node, ctx));
        break;
      case 'Div':
        out.push(...anchorsBefore(node, ctx), ...flow(node.c[1], ctx));
        break;
      case 'TomeReferences':
        out.push(...referenceList(node, ctx));
        break;
      case 'TomeBibliography':
        out.push(...ownList(node, ctx));
        break;
      case 'RawBlock':
      case 'Null':
        break;
      default: {
        ctx.leftOut.push({ kind: 'node', count: 1, detail: String(node.t) });
        const words = wordsOf(node).trim();
        if (words) out.push({ type: 'paragraph', children: [text(words)] });
      }
    }
  }
  return out;
}

/** A title as plain text: a formula by what it shows, or as typed. */
function plainTitle(inlines, ctx) {
  const out = [];
  for (const node of inlines) {
    if (node.t === 'Note') continue;
    if (node.t === 'Math') {
      const latex = oneLine(node.c[1]);
      out.push(titleText(latex) ?? `$${latex}$`);
    } else if (node.t === 'Str') out.push(textWithPieces(node.c, ctx, { mark: false }));
    else if (node.t === 'Space' || node.t === 'SoftBreak' || node.t === 'LineBreak') out.push(' ');
    else if (node.t === 'Code') out.push(node.c[1]);
    else if (Array.isArray(node.c)) {
      const inner =
        node.t === 'Quoted' || node.t === 'Link' || node.t === 'Span' ? node.c[1] : node.c;
      out.push(plainTitle(Array.isArray(inner) ? inner : [], ctx));
    }
  }
  return out.join('').replace(/\s+/g, ' ').trim();
}

/** Notes inside a list of inlines, taken out of it. */
function takeNotes(inlines) {
  const notes = [];
  const rest = [];
  for (const node of inlines) {
    if (node.t === 'Note') notes.push(node);
    else if (
      Array.isArray(node.c) &&
      ['Emph', 'Strong', 'Underline', 'SmallCaps'].includes(node.t)
    ) {
      const inner = takeNotes(node.c);
      notes.push(...inner.notes);
      rest.push({ ...node, c: inner.rest });
    } else rest.push(node);
  }
  return { notes, rest };
}

/**
 * Write a paper's tree as Markdown.
 *
 * @param {{
 *   tree: { blocks: any[], meta?: Record<string, any> },
 *   skipped?: { contents: string, source: string, line: number, token: string, placed: boolean }[],
 *   format?: 'latex' | 'typst',
 *   name?: string,
 *   fallbackTitle?: string,
 *   read?: (markdown: string) => string[],
 * }} paper `tree` and `skipped` as `readPaper()` gives them; `name` is the
 *   paper's own file as `skipped` names files; `fallbackTitle` heads a paper
 *   with no title of its own; `read` is the reader each formula is checked
 *   with (default: Tome's own)
 * @returns {{
 *   markdown: string,
 *   title: string,
 *   images: { url: string, placeholder: string }[],
 *   leftOut: { kind: string, count: number, detail?: string, name?: string, file?: string, line?: number }[],
 * }} `images` lists each picture's address as the paper gives it and the
 *   address written for it in the Markdown, for the caller to settle.
 */
export function writePaper({
  tree,
  skipped = [],
  format = 'latex',
  name = '',
  fallbackTitle = 'Untitled',
  read,
}) {
  const ctx = makeContext({ skipped, format, name });
  const meta = tree.meta ?? {};
  let blocks = tree.blocks ?? [];
  ctx.refs = surveyReferences(
    [...(meta.abstract?.t === 'MetaBlocks' ? meta.abstract.c : []), ...blocks],
    format,
  );

  const titled = takeNotes(metaInlines(meta.title));
  const frontNotes = [...titled.notes];
  let title = plainTitle(titled.rest, ctx);
  let heading = title ? line(titled.rest, ctx, { mark: false }) : [];
  const first = blocks[0];
  if (
    title &&
    first?.t === 'Header' &&
    first.c[0] === 1 &&
    wordsOf(first).trim() === wordsOf(titled.rest).trim()
  ) {
    // The paper writes its title as its first heading: that heading is the title.
    blocks = blocks.slice(1);
    ctx.shift = 0;
  }
  if (!title) {
    title = fallbackTitle;
    heading = [text(fallbackTitle)];
  }

  const front = [];
  if (format !== 'typst') {
    const authors = metaList(meta.author).map((inlines) => {
      const author = takeNotes(inlines);
      frontNotes.push(...author.notes);
      return line(author.rest, ctx, { mark: false });
    });
    const date = line(metaInlines(meta.date), ctx, { mark: false });
    const byline = [];
    for (const part of [...authors, date]) {
      if (!shows(part)) continue;
      if (byline.length > 0) byline.push(text(', '));
      byline.push(...part);
    }
    if (byline.length > 0)
      front.push({ type: 'paragraph', children: [{ type: 'emphasis', children: byline }] });
  }
  for (const note of frontNotes) front.push(...flow(note.c, ctx));
  if (meta.abstract) {
    const abstract =
      meta.abstract.t === 'MetaBlocks'
        ? flow(meta.abstract.c, ctx)
        : paragraphs(metaInlines(meta.abstract), ctx);
    if (abstract.length > 0) {
      front.push(
        { type: 'paragraph', children: [{ type: 'strong', children: [text('Abstract')] }] },
        ...abstract,
      );
    }
  }

  const body = flow(arrangeBibliography(blocks, ctx), ctx);
  const root = {
    type: 'root',
    children: [
      { type: 'heading', depth: 1, children: heading },
      ...front,
      ...body,
      ...ctx.notes.filter(Boolean),
    ],
  };

  // A piece whose word never came by is counted too: nothing is lost without a word.
  for (const entry of skipped) countPiece(ctx, entry, { mark: false });

  const written = unified()
    .use(remarkGfm)
    .use(remarkStringify, {
      bullet: '-',
      emphasis: '_',
      rule: '-',
      // Tome reads `$…$` as a formula (INT-0030): a dollar sign of the paper's
      // own text is written `\$`, as the Word converter writes it.
      unsafe: [{ character: '$', inConstruct: 'phrasing' }],
    })
    .stringify(root);

  const settled = settleEquations(written, ctx.carried, ctx.marks, read);
  let markdown = settled.markdown;
  if (ctx.pattern) markdown = markdown.replace(ctx.pattern, '');
  const leftOut = [...ctx.leftOut];
  if (settled.lost > 0) leftOut.push({ kind: 'equation', count: settled.lost });
  return { markdown, title, images: ctx.images, leftOut };
}
