// Shared book-source logic used by the build-time loader (load-books.mjs) and
// the dev-time live-reload integration (astro.config.mjs): detect a book's
// source directory + title + slug, and sync one changed file into the destination.
import { readFile, access, mkdir, rm, copyFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { join, resolve, basename, relative, dirname } from 'node:path';

export async function exists(path) {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * A filesystem/URL-safe tome slug from an arbitrary name (a directory name or
 * title): lowercased, non-alphanumerics collapsed to single hyphens, trimmed.
 * Falls back to `book` for an empty result. Callers dedupe collisions.
 */
export function slugify(name) {
  return (
    String(name)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'book'
  );
}

// Extract just `title` and `src` from a book.toml (two fields — no TOML dep).
export function extractBookToml(text) {
  const title = text.match(/^\s*title\s*=\s*["']([^"']*)["']/m)?.[1];
  const src = text.match(/^\s*src\s*=\s*["']([^"']*)["']/m)?.[1];
  return { title, src };
}

/**
 * Resolve `{ root, sourceDir, title }` for a book root.
 * A declared `book.toml` `src` is authoritative (used exactly; throws if it
 * lacks SUMMARY.md). Otherwise auto-detect `src/` → `docs/` → the root. Title is
 * the `book.toml` title, else the root directory name, else null (the caller
 * falls back to the SUMMARY heading). Throws Error when no SUMMARY.md is found.
 */
export async function resolveBookSource(bookRoot) {
  const root = resolve(bookRoot);
  let tomlTitle;
  let declaredSrc;
  const tomlPath = join(root, 'book.toml');
  if (await exists(tomlPath)) {
    const parsed = extractBookToml(await readFile(tomlPath, 'utf8'));
    if (parsed.title) tomlTitle = parsed.title;
    if (parsed.src) declaredSrc = parsed.src;
  }

  let sourceDir;
  if (declaredSrc) {
    const dir = join(root, declaredSrc);
    if (await exists(join(dir, 'SUMMARY.md'))) {
      sourceDir = dir;
    } else {
      throw new Error(
        `book.toml declares src="${declaredSrc}" but ${join(dir, 'SUMMARY.md')} does not exist.`,
      );
    }
  } else {
    const tried = [];
    for (const candidate of ['src', 'docs', '.']) {
      const dir = join(root, candidate);
      const summary = join(dir, 'SUMMARY.md');
      tried.push(summary);
      if (await exists(summary)) {
        sourceDir = dir;
        break;
      }
    }
    if (!sourceDir) {
      throw new Error(
        `no SUMMARY.md found for book root ${root}. Tried:\n` +
          tried.map((path) => `    ${path}`).join('\n') +
          `\n  Point the book path at a root whose src/, docs/, or root contains ` +
          `SUMMARY.md, or set book.toml [book].src.`,
      );
    }
  }

  const title = tomlTitle ?? (basename(root) || undefined);
  // Default per-tome slug from the root directory name (stable across runs and
  // independent of the title, which may contain spaces). Callers may override.
  return { root, sourceDir, title: title ?? null, slug: slugify(basename(root)) };
}

/**
 * Sync one changed/added/removed path from `sourceDir` into `dest`, preserving
 * the relative path. Returns the destination path, or `null` if `changedAbsPath`
 * is not under `sourceDir` (so events for unrelated files are ignored — and the
 * copy into `dest` never re-triggers itself).
 */
export async function syncPath(changedAbsPath, sourceDir, dest) {
  const rel = relative(sourceDir, changedAbsPath);
  if (rel === '' || rel.startsWith('..')) return null;
  const target = join(dest, rel);
  if (await exists(changedAbsPath)) {
    await mkdir(dirname(target), { recursive: true });
    await copyFile(changedAbsPath, target);
  } else {
    await rm(target, { force: true });
  }
  return target;
}
