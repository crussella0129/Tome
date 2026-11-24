// Ask pandoc for a paper's tree (INT-0033): a document written in LaTeX or in
// Typst, with the files it pulls in and a record of what pandoc skipped.
//
// Pandoc is the npm package `pandoc-wasm`. It runs on a file system held in
// memory, one flat map of names, and can open nothing else: so this module
// reads the paper's own files, from the paper's folder and the folders within
// it and nowhere else, and hands pandoc copies of them. Nothing is written to
// disk and nothing is fetched. A file from a folder within the paper's is
// given under a stand-in name with no `/`, and the argument that names it is
// rewritten in the copy of the file that names it.
//
// A LaTeX paper is read without pandoc's `raw_tex`, which would hand back
// references, labels and included files unread. What pandoc skips it reports
// with a place; the paper is then read once more from copies in which each
// skipped piece is a word of letters and digits, so that the tree holds that
// word where the piece stood (scripts/pandoc-to-markdown.mjs writes a mark
// there, or passes it over).
import { randomBytes } from 'node:crypto';
import { readFile, realpath, stat } from 'node:fs/promises';
import path from 'node:path';

/**
 * Whether `target` is `root` or lies within it, as `isPathInside()` in
 * parent-assets.mjs decides it. (Kept here so that this module loads nothing
 * that reads Markdown.)
 */
function isPathInside(root, target) {
  const rel = path.relative(path.resolve(root), path.resolve(target));
  return rel === '' || (!path.isAbsolute(rel) && rel !== '..' && !rel.startsWith(`..${path.sep}`));
}

/** Pandoc could not read the paper at all. The message is pandoc's own reason. */
export class PaperRefused extends Error {
  constructor(message) {
    super(message);
    this.name = 'PaperRefused';
  }
}

/** How much of a paper's own files is handed to pandoc. */
export const LIMITS = Object.freeze({ readings: 20, files: 200, bytes: 20 * 1024 * 1024 });

let loading = null;
/** Pandoc's `convert`, loaded on the first call and once in a process. */
async function pandoc() {
  loading ??= import('pandoc-wasm');
  return (await loading).convert;
}

const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** The word that stands for the `index`th skipped piece. */
function tokenFor(nonce, index) {
  return `tomeSkipped${nonce}n${index}x`;
}

/** Code in a LaTeX file, where nothing is replaced, or `\today` outside it. */
/**
 * What of a LaTeX file is not text the paper names a file in: a comment; code
 * the paper shows as written (`verbatim`, fancyvrb's `Verbatim`, `lstlisting`,
 * `minted`, `\verb`, `\lstinline` in any of its forms); and what LaTeX never
 * reads (`comment`, and `\iffalse` up to its `\else` or `\fi`). The address of
 * a `\url` or `\href` is matched first, since a `%` in it is a character; then
 * a comment, where it begins, so a `\begin{verbatim}` in a comment starts
 * nothing. A `%` after an even run of backslashes (`\\%`) begins a comment.
 */
const LATEX_CODE_SOURCE =
  String.raw`\\(?:url|href|nolinkurl)\s*\{[^{}]*\}` +
  String.raw`|(?<=(?:^|[^\\])(?:\\\\)*)%[^\n]*` +
  String.raw`|\\begin\{(verbatim\*?|Verbatim\*?|BVerbatim\*?|LVerbatim\*?|lstlisting|minted|comment)\}[\s\S]*?\\end\{\1\}` +
  String.raw`|\\verb\*?([^A-Za-z\s])[^\n]*?\2` +
  String.raw`|\\lstinline(?:\[[^\]]*\])?(?:\{[^{}]*\}|([^A-Za-z\s\[{])[^\n]*?\3)` +
  String.raw`|\\iffalse(?![A-Za-z])[\s\S]*?\\(?:else|fi)(?![A-Za-z])`;
