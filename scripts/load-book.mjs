// Populate the content library from a single external mdBook chosen at build
// time via the TOME_BOOK env var (its root directory). When TOME_BOOK is unset
// this is a no-op and the committed sample (`src/content/books/tome/`) renders
// (the INT-0001 fallback). Source + title + slug detection lives in the shared
// book-source.mjs (also used by the dev live-reload integration and, for the
// full library, by load-books.mjs).
//
// A single external book REPLACES the library: the whole books/ dir is cleared
// and the book is written to `books/<slug>/`, so exactly one tome is present and
// routing stays at the root (adaptive single-tome mode).
//
// The library root is overridable (`--dest <dir>` or TOME_BOOK_DEST, default
// src/content/books) so tests target a temp dir and never touch the sample.
import { cp, rm, mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import process from 'node:process';
import { resolveBookSource } from './book-source.mjs';

function parseDest(argv) {
  const i = argv.indexOf('--dest');
  if (i !== -1 && argv[i + 1]) return argv[i + 1];
  return process.env.TOME_BOOK_DEST || 'src/content/books';
}

async function main() {
  const libDest = parseDest(process.argv.slice(2));
  const bookRoot = process.env.TOME_BOOK;

  if (!bookRoot) {
    console.log('load-book: TOME_BOOK unset — using the bundled sample book.');
    return;
  }

  // Detect the source directory + title + slug (throws with a clear message).
  const { sourceDir, title, slug } = await resolveBookSource(bookRoot);
  const dest = join(libDest, slug);

  // Replace the whole library with just this book (single-tome mode).
  await rm(libDest, { recursive: true, force: true });
  await mkdir(dest, { recursive: true });
  await cp(sourceDir, dest, { recursive: true });

  // Title: book.toml title → root dir name → null (book.ts falls back to the
  // SUMMARY.md heading).
  await writeFile(
    join(dest, 'book.meta.json'),
    `${JSON.stringify({ title }, null, 2)}\n`,
  );

  console.log(
    `load-book: loaded "${title ?? '(untitled)'}" from ${sourceDir} into ${dest}`,
  );
}

main().catch((err) => {
  console.error(`load-book: ERROR — ${err.message}`);
  process.exit(1);
});
