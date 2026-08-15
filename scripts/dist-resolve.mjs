// Shared, pure resolution of a request path to a file inside the built `dist/`.
// Used by both `serve-dist.mjs` (Playwright's static webServer) and the Electron
// shell's `app://` protocol handler, so the two agree exactly on how Astro's
// directory-style routes and root-absolute assets map onto the filesystem.
//
// The build emits only extensionless routes (`/getting-started` ->
// `getting-started/index.html`) and extensioned assets (`/_astro/x.js`,
// `/search-index.json`, `/fonts/x.woff2`), so a pure extension heuristic is exact
// — no filesystem probing required, which keeps this unit-testable and lets the
// protocol handler stay synchronous.
import { join, relative, extname, isAbsolute, sep } from 'node:path';

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
};

/** Content-type for a resolved file path, by extension (octet-stream fallback). */
export function contentTypeFor(filePath) {
  return TYPES[extname(filePath).toLowerCase()] ?? 'application/octet-stream';
}

/**
 * Map a request URL path to an absolute file path inside `distRoot`.
 *
 * - Directory-style route (root, trailing slash, or no extension) -> `index.html`.
 * - Extensioned asset -> the file itself (query/hash stripped).
 * - A path that escapes `distRoot` (e.g. `/../secret`) -> `null` (never read
 *   outside `dist/`). Detection relies on `join` normalizing the `..` and a
 *   containment check, so traversal cannot be smuggled past the guard.
 *
 * @param {string} urlPath  Request path (may include `?query`/`#hash`).
 * @param {string} distRoot Absolute path to the built `dist/`.
 * @returns {string|null}   Absolute file path inside `distRoot`, or `null`.
 */
export function resolveDistPath(urlPath, distRoot) {
  const raw = String(urlPath).split('?')[0].split('#')[0];
  let decoded;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    return null; // malformed percent-encoding
  }

  // `join` normalizes the combined path (collapsing any `..`); the containment
  // check below then rejects anything that resolved outside `distRoot`.
  const candidate = join(distRoot, decoded);
  const rel = relative(distRoot, candidate);
  if (rel !== '' && (rel === '..' || rel.startsWith('..' + sep) || isAbsolute(rel))) {
    return null;
  }

  const isDirectoryRoute = rel === '' || decoded.endsWith('/') || extname(candidate) === '';
  return isDirectoryRoute ? join(candidate, 'index.html') : candidate;
}
