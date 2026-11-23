// Runs in the default (jsdom) environment, as parent-assets.test.ts does: the
// module under test imports the Markdown parser.
import { afterEach, describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { fromMarkdown } from 'mdast-util-from-markdown';
import { buildDocx } from '../../../fixtures/word/build-docx.mjs';
import {
  DOCUMENT_MARK,
  describeLeftOut,
  placeholderDocument,
  prepareDocument,
} from '../../../scripts/document-stage.mjs';

// INT-0029 — one document made ready for the library (T-068).

interface MdNode {
  type: string;
  value?: string;
  url?: string;
  children?: MdNode[];
}

const cleanups: string[] = [];
afterEach(() => {
  for (const dir of cleanups.splice(0)) rmSync(dir, { recursive: true, force: true });
});

function vault(files: Record<string, string | Buffer>): string {
  const root = mkdtempSync(join(tmpdir(), 'tome-stage-'));
  cleanups.push(root);
  for (const [rel, content] of Object.entries(files)) {
    const full = join(root, rel);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, content);
  }
  return root;
}

function nodes(markdown: string, type: string): MdNode[] {
  const found: MdNode[] = [];
  const walk = (node: MdNode): void => {
    if (node.type === type) found.push(node);
    for (const child of node.children ?? []) walk(child);
  };
  walk(fromMarkdown(markdown) as unknown as MdNode);
  return found;
}
const reads = (markdown: string) =>
  nodes(markdown, 'text')
    .map((node) => node.value)
    .join('');

/** Every file under `root` with its hash: what "nothing was written" is measured by. */
function snapshot(root: string): Record<string, string> {
  const out: Record<string, string> = {};
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isSymbolicLink()) out[full] = 'link';
      else if (entry.isDirectory()) walk(full);
      else out[full] = createHash('sha256').update(readFileSync(full)).digest('hex');
    }
  };
  walk(root);
  return out;
}

const markdownDoc = (root: string, rel: string, staged = rel) => ({
  file: join(root, ...rel.split('/')),
  rel,
  format: 'markdown' as const,
  staged,
});
const wordDoc = (root: string, rel: string, staged: string) => ({
  file: join(root, ...rel.split('/')),
  rel,
  format: 'word' as const,
  staged,
});

const PNG = Buffer.from('not really a png, but a regular file');

