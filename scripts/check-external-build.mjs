// External-book build gate: builds Tome with the bundled fixture mdBook
// (TOME_BOOK=fixtures/handbook) and asserts that the external book renders —
// its routes replace the sample AND a chapter's RELATIVE image is optimized to
// an /_astro/ asset. Then restores src/content/book/ to HEAD and rebuilds the
// default. Runs locally and in CI.
//
// NOTE: this restores src/content/book/ via `git checkout` + `git clean`, so it
// is intended to run on a CLEAN tree (CI always is) — uncommitted edits under
// src/content/book/ would be discarded.
import { execSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import process from 'node:process';

const root = process.cwd();
const BOOK_DIR = 'src/content/book';
const fixture = join(root, 'fixtures', 'handbook');

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

console.log('check-external-build: building with TOME_BOOK=fixtures/handbook …');
try {
  build({ TOME_BOOK: fixture });
} catch {
  fail('build with the fixture book failed');
}

const firstPage = join(root, 'dist', 'first', 'index.html');
if (!existsSync(firstPage)) fail('fixture route dist/first/ was not generated');
if (existsSync(join(root, 'dist', 'getting-started', 'index.html'))) {
  fail('sample route dist/getting-started/ is still present (external book did not replace the sample)');
}

const html = readFileSync(firstPage, 'utf8');
if (!/src="\/_astro\/plate\.[^"]+\.svg"/.test(html)) {
  fail('the relative image did not render as an optimized /_astro/ asset in dist/first/');
}

console.log(
  'check-external-build: OK — fixture routes present, sample absent, relative image optimized to /_astro/.',
);

restoreSample();
console.log('check-external-build: restored the sample; rebuilding default …');
try {
  build();
} catch {
  /* non-fatal: the sample is restored on disk; a rebuild failure here is unrelated */
}