const LATEX_CODE = new RegExp(LATEX_CODE_SOURCE, 'g');
/** The same, and `\today` outside it. */
const TODAY_OR_CODE = new RegExp(`${LATEX_CODE_SOURCE}|\\\\today(?![A-Za-z])`, 'g');
/**
 * Code in a Typst file: a raw block, or raw text within one line. (Raw text
 * may run over a line end in Typst, but a lone backtick, escaped or in a
 * comment or a string, would then pair with the next raw text and hide all
 * between: a line is the safer reach.)
 */
const TYPST_CODE = /(`{3,})[\s\S]*?\1|`[^`\n]*`/g;
/** A string in a Typst file, outside raw text. */
const TYPST_STRING = /()"([^"\n]+)"/g;
/** Where Typst code stands: after `#`, or after what opens or joins code, or at a line's start. */
const TYPST_CODE_PLACE = String.raw`(?:#|(?:^|[{;(=,+]|=>)[ \t]*)`;

/**
 * A text with `change` made outside its code only: what the paper shows as
 * code is shown as the paper wrote it.
 * @param {string} text @param {RegExp} code @param {(part: string) => string} change
 */
function outsideCode(text, code, change) {
  let out = '';
  let last = 0;
  for (const match of text.matchAll(new RegExp(code.source, 'g'))) {
    out += change(text.slice(last, match.index)) + match[0];
    last = match.index + match[0].length;
  }
  return out + change(text.slice(last));
}

/**
 * The files a Typst file includes or imports, as written: `#include "…"`,
 * `#import "…"`, `#include("…")`, and `include "…"` where code stands (after
 * `{`, `;`, `(`, `=`, `,`, `+`, `=>` or at a line's start). Words of prose that read
 * "import "a.typ"" name nothing; nor does a comment or raw text.
 * @param {string} text
 */
export function typstFilesNamed(text) {
  const shown = outsideCode(text, TYPST_CODE, (part) =>
    part.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1'),
  ).replace(TYPST_CODE, '');
  return [
    ...shown.matchAll(
      new RegExp(`${TYPST_CODE_PLACE}(?:include|import)\\s*\\(?\\s*"([^"\\n]+)"`, 'gm'),
    ),
  ].map((match) => match[1]);
}

/**
 * The paper's own files as pandoc is given them.
 * `texts` maps the name pandoc knows a file by to its content; `rels` maps
 * that name to the file's path from the paper's folder.
 */
class Supply {
  constructor(dir, realDir) {
    this.dir = dir;
    this.realDir = realDir;
    this.texts = new Map();
    this.rels = new Map();
    this.byRel = new Map();
    this.bytes = 0;
    this.full = false;
  }

  /** The name a file was given, by its path from the paper's folder. */
  nameOf(rel) {
    return this.byRel.get(rel);
  }

  /**
   * Read one file of the paper's and keep a copy, or return null: it is not
   * there, is not a regular file, lies outside the paper's folder, is reached
   * through a link that leaves it, or the limits are spent.
   * @param {string} rel `/`-separated path from the paper's folder
   * @param {{ flat?: boolean, change?: (text: string) => string }} [how]
   * @returns {Promise<string | null>} the name pandoc is to know it by
   */
  async add(rel, { flat = false, change } = {}) {
    const normal = path.posix.normalize(rel);
    if (this.byRel.has(normal)) return this.byRel.get(normal);
    if (normal.startsWith('../') || normal === '..' || path.posix.isAbsolute(normal)) return null;
    const target = path.join(this.dir, ...normal.split('/'));
    if (!isPathInside(this.dir, target)) return null;
    if (this.full || this.texts.size >= LIMITS.files) {
      this.full = true;
      return null;
    }
    let text;
    try {
      const real = await realpath(target);
      if (!isPathInside(this.realDir, real) || !(await stat(real)).isFile()) return null;
      const size = (await stat(real)).size;
      if (this.bytes + size > LIMITS.bytes) {
        this.full = true;
        return null;
      }
      text = (await readFile(real, 'utf8')).replace(/^\uFEFF/, '');
      this.bytes += size;
    } catch {
      return null;
    }
    let name = normal;
    if (!flat || normal.includes('/') || this.texts.has(name)) {
      name = `tomefile${this.texts.size}${path.posix.extname(normal)}`;
    }
    this.texts.set(name, change ? change(text) : text);
    this.rels.set(name, normal);
    this.byRel.set(normal, name);
    return name;
  }

