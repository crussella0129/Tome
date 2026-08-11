// Populate src/content/book/ from an external mdBook chosen at build time via
// the TOME_BOOK env var (its root directory). When TOME_BOOK is unset this is a
// no-op and the committed sample renders (the INT-0001 fallback). Source + title
// detection lives in the shared book-source.mjs (also used by the dev live-reload
// integration).
//
// Destination is overridable (`--dest <dir>` or TOME_BOOK_DEST, default
// src/content/book) so tests target a temp dir and never touch the sample.
import { cp, rm, mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import process from 'node:process';
import { resolveBookSource } from './book-source.mjs';

function parseDest(argv) {
  const i = argv.indexOf('--dest');
  if (i !== -1 && argv[i + 1]) return argv[i + 1];
  return process.env.TOME_BOOK_DEST || 'src/content/book';
}

async function main() {
  const dest = parseDest(process.argv.slice(2));
  const bookRoot = process.env.TOME_BOOK;

  if (!bookRoot) {
    console.log('load-book: TOME_BOOK unset — using the bundled sample book.');
    return;
  }

  // Detect the source directory + title (throws with a clear message on failure).
  const { sourceDir, title } = await resolveBookSource(bookRoot);

  // Replace the destination with the external book's source tree (md + assets).
  await rm(dest, { recursive: true, force: true });
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
