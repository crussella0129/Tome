// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import net from 'node:net';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve, sep } from 'node:path';

// INT-0033 — ask pandoc for a paper's tree (scripts/pandoc-read.mjs).
//
// Every file this module opens is recorded, so a test can say that none lies
// outside the paper's folder. (Pandoc's own program file is read by its
// package through `node:fs`, not through this wrapper.)
const opened: string[] = [];
vi.mock('node:fs/promises', async (original) => {
  const real = await original<typeof import('node:fs/promises')>();
  return {
    ...real,
    default: real,
    readFile: (file: unknown, ...rest: unknown[]) => {
      opened.push(String(file));
      return (real.readFile as (...args: unknown[]) => Promise<unknown>)(file, ...rest);
    },
  };
});

const { LIMITS, PaperRefused, readPaper } = await import('../../../scripts/pandoc-read.mjs');

const projectRoot = process.cwd();
const fixtures = join(projectRoot, 'fixtures');
const kept = (name: string) =>
  JSON.parse(readFileSync(join(projectRoot, 'src/lib/__tests__/papers', name), 'utf8'));

type Node = { t?: string; c?: unknown };
/** Every node of a kind in a tree. */
function nodes(tree: unknown, kind: string): Node[] {
  const found: Node[] = [];
  const walk = (value: unknown) => {
    if (Array.isArray(value)) return value.forEach(walk);
    if (value && typeof value === 'object') {
      const node = value as Node;
      if (node.t === kind) found.push(node);
      Object.values(value).forEach(walk);
    }
  };
  walk(tree);
  return found;
}
/** The words of a tree, in order. */
function words(tree: unknown): string {
  const out: string[] = [];
  const walk = (value: unknown) => {
    if (Array.isArray(value)) return value.forEach(walk);
    if (value && typeof value === 'object') {
      const node = value as Node;
      if (node.t === 'Str') out.push(String(node.c));
      else if (node.t === 'Space' || node.t === 'SoftBreak') out.push(' ');
      else Object.values(value).forEach(walk);
    }
  };
  walk(tree);
  return out.join('');
}
const headings = (tree: { blocks: unknown[] }) => nodes(tree.blocks, 'Header').map((h) => words(h));

function write(root: string, files: Record<string, string>) {
  for (const [rel, content] of Object.entries(files)) {
    const full = join(root, rel);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, content);
  }
}
/** Names, sizes, bytes and modification times of every file under a folder. */
function snapshot(root: string): string[] {
  const out: string[] = [];
  const visit = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) =>
      a.name < b.name ? -1 : 1,
    )) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) visit(full);
      else {
        const info = statSync(full);
        out.push(
          `${relative(root, full)}|${info.size}|${info.mtimeMs}|${readFileSync(full).toString('base64')}`,
        );
      }
    }
  };
  visit(root);
  return out;
}

const DOC = (body: string, preamble = '') =>
  String.raw`\documentclass{article}` +
  `\n${preamble}\n` +
  String.raw`\begin{document}` +
  `\n${body}\n` +
  String.raw`\end{document}` +
  '\n';

let tmp: string;
beforeAll(() => {
  tmp = mkdtempSync(join(tmpdir(), 'tome-pandoc-'));
});
afterAll(() => rmSync(tmp, { recursive: true, force: true }));