describe('document-stage.mjs — a Markdown document', () => {
  it('test_prepare_markdown_title: heading, then front matter, then the file name', async () => {
    const root = vault({
      'headed.md': '---\ntitle: From Settings\n---\n# From Heading\n\nBody.\n',
      'settings.md': '---\ntitle: "A Note"\ntags: [a, b]\n---\nBody only.\n',
      'plain name.md': 'No heading here.\n',
      'broken.md': '---\ntitle: [unclosed\n  : : :\n---\nStill read.\n',
      'rule.md': '---\n\nA rule opened this note, not settings.\n',
    });
    const before = snapshot(root);

    const headed = await prepareDocument(markdownDoc(root, 'headed.md'), { root });
    expect(headed.title).toBe('From Heading');
    expect(headed.markdown).toBe('# From Heading\n\nBody.\n');

    const settings = await prepareDocument(markdownDoc(root, 'settings.md'), { root });
    expect(settings.title).toBe('A Note');
    expect(settings.markdown).toBe('Body only.\n');

    const plain = await prepareDocument(markdownDoc(root, 'plain name.md'), { root });
    expect(plain.title).toBe('plain name');
    expect(plain.markdown).toBe('No heading here.\n');

    // Malformed YAML is left out just the same; nothing tries to parse it.
    const broken = await prepareDocument(markdownDoc(root, 'broken.md'), { root });
    expect(broken.markdown).toBe('Still read.\n');
    expect(broken.markdown).not.toContain('unclosed');

    // A lone `---` with no closing line is a rule, not settings.
    const rule = await prepareDocument(markdownDoc(root, 'rule.md'), { root });
    expect(rule.markdown).toBe('---\n\nA rule opened this note, not settings.\n');

    expect(snapshot(root)).toEqual(before);
  });

  it('test_prepare_markdown_images: inline and by reference, from the root and from a subfolder', async () => {
    const root = vault({
      'note.md':
        '# Note\n\n![a plate](img/plate.png) and ![a mark][fig].\n\n' +
        '[fig]: img/mark.svg "The mark"\n\n' +
        '![web](https://example.com/x.png) ![data](data:image/png;base64,AAAA) ![rooted](/root.png)\n',
      'letters/one.md': '# One\n\n![up](../img/plate.png)\n\n![beside](seal.png)\n',
      'img/plate.png': PNG,
      'img/mark.svg': '<svg xmlns="http://www.w3.org/2000/svg"/>',
      'letters/seal.png': PNG,
    });
    const before = snapshot(root);

    const note = await prepareDocument(markdownDoc(root, 'note.md'), { root });
    expect(note.markdown).toContain('![a plate](./__tome_parent_assets__/img/plate.png)');
    expect(note.markdown).toContain('[fig]: ./__tome_parent_assets__/img/mark.svg "The mark"');
    expect(note.markdown).toContain('![a mark][fig]');
    expect(note.markdown).toContain('![web](https://example.com/x.png)');
    expect(note.markdown).toContain('![data](data:image/png;base64,AAAA)');
    expect(note.markdown).toContain('![rooted](/root.png)');
    expect(note.files.map((file) => file.to).sort()).toEqual([
      '__tome_parent_assets__/img/mark.svg',
      '__tome_parent_assets__/img/plate.png',
    ]);
    for (const file of note.files) expect(readFileSync(file.from!).length).toBeGreaterThan(0);
    expect(note.leftOut).toEqual([]);

    const nested = await prepareDocument(markdownDoc(root, 'letters/one.md'), { root });
    expect(nested.markdown).toContain('![up](../__tome_parent_assets__/img/plate.png)');
    expect(nested.markdown).toContain('![beside](../__tome_parent_assets__/letters/seal.png)');
    expect(nested.leftOut).toEqual([]);

    expect(snapshot(root)).toEqual(before);
  });

  it('test_prepare_markdown_missing_image: what cannot be shown is marked and listed', async () => {
    const base = vault({
      'vault/note.md':
        '# Note\n\n![gone](missing.png)(see below)\n\n![out](../outside.png)\n\n' +
        '![dir](folder.png)\n\n![kind](scan.heic)\n\n![ref][nope]\n\n[nope]: gone-too.png\n',
      'vault/folder.png/keep.txt': 'a folder with an image name',
      'vault/scan.heic': PNG,
      'outside.png': PNG,
    });
    const root = join(base, 'vault');
    const before = snapshot(base);

    const out = await prepareDocument(markdownDoc(root, 'note.md'), { root });
    const text = reads(out.markdown);
    expect(text.split('[image not shown]').length - 1).toBe(5);
    // A mark directly before "(see below)" is still text, not a link.
    expect(text).toContain('[image not shown](see below)');
    expect(nodes(out.markdown, 'link')).toEqual([]);
    expect(nodes(out.markdown, 'image')).toEqual([]);
    expect(nodes(out.markdown, 'imageReference')).toEqual([]);
    expect(out.files).toEqual([]);
    expect(out.leftOut).toEqual([
      { kind: 'image', count: 1, detail: 'missing.png' },
      { kind: 'image', count: 1, detail: '../outside.png' },
      { kind: 'image', count: 1, detail: 'folder.png' },
      { kind: 'image', count: 1, detail: 'scan.heic' },
      { kind: 'image', count: 1, detail: 'gone-too.png' },
    ]);
    expect(describeLeftOut(out.leftOut)).toBe('5 images');
    expect(snapshot(base)).toEqual(before);
  });

  it('test_prepare_markdown_missing_image: a link that resolves outside the root is not followed', async (context) => {
    const base = vault({ 'vault/note.md': '![linked](linked.png)\n', 'secret.png': PNG });
    const root = join(base, 'vault');
    try {
      symlinkSync(join(base, 'secret.png'), join(root, 'linked.png'), 'file');
    } catch {
      context.skip(); // the platform refuses symlinks without privilege
    }
    const before = snapshot(base);
    const out = await prepareDocument(markdownDoc(root, 'note.md'), { root });
    expect(reads(out.markdown)).toContain('[image not shown]');
    expect(out.files).toEqual([]);
    expect(out.leftOut).toEqual([{ kind: 'image', count: 1, detail: 'linked.png' }]);
    expect(snapshot(base)).toEqual(before);
  });

  it('test_prepare_markdown_missing_image: a full path is judged like any other reference', async () => {
    const base = vault({
      'vault/img/plate.png': PNG,
      'outside.png': PNG,
      'vault/note.md': 'placeholder\n',
    });
    const root = join(base, 'vault');
    const inside = join(root, 'img', 'plate.png');
    const outside = join(base, 'outside.png');
    // A drive-letter path and a file: address, each inside and outside the root.
    const asPath = (file: string) => file.replace(/\\/g, '/');
    const source =
      `![in by path](${asPath(inside)})\n\n![out by path](${asPath(outside)})\n\n` +
      `![in by address](${pathToFileURL(inside).href})\n\n` +
      `![out by address](${pathToFileURL(outside).href})\n`;
    writeFileSync(join(root, 'note.md'), source);
    const before = snapshot(base);

    const out = await prepareDocument(markdownDoc(root, 'note.md'), { root });
    const images = nodes(out.markdown, 'image').map((node) => node.url);
    if (/^[A-Za-z]:\//.test(asPath(inside))) {
      // Where full paths begin with a drive letter, both spellings are local
      // references: the ones inside the root are staged, the others marked.
      expect(images).toEqual([
        './__tome_parent_assets__/img/plate.png',
        './__tome_parent_assets__/img/plate.png',
      ]);
      expect(out.leftOut.map((entry) => entry.kind)).toEqual(['image', 'image']);
    } else {
      // Elsewhere a path beginning `/` is a site address and is left as
      // written; the file: addresses are still judged.
      expect(images).toContain('./__tome_parent_assets__/img/plate.png');
      expect(out.leftOut.map((entry) => entry.kind)).toEqual(['image']);
    }
    expect(reads(out.markdown)).toContain('[image not shown]');
    expect(out.files.every((file) => file.to.startsWith('__tome_parent_assets__/'))).toBe(true);
    expect(out.files.map((file) => file.to)).toEqual(['__tome_parent_assets__/img/plate.png']);
    expect(snapshot(base)).toEqual(before);
  });

  it('test_prepare_markdown_missing_image: a drive-letter path with backslashes or %20 is read as written', async (context) => {
    const base = vault({ 'vault/My Pics/a plate.png': PNG, 'vault/note.md': 'placeholder\n' });
    const root = join(base, 'vault');
    const picture = join(root, 'My Pics', 'a plate.png');
    // Only where full paths begin with a drive letter (Windows).
    if (!/^[A-Za-z]:\\/.test(picture)) context.skip();
    const encoded = picture.replace(/\\/g, '/').replace(/ /g, '%20');
    const source =
      `![with backslashes](<${picture}>)\n\n![percent-encoded](${encoded})\n\n` +
      `![gone](<${join(root, 'My Pics', 'missing.png')}>)\n`;
    writeFileSync(join(root, 'note.md'), source);

    const out = await prepareDocument(markdownDoc(root, 'note.md'), { root });
    const staged = './__tome_parent_assets__/My%20Pics/a%20plate.png';
    expect(nodes(out.markdown, 'image').map((node) => node.url)).toEqual([staged, staged]);
    expect(out.files.map((file) => file.to)).toEqual([
      '__tome_parent_assets__/My Pics/a plate.png',
    ]);
    expect(out.leftOut.map((entry) => entry.kind)).toEqual(['image']);
    expect(reads(out.markdown)).toContain('[image not shown]');
  });

  it('test_prepare_markdown_html_image: an HTML image is left as written and listed', async () => {
    const source =
      '# Note\n\n<img src="plate.png" alt="a plate">\n\n<img src="https://example.com/x.png">\n';
    const root = vault({ 'note.md': source, 'plate.png': PNG });
    const before = snapshot(root);
    const out = await prepareDocument(markdownDoc(root, 'note.md'), { root });
    expect(out.markdown).toBe(source);
    expect(out.files).toEqual([]);
    expect(out.leftOut).toEqual([{ kind: 'html-image', count: 1 }]);
    expect(describeLeftOut(out.leftOut)).toBe('1 HTML image (not staged)');
    expect(snapshot(root)).toEqual(before);
  });
});

