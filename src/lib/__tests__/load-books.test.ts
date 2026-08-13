import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execFileSync } from 'node:child_process';
import {
  mkdtempSync,
  mkdirSync,
  rmSync,
  writeFileSync,
  readFileSync,
  existsSync,
  readdirSync,
  symlinkSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, basename } from 'node:path';
import { userInfo } from 'node:os';
import { slugify } from '../../../scripts/book-source.mjs';
import { resolveOwner } from '../../../scripts/library-config.mjs';
import { PARENT_ASSET_DIR } from '../../../scripts/parent-assets.mjs';

const root = process.cwd();
const script = join(root, 'scripts', 'load-books.mjs');
const fixture = join(root, 'fixtures', 'handbook');

// load-books writes into the library at `<dest>/<slug>/`. A single external book
// is the sole tome there; the slug derives from the book root's directory name.
function bookDir(dest: string, bookRoot: string): string {
  return join(dest, slugify(basename(bookRoot)));
}

// A clean env with the loader's inputs stripped, so tests are hermetic.
function env(overrides: Record<string, string> = {}): NodeJS.ProcessEnv {
  const e = { ...process.env };
  delete e.TOME_BOOK;
  delete e.TOME_BOOKS;
  delete e.TOME_CONFIG;
  delete e.TOME_BOOK_DEST;
  return { ...e, ...overrides };
}

function run(
  dest: string,
  overrides: Record<string, string> = {},
  args: string[] = [],
) {
  execFileSync('node', [script, '--dest', dest, ...args], {
    cwd: root,
    env: env(overrides),
    encoding: 'utf8',
  });
}

