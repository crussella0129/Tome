// Make one document ready for the library (INT-0029): its Markdown as a chapter
// will hold it, its title, the files to put beside it, and what had to be left
// out. The loader (load-books.mjs) and `books:add` (find-books.mjs) both call
// this, so they agree on a document's title and on whether it can be read.
//
// Nothing here writes. A Markdown document is passed through as written apart
// from three rules: a front matter block is left out, a local image is pointed
// at the copy the loader will make, and an image that cannot be shown is
// replaced by a mark. A Word document goes through docx-to-markdown.mjs. A
// paper written in LaTeX or Typst (INT-0033) is read by pandoc
// (pandoc-read.mjs) and written by pandoc-to-markdown.mjs; its pictures are
// staged from the paper's own folder, and nowhere else.
import { readFile, realpath, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { fromMarkdown } from 'mdast-util-from-markdown';
import { mathFromMarkdown } from 'mdast-util-math';
import { unified } from 'unified';
import remarkStringify from 'remark-stringify';
import { convertDocx, MARKS } from './docx-to-markdown.mjs';
import { readPaper } from './pandoc-read.mjs';
import { writePaper } from './pandoc-to-markdown.mjs';
import {
  PARENT_ASSET_DIR,
  imageDestinationSpans,
  isPathInside,
  toMarkdownPath,
} from './parent-assets.mjs';
import { titleText } from './rehype-math.mjs';
import { mathSyntax } from './remark-math-dollars.mjs';

/** Where a Word document's images go, under the tome. */
export const MEDIA_DIR = '__tome_media__';
/** What a chapter reads in place of a document that could not be opened. */
export const DOCUMENT_MARK = '[document not shown]';

/** Image files the build can read, by extension, in the order a bare name is tried with them. */
const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.avif']);
/** What each kind of document is called, in a message about one that could not be read. */
const KIND_NAMES = { word: 'Word', latex: 'LaTeX', typst: 'Typst' };
/** The kinds a folder goes on being read past, when one of them cannot be. */
const PLACEHOLDER_KINDS = new Set(Object.keys(KIND_NAMES));
/** A mark as Markdown: brackets escaped, so it is text and never a link. */
const escaped = (mark) => mark.replace(/[[\]]/g, '\\$&');
const posix = (value) => value.split(path.sep).join('/');
const stem = (file) => path.basename(file, path.extname(file));

/**
 * Split a leading YAML front matter block from a document.
 * @returns {{ body: string, title: string | null }}
 */
function splitFrontMatter(text) {
  const open = text.match(/^---[ \t]*\r?\n/);
  if (!open) return { body: text, title: null };
  const rest = text.slice(open[0].length);
  const close = rest.match(/^(?:---|\.\.\.)[ \t]*(?:\r?\n|$)/m);
  if (!close || close.index === undefined) return { body: text, title: null };
  const block = rest.slice(0, close.index);
  const title = block.match(/^title:[ \t]*(.+?)[ \t]*$/m)?.[1]?.replace(/^(['"])(.*)\1$/, '$2');
  return { body: rest.slice(close.index + close[0].length), title: title?.trim() || null };
}

/**
 * The text of an inline subtree, HTML tags left out. A formula is written on
 * one line that keeps what it says (`√2`), or, where it has no such form, as it
 * was typed: a title is plain text, shown in a sidebar and a tab (INT-0030).
 */
function inlineText(node) {
  if (node.type === 'html') return '';
  if (node.type === 'inlineMath') return titleText(node.value) ?? `$${node.value}$`;
  if (typeof node.value === 'string') return node.value;
  return (node.children ?? []).map(inlineText).join('');
}

/**
 * A document's title from its top heading. A heading that holds a dollar sign
 * is read again by the rule the page reads it by, so a formula in it is known
 * for one and a price is left a price.
 * @param {any} heading the heading as the plain reader gave it
 * @param {string} body the document it stands in
 */
function headingTitle(heading, body) {
  const source = body.slice(heading.position.start.offset, heading.position.end.offset);
  if (!source.includes('$')) return inlineText(heading).trim();
  const read = fromMarkdown(source, {
    extensions: mathSyntax(),
    mdastExtensions: [mathFromMarkdown()],
  });
  const again = collect(read, ['heading'])[0];
  return inlineText(again ?? heading).trim();
}

function collect(tree, types) {
  const found = [];
  const walk = (node) => {
    if (types.includes(node.type)) found.push(node);
    for (const child of node.children ?? []) walk(child);
  };
  walk(tree);
  return found;
}

/** The path a reference names on disk, or null when it is not a local file reference. */
function localPath(url) {
  // A full path on this machine (`C:\pics\a.png`, `file:///…`) names a local
  // file as much as a relative one does; it is judged like any other.
  if (/^[A-Za-z]:[\\/]/.test(url ?? '')) {
    let decoded = url;
    try {
      decoded = decodeURIComponent(url); // `My%20Pics`, as a relative reference is decoded
    } catch {
      /* not percent-encoded: take it as written */
    }
    return { path: path.normalize(decoded), suffix: '' };
  }
  if (/^file:/i.test(url ?? '')) {
    try {
      return { path: fileURLToPath(url), suffix: '' };
    } catch {
      return { path: url, suffix: '' };
    }
  }
  if (
    !url ||
    url.startsWith('/') ||
    url.startsWith('#') ||
    url.startsWith('?') ||
    /^[A-Za-z][A-Za-z\d+.-]*:/.test(url)
  ) {
    return null;
  }
  const cut = url.search(/[?#]/);
  const encoded = cut === -1 ? url : url.slice(0, cut);
  let decoded;
  try {
    decoded = decodeURIComponent(encoded);
  } catch {
    decoded = encoded;
  }
  if (!decoded) return null;
  return { path: decoded.replace(/[\\/]+/g, path.sep), suffix: cut === -1 ? '' : url.slice(cut) };
}

/**
 * Decide what to do with one local image reference: stage it (a regular file
 * inside the root, of a kind the build reads) or leave it out.
 * @returns {Promise<{ from: string, to: string } | null>}
 */
async function stageableImage({ root, realRoot, sourceFile, local }) {
  const target = path.resolve(path.dirname(sourceFile), local.path);
  if (!isPathInside(root, target)) return null;
  if (!IMAGE_EXTENSIONS.has(path.extname(target).toLowerCase())) return null;
  let real;
  try {
    real = await realpath(target);
    if (!isPathInside(realRoot, real) || !(await stat(real)).isFile()) return null;
  } catch {
    return null;
  }
  return { from: real, to: `${PARENT_ASSET_DIR}/${posix(path.relative(root, target))}` };
}

async function prepareMarkdown(document, root) {
  const raw = (await readFile(document.file, 'utf8')).replace(/^﻿/, '');
  const front = splitFrontMatter(raw);
  const body = front.body;
  const tree = fromMarkdown(body);
  const realRoot = await realpath(root);
  const chapterDir = path.posix.dirname(document.staged);
  const refer = (to) => toMarkdownPath(path.posix.relative(chapterDir, to));

  const edits = [];
  const files = new Map();
  const missing = [];
  const judge = async (url) => {
    const local = localPath(url);
    if (!local) return { skip: true };
    const staged = await stageableImage({ root, realRoot, sourceFile: document.file, local });
    if (!staged) return { missing: true };
    files.set(staged.to, staged);
    return { url: `${refer(staged.to)}${local.suffix}` };
  };
  const span = (node) => ({ start: node.position.start.offset, end: node.position.end.offset });

  // Inline images: `![alt](path)`.
  const images = collect(tree, ['image']);
  for (const destination of imageDestinationSpans(body)) {
    const verdict = await judge(destination.url);
    if (verdict.skip) continue;
    if (verdict.url) {
      edits.push({ start: destination.start, end: destination.end, text: verdict.url });
      continue;
    }
    const node = images.find((image) => {
      const at = span(image);
      return at.start <= destination.start && destination.end <= at.end;
    });
    if (!node) continue;
    edits.push({ ...span(node), text: escaped(MARKS.image) });
    missing.push(destination.url);
  }

  // Images by reference: `![alt][fig]` with `[fig]: path`.
  const definitions = new Map(collect(tree, ['definition']).map((d) => [d.identifier, d]));
  const settled = new Map();
  for (const reference of collect(tree, ['imageReference'])) {
    const definition = definitions.get(reference.identifier);
    if (!definition) continue;
    if (!settled.has(definition)) {
      const verdict = await judge(definition.url);
      settled.set(definition, verdict);
      if (verdict.url) {
        const title = definition.title ? ` "${definition.title.replace(/"/g, '\\"')}"` : '';
        const label = definition.label ?? definition.identifier;
        edits.push({ ...span(definition), text: `[${label}]: ${verdict.url}${title}` });
      }
    }
    if (settled.get(definition).missing) {
      edits.push({ ...span(reference), text: escaped(MARKS.image) });
      missing.push(definition.url);
    }
  }

  // An image written as HTML is not staged; say so.
  let htmlImages = 0;
  for (const node of collect(tree, ['html'])) {
    for (const match of node.value.matchAll(/<img\b[^>]*?\bsrc\s*=\s*["']([^"']+)["']/gi)) {
      if (localPath(match[1])) htmlImages += 1;
    }
  }

  let markdown = body;
  for (const edit of edits.sort((a, b) => b.start - a.start)) {
    markdown = markdown.slice(0, edit.start) + edit.text + markdown.slice(edit.end);
  }

  const heading = collect(tree, ['heading']).find((node) => node.depth === 1);
  const title = (heading && headingTitle(heading, body)) || front.title || stem(document.file);
  const leftOut = missing.map((detail) => ({ kind: 'image', count: 1, detail }));
  if (htmlImages > 0) leftOut.push({ kind: 'html-image', count: htmlImages });
  return { markdown, title, files: [...files.values()], leftOut };
}

async function prepareWord(document) {
  const chapter = document.staged.replace(/\.md$/i, '');
  const mediaDir = `${MEDIA_DIR}/${chapter}`;
  const mediaPath = toMarkdownPath(
    path.posix.relative(path.posix.dirname(document.staged), mediaDir),
  );
  const out = await convertDocx(document.file, {
    name: document.rel,
    fallbackTitle: stem(document.file),
    mediaPath,
  });
  return {
    markdown: out.markdown,
    title: out.title,
    files: out.images.map((image) => ({ to: `${mediaDir}/${image.name}`, bytes: image.bytes })),
    leftOut: out.leftOut,
  };
}

/**
 * The folders a LaTeX paper says its pictures are kept in
 * (`\graphicspath{{a/}{b/}}`), as written, comments left out.
 * @param {string} text the paper's own text
 * @returns {string[]}
 */
function graphicsPaths(text) {
  const shown = text.replace(/(\\*)%.*$/gm, (rest, slashes) =>
    slashes.length % 2 === 1 ? rest : slashes,
  );
  const named = shown.match(/\\graphicspath\s*\{((?:\s*\{[^{}]*\}\s*)+)\}/);
  return named ? [...named[1].matchAll(/\{([^{}]*)\}/g)].map((match) => match[1].trim()) : [];
}

/**
 * Find the file a paper names as a picture: a regular file in the paper's own
 * folder or a folder within it, of a kind the build reads. A name with no
 * extension is tried with each; a name not found beside the paper is tried in
 * each folder `\graphicspath` names.
 * @returns {Promise<{ from: string, to: string } | null>}
 */
async function paperPicture({ root, folder, realFolder, local, folders }) {
  const bare = path.extname(local.path) === '';
  const names = bare ? [...IMAGE_EXTENSIONS].map((ext) => `${local.path}${ext}`) : [local.path];
  for (const from of ['', ...folders]) {
    for (const name of names) {
      const target = path.resolve(folder, from, name);
      if (!isPathInside(folder, target)) continue;
      if (!IMAGE_EXTENSIONS.has(path.extname(target).toLowerCase())) continue;
      try {
        const real = await realpath(target);
        if (!isPathInside(realFolder, real) || !(await stat(real)).isFile()) continue;
        return { from: real, to: `${PARENT_ASSET_DIR}/${posix(path.relative(root, target))}` };
      } catch {
        /* not there: try the next */
      }
    }
  }
  return null;
}

/** A paper in LaTeX or Typst: pandoc's tree, written as the chapter's Markdown. */
async function preparePaper(document, root) {
  const read = await readPaper({ file: document.file, format: document.format });
  const out = writePaper({
    tree: read.tree,
    skipped: read.skipped,
    format: document.format,
    name: path.basename(document.file),
    fallbackTitle: stem(document.file),
  });
  const folder = path.dirname(document.file);
  const realFolder = await realpath(folder);
  // Where else a picture's name is looked for: the folders a LaTeX paper
  // names in `\graphicspath`; for a Typst paper the folder of each file that
  // was read, since Typst reads a picture's path from the file that names it.
  let folders = [];
  if (out.images.length > 0) {
    folders =
      document.format === 'latex'
        ? graphicsPaths((await readFile(document.file, 'utf8')).replace(/^\uFEFF/, ''))
        : [...new Set(read.files.map((rel) => path.posix.dirname(rel)))].filter(
            (dir) => dir !== '.',
          );
  }
  const chapterDir = path.posix.dirname(document.staged);
  const files = new Map();
  const leftOut = [...out.leftOut];
  let markdown = out.markdown;
  for (const image of out.images) {
    const written = `](${image.placeholder})`;
    // A path from `/` is read by Typst from the paper's own folder; in a LaTeX
    // paper it is a place on the writer's machine, outside the paper's folder.
    const rooted = /^\/(?!\/)/.test(image.url);
    const local = rooted
      ? document.format === 'typst'
        ? localPath(image.url.replace(/^\/+/, ''))
        : null
      : localPath(image.url);
    if (!local && !rooted) {
      // An address on the web: as written.
      markdown = markdown.replaceAll(written, `](${image.url})`);
      continue;
    }
    const staged = local
      ? await paperPicture({ root, folder, realFolder, local, folders: rooted ? [] : folders })
      : null;
    if (staged) {
      files.set(staged.to, staged);
      const refer = toMarkdownPath(path.posix.relative(chapterDir, staged.to));
      markdown = markdown.replaceAll(written, `](${refer}${local?.suffix ?? ''})`);
      continue;
    }
    // The image with its words, whatever they hold, gives way to the mark.
    const whole = new RegExp(
      `!\\[(?:\\\\.|[^\\]\\\\])*\\]\\(${image.placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\)`,
      'g',
    );
    markdown = markdown.replace(whole, () => escaped(MARKS.image));
    leftOut.push({ kind: 'image', count: 1, detail: image.url });
  }
  for (const name of read.missing) leftOut.push({ kind: 'include', count: 1, detail: name });
  return { markdown, title: out.title, files: [...files.values()], leftOut };
}

/**
 * Read one document and return what the library needs of it.
 *
 * @param {{ file: string, rel: string, format: 'markdown' | 'word' | 'latex' | 'typst', staged: string }} document
 *   one of `resolveSource()`'s documents
 * @param {{ root: string }} context the folder its local images must lie within
 * @returns {Promise<{
 *   markdown: string,
 *   title: string,
 *   files: { to: string, from?: string, bytes?: Buffer }[],
 *   leftOut: { kind: string, count: number, detail?: string, name?: string, file?: string, line?: number, reason?: string }[],
 * }>} `files[].to` is a `/`-separated path within the tome; each file comes
 *   from `from` (a path to copy) or `bytes`.
 */
export async function prepareDocument(document, { root }) {
  if (document.format === 'word') return prepareWord(document);
  if (document.format === 'latex' || document.format === 'typst')
    return preparePaper(document, root);
  return prepareMarkdown(document, root);
}

/**
 * The chapter that stands in for a document that could not be read (a Word
 * document that could not be opened, a paper pandoc refuses), so one bad file
 * does not stop a folder from being read.
 * @param {{ file: string, rel: string, format?: string }} document
 * @param {unknown} error what `prepareDocument` threw
 */
export function placeholderDocument(document, error) {
  const title = stem(document.file);
  const kind = KIND_NAMES[document.format] ?? KIND_NAMES.word;
  const reason = error instanceof Error ? error.message : String(error);
  const markdown = unified()
    .use(remarkStringify)
    .stringify({
      type: 'root',
      children: [
        { type: 'heading', depth: 1, children: [{ type: 'text', value: title }] },
        {
          type: 'paragraph',
          children: [
            {
              type: 'text',
              value: `${DOCUMENT_MARK} ${path.basename(document.file)} could not be read as a ${kind} document.`,
            },
          ],
        },
      ],
    });
  return {
    markdown,
    title,
    files: [],
    leftOut: [
      {
        kind: 'document',
        count: 1,
        detail: reason,
        // A paper's reason is pandoc's own, and is told in the build's report.
        ...(document.format === 'latex' || document.format === 'typst' ? { reason } : {}),
      },
    ],
  };
}

/**
 * Read every document of a `document` or `folder` source, in order. In a
 * folder, a Word document that cannot be opened, or a paper pandoc refuses,
 * becomes a placeholder chapter so the rest is still read; a source that names
 * one document directly throws instead, since there would be nothing to read.
 * @param {{ kind: string, root: string, documents: any[] }} source from `resolveSource()`
 * @returns {Promise<any[]>} each document with its prepared `markdown`, `title`,
 *   `files`, `leftOut`, and `report` (what it left out, in words; '' when nothing)
 */
export async function readDocuments(source) {
  const chapters = [];
  for (const document of source.documents) {
    let prepared;
    try {
      prepared = await prepareDocument(document, { root: source.root });
    } catch (error) {
      if (source.kind !== 'folder' || !PLACEHOLDER_KINDS.has(document.format)) throw error;
      prepared = placeholderDocument(document, error);
    }
    chapters.push({ ...document, ...prepared, report: describeLeftOut(prepared.leftOut) });
  }
  return chapters;
}

/** A tome of documents is titled by its one document, or by its folder's name. */
export function tomeTitle(source, chapters) {
  return source.kind === 'document' ? chapters[0].title : source.title;
}

const plural = (count, one, many = `${one}s`) => `${count} ${count === 1 ? one : many}`;

/**
 * One line's worth of what a document left out, for the loader's output:
 * `2 equations, 1 image`. Empty when nothing was.
 * @param {{ kind: string, count: number, detail?: string, name?: string, file?: string, line?: number, reason?: string }[]} leftOut
 */
export function describeLeftOut(leftOut) {
  const total = (kind) =>
    leftOut.filter((entry) => entry.kind === kind).reduce((sum, entry) => sum + entry.count, 0);
  /** The names of a kind's entries, each once, five at most. */
  const named = (kind, nameOf = (entry) => entry.detail) => {
    const names = [
      ...new Set(
        leftOut
          .filter((entry) => entry.kind === kind)
          .map(nameOf)
          .filter(Boolean),
      ),
    ];
    if (names.length === 0) return '';
    const shown = names.slice(0, 5).join(', ');
    return ` (${shown}${names.length > 5 ? ` and ${names.length - 5} more` : ''})`;
  };
  /** A skipped piece by its name, and by its file when that is not the paper's own. */
  const piece = (entry) =>
    entry.name ? `${entry.name}${entry.file ? ` in ${entry.file}` : ''}` : entry.detail;
  const parts = [];
  if (total('document') > 0) {
    const reason = leftOut.find((entry) => entry.kind === 'document' && entry.reason)?.reason;
    parts.push(`the whole document (it could not be read${reason ? `: ${reason}` : ''})`);
  }
  if (total('equation') > 0) parts.push(plural(total('equation'), 'equation'));
  if (total('latex') > 0) {
    parts.push(
      `${plural(total('latex'), 'piece of LaTeX', 'pieces of LaTeX')} not shown${named('latex', piece)}`,
    );
  }
  if (total('command') > 0) {
    parts.push(`${plural(total('command'), 'command')} not read${named('command', piece)}`);
  }
  if (total('node') > 0) {
    parts.push(
      `${plural(total('node'), 'part', 'parts')} of a kind Tome has no rule for${named('node')}`,
    );
  }
  if (total('reference') > 0) {
    parts.push(
      `${plural(total('reference'), 'reference')} that could not be followed${named('reference')}`,
    );
  }
  if (total('citation') > 0) {
    parts.push(`${plural(total('citation'), 'citation')} with no entry${named('citation')}`);
  }
  if (total('include') > 0) {
    const count = total('include');
    parts.push(
      `${plural(count, 'file')} it pulls in that ${count === 1 ? 'was' : 'were'} not found${named('include')}`,
    );
  }
  if (total('figure') > 0) {
    parts.push(plural(total('figure'), 'chart or diagram', 'charts or diagrams'));
  }
  if (total('image') > 0) parts.push(plural(total('image'), 'image'));
  if (total('html-image') > 0) {
    parts.push(`${plural(total('html-image'), 'HTML image')} (not staged)`);
  }
  if (total('other') > 0) {
    // Name them: `An unrecognised element was ignored: w:x` is told as `w:x`.
    const names = leftOut
      .filter((entry) => entry.kind === 'other' && entry.detail)
      .map((entry) => entry.detail.replace(/^An unrecognised element was ignored:\s*/i, ''));
    parts.push(
      plural(
        total('other'),
        'element the Word reader did not recognise',
        'elements the Word reader did not recognise',
      ) + (names.length > 0 ? ` (${names.join('; ')})` : ''),
    );
  }
  return parts.join(', ');
}
