// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import {
  basename,
  dirname,
  isAbsolute,
  join,
  relative,
  resolve,
} from 'node:path';
import { createFixtureGate } from '../../../scripts/fixture-gate.mjs';

const projectRoot = process.cwd();
const loader = join(projectRoot, 'scripts', 'load-books.mjs');
const contentPath = 'src/content/books';
const libraryPath = 'src/content/library';
const samplePath = `${contentPath}/sample/README.md`;
const sample = '# Committed sample\n';
const tempParent = resolve(tmpdir());
const tempPrefix = 'tome-fixture-gate-';

function write(root: string, path: string, contents: string) {
  const target = join(root, path);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, contents);
}

function git(root: string, ...args: string[]) {
  return execFileSync(
    'git',
    [
      '-c',
      'core.autocrlf=false',
      '-c',
      'commit.gpgsign=false',
      '-c',
      'user.name=Fixture Gate Test',
      '-c',
      'user.email=fixture-gate@example.invalid',
      ...args,
    ],
    { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
  );
}

function status(root: string) {
  return git(
    root,
    'status',
    '--porcelain=v1',
    '--untracked-files=all',
    '--ignored=matching',
    '--',
    contentPath,
  );
}

/**
 * Remove a test directory, waiting out Windows' brief hold on it. Right after a
 * child shell exits (the gate's `npm run build`), Windows can keep its working
 * directory locked for a few hundred milliseconds; Node's `maxRetries` does not
 * cover that here, so retry lock errors explicitly for up to ~5 seconds.
 */
function removeWithRetry(path: string) {
  for (let attempt = 0; ; attempt++) {
    try {
      rmSync(path, { recursive: true, force: true });
      return;
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code ?? '';
      if (attempt >= 50 || !['EPERM', 'EBUSY', 'ENOTEMPTY'].includes(code))
        throw error;
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 100);
    }
  }
}

function makeBook(root: string, name: string) {
  const book = join(root, name);
  write(book, 'src/SUMMARY.md', '# Summary\n\n[Intro](README.md)\n');
  write(book, 'src/README.md', `# ${name}\n`);
  return book;
}

