// Minimal foreground static server for the built `dist/`, used by Playwright's
// webServer. Astro's own `preview` daemonizes (returns immediately), which races
// Playwright's readiness check; this stays in the foreground and serves Astro's
// directory-style routes (`/a/b` -> `dist/a/b/index.html`) deterministically in
// both local and CI runs.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname, normalize } from 'node:path';

const root = join(process.cwd(), 'dist');
const port = Number(process.env.PORT ?? 4321);

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
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
};

async function resolveFile(urlPath) {
  const clean = normalize(decodeURIComponent(urlPath.split('?')[0])).replace(
    /^(\.\.[/\\])+/,
    '',
  );
  const candidate = join(root, clean);
  try {
    const s = await stat(candidate);
    if (s.isDirectory()) return join(candidate, 'index.html');
    return candidate;
  } catch {
    // Astro emits directory-style routes: /a/b -> dist/a/b/index.html
    return join(root, clean, 'index.html');
  }
}

const server = createServer(async (req, res) => {
  try {
    const file = await resolveFile(req.url || '/');
    const body = await readFile(file);
    res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('Not found');
  }
});

server.listen(port, () => {
  console.log(`serve-dist: serving ./dist at http://localhost:${port}`);
});
