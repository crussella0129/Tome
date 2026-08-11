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
import { join, dirname } from 'node:path';

const root = process.cwd();
const script = join(root, 'scripts', 'load-book.mjs');
const fixture = join(root, 'fixtures', 'handbook');

describe('load-book.mjs', () => {
  let tmp: string;
  beforeAll(() => {
    tmp = mkdtempSync(join(tmpdir(), 'tome-loadbook-'));
  });
  afterAll(() => {
    rmSync(tmp, { recursive: true, force: true });
  });

  // T-010 clause 1 (criterion 1): external book populates the destination.
  it('test_load_book_external: copies TOME_BOOK src and writes the book.toml title', () => {
    const dest = join(tmp, 'ext');
    execFileSync('node', [script, '--dest', dest], {
      cwd: root,
      env: { ...process.env, TOME_BOOK: fixture },
      encoding: 'utf8',
    });
    expect(existsSync(join(dest, 'SUMMARY.md'))).toBe(true);
    expect(existsSync(join(dest, 'first.md'))).toBe(true);
    expect(existsSync(join(dest, 'section', 'nested.md'))).toBe(true);
    const meta = JSON.parse(readFileSync(join(dest, 'book.meta.json'), 'utf8'));
    expect(meta.title).toBe('The Sacred Handbook');
  });

  // T-010 clause 2 (criterion 4): no-op when TOME_BOOK is unset.
  it('test_load_book_noop_when_unset: leaves the destination untouched', () => {
    const dest = join(tmp, 'noop');
    mkdirSync(dest, { recursive: true });
    writeFileSync(join(dest, 'sentinel.txt'), 'keep');
    const env = { ...process.env };
    delete env.TOME_BOOK;
    execFileSync('node', [script, '--dest', dest], { cwd: root, env, encoding: 'utf8' });
    expect(existsSync(join(dest, 'sentinel.txt'))).toBe(true);
    expect(existsSync(join(dest, 'book.meta.json'))).toBe(false);
  });

  // T-010 clause 3 (criterion 3): clear error + non-zero exit on an invalid book.
  it('test_load_book_errors_on_invalid: fails clearly when src/SUMMARY.md is missing', () => {
    const dest = join(tmp, 'bad');
    let code = 0;
    let stderr = '';
    try {
      execFileSync('node', [script, '--dest', dest], {
        cwd: root,
        env: { ...process.env, TOME_BOOK: join(tmp, 'does-not-exist') },
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      });
    } catch (e) {
      const err = e as { status?: number; stderr?: string };
      code = err.status ?? 1;
      stderr = String(err.stderr ?? '');
    }
    expect(code).not.toBe(0);
    expect(stderr).toMatch(/SUMMARY\.md/);
  });
});

// T-015 — source + title auto-detection (INT-0004).
describe('load-book.mjs source detection', () => {
  let tmp: string;
  beforeAll(() => {
    tmp = mkdtempSync(join(tmpdir(), 'tome-detect-'));
  });
  afterAll(() => {
    rmSync(tmp, { recursive: true, force: true });
  });

  function makeBook(bookRoot: string, files: Record<string, string>): string {
    for (const [rel, content] of Object.entries(files)) {
      const full = join(bookRoot, rel);
      mkdirSync(dirname(full), { recursive: true });
      writeFileSync(full, content);
    }
    return bookRoot;
  }
  function load(bookRoot: string, dest: string): void {
    execFileSync('node', [script, '--dest', dest], {
      cwd: root,
      env: { ...process.env, TOME_BOOK: bookRoot },
      encoding: 'utf8',
    });
  }
  function loadExpectError(bookRoot: string, dest: string): { code: number; stderr: string } {
    try {
      execFileSync('node', [script, '--dest', dest], {
        cwd: root,
        env: { ...process.env, TOME_BOOK: bookRoot },
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      });
    } catch (e) {
      const err = e as { status?: number; stderr?: string };
      return { code: err.status ?? 1, stderr: String(err.stderr ?? '') };
    }
    return { code: 0, stderr: '' };
  }

  // criterion 1
  it('test_source_detect_docs: no book.toml → detects docs/', () => {
    const book = makeBook(join(tmp, 'docsbook'), {
      'docs/SUMMARY.md': '# Summary\n\n[Intro](README.md)\n',
      'docs/README.md': '# Intro\n',
    });
    const dest = join(tmp, 'out-docs');
    load(book, dest);
    expect(existsSync(join(dest, 'SUMMARY.md'))).toBe(true);
    expect(existsSync(join(dest, 'README.md'))).toBe(true);
  });

  // criterion 2
  it('test_source_honor_book_toml_src: a declared src wins over src/ and docs/', () => {
    const book = makeBook(join(tmp, 'declared'), {
      'book.toml': '[book]\nsrc = "guide"\n',
      'guide/SUMMARY.md': '# Summary\n\n[G](g.md)\n',
      'guide/g.md': '# G\n',
      // Decoys that must NOT be chosen:
      'src/SUMMARY.md': '# Summary\n\n[wrong](wrong.md)\n',
      'docs/SUMMARY.md': '# Summary\n\n[wrong](wrong.md)\n',
    });
    const dest = join(tmp, 'out-declared');
    load(book, dest);
    expect(existsSync(join(dest, 'g.md'))).toBe(true); // from guide/
    expect(existsSync(join(dest, 'wrong.md'))).toBe(false); // not src/ or docs/
  });

  it('test_source_declared_missing_errors: a declared src without SUMMARY errors', () => {
    const book = makeBook(join(tmp, 'declared-missing'), {
      'book.toml': '[book]\nsrc = "guide"\n',
      'guide/intro.md': '# no summary here\n',
      'docs/SUMMARY.md': '# Summary\n', // present, but must not be used
    });
    const { code, stderr } = loadExpectError(book, join(tmp, 'out-declared-missing'));
    expect(code).not.toBe(0);
    expect(stderr).toMatch(/declares src="guide"/);
  });

  // criterion 3
  it('test_title_from_dirname: title falls back to the book root directory name', () => {
    const book = makeBook(join(tmp, 'MyBook'), {
      'docs/SUMMARY.md': '# Summary\n\n[x](x.md)\n',
      'docs/x.md': '# x\n',
    });
    const dest = join(tmp, 'out-title');
    load(book, dest);
    const meta = JSON.parse(readFileSync(join(dest, 'book.meta.json'), 'utf8'));
    expect(meta.title).toBe('MyBook');
  });

  // criterion 4
  it('test_source_none_errors: no SUMMARY in src/docs/root → enumerated error', () => {
    const book = makeBook(join(tmp, 'empty'), { 'README.md': '# nothing\n' });
    const { code, stderr } = loadExpectError(book, join(tmp, 'out-none'));
    expect(code).not.toBe(0);
    expect(stderr).toMatch(/Tried:/);
    expect(stderr).toMatch(/src[\\/]SUMMARY\.md/);
    expect(stderr).toMatch(/docs[\\/]SUMMARY\.md/);
  });
});