describe('fixture-gate.mjs — guarded fixture lifecycle', () => {
  let root: string;

  beforeEach(() => {
    root = mkdtempSync(join(tempParent, tempPrefix));
    write(root, samplePath, sample);
    write(root, '.gitignore', `${contentPath}/ignored/\n`);
    write(root, 'outside/sentinel.txt', 'outside must survive\n');
    git(root, 'init', '--quiet');
    git(root, 'add', '--', '.');
    git(root, 'commit', '--quiet', '-m', 'Commit fixture sample');
  });

  afterEach(() => {
    const target = resolve(root);
    const withinTemp = relative(tempParent, target);
    if (
      !withinTemp ||
      withinTemp.startsWith('..') ||
      isAbsolute(withinTemp) ||
      !basename(target).startsWith(tempPrefix)
    ) {
      throw new Error(
        `Refusing to remove unexpected test directory: ${target}`,
      );
    }
    removeWithRetry(target);
  });

  function expectRestored() {
    expect(readFileSync(join(root, samplePath), 'utf8')).toBe(sample);
    expect(status(root)).toBe('');
    expect(readFileSync(join(root, 'outside/sentinel.txt'), 'utf8')).toBe(
      'outside must survive\n',
    );
    expect(readFileSync(join(root, 'outside/generated.txt'), 'utf8')).toBe(
      'outside fixture residue must also survive\n',
    );
    expect(readdirSync(join(root, contentPath))).toEqual(['sample']);
  }

  function replaceContent() {
    write(root, samplePath, '# Fixture overwrote sample\n');
    write(root, `${contentPath}/generated/chapter.md`, '# Generated fixture\n');
    write(
      root,
      `${contentPath}/ignored/cache.txt`,
      'ignored fixture residue\n',
    );
    write(
      root,
      'outside/generated.txt',
      'outside fixture residue must also survive\n',
    );
  }

  it.each(['tracked', 'staged', 'untracked', 'ignored'] as const)(
    'test_fixture_gate_refuses_dirty_content: preserves %s changes before callback or cleanup',
    async (kind) => {
      const dirtyPath =
        kind === 'ignored'
          ? `${contentPath}/ignored/personal.txt`
          : kind === 'untracked'
            ? `${contentPath}/personal.txt`
            : samplePath;
      write(root, dirtyPath, 'personal content must survive\n');
      if (kind === 'staged') git(root, 'add', '--', dirtyPath);
      const originalStatus = status(root);
      const originalIndex = git(root, 'show', `:${samplePath}`);
      let ran = false;
      let stopped = false;

      await expect(
        createFixtureGate({ root }).withFixture(
          () => {
            ran = true;
          },
          {
            beforeRestore: () => {
              stopped = true;
            },
          },
        ),
      ).rejects.toThrow(
        /src[\\/]content[\\/]books.*(?:changes|pristine|dirty)/i,
      );

      expect(ran).toBe(false);
      expect(stopped).toBe(false);
      expect(status(root)).toBe(originalStatus);
      expect(readFileSync(join(root, dirtyPath), 'utf8')).toBe(
        'personal content must survive\n',
      );
      expect(git(root, 'show', `:${samplePath}`)).toBe(originalIndex);
      expect(readFileSync(join(root, 'outside/sentinel.txt'), 'utf8')).toBe(
        'outside must survive\n',
      );
    },
  );

  it('test_fixture_gate_restores_success: waits for async work and returns its result', async () => {
    const result = { verified: true };
    const actual = await createFixtureGate({ root }).withFixture(async () => {
      replaceContent();
      await Promise.resolve();
      expect(readFileSync(join(root, samplePath), 'utf8')).toContain('Fixture');
      return result;
    });

    expect(actual).toBe(result);
    expectRestored();
  });

  it.each(['sync', 'async'] as const)(
    'test_fixture_gate_restores_failure: preserves a %s action error and confines cleanup',
    async (kind) => {
      const actionError = new Error('fixture assertion failed');
      const action = () => {
        replaceContent();
        throw actionError;
      };

      await expect(
        createFixtureGate({ root }).withFixture(
          kind === 'sync' ? action : async () => action(),
        ),
      ).rejects.toBe(actionError);

      expectRestored();
    },
  );

  it('test_fixture_gate_stops_before_restore: awaits teardown while fixture content remains', async () => {
    const lifecycle: string[] = [];
    await createFixtureGate({ root }).withFixture(
      () => {
        replaceContent();
        lifecycle.push('action');
      },
      {
        beforeRestore: async () => {
          await Promise.resolve();
          expect(readFileSync(join(root, samplePath), 'utf8')).toContain(
            'Fixture',
          );
          expect(
            existsSync(join(root, contentPath, 'generated/chapter.md')),
          ).toBe(true);
          lifecycle.push('stopped');
        },
      },
    );

    expect(lifecycle).toEqual(['action', 'stopped']);
    expectRestored();
  });

  it.each([false, true])(
    'test_fixture_gate_preserves_content_when_stop_fails: action also fails = %s',
    async (failAction) => {
      const actionError = new Error('fixture assertion failed');
      const stopError = new Error('dev server could not be stopped');
      let failure: unknown;
      try {
        await createFixtureGate({ root }).withFixture(
          () => {
            replaceContent();
            if (failAction) throw actionError;
          },
          {
            beforeRestore: async () => {
              throw stopError;
            },
          },
        );
      } catch (error) {
        failure = error;
      }

      if (failAction) {
        expect(failure).toBeInstanceOf(AggregateError);
        expect((failure as AggregateError).errors).toEqual([
          actionError,
          stopError,
        ]);
        expect((failure as AggregateError).message).toContain(
          actionError.message,
        );
        expect((failure as AggregateError).message).toContain(
          stopError.message,
        );
      } else {
        expect(failure).toBe(stopError);
      }
      expect(readFileSync(join(root, samplePath), 'utf8')).toContain('Fixture');
      expect(existsSync(join(root, contentPath, 'generated/chapter.md'))).toBe(
        true,
      );
      expect(readFileSync(join(root, 'outside/sentinel.txt'), 'utf8')).toBe(
        'outside must survive\n',
      );
    },
  );

  it.each([false, true])(
    'test_fixture_gate_reports_cleanup_failure: action also fails = %s',
    async (failAction) => {
      const actionError = new Error('fixture assertion failed before cleanup');
      let failure: unknown;
      try {
        await createFixtureGate({ root }).withFixture(() => {
          replaceContent();
          write(
            root,
            '.git/index.lock',
            'hold lock to force restore failure\n',
          );
          if (failAction) throw actionError;
        });
      } catch (error) {
        failure = error;
      }

      expect(failure).toBeInstanceOf(Error);
      if (failAction) {
        expect(failure).toBeInstanceOf(AggregateError);
        const aggregate = failure as AggregateError;
        expect(aggregate.errors).toHaveLength(2);
        expect(aggregate.errors[0]).toBe(actionError);
        expect(aggregate.errors[1]).toBeInstanceOf(Error);
        expect(aggregate.message).toContain(actionError.message);
        expect(aggregate.message).toContain(aggregate.errors[1].message);
      }
      expect(readFileSync(join(root, 'outside/sentinel.txt'), 'utf8')).toBe(
        'outside must survive\n',
      );
    },
  );

  it('test_fixture_gate_isolates_environment: strips inherited aliases and fixes config/destination', () => {
    const inherited = {
      ...process.env,
      TOME_BOOK: 'caller-book',
      tome_books: 'caller-books',
      Tome_Config: 'caller-config',
      tome_book_dest: 'caller-destination',
      FIXTURE_SENTINEL: 'preserved',
    };
    const gate = createFixtureGate({ root, env: inherited });
    const isolated = gate.env();

    expect(gate.root).toBe(resolve(root));
    expect(isolated.TOME_CONFIG).toBe(
      join(projectRoot, 'fixtures', 'empty-library.toml'),
    );
    expect(isolated.TOME_BOOK_DEST).toBe(join(root, libraryPath));
    expect(isolated.FIXTURE_SENTINEL).toBe('preserved');
    expect(
      Object.keys(isolated).filter((name) =>
        /^(?:TOME_BOOK|TOME_BOOKS)$/i.test(name),
      ),
    ).toEqual([]);
    expect(
      Object.keys(isolated).filter((name) => /^TOME_CONFIG$/i.test(name)),
    ).toEqual(['TOME_CONFIG']);
    expect(
      Object.keys(isolated).filter((name) => /^TOME_BOOK_DEST$/i.test(name)),
    ).toEqual(['TOME_BOOK_DEST']);
    expect(inherited.TOME_BOOK).toBe('caller-book');
    expect(inherited.Tome_Config).toBe('caller-config');
    expect(gate.env({ TOME_BOOK: 'explicit-book' }).TOME_BOOK).toBe(
      'explicit-book',
    );
    expect(gate.env({ TOME_BOOKS: 'explicit-a,explicit-b' }).TOME_BOOKS).toBe(
      'explicit-a,explicit-b',
    );
    const redirected = gate.env({
      TOME_CONFIG: 'other-config',
      TOME_BOOK_DEST: 'other-destination',
    });
    expect(redirected.TOME_CONFIG).toBe(isolated.TOME_CONFIG);
    expect(redirected.TOME_BOOK_DEST).toBe(join(root, libraryPath));
  });

  it('test_fixture_gate_isolates_environment: real loader publishes explicit fixtures, else the sample, into the library', async () => {
    const caller = makeBook(root, 'caller-book');
    const fixture = makeBook(root, 'explicit-fixture');
    const second = makeBook(root, 'second-fixture');
    const outside = join(root, 'outside');
    write(
      root,
      'tome.config.toml',
      `[[book]]\npath = ${JSON.stringify(caller)}\n`,
    );
    const gate = createFixtureGate({
      root,
      env: {
        ...process.env,
        TOME_BOOK: caller,
        TOME_BOOKS: caller,
        TOME_CONFIG: join(root, 'tome.config.toml'),
        TOME_BOOK_DEST: outside,
      },
    });
    const load = (overrides: NodeJS.ProcessEnv = {}) =>
      execFileSync(process.execPath, [loader], {
        cwd: root,
        env: gate.env(overrides),
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      });

    for (const overrides of [
      { TOME_BOOK: fixture },
      { TOME_BOOKS: `${fixture},${second}` },
    ]) {
      await gate.withFixture(() => {
        load(overrides);
        expect(
          readFileSync(
            join(root, libraryPath, 'explicit-fixture/README.md'),
            'utf8',
          ),
        ).toBe('# explicit-fixture\n');
        expect(existsSync(join(root, libraryPath, 'caller-book'))).toBe(false);
        expect(existsSync(join(root, libraryPath, 'second-fixture'))).toBe(
          'TOME_BOOKS' in overrides,
        );
      });
      expect(readFileSync(join(root, samplePath), 'utf8')).toBe(sample);
      expect(status(root)).toBe('');
    }

    expect(load()).toContain('using the bundled sample');
    expect(
      readFileSync(join(root, libraryPath, 'sample/README.md'), 'utf8'),
    ).toBe(sample);
    expect(existsSync(join(root, libraryPath, 'explicit-fixture'))).toBe(false);
    expect(readFileSync(join(root, samplePath), 'utf8')).toBe(sample);
    expect(status(root)).toBe('');
    expect(readdirSync(outside)).toEqual(['sentinel.txt']);
    expect(readFileSync(join(outside, 'sentinel.txt'), 'utf8')).toBe(
      'outside must survive\n',
    );
  });

  it('test_fixture_gate_reports_command_failure: a failed child command rejects and restores', async () => {
    write(root, 'fail.mjs', 'process.exit(23);\n');
    const gate = createFixtureGate({ root });

    await expect(
      gate.withFixture(() => {
        replaceContent();
        gate.command('node fail.mjs');
      }),
    ).rejects.toMatchObject({ status: 23 });

    expectRestored();
  });

  it('test_fixture_gate_isolates_environment: rebuildDefault invokes the real loader with the sample', async () => {
    const caller = makeBook(root, 'caller-book');
    write(
      root,
      'tome.config.toml',
      `[[book]]\npath = ${JSON.stringify(caller)}\n`,
    );
    write(
      root,
      'package.json',
      JSON.stringify({ scripts: { build: 'node build.mjs' } }),
    );
    write(
      root,
      'build.mjs',
      `import { execFileSync } from 'node:child_process';\n` +
        `import { readFileSync, writeFileSync } from 'node:fs';\n` +
        `execFileSync(process.execPath, [${JSON.stringify(loader)}], { stdio: 'pipe' });\n` +
        `writeFileSync('build-evidence.txt', readFileSync(${JSON.stringify(samplePath)}));\n`,
    );
    const gate = createFixtureGate({
      root,
      env: {
        ...process.env,
        TOME_BOOKS: caller,
        TOME_CONFIG: join(root, 'tome.config.toml'),
        TOME_BOOK_DEST: join(root, 'outside'),
      },
    });

    await gate.rebuildDefault();

    expect(readFileSync(join(root, 'build-evidence.txt'), 'utf8')).toBe(sample);
    expect(status(root)).toBe('');
    expect(readdirSync(join(root, 'outside'))).toEqual(['sentinel.txt']);
  });

  it('test_fixture_gate_reports_build_failure: a failed default build rejects and restores', async () => {
    write(
      root,
      'package.json',
      JSON.stringify({ scripts: { build: 'node build.mjs' } }),
    );
    write(
      root,
      'build.mjs',
      `import { writeFileSync } from 'node:fs';\n` +
        `writeFileSync(${JSON.stringify(samplePath)}, '# Failed build wrote content\\n');\n` +
        `writeFileSync('${contentPath}/residue.txt', 'build residue');\n` +
        `process.exit(29);\n`,
    );

    await expect(
      createFixtureGate({ root }).rebuildDefault(),
    ).rejects.toMatchObject({
      status: 29,
    });

    expect(readFileSync(join(root, samplePath), 'utf8')).toBe(sample);
    expect(status(root)).toBe('');
    expect(readdirSync(join(root, contentPath))).toEqual(['sample']);
    expect(readFileSync(join(root, 'outside/sentinel.txt'), 'utf8')).toBe(
      'outside must survive\n',
    );
  });
});
