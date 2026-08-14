// Search build gate: proves the search index is emitted end to end and that the
// real scorer resolves a query against it — for a single-tome build (root URLs)
// and a two-tome build (namespaced URLs). Imports the pure `search` from the TS
// source (Node 24 strips the type-only import). src/content/books/ is restored to
// HEAD after the multi build and on any failure, so the gate is idempotent.
//
// NOTE: restores src/content/books/ via `git checkout` + `git clean` — intended
// to run on a CLEAN tree (CI always is); uncommitted edits there are discarded.
import { execSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import process from 'node:process';

const { search } = await import('../src/lib/search.ts');

const root = process.cwd();
const BOOK_DIR = 'src/content/books';
const INDEX = join(root, 'dist', 'search-index.json');

function restore() {
  try {
    execSync(`git checkout -- ${BOOK_DIR}`, { cwd: root, stdio: 'ignore' });
    execSync(`git clean -fdq ${BOOK_DIR}`, { cwd: root, stdio: 'ignore' });
  } catch {
    /* best effort */
  }
}

function fail(message) {
  console.error(`check-search: FAIL — ${message}`);
  restore();
  process.exit(1);
}

function build(env = {}) {
  try {
    execSync('npm run build', { cwd: root, stdio: 'inherit', env: { ...process.env, ...env } });
  } catch {
    fail('build failed');
  }
}

function readIndex() {
  if (!existsSync(INDEX)) fail('dist/search-index.json was not emitted');
  return JSON.parse(readFileSync(INDEX, 'utf8'));
}

// 1. Single-tome build → root URLs, index covers the sample, query resolves.
console.log('check-search: building the single-tome sample …');
build();
const single = readIndex();
const gs = single.find((r) => r.url === '/getting-started');
if (!gs) fail('single: no record with url /getting-started');
if (!gs.headings.some((h) => h.slug === 'the-summary-is-the-spine')) {
  fail('single: getting-started record is missing the expected heading slug');
}
const panels = search('panels', single);
if (!panels.length || !panels[0].url.startsWith('/components/panels')) {
  fail(`single: query "panels" did not resolve to /components/panels (got ${panels[0]?.url})`);
}
console.log('check-search: OK — single-tome index emitted, root URLs, query resolves.');

// 2. Two-tome build → namespaced URLs, query resolves to a namespaced chapter.
console.log('check-search: building two tomes (fixtures/handbook,fixtures/docs-book) …');
build({ TOME_BOOKS: 'fixtures/handbook,fixtures/docs-book' });
const multi = readIndex();
if (!multi.some((r) => r.url === '/handbook/first')) fail('multi: missing namespaced /handbook/first');
if (!multi.some((r) => r.url.startsWith('/docs-book/'))) fail('multi: missing namespaced docs-book URLs');
const nested = search('nested', multi);
if (!nested.length || !nested[0].url.startsWith('/handbook/')) {
  fail(`multi: query "nested" did not resolve to a namespaced handbook URL (got ${nested[0]?.url})`);
}
console.log('check-search: OK — two-tome index namespaced, query resolves.');

restore();
console.log('check-search: rebuilding default …');
build();
console.log('check-search: done — tree restored to HEAD.');
