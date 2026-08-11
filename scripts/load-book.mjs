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
import { join, resolve } from 'node:path';
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

async function main() {
  const dest = parseDest(process.argv.slice(2));
  const bookRoot = process.env.TOME_BOOK;

  if (!bookRoot) {
    console.log('load-book: TOME_BOOK unset — using the bundled sample book.');
    return;
  }

  const root = resolve(bookRoot);
  let title;
  let src = 'src';
  const tomlPath = join(root, 'book.toml');
  if (await exists(tomlPath)) {
    const parsed = extractBookToml(await readFile(tomlPath, 'utf8'));
    if (parsed.title) title = parsed.title;
    if (parsed.src) src = parsed.src;
  }

  const srcDir = join(root, src);
  const summaryPath = join(srcDir, 'SUMMARY.md');
  if (!(await exists(summaryPath))) {
    console.error(
      `load-book: ERROR — no SUMMARY.md at ${summaryPath}.\n` +
        `  Set TOME_BOOK to an mdBook root that contains ${src}/SUMMARY.md ` +
        `(check book.toml's [book].src, default "src").`,
    );
    process.exit(1);
  }

  // Replace the destination with the external book's source tree (md + assets).
  await rm(dest, { recursive: true, force: true });
  await mkdir(dest, { recursive: true });
  await cp(srcDir, dest, { recursive: true });

  // The real title comes from book.toml; book.ts falls back to the SUMMARY
  // heading when this is null.
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
