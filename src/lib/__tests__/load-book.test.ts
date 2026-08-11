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
import { join } from 'node:path';

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
