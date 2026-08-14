// External-book build gate: for each fixture book, builds Tome with
// TOME_BOOK pointed at it and asserts the external book renders (its routes
// replace the sample). A single external book stays at the root (adaptive
// single-tome mode). Covers the standard layout (book.toml + src/, incl. a
// relative image) AND a config-less docs/ layout (no book.toml — detected).
// src/content/books/ is restored to HEAD after EACH book and on any failure, so
// the gate is idempotent and leaves the tree at HEAD. Runs locally and in CI.
//
// NOTE: this gate replaces src/content/books/. It refuses to start unless that
// target is pristine, then strictly restores tracked content and removes only
// fixture residue within the target after each case.
import { execFileSync, execSync } from 'node:child_process';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import process from 'node:process';

const root = process.cwd();
const BOOK_DIR = 'src/content/books';
const dist = join(root, 'dist');

function build(env = {}) {
  execSync('npm run build', {
    cwd: root,
    stdio: 'inherit',
    env: { ...process.env, ...env },
  });
}

function verifyHandbookInBrowser() {
  execSync('npx playwright test', {
    cwd: root,
    stdio: 'inherit',
    env: { ...process.env, TOME_EXTERNAL_BOOK_E2E: '1' },
  });
}

function contentStatus() {
  return execFileSync(
    'git',
    [
      'status',
      '--porcelain=v1',
      '--untracked-files=all',
      '--ignored=matching',
      '--',
      BOOK_DIR,
    ],
    { cwd: root, encoding: 'utf8' },
  ).trim();
}

function requirePristineContent() {
  const status = contentStatus();
  if (status) {
    throw new Error(
      `${BOOK_DIR} has local tracked, untracked, or ignored changes; refusing destructive fixture sync:\n${status}`,
    );
  }
}

function restoreSample() {
  execFileSync(
    'git',
    ['restore', '--source=HEAD', '--worktree', '--', BOOK_DIR],
    {
      cwd: root,
      stdio: 'ignore',
    },
  );
  execFileSync('git', ['clean', '-fdqx', '--', BOOK_DIR], {
    cwd: root,
    stdio: 'ignore',
  });
  const status = contentStatus();
  if (status)
    throw new Error(`sample restoration left content residue:\n${status}`);
}

function fail(message) {
  throw new Error(message);
}

function message(error) {
  return error instanceof Error ? error.message : String(error);
}

function requireRoute(slug, label) {
  if (!existsSync(join(dist, slug, 'index.html')))
    fail(`${label}: dist/${slug}/ was not generated`);
}
function requireAbsent(slug, label) {
  if (existsSync(join(dist, slug, 'index.html')))
    fail(`${label}: dist/${slug}/ is still present`);
}
function readRoute(slug) {
  return readFileSync(join(dist, slug, 'index.html'), 'utf8');
}

function requireOptimizedAsset(slug, basename, label) {
  const escaped = basename.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = readRoute(slug).match(
    new RegExp(`src="(/_astro/${escaped}\\.[^"]+\\.svg)"`),
  );
  if (!match)
    fail(`${label}: ${basename} did not render as an optimized /_astro/ asset`);
  const emitted = join(dist, match[1].slice(1));
  if (!existsSync(emitted) || statSync(emitted).size === 0) {
    fail(`${label}: optimized asset ${match[1]} is missing or empty`);
  }
}

// Each case: a fixture book + its assertions on the built dist/.
const CASES = [
  {
    name: 'handbook (standard: book.toml + src/, relative image)',
    book: join(root, 'fixtures', 'handbook'),
    browser: true,
    check() {
      requireRoute('first', 'handbook');
      requireAbsent('getting-started', 'handbook'); // sample replaced
      requireOptimizedAsset('first', 'plate', 'handbook in-source image');
      requireOptimizedAsset(
        'first',
        'parent-plate',
        'handbook parent-relative image',
      );
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
        fail(
          'docs-book: the directory-name title "docs-book" is not shown in the sidebar',
        );
      }
    },
  },
];

function runCase({ name, book, check, browser = false }) {
  let caseError;
  try {
    console.log(`check-external-build: building ${name} …`);
    build({ TOME_BOOK: book });
    check();
    if (browser) {
      console.log('check-external-build: verifying handbook in Chromium …');
      verifyHandbookInBrowser();
    }
    console.log(`check-external-build: OK — ${name}`);
  } catch (error) {
    caseError = error;
  }

  try {
    restoreSample();
  } catch (restoreError) {
    if (caseError) {
      throw new AggregateError(
        [caseError, restoreError],
        `${name} failed (${message(caseError)}) and sample restoration failed (${message(restoreError)})`,
      );
    }
    throw restoreError;
  }

  if (caseError) throw caseError;
}

try {
  requirePristineContent();
  for (const fixtureCase of CASES) runCase(fixtureCase);

  console.log(
    'check-external-build: all external books rendered; rebuilding default …',
  );
  build();
  requirePristineContent();
} catch (error) {
  console.error(`check-external-build: FAIL — ${message(error)}`);
  process.exitCode = 1;
}
