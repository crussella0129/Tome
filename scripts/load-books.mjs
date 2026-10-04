// Publish the content library (src/content/library/<slug>/) that Astro reads
// through the `@library` alias. The library is generated and git-ignored; the
// committed sample at src/content/books/ is never written. Tomes are resolved
// by precedence (highest first):
//
//   1. TOME_BOOKS="/a,/b" (comma-separated) or TOME_BOOK="/a" (single) — env wins.
//   2. A manifest of `[[book]]` entries (`path`, optional `title`/`slug`):
//      `--config` / TOME_CONFIG when given, else the personal git-ignored
//      tome.local.toml when it exists, else the tracked tome.config.toml.
//   3. Otherwise the committed sample is published unchanged.
//
// The whole library is replaced with the resolved set, so a single external
// book stays at the root (adaptive single-tome mode) and several become the
// Bibliotheca. Each book is copied into <slug>/ (slugs deduped deterministically)
// with a per-tome book.meta.json — minus version-control metadata, dependency
// trees, and mdBook's own rendered output. Source/title/slug detection + slugify
// are shared with book-source.mjs (also used by the dev live-reload hook).
// Library root overridable (--dest / TOME_BOOK_DEST), manifest (--config /
// TOME_CONFIG), and sample (--sample) so tests isolate and never touch the
// working library.
import {
  cp,
  rm,
  mkdir,
  writeFile,
  readFile,
  mkdtemp,
  realpath,
  rename,
} from 'node:fs/promises';
import { existsSync } from 'node:fs';
import {
  basename,
  dirname,
  isAbsolute,
  join,
  relative,
  resolve,
} from 'node:path';
import process from 'node:process';
import { parse as parseToml } from 'smol-toml';
import { resolveBookSource, slugify, exists } from './book-source.mjs';
import { prepareParentAssets } from './parent-assets.mjs';
import { resolveManifestPath } from './library-config.mjs';

const LIBRARY_DIR = 'src/content/library';
const SAMPLE_DIR = 'src/content/books';

/** Never content, at any depth: version control and dependency trees. */
const EXCLUDED_NAMES = new Set(['.git', '.hg', '.svn', 'node_modules']);

function argValue(argv, flag) {
  const i = argv.indexOf(flag);
  return i !== -1 && argv[i + 1] ? argv[i + 1] : undefined;
}

