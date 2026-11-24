// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtempSync, mkdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { resolveBookSource } from '../../../scripts/book-source.mjs';
import {
  ACCEPTED,
  documentFormat,
  liveReloadNotice,
  orderDocuments,
  resolveSource,
  stagedNames,
  writeSpine,
} from '../../../scripts/document-source.mjs';
import { hrefToSlug } from '../paths';
import { parseSummary } from '../summary';
import type { ChapterNode } from '../summary.types';

// INT-0029 — a Markdown file, a Word document, or a folder of them as a source.
const projectRoot = process.cwd();

function write(root: string, files: Record<string, string>) {
  for (const [rel, content] of Object.entries(files)) {
    const full = join(root, rel);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, content);
  }
}

async function refusal(path: string): Promise<string> {
  try {
    await resolveSource(path);
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
  throw new Error(`expected ${path} to be refused`);
}

describe('document-source.mjs — what a library entry names (INT-0029 AC1)', () => {
  let tmp: string;
  beforeAll(() => {
    tmp = mkdtempSync(join(tmpdir(), 'tome-docsrc-'));
    write(tmp, {
      'single/paper.md': '# A Paper\n',
      'single/Paper.DOCX': 'not read here',
      'single/old.doc': 'old',
      'single/notes.txt': 'text',
      'single/scan.pdf': 'pdf',
      'broken-src/book.toml': '[book]\nsrc = "missing"\n',
      'toml-only/book.toml': '[book]\ntitle = "No Spine"\n',
      'toml-only/loose.md': '# Loose\n',
      'empty/notes.txt': 'nothing Tome reads\n',
      'vault/top.md': '# Top\n',
      'vault/a/b/c/deep.md': '# Deep\n',
      'vault/a/letter.docx': 'word',
      'vault/.obsidian/config.md': '# hidden\n',
      'vault/.hidden.md': '# hidden file\n',
      'vault/node_modules/pkg/README.md': '# dep\n',
      'vault/target/out.md': '# build\n',
      'vault/dist/out.md': '# build\n',
      'vault/vendor/lib.md': '# vendored\n',
      'vault/venv/notes.md': '# env\n',
      'vault/__pycache__/cached.md': '# cache\n',
      'vault/site-packages/pkg/README.md': '# package\n',
      'vault/nested-spine/SUMMARY.md': '# Summary\n\n- [One](one.md)\n',
      'vault/nested-spine/one.md': '# One\n',
      'vault/nested-toml/book.toml': '[book]\n',
      'vault/nested-toml/chapter.md': '# Chapter\n',
      'vault/proj/README.md': '# Project\n',
      'vault/proj/docs/SUMMARY.md': '# Summary\n\n- [Guide](guide.md)\n',
      'vault/proj/docs/guide.md': '# Guide\n',
      'vault/~$lock.docx': 'lock',
      'outside/secret.md': '# Outside\n',
    });
  });
  afterAll(() => rmSync(tmp, { recursive: true, force: true }));

  it('test_source_book_delegates: an mdBook folder is a book, and a broken one fails as a book', async () => {
    for (const fixture of ['handbook', 'docs-book']) {
      const root = join(projectRoot, 'fixtures', fixture);
      const { kind, ...fields } = await resolveSource(root);
      expect(kind).toBe('book');
      expect(fields).toEqual(await resolveBookSource(root));
    }
    await expect(resolveSource(join(tmp, 'broken-src'))).rejects.toThrow(/declares src="missing"/);
    // A book.toml with no spine is a broken book, never a folder of documents.
    const message = await refusal(join(tmp, 'toml-only'));
    expect(message).toMatch(/no SUMMARY\.md found/);
  });

  it('test_source_document_kinds: a .md or .docx file, whatever its case', async () => {
    const markdown = await resolveSource(join(tmp, 'single', 'paper.md'));
    expect(markdown).toMatchObject({ kind: 'document', root: join(tmp, 'single'), slug: 'paper' });
    expect(markdown.documents).toEqual([
      {
        file: join(tmp, 'single', 'paper.md'),
        rel: 'paper.md',
        format: 'markdown',
        opening: true,
        staged: 'README.md',
        part: null,
      },
    ]);
    const word = await resolveSource(join(tmp, 'single', 'Paper.DOCX'));
    expect(word).toMatchObject({ kind: 'document', slug: 'paper' });
    expect(word.documents?.[0]).toMatchObject({ format: 'word', rel: 'Paper.DOCX' });
  });

  it('test_source_folder_walk: every real document, and nothing from skipped folders', async () => {
    const source = await resolveSource(join(tmp, 'vault'));
    expect(source).toMatchObject({ kind: 'folder', root: join(tmp, 'vault'), title: 'vault' });
    expect(source.slug).toBe('vault');
    // The folder's own documents first, then by path.
    expect(source.documents?.map((d) => d.rel)).toEqual([
      'top.md',
      'a/b/c/deep.md',
      'a/letter.docx',
    ]);
    expect(source.documents?.map((d) => d.staged)).toEqual([
      'top.md',
      'a/b/c/deep.md',
      'a/letter.md',
    ]);
    expect(source.documents?.map((d) => d.part)).toEqual([null, 'a', 'a']);
  });

  it('test_source_folder_walk: a symlinked folder is not followed', async (context) => {
    try {
      symlinkSync(join(tmp, 'outside'), join(tmp, 'vault', 'linked'), 'dir');
      symlinkSync(join(tmp, 'outside', 'secret.md'), join(tmp, 'vault', 'linked-note.md'), 'file');
    } catch {
      context.skip(); // the platform refuses symlinks without privilege
    }
    const source = await resolveSource(join(tmp, 'vault'));
    // Neither a linked folder nor a linked file is read.
    expect(source.documents?.map((d) => d.rel)).toEqual([
      'top.md',
      'a/b/c/deep.md',
      'a/letter.docx',
    ]);
  });

  it('test_source_refusals: the path and what Tome accepts are named', async () => {
    for (const path of [join(tmp, 'nope'), join(tmp, 'empty')]) {
      const message = await refusal(path);
      expect(message).toContain(path);
      expect(message).toMatch(/SUMMARY\.md/);
      expect(message).toMatch(/Tried:/);
      expect(message).toMatch(/\.docx/);
    }
    for (const name of ['papr.docx', 'note.md']) {
      const path = join(tmp, 'single', name);
      const message = await refusal(path);
      expect(message).toMatch(/file not found/);
      expect(message).toContain(path);
      expect(message).not.toMatch(/Tried:/);
    }
    for (const name of ['old.doc', 'notes.txt', 'scan.pdf']) {
      const path = join(tmp, 'single', name);
      const message = await refusal(path);
      expect(message).toContain(path);
      expect(message).toMatch(/SUMMARY\.md/);
      expect(message).toMatch(/\.md file/);
      expect(message).toMatch(/\.docx/);
    }
  });
});

describe('document-source.mjs — order, names and the spine (INT-0029 AC2)', () => {
  it('test_source_order: the folder first, the opening page first of all, numbers as numbers', () => {
    const ordered = orderDocuments([
      'zeta/one.md',
      '10-a.md',
      'Beta.md',
      'index.md',
      '2-b.md',
      'alpha.md',
      'README.md',
      'Alpha/two.md',
    ]);
    expect(ordered).toEqual([
      { rel: 'README.md', opening: true },
      { rel: '2-b.md', opening: false },
      { rel: '10-a.md', opening: false },
      { rel: 'alpha.md', opening: false },
      { rel: 'Beta.md', opening: false },
      { rel: 'index.md', opening: false },
      { rel: 'Alpha/two.md', opening: false },
      { rel: 'zeta/one.md', opening: false },
    ]);
    // With no README, a root index opens the tome; a nested one never does.
    expect(orderDocuments(['b.md', 'index.md', 'sub/README.md'])[0]).toEqual({
      rel: 'index.md',
      opening: true,
    });
    expect(orderDocuments(['b.md', 'sub/README.md']).some((d) => d.opening)).toBe(false);
  });

  it('test_source_staged_names: safe names, and never two on one route', () => {
    const sets = [
      ['My Notes (1).md'],
      ['a.md', 'a.docx'],
      ['README.md', 'index.md'],
      ['sub/README.md', 'sub/index.md'],
      ['summary.md', 'other.md'],
      ['My Notes/a.md', 'my-notes/a.md'],
    ];
    for (const rels of sets) {
      const ordered = orderDocuments(rels);
      const staged = stagedNames(ordered);
      const routes = staged.map((name) => hrefToSlug(name));
      expect(new Set(routes).size, rels.join(', ')).toBe(routes.length);
      routes.forEach((route, i) => {
        if (!ordered[i]!.opening) expect(route, staged[i]).not.toBe('');
      });
    }
    expect(stagedNames(orderDocuments(['My Notes (1).md']))).toEqual(['my-notes-1.md']);
    // `a.docx` sorts before `a.md`, so it takes the plain name.
    expect(orderDocuments(['a.md', 'a.docx']).map((d) => d.rel)).toEqual(['a.docx', 'a.md']);
    expect(stagedNames(orderDocuments(['a.md', 'a.docx']))).toEqual(['a.md', 'a-2.md']);
    expect(stagedNames(orderDocuments(['README.md', 'index.md']))).toEqual([
      'README.md',
      'index-2.md',
    ]);
    expect(stagedNames(orderDocuments(['Old Letters/To Mara.docx']))).toEqual([
      'old-letters/to-mara.md',
    ]);
    // The reserved names, by name: `summary` would be overwritten by the spine
    // on a file system that ignores case, and a nested `README` or `index`
    // would take its folder's route.
    expect(stagedNames(orderDocuments(['Summary.md', 'other.md']))).toEqual([
      'other.md',
      'summary-2.md',
    ]);
    expect(stagedNames(orderDocuments(['sub/README.md', 'sub/index.md']))).toEqual([
      'sub/index-2.md',
      'sub/readme-2.md',
    ]);
  });

  it('test_source_order: a Word file may open a tome, but a Markdown one of the same name comes first', () => {
    expect(orderDocuments(['README.docx', 'README.md', 'b.md'])).toEqual([
      { rel: 'README.md', opening: true },
      { rel: 'b.md', opening: false },
      { rel: 'README.docx', opening: false },
    ]);
    expect(stagedNames(orderDocuments(['README.docx', 'README.md', 'b.md']))).toEqual([
      'README.md',
      'b.md',
      'readme-2.md',
    ]);
    expect(orderDocuments(['index.docx', 'a.md'])[0]).toEqual({ rel: 'index.docx', opening: true });
    expect(orderDocuments(['index.md', 'README.docx'])[0]).toEqual({
      rel: 'README.docx',
      opening: true,
    });
  });

  it('test_spine_round_trip: parseSummary reads back what writeSpine wrote', () => {
    const chapters = [
      { title: 'Welcome', staged: 'README.md', opening: true, part: null },
      { title: 'Notes [draft]', staged: 'notes-draft.md', part: null },
      { title: 'Second', staged: 'second.md', part: null },
      { title: 'To Mara', staged: 'letters/to-mara.md', part: 'letters' },
      { title: 'To Odo', staged: 'letters/to-odo.md', part: 'letters' },
      { title: 'Plans', staged: 'work/plans.md', part: 'work' },
    ];
    const toc = parseSummary(writeSpine({ title: 'My Vault', chapters }));
    expect(toc.title).toBe('My Vault');
    const seen = toc.nodes.map((node) =>
      node.kind === 'chapter'
        ? `${node.section}:${node.title}:${node.href}`
        : node.kind === 'part-title'
          ? `part:${node.title}`
          : node.kind,
    );
    expect(seen).toEqual([
      'prefix:Welcome:README.md',
      'numbered:Notes (draft):notes-draft.md',
      'numbered:Second:second.md',
      'part:letters',
      'numbered:To Mara:letters/to-mara.md',
      'numbered:To Odo:letters/to-odo.md',
      'part:work',
      'numbered:Plans:work/plans.md',
    ]);
    const drafts = toc.nodes.filter(
      (node): node is ChapterNode => node.kind === 'chapter' && node.draft,
    );
    expect(drafts).toEqual([]);
  });

  it('test_spine_round_trip: a tome of parts only, and an untitled chapter', () => {
    const toc = parseSummary(
      writeSpine({
        title: 'Parts',
        chapters: [{ title: '', staged: 'letters/one.md', part: 'letters' }],
      }),
    );
    expect(toc.title).toBe('Parts');
    expect(toc.nodes).toMatchObject([
      { kind: 'part-title', title: 'letters' },
      { kind: 'chapter', title: 'letters/one.md', href: 'letters/one.md' },
    ]);
  });
});

describe('document-source.mjs — the dev server and documents (INT-0029)', () => {
  it('test_live_reload_notice: documents are served, not watched; an mdBook is watched', () => {
    const forDocument = liveReloadNotice({ kind: 'document' });
    const forFolder = liveReloadNotice({ kind: 'folder' });
    expect(forDocument).toMatch(/live reload is off for documents/);
    expect(forDocument).toMatch(/restart/);
    expect(forFolder).toBe(forDocument);
    expect(liveReloadNotice({ kind: 'book' })).toBeUndefined();
  });
});

describe('document-source.mjs — a paper in LaTeX or Typst (INT-0033 AC1)', () => {
  let tmp: string;
  beforeAll(() => {
    tmp = mkdtempSync(join(tmpdir(), 'tome-papersrc-'));
    write(tmp, {
      'one/note.tex': 'Words with no class named.\n',
      'one/note.typ': '= A note\n',
      'papers/paper.tex': String.raw`\documentclass{article}\begin{document}Text.\input{appendix}\end{document}`,
      'papers/appendix.tex': String.raw`\section{Appendix}`,
      'papers/old.tex': String.raw`% \documentclass{article}` + '\nA draft, 50\\% done.\n',
      'papers/main.typ':
        '#include "parts/intro.typ"\n#import "lib/house.typ": shout\n#import "@preview/x:1.0.0": y\n= Main\n',
      'papers/parts/intro.typ': '== Intro\n',
      'papers/lib/house.typ': '#let shout(body) = [*#body!*]\n',
      'papers/alone.typ': '= Alone\n',
      'papers/note.md': '# Note\n',
      'papers/refs.bib': '@book{a}\n',
      'like/paper.md': '# x\n',
      'like/appendix.md': '# x\n',
      'like/old.md': '# x\n',
      'like/main.md': '# x\n',
      'like/parts/intro.md': '# x\n',
      'like/lib/house.md': '# x\n',
      'like/alone.md': '# x\n',
      'like/note.md': '# x\n',
      'fragments/appendix.tex': String.raw`\section{Appendix}`,
      'rooted/main.typ': '#include "/parts/two.typ"\n',
      'rooted/parts/two.typ': 'Two.\n',
      'nothing/notes.txt': 'nothing Tome reads\n',
    });
  });
  afterAll(() => rmSync(tmp, { recursive: true, force: true }));

  it('test_source_paper_formats: .tex and .typ in any case, and nothing for their neighbours', () => {
    expect(['a.tex', 'A.TEX', 'b.typ', 'B.Typ'].map(documentFormat)).toEqual([
      'latex',
      'latex',
      'typst',
      'typst',
    ]);
    expect(['a.md', 'a.docx'].map(documentFormat)).toEqual(['markdown', 'word']);
    for (const name of ['a.bib', 'a.sty', 'a.cls', 'a.yml', 'a.pdf']) {
      expect(documentFormat(name), name).toBeNull();
    }
  });

  it('test_source_one_paper: a file named on its own is a document whatever it holds', async () => {
    for (const [name, format] of [
      ['note.tex', 'latex'],
      ['note.typ', 'typst'],
    ]) {
      const source = await resolveSource(join(tmp, 'one', name));
      expect(source.kind).toBe('document');
      expect(source.documents).toEqual([
        {
          file: join(tmp, 'one', name),
          rel: name,
          format,
          opening: true,
          staged: 'README.md',
          part: null,
        },
      ]);
    }
  });

  it('test_source_fragments_left_out: a part of a paper is not a chapter of its own', async () => {
    const source = await resolveSource(join(tmp, 'papers'));
    const rels = source.documents!.map((document) => document.rel);
    expect(rels).toEqual(['alone.typ', 'main.typ', 'note.md', 'paper.tex']);
    expect(source.documents!.map((document) => document.format)).toEqual([
      'typst',
      'typst',
      'markdown',
      'latex',
    ]);
    // The order, names and parts are those of .md files of the same paths.
    const like = await resolveSource(join(tmp, 'like'));
    const kept = new Set(rels.map((rel) => rel.replace(/\.[^.]+$/, '')));
    const same = like.documents!.filter((document) => kept.has(document.rel.replace(/\.md$/, '')));
    expect(source.documents!.map((d) => d.rel.replace(/\.[^.]+$/, ''))).toEqual(
      same.map((d) => d.rel.replace(/\.md$/, '')),
    );
    expect(source.documents!.map((d) => [d.staged, d.part, d.opening])).toEqual(
      same.map((d) => [d.staged, d.part, d.opening]),
    );
    // A path that begins with `/` is read from the folder itself.
    const rooted = await resolveSource(join(tmp, 'rooted'));
    expect(rooted.documents!.map((document) => document.rel)).toEqual(['main.typ']);
  });

  it('test_source_only_fragments_refused: a folder of parts alone says what makes a paper', async () => {
    const message = await refusal(join(tmp, 'fragments'));
    expect(message).toContain(join(tmp, 'fragments'));
    expect(message).toContain('\\documentclass');
  });

  it('test_source_accepted_names_papers: every refusal names the two kinds', async () => {
    expect(ACCEPTED).toContain('.tex');
    expect(ACCEPTED).toContain('.typ');
    const file = await refusal(join(tmp, 'nothing', 'notes.txt'));
    expect(file).toContain('.tex');
    expect(file).toContain('.typ');
    // A folder with nothing to read: the book's own refusal, then the sentence that follows it.
    const folder = await refusal(join(tmp, 'nothing'));
    const added = folder.split('\n').slice(1).join('\n');
    expect(added).toContain('.tex');
    expect(added).toContain('.typ');
  });
});