  /** What pandoc is handed: a fresh object of names and contents. */
  files() {
    return Object.fromEntries(this.texts);
  }

  /** A text with every stand-in name turned back to the path the paper has. */
  real(text) {
    let out = text;
    for (const [name, rel] of this.rels) {
      if (name !== rel) out = out.replaceAll(name, rel);
    }
    return out;
  }
}

/** Run pandoc once. Resolves `{ tree, warnings }`, or rejects with `PaperRefused`. */
async function reading(convert, options, supply) {
  let result;
  try {
    result = await convert({ to: 'json', ...options }, null, supply.files());
  } catch (error) {
    throw new PaperRefused(supply.real(error instanceof Error ? error.message : String(error)));
  }
  let tree = null;
  try {
    tree = JSON.parse(result.stdout);
  } catch {
    /* pandoc wrote no tree */
  }
  if (!tree || !Array.isArray(tree.blocks)) {
    const reason = String(result.stderr ?? '')
      .replace(/^ERROR:\s*/, '')
      .replace(/\s+/g, ' ')
      .trim();
    const refused = new PaperRefused(supply.real(reason || 'pandoc gave no reason'));
    refused.stderr = String(result.stderr ?? '');
    throw refused;
  }
  return { tree, warnings: Array.isArray(result.warnings) ? result.warnings : [] };
}

/** The bibliography files a tree names, as written. */
function bibliographyNames(meta) {
  const text = (node) => {
    if (!node) return [];
    if (node.t === 'MetaList') return node.c.flatMap(text);
    if (node.t === 'MetaString') return [node.c];
    if (node.t === 'MetaInlines') {
      return [node.c.map((inline) => (inline.t === 'Str' ? inline.c : ' ')).join('')];
    }
    return [];
  };
  return text(meta?.bibliography)
    .map((name) => name.trim())
    .filter(Boolean);
}

/** Read the paper again with its `.bib` files, when it names any that are there. */
async function withBibliography(convert, options, supply, first, missing, from) {
  const given = [];
  for (const written of bibliographyNames(first.tree.meta)) {
    if (!/\.bib$/i.test(written)) continue;
    const rel = path.posix.normalize(path.posix.join(from, written.replace(/^\/+/, '')));
    const name = await supply.add(rel);
    if (name) given.push(name);
    else if (!missing.includes(written)) missing.push(written);
  }
  if (given.length === 0) return { options, read: first };
  const cited = {
    ...options,
    citeproc: true,
    bibliography: given,
    metadata: { 'link-citations': true },
  };
  return { options: cited, read: await reading(convert, cited, supply) };
}

/** Where a 1-based line begins in a text. */
function lineStart(text, line) {
  let offset = 0;
  for (let i = 1; i < line; i++) {
    const next = text.indexOf('\n', offset);
    if (next === -1) return -1;
    offset = next + 1;
  }
  return offset;
}

/**
 * Where a skipped piece stands in the copy of its file: pandoc's place is
 * just after a piece on one line, and the end of the first line of an
 * environment on several; for a piece that ends its line (`\begin{name}[t]`
 * and then the line end) it is the start of the line after. Returns -1 when
 * the piece is not found there.
 */
function placeOf(text, entry) {
  const begin = lineStart(text, entry.line);
  if (begin === -1) return -1;
  const end = begin + entry.column - 1;
  const start = end - entry.contents.length;
  if (start >= 0 && text.slice(start, end) === entry.contents) return start;
  if (entry.column <= 1 && begin > 0) {
    const before = begin - 1 - entry.contents.length;
    if (before >= 0 && text.slice(before, begin - 1) === entry.contents) return before;
  }
  const lineEnd = text.indexOf('\n', begin);
  const found = text.indexOf(entry.contents, begin);
  if (found !== -1 && (lineEnd === -1 || found <= lineEnd)) return found;
  return -1;
}

