// Documents build gate (INT-0029): builds Tome on a folder of loose documents —
// two Markdown notes and two Word papers, no SUMMARY.md — and asserts the built
// site reads them: every chapter routed, one search record each, heading
// anchors that match the search index, and, in Chromium, the Word chapter's
// footnotes, table, image, marks and links (e2e/documents.spec.ts). A second
// build puts the folder beside an mdBook and checks the Bibliotheca.
//
// The Word papers are zipped here from their parts (fixtures/word/), into a
// temporary copy of fixtures/papers/, so nothing is written into the checkout.
// Like the other gates it refuses to start unless the committed sample is
// pristine, restores it after, and rebuilds the default library. Runs locally
// and in CI.
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { buildDocx } from '../fixtures/word/build-docx.mjs';
import { createFixtureGate, errorMessage } from './fixture-gate.mjs';

const root = process.cwd();
const dist = join(root, 'dist');
const gate = createFixtureGate({ root });
// Fixtures are found beside this script, not through the working directory.
const fixtures = join(dirname(fileURLToPath(import.meta.url)), '..', 'fixtures');

function fail(message) {
  throw new Error(message);
}
function routeFile(route) {
  return join(dist, ...route.split('/').filter(Boolean), 'index.html');
}
function requireRoute(route, label) {
  if (!existsSync(routeFile(route))) fail(`${label}: ${route} was not generated`);
}

/** The temporary source: the loose notes plus two Word papers, one in a subfolder. */
async function makePapers(parent) {
  const papers = join(parent, 'papers');
  cpSync(join(fixtures, 'papers'), papers, { recursive: true });
  writeFileSync(join(papers, '3-paper.docx'), await buildDocx());
  writeFileSync(
    join(papers, 'letters', 'paper.docx'),
    await buildDocx(undefined, {
      replace: {
        // A second paper with words of its own, so search can tell them apart.
        'word/document.xml': (xml) =>
          xml
            .replace('On the Weight of Obsidian', 'A Second Paper')
            .replace('Zyzzyva closes the paper.', 'Quixotry closes the letter.'),
      },
    }),
  );
  return papers;
}

const CHAPTERS = ['/1-first-note', '/3-paper', '/letters/2-letter', '/letters/paper'];

function checkSingleTome() {
  requireRoute('/', 'documents'); // a tome with no opening page still answers at `/`
  for (const route of CHAPTERS) requireRoute(route, 'documents');
  if (existsSync(routeFile('/getting-started'))) fail('documents: the sample is still present');

  // check_documents_search_index_unique: one record per chapter, no URL twice
  // (the page at `/` repeats the first chapter and must add no record).
  const index = JSON.parse(readFileSync(join(dist, 'search-index.json'), 'utf8'));
  const urls = index.map((record) => record.url).sort();
  if (JSON.stringify(urls) !== JSON.stringify([...CHAPTERS].sort())) {
    fail(`search index: expected one record per chapter, got ${JSON.stringify(urls)}`);
  }

  // check_documents_heading_ids: a search result's anchor exists on the page,
  // also for a heading that holds a tag (`Washing in H<sub>2</sub>O`).
  const paper = index.find((record) => record.url === '/3-paper');
  const html = readFileSync(routeFile('/3-paper'), 'utf8');
  const slugs = paper.headings.map((heading) => heading.slug);
  if (!slugs.includes('washing-in-h2o')) {
    fail(`heading ids: the subscript heading was slugged ${JSON.stringify(slugs)}`);
  }
  for (const slug of slugs) {
    if (!html.includes(`id="${slug}"`)) fail(`heading ids: no element with id="${slug}"`);
  }
}

function checkBibliotheca() {
  // check_documents_bibliotheca: beside an mdBook, `/` lists both tomes, and
  // the folder of documents opens from the Bibliotheca and from its own
  // sidebar title (`/papers`), though it has no opening page.
  const home = readFileSync(routeFile('/'), 'utf8');
  for (const name of ['The Sacred Handbook', 'papers']) {
    if (!home.includes(`>${name}<`)) fail(`Bibliotheca: "${name}" is not listed`);
  }
  const link = home.match(/href="(\/papers[^"]*)"/)?.[1];
  if (!link) fail('Bibliotheca: no link to the documents tome');
  requireRoute(link, 'Bibliotheca link');
  if (link !== '/papers/1-first-note') fail(`Bibliotheca: the tome opens at ${link}`);
  requireRoute('/papers', 'sidebar title link');
  requireRoute('/handbook', 'handbook');
}

try {
  await gate.withFixture(async () => {
    const parent = mkdtempSync(join(tmpdir(), 'tome-docs-'));
    try {
      const papers = await makePapers(parent);

      console.log('check-documents: building a folder of loose documents …');
      gate.build({ TOME_BOOK: papers });
      checkSingleTome();
      console.log('check-documents: verifying the documents in Chromium …');
      gate.command('npx --no-install playwright test', { TOME_DOCUMENTS_E2E: '1' });
      console.log('check-documents: OK — documents read as a tome');

      console.log('check-documents: building the folder beside an mdBook …');
      gate.build({ TOME_BOOKS: `${join(fixtures, 'handbook')},${papers}` });
      checkBibliotheca();
      console.log('check-documents: OK — documents listed in the Bibliotheca');
    } finally {
      rmSync(parent, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
    }
  });

  console.log('check-documents: all document checks passed; rebuilding default …');
  await gate.rebuildDefault();
} catch (error) {
  console.error(`check-documents: FAIL — ${errorMessage(error)}`);
  process.exitCode = 1;
}
