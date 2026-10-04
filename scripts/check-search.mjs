// Search build gate: proves the search index is emitted end to end and that the
// real scorer resolves a query against it — for a single-tome build (root URLs)
// and a two-tome build (namespaced URLs). Both modes are exercised with explicit
// fixtures (the shipped default is now a two-tome library). Imports the pure
// `search` from the TS source (Node 24 strips the type-only import).
// Fixtures publish into the generated library; the committed sample is guarded
// and restored after the builds and on any failure, so the gate is idempotent.
//
// Refuses local content changes before setup, then restores through the shared
// fixture lifecycle. Caller book/configuration overrides cannot redirect it.
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import process from 'node:process';
import { createFixtureGate, errorMessage } from './fixture-gate.mjs';

const { search } = await import('../src/lib/search.ts');

const root = process.cwd();
const INDEX = join(root, 'dist', 'search-index.json');
const gate = createFixtureGate({ root });

function fail(message) {
  throw new Error(message);
}

function readIndex() {
  if (!existsSync(INDEX)) fail('dist/search-index.json was not emitted');
  return JSON.parse(readFileSync(INDEX, 'utf8'));
}

try {
  await gate.withFixture(() => {
    // 1. Single-tome build (one external fixture) → root URLs, query resolves.
    console.log('check-search: building a single tome (fixtures/handbook) …');
    gate.build({ TOME_BOOK: 'fixtures/handbook' });
    const single = readIndex();
    if (!single.some((r) => r.url === '/first'))
      fail('single: no record with root url /first');
    if (single.some((r) => r.url.startsWith('/handbook/'))) {
      fail('single: URLs should be root, not namespaced under the tome slug');
    }
    const singleNested = search('nested', single);
    if (
      !singleNested.length ||
      !singleNested[0].url.startsWith('/section/nested')
    ) {
      fail(
        `single: query "nested" did not resolve to /section/nested (got ${singleNested[0]?.url})`,
      );
    }
    console.log(
      'check-search: OK — single-tome index emitted, root URLs, query resolves.',
    );
  });

  await gate.withFixture(() => {
    // 2. Two-tome build → namespaced URLs, query resolves to a namespaced chapter.
    console.log(
      'check-search: building two tomes (fixtures/handbook,fixtures/docs-book) …',
    );
    gate.build({ TOME_BOOKS: 'fixtures/handbook,fixtures/docs-book' });
    const multi = readIndex();
    if (!multi.some((r) => r.url === '/handbook/first'))
      fail('multi: missing namespaced /handbook/first');
    if (!multi.some((r) => r.url.startsWith('/docs-book/')))
      fail('multi: missing namespaced docs-book URLs');
    const nested = search('nested', multi);
    if (!nested.length || !nested[0].url.startsWith('/handbook/')) {
      fail(
        `multi: query "nested" did not resolve to a namespaced handbook URL (got ${nested[0]?.url})`,
      );
    }
    console.log(
      'check-search: OK — two-tome index namespaced, query resolves.',
    );
  });

  console.log('check-search: rebuilding default …');
  await gate.rebuildDefault();
  console.log('check-search: done — tree restored to HEAD.');
} catch (error) {
  console.error(`check-search: FAIL — ${errorMessage(error)}`);
  process.exitCode = 1;
}
