// Minimal foreground static server for the built `dist/`, used by Playwright's
// webServer. Astro's own `preview` daemonizes (returns immediately), which races
// Playwright's readiness check; this stays in the foreground and serves Astro's
// directory-style routes (`/a/b` -> `dist/a/b/index.html`) deterministically in
// both local and CI runs. Path resolution + content types come from the shared
// `dist-resolve.mjs`, so this server and the Electron shell agree exactly.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { resolveDistPath, contentTypeFor } from './dist-resolve.mjs';

const root = join(process.cwd(), 'dist');
const port = Number(process.env.PORT ?? 4321);

const server = createServer(async (req, res) => {
  const file = resolveDistPath(req.url || '/', root);
  if (file === null) {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('Not found');
    return;
  }
  try {
    const body = await readFile(file);
    res.writeHead(200, { 'content-type': contentTypeFor(file) });
    res.end(body);
  } catch {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('Not found');
  }
});

server.listen(port, () => {
  console.log(`serve-dist: serving ./dist at http://localhost:${port}`);
});
