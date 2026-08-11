// Populate src/content/book/ from an external mdBook chosen at build time via
// the TOME_BOOK env var (its root directory). When TOME_BOOK is unset this is a
// no-op and the committed sample renders (the INT-0001 fallback). The render
// pipeline already works on whatever lives under the destination, so this is the
// only new step needed to view an arbitrary book.
//
// Destination is overridable (`--dest <dir>` or TOME_BOOK_DEST, default
// src/content/book) so tests target a temp dir and never touch the sample.
import { cp, rm, mkdir, readFile, writeFile, access } from 'node:fs/promises';
import { constants } from 'node:fs';
import { join, resolve, basename } from 'node:path';
import process from 'node:process';

function parseDest(argv) {
  const i = argv.indexOf('--dest');
  if (i !== -1 && argv[i + 1]) return argv[i + 1];
  return process.env.TOME_BOOK_DEST || 'src/content/book';
}

async function exists(path) {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

// Extract just `title` and `src` from a book.toml (two fields — no TOML dep).
function extractBookToml(text) {
  const title = text.match(/^\s*title\s*=\s*["']([^"']*)["']/m)?.[1];
  const src = text.match(/^\s*src\s*=\s*["']([^"']*)["']/m)?.[1];
  return { title, src };
}

function fail(message) {
  console.error(`load-book: ERROR — ${message}`);
  process.exit(1);
}

// Resolve the book's source directory — the one containing SUMMARY.md. A
// declared `book.toml` `src` is authoritative (used exactly, error if it lacks a
// SUMMARY.md). Otherwise auto-detect: `src/` → `docs/` → the root (root last, so
// a config-less docs-layout book like CubiKan loads without a wrapper).
async function resolveSource(root, declaredSrc) {
  if (declaredSrc) {
    const dir = join(root, declaredSrc);
    if (await exists(join(dir, 'SUMMARY.md'))) return dir;
    fail(
      `book.toml declares src="${declaredSrc}" but ${join(dir, 'SUMMARY.md')} does not exist.`,
    );
  }
  const tried = [];
  for (const candidate of ['src', 'docs', '.']) {
    const dir = join(root, candidate);
    const summary = join(dir, 'SUMMARY.md');
    tried.push(summary);
    if (await exists(summary)) return dir;
  }
  fail(
    `no SUMMARY.md found for TOME_BOOK=${root}. Tried:\n` +
      tried.map((path) => `    ${path}`).join('\n') +
      `\n  Point TOME_BOOK at a book root whose src/, docs/, or root contains ` +
      `SUMMARY.md, or set book.toml [book].src.`,
  );
}

async function main() {
  const dest = parseDest(process.argv.slice(2));
  const bookRoot = process.env.TOME_BOOK;

  if (!bookRoot) {
    console.log('load-book: TOME_BOOK unset — using the bundled sample book.');
    return;
  }

  const root = resolve(bookRoot);
  let tomlTitle;
  let declaredSrc;
  const tomlPath = join(root, 'book.toml');
  if (await exists(tomlPath)) {
    const parsed = extractBookToml(await readFile(tomlPath, 'utf8'));
    if (parsed.title) tomlTitle = parsed.title;
    if (parsed.src) declaredSrc = parsed.src;
  }

  const srcDir = await resolveSource(root, declaredSrc);

  // Replace the destination with the external book's source tree (md + assets).
  await rm(dest, { recursive: true, force: true });
  await mkdir(dest, { recursive: true });
  await cp(srcDir, dest, { recursive: true });

  // Title: book.toml title → the book root's directory name → (null, letting
  // book.ts fall back to the SUMMARY.md heading).
  const title = tomlTitle ?? (basename(root) || undefined);
  await writeFile(
    join(dest, 'book.meta.json'),
    `${JSON.stringify({ title: title ?? null }, null, 2)}\n`,
  );

  console.log(
    `load-book: loaded "${title ?? '(untitled)'}" from ${srcDir} into ${dest}`,
  );
}

main().catch((err) => {
  console.error(`load-book: ERROR — ${err.message}`);
  process.exit(1);
});