/**
 * Of the pieces found in one file, those that may be replaced. A `\begin{name}`
 * and its `\end{name}` that pandoc skipped apart (it kept the words between)
 * are replaced together or not at all: one without the other leaves an
 * environment pandoc cannot close, and it then refuses the whole copy.
 * @param {{ entry: { contents: string }, start: number, end: number }[]} found
 */
function replaceable(found) {
  const keep = new Set(found);
  const open = [];
  for (const item of [...found].sort((a, b) => a.start - b.start)) {
    const begins = item.entry.contents.match(/^\\begin\s*\{([^}]*)\}/);
    const ends = item.entry.contents.match(/^\\end\s*\{([^}]*)\}/);
    if (begins && !item.entry.contents.includes(`\\end{${begins[1]}}`)) {
      open.push({ name: begins[1], item });
    } else if (ends) {
      const at = open.map((each) => each.name).lastIndexOf(ends[1]);
      if (at === -1) keep.delete(item);
      else open.splice(at, 1);
    }
  }
  for (const { item } of open) keep.delete(item);
  return found.filter((item) => keep.has(item));
}

/**
 * Refuse a paper whose files pull each other in without end: pandoc would
 * never finish reading it. (LaTeX cannot set such a paper either.)
 * @param {Supply} supply
 * @param {'latex' | 'typst'} format
 */
function refuseCycle(supply, format) {
  const edges = new Map();
  for (const [name, text] of supply.texts) {
    // What the paper shows as code, or holds in a comment, names no file.
    const named =
      format === 'latex'
        ? [
            ...text
              .replace(LATEX_CODE, '')
              .replace(/(\\*)%.*$/gm, (rest, slashes) =>
                slashes.length % 2 === 1 ? rest : slashes,
              )
              .matchAll(/\\(?:input|include|subfile)\s*\{\s*([^{}]+?)\s*\}/g),
          ].map((match) => match[1])
        : typstFilesNamed(text);
    const to = new Set();
    for (const written of named) {
      for (const candidate of [written, `${written}.tex`]) {
        if (supply.texts.has(candidate)) to.add(candidate);
      }
    }
    edges.set(name, to);
  }
  const state = new Map();
  const visit = (name, trail) => {
    if (state.get(name) === 'done') return;
    if (state.get(name) === 'open') {
      const loop = [...trail.slice(trail.indexOf(name)), name].map(
        (each) => supply.rels.get(each) ?? each,
      );
      throw new PaperRefused(`its files pull each other in without end: ${loop.join(' → ')}`);
    }
    state.set(name, 'open');
    for (const next of edges.get(name) ?? []) visit(next, [...trail, name]);
    state.set(name, 'done');
  };
  for (const name of edges.keys()) visit(name, []);
}

