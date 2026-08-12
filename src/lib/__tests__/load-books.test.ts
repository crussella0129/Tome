import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execFileSync } from 'node:child_process';
import {
  mkdtempSync,
  mkdirSync,
  rmSync,
  writeFileSync,
  readFileSync,
  existsSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, basename } from 'node:path';
import { slugify } from '../../../scripts/book-source.mjs';

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

function run(dest: string, overrides: Record<string, string> = {}, args: string[] = []) {
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
    const meta = JSON.parse(readFileSync(join(bookDir(dest, book), 'book.meta.json'), 'utf8'));
    expect(meta.title).toBe('MyBook');
  });

  it('test_source_none_errors: no SUMMARY in src/docs/root → enumerated error', () => {
    const book = makeBook(join(tmp, 'empty'), { 'README.md': '# nothing\n' });
    const { code, stderr } = runExpectError(join(tmp, 'out-none'), { TOME_BOOK: book });
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
      const meta = JSON.parse(readFileSync(join(dest, slug, 'book.meta.json'), 'utf8'));
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
});
