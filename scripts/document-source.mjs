// What a library entry may name besides an mdBook folder (INT-0029): one
// Markdown file, one Word document, or a folder of them with no SUMMARY.md.
// This module decides which kind a path is, lists a folder's documents in
// reading order, gives each a safe name in the library, and writes the spine
// (SUMMARY.md) such a tome needs. It reads no document's content: titles come
// from the caller (scripts/document-stage.mjs).
import { readdir, stat } from 'node:fs/promises';
import { basename, dirname, extname, join, resolve } from 'node:path';
import { exists, resolveBookSource, slugify } from './book-source.mjs';

/** What Tome reads, for refusal messages. */
export const ACCEPTED =
  'an mdBook folder (one with a SUMMARY.md), a .md file, a .docx file, ' +
  'or a folder of .md and .docx files';

const FORMATS = new Map([
  ['.md', 'markdown'],
  ['.docx', 'word'],
]);

/** Folders a walk never enters: version control, dependencies, build output. */
const SKIPPED_FOLDERS = new Set([
  '.git',
  '.hg',
  '.svn',
  'node_modules',
  'target',
  'dist',
  'vendor',
  '__pycache__',
  'venv',
  'site-packages',
]);

/**
 * Last path segments that cannot name a chapter of their own: `hrefToSlug`
 * (src/lib/paths.ts) folds `README` and `index` into their folder's route, and
 * SUMMARY.md is the spine.
 */
const RESERVED_NAMES = new Set(['readme', 'index', 'summary']);

/** `markdown`, `word`, or null for a path Tome does not read as a document. */
export function documentFormat(path) {
  return FORMATS.get(extname(path).toLowerCase()) ?? null;
}

/** The file name without its extension. */
function stem(path) {
  return basename(path, extname(path));
}

/** A folder is an mdBook when it has a `book.toml`, or a spine where mdBook keeps one. */
async function looksLikeBook(dir) {
  for (const marker of [
    'book.toml',
    'SUMMARY.md',
    join('src', 'SUMMARY.md'),
    join('docs', 'SUMMARY.md'),
  ]) {
    if (await exists(join(dir, marker))) return true;
  }
  return false;
}

/** Every document under `root`, as `/`-separated paths from it, unordered. */
async function walk(root) {
  const found = [];
  async function visit(dir, prefix) {
    let entries;
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch {
      return; // unreadable (permissions, vanished): nothing to read there
    }
    for (const entry of entries) {
      if (entry.isSymbolicLink() || entry.name.startsWith('.')) continue;
      const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (SKIPPED_FOLDERS.has(entry.name) || (await looksLikeBook(full))) continue;
        await visit(full, rel);
      } else if (entry.isFile() && documentFormat(entry.name) && !entry.name.startsWith('~$')) {
        found.push(rel);
      }
    }
  }
  await visit(root, '');
  return found;
}

const collator = new Intl.Collator('en', { numeric: true, sensitivity: 'base' });

/** Names without regard to case, runs of digits as numbers; ties by code unit. */
function compareNames(a, b) {
  return collator.compare(a, b) || (a < b ? -1 : a > b ? 1 : 0);
}

function comparePaths(a, b) {
  const left = a.split('/');
  const right = b.split('/');
  // Documents directly in the folder come before every subfolder's.
  if ((left.length === 1) !== (right.length === 1)) return left.length === 1 ? -1 : 1;
  for (let i = 0; i < Math.min(left.length, right.length); i++) {
    const order = compareNames(left[i], right[i]);
    if (order !== 0) return order;
  }
  return left.length - right.length;
}

/**
 * Put a folder's documents (`/`-separated paths from its root) in reading
 * order. A `README` or `index` directly in the folder opens the tome, README
 * winning; the rest follow by path.
 * @param {string[]} rels
 * @returns {{ rel: string, opening: boolean }[]}
 */
export function orderDocuments(rels) {
  const sorted = [...rels].sort(comparePaths);
  const rootNamed = (name) =>
    sorted.find((rel) => !rel.includes('/') && stem(rel).toLowerCase() === name);
  const opening = rootNamed('readme') ?? rootNamed('index');
  const rest = sorted.filter((rel) => rel !== opening);
  return [
    ...(opening ? [{ rel: opening, opening: true }] : []),
    ...rest.map((rel) => ({ rel, opening: false })),
  ];
}

/**
 * Give each ordered document its name in the library: `README.md` for the
 * opening page, otherwise its path with every segment slugified. A name that
 * is reserved, or already taken, takes `-2`, `-3`, … so no two share a route.
 * @param {{ rel: string, opening: boolean }[]} ordered
 * @returns {string[]} staged names, in the same order
 */
export function stagedNames(ordered) {
  const taken = new Set();
  return ordered.map(({ rel, opening }) => {
    if (opening) return 'README.md';
    const segments = rel.split('/');
    const folders = segments.slice(0, -1).map((segment) => slugify(segment));
    const base = slugify(stem(segments[segments.length - 1]));
    const at = (name) => [...folders, name].join('/');
    let name = base;
    let n = 2;
    while (RESERVED_NAMES.has(name) || taken.has(at(name))) name = `${base}-${n++}`;
    taken.add(at(name));
    return `${at(name)}.md`;
  });
}