describe('document-stage.mjs — what the load says was left out', () => {
  it('test_describe_left_out: every kind has its words, and what was not recognised is named', () => {
    expect(describeLeftOut([])).toBe('');
    expect(describeLeftOut([{ kind: 'equation', count: 1 }])).toBe('1 equation');
    expect(describeLeftOut([{ kind: 'figure', count: 1 }])).toBe('1 chart or diagram');
    expect(describeLeftOut([{ kind: 'figure', count: 3 }])).toBe('3 charts or diagrams');
    expect(
      describeLeftOut([
        { kind: 'image', count: 1, detail: 'image/x-emf' },
        { kind: 'image', count: 2, detail: 'image/tiff' },
      ]),
    ).toBe('3 images');
    expect(
      describeLeftOut([
        { kind: 'other', count: 1, detail: 'An unrecognised element was ignored: w:madeUpThing' },
        { kind: 'other', count: 2, detail: 'A v:imagedata element was ignored' },
      ]),
    ).toBe(
      '3 elements the Word reader did not recognise ' +
        '(w:madeUpThing; A v:imagedata element was ignored)',
    );
    expect(
      describeLeftOut([
        { kind: 'equation', count: 2 },
        { kind: 'figure', count: 1 },
        { kind: 'other', count: 1, detail: 'An unrecognised element was ignored: w:x' },
      ]),
    ).toBe('2 equations, 1 chart or diagram, 1 element the Word reader did not recognise (w:x)');
  });
});

