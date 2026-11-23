// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  mkdtempSync,
  mkdirSync,
  rmSync,
  writeFileSync,
  readFileSync,
  readdirSync,
  symlinkSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, relative } from 'node:path';
import { buildDocx } from '../../../fixtures/word/build-docx.mjs';

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
      // A folder of loose Markdown is now accepted (INT-0029), so the folder
      // refused below holds nothing Tome reads.
      'not-a-book/notes.txt': '# nothing here\n',
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

// INT-0029 (T-071) — books:add takes a Markdown file, a Word document, or a
// folder of them. Reading a document loads the Word reader (a couple of seconds
// a run), so these cases get more than the default timeout.
describe('find-books.mjs --add — documents (INT-0029 AC1)', { timeout: 180_000 }, () => {
  let tmp: string;
  let cwd: string;
  const loader = join(projectRoot, 'scripts', 'load-books.mjs');
  const hash = (path: string) => createHash('sha256').update(readFileSync(path)).digest('hex');
  const manifest = () => readFileSync(join(cwd, 'tome.local.toml'), 'utf8');
  /** The title the loader writes for an entry, read back from its library. */
  function loadedTitle(entry: string): string {
    const dest = mkdtempSync(join(tmp, 'lib-'));
    const env: NodeJS.ProcessEnv = { ...process.env, TOME_BOOK: entry };
    delete env.TOME_BOOKS;
    delete env.TOME_CONFIG;
    delete env.TOME_BOOK_DEST;
    const result = spawnSync(process.execPath, [loader, '--dest', dest], {
      cwd: projectRoot,
      env,
      encoding: 'utf8',
      windowsHide: true,
    });
    expect(result.status, result.stderr).toBe(0);
    const [slug] = readdirSync(dest);
    return JSON.parse(readFileSync(join(dest, slug!, 'book.meta.json'), 'utf8')).title;
  }

  /** The environment with every loader input removed. */
  function cleanEnv(): NodeJS.ProcessEnv {
    const env: NodeJS.ProcessEnv = { ...process.env };
    delete env.TOME_BOOK;
    delete env.TOME_BOOKS;
    delete env.TOME_CONFIG;
    delete env.TOME_BOOK_DEST;
    return env;
  }
  /** Every file of the documents given to books:add, with its hash. */
  function sourceHashes(): Record<string, string> {
    const out: Record<string, string> = {};
    const walk = (dir: string) => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = join(dir, entry.name);
        if (entry.isDirectory()) walk(full);
        else out[relative(tmp, full)] = hash(full);
      }
    };
    for (const folder of ['papers', 'vault']) walk(join(tmp, folder));
    return out;
  }

  beforeAll(async () => {
    tmp = mkdtempSync(join(tmpdir(), 'tome-add-docs-'));
    cwd = join(tmp, 'checkout');
    const paper = await buildDocx();
    write(tmp, {
      'checkout/tome.config.toml': '# tracked template\n# [[book]]\n# path = "../x"\n',
      'papers/My Note.md': '# A Note Of Mine\n\nBody.\n',
      'papers/old.doc': 'the older Word format',
      'vault/one.md': '# One\n',
      'vault/letters/two.md': '# Two\n',
      'mixed/good.md': '# Good\n',
      'mixed/broken.docx': 'plain text under a Word name\n',
      'loose/top.md': '# Top\n',
      'loose/book/book.toml': '[book]\ntitle = "A Real Book"\n',
      'loose/book/src/SUMMARY.md': summary('A Real Book', ['i']),
      'nothing/notes.txt': 'nothing Tome reads\n',
      'corrupt.docx': 'plain text under a Word name\n',
    });
    writeFileSync(join(tmp, 'papers', 'paper.docx'), paper);
    writeFileSync(join(tmp, 'vault', 'paper.docx'), paper);
  });
  afterAll(() => rmSync(tmp, { recursive: true, force: true }));

  it('test_books_add_documents: a file or a folder is added under the title the loader shows', () => {
    const shared = hash(join(cwd, 'tome.config.toml'));
    const note = join(tmp, 'papers', 'My Note.md');
    const paper = join(tmp, 'papers', 'paper.docx');
    const vault = join(tmp, 'vault');
    const sourcesBefore = sourceHashes();
    expect(Object.keys(sourcesBefore).length).toBeGreaterThanOrEqual(6);

    const first = books(['--add', note], cwd);
    expect(first.status, first.stderr).toBe(0);
    expect(first.stdout).toContain('Added "A Note Of Mine" (1 chapter) to tome.local.toml.');
    expect(first.stdout).toContain('npm run dev');
    expect(loadedTitle(note)).toBe('A Note Of Mine');

    const second = books(['--add', paper], cwd);
    expect(second.status, second.stderr).toBe(0);
    expect(second.stdout).toContain('Added "On the Weight of Obsidian" (1 chapter)');
    expect(loadedTitle(paper)).toBe('On the Weight of Obsidian');

    const third = books(['--add', vault, '--title', 'My Vault', '--slug', 'the-vault'], cwd);
    expect(third.status, third.stderr).toBe(0);
    expect(third.stdout).toContain('Added "My Vault" (3 chapters)');
    expect(loadedTitle(vault)).toBe('vault'); // the folder's own name, before the override

    const text = manifest();
    expect(text.match(/\[\[book\]\]/g)).toHaveLength(3);
    expect(text).toContain(`path = ${JSON.stringify(note)}`);
    expect(text).toContain(`path = ${JSON.stringify(paper)}`);
    expect(text).toContain(`path = ${JSON.stringify(vault)}`);
    expect(text).toContain('title = "My Vault"');
    expect(text).toContain('slug = "the-vault"');
    expect(hash(join(cwd, 'tome.config.toml'))).toBe(shared);

    // The manifest books:add wrote is one the loader reads: three tomes, the
    // folder under the title and slug given.
    const dest = mkdtempSync(join(tmp, 'from-manifest-'));
    const loaded = spawnSync(
      process.execPath,
      [loader, '--dest', dest, '--config', join(cwd, 'tome.local.toml')],
      { cwd: projectRoot, env: cleanEnv(), encoding: 'utf8', windowsHide: true },
    );
    expect(loaded.status, loaded.stderr).toBe(0);
    expect(readdirSync(dest).sort()).toEqual(['my-note', 'paper', 'the-vault']);
    const titleOf = (slug: string) =>
      JSON.parse(readFileSync(join(dest, slug, 'book.meta.json'), 'utf8')).title;
    expect(titleOf('the-vault')).toBe('My Vault');
    expect(titleOf('my-note')).toBe('A Note Of Mine');
    expect(titleOf('paper')).toBe('On the Weight of Obsidian');

    // Adding only reads: every source file is as it was.
    expect(sourceHashes()).toEqual(sourcesBefore);
  });

  it('test_books_add_document_dedupes: the same document twice is one entry', () => {
    const before = manifest();
    const again = books(['--add', join(tmp, 'papers', '..', 'papers', 'paper.docx')], cwd);
    expect(again.status, again.stderr).toBe(0);
    expect(again.stdout).toContain('already in tome.local.toml');
    expect(manifest()).toBe(before);
  });

  it('test_books_add_rejects_unaccepted: what cannot be read is refused, and a folder says what it skips', () => {
    const shared = hash(join(cwd, 'tome.config.toml'));
    const before = manifest();
    for (const name of [join('papers', 'old.doc'), 'nothing', 'corrupt.docx']) {
      const result = books(['--add', join(tmp, name)], cwd);
      expect(result.status, name).not.toBe(0);
      expect(result.stderr, name).toContain(join(tmp, name).split(/[\\/]/).pop());
      expect(manifest(), name).toBe(before);
    }

    // One unreadable Word file in a folder does not refuse the folder.
    const mixed = books(['--add', join(tmp, 'mixed')], cwd);
    expect(mixed.status, mixed.stderr).toBe(0);
    expect(mixed.stdout).toContain('Added "mixed" (2 chapters)');
    expect(mixed.stdout).toMatch(/broken\.docx could not be read as a Word document/);
    expect(manifest().match(/\[\[book\]\]/g)).toHaveLength(4);
    expect(hash(join(cwd, 'tome.config.toml'))).toBe(shared);
  });

  it('test_find_books_ignores_documents: discovery still lists mdBooks only', () => {
    const result = books([join(tmp, 'loose'), '--json']);
    expect(result.status, result.stderr).toBe(0);
    const found = JSON.parse(result.stdout);
    expect(found.version).toBe(1);
    expect(found.books).toHaveLength(1);
    expect(Object.keys(found.books[0]).sort()).toEqual([
      'chapters',
      'layout',
      'path',
      'sourceDir',
      'sprintBook',
      'title',
    ]);
    expect(found.books[0]).toMatchObject({ title: 'A Real Book', chapters: 1 });
    expect(found.skipped).toEqual([]);

    // The table too: one book, and no line for the loose note beside it.
    const table = books([join(tmp, 'loose')]);
    expect(table.status, table.stderr).toBe(0);
    expect(table.stdout).toMatch(/Found 1 book under/);
    expect(table.stdout).toContain('A Real Book');
    expect(table.stdout).not.toMatch(/top\.md|\bTop\b/);
  });
});