describe('pandoc-read.mjs — a LaTeX paper (INT-0033 AC1, AC4, AC5)', () => {
  it('test_pandoc_latex_tree: the paper as a tree, and the tree the unit tests keep', async () => {
    const read = await readPaper(
      { file: join(fixtures, 'latex', 'paper.tex'), format: 'latex' },
      { nonce: 'T' },
    );
    expect(Object.keys(read.tree.meta).sort()).toEqual(['abstract', 'author', 'date', 'title']);
    expect(nodes(read.tree, 'Math').length).toBeGreaterThanOrEqual(16);
    const section = nodes(read.tree.blocks, 'Link').find((link) => {
      const [attr] = link.c as [[string, string[], [string, string][]]];
      return attr[2].some(([key, value]) => key === 'reference' && value === 'sec:result');
    });
    expect(words(section)).toBe('2');
    expect(read).toEqual(kept('latex-tree.json'));
  }, 60_000);

  it('test_pandoc_own_files: files beside the paper and in folders within it, and none from outside', async () => {
    const read = await readPaper({ file: join(fixtures, 'latex', 'paper.tex'), format: 'latex' });
    expect(headings(read.tree)).toEqual(expect.arrayContaining(['Appendix', 'Closing']));
    expect(read.missing).toEqual([]);
    expect(
      read.skipped.find((entry: { contents: string }) => entry.contents === String.raw`\appcmd{y}`)
        ?.source,
    ).toBe('appendix.tex');

    const root = join(tmp, 'own');
    write(root, {
      'outside.tex': 'OUTSIDEWORD here.\n',
      'p/paper.tex': DOC(
        String.raw`Main. \input{sections/closing} \include{sections/more} \input{../outside} \input{absent} \hh{} \sec{viamacro} End.`,
        String.raw`\usepackage{house}` +
          '\n' +
          String.raw`\newcommand{\sec}[1]{\input{sections/#1}}`,
      ),
      'p/sections/closing.tex':
        String.raw`CLOSINGWORD \closingcmd{z} \input{sections/deeper/last}` + '\n',
      'p/sections/more.tex': 'MOREWORD\n',
      'p/sections/viamacro.tex': 'MACROWORD\n',
      'p/sections/deeper/last.tex': 'LASTWORD\n',
      'p/house.sty': String.raw`\newcommand{\hh}{HOUSEWORD}` + '\n',
    });
    let linked = true;
    try {
      symlinkSync(join(root, 'outside.tex'), join(root, 'p', 'linked.tex'), 'file');
      writeFileSync(
        join(root, 'p', 'paper.tex'),
        readFileSync(join(root, 'p', 'paper.tex'), 'utf8').replace(
          'End.',
          String.raw`\input{linked} End.`,
        ),
      );
    } catch {
      linked = false; // links cannot be made here; the rest still holds
    }
    const own = await readPaper({ file: join(root, 'p', 'paper.tex'), format: 'latex' });
    const text = words(own.tree.blocks);
    for (const word of ['CLOSINGWORD', 'MOREWORD', 'LASTWORD', 'HOUSEWORD']) {
      expect(text, word).toContain(word);
    }
    expect(text).not.toContain('OUTSIDEWORD');
    expect(text).not.toContain('MACROWORD');
    expect(own.missing).toEqual(
      expect.arrayContaining(['../outside.tex', 'absent.tex', 'sections/viamacro.tex']),
    );
    if (linked) expect(own.missing).toContain('linked.tex');
    expect(own.missing.some((name: string) => name.endsWith('.sty'))).toBe(false);
    expect(
      own.skipped.find((entry: { contents: string }) =>
        entry.contents.startsWith(String.raw`\closingcmd`),
      )?.source,
    ).toBe('sections/closing.tex');
  }, 120_000);

  it('test_pandoc_bibliography: a .bib that is there is worked out; one that is not is named', async () => {
    const bib =
      '@book{gauss, author={Gauss, Carl Friedrich}, title={Disquisitiones}, year={1801}}\n';
    const paper = (names: string) =>
      DOC(
        String.raw`Known to Gauss \cite{gauss}.` +
          '\n' +
          String.raw`\bibliographystyle{plain}\bibliography{` +
          names +
          '}',
      );
    const refLinks = (tree: unknown) =>
      nodes(tree, 'Link').map((link) => (link.c as [unknown, unknown, [string, string]])[2][0]);
    const hasList = (tree: unknown) =>
      nodes(tree, 'Div').some((div) => (div.c as [[string]])[0][0] === 'refs');

    const beside = join(tmp, 'bib-beside');
    write(beside, { 'paper.tex': paper('refs,more'), 'refs.bib': bib });
    const one = await readPaper({ file: join(beside, 'paper.tex'), format: 'latex' });
    expect(refLinks(one.tree)).toContain('#ref-gauss');
    expect(hasList(one.tree)).toBe(true);
    expect(one.missing).toEqual(['more.bib']);

    const within = join(tmp, 'bib-within');
    write(within, { 'paper.tex': paper('bib/refs'), 'bib/refs.bib': bib });
    const two = await readPaper({ file: join(within, 'paper.tex'), format: 'latex' });
    expect(refLinks(two.tree)).toContain('#ref-gauss');
    expect(two.missing).toEqual([]);

    const none = join(tmp, 'bib-none');
    write(none, { 'paper.tex': paper('refs,more') });
    const three = await readPaper({ file: join(none, 'paper.tex'), format: 'latex' });
    expect(nodes(three.tree, 'Cite')).toHaveLength(1);
    expect(hasList(three.tree)).toBe(false);
    expect(three.missing).toEqual(['refs.bib', 'more.bib']);

    const typst = await readPaper({ file: join(fixtures, 'typst', 'paper.typ'), format: 'typst' });
    expect(refLinks(typst.tree)).toContain('#ref-gauss');
    expect(hasList(typst.tree)).toBe(true);
  }, 120_000);

  it('test_pandoc_skipped_placed: each piece once, with its file and line, and its word in the tree', async () => {
    const read = await readPaper(
      { file: join(fixtures, 'latex', 'paper.tex'), format: 'latex' },
      { nonce: 'T' },
    );
    const contents = read.skipped.map((entry: { contents: string }) => entry.contents);
    for (const piece of [
      String.raw`\mycmd{x}`,
      String.raw`\maketitle`,
      String.raw`\appcmd{y}`,
      String.raw`\bibitem{gauss}`,
      String.raw`\begin{thebibliography}`,
      String.raw`\end{thebibliography}`,
    ]) {
      expect(
        contents.filter((value: string) => value === piece),
        piece,
      ).toHaveLength(1);
    }
    expect(contents.filter((value: string) => value === String.raw`\centering`)).toHaveLength(2);
    expect(contents.filter((value: string) => value.startsWith(String.raw`\quad`))).toHaveLength(1);
    // The drawing was typed with a tab before each of its three lines.
    const drawing = read.skipped.find((entry: { contents: string }) =>
      entry.contents.startsWith(String.raw`\begin{tikzpicture}`),
    );
    expect(drawing!.contents).toContain(String.raw`\end{tikzpicture}`);
    expect(readFileSync(join(fixtures, 'latex', 'paper.tex'), 'utf8')).toContain(
      '\t' + String.raw`\begin{tikzpicture}`,
    );
    const whole = JSON.stringify(read.tree);
    const keys = new Set<string>();
    for (const entry of read.skipped) {
      expect(entry.placed, entry.contents).toBe(true);
      expect(whole.split(entry.token).length - 1, entry.contents).toBeGreaterThanOrEqual(1);
      expect(entry.line).toBeGreaterThan(0);
      expect(['paper.tex', 'appendix.tex', 'sections/closing.tex']).toContain(entry.source);
      keys.add(`${entry.source}|${entry.line}|${entry.contents}`);
    }
    expect(keys.size).toBe(read.skipped.length);

    const before = join(tmp, 'preamble');
    write(before, {
      'paper.tex': DOC('Text.', String.raw`\institute{Somewhere}`),
    });
    const preamble = await readPaper({ file: join(before, 'paper.tex'), format: 'latex' });
    const institute = preamble.skipped.find((entry: { contents: string }) =>
      entry.contents.startsWith(String.raw`\institute`),
    );
    expect(institute!.placed).toBe(false);
  }, 120_000);

  it('test_pandoc_today: the day a library is built is never written', async () => {
    const read = await readPaper({ file: join(fixtures, 'latex', 'paper.tex'), format: 'latex' });
    const today = read.skipped.find(
      (entry: { contents: string }) => entry.contents === String.raw`\today`,
    );
    expect(today!.placed).toBe(true);
    expect(words(read.tree.meta.date)).toBe(today!.token);

    const dir = join(tmp, 'today');
    write(dir, {
      'paper.tex': DOC(
        String.raw`Written \today.` +
          '\n\n' +
          String.raw`Code \verb|\today| stays.` +
          '\n\n' +
          String.raw`\begin{verbatim}` +
          '\n' +
          String.raw`\today` +
          '\n' +
          String.raw`\end{verbatim}`,
      ),
    });
    const text = await readPaper({ file: join(dir, 'paper.tex'), format: 'latex' });
    const pieces = text.skipped.filter(
      (entry: { contents: string }) => entry.contents === String.raw`\today`,
    );
    expect(pieces).toHaveLength(1);
    const written = words(text.tree.blocks);
    expect(written).toContain(`Written ${pieces[0].token}.`);
    expect(written).not.toContain(String(new Date().getFullYear()));
    const code = [...nodes(text.tree, 'Code'), ...nodes(text.tree, 'CodeBlock')].map(
      (node) => (node.c as [unknown, string])[1],
    );
    expect(code).toEqual([String.raw`\today`, String.raw`\today`]);
  }, 120_000);
});