function parseOptions(argv) {
  return {
    dest: argValue(argv, '--dest') || process.env.TOME_BOOK_DEST || LIBRARY_DIR,
    // TOME_CONFIG is honoured by resolveManifestPath.
    configPath: argValue(argv, '--config'),
    sample: argValue(argv, '--sample') || SAMPLE_DIR,
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
 * precedence, or `null` when nothing is configured (publish the sample).
 * Manifest paths are relative to the manifest's own directory.
 */
async function resolveSpecs(configPath) {
  const { TOME_BOOKS, TOME_BOOK } = process.env;
  if (TOME_BOOKS && envList(TOME_BOOKS).length > 0) {
    return envList(TOME_BOOKS).map((path) => ({ path }));
  }
  if (TOME_BOOK && TOME_BOOK.trim()) {
    return [{ path: TOME_BOOK.trim() }];
  }
  const manifest = await resolveManifestPath({ explicit: configPath });
  if (await exists(manifest)) {
    const cfg = parseToml(await readFile(manifest, 'utf8'));
    const entries = Array.isArray(cfg.book) ? cfg.book : [];
    const specs = entries
      .filter((e) => e && typeof e.path === 'string' && e.path.trim())
      .map((e) => {
        const path = e.path.trim();
        return {
          path: isAbsolute(path) ? path : resolve(dirname(manifest), path),
          title: e.title,
          slug: e.slug,
        };
      });
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

/** `child` lies strictly inside `parent`. */
function within(parent, child) {
  const rel = relative(parent, child);
  return rel !== '' && !rel.startsWith('..') && !isAbsolute(rel);
}

/**
 * The copy filter for one book: skip VCS and dependency directories at any
 * depth, and — when they sit inside the copied source — mdBook's build output
 * (`[build] build-dir`, or a default `book/` that holds a rendered index.html)
 * and a root-level `target/`.
 */
function contentFilter(book) {
  const skipped = new Set();
  const inSource = (abs) =>
    join(book.sourceRealDir, relative(book.sourceDir, abs));
  if (
    within(book.sourceDir, book.buildDir) &&
    (book.buildDirDeclared || existsSync(join(book.buildDir, 'index.html')))
  ) {
    skipped.add(inSource(book.buildDir));
  }
  if (resolve(book.sourceDir) === resolve(book.root)) {
    skipped.add(join(book.sourceRealDir, 'target'));
  }
  return (source) =>
    !EXCLUDED_NAMES.has(basename(source)) && !skipped.has(resolve(source));
}

/**
 * Atomically replace `dest` with a library staged by `fill(stage)`. The previous
 * library survives any failure; a failed rollback names where it was kept.
 */
async function publish(dest, fill) {
  const destination = resolve(dest);
  await mkdir(dirname(destination), { recursive: true });
  let stage = await mkdtemp(
    join(dirname(destination), `.${basename(destination)}.stage-`),
  );
  let backupContainer = null;
  let backup = null;
  try {
    await fill(stage);

    // Keep the previous library available for rollback until the staged tree
    // has been published successfully. Both moves stay on the same filesystem.
    if (await exists(destination)) {
      backupContainer = await mkdtemp(
        join(dirname(destination), `.${basename(destination)}.backup-`),
      );
      backup = join(backupContainer, 'previous');
      try {
        await rename(destination, backup);
      } catch (error) {
        await rm(backupContainer, { recursive: true, force: true });
        backupContainer = null;
        backup = null;
        throw error;
      }
    }

    try {
      await rename(stage, destination);
      stage = null;
    } catch (publishError) {
      if (backup) {
        try {
          await rename(backup, destination);
          backup = null;
        } catch (rollbackError) {
          throw new AggregateError(
            [publishError, rollbackError],
            `could not publish staged library or restore the previous library; previous library remains at ${backup}`,
          );
        }
      }
      throw publishError;
    }

    if (backupContainer) {
      await rm(backupContainer, { recursive: true, force: true });
      backupContainer = null;
      backup = null;
    }
  } finally {
    if (stage) await rm(stage, { recursive: true, force: true });
    // Preserve a non-null backup after a failed rollback: it is the only copy
    // of the previous library and the error above tells the operator its path.
    if (backupContainer && !backup) {
      await rm(backupContainer, { recursive: true, force: true });
    }
  }
}

async function main() {
  const { dest, configPath, sample } = parseOptions(process.argv.slice(2));
  const specs = await resolveSpecs(configPath);

  if (!specs) {
    if (!(await exists(sample))) {
      throw new Error(
        `no tomes configured (TOME_BOOKS/TOME_BOOK, tome.local.toml, or tome.config.toml) and no sample at ${sample}`,
      );
    }
    await publish(dest, (stage) => cp(sample, stage, { recursive: true }));
    console.log(
      `load-books: no tomes configured (TOME_BOOKS/TOME_BOOK env, tome.local.toml, or tome.config.toml [[book]] entries) — using the bundled sample (published to ${dest}).`,
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
    resolved.push({
      ...src,
      sourceRealDir: await realpath(src.sourceDir),
      title,
      slug,
    });
  }

  // Prepare every tome beside the destination before replacing the library.
  // A later-tome failure therefore leaves the existing destination untouched.
  await publish(dest, async (stage) => {
    for (const book of resolved) {
      const out = join(stage, book.slug);
      await mkdir(out, { recursive: true });
      await cp(book.sourceRealDir, out, {
        recursive: true,
        filter: contentFilter(book),
      });
      await prepareParentAssets({
        root: book.root,
        sourceDir: book.sourceDir,
        stagedTome: out,
      });
      await writeFile(
        join(out, 'book.meta.json'),
        `${JSON.stringify({ title: book.title ?? null }, null, 2)}\n`,
      );
    }
  });

  const summary = resolved
    .map((b) => `${b.slug} ("${b.title ?? '(untitled)'}")`)
    .join(', ');
  console.log(
    `load-books: loaded ${resolved.length} tome(s) into ${dest}: ${summary}`,
  );
}

main().catch((err) => {
  console.error(`load-books: ERROR — ${err.message}`);
  process.exit(1);
});