async function readLatex(file, convert, nonce) {
  const dir = path.dirname(file);
  const supply = new Supply(dir, await realpath(dir));
  const missing = [];
  const skipped = [];
  let pieces = 0;

  // In the copy: line ends are `\n` and tabs are spaces, as pandoc has them in
  // what it reports, so a piece is found where pandoc says it stood; a wide
  // table (`table*`) is a table, which pandoc reads with its caption and its
  // label, where it reads `table*` as an environment it does not know; and
  // `\today` outside code is a piece of its own, so the day is never written.
  const asCopy = (name) => (text) =>
    text
      .replace(/\r\n?/g, '\n')
      .replace(/\t/g, '    ')
      .replace(TODAY_OR_CODE, (found) => {
        if (!found.startsWith('\\today')) return found;
        const entry = {
          contents: '\\today',
          source: name,
          line: 0,
          token: tokenFor(nonce, pieces++),
          placed: false,
          made: true,
        };
        skipped.push(entry);
        return entry.token;
      });

  const copyOf = (name) => (text) =>
    asCopy(name)(
      outsideCode(text.replace(/\r\n?/g, '\n'), LATEX_CODE, (part) =>
        part.replace(/\\(begin|end)\{table\*\}/g, '\\$1{table}'),
      ),
    );

  const main = path.basename(file);
  if (!(await supply.add(main, { flat: true, change: copyOf(main) }))) {
    throw new PaperRefused(`${main} could not be opened`);
  }
  // `line` of a made piece is found now, while its word stands once in the copy.
  const settleMade = () => {
    for (const entry of skipped) {
      if (!entry.made || entry.line !== 0) continue;
      const text = supply.texts.get(supply.nameOf(entry.source)) ?? '';
      const at = text.indexOf(entry.token);
      entry.line = at === -1 ? 1 : text.slice(0, at).split('\n').length;
    }
  };
  settleMade();

  let options = { from: 'latex', 'input-files': [main] };
  let read;
  const decided = new Set();
  /** For each file given under a stand-in name: how its argument is found, and its stand-in. */
  const renamed = new Map();
  const forced = new Set();
  for (let count = 0; ; count++) {
    refuseCycle(supply, 'latex');
    read = await reading(convert, options, supply);
    let added = false;
    for (const notice of read.warnings) {
      if (notice.type !== 'CouldNotLoadIncludeFile' || typeof notice.path !== 'string') continue;
      const written = notice.path;
      if (decided.has(written)) {
        // Asked for again: its argument stood where Tome took the text for
        // code, and was not rewritten. Rewrite it wherever it stands, once;
        // asked for after that, it is named as not read, never lost in silence.
        const again = renamed.get(written);
        if (again && !forced.has(written)) {
          forced.add(written);
          for (const [holder, text] of supply.texts) {
            supply.texts.set(holder, text.replace(again.naming, `$1${again.standIn}$2`));
          }
          added = true;
        } else if (!/\.sty$/i.test(written) && !missing.includes(written)) {
          missing.push(written);
        }
        continue;
      }
      decided.add(written);
      const quiet = /\.sty$/i.test(written);
      const rel = path.posix.normalize(written);
      const nested = rel.includes('/');
      // A file in a folder of its own needs its argument rewritten; find it first.
      const stems = [written, written.replace(/\.tex$/i, '')].map(escapeRegExp).join('|');
      const naming = new RegExp(
        `(\\\\(?:input|include|subfile)\\s*\\{\\s*)(?:${stems})(\\s*\\})`,
        'g',
      );
      const named = [...supply.texts].filter(([, text]) => text.search(naming) !== -1);
      if (count >= LIMITS.readings - 1 || (nested && named.length === 0)) {
        if (!quiet) missing.push(written);
        continue;
      }
      const relPath = rel;
      const name = await supply.add(relPath, {
        flat: true,
        change: (text) => copyOf(relPath)(text),
      });
      if (!name) {
        if (!quiet) missing.push(written);
        continue;
      }
      settleMade();
      if (name !== relPath) {
        const standIn = name.replace(/\.tex$/i, '');
        renamed.set(written, { naming, standIn });
        for (const [holder] of named) {
          supply.texts.set(
            holder,
            outsideCode(supply.texts.get(holder), LATEX_CODE, (part) =>
              part.replace(naming, `$1${standIn}$2`),
            ),
          );
        }
      }
      added = true;
    }
    if (!added) break;
  }

  ({ options, read } = await withBibliography(convert, options, supply, read, missing, '.'));

  // What pandoc skipped, each piece once.
  const seen = new Set();
  for (const notice of read.warnings) {
    if (notice.type !== 'SkippedContent' || typeof notice.contents !== 'string') continue;
    const key = JSON.stringify([notice.source, notice.line, notice.column, notice.contents]);
    if (seen.has(key)) continue;
    seen.add(key);
    skipped.push({
      contents: notice.contents,
      source: supply.rels.get(notice.source) ?? String(notice.source ?? main),
      name: notice.source,
      line: Number(notice.line) || 1,
      column: Number(notice.column) || 1,
      token: tokenFor(nonce, pieces++),
      placed: false,
    });
  }
  const reported = skipped.filter((entry) => !entry.made);
  if (reported.length > 0) {
    const copies = new Map(supply.texts);
    /** file -> the pieces found in it, each with its place */
    const found = new Map();
    for (const entry of reported) {
      const text = copies.get(entry.name);
      const start = typeof text === 'string' ? placeOf(text, entry) : -1;
      if (start === -1) continue;
      const list = found.get(entry.name) ?? [];
      list.push({ entry, start, end: start + entry.contents.length });
      found.set(entry.name, list);
    }
    for (const [name, list] of found) {
      // Replace from the end of the file, so earlier places stay true.
      const taken = [];
      let text = copies.get(name);
      for (const { entry, start, end } of replaceable(list).sort((a, b) => b.start - a.start)) {
        if (taken.some((range) => start < range.end && range.start < end)) continue;
        taken.push({ start, end });
        // A space keeps the word apart from a command or a word that ends just before it.
        const gap = /[A-Za-z]$/.test(text.slice(0, start)) ? ' ' : '';
        text = `${text.slice(0, start)}${gap}${entry.token}${text.slice(end)}`;
      }
      copies.set(name, text);
    }
    const again = new Supply(supply.dir, supply.realDir);
    again.texts = copies;
    again.rels = supply.rels;
    try {
      read = await reading(convert, options, again);
    } catch (error) {
      if (!(error instanceof PaperRefused)) throw error;
      // The copies cannot be read: keep the first reading. None of the pieces
      // pandoc reported has a word in it; `\today`'s word was there from the start.
      const first = JSON.stringify(read.tree);
      for (const entry of skipped)
        entry.placed = Boolean(entry.made) && first.includes(entry.token);
      return finish(read.tree, skipped, missing, supply);
    }
  }
  const whole = JSON.stringify(read.tree);
  for (const entry of skipped) entry.placed = whole.includes(entry.token);
  return finish(read.tree, skipped, missing, supply);
}