describe('pandoc-read.mjs — a Typst paper, and a paper pandoc refuses (INT-0033 AC1, AC5)', () => {
  it('test_pandoc_typst_tree: the paper with the files it includes and imports', async () => {
    const read = await readPaper({ file: join(fixtures, 'typst', 'paper.typ'), format: 'typst' });
    expect(read.skipped).toEqual([]);
    expect(headings(read.tree)).toEqual(expect.arrayContaining(['Appendix', 'Closing']));
    expect(words(read.tree.blocks)).toContain('so, loudly!');
    expect(nodes(read.tree, 'Math').length).toBeGreaterThanOrEqual(15);
    expect(read).toEqual(kept('typst-tree.json'));

    const root = join(tmp, 'typst-deep');
    cpSync(join(fixtures, 'typst'), root, { recursive: true });
    write(root, {
      'parts/closing.typ': '== Closing\n\nCLOSINGWORD\n\n#include "deeper/last.typ"\n',
      'parts/deeper/last.typ': 'LASTWORD\n',
      'rooted.typ': '= Rooted\n\n#include "/parts/closing.typ"\n',
    });
    const deep = await readPaper({ file: join(root, 'paper.typ'), format: 'typst' });
    expect(words(deep.tree.blocks)).toContain('LASTWORD');
    const rooted = await readPaper({ file: join(root, 'rooted.typ'), format: 'typst' });
    expect(words(rooted.tree.blocks)).toContain('CLOSINGWORD');
  }, 120_000);

  it('test_pandoc_refused: pandoc’s own reason, and no path from this machine', async () => {
    const refusal = async (file: string, format: 'latex' | 'typst'): Promise<Error> => {
      try {
        await readPaper({ file, format });
      } catch (error) {
        return error as Error;
      }
      throw new Error(`expected ${file} to be refused`);
    };
    const pack = await refusal(join(fixtures, 'typst', 'uses-a-package.typ'), 'typst');
    expect(pack).toBeInstanceOf(PaperRefused);
    expect(pack.message).toContain('HOME not defined');

    const dir = join(tmp, 'refused');
    write(dir, {
      'fn.typ': '= One\n\nCall #unknownfn(1) here.\n',
      'inc.typ': '= One\n\n#include "parts/absent.typ"\n',
      'bad.tex':
        String.raw`\documentclass{article}` + '\n' + String.raw`\begin{document` + '\nText.\n',
    });
    const fn = await refusal(join(dir, 'fn.typ'), 'typst');
    expect(fn).toBeInstanceOf(PaperRefused);
    expect(fn.message).toContain('unknownfn');
    expect(fn.message).toContain('line 3');
    const inc = await refusal(join(dir, 'inc.typ'), 'typst');
    expect(inc).toBeInstanceOf(PaperRefused);
    expect(inc.message).toContain('parts/absent.typ');
    const bad = await refusal(join(dir, 'bad.tex'), 'latex');
    expect(bad).toBeInstanceOf(PaperRefused);
    for (const error of [pack, fn, inc, bad]) {
      expect(error.message).not.toContain(tmp);
      expect(error.message).not.toContain(projectRoot);
      expect(error.message).not.toMatch(/tomefile\d/);
    }
  }, 120_000);
});

