// End-to-end live-reload gate (local; a dev-server + timing check, not CI).
// Copies fixtures/handbook into a temp MUTABLE book, runs `astro dev` against it,
// confirms the reader serves the original chapter, edits the source on disk, and
// polls until the reader reflects the edit — proving live reload without a
// restart. The handbook chapter references a parent-relative image, so the gate
// also confirms that image still resolves after the edit (INT-0009: the synced
// chapter is re-rewritten to the tome-private staged asset, not the broken
// `../assets/…`). Cleanup verifies that this gate's dev process stopped before
// restoring content or removing the temp book. An uncertain stop retains both.
import {
  cpSync,
  rmSync,
  mkdtempSync,
  readFileSync,
  writeFileSync,
  realpathSync,
  lstatSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join } from 'node:path';
import process from 'node:process';
import { createFixtureGate, errorMessage } from './fixture-gate.mjs';

const root = process.cwd();
const gate = createFixtureGate({ root });
const MARKER = 'LIVE RELOAD CONFIRMED';
// The handbook fixture's first.md references a parent-relative image
// (`../assets/parent-plate.svg`). After a live edit, the synced chapter must be
// re-rewritten to the tome-private staged asset (INT-0009), or Astro throws
// ImageNotFound. These two literals appear together only in the *rewritten* src.
const PARENT_DIR = '__tome_parent_assets__';
const PARENT_ASSET = 'parent-plate.svg';

async function getText(url) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5_000) });
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

function readDevServer() {
  let lock;
  try {
    lock = JSON.parse(readFileSync(join(root, '.astro', 'dev.json'), 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') return;
    throw new Error(`cannot read the Astro dev lock: ${errorMessage(error)}`);
  }
  if (
    !lock ||
    !Number.isInteger(lock.pid) ||
    lock.pid <= 0 ||
    typeof lock.url !== 'string' ||
    typeof lock.startedAt !== 'string'
  ) {
    throw new Error('the Astro dev lock does not identify a valid server');
  }
  const url = new URL(lock.url);
  if (
    url.protocol !== 'http:' ||
    !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
  ) {
    throw new Error('the Astro dev lock must identify a local HTTP server');
  }
  return lock;
}

function isAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    if (error.code === 'ESRCH') return false;
    throw error;
  }
}

function sameServer(left, right) {
  return left?.pid === right?.pid && left?.startedAt === right?.startedAt;
}

async function main() {
  // Astro background start can reuse an existing server. Refuse it before
  // entering the fixture lifecycle so we never restore beneath another watcher.
  const existing = readDevServer();
  if (existing && isAlive(existing.pid)) {
    throw new Error(
      `a dev server is already running (pid ${existing.pid}); stop it before this check`,
    );
  }

  const tempBase = realpathSync(tmpdir());
  let tmp;
  let startAttempted = false;
  let ownedServer;
  let safeToRemoveTemp = false;
  let failed = false;
  let failure;

  const stopBeforeRestore = async () => {
    if (!startAttempted) {
      safeToRemoveTemp = true;
      return;
    }
    const current = readDevServer();
    // A failed startup can still have created its lock. A stale pre-run lock
    // does not prove that the attempted startup left no process behind.
    if (!ownedServer && current && !sameServer(current, existing)) {
      ownedServer = current;
    }
    if (!ownedServer) {
      throw new Error(
        'cannot identify the started dev process; refusing content restoration',
      );
    }
    if (current && !sameServer(current, ownedServer)) {
      throw new Error(
        'the dev lock changed owners; refusing to stop another server or restore content',
      );
    }
    if (isAlive(ownedServer.pid)) {
      if (!current) {
        throw new Error(
          'the owned dev process is still alive without its lock; refusing content restoration',
        );
      }
      gate.command('npx --no-install astro dev stop');
    }
    if (!(await pollUntil(() => !isAlive(ownedServer.pid), 5_000, 100))) {
      throw new Error(
        `dev process ${ownedServer.pid} did not stop; refusing content restoration`,
      );
    }
    safeToRemoveTemp = true;
  };

  try {
    await gate.withFixture(
      async () => {
        tmp = mkdtempSync(join(tempBase, 'tome-lr-'));
        const book = join(tmp, 'book');
        cpSync(join(root, 'fixtures', 'handbook'), book, { recursive: true });

        console.log(
          'check-live-reload: starting `astro dev` against the temp book …',
        );
        startAttempted = true;
        gate.command('npm run dev -- --background --host 127.0.0.1', {
          TOME_BOOK: book,
        });
        const started = readDevServer();
        if (!started || sameServer(started, existing)) {
          throw new Error(
            'Astro did not create a live server owned by this check',
          );
        }
        ownedServer = started;
        if (!isAlive(ownedServer.pid)) {
          throw new Error('the started Astro dev process already exited');
        }
        const url = new URL('/first', ownedServer.url).href;

        if (
          !(await pollUntil(
            async () => (await getText(url)).includes('First Chapter'),
            60_000,
          ))
        ) {
          throw new Error(
            'the reader never served the original chapter (dev did not come up)',
          );
        }
        console.log(
          'check-live-reload: original chapter served; editing the source on disk …',
        );

        const chapter = join(book, 'src', 'first.md');
        writeFileSync(
          chapter,
          readFileSync(chapter, 'utf8').replace(
            '# First Chapter',
            `# ${MARKER}`,
          ),
        );

        if (
          !(await pollUntil(
            async () => (await getText(url)).includes(MARKER),
            25_000,
          ))
        ) {
          throw new Error(
            'the edit did not appear in the reader within the timeout',
          );
        }

        // INT-0009: the parent-relative image still resolves — the synced chapter was
        // re-rewritten to the tome-private staged asset, not the broken `../assets/…`.
        const served = await getText(url);
        if (!(served.includes(PARENT_DIR) && served.includes(PARENT_ASSET))) {
          throw new Error(
            'the parent-relative image did not resolve after the live edit ' +
              `(no ${PARENT_DIR}/…/${PARENT_ASSET} in the served page)`,
          );
        }

        console.log(
          'check-live-reload: OK — the live edit appeared and the parent image resolved, no restart.',
        );
      },
      { beforeRestore: stopBeforeRestore },
    );
  } catch (error) {
    failed = true;
    failure = error;
  }

  if (tmp && safeToRemoveTemp) {
    try {
      const resolved = realpathSync(tmp);
      if (
        dirname(resolved) !== tempBase ||
        !basename(resolved).startsWith('tome-lr-') ||
        lstatSync(tmp).isSymbolicLink()
      ) {
        throw new Error(
          `refusing to remove an unexpected temporary path: ${tmp}`,
        );
      }
      rmSync(resolved, { recursive: true, force: true });
    } catch (error) {
      if (failed) {
        failure = new AggregateError(
          [failure, error],
          `${errorMessage(failure)}; temporary-book cleanup failed (${errorMessage(error)})`,
        );
      } else {
        failed = true;
        failure = error;
      }
    }
  } else if (tmp) {
    console.error(
      `check-live-reload: retaining content and temporary book at ${tmp} because shutdown was not confirmed`,
    );
  }
  if (failed) throw failure;
}

try {
  await main();
} catch (error) {
  console.error(`check-live-reload: FAIL — ${errorMessage(error)}`);
  process.exitCode = 1;
}
