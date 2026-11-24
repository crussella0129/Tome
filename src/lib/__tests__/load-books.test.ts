import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
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
import { buildDocx } from '../../../fixtures/word/build-docx.mjs';

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
  dest: string | null,
  overrides: Record<string, string> = {},
  args: string[] = [],
  cwd = root,
) {
  return execFileSync(
    'node',
    [script, ...(dest ? ['--dest', dest] : []), ...args],
    {
      cwd,
      env: env(overrides),
      encoding: 'utf8',
    },
  );
}

/** Every file under `dir`, relative and sorted, with its bytes. */
function tree(dir: string, base = dir): Record<string, string> {
  const out: Record<string, string> = {};
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) Object.assign(out, tree(full, base));
    else
      out[full.slice(base.length + 1).replace(/\\/g, '/')] = readFileSync(
        full,
        'utf8',
      );
  }
  return Object.fromEntries(
    Object.entries(out).sort(([a], [b]) => a.localeCompare(b)),
  );
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

  // INT-0023: nothing configured → the library is a byte-equal copy of the
  // committed sample (the sample itself is only read).
  it('test_loader_default_publishes_sample: replaces the library with the sample', () => {
    const sample = makeBook(join(tmp, 'sample'), {
      'alpha/SUMMARY.md': '# Alpha\n\n[Intro](README.md)\n',
      'alpha/README.md': '# Alpha\n',
      'alpha/book.meta.json': '{ "title": "Alpha" }\n',
      'beta/SUMMARY.md': '# Beta\n',
    });
    const before = tree(sample);
    const dest = join(tmp, 'noop');
    mkdirSync(dest, { recursive: true });
    writeFileSync(join(dest, 'stale.txt'), 'from an earlier build');
    run(dest, {}, [
      '--config',
      join(tmp, 'no-such-config.toml'),
      '--sample',
      sample,
    ]);
    expect(tree(dest)).toEqual(before);
    expect(tree(sample)).toEqual(before);
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
    // A folder of loose Markdown now loads (INT-0029), so the folder refused
    // here holds nothing Tome reads.
    const book = makeBook(join(tmp, 'empty'), { 'notes.txt': 'nothing\n' });
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

  it('test_load_books_precedence: no env and no manifest publishes the sample', () => {
    const sample = makeBook(join(tmp, 'precedence-sample'), {
      'tome/SUMMARY.md': '# Tome\n',
    });
    const dest = join(tmp, 'out-noop');
    run(dest, {}, ['--config', join(tmp, 'absent.toml'), '--sample', sample]);
    expect(tree(dest)).toEqual(tree(sample));
    expect(existsSync(join(dest, 'gamma'))).toBe(false);
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

// INT-0023 — a personal library that never touches the source checkout.
describe('load-books.mjs — personal library', () => {
  let tmp: string;
  beforeAll(() => {
    tmp = mkdtempSync(join(tmpdir(), 'tome-personal-'));
  });
  afterAll(() => {
    rmSync(tmp, { recursive: true, force: true });
  });

  const book = (name: string) =>
    makeBook(join(tmp, 'books', name), {
      'src/SUMMARY.md': `# ${name}\n\n[Intro](README.md)\n`,
      'src/README.md': `# ${name}\n`,
    });

  it('test_manifest_precedence: env > explicit TOME_CONFIG > tome.local.toml > tome.config.toml', () => {
    // `local` is reached through a relative manifest path below.
    const [, shared, explicit, fromEnv] = [
      'local',
      'shared',
      'explicit',
      'env',
    ].map(book);
    const cwd = join(tmp, 'checkout');
    mkdirSync(cwd, { recursive: true });
    writeFileSync(
      join(cwd, 'tome.config.toml'),
      `[[book]]\npath = ${JSON.stringify(shared)}\n`,
    );
    const explicitManifest = join(tmp, 'explicit.toml');
    writeFileSync(
      explicitManifest,
      `[[book]]\npath = ${JSON.stringify(explicit)}\n`,
    );
    const loaded = (name: string, overrides: Record<string, string> = {}) => {
      const dest = join(tmp, `out-${name}`);
      run(dest, overrides, [], cwd);
      return readdirSync(dest);
    };

    expect(loaded('shared-only')).toEqual(['shared']);
    // A relative path in the personal manifest resolves against its own folder.
    writeFileSync(
      join(cwd, 'tome.local.toml'),
      `[[book]]\npath = "../books/local"\n`,
    );
    expect(loaded('local-wins')).toEqual(['local']);
    expect(loaded('explicit-wins', { TOME_CONFIG: explicitManifest })).toEqual([
      'explicit',
    ]);
    expect(
      loaded('env-wins', { TOME_CONFIG: explicitManifest, TOME_BOOK: fromEnv }),
    ).toEqual(['env']);
  });

  it('test_owner_follows_manifest: the owner comes from the manifest the loader would read', async () => {
    const cwd = join(tmp, 'owner');
    mkdirSync(cwd, { recursive: true });
    writeFileSync(
      join(cwd, 'tome.config.toml'),
      'owner = "Shared Scriptorium"\n',
    );
    expect(await resolveOwner({ env: {}, cwd })).toBe('Shared Scriptorium');
    writeFileSync(join(cwd, 'tome.local.toml'), 'owner = "The Gamemaster"\n');
    expect(await resolveOwner({ env: {}, cwd })).toBe('The Gamemaster');
    const explicit = join(tmp, 'owner-explicit.toml');
    writeFileSync(explicit, 'owner = "Explicit"\n');
    expect(await resolveOwner({ env: { TOME_CONFIG: explicit }, cwd })).toBe(
      'Explicit',
    );
  });

  it('test_loader_excludes_vcs_and_build_output: copies content, never .git, deps, or rendered output', () => {
    const rootLayout = makeBook(join(tmp, 'root-layout'), {
      'SUMMARY.md': '# Tablets\n\n- [One](one.md)\n- [Two](two/two.md)\n',
      'one.md': '# One\n\n![sigil](img/sigil.png)\n',
      'img/sigil.png': 'png-bytes',
      'two/two.md': '# Two\n',
      'two/node_modules/dep/SUMMARY.md': '# not a chapter\n',
      '.git/HEAD': 'ref: refs/heads/main\n',
      '.git/objects/ab/cdef': 'object',
      '.hg/store': 'x',
      'node_modules/pkg/index.js': 'x',
      'book/index.html': '<html>rendered</html>',
      'target/debug/app': 'x',
    });
    const declared = makeBook(join(tmp, 'declared-build'), {
      'book.toml':
        '[book]\ntitle = "Declared"\n\n[build]\nbuild-dir = "site"\n',
      'SUMMARY.md': '# Declared\n\n- [Page](page.md)\n',
      'page.md': '# Page\n',
      'site/index.html': '<html>rendered</html>',
      // Without a rendered index.html, a folder named `book` is ordinary content.
      'book/chapter.md': '# A chapter folder named book\n',
    });
    const dest = join(tmp, 'out-clean-copy');
    run(dest, { TOME_BOOKS: `${rootLayout},${declared}` });

    expect(Object.keys(tree(join(dest, 'root-layout')))).toEqual([
      'book.meta.json',
      'img/sigil.png',
      'one.md',
      'SUMMARY.md',
      'two/two.md',
    ]);
    expect(Object.keys(tree(join(dest, 'declared-build')))).toEqual([
      'book.meta.json',
      'book.toml',
      'book/chapter.md',
      'page.md',
      'SUMMARY.md',
    ]);
  });

  it('test_personal_build_leaves_checkout_clean: a tome.local.toml book publishes outside tracked files', () => {
    const personal = book('campaign');
    const repo = join(tmp, 'repo');
    const sampleFile = 'src/content/books/tome/SUMMARY.md';
    makeBook(repo, {
      [sampleFile]: '# Committed sample\n',
      '.gitignore': '/src/content/library/\n/tome.local.toml\n',
      'tome.config.toml': '# tracked template — no books\n',
    });
    const git = (...args: string[]) =>
      execFileSync(
        'git',
        [
          '-c',
          'core.autocrlf=false',
          '-c',
          'user.name=t',
          '-c',
          'user.email=t@example.invalid',
          ...args,
        ],
        { cwd: repo, encoding: 'utf8' },
      );
    git('init', '--quiet');
    git('add', '--', '.');
    git('commit', '--quiet', '-m', 'sample');
    writeFileSync(
      join(repo, 'tome.local.toml'),
      `[[book]]\npath = ${JSON.stringify(personal)}\n`,
    );

    run(null, {}, [], repo);

    expect(readdirSync(join(repo, 'src/content/library'))).toEqual([
      'campaign',
    ]);
    expect(git('status', '--porcelain=v1', '--untracked-files=all')).toBe('');
    expect(readFileSync(join(repo, sampleFile), 'utf8')).toBe(
      '# Committed sample\n',
    );
    expect(readFileSync(join(repo, 'tome.config.toml'), 'utf8')).toBe(
      '# tracked template — no books\n',
    );
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
      'assets/unreferenced.svg': '<svg data-unused="true"/>',
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
      existsSync(join(out, PARENT_ASSET_DIR, 'assets', 'unreferenced.svg')),
    ).toBe(false);
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

// INT-0029 — a Markdown file, a Word document, or a folder of them as a tome.
// Reading a document loads the Word reader, which takes a couple of seconds a
// run, so these cases get more than the default five.
describe(
  'load-books.mjs — documents and loose folders (INT-0029)',
  {
    timeout: 60_000,
  },
  () => {
    let tmp: string;
    let paper: Buffer;
    const PNG = Buffer.from('a regular file with an image name');

    function put(base: string, files: Record<string, string | Buffer>): string {
      for (const [rel, content] of Object.entries(files)) {
        const full = join(base, rel);
        mkdirSync(dirname(full), { recursive: true });
        writeFileSync(full, content);
      }
      return base;
    }
    /** Every file under `dir` with its hash, links not followed. */
    function hashes(dir: string, base = dir): Record<string, string> {
      const out: Record<string, string> = {};
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = join(dir, entry.name);
        if (entry.isDirectory()) Object.assign(out, hashes(full, base));
        else
          out[full.slice(base.length + 1).replace(/\\/g, '/')] = createHash(
            'sha256',
          )
            .update(readFileSync(full))
            .digest('hex');
      }
      return out;
    }
    const meta = (dir: string) =>
      JSON.parse(readFileSync(join(dir, 'book.meta.json'), 'utf8'));
    const text = (...parts: string[]) => readFileSync(join(...parts), 'utf8');

    beforeAll(async () => {
      tmp = mkdtempSync(join(tmpdir(), 'tome-docs-'));
      paper = await buildDocx();
    });
    afterAll(() => rmSync(tmp, { recursive: true, force: true }));

    it('test_loader_markdown_file: one .md file is a tome of one chapter', () => {
      const base = put(join(tmp, 'md'), {
        'My Paper.md': '# The Real Title\n\nBody text.\n',
        'untitled note.md': 'No heading at all.\n',
      });
      const dest = join(base, 'out');
      run(dest, { TOME_BOOK: join(base, 'My Paper.md') });
      const tome = join(dest, 'my-paper');
      expect(text(tome, 'README.md')).toBe('# The Real Title\n\nBody text.\n');
      expect(text(tome, 'SUMMARY.md')).toBe(
        '# The Real Title\n\n[The Real Title](README.md)\n',
      );
      expect(meta(tome).title).toBe('The Real Title');
      expect(readdirSync(dest)).toEqual(['my-paper']);

      const dest2 = join(base, 'out2');
      run(dest2, { TOME_BOOK: join(base, 'untitled note.md') });
      expect(meta(join(dest2, 'untitled-note')).title).toBe('untitled note');
    });

    it('test_loader_word_file: one .docx file is converted, with its image', () => {
      const base = put(join(tmp, 'word'), { 'paper.docx': paper });
      const dest = join(base, 'out');
      run(dest, { TOME_BOOK: join(base, 'paper.docx') });
      const tome = join(dest, 'paper');
      const chapter = text(tome, 'README.md');
      expect(chapter).toContain('# On the Weight of Obsidian');
      expect(chapter).toContain('## The Quarry');
      expect(chapter).toContain(
        '![A plate of the first tablet](./__tome_media__/README/image-1.png)',
      );
      expect(
        existsSync(join(tome, '__tome_media__', 'README', 'image-1.png')),
      ).toBe(true);
      expect(meta(tome).title).toBe('On the Weight of Obsidian');
      expect(text(tome, 'SUMMARY.md')).toContain(
        '[On the Weight of Obsidian](README.md)',
      );
    });

    it('test_loader_document_titles: a manifest title and slug win', () => {
      const base = put(join(tmp, 'titles'), { 'paper.docx': paper });
      const config = join(base, 'tome.config.toml');
      writeFileSync(
        config,
        `[[book]]\npath = "paper.docx"\ntitle = "Chosen Title"\nslug = "chosen"\n`,
      );
      const dest = join(base, 'out');
      run(dest, {}, ['--config', config]);
      expect(readdirSync(dest)).toEqual(['chosen']);
      expect(meta(join(dest, 'chosen')).title).toBe('Chosen Title');
      expect(text(dest, 'chosen', 'SUMMARY.md')).toMatch(/^# Chosen Title\n/);
    });

    it('test_loader_document_folder: one chapter per document, in order, and nothing else', () => {
      const base = put(join(tmp, 'folder', 'My Vault'), {
        'README.md': '# Welcome\n\nStart here.\n',
        '2-b.md': '# Second\n\n![a plate](img/plate.png)\n',
        '10-a.docx': paper,
        'letters/one.md': '# To Mara\n',
        'img/plate.png': PNG,
        'notes.pdf': 'not read',
        'unused.png': PNG,
      });
      const dest = join(tmp, 'folder', 'out');
      run(dest, { TOME_BOOK: base });
      const tome = join(dest, 'my-vault');
      expect(Object.keys(tree(tome))).toEqual([
        '__tome_media__/10-a/image-1.png',
        '__tome_parent_assets__/img/plate.png',
        '10-a.md',
        '2-b.md',
        'book.meta.json',
        'letters/one.md',
        'README.md',
        'SUMMARY.md',
      ]);
      expect(text(tome, 'SUMMARY.md')).toBe(
        [
          '# My Vault',
          '',
          '[Welcome](README.md)',
          '',
          '- [Second](2-b.md)',
          '- [On the Weight of Obsidian](10-a.md)',
          '',
          '# letters',
          '',
          '- [To Mara](letters/one.md)',
          '',
        ].join('\n'),
      );
      expect(meta(tome).title).toBe('My Vault');
      expect(text(tome, '2-b.md')).toContain(
        '![a plate](./__tome_parent_assets__/img/plate.png)',
      );
    });

    it('test_loader_word_images_apart: each Word chapter has its own image file', () => {
      const base = put(join(tmp, 'apart', 'vault'), {
        'a.docx': paper,
        'letters/b.docx': paper,
      });
      const dest = join(tmp, 'apart', 'out');
      run(dest, { TOME_BOOK: base });
      const tome = join(dest, 'vault');
      const imageOf = (chapter: string) => {
        const target = text(tome, chapter).match(/!\[[^\]]*\]\(([^)]+)\)/)![1]!;
        return join(dirname(join(tome, chapter)), target);
      };
      const first = imageOf('a.md');
      const second = imageOf(join('letters', 'b.md'));
      expect(existsSync(first)).toBe(true);
      expect(existsSync(second)).toBe(true);
      expect(first).not.toBe(second);
      expect(text(tome, 'letters', 'b.md')).toContain(
        '](../__tome_media__/letters/b/image-1.png)',
      );
    });

    it('test_loader_word_equations: a paper’s equations reach the library as LaTeX, with nothing reported', () => {
      const base = put(join(tmp, 'equations', 'vault'), {
        'paper.docx': paper,
      });
      const dest = join(tmp, 'equations', 'out');
      const out = run(dest, { TOME_BOOK: join(base, 'paper.docx') });
      const chapter = text(dest, 'paper', 'README.md');
      expect(chapter).toContain('Density is $\\frac{m}{V}$(see the table)');
      expect(chapter).toContain('$$E=mc^{2}$$');
      expect(chapter).not.toContain('equation not shown');
      expect(out).not.toMatch(/left out/);
    });

    it('test_loader_reports_left_out: one line per document that left something out', async () => {
      // One equation the converter knows, and one it does not.
      const partly = await buildDocx(undefined, {
        replace: {
          'word/document.xml': (xml: string) =>
            xml.replace('<m:oMath><m:f>', '<m:oMath><m:mystery/><m:f>'),
        },
      });
      const base = put(join(tmp, 'report', 'vault'), {
        'paper.docx': partly,
        'note.md': '# Note\n\n![gone](missing.png)\n',
        'clean.md': '# Clean\n',
      });
      const out = run(join(tmp, 'report', 'out'), { TOME_BOOK: base });
      expect(out).toMatch(/paper\.docx: left out 1 equation(?!s)/);
      expect(out).toMatch(/note\.md: left out 1 image/);
      expect(out).not.toMatch(/clean\.md/);
      expect(out.match(/left out/g)).toHaveLength(2);
    });

    it('test_loader_reports_left_out: a chart and an unrecognised element are named too', async () => {
      const figures = await buildDocx(undefined, {
        replace: {
          'word/document.xml': (xml: string) =>
            xml
              .replace(
                '<w:document ',
                '<w:document xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" ',
              )
              .replace(
                '<w:sectPr/>',
                '<w:p><w:r><w:drawing><wp:inline><wp:extent cx="1" cy="1"/>' +
                  '<wp:docPr id="9" name="chart"/><a:graphic><a:graphicData ' +
                  'uri="http://schemas.openxmlformats.org/drawingml/2006/chart">' +
                  '<c:chart r:id="rId77"/></a:graphicData></a:graphic></wp:inline>' +
                  '</w:drawing></w:r></w:p>' +
                  '<w:p><w:r><w:t>kept</w:t></w:r><w:r><w:madeUpThing/></w:r></w:p>' +
                  '<w:sectPr/>',
              ),
        },
      });
      const base = put(join(tmp, 'report-figures'), {
        'figures.docx': figures,
      });
      const dest = join(base, 'out');
      const out = run(dest, { TOME_BOOK: join(base, 'figures.docx') });
      expect(out).toContain(
        'figures.docx: left out 1 chart or diagram, ' +
          '1 element the Word reader did not recognise (w:madeUpThing)',
      );
      expect(text(dest, 'figures', 'README.md')).toContain('figure not shown');
    });

    it('test_loader_document_folder: a note named Summary keeps its chapter beside the spine', (context) => {
      const base = put(join(tmp, 'summary-note', 'vault'), {
        'Summary.md': '# My Own Summary\n\nA note, not a spine.\n',
        'other.md': '# Other\n',
      });
      // Where the file system ignores case (Windows, macOS), `Summary.md` IS
      // the name of an mdBook's spine and the folder is read as a book, as it
      // always was. The case below is for file systems that tell them apart.
      if (existsSync(join(base, 'SUMMARY.md'))) context.skip();
      const dest = join(tmp, 'summary-note', 'out');
      run(dest, { TOME_BOOK: base });
      const tome = join(dest, 'vault');
      expect(text(tome, 'summary-2.md')).toContain('A note, not a spine.');
      expect(text(tome, 'SUMMARY.md')).toContain(
        '- [My Own Summary](summary-2.md)',
      );
    });

    it('test_loader_folder_unreadable_document: one bad Word file does not stop the rest', () => {
      const base = put(join(tmp, 'unreadable', 'vault'), {
        'good.md': '# Good\n',
        'broken.docx': 'plain text under a Word name\n',
      });
      const dest = join(tmp, 'unreadable', 'out');
      const out = run(dest, { TOME_BOOK: base });
      const tome = join(dest, 'vault');
      expect(out).toMatch(/broken\.docx: left out the whole document/);
      expect(text(tome, 'SUMMARY.md')).toContain('- [broken](broken.md)');
      expect(text(tome, 'SUMMARY.md')).toContain('- [Good](good.md)');
      expect(text(tome, 'broken.md')).toContain('document not shown');
      expect(text(tome, 'broken.md')).toMatch(/^# broken\n/);
    });

    it('test_loader_document_failure_keeps_library: a bad entry leaves the library as it was', () => {
      const base = put(join(tmp, 'failure'), {
        'broken.docx': 'plain text under a Word name\n',
        'old.doc': 'the older Word format',
      });
      const dest = join(base, 'out');
      run(dest, { TOME_BOOK: fixture });
      const before = tree(dest);

      for (const name of ['broken.docx', 'old.doc', 'missing.docx']) {
        const { code, stderr } = runExpectError(dest, {
          TOME_BOOK: join(base, name),
        });
        expect(code, name).not.toBe(0);
        expect(stderr, name).toContain(name);
        expect(tree(dest), name).toEqual(before);
        expect(stageResidue(dest), name).toEqual([]);
      }
    });

    it('test_loader_sources_untouched: nothing is changed or written in the source', () => {
      const base = put(join(tmp, 'untouched', 'vault'), {
        'paper.docx': paper,
        'note.md': '---\ntitle: Settings\n---\n![a](img/plate.png)\n',
        'letters/one.md': '# One\n',
        'img/plate.png': PNG,
      });
      const before = hashes(base);
      run(join(tmp, 'untouched', 'out'), { TOME_BOOK: base });
      expect(hashes(base)).toEqual(before);
      expect(readdirSync(join(tmp, 'untouched')).sort()).toEqual([
        'out',
        'vault',
      ]);
    });

    it('test_loader_book_unchanged: an mdBook publishes exactly what it did before Sprint 24', () => {
      // Digests of the published trees (sorted relative paths and their text,
      // line endings normalized), recorded from the loader at commit 06cdbcd.
      const recorded: Record<string, string> = {
        handbook:
          '0b97f999d3114c67dd7a9999a86d8864f4c35bede5b8991a3e4fcb97ea065fc0',
        'docs-book':
          '83cdf0ca0da69802494bf43a8039f508b28791a3278589c33322bf6992079d37',
      };
      for (const [name, digest] of Object.entries(recorded)) {
        const dest = join(tmp, 'unchanged', name);
        run(dest, { TOME_BOOK: join(root, 'fixtures', name) });
        const hash = createHash('sha256');
        for (const [rel, content] of Object.entries(tree(dest)).sort(
          ([a], [b]) => (a < b ? -1 : a > b ? 1 : 0),
        )) {
          hash.update(`${rel}\0`);
          hash.update(`${content.split('\r\n').join('\n')}\0`);
        }
        expect(hash.digest('hex'), name).toBe(digest);
      }
    });

    it('test_loader_mixes_kinds: documents and mdBooks side by side', () => {
      const base = put(join(tmp, 'mixed'), {
        'note.md': '# A Note\n',
        'paper.docx': paper,
      });
      const config = join(base, 'tome.config.toml');
      writeFileSync(
        config,
        `[[book]]\npath = ${JSON.stringify(fixture)}\n\n[[book]]\npath = "note.md"\n`,
      );
      const byManifest = join(base, 'out-manifest');
      run(byManifest, {}, ['--config', config]);
      expect(readdirSync(byManifest).sort()).toEqual(['handbook', 'note']);
      expect(existsSync(join(byManifest, 'handbook', 'first.md'))).toBe(true);
      expect(existsSync(join(byManifest, 'note', 'README.md'))).toBe(true);

      const byEnv = join(base, 'out-env');
      run(byEnv, { TOME_BOOKS: `${fixture},${join(base, 'paper.docx')}` });
      expect(readdirSync(byEnv).sort()).toEqual(['handbook', 'paper']);
      expect(meta(join(byEnv, 'paper')).title).toBe(
        'On the Weight of Obsidian',
      );
    });
  },
);
