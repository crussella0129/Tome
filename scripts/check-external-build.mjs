// External-book build gate: for each fixture book, builds Tome with
// TOME_BOOK pointed at it and asserts the external book renders (its routes
// replace the sample). Covers the standard layout (book.toml + src/, incl. a
// relative image) AND a config-less docs/ layout (no book.toml — detected).
// src/content/book/ is restored to HEAD after EACH book and on any failure, so
// the gate is idempotent and leaves the tree at HEAD. Runs locally and in CI.
//
// NOTE: restores src/content/book/ via `git checkout` + `git clean` — intended
// to run on a CLEAN tree (CI always is); uncommitted edits there are discarded.
import { execSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import process from 'node:process';

const root = process.cwd();
const BOOK_DIR = 'src/content/book';
const dist = join(root, 'dist');

function build(env = {}) {
  execSync('npm run build', { cwd: root, stdio: 'inherit', env: { ...process.env, ...env } });
}

function restoreSample() {
  try {
    execSync(`git checkout -- ${BOOK_DIR}`, { cwd: root, stdio: 'ignore' });
    execSync(`git clean -fdq ${BOOK_DIR}`, { cwd: root, stdio: 'ignore' });
  } catch {
    /* best effort */
  }
}

function fail(message) {
  console.error(`check-external-build: FAIL — ${message}`);
  restoreSample();
  process.exit(1);
}

function requireRoute(slug, label) {
  if (!existsSync(join(dist, slug, 'index.html'))) fail(`${label}: dist/${slug}/ was not generated`);
}
function requireAbsent(slug, label) {
  if (existsSync(join(dist, slug, 'index.html'))) fail(`${label}: dist/${slug}/ is still present`);
}
function readRoute(slug) {
  return readFileSync(join(dist, slug, 'index.html'), 'utf8');
}

// Each case: a fixture book + its assertions on the built dist/.
const CASES = [
  {
    name: 'handbook (standard: book.toml + src/, relative image)',
    book: join(root, 'fixtures', 'handbook'),
    check() {
      requireRoute('first', 'handbook');
      requireAbsent('getting-started', 'handbook'); // sample replaced
      if (!/src="\/_astro\/plate\.[^"]+\.svg"/.test(readRoute('first'))) {
        fail('handbook: the relative image did not render as an optimized /_astro/ asset');
      }
    },
  },
  {
    name: 'docs-book (config-less: no book.toml, docs/ layout)',
    book: join(root, 'fixtures', 'docs-book'),
    check() {
      requireRoute('overview', 'docs-book'); // detected docs/ source
      requireRoute('details/deep', 'docs-book'); // nested from detected source
      requireAbsent('getting-started', 'docs-book'); // sample replaced
      if (!readRoute('').includes('>docs-book<')) {
        fail('docs-book: the directory-name title "docs-book" is not shown in the sidebar');
      }
    },
  },
];

for (const { name, book, check } of CASES) {
  console.log(`check-external-build: building ${name} …`);
  try {
    build({ TOME_BOOK: book });
  } catch {
    fail(`build failed for ${name}`);
  }
  check();
  console.log(`check-external-build: OK — ${name}`);
  restoreSample();
}

console.log('check-external-build: all external books rendered; rebuilding default …');
try {
  build();
} catch {
  /* non-fatal: the sample is restored on disk; a rebuild failure here is unrelated */
}
