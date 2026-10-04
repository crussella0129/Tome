// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync, readFileSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, relative } from 'node:path';

const projectRoot = process.cwd();
const cli = join(projectRoot, 'scripts', 'find-books.mjs');

function write(root: string, files: Record<string, string>) {
  for (const [rel, content] of Object.entries(files)) {
    const full = join(root, rel);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, content);
  }
}

function books(args: string[], cwd = projectRoot) {
  const result = spawnSync(process.execPath, [cli, ...args], {
    cwd,
    encoding: 'utf8',
    timeout: 60_000,
    windowsHide: true,
  });
  return { status: result.status, stdout: result.stdout, stderr: result.stderr };
}

const summary = (title: string, chapters: string[]) =>
  `# ${title}\n\n${chapters.map((c) => `- [${c}](${c}.md)`).join('\n')}\n- [Unwritten]()\n`;

interface Found {
  path: string;
  sourceDir: string;
  title: string | null;
  chapters: number;
  layout: string;
  sprintBook: boolean;
}

describe('find-books.mjs — discovery (INT-0023 AC1)', () => {
  let tmp: string;
  let rel: (p: string) => string;
  beforeAll(() => {
    tmp = mkdtempSync(join(tmpdir(), 'tome-find-'));
    rel = (p) => relative(tmp, p).split(/[\\/]/).join('/');
    write(tmp, {
      // A standard book.toml + src/ book.
      'standard/book.toml': '[book]\ntitle = "Standard Book"\n',
      'standard/src/SUMMARY.md': summary('Standard', ['one', 'two']),
      // Config-less docs/ layout (a Sprint Loops Project Book).
      'project/docs/SUMMARY.md': summary('Project', ['intent']),
      'project/docs/.sprint-loop-book': 'schema-version: 2\n',
      // Root layout.
      'tablets/SUMMARY.md': summary('Tablets', ['i', 'ii', 'iii']),
      // Nested editions: distinct books inside one checkout.
      'rust/book.toml': '[book]\ntitle = "Edition Prime"\n',
      'rust/src/SUMMARY.md': summary('Prime', ['a']),
      'rust/2018/book.toml': '[book]\ntitle = "Edition 2018"\n',
      'rust/2018/src/SUMMARY.md': summary('2018', ['a', 'b']),
      // A declared src that points at the book's own folder.
      'declared/book.toml': '[book]\ntitle = "Declared"\nsrc = "pages"\n',
      'declared/pages/SUMMARY.md': summary('Declared', ['p']),
      // Decoys that must never be listed.
      'app/node_modules/pkg/SUMMARY.md': summary('Dependency', ['x']),
      'app/.git/SUMMARY.md': summary('Git', ['x']),
      '.hidden/notes/SUMMARY.md': summary('Hidden', ['x']),
      'Tome/src/content/library/copy/SUMMARY.md': summary('Generated copy', ['x']),
      // Looks like a book, will not load.
      'broken/book.toml': '[book]\nsrc = "missing"\n',
      // Deeper than a shallow scan.
      'deep/a/b/c/d/book/SUMMARY.md': summary('Deep', ['x']),
    });
  });
  afterAll(() => rmSync(tmp, { recursive: true, force: true }));

  const scan = (...extra: string[]) => {
    const { status, stdout, stderr } = books([tmp, '--json', ...extra]);
    expect(status, stderr).toBe(0);
    return JSON.parse(stdout) as {
      version: number;
      roots: string[];
      depth: number;
      books: Found[];
      skipped: { path: string; reason: string }[];
    };
  };

  it('test_find_books_lists_exact_roots: every real book once; source folders and decoys never', () => {
    const { books: found } = scan();
    expect(found.map((b) => rel(b.path))).toEqual([
      'declared',
      'project',
      'rust',
      'rust/2018',
      'standard',
      'tablets',
    ]);
  });

  it('test_find_books_json_schema: stable fields an agent can rely on', () => {
    const doc = scan();
    expect(doc.version).toBe(1);
    expect(doc.depth).toBe(5);
    expect(doc.roots).toHaveLength(1);
    const by = Object.fromEntries(doc.books.map((b) => [rel(b.path), b]));
    expect(by.standard).toMatchObject({
      title: 'Standard Book',
      chapters: 2,
      layout: 'src/',
      sprintBook: false,
    });
    expect(rel(by.standard!.sourceDir)).toBe('standard/src');
    expect(by.project).toMatchObject({
      title: 'project',
      chapters: 1,
      layout: 'docs/',
      sprintBook: true,
    });
    expect(by.tablets).toMatchObject({ chapters: 3, layout: 'root' });
    expect(by.declared).toMatchObject({ title: 'Declared', layout: 'book.toml' });
    expect(by['rust/2018']).toMatchObject({ title: 'Edition 2018', chapters: 2 });
    for (const book of doc.books) {
      expect(Object.keys(book).sort()).toEqual(
        ['chapters', 'layout', 'path', 'sourceDir', 'sprintBook', 'title'].sort(),
      );
    }
  });

  it('test_find_books_skips_invalid: a broken book is reported, not fatal', () => {
    const { skipped } = scan();
    expect(skipped.map((s) => rel(s.path))).toEqual(['broken']);
    expect(skipped[0]!.reason).toMatch(/SUMMARY\.md/);
  });

  it('test_find_books_bounds: depth limits the walk; symlinks are never followed', (context) => {
    expect(scan('--depth', '3').books.map((b) => rel(b.path))).not.toContain('deep/a/b/c/d/book');
    expect(scan('--depth', '7').books.map((b) => rel(b.path))).toContain('deep/a/b/c/d/book');

    const loop = join(tmp, 'standard', 'loop');
    try {
      symlinkSync(join(tmp, 'tablets'), loop, process.platform === 'win32' ? 'junction' : 'dir');
    } catch {
      context.skip(); // symlinks unavailable to this user
    }
    try {
      const paths = scan().books.map((b) => rel(b.path));
      expect(paths).not.toContain('standard/loop');
      expect(paths.filter((p) => p === 'tablets')).toHaveLength(1);
    } finally {
      rmSync(loop, { recursive: true, force: true });
    }
  });

  it('prints a readable table with the add command', () => {
    const { status, stdout } = books([tmp]);
    expect(status).toBe(0);
    expect(stdout).toMatch(/Found 6 books under/);
    expect(stdout).toContain('Standard Book');
    expect(stdout).toContain('npm run books:add -- "<path>"');
    expect(stdout).toMatch(/Skipped 1 folder/);
  });
});

