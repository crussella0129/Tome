// Multi-book end-to-end gate: builds Tome with TWO fixture tomes and asserts the
// adaptive multi-tome shape — every chapter namespaced under its tome slug, and a
// `/` Bibliotheca listing both tomes as titled links (plus the sidebar switcher
// on a chapter page). src/content/books/ is restored to HEAD after the build and
// on any failure, so the gate is idempotent and leaves the tree at HEAD. Runs
// locally (build-level), consistent with check-external-build.
//
// Refuses local content changes before setup, then restores through the shared
// fixture lifecycle. Caller book/configuration overrides cannot redirect it.
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import process from 'node:process';
import { createFixtureGate, errorMessage } from './fixture-gate.mjs';

const root = process.cwd();
const dist = join(root, 'dist');
const TOMES = 'fixtures/handbook,fixtures/docs-book';
const gate = createFixtureGate({ root });

function fail(message) {
  throw new Error(message);
}

function requireRoute(slug, label) {
  if (!existsSync(join(dist, slug, 'index.html')))
    fail(`${label}: dist/${slug}/ was not generated`);
}
function requireAbsent(slug, label) {
  if (existsSync(join(dist, slug, 'index.html')))
    fail(`${label}: dist/${slug}/ should not exist`);
}
function readRoute(slug) {
  return readFileSync(join(dist, slug, 'index.html'), 'utf8');
}

try {
  await gate.withFixture(() => {
    console.log(`check-multibook: building two tomes (${TOMES}) …`);
    gate.build({ TOME_BOOKS: TOMES });

    // Every chapter is namespaced under its tome slug.
    requireRoute('handbook', 'handbook index');
    requireRoute('handbook/first', 'handbook chapter');
    requireRoute('handbook/section/nested', 'handbook nested chapter');
    requireRoute('docs-book', 'docs-book index');
    requireRoute('docs-book/overview', 'docs-book chapter');
    requireRoute('docs-book/details/deep', 'docs-book nested chapter');

    // The single-tome root routes must NOT exist — they belong to a tome now.
    requireAbsent('first', 'root-level handbook chapter');
    requireAbsent('overview', 'root-level docs-book chapter');

    // `/` is the Bibliotheca, listing every tome as a titled, namespaced link.
    const index = readRoute('');
    for (const [href, title] of [
      ['/handbook', 'The Sacred Handbook'],
      ['/docs-book', 'docs-book'],
    ]) {
      if (!index.includes(`href="${href}"`))
        fail(`Bibliotheca: missing link to ${href}`);
      if (!index.includes(`>${title}<`))
        fail(`Bibliotheca: missing tome title "${title}"`);
    }

    // A chapter page carries the sidebar switcher: a link to the sibling tome and the
    // active tome marked.
    const chapter = readRoute('handbook/first');
    if (!chapter.includes('href="/docs-book"')) {
      fail('chapter sidebar: switcher is missing a link to the sibling tome');
    }
    if (!/aria-current="true"/.test(chapter)) {
      fail('chapter sidebar: switcher does not mark the active tome');
    }

    console.log(
      'check-multibook: OK — two-tome Bibliotheca + namespaced routes + switcher.',
    );
  });

  console.log('check-multibook: rebuilding default …');
  await gate.rebuildDefault();
} catch (error) {
  console.error(`check-multibook: FAIL — ${errorMessage(error)}`);
  process.exitCode = 1;
}
