// Library-level configuration (as opposed to per-book): the Bibliotheca's
// owner, shown on the masthead as "The Bibliotheca of <owner>". Resolved by
// precedence — the TOME_OWNER env var, then a top-level `owner` key in
// tome.config.toml, then the OS login name (so it personalizes with zero
// config) — or null only if the username can't be read (the masthead then reads
// just "Bibliotheca").
import { readFile } from 'node:fs/promises';
import { userInfo } from 'node:os';
import { parse as parseToml } from 'smol-toml';
import { exists } from './book-source.mjs';

export async function resolveOwner({ configPath = 'tome.config.toml', env = process.env } = {}) {
  if (env.TOME_OWNER && env.TOME_OWNER.trim()) return env.TOME_OWNER.trim();
  if (await exists(configPath)) {
    const cfg = parseToml(await readFile(configPath, 'utf8'));
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
