// Library-level configuration (as opposed to per-book): which manifest lists
// the tomes, and the Bibliotheca's owner, shown on the masthead as "The
// Bibliotheca of <owner>".
//
// Manifest precedence (INT-0023): an explicit `--config` / TOME_CONFIG wins;
// otherwise the git-ignored personal `tome.local.toml`, when it exists; otherwise
// the tracked `tome.config.toml` (a commented template by default). The book
// env vars (TOME_BOOKS / TOME_BOOK) sit above all of these in load-books.mjs.
//
// Owner precedence: the TOME_OWNER env var, then a top-level `owner` key in the
// resolved manifest, then the OS login name (so it personalizes with zero
// config) — or null only if the username can't be read (the masthead then reads
// just "Bibliotheca").
import { readFile } from 'node:fs/promises';
import { userInfo } from 'node:os';
import { join, isAbsolute } from 'node:path';
import { parse as parseToml } from 'smol-toml';
import { exists } from './book-source.mjs';

/** The personal, git-ignored manifest. */
export const LOCAL_MANIFEST = 'tome.local.toml';
/** The tracked manifest template. */
export const SHARED_MANIFEST = 'tome.config.toml';

/**
 * The manifest path to read, resolved against `cwd` unless absolute.
 * @param {{ explicit?: string | null, env?: NodeJS.ProcessEnv, cwd?: string }} [options]
 */
export async function resolveManifestPath({
  explicit,
  env = process.env,
  cwd = process.cwd(),
} = {}) {
  const at = (path) => (isAbsolute(path) ? path : join(cwd, path));
  const chosen = explicit || (env.TOME_CONFIG && env.TOME_CONFIG.trim());
  if (chosen) return at(chosen);
  const local = at(LOCAL_MANIFEST);
  if (await exists(local)) return local;
  return at(SHARED_MANIFEST);
}

/**
 * @param {{ configPath?: string, env?: NodeJS.ProcessEnv, cwd?: string }} [options]
 */
export async function resolveOwner({ configPath, env = process.env, cwd = process.cwd() } = {}) {
  if (env.TOME_OWNER && env.TOME_OWNER.trim()) return env.TOME_OWNER.trim();
  const manifest = configPath ?? (await resolveManifestPath({ env, cwd }));
  if (await exists(manifest)) {
    const cfg = parseToml(await readFile(manifest, 'utf8'));
    if (typeof cfg.owner === 'string' && cfg.owner.trim()) return cfg.owner.trim();
  }
  // Default to whoever is running the system — available in userspace on every
  // common OS. (userInfo throws only without a passwd entry, e.g. some containers.)
  try {
    const name = userInfo().username;
    if (name && name.trim()) return name.trim();
  } catch {
    /* no OS user available — fall through to the generic masthead */
  }
  return null;
}
