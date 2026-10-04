// Shared lifecycle for checks that temporarily replace the content library.
// A dirty preflight must never enter cleanup: restoring HEAD would erase the
// local changes that caused the refusal. Checks run serially on clean content.
import { execFileSync, execSync } from 'node:child_process';
import { existsSync, lstatSync, realpathSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// The committed sample, guarded and strictly restored. Fixtures themselves are
// published into the generated, git-ignored library.
const BOOK_DIR = 'src/content/books';
const LIBRARY_DIR = 'src/content/library';
const EMPTY_CONFIG = fileURLToPath(
  new URL('../fixtures/empty-library.toml', import.meta.url),
);
const LOADER_INPUTS = new Set([
  'TOME_BOOK',
  'TOME_BOOKS',
  'TOME_CONFIG',
  'TOME_BOOK_DEST',
]);

/** @param {unknown} error */
export function errorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}

/**
 * @param {{ root?: string, env?: NodeJS.ProcessEnv }} options
 */
export function createFixtureGate({
  root = process.cwd(),
  env = process.env,
} = {}) {
  root = resolve(root);

  /** Explicit book selection wins; config and destination remain gate-owned.
   * @param {NodeJS.ProcessEnv} overrides
   * @returns {NodeJS.ProcessEnv}
   */
  function environment(overrides = {}) {
    const clean = Object.fromEntries(
      Object.entries(env).filter(
        ([key]) => !LOADER_INPUTS.has(key.toUpperCase()),
      ),
    );
    return {
      ...clean,
      ...overrides,
      TOME_CONFIG: EMPTY_CONFIG,
      TOME_BOOK_DEST: join(root, LIBRARY_DIR),
    };
  }

  /** @param {string[]} args */
  function git(args) {
    return execFileSync('git', args, {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    });
  }

  // Refuse a cwd inside another repository and symlink/junction ancestors.
  // Both restore and clean operate only on this fixed, contained library path.
  function requireContainedContent() {
    const top = git(['rev-parse', '--show-toplevel']).trim();
    if (realpathSync(top) !== realpathSync(root)) {
      throw new Error('fixture checks must run at the repository root');
    }
    let target = root;
    for (const segment of BOOK_DIR.split('/')) {
      target = join(target, segment);
      if (existsSync(target) && lstatSync(target).isSymbolicLink()) {
        throw new Error(
          `fixture content path must not traverse a symlink: ${target}`,
        );
      }
    }
  }

  function contentStatus() {
    return git([
      'status',
      '--porcelain=v1',
      '--untracked-files=all',
      '--ignored=matching',
      '--',
      BOOK_DIR,
    ]).trim();
  }

  function requirePristineContent() {
    requireContainedContent();
    const status = contentStatus();
    if (status) {
      throw new Error(
        `${BOOK_DIR} has local tracked, staged, untracked, or ignored changes; refusing destructive fixture sync:\n${status}`,
      );
    }
  }

  function restoreContent() {
    requireContainedContent();
    git(['restore', '--source=HEAD', '--worktree', '--', BOOK_DIR]);
    git(['clean', '-fdqx', '--', BOOK_DIR]);
    const status = contentStatus();
    if (status) throw new Error(`content restoration left residue:\n${status}`);
  }

  /** Runs only fixed tooling commands; put book paths in env, never in command text.
   * @param {string} command
   * @param {NodeJS.ProcessEnv} overrides
   */
  function runCommand(command, overrides = {}) {
    execSync(command, {
      cwd: root,
      stdio: 'inherit',
      env: environment(overrides),
      windowsHide: true,
    });
  }

  /** @param {NodeJS.ProcessEnv} overrides */
  function build(overrides = {}) {
    runCommand('npm run build', overrides);
  }

  /** @template T
   * @param {() => T | Promise<T>} action
   * @param {{ beforeRestore?: () => void | Promise<void> }} lifecycle
   * @returns {Promise<T>}
   */
  async function withFixture(action, { beforeRestore } = {}) {
    requirePristineContent();
    let failed = false;
    /** @type {unknown} */
    let actionError;
    /** @type {T} */
    let result;
    try {
      result = await action();
    } catch (error) {
      failed = true;
      actionError = error;
    }

    try {
      // A live watcher must be stopped before touching its destination. If the
      // caller cannot establish that, surface the cleanup failure and leave the
      // fixture in place instead of racing a still-running server.
      await beforeRestore?.();
      restoreContent();
    } catch (restoreError) {
      if (failed) {
        throw new AggregateError(
          [actionError, restoreError],
          `fixture failed (${errorMessage(actionError)}) and content restoration failed (${errorMessage(restoreError)})`,
        );
      }
      throw restoreError;
    }
    if (failed) throw actionError;
    return result;
  }

  // The final default build is guarded too: it must not read the user's manifest
  // or hide a build failure, and any generated content is restored before exit.
  function rebuildDefault() {
    return withFixture(() => build());
  }

  return {
    root,
    env: environment,
    command: runCommand,
    build,
    withFixture,
    rebuildDefault,
  };
}