describe('pandoc-read.mjs — what it touches (INT-0033 AC6)', () => {
  it('test_pandoc_reads_only_its_folder: every file opened lies in the paper’s folder', async () => {
    const root = join(tmp, 'only');
    write(root, {
      'outside.tex': 'OUTSIDEWORD\n',
      'p/paper.tex': DOC(String.raw`Main. \input{../outside} \input{appendix}`),
      'p/appendix.tex': 'Appendix words.\n',
    });
    const papers: [string, 'latex' | 'typst'][] = [
      [join(fixtures, 'latex', 'paper.tex'), 'latex'],
      [join(fixtures, 'typst', 'paper.typ'), 'typst'],
      [join(root, 'p', 'paper.tex'), 'latex'],
    ];
    for (const [file, format] of papers) {
      opened.length = 0;
      await readPaper({ file, format });
      expect(opened.length).toBeGreaterThan(0);
      const folder = resolve(dirname(file)) + sep;
      for (const path of opened) expect(resolve(path).startsWith(folder), path).toBe(true);
    }
  }, 120_000);

  it('test_pandoc_writes_nothing: names, sizes, bytes and times are as they were', async () => {
    const root = join(tmp, 'untouched');
    cpSync(join(fixtures, 'latex'), join(root, 'latex'), { recursive: true });
    cpSync(join(fixtures, 'typst'), join(root, 'typst'), { recursive: true });
    const before = snapshot(root);
    await readPaper({ file: join(root, 'latex', 'paper.tex'), format: 'latex' });
    await readPaper({ file: join(root, 'typst', 'paper.typ'), format: 'typst' });
    await expect(
      readPaper({ file: join(root, 'typst', 'uses-a-package.typ'), format: 'typst' }),
    ).rejects.toBeInstanceOf(PaperRefused);
    expect(snapshot(root)).toEqual(before);
  }, 120_000);

  it('test_pandoc_fetches_nothing: no connection is made', async () => {
    let calls = 0;
    const fetching = vi.spyOn(globalThis, 'fetch').mockImplementation(() => {
      calls += 1;
      throw new Error('no network in this test');
    });
    const connecting = vi.spyOn(net.Socket.prototype, 'connect').mockImplementation(() => {
      calls += 1;
      throw new Error('no network in this test');
    });
    try {
      await readPaper({ file: join(fixtures, 'latex', 'paper.tex'), format: 'latex' });
      await readPaper({ file: join(fixtures, 'typst', 'paper.typ'), format: 'typst' });
    } finally {
      fetching.mockRestore();
      connecting.mockRestore();
    }
    expect(calls).toBe(0);
  }, 120_000);

  it('test_pandoc_is_a_dependency: pinned to one version', () => {
    const manifest = JSON.parse(readFileSync(join(projectRoot, 'package.json'), 'utf8'));
    expect(manifest.dependencies['pandoc-wasm']).toMatch(/^\d+\.\d+\.\d+$/);
  });
});

