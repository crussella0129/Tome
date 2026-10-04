// Find the mdBooks on this machine, or add one to your personal library.
//
//   npm run books:find                       # scan your home folder (depth 5)
//   npm run books:find -- ~/notes ../dnd     # scan specific folders
//   npm run books:find -- --depth 8 --json   # deeper, machine-readable
//   npm run books:add -- ../my-campaign      # validate + append to tome.local.toml
//
// A folder is a book when Tome's own loader would accept it (the shared
// book-source rules: `book.toml` [book].src, else src/ → docs/ → the root holding
// SUMMARY.md). A book's own src/ or docs/ folder is never listed separately.
// The scan skips symlinks/junctions, dot-folders, version control, dependency
// and build output, OS folders, and cloud-sync roots — name one of those
// explicitly as a root to scan it anyway. `--json` prints one stable document
// for agents: { version, roots, depth, books: [...], skipped: [...] }.
import { readdir, readFile, writeFile, realpath } from 'node:fs/promises';
import { homedir } from 'node:os';
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import process from 'node:process';
import { parse as parseToml } from 'smol-toml';
import { resolveBookSource, exists } from './book-source.mjs';
import { LOCAL_MANIFEST } from './library-config.mjs';

const { parseSummary, flattenChapters } = await import('../src/lib/summary.ts');

const DEFAULT_DEPTH = 5;
/** Folder names never descended into (unless given as a root). */
const PRUNED = new Set([
  'node_modules',
  'target',
  'dist',
  'vendor',
  '__pycache__',
  'venv',
  'site-packages',
  'AppData',
  'Application Data',
  'Local Settings',
  'Library',
  'Program Files',
  'Program Files (x86)',
  'ProgramData',
  'Windows',
  '$Recycle.Bin',
  'System Volume Information',
  'iCloudDrive',
  'iCloud Drive',
  'iCloudPhotos',
  'Dropbox',
  'Google Drive',
  'Box',
]);
const CLOUD_PREFIXES = ['OneDrive'];
/** Tome's own generated library holds copies of books, not books. */
const GENERATED_LIBRARY = join('src', 'content', 'library');

function pruned(name, path) {
  return (
    name.startsWith('.') ||
    PRUNED.has(name) ||
    CLOUD_PREFIXES.some((prefix) => name.startsWith(prefix)) ||
    path.endsWith(sep + GENERATED_LIBRARY)
  );
}

function parseArgs(argv) {
  const opts = {
    roots: [],
    depth: DEFAULT_DEPTH,
    json: false,
    add: null,
    title: null,
    slug: null,
    config: null,
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const next = () => {
      const value = argv[++i];
      if (value === undefined) throw new Error(`${arg} needs a value`);
      return value;
    };
    if (arg === '--json') opts.json = true;
    else if (arg === '--depth') opts.depth = Number(next());
    else if (arg === '--add') opts.add = next();
    else if (arg === '--title') opts.title = next();
    else if (arg === '--slug') opts.slug = next();
    else if (arg === '--config') opts.config = next();
    else if (arg.startsWith('--')) throw new Error(`unknown option ${arg}`);
    else opts.roots.push(arg);
  }
  if (!Number.isInteger(opts.depth) || opts.depth < 0)
    throw new Error('--depth must be a whole number');
  return opts;
}

/** Could this folder be a book root? (Cheap check before full validation.) */
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

/** Describe a validated book the way the loader would see it. */
async function describe(dir) {
  const src = await resolveBookSource(dir);
  const toml = (await exists(join(src.root, 'book.toml')))
    ? await readFile(join(src.root, 'book.toml'), 'utf8')
    : '';
  const within = relative(src.root, src.sourceDir).split(sep).join('/');
  const layout = /^\s*src\s*=/m.test(toml) ? 'book.toml' : within === '' ? 'root' : `${within}/`;
  const toc = parseSummary(await readFile(join(src.sourceDir, 'SUMMARY.md'), 'utf8'));
  return {
    path: src.root,
    sourceDir: src.sourceDir,
    title: src.title,
    chapters: flattenChapters(toc).length,
    layout,
    sprintBook: await exists(join(src.sourceDir, '.sprint-loop-book')),
  };
}