function finish(tree, skipped, missing, supply) {
  return {
    tree,
    skipped: skipped.map(({ contents, source, line, token, placed }) => ({
      contents,
      source,
      line,
      token,
      placed,
    })),
    missing,
    // Every file that was read, the paper first: a picture a Typst file names
    // is looked for beside that file.
    files: [...supply.rels.values()],
  };
}

/**
 * Typst reads a picture's path from the file that names it. A file in a folder
 * of its own is given to pandoc under a name with no folder, so in its copy
 * each such path is written from the paper's folder (`/chapter/fig.png`),
 * which is where the stage looks for a path from `/`.
 * @param {string} rel the file's path from the paper's folder
 */
function picturesFromRoot(rel) {
  const dir = path.posix.dirname(rel);
  if (dir === '.') return undefined;
  const fromRoot = (named) =>
    named.startsWith('/') || /^[A-Za-z][A-Za-z\d+.-]*:/.test(named)
      ? named
      : `/${path.posix.join(dir, named)}`;
  return (text) =>
    outsideCode(text, TYPST_CODE, (part) => {
      // An `image(` call where code stands; its path is its first string
      // that is not a named argument's value (`image(width: 50%, "fig.png")`).
      const call = new RegExp(`${TYPST_CODE_PLACE}image\\s*\\(`, 'gm');
      let out = '';
      let last = 0;
      for (const match of part.matchAll(call)) {
        const open = match.index + match[0].length;
        if (open < last) continue;
        let depth = 0;
        for (let i = open; i < part.length; i++) {
          const char = part[i];
          if (char === '(' || char === '[' || char === '{') depth += 1;
          else if (char === ')' || char === ']' || char === '}') {
            if (depth === 0) break;
            depth -= 1;
          } else if (char === '"') {
            const end = part.indexOf('"', i + 1);
            if (end === -1) break;
            const named = /\w[\w-]*\s*:\s*$/.test(part.slice(open, i));
            if (depth === 0 && !named) {
              out += part.slice(last, i) + `"${fromRoot(part.slice(i + 1, end))}"`;
              last = end + 1;
              break;
            }
            i = end;
          }
        }
      }
      return out + part.slice(last);
    });
}

