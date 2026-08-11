import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, existsSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
// The shared module used by load-book.mjs and the live-reload integration.
import { resolveBookSource, syncPath } from '../../../scripts/book-source.mjs';

function normalize(p: string): string {
  return p.replace(/\\/g, '/');
}

describe('book-source', () => {
  let tmp: string;
  beforeAll(() => {
    tmp = mkdtempSync(join(tmpdir(), 'tome-booksource-'));
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

  // T-017 clause 1
  it('test_resolve_book_source: detects source dir + title (parity with the loader rules)', async () => {
    // no book.toml → detects docs/, title from directory name
    const docsBook = makeBook(join(tmp, 'MyBook'), {
      'docs/SUMMARY.md': '# Summary\n',
    });
    const a = await resolveBookSource(docsBook);
    expect(normalize(a.sourceDir).endsWith('/docs')).toBe(true);
    expect(a.title).toBe('MyBook');

    // declared book.toml src is authoritative
    const declared = makeBook(join(tmp, 'declared'), {
      'book.toml': '[book]\ntitle = "Declared"\nsrc = "guide"\n',
      'guide/SUMMARY.md': '# Summary\n',
      'docs/SUMMARY.md': '# Summary\n', // decoy
    });
    const b = await resolveBookSource(declared);
    expect(normalize(b.sourceDir).endsWith('/guide')).toBe(true);
    expect(b.title).toBe('Declared');

    // no SUMMARY anywhere → throws with an enumerated message
    const empty = makeBook(join(tmp, 'empty'), { 'README.md': '# x\n' });
    await expect(resolveBookSource(empty)).rejects.toThrow(/Tried:/);
  });

  // T-017 clause 2
  it('test_sync_path_copy_and_delete: copies a changed file, removes a deleted one', async () => {
    const sourceDir = join(tmp, 'src-dir');
    const dest = join(tmp, 'dest-dir');
    const changed = join(sourceDir, 'a', 'b.md');
    makeBook(sourceDir, { 'a/b.md': '# hello live\n' });

    const target = await syncPath(changed, sourceDir, dest);
    expect(target).not.toBeNull();
    expect(existsSync(join(dest, 'a', 'b.md'))).toBe(true);
    expect(readFileSync(join(dest, 'a', 'b.md'), 'utf8')).toContain('hello live');

    // A path outside the source is ignored.
    expect(await syncPath(join(tmp, 'elsewhere.md'), sourceDir, dest)).toBeNull();

    // Delete the source file → syncPath removes it from dest.
    rmSync(changed, { force: true });
    await syncPath(changed, sourceDir, dest);
    expect(existsSync(join(dest, 'a', 'b.md'))).toBe(false);
  });
});