/** Walk each root breadth-first up to `depth`, collecting books and skips. */
async function scan(roots, depth) {
  const books = [];
  const skipped = [];
  const consumed = new Set(); // books' own source folders
  const seen = new Set();
  for (const root of roots) {
    let frontier = [{ dir: resolve(root), level: 0 }];
    while (frontier.length > 0) {
      const next = [];
      for (const { dir, level } of frontier) {
        if (consumed.has(dir) || seen.has(dir)) continue;
        seen.add(dir);
        if (await looksLikeBook(dir)) {
          try {
            const book = await describe(dir);
            books.push(book);
            if (resolve(book.sourceDir) !== dir) consumed.add(resolve(book.sourceDir));
          } catch (error) {
            skipped.push({
              path: dir,
              reason: error instanceof Error ? error.message.split('\n')[0] : String(error),
            });
          }
        }
        if (level >= depth) continue;
        let entries;
        try {
          entries = await readdir(dir, { withFileTypes: true });
        } catch {
          continue; // unreadable (permissions, vanished) — not a book
        }
        for (const entry of entries) {
          if (!entry.isDirectory() || entry.isSymbolicLink()) continue;
          const child = join(dir, entry.name);
          if (!pruned(entry.name, child)) next.push({ dir: child, level: level + 1 });
        }
      }
      frontier = next;
    }
  }
  const byPath = (a, b) => a.path.localeCompare(b.path);
  return { books: books.sort(byPath), skipped: skipped.sort(byPath) };
}

function printTable(roots, depth, { books, skipped }) {
  const where = roots.join(', ');
  if (books.length === 0) {
    console.log(`No books found under ${where} (depth ${depth}).`);
  } else {
    console.log(
      `Found ${books.length} book${books.length === 1 ? '' : 's'} under ${where} (depth ${depth}):\n`,
    );
    const rows = books.map((b, i) => [
      String(i + 1),
      String(b.chapters),
      b.layout + (b.sprintBook ? ' ⟐' : ''),
      b.title ?? '(untitled)',
      b.path,
    ]);
    const head = ['#', 'CHAPTERS', 'LAYOUT', 'TITLE', 'PATH'];
    const widths = head.map((h, c) => Math.max(h.length, ...rows.map((r) => r[c].length)));
    const last = head.length - 1;
    const line = (r) =>
      r
        .map((cell, c) =>
          c < 2 ? cell.padStart(widths[c]) : c === last ? cell : cell.padEnd(widths[c]),
        )
        .join('  ');
    console.log(`  ${line(head)}`);
    for (const r of rows) console.log(`  ${line(r)}`);
    if (books.some((b) => b.sprintBook)) console.log('\n  ⟐ = a Sprint Loops Project Book');
    console.log('\nAdd one to your library:  npm run books:add -- "<path>"');
  }
  if (skipped.length > 0) {
    console.log(
      `\nSkipped ${skipped.length} folder${skipped.length === 1 ? '' : 's'} that look like books but won't load:`,
    );
    for (const s of skipped) console.log(`  ${s.path}\n    ${s.reason}`);
  }
}

/** Append a validated book to the personal manifest (never a tracked file). */
async function add({ add: target, title, slug, config }) {
  const book = await describe(resolve(target));
  const manifest = resolve(config ?? LOCAL_MANIFEST);
  const real = await realpath(book.path);
  let text = '';
  if (await exists(manifest)) {
    text = await readFile(manifest, 'utf8');
    const entries = Array.isArray(parseToml(text).book) ? parseToml(text).book : [];
    for (const entry of entries) {
      if (typeof entry?.path !== 'string') continue;
      const listed = isAbsolute(entry.path) ? entry.path : resolve(dirname(manifest), entry.path);
      if ((await exists(listed)) && (await realpath(listed)) === real) {
        console.log(`"${book.title}" is already in ${basename(manifest)} — nothing to add.`);
        return;
      }
    }
  } else {
    text =
      '# tome.local.toml — your personal Bibliotheca (git-ignored; wins over tome.config.toml).\n' +
      '# Same format as tome.config.toml. Managed by `npm run books:add`; edit freely.\n';
  }
  const lines = ['', '[[book]]', `path = ${JSON.stringify(book.path)}`];
  if (title) lines.push(`title = ${JSON.stringify(title)}`);
  if (slug) lines.push(`slug = ${JSON.stringify(slug)}`);
  await writeFile(manifest, `${text.replace(/\n*$/, '\n')}${lines.join('\n')}\n`);
  console.log(
    `Added "${title ?? book.title}" (${book.chapters} chapters) to ${basename(manifest)}.`,
  );
  console.log('Next:  npm run dev     (or npm run build for a static site in dist/)');
}

try {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.add) {
    await add(opts);
  } else {
    const roots = opts.roots.length > 0 ? opts.roots.map((r) => resolve(r)) : [homedir()];
    const found = await scan(roots, opts.depth);
    if (opts.json) {
      console.log(JSON.stringify({ version: 1, roots, depth: opts.depth, ...found }, null, 2));
    } else {
      printTable(roots, opts.depth, found);
    }
  }
} catch (error) {
  console.error(`books: ERROR — ${error instanceof Error ? error.message : error}`);
  process.exitCode = 1;
}