describe('pandoc-read.mjs — with a stand-in for pandoc (INT-0033 AC5, AC6)', () => {
  const tree = (text: string) => ({
    blocks: [{ t: 'Para', c: text.split(' ').map((word) => ({ t: 'Str', c: word })) }],
    meta: {},
  });
  const answer = (value: unknown, warnings: unknown[] = []) => ({
    stdout: JSON.stringify(value),
    stderr: '',
    warnings,
  });
  const skip = (contents: string, line: number, column: number, source = 'paper.tex') => ({
    type: 'SkippedContent',
    contents,
    source,
    line,
    column,
  });
  let dir: string;
  beforeAll(() => {
    dir = join(tmp, 'stand-in');
    write(dir, { 'paper.tex': String.raw`One \mycmd{x} two \mycmd{x} three.` + '\n' });
  });

  it('test_pandoc_skipped_once: a piece reported four times at one place is one entry', async () => {
    const first = String.raw`\mycmd{x}`;
    const convert = vi.fn(
      async (_options: unknown, _stdin: unknown, files: Record<string, string>) => {
        const text = files['paper.tex'];
        return answer(tree(text.trim()), [
          skip(first, 1, 14),
          skip(first, 1, 14),
          skip(first, 1, 14),
          skip(first, 1, 14),
          skip(first, 1, 28),
        ]);
      },
    );
    const read = await readPaper(
      { file: join(dir, 'paper.tex'), format: 'latex' },
      { convert, nonce: 'T' },
    );
    expect(read.skipped).toHaveLength(2);
    expect(read.skipped.map((entry: { placed: boolean }) => entry.placed)).toEqual([true, true]);
    expect(words(read.tree.blocks)).toBe(
      `One${read.skipped[0].token}two${read.skipped[1].token}three.`,
    );
  });

  it('test_pandoc_skipped_not_placed: not found at its place, or a word the tree does not keep', async () => {
    const piece = String.raw`\mycmd{x}`;
    // Reported where the file does not hold it.
    const lost = vi.fn(async () =>
      answer(tree('One two three.'), [skip(String.raw`\nothere{y}`, 1, 9)]),
    );
    const one = await readPaper(
      { file: join(dir, 'paper.tex'), format: 'latex' },
      { convert: lost },
    );
    expect(one.skipped).toMatchObject([{ contents: String.raw`\nothere{y}`, placed: false }]);
    expect(JSON.stringify(one.tree)).not.toContain(one.skipped[0].token);
    // Replaced, but the second tree does not hold the word (as before \begin{document}).
    const dropped = vi.fn(async () => answer(tree('One two three.'), [skip(piece, 1, 14)]));
    const two = await readPaper(
      { file: join(dir, 'paper.tex'), format: 'latex' },
      { convert: dropped },
    );
    expect(dropped).toHaveBeenCalledTimes(2);
    expect(two.skipped).toMatchObject([{ contents: piece, placed: false }]);
    // A word that stands only in the title is placed.
    const titled = vi.fn(
      async (_options: unknown, _stdin: unknown, files: Record<string, string>) => {
        const word = files['paper.tex'].match(/tomeSkipped\w+/)?.[0];
        return answer(
          {
            blocks: [],
            meta: word ? { title: { t: 'MetaInlines', c: [{ t: 'Str', c: word }] } } : {},
          },
          [skip(piece, 1, 14)],
        );
      },
    );
    const three = await readPaper(
      { file: join(dir, 'paper.tex'), format: 'latex' },
      { convert: titled },
    );
    expect(three.skipped).toMatchObject([{ contents: piece, placed: true }]);
  });

  it('test_pandoc_second_reading_refused: the first tree is kept, with nothing placed', async () => {
    let calls = 0;
    const convert = vi.fn(async () => {
      calls += 1;
      if (calls === 1) return answer(tree('First reading.'), [skip(String.raw`\mycmd{x}`, 1, 14)]);
      return { stdout: '', stderr: 'ERROR: expecting \\end{document}', warnings: [] };
    });
    const read = await readPaper({ file: join(dir, 'paper.tex'), format: 'latex' }, { convert });
    expect(calls).toBe(2);
    expect(words(read.tree.blocks)).toBe('Firstreading.');
    expect(read.skipped).toMatchObject([{ contents: String.raw`\mycmd{x}`, placed: false }]);
  });

  it('test_pandoc_limits: readings, files and bytes each have an end', async () => {
    const many = join(tmp, 'many');
    const files: Record<string, string> = { 'paper.tex': 'Main.\n' };
    for (let i = 0; i < 30; i++) files[`f${i}.tex`] = `File ${i}.\n`;
    write(many, files);
    // One new file is asked for at every reading.
    const drip = vi.fn(async (_o: unknown, _s: unknown, given: Record<string, string>) => {
      const next = Object.keys(given).length - 1;
      return answer(
        tree('x'),
        next < 30 ? [{ type: 'CouldNotLoadIncludeFile', path: `f${next}.tex` }] : [],
      );
    });
    const dripped = await readPaper(
      { file: join(many, 'paper.tex'), format: 'latex' },
      { convert: drip },
    );
    expect(drip).toHaveBeenCalledTimes(LIMITS.readings);
    expect(dripped.missing).toEqual([`f${LIMITS.readings - 1}.tex`]);

    // More files than the limit, asked for at once.
    const crowd = join(tmp, 'crowd');
    const crowded: Record<string, string> = { 'paper.tex': 'Main.\n' };
    for (let i = 0; i < LIMITS.files + 5; i++) crowded[`g${i}.tex`] = 'x\n';
    write(crowd, crowded);
    const all = Object.keys(crowded).filter((name) => name !== 'paper.tex');
    const flood = vi.fn(async (_o: unknown, _s: unknown, given: Record<string, string>) =>
      answer(
        tree('x'),
        Object.keys(given).length === 1
          ? all.map((path) => ({ type: 'CouldNotLoadIncludeFile', path }))
          : [],
      ),
    );
    const flooded = await readPaper(
      { file: join(crowd, 'paper.tex'), format: 'latex' },
      { convert: flood },
    );
    expect(flooded.missing).toHaveLength(all.length - (LIMITS.files - 1));

    // More bytes than the limit.
    const heavy = join(tmp, 'heavy');
    write(heavy, {
      'paper.tex': 'Main.\n',
      'a.tex': 'a'.repeat(LIMITS.bytes - 100),
      'b.tex': 'b'.repeat(200),
    });
    const weigh = vi.fn(async (_o: unknown, _s: unknown, given: Record<string, string>) =>
      answer(
        tree('x'),
        Object.keys(given).length === 1
          ? [
              { type: 'CouldNotLoadIncludeFile', path: 'a.tex' },
              { type: 'CouldNotLoadIncludeFile', path: 'b.tex' },
            ]
          : [],
      ),
    );
    const weighed = await readPaper(
      { file: join(heavy, 'paper.tex'), format: 'latex' },
      { convert: weigh },
    );
    expect(weighed.missing).toEqual(['b.tex']);

    // A Typst paper that never stops asking is refused with pandoc's reason.
    const endless = join(tmp, 'endless');
    const typ: Record<string, string> = { 'paper.typ': '#include "t0.typ"\n' };
    for (let i = 0; i < 30; i++) typ[`t${i}.typ`] = `#include "t${i + 1}.typ"\n`;
    write(endless, typ);
    const asking = vi.fn(async (_o: unknown, _s: unknown, given: Record<string, string>) => ({
      stdout: '',
      stderr: `ERROR: t${Object.keys(given).length - 1}.typ: withBinaryFile: does not exist`,
      warnings: [],
    }));
    await expect(
      readPaper({ file: join(endless, 'paper.typ'), format: 'typst' }, { convert: asking }),
    ).rejects.toThrow(/withBinaryFile/);
    expect(asking).toHaveBeenCalledTimes(LIMITS.readings);
  });

  it('test_pandoc_loaded_on_call: pandoc is loaded by the first reading, and once', async () => {
    vi.resetModules();
    let loaded = 0;
    vi.doMock('pandoc-wasm', () => {
      loaded += 1;
      return { convert: async () => answer(tree('Stand-in.')) };
    });
    try {
      const fresh = await import('../../../scripts/pandoc-read.mjs');
      expect(loaded).toBe(0);
      await fresh.readPaper({ file: join(dir, 'paper.tex'), format: 'latex' });
      expect(loaded).toBe(1);
      await fresh.readPaper({ file: join(dir, 'paper.tex'), format: 'latex' });
      expect(loaded).toBe(1);
    } finally {
      vi.doUnmock('pandoc-wasm');
      vi.resetModules();
    }
  });
});