async function readTypst(file, convert) {
  const dir = path.dirname(file);
  const supply = new Supply(dir, await realpath(dir));
  // The paper's own file takes a stand-in name too, so that a chapter's file
  // of the same name is never answered by the paper itself.
  const main = await supply.add(path.basename(file), { flat: false });
  if (!main) throw new PaperRefused(`${path.basename(file)} could not be opened`);
  const missing = [];
  const options = { from: 'typst', 'input-files': [main] };
  let read;
  for (let count = 0; ; count++) {
    refuseCycle(supply, 'typst');
    try {
      read = await reading(convert, options, supply);
      break;
    } catch (error) {
      if (!(error instanceof PaperRefused)) throw error;
      const asked = String(error.stderr ?? '').match(
        // "does not exist" for a file beside or below; "failed" for one reached by `..`.
        /ERROR:\s*(.+?): withBinaryFile: (?:does not exist|failed)/,
      );
      if (!asked || count >= LIMITS.readings - 1) throw error;
      // Pandoc asks for a file by the words that name it; find who names it.
      const wanted = asked[1].replace(/^\.\//, '');
      let supplied = false;
      let asWritten = wanted;
      // A call that reads a file names it (`include "a.typ"`), where code
      // stands; failing that, a string that holds the name (a chapter list in
      // a variable: `#let ch = ("a.typ",)`, then `include c`). A name in raw
      // text names nothing: look past it, to the file that includes.
      const placedCall = new RegExp(
        `(${TYPST_CODE_PLACE}(?:include|import|read|csv|json|yaml|toml|xml|cbor)\\s*\\(?\\s*)"([^"\\n]+)"`,
        'gm',
      );
      const named = (pattern) => (text) =>
        [...text.replace(TYPST_CODE, '').matchAll(pattern)]
          .map((match) => match[2])
          .find((value) => value.replace(/^\.?\/+/, '') === wanted);
      const holders = [...supply.texts];
      const pattern = holders.some(([, text]) => named(placedCall)(text) !== undefined)
        ? placedCall
        : TYPST_STRING;
      for (const [holder, text] of holders) {
        const literal = named(pattern)(text);
        if (literal === undefined) continue;
        asWritten = literal;
        const from = literal.startsWith('/') ? '.' : path.posix.dirname(supply.rels.get(holder));
        const rel = path.posix.normalize(path.posix.join(from, literal.replace(/^\/+/, '')));
        // Every file but the paper's own takes a stand-in name: a file of the
        // same name beside the paper could otherwise answer for a chapter's.
        const name = await supply.add(rel, { flat: false, change: picturesFromRoot(rel) });
        if (!name) continue;
        if (name !== literal) {
          supply.texts.set(
            holder,
            outsideCode(text, TYPST_CODE, (part) =>
              part.replace(new RegExp(pattern.source, pattern.flags), (found, call, written) =>
                written === literal ? `${call}"${name}"` : found,
              ),
            ),
          );
        }
        supplied = true;
        break;
      }
      if (!supplied) {
        throw new PaperRefused(
          `${asWritten} could not be read: it is not a file in the paper's folder (${error.message})`,
        );
      }
    }
  }
  ({ read } = await withBibliography(convert, options, supply, read, missing, '.'));
  return finish(read.tree, [], missing, supply);
}

/**
 * Read one paper.
 *
 * @param {{ file: string, format: 'latex' | 'typst' }} paper
 * @param {{ convert?: Function, nonce?: string }} [stand] for tests: a stand-in
 *   for pandoc's `convert`, and the letters a skipped piece's word is made of
 * @returns {Promise<{
 *   tree: { blocks: any[], meta: Record<string, any> },
 *   skipped: { contents: string, source: string, line: number, token: string, placed: boolean }[],
 *   missing: string[],
 *   files: string[],
 * }>} pandoc's tree; what it skipped, each piece once, with the word that
 *   stands for it and whether that word is in the tree; and the files the
 *   paper pulls in that were not read. `source` is a path from the paper's
 *   folder. Rejects with `PaperRefused` when pandoc cannot read the paper.
 */
export async function readPaper({ file, format }, stand = {}) {
  const convert = stand.convert ?? (await pandoc());
  const nonce = stand.nonce ?? randomBytes(8).toString('hex');
  return format === 'typst' ? readTypst(file, convert) : readLatex(file, convert, nonce);
}