/** Link text the spine's parser reads back whole: no brackets, one line. */
function linkText(title, fallback) {
  const text = String(title ?? '')
    .replace(/\[/g, '(')
    .replace(/\]/g, ')')
    .replace(/\s+/g, ' ')
    .trim();
  return text || fallback;
}

/**
 * The SUMMARY.md of a tome of documents, in the form `parseSummary`
 * (src/lib/summary.ts) reads: the title, the opening page as a prefix
 * chapter, the folder's own documents as a list, then one part per top-level
 * subfolder.
 * @param {{ title: string, chapters: { title: string, staged: string, opening?: boolean, part?: string | null }[] }} tome
 */
export function writeSpine({ title, chapters }) {
  const lines = [`# ${linkText(title, 'Untitled')}`, ''];
  const item = (chapter) => `[${linkText(chapter.title, chapter.staged)}](${chapter.staged})`;
  const opening = chapters.find((chapter) => chapter.opening);
  if (opening) lines.push(item(opening), '');
  const listed = chapters.filter((chapter) => !chapter.opening);
  const own = listed.filter((chapter) => !chapter.part);
  if (own.length > 0) lines.push(...own.map((chapter) => `- ${item(chapter)}`), '');
  const parts = [...new Set(listed.filter((chapter) => chapter.part).map((c) => c.part))];
  for (const part of parts) {
    lines.push(`# ${linkText(part, 'Part')}`, '');
    lines.push(...listed.filter((c) => c.part === part).map((c) => `- ${item(c)}`), '');
  }
  return `${lines.join('\n').trimEnd()}\n`;
}

/**
 * @typedef {{ file: string, rel: string, format: 'markdown' | 'word', opening: boolean, staged: string, part: string | null }} SourceDocument
 * @typedef {{ kind: 'document' | 'folder', root: string, title: string | null, slug: string, documents: SourceDocument[] }} DocumentSource
 * @typedef {{ kind: 'book', documents?: undefined } & Awaited<ReturnType<typeof resolveBookSource>>} BookSource
 */

/**
 * `resolveBookSource`'s own refusal, with the document kinds added.
 * @param {string} path
 * @returns {Promise<never>}
 */
async function refuseAsBook(path) {
  try {
    await resolveBookSource(path);
  } catch (error) {
    throw new Error(
      `${error instanceof Error ? error.message : error}\n` +
        `  A .md file, a .docx file, or a folder of them is also accepted.`,
    );
  }
  throw new Error(`${path} holds nothing Tome can read. Tome accepts ${ACCEPTED}.`);
}

/**
 * Decide what a library entry names.
 *
 * - `book`: an mdBook folder, with exactly `resolveBookSource`'s fields. A
 *   folder with a `book.toml` or a spine is always a book; a broken one fails
 *   as a book and is never read as loose documents.
 * - `document`: one `.md` or `.docx` file.
 * - `folder`: any other folder holding documents at any depth.
 *
 * Throws an Error naming the path and what Tome accepts for anything else.
 * @param {string} path
 * @returns {Promise<BookSource | DocumentSource>}
 */
export async function resolveSource(path) {
  const target = resolve(path);
  let info = null;
  try {
    info = await stat(target);
  } catch {
    /* does not exist */
  }

  if (!info) {
    if (documentFormat(target)) {
      throw new Error(`file not found: ${target}\n  Tome accepts ${ACCEPTED}.`);
    }
    return refuseAsBook(target);
  }

  if (info.isFile()) {
    const format = documentFormat(target);
    if (!format) {
      throw new Error(`${target} is not a file Tome can read. Tome accepts ${ACCEPTED}.`);
    }
    return {
      kind: 'document',
      root: dirname(target),
      title: null,
      slug: slugify(stem(target)),
      documents: [
        {
          file: target,
          rel: basename(target),
          format,
          opening: true,
          staged: 'README.md',
          part: null,
        },
      ],
    };
  }

  if (await looksLikeBook(target)) {
    return { kind: 'book', ...(await resolveBookSource(target)) };
  }

  const ordered = orderDocuments(await walk(target));
  if (ordered.length === 0) return refuseAsBook(target);
  const staged = stagedNames(ordered);
  return {
    kind: 'folder',
    root: target,
    title: basename(target) || null,
    slug: slugify(basename(target)),
    documents: ordered.map(({ rel, opening }, i) => ({
      file: join(target, ...rel.split('/')),
      rel,
      format: documentFormat(rel),
      opening,
      staged: staged[i],
      part: rel.includes('/') ? rel.split('/')[0] : null,
    })),
  };
}

/**
 * What the dev server says about a source it cannot live-reload, or `undefined`
 * for one it can. Live reload (INT-0009) copies a changed chapter straight into
 * the library; a document is read and converted on the way in, so a change to
 * one is seen after a restart.
 * @param {{ kind: string }} source from `resolveSource()`
 * @returns {string | undefined}
 */
export function liveReloadNotice(source) {
  if (source.kind === 'book') return undefined;
  return 'live reload is off for documents: restart `npm run dev` to see a change to them';
}
