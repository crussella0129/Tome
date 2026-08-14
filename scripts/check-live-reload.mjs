// End-to-end live-reload gate (local; a dev-server + timing check, not CI).
// Copies fixtures/handbook into a temp MUTABLE book, runs `astro dev` against it,
// confirms the reader serves the original chapter, edits the source on disk, and
// polls until the reader reflects the edit — proving live reload without a
// restart. The handbook chapter references a parent-relative image, so the gate
// also confirms that image still resolves after the edit (INT-0009: the synced
// chapter is re-rewritten to the tome-private staged asset, not the broken
// `../assets/…`). A `finally` block always stops dev, restores src/content/books
// to HEAD (predev overwrote it), and removes the temp book.
import { execSync } from 'node:child_process';
import { cpSync, rmSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import process from 'node:process';

const root = process.cwd();
const BOOK_DIR = 'src/content/books';
const URL = 'http://localhost:4321/first';
const MARKER = 'LIVE RELOAD CONFIRMED';
// The handbook fixture's first.md references a parent-relative image
// (`../assets/parent-plate.svg`). After a live edit, the synced chapter must be
// re-rewritten to the tome-private staged asset (INT-0009), or Astro throws
// ImageNotFound. These two literals appear together only in the *rewritten* src.
const PARENT_DIR = '__tome_parent_assets__';
const PARENT_ASSET = 'parent-plate.svg';

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

    // INT-0009: the parent-relative image still resolves — the synced chapter was
    // re-rewritten to the tome-private staged asset, not the broken `../assets/…`.
    const served = await getText(URL);
    if (!(served.includes(PARENT_DIR) && served.includes(PARENT_ASSET))) {
      throw new Error(
        'the parent-relative image did not resolve after the live edit ' +
          `(no ${PARENT_DIR}/…/${PARENT_ASSET} in the served page)`,
      );
    }

    console.log(
      'check-live-reload: OK — the live edit appeared and the parent image resolved, no restart.',
    );
    return 0;
  } catch (err) {
    console.error(`check-live-reload: FAIL — ${err instanceof Error ? err.message : err}`);
    return 1;
  } finally {
    cleanup();
  }
}

main().then((code) => process.exit(code));