describe('find-books.mjs --add — the personal manifest (INT-0023 AC2)', () => {
  let tmp: string;
  let cwd: string;
  let tablets: string;
  const hash = (path: string) => createHash('sha256').update(readFileSync(path)).digest('hex');
  beforeAll(() => {
    tmp = mkdtempSync(join(tmpdir(), 'tome-add-'));
    cwd = join(tmp, 'checkout');
    tablets = join(tmp, 'tablets');
    write(tmp, {
      'checkout/tome.config.toml': '# tracked template\n# [[book]]\n# path = "../x"\n',
      'tablets/book.toml': '[book]\ntitle = "The Obsidian Tablets"\n',
      'tablets/src/SUMMARY.md': summary('Tablets', ['i', 'ii']),
      'not-a-book/notes.md': '# nothing here\n',
    });
  });
  afterAll(() => rmSync(tmp, { recursive: true, force: true }));

  it('test_books_add_appends_and_dedupes: creates tome.local.toml, then refuses a duplicate', () => {
    const shared = hash(join(cwd, 'tome.config.toml'));

    const first = books(['--add', tablets], cwd);
    expect(first.status, first.stderr).toBe(0);
    expect(first.stdout).toContain('Added "The Obsidian Tablets" (2 chapters) to tome.local.toml.');
    expect(first.stdout).toContain('npm run dev');
    const manifest = readFileSync(join(cwd, 'tome.local.toml'), 'utf8');
    expect(manifest).toMatch(/^# tome\.local\.toml/);
    expect(manifest).toContain(`path = ${JSON.stringify(tablets)}`);

    // The same book again — by a different spelling of the same folder.
    const again = books(['--add', join(tablets, 'src', '..')], cwd);
    expect(again.status).toBe(0);
    expect(again.stdout).toContain('already in tome.local.toml');
    expect(readFileSync(join(cwd, 'tome.local.toml'), 'utf8')).toBe(manifest);

    // A title/slug override is recorded with the entry.
    const other = join(tmp, 'second');
    write(other, { 'SUMMARY.md': summary('Second', ['x']) });
    const named = books(['--add', other, '--title', 'Act II', '--slug', 'act-two'], cwd);
    expect(named.status).toBe(0);
    const updated = readFileSync(join(cwd, 'tome.local.toml'), 'utf8');
    expect(updated.match(/\[\[book\]\]/g)).toHaveLength(2);
    expect(updated).toContain('title = "Act II"');
    expect(updated).toContain('slug = "act-two"');

    expect(hash(join(cwd, 'tome.config.toml'))).toBe(shared);
  });

  it('test_books_add_rejects_invalid: a folder Tome cannot load is refused', () => {
    const shared = hash(join(cwd, 'tome.config.toml'));
    const before = readFileSync(join(cwd, 'tome.local.toml'), 'utf8');
    const result = books(['--add', join(tmp, 'not-a-book')], cwd);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toMatch(/SUMMARY\.md/);
    expect(readFileSync(join(cwd, 'tome.local.toml'), 'utf8')).toBe(before);
    expect(hash(join(cwd, 'tome.config.toml'))).toBe(shared);
  });
});