describe('document-stage.mjs — a Word document', () => {
  it('test_prepare_word: the conversion, with images under the chapter’s own media folder', async () => {
    const paper = await buildDocx();
    const root = vault({ 'paper.docx': paper, 'letters/Paper Two.docx': paper });
    const before = snapshot(root);

    const top = await prepareDocument(wordDoc(root, 'paper.docx', 'README.md'), { root });
    expect(top.title).toBe('On the Weight of Obsidian');
    expect(top.files.map((file) => file.to)).toEqual(['__tome_media__/README/image-1.png']);
    expect(top.files[0]!.bytes!.length).toBeGreaterThan(0);
    expect(top.markdown).toContain(
      '![A plate of the first tablet](./__tome_media__/README/image-1.png)',
    );
    // The paper's two equations are carried over as LaTeX (INT-0030).
    expect(top.leftOut).toEqual([]);
    expect(describeLeftOut(top.leftOut)).toBe('');
    expect(top.markdown).toContain('$$E=mc^{2}$$');

    const nested = await prepareDocument(
      wordDoc(root, 'letters/Paper Two.docx', 'letters/paper-two.md'),
      { root },
    );
    expect(nested.files.map((file) => file.to)).toEqual([
      '__tome_media__/letters/paper-two/image-1.png',
    ]);
    expect(nested.markdown).toContain('](../__tome_media__/letters/paper-two/image-1.png)');

    expect(snapshot(root)).toEqual(before);
  });

  it('test_prepare_unreadable_word: it throws naming the file, and a placeholder stands in', async () => {
    const root = vault({ 'broken.docx': 'plain text under a Word name\n' });
    const before = snapshot(root);
    const document = wordDoc(root, 'broken.docx', 'broken.md');

    let error: unknown;
    try {
      await prepareDocument(document, { root });
    } catch (caught) {
      error = caught;
    }
    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toMatch(/broken\.docx could not be read as a Word document/);

    const stand = placeholderDocument(document, error);
    expect(stand.title).toBe('broken');
    expect(stand.markdown).toMatch(/^# broken\n/);
    expect(reads(stand.markdown)).toContain(
      `${DOCUMENT_MARK} broken.docx could not be read as a Word document.`,
    );
    expect(nodes(stand.markdown, 'link')).toEqual([]);
    expect(stand.files).toEqual([]);
    expect(stand.leftOut).toMatchObject([{ kind: 'document', count: 1 }]);
    expect(describeLeftOut(stand.leftOut)).toMatch(/could not be read/);

    expect(snapshot(root)).toEqual(before); // test_prepare_writes_nothing, the error included
  });
});
