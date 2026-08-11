// End-to-end live-reload gate (local; a dev-server + timing check, not CI).
// Copies fixtures/handbook into a temp MUTABLE book, runs `astro dev` against it,
// confirms the reader serves the original chapter, edits the source on disk, and
// polls until the reader reflects the edit — proving live reload without a
// restart. A `finally` block always stops dev, restores src/content/book to HEAD
// (predev overwrote it), and removes the temp book.
import { execSync } from 'node:child_process';
import { cpSync, rmSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import process from 'node:process';

const root = process.cwd();
const BOOK_DIR = 'src/content/book';
const URL = 'http://localhost:4321/first';
const MARKER = 'LIVE RELOAD CONFIRMED';

async function getText(url) {
  try {
    const res = await fetch(url);
    return await res.text();
  } catch {
    return '';
  }
}

async function pollUntil(predicate, timeoutMs, intervalMs = 500) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await predicate()) return true;
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  return false;
}

async function main() {
  const tmp = mkdtempSync(join(tmpdir(), 'tome-lr-'));
  const book = join(tmp, 'book');
  const cleanup = () => {
    try {
      execSync('npx astro dev stop', { cwd: root, stdio: 'ignore' });
    } catch {
      /* not running */
    }
    try {
      execSync(`git checkout -- ${BOOK_DIR}`, { cwd: root, stdio: 'ignore' });
      execSync(`git clean -fdq ${BOOK_DIR}`, { cwd: root, stdio: 'ignore' });
    } catch {
      /* best effort */
    }
    rmSync(tmp, { recursive: true, force: true });
  };

  try {
    cpSync(join(root, 'fixtures', 'handbook'), book, { recursive: true });

    console.log('check-live-reload: starting `astro dev` against the temp book …');
    execSync('npm run dev', { cwd: root, stdio: 'inherit', env: { ...process.env, TOME_BOOK: book } });

    if (!(await pollUntil(async () => (await getText(URL)).includes('First Chapter'), 60_000))) {
      throw new Error('the reader never served the original chapter (dev did not come up)');
    }
    console.log('check-live-reload: original chapter served; editing the source on disk …');

    const chapter = join(book, 'src', 'first.md');
    writeFileSync(chapter, readFileSync(chapter, 'utf8').replace('# First Chapter', `# ${MARKER}`));

    if (!(await pollUntil(async () => (await getText(URL)).includes(MARKER), 25_000))) {
      throw new Error('the edit did not appear in the reader within the timeout');
    }

    console.log('check-live-reload: OK — the live edit appeared in the reader with no restart.');
    return 0;
  } catch (err) {
    console.error(`check-live-reload: FAIL — ${err instanceof Error ? err.message : err}`);
    return 1;
  } finally {
    cleanup();
  }
}

main().then((code) => process.exit(code));