// Found by the first review of the tests (sprint-tests/critique-round-1.md).
describe('pandoc-read.mjs — what the first test review found', () => {
  const R = String.raw;
  type Entry = { contents: string; placed: boolean; token: string; source: string; line: number };
  const pieceOf = (read: { skipped: Entry[] }, start: string) =>
    read.skipped.find((entry) => entry.contents.startsWith(start));

  it('test_pandoc_environment_with_option: an environment with an option costs no other piece its place', async () => {
    const dir = join(tmp, 'option');
    write(dir, {
      'paper.tex': DOC(
        [
          R`We use \mycmd{important words} here.`,
          '',
          R`\begin{algorithmic}[1]`,
          R`\State do the thing`,
          R`\end{algorithmic}`,
          '',
          R`\begin{definition}[Compactness]`,
          'A set is compact.',
          R`\end{definition}`,
          '',
          R`\begin{tikzpicture}`,
          R`\draw (0,0) -- (1,1);`,
          R`\end{tikzpicture}`,
          '',
          'Last words.',
        ].join('\n'),
      ),
    });
    const read = await readPaper({ file: join(dir, 'paper.tex'), format: 'latex' });
    const whole = JSON.stringify(read.tree);
    for (const start of [
      R`\mycmd{important words}`,
      R`\begin{algorithmic}[1]`,
      R`\end{algorithmic}`,
      R`\begin{definition}[Compactness]`,
      R`\end{definition}`,
      R`\begin{tikzpicture}`,
    ]) {
      const entry = pieceOf(read, start);
      expect(entry, start).toBeDefined();
      expect(entry!.placed, start).toBe(true);
      expect(whole.split(entry!.token).length - 1, start).toBe(1);
    }
    // The words between an unknown environment's two ends are kept.
    expect(words(read.tree.blocks)).toContain('A set is compact.');
    expect(words(read.tree.blocks)).toContain('Last words.');
  }, 120_000);

  it('test_pandoc_wide_table: a table* is read as a table, with its caption and its number', async () => {
    const dir = join(tmp, 'wide');
    write(dir, {
      'paper.tex': DOC(
        [
          R`We use \mycmd{important words} here.`,
          '',
          R`\begin{table*}[t]`,
          R`\caption{Star table}\label{tab:s}`,
          R`\begin{tabular}{ll} a & b \end{tabular}`,
          R`\end{table*}`,
          '',
          R`See Table~\ref{tab:s}.`,
        ].join('\n'),
      ),
    });
    const before = readFileSync(join(dir, 'paper.tex'), 'utf8');
    const read = await readPaper({ file: join(dir, 'paper.tex'), format: 'latex' });
    const [table] = nodes(read.tree, 'Table');
    expect((table.c as [[string]])[0][0]).toBe('tab:s');
    expect(words((table.c as unknown[])[1])).toContain('Star table');
    const reference = nodes(read.tree, 'Link')[0];
    expect(words(reference)).toBe('1');
    expect(pieceOf(read, R`\mycmd`)!.placed).toBe(true);
    expect(read.skipped.some((entry: Entry) => entry.contents.includes('table'))).toBe(false);
    // The paper itself still says `table*`.
    expect(readFileSync(join(dir, 'paper.tex'), 'utf8')).toBe(before);
  }, 120_000);

  it('test_pandoc_unpaired_environment: an end whose beginning was not found is left where it is', async () => {
    const dir = join(tmp, 'unpaired');
    write(dir, { 'paper.tex': R`Before \begin{myenv} words \end{myenv} after \mycmd{x}.` + '\n' });
    const given: Record<string, string>[] = [];
    const convert = vi.fn(async (_o: unknown, _s: unknown, files: Record<string, string>) => {
      given.push(files);
      return {
        stdout: JSON.stringify({
          blocks: [{ t: 'Para', c: [{ t: 'Str', c: files['paper.tex'] }] }],
          meta: {},
        }),
        stderr: '',
        warnings: [
          // The beginning is reported where the file does not hold it.
          {
            type: 'SkippedContent',
            contents: R`\begin{myenv}`,
            source: 'paper.tex',
            line: 9,
            column: 1,
          },
          {
            type: 'SkippedContent',
            contents: R`\end{myenv}`,
            source: 'paper.tex',
            line: 1,
            column: 39,
          },
          {
            type: 'SkippedContent',
            contents: R`\mycmd{x}`,
            source: 'paper.tex',
            line: 1,
            column: 55,
          },
        ],
      };
    });
    const read = await readPaper({ file: join(dir, 'paper.tex'), format: 'latex' }, { convert });
    expect(given).toHaveLength(2);
    expect(given[1]['paper.tex']).toContain(R`\begin{myenv} words \end{myenv}`);
    expect(given[1]['paper.tex']).not.toContain(R`\mycmd{x}`);
    expect(read.skipped.map((entry: Entry) => entry.placed)).toEqual([false, false, true]);
  });

  it('test_pandoc_crlf: a paper with Windows line ends is read as the same paper', async () => {
    const lf = join(tmp, 'lf');
    const crlf = join(tmp, 'crlf');
    cpSync(join(fixtures, 'latex'), lf, { recursive: true });
    cpSync(join(fixtures, 'latex'), crlf, { recursive: true });
    for (const name of ['paper.tex', 'appendix.tex', join('sections', 'closing.tex')]) {
      const text = readFileSync(join(lf, name), 'utf8');
      expect(text).not.toContain('\r');
      writeFileSync(join(crlf, name), text.replace(/\n/g, '\r\n'));
    }
    const one = await readPaper({ file: join(lf, 'paper.tex'), format: 'latex' }, { nonce: 'T' });
    const two = await readPaper({ file: join(crlf, 'paper.tex'), format: 'latex' }, { nonce: 'T' });
    expect(two).toEqual(one);
    const drawing = pieceOf(two, R`\begin{tikzpicture}`)!;
    expect(drawing.placed).toBe(true);
    expect(drawing.contents).toContain(R`\end{tikzpicture}`);
    expect(readFileSync(join(crlf, 'paper.tex'), 'utf8')).toContain('\r\n');
  }, 120_000);

  it('test_pandoc_input_cycle: files that pull each other in are refused, and soon', async () => {
    const dir = join(tmp, 'cycle');
    write(dir, {
      'paper.tex': DOC(R`Main. \input{a}`),
      'a.tex': R`A words. \input{b}` + '\n',
      'b.tex': R`B words. \input{a}` + '\n',
      'self.tex': DOC(R`Self. \input{self}`),
      'fine.tex': DOC(R`Fine. \input{a2} \input{a2} % \input{fine}`),
      'a2.tex': 'Twice.\n',
      'loop.typ': '= Loop\n\n#include "one.typ"\n',
      'one.typ': 'One.\n\n#include "two.typ"\n',
      'two.typ': 'Two.\n\n#include "one.typ"\n',
    });
    const refused = async (name: string, format: 'latex' | 'typst') => {
      const started = Date.now();
      await expect(readPaper({ file: join(dir, name), format })).rejects.toBeInstanceOf(
        PaperRefused,
      );
      expect(Date.now() - started).toBeLessThan(30_000);
      return readPaper({ file: join(dir, name), format }).catch((error: Error) => error.message);
    };
    expect(await refused('paper.tex', 'latex')).toMatch(/a\.tex → b\.tex → a\.tex/);
    expect(await refused('self.tex', 'latex')).toMatch(/self\.tex → self\.tex/);
    expect(await refused('loop.typ', 'typst')).toMatch(/one\.typ → two\.typ → one\.typ/);
    // The same file twice, and a file named in a comment, are no cycle.
    const fine = await readPaper({ file: join(dir, 'fine.tex'), format: 'latex' });
    expect(words(fine.tree.blocks)).toContain('Twice. Twice.');
  }, 120_000);

  it('test_pandoc_typst_parent_path: a file in a folder may import one from the folder above', async () => {
    const dir = join(tmp, 'parent');
    write(dir, {
      'main.typ': '= Title\n\n#include "chapters/intro.typ"\n',
      'chapters/intro.typ': '#import "../template.typ": note\n\n== Intro\n\n#note[Hello]\n',
      'template.typ': '#let note(body) = [Note: #body]\n',
      'escape.typ': '= Title\n\n#include "../outside.typ"\n',
    });
    writeFileSync(join(tmp, 'outside.typ'), 'OUTSIDEWORD\n');
    const read = await readPaper({ file: join(dir, 'main.typ'), format: 'typst' });
    expect(words(read.tree.blocks)).toContain('Note: Hello');
    expect(read.files.sort()).toEqual(['chapters/intro.typ', 'main.typ', 'template.typ']);
    // A file above the paper's own folder is still not read.
    await expect(readPaper({ file: join(dir, 'escape.typ'), format: 'typst' })).rejects.toThrow(
      /\.\.\/outside\.typ/,
    );
  }, 120_000);
});
