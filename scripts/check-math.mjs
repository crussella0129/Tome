// Mathematics build gate (INT-0030): builds Tome on `fixtures/proofs/`, two
// pages of formulas, and asserts the built site lays them out: formulas as the
// browser's own mathematics with no source left behind, a sum of money left
// alone, a formula that could not be read shown as typed and named by the
// build, heading addresses that match the search index, the rail's text, and,
// in Chromium and in WebKit, where each formula's parts actually stand
// (e2e/math.spec.ts).
//
// Like the other gates it refuses to start unless the committed sample is
// pristine, restores it after, and rebuilds the default library. Runs locally
// and in CI.
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { createFixtureGate, errorMessage } from './fixture-gate.mjs';

const root = process.cwd();
const dist = join(root, 'dist');
const gate = createFixtureGate({ root });
// Fixtures are found beside this script, not through the working directory.
const proofs = join(dirname(fileURLToPath(import.meta.url)), '..', 'fixtures', 'proofs');
const BACKSLASH = String.fromCharCode(92);

function fail(message) {
  throw new Error(message);
}
function page(route) {
  const file = join(dist, ...route.split('/').filter(Boolean), 'index.html');
  if (!existsSync(file)) fail(`${route} was not generated`);
  return readFileSync(file, 'utf8');
}
/** The chapter itself: what stands inside `<article>`. */
function article(html, route) {
  const found = html.match(/<article\b[^>]*>([\s\S]*?)<\/article>/);
  if (!found) fail(`${route}: no article`);
  return found[1];
}
const count = (text, pattern) => (text.match(pattern) ?? []).length;

function checkBuiltPages() {
  // check_math_built_pages
  const first = article(page('/1-proof'), '/1-proof');
  const second = article(page('/2-more'), '/2-more');
  for (const [route, html] of [
    ['/1-proof', first],
    ['/2-more', second],
  ]) {
    if (count(html, /<math\b/g) < 8)
      fail(`${route}: expected formulas, found ${count(html, /<math\b/g)}`);
    if (html.includes('language-math')) fail(`${route}: a formula's source was left in the page`);
    if (/<script\b/.test(html)) fail(`${route}: the chapter holds a script`);
    if (/<(?:semantics|annotation)\b/.test(html)) fail(`${route}: a formula holds its source`);
  }
  if (!first.includes('It costs $5 and then $10 for two things.')) {
    fail('/1-proof: the line about money is not as it was typed');
  }
  const mistake = `$${BACKSLASH}frac{a}{$`;
  if (!new RegExp('<code class="tome-math-error"[^>]*>[^<]*</code>').test(first)) {
    fail('/1-proof: the unreadable formula has no error element');
  }
  if (!first.includes(`>${mistake}</code>`)) {
    fail('/1-proof: the unreadable formula is not shown as typed');
  }
  // `$$\begin{aligned}` … `\end{aligned}$$`: one formula, and the sentence
  // after it a paragraph of its own.
  const after = first.indexOf('The sentence after it stands on its own.');
  if (after < 0) fail('/1-proof: the sentence after the derivation is gone');
  if (!/<p>The sentence after it stands on its own\.<\/p>/.test(first)) {
    fail('/1-proof: the sentence after the derivation is not a paragraph of its own');
  }
  const before = first.slice(first.indexOf('hard against its dollar signs'), after);
  if (count(before, /<math\b/g) !== 1) {
    fail(
      `/1-proof: the derivation hard against its dollar signs is ${count(before, /<math\b/g)} formulas`,
    );
  }
  if (before.includes(`${BACKSLASH}begin`) || before.includes('$$')) {
    fail('/1-proof: the derivation hard against its dollar signs was left as text');
  }
}

function checkBuildOutput(output) {
  // check_math_build_output: both streams, white space collapsed.
  const named = output
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, ' '))
    .filter((line) => line.includes('1-proof.md') && line.includes(`${BACKSLASH}frac{a}{`));
  if (named.length === 0) fail('the build did not name 1-proof.md and its unreadable formula');
}

function checkHeadingSlugs() {
  // check_math_heading_slugs
  const index = JSON.parse(readFileSync(join(dist, 'search-index.json'), 'utf8'));
  for (const route of ['/1-proof', '/2-more']) {
    const record = index.find((each) => each.url === route);
    if (!record) fail(`search index: no record for ${route}`);
    const html = article(page(route), route);
    const ids = [...html.matchAll(/<h[1-6]\b[^>]*\bid="([^"]+)"/g)].map((match) => match[1]);
    const slugs = record.headings.map((heading) => heading.slug);
    if (JSON.stringify(slugs) !== JSON.stringify(ids)) {
      fail(`${route}: the index has ${JSON.stringify(slugs)}, the page ${JSON.stringify(ids)}`);
    }
  }
  const second = index.find((each) => each.url === '/2-more');
  if (!second.headings.some((heading) => heading.slug === 'the-emc2-law')) {
    fail('/2-more: the heading that holds a formula is not slugged the-emc2-law');
  }
  const first = index.find((each) => each.url === '/1-proof').text;
  if (!first.includes('E=mc2')) fail('/1-proof: search does not hold E=mc2');
  const mistake = `$${BACKSLASH}frac{a}{$`;
  if (first.replaceAll(mistake, '').includes(`${BACKSLASH}frac`)) {
    fail('/1-proof: search holds a formula as LaTeX');
  }
  for (const command of ['sqrt', 'sum', 'begin']) {
    if (first.includes(`${BACKSLASH}${command}`))
      fail(`/1-proof: search holds ${BACKSLASH}${command}`);
  }
}

function checkRail() {
  // check_math_rail
  const html = page('/2-more');
  const entry = html.match(/<a[^>]*href="#the-emc2-law"[^>]*>([^<]*)<\/a>/)?.[1];
  if (entry?.trim() !== 'The E = mc² law') {
    fail(`/2-more: the rail's entry for the formula heading reads ${JSON.stringify(entry)}`);
  }
  const plain = html.match(/<a[^>]*href="#a-wide-formula"[^>]*>([^<]*)<\/a>/)?.[1];
  if (plain?.trim() !== 'A wide formula') {
    fail(`/2-more: the rail's entry for a plain heading reads ${JSON.stringify(plain)}`);
  }
}

try {
  await gate.withFixture(() => {
    console.log('check-math: building two pages of formulas …');
    const output = gate.buildWithOutput({ TOME_BOOK: proofs });
    checkBuiltPages();
    checkBuildOutput(output);
    checkHeadingSlugs();
    checkRail();
    console.log('check-math: OK — formulas built into the pages');

    console.log('check-math: laying the formulas out in Chromium and in WebKit …');
    gate.command('npx --no-install playwright test', { TOME_MATH_E2E: '1' });
    console.log('check-math: OK — formulas laid out in both engines');
  });

  console.log('check-math: all mathematics checks passed; rebuilding default …');
  await gate.rebuildDefault();
} catch (error) {
  console.error(`check-math: FAIL — ${errorMessage(error)}`);
  process.exitCode = 1;
}
