// Populate the content library (src/content/books/<slug>/) from one or more
// external mdBooks, resolved by precedence (highest first):
//
//   1. TOME_BOOKS="/a,/b" (comma-separated) or TOME_BOOK="/a" (single) — env wins.
//   2. tome.config.toml — a committed manifest of `[[book]]` entries
//      (`path`, optional `title`/`slug`).
//   3. Otherwise a no-op: the committed sample (books/tome/) renders.
//
// The whole library is replaced with the resolved set, so a single external
// book stays at the root (adaptive single-tome mode) and several become the
// Bibliotheca. Each book is copied into books/<slug>/ (slugs deduped
// deterministically) with a per-tome book.meta.json. Source/title/slug detection
// + slugify are shared with book-source.mjs (also used by the dev live-reload
// hook). Library root overridable (--dest / TOME_BOOK_DEST, default
// src/content/books) and manifest path overridable (--config / TOME_CONFIG) so
// tests isolate and never touch the sample.
import { cp, rm, mkdir, writeFile, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import process from 'node:process';
import { parse as parseToml } from 'smol-toml';
import { resolveBookSource, slugify, exists } from './book-source.mjs';

function argValue(argv, flag) {
  const i = argv.indexOf(flag);
  return i !== -1 && argv[i + 1] ? argv[i + 1] : undefined;
}

function parseOptions(argv) {
  return {
    dest: argValue(argv, '--dest') || process.env.TOME_BOOK_DEST || 'src/content/books',
    configPath: argValue(argv, '--config') || process.env.TOME_CONFIG || 'tome.config.toml',
  };
}

/** Split a comma-separated env list into trimmed, non-empty paths. */
function envList(value) {
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * The ordered list of book specs (`{ path, title?, slug? }`) to load, by
 * precedence, or `null` for a no-op (keep the committed sample).
 */
async function resolveSpecs(configPath) {
  const { TOME_BOOKS, TOME_BOOK } = process.env;
  if (TOME_BOOKS && envList(TOME_BOOKS).length > 0) {
    return envList(TOME_BOOKS).map((path) => ({ path }));
  }
  if (TOME_BOOK && TOME_BOOK.trim()) {
    return [{ path: TOME_BOOK.trim() }];
  }
  if (await exists(configPath)) {
    const cfg = parseToml(await readFile(configPath, 'utf8'));
    const entries = Array.isArray(cfg.book) ? cfg.book : [];
    const specs = entries
      .filter((e) => e && typeof e.path === 'string' && e.path.trim())
      .map((e) => ({ path: e.path.trim(), title: e.title, slug: e.slug }));
    return specs.length > 0 ? specs : null;
  }
  return null;
}

/** A deterministic, unique slug: `base`, then `base-2`, `base-3`, … on collision. */
function dedupeSlug(base, used) {
  let slug = base;
  let n = 2;
  while (used.has(slug)) slug = `${base}-${n++}`;
  used.add(slug);
  return slug;
}

async function main() {
  const { dest, configPath } = parseOptions(process.argv.slice(2));
  const specs = await resolveSpecs(configPath);

  if (!specs) {
    console.log(
      'load-books: no tomes configured (TOME_BOOKS/TOME_BOOK env or tome.config.toml [[book]] entries) — using the bundled sample.',
    );
    return;
  }

  // Resolve every book first (so an invalid one fails before we touch the tree).
  const used = new Set();
  const resolved = [];
  for (const spec of specs) {
    const src = await resolveBookSource(spec.path);
    const title = spec.title ?? src.title;
    const slug = dedupeSlug(slugify(spec.slug ?? src.slug), used);
    resolved.push({ sourceDir: src.sourceDir, title, slug });
  }

  // Replace the whole library with the resolved set.
  await rm(dest, { recursive: true, force: true });
  for (const book of resolved) {
    const out = join(dest, book.slug);
    await mkdir(out, { recursive: true });
    await cp(book.sourceDir, out, { recursive: true });
    await writeFile(
      join(out, 'book.meta.json'),
      `${JSON.stringify({ title: book.title ?? null }, null, 2)}\n`,
    );
  }

  const summary = resolved.map((b) => `${b.slug} ("${b.title ?? '(untitled)'}")`).join(', ');
  console.log(`load-books: loaded ${resolved.length} tome(s) into ${dest}: ${summary}`);
}

main().catch((err) => {
  console.error(`load-books: ERROR — ${err.message}`);
  process.exit(1);
});
