// Sprint 24 evidence: repeat what scripts/check-live-reload.mjs does on a temp copy
// of the handbook, and say whether the watcher saw each edit (it reads the dev
// server log). Always stops the server it started. Not part of the test suite.
// Usage: node live-reload-repeat.mjs <project-root> <temp-parent> <runs>
import { execFileSync } from 'node:child_process';
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const [root, tempParent, runs = '4'] = process.argv.slice(2);
const strip = (s) => s.replace(/\x1b\[[0-9;]*m/g, '');
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const get = async (url) => {
  try {
    return await (await fetch(url, { signal: AbortSignal.timeout(5_000) })).text();
  } catch {
    return '';
  }
};

for (let run = 1; run <= Number(runs); run++) {
  const book = join(mkdtempSync(join(tempParent, 'lr-')), 'book');
  cpSync(join(root, 'fixtures', 'handbook'), book, { recursive: true });
  const env = { ...process.env, TOME_BOOK: book, ASTRO_TELEMETRY_DISABLED: '1' };
  delete env.TOME_BOOKS;
  delete env.TOME_CONFIG;
  delete env.TOME_BOOK_DEST;
  const astro = (...args) =>
    execFileSync(process.execPath, [join('node_modules', 'astro', 'bin', 'astro.mjs'), ...args], {
      cwd: root,
      env,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  execFileSync(process.execPath, ['scripts/load-books.mjs'], { cwd: root, env, stdio: 'ignore' });
  astro('dev', '--background', '--host', '127.0.0.1');
  try {
    const url = 'http://127.0.0.1:4321/first';
    let up = false;
    for (let i = 0; i < 120 && !up; i++) {
      up = (await get(url)).includes('First Chapter');
      if (!up) await sleep(500);
    }
    const t0 = Date.now();
    const chapter = join(book, 'src', 'first.md');
    writeFileSync(chapter, readFileSync(chapter, 'utf8').replace('# First Chapter', '# MARKER SEEN'));
    let seenAt = null;
    while (Date.now() - t0 < 25_000 && seenAt === null) {
      if ((await get(url)).includes('MARKER SEEN')) seenAt = Date.now() - t0;
      else await sleep(500);
    }
    const log = strip(astro('dev', 'logs'));
    const watching = log.match(/live reload watching/) ? 'yes' : 'NO';
    const synced = (log.match(/synced /g) ?? []).length;
    const notice = /live reload (?:is off|disabled)/.test(log) ? log.match(/live reload (?:is off|disabled)[^"]*/)[0] : '';
    console.log(
      `run ${run}: up=${up} edit ${seenAt === null ? 'NOT SEEN in 25s' : `seen after ${seenAt} ms`}; watching=${watching}; synced lines=${synced} ${notice}`,
    );
  } finally {
    astro('dev', 'stop');
    await sleep(1500);
    rmSync(join(book, '..'), { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
  }
}