function runExpectError(
  dest: string,
  overrides: Record<string, string> = {},
  args: string[] = [],
): { code: number; stderr: string } {
  try {
    execFileSync('node', [script, '--dest', dest, ...args], {
      cwd: root,
      env: env(overrides),
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch (e) {
    const err = e as { status?: number; stderr?: string };
    return { code: err.status ?? 1, stderr: String(err.stderr ?? '') };
  }
  return { code: 0, stderr: '' };
}

function makeBook(bookRoot: string, files: Record<string, string>): string {
  for (const [rel, content] of Object.entries(files)) {
    const full = join(bookRoot, rel);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, content);
  }
  return bookRoot;
}

function stageResidue(dest: string): string[] {
  const parent = dirname(dest);
  if (!existsSync(parent)) return [];
  const prefix = `.${basename(dest)}.stage-`;
  return readdirSync(parent).filter((name) => name.startsWith(prefix));
}

describe('load-books.mjs — single external book (TOME_BOOK)', () => {
  let tmp: string;
  beforeAll(() => {
    tmp = mkdtempSync(join(tmpdir(), 'tome-loadbooks-'));
  });
  afterAll(() => {
    rmSync(tmp, { recursive: true, force: true });
  });

  // A single external book populates the sole library tome dir.
  it('test_load_book_external: copies TOME_BOOK src and writes the book.toml title', () => {
    const dest = join(tmp, 'ext');
    run(dest, { TOME_BOOK: fixture });
    const out = bookDir(dest, fixture);
    expect(existsSync(join(out, 'SUMMARY.md'))).toBe(true);
    expect(existsSync(join(out, 'first.md'))).toBe(true);
    expect(existsSync(join(out, 'section', 'nested.md'))).toBe(true);
    const meta = JSON.parse(readFileSync(join(out, 'book.meta.json'), 'utf8'));
    expect(meta.title).toBe('The Sacred Handbook');
  });

  // No-op when no env and no manifest: the destination is left untouched.
  it('test_load_books_noop_when_unset: leaves the destination untouched', () => {
    const dest = join(tmp, 'noop');
    mkdirSync(dest, { recursive: true });
    writeFileSync(join(dest, 'sentinel.txt'), 'keep');
    run(dest, {}, ['--config', join(tmp, 'no-such-config.toml')]);
    expect(existsSync(join(dest, 'sentinel.txt'))).toBe(true);
    expect(existsSync(join(dest, 'book.meta.json'))).toBe(false);
  });

  // Clear error + non-zero exit on an invalid book.
  it('test_load_books_errors_on_invalid: fails clearly when src/SUMMARY.md is missing', () => {
    const { code, stderr } = runExpectError(join(tmp, 'bad'), {
      TOME_BOOK: join(tmp, 'does-not-exist'),
    });
    expect(code).not.toBe(0);
    expect(stderr).toMatch(/SUMMARY\.md/);
  });
});

// Source + title auto-detection (INT-0004 parity, now via load-books).
describe('load-books.mjs — source detection', () => {
  let tmp: string;
  beforeAll(() => {
    tmp = mkdtempSync(join(tmpdir(), 'tome-detect-'));
  });
  afterAll(() => {
    rmSync(tmp, { recursive: true, force: true });
  });

  it('test_source_detect_docs: no book.toml → detects docs/', () => {
    const book = makeBook(join(tmp, 'docsbook'), {
      'docs/SUMMARY.md': '# Summary\n\n[Intro](README.md)\n',
      'docs/README.md': '# Intro\n',
    });
    const dest = join(tmp, 'out-docs');
    run(dest, { TOME_BOOK: book });
    const out = bookDir(dest, book);
    expect(existsSync(join(out, 'SUMMARY.md'))).toBe(true);
    expect(existsSync(join(out, 'README.md'))).toBe(true);
  });

  it('test_source_honor_book_toml_src: a declared src wins over src/ and docs/', () => {
    const book = makeBook(join(tmp, 'declared'), {
      'book.toml': '[book]\nsrc = "guide"\n',
      'guide/SUMMARY.md': '# Summary\n\n[G](g.md)\n',
      'guide/g.md': '# G\n',
      'src/SUMMARY.md': '# Summary\n\n[wrong](wrong.md)\n',
      'docs/SUMMARY.md': '# Summary\n\n[wrong](wrong.md)\n',
    });
    const dest = join(tmp, 'out-declared');
    run(dest, { TOME_BOOK: book });
    const out = bookDir(dest, book);
    expect(existsSync(join(out, 'g.md'))).toBe(true); // from guide/
    expect(existsSync(join(out, 'wrong.md'))).toBe(false); // not src/ or docs/
  });

  it('test_source_declared_missing_errors: a declared src without SUMMARY errors', () => {
    const book = makeBook(join(tmp, 'declared-missing'), {
      'book.toml': '[book]\nsrc = "guide"\n',
      'guide/intro.md': '# no summary here\n',
      'docs/SUMMARY.md': '# Summary\n',
    });
    const { code, stderr } = runExpectError(join(tmp, 'out-declared-missing'), {
      TOME_BOOK: book,
    });
    expect(code).not.toBe(0);
    expect(stderr).toMatch(/declares src="guide"/);
  });

  it('test_title_from_dirname: title falls back to the book root directory name', () => {
    const book = makeBook(join(tmp, 'MyBook'), {
      'docs/SUMMARY.md': '# Summary\n\n[x](x.md)\n',
      'docs/x.md': '# x\n',
    });
    const dest = join(tmp, 'out-title');
    run(dest, { TOME_BOOK: book });
    const meta = JSON.parse(
      readFileSync(join(bookDir(dest, book), 'book.meta.json'), 'utf8'),
    );
    expect(meta.title).toBe('MyBook');
  });

  it('test_source_none_errors: no SUMMARY in src/docs/root → enumerated error', () => {
    const book = makeBook(join(tmp, 'empty'), { 'README.md': '# nothing\n' });
    const { code, stderr } = runExpectError(join(tmp, 'out-none'), {
      TOME_BOOK: book,
    });
    expect(code).not.toBe(0);
    expect(stderr).toMatch(/Tried:/);
    expect(stderr).toMatch(/src[\\/]SUMMARY\.md/);
    expect(stderr).toMatch(/docs[\\/]SUMMARY\.md/);
  });
});

// T-020 — the multi-book manifest + env precedence + multi-copy/dedup.
describe('load-books.mjs — manifest, precedence, and multi-copy', () => {
  let tmp: string;
  let alpha: string;
  let beta: string;
  let gamma: string;
  let config: string;
  beforeAll(() => {
    tmp = mkdtempSync(join(tmpdir(), 'tome-multi-'));
    alpha = makeBook(join(tmp, 'alpha'), {
      'src/SUMMARY.md': '# Alpha\n\n[Intro](README.md)\n',
      'src/README.md': '# Alpha intro\n',
    });
    beta = makeBook(join(tmp, 'beta'), {
      'docs/SUMMARY.md': '# Beta\n\n[Intro](README.md)\n',
      'docs/README.md': '# Beta intro\n',
    });
    gamma = makeBook(join(tmp, 'gamma'), {
      'docs/SUMMARY.md': '# Gamma\n\n[Intro](README.md)\n',
      'docs/README.md': '# Gamma intro\n',
    });
    // A manifest pointing only at gamma (used to prove env wins over the toml).
    config = join(tmp, 'tome.config.toml');
    writeFileSync(config, `[[book]]\npath = ${JSON.stringify(gamma)}\n`);
  });
  afterAll(() => {
    rmSync(tmp, { recursive: true, force: true });
  });

  // T-020 clause 1: env wins over the manifest; the manifest is used when env is
  // unset; both unset → no-op.
  it('test_load_books_precedence: TOME_BOOKS overrides the manifest', () => {
    const dest = join(tmp, 'out-env-wins');
    run(dest, { TOME_BOOKS: `${alpha},${beta}` }, ['--config', config]);
    expect(existsSync(join(dest, 'alpha', 'SUMMARY.md'))).toBe(true);
    expect(existsSync(join(dest, 'beta', 'SUMMARY.md'))).toBe(true);
    expect(existsSync(join(dest, 'gamma'))).toBe(false); // manifest ignored
  });

  it('test_load_books_precedence: the manifest is used when env is unset', () => {
    const dest = join(tmp, 'out-toml');
    run(dest, {}, ['--config', config]);
    expect(existsSync(join(dest, 'gamma', 'SUMMARY.md'))).toBe(true);
    expect(existsSync(join(dest, 'alpha'))).toBe(false);
  });

  it('test_load_books_precedence: no env and no manifest is a no-op', () => {
    const dest = join(tmp, 'out-noop');
    mkdirSync(dest, { recursive: true });
    writeFileSync(join(dest, 'sentinel.txt'), 'keep');
    run(dest, {}, ['--config', join(tmp, 'absent.toml')]);
    expect(existsSync(join(dest, 'sentinel.txt'))).toBe(true);
  });

  // T-020 clause 2: several books each land in books/<slug>/ (deduped) + meta.
  it('test_load_books_multi_copy: two books populate deduped slug dirs with meta', () => {
    const dest = join(tmp, 'out-multi');
    run(dest, { TOME_BOOKS: `${alpha},${beta}` });
    for (const slug of ['alpha', 'beta']) {
      expect(existsSync(join(dest, slug, 'SUMMARY.md'))).toBe(true);
      const meta = JSON.parse(
        readFileSync(join(dest, slug, 'book.meta.json'), 'utf8'),
      );
      expect(typeof meta.title === 'string' || meta.title === null).toBe(true);
    }
  });

  it('test_load_books_multi_copy: colliding slugs are de-duplicated deterministically', () => {
    // Two different book roots that slugify to the same base ("guide").
    const g1 = makeBook(join(tmp, 'p1', 'guide'), {
      'src/SUMMARY.md': '# G1\n\n[Intro](README.md)\n',
      'src/README.md': '# g1\n',
    });
    const g2 = makeBook(join(tmp, 'p2', 'guide'), {
      'src/SUMMARY.md': '# G2\n\n[Intro](README.md)\n',
      'src/README.md': '# g2\n',
    });
    const dest = join(tmp, 'out-dedupe');
    run(dest, { TOME_BOOKS: `${g1},${g2}` });
    expect(existsSync(join(dest, 'guide', 'SUMMARY.md'))).toBe(true);
    expect(existsSync(join(dest, 'guide-2', 'SUMMARY.md'))).toBe(true);
  });

  it('test_load_books_multi_copy: an invalid book in the set errors before writing', () => {
    const dest = join(tmp, 'out-invalid');
    const { code, stderr } = runExpectError(dest, {
      TOME_BOOKS: `${alpha},${join(tmp, 'nope')}`,
    });
    expect(code).not.toBe(0);
    expect(stderr).toMatch(/SUMMARY\.md/);
    expect(existsSync(dest)).toBe(false); // resolve-all-first: nothing written
  });

  // T-021: the Bibliotheca owner (masthead "The Bibliotheca of <owner>").
  it('test_resolve_owner_precedence: env > tome.config.toml owner > OS username', async () => {
    const cfg = join(tmp, 'owner.config.toml');
    writeFileSync(cfg, 'owner = "The Scriptorium"\n');
    // env wins
    expect(
      await resolveOwner({ configPath: cfg, env: { TOME_OWNER: 'Env Name' } }),
    ).toBe('Env Name');
    // then the config owner
    expect(await resolveOwner({ configPath: cfg, env: {} })).toBe(
      'The Scriptorium',
    );
    // then the OS login name (zero-config personalization)
    expect(
      await resolveOwner({ configPath: join(tmp, 'absent.toml'), env: {} }),
    ).toBe(userInfo().username);
  });
});

describe('load-books.mjs — parent-relative assets', () => {
  let tmp: string;
  beforeAll(() => {
    tmp = mkdtempSync(join(tmpdir(), 'tome-parent-loader-'));
  });
  afterAll(() => {
    rmSync(tmp, { recursive: true, force: true });
  });

  it('test_load_books_parent_asset: stages and rewrites a root-sibling image', () => {
    const book = makeBook(join(tmp, 'single', 'book'), {
      'book.toml': '[book]\ntitle = "Parent Book"\nsrc = "src"\n',
      'src/SUMMARY.md': '# Summary\n\n[First](first.md)\n',
      'src/first.md': '# First\n\n![Parent plate](../assets/plate.svg)\n',
      'assets/plate.svg': '<svg data-source="single"/>',
    });
    const dest = join(tmp, 'single-output');

    run(dest, { TOME_BOOK: book });

    const out = bookDir(dest, book);
    expect(readFileSync(join(out, 'first.md'), 'utf8')).toContain(
      `![Parent plate](./${PARENT_ASSET_DIR}/assets/plate.svg)`,
    );
    expect(
      readFileSync(join(out, PARENT_ASSET_DIR, 'assets', 'plate.svg'), 'utf8'),
    ).toContain('data-source="single"');
    expect(
      JSON.parse(readFileSync(join(out, 'book.meta.json'), 'utf8')).title,
    ).toBe('Parent Book');
    expect(stageResidue(dest)).toEqual([]);
  });

  it('test_load_books_parent_asset_isolation: equal paths remain tome-private', () => {
    const first = makeBook(join(tmp, 'isolated', 'p1', 'guide'), {
      'src/SUMMARY.md': '# One\n\n[First](first.md)\n',
      'src/first.md': '![Shared name](../assets/shared.svg)\n',
      'assets/shared.svg': '<svg data-book="one"/>',
    });
    const second = makeBook(join(tmp, 'isolated', 'p2', 'guide'), {
      'src/SUMMARY.md': '# Two\n\n[First](first.md)\n',
      'src/first.md': '![Shared name](../assets/shared.svg)\n',
      'assets/shared.svg': '<svg data-book="two"/>',
    });
    const dest = join(tmp, 'isolated-output');

    run(dest, { TOME_BOOKS: `${first},${second}` });

    expect(
      readFileSync(
        join(dest, 'guide', PARENT_ASSET_DIR, 'assets', 'shared.svg'),
        'utf8',
      ),
    ).toContain('data-book="one"');
    expect(
      readFileSync(
        join(dest, 'guide-2', PARENT_ASSET_DIR, 'assets', 'shared.svg'),
        'utf8',
      ),
    ).toContain('data-book="two"');
    expect(readFileSync(join(dest, 'guide', 'first.md'), 'utf8')).toContain(
      PARENT_ASSET_DIR,
    );
    expect(readFileSync(join(dest, 'guide-2', 'first.md'), 'utf8')).toContain(
      PARENT_ASSET_DIR,
    );
    expect(stageResidue(dest)).toEqual([]);
  });

  const atomicFailureCases: Array<{
    label: string;
    url: string;
    chapter?: string;
    extra: Record<string, string>;
  }> = [
    {
      label: 'missing',
      url: '../assets/missing.svg',
      extra: {},
    },
    {
      label: 'directory',
      url: '../assets/folder',
      extra: { 'assets/folder/.keep': '' },
    },
    {
      label: 'reserved collision',
      url: '../assets/plate.svg',
      extra: {
        'assets/plate.svg': '<svg/>',
        [`src/${PARENT_ASSET_DIR}/keep.txt`]: 'occupied',
      },
    },
    {
      label: 'reserved nested directory',
      url: '../../assets/plate.svg',
      chapter: `src/${PARENT_ASSET_DIR}/nested.md`,
      extra: { 'assets/plate.svg': '<svg/>' },
    },
    {
      label: 'malformed percent',
      url: '../assets/%ZZ.svg',
      extra: {},
    },
    {
      label: 'lexical escape',
      url: '../../outside.svg',
      extra: {},
    },
  ];

  it.each(atomicFailureCases)(
    'test_parent_asset_errors_are_atomic_across_tomes: $label',
    ({ label, url, chapter = 'src/first.md', extra }) => {
      const caseRoot = join(tmp, 'atomic', label.replaceAll(' ', '-'));
      const good = makeBook(join(caseRoot, 'good'), {
        'src/SUMMARY.md': '# Good\n\n[First](first.md)\n',
        'src/first.md': '# Good\n',
      });
      const bad = makeBook(join(caseRoot, 'bad'), {
        'src/SUMMARY.md': '# Bad\n\n[First](first.md)\n',
        'src/first.md':
          chapter === 'src/first.md'
            ? `# Bad\n\n![Broken](${url})\n`
            : '# Bad\n',
        ...(chapter === 'src/first.md'
          ? {}
          : { [chapter]: `# Nested\n\n![Broken](${url})\n` }),
        ...extra,
      });
      if (label === 'lexical escape')
        writeFileSync(join(caseRoot, 'outside.svg'), '<svg/>');
      const dest = join(caseRoot, 'output');
      mkdirSync(dest, { recursive: true });
      writeFileSync(join(dest, 'sentinel.txt'), 'keep');

      const { code, stderr } = runExpectError(dest, {
        TOME_BOOKS: `${good},${bad}`,
      });

      expect(code).not.toBe(0);
      expect(stderr).toContain(basename(chapter));
      expect(stderr).toContain(url);
      expect(readFileSync(join(dest, 'sentinel.txt'), 'utf8')).toBe('keep');
      expect(existsSync(join(dest, 'good'))).toBe(false);
      expect(stageResidue(dest)).toEqual([]);
    },
  );

  it('test_declared_source_outside_root: independently confines parent targets', () => {
    const base = join(tmp, 'declared-external');
    const book = makeBook(join(base, 'book'), {
      'book.toml': '[book]\nsrc = "../shared"\n',
      'assets/inside.svg': '<svg data-location="inside"/>',
    });
    makeBook(join(base, 'shared'), {
      'SUMMARY.md': '# Shared\n\n[First](first.md)\n',
      'first.md':
        '![Local](./img/local.svg)\n\n![Parent](../book/assets/inside.svg)\n',
      'img/local.svg': '<svg data-location="source"/>',
    });
    const dest = join(base, 'success-output');

    run(dest, { TOME_BOOK: book });

    const markdown = readFileSync(join(dest, 'book', 'first.md'), 'utf8');
    expect(markdown).toContain('![Local](./img/local.svg)');
    expect(markdown).toContain(
      `![Parent](./${PARENT_ASSET_DIR}/assets/inside.svg)`,
    );

    writeFileSync(
      join(base, 'shared', 'first.md'),
      '![Outside](../outside.svg)\n',
    );
    writeFileSync(join(base, 'outside.svg'), '<svg/>');
    const failedDest = join(base, 'failed-output');
    mkdirSync(failedDest, { recursive: true });
    writeFileSync(join(failedDest, 'sentinel.txt'), 'keep');
    const failure = runExpectError(failedDest, { TOME_BOOK: book });
    expect(failure.code).not.toBe(0);
    expect(failure.stderr).toMatch(
      /parent asset "\.\.\/outside\.svg" in first\.md escapes the configured book root/,
    );
    expect(readFileSync(join(failedDest, 'sentinel.txt'), 'utf8')).toBe('keep');
    expect(stageResidue(failedDest)).toEqual([]);
  });

  it('test_declared_symlinked_source: resolves parent targets from the lexical source', (context) => {
    const base = join(tmp, 'declared-symlink');
    const book = makeBook(join(base, 'book'), {
      'book.toml': '[book]\nsrc = "src"\n',
      'assets/inside.svg': '<svg data-location="inside"/>',
    });
    const shared = makeBook(join(base, 'shared'), {
      'SUMMARY.md': '# Shared\n\n[First](first.md)\n',
      'first.md': '![Parent](../assets/inside.svg)\n',
    });
    try {
      symlinkSync(shared, join(book, 'src'), 'dir');
    } catch {
      context.skip();
      return;
    }
    const dest = join(base, 'output');

    run(dest, { TOME_BOOK: book });

    expect(readFileSync(join(dest, 'book', 'first.md'), 'utf8')).toContain(
      `![Parent](./${PARENT_ASSET_DIR}/assets/inside.svg)`,
    );
  });
});
