import { afterEach, describe, expect, it } from 'vitest';
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path, { dirname, join } from 'node:path';
import {
  PARENT_ASSET_DIR,
  imageDestinationSpans,
  isPathInside,
  prepareParentAssets,
  toMarkdownPath,
} from '../../../scripts/parent-assets.mjs';

const cleanups: string[] = [];

function temp(prefix: string): string {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  cleanups.push(dir);
  return dir;
}

function write(file: string, content: string): void {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, content);
}

afterEach(() => {
  for (const dir of cleanups.splice(0))
    rmSync(dir, { recursive: true, force: true });
});

describe('parent asset Markdown parsing', () => {
  it('test_image_destination_token_offsets: records only concrete inline-image URLs', () => {
    const markdown = [
      'π prefix ![bare](../assets/a\\(1\\).svg?raw#detail "Bare title")',
      "![angle](<../assets/a b.svg> 'Angle title')",
      '[ordinary link](../assets/not-an-image.svg)',
      '![reference][plate]',
      '[plate]: ../assets/reference.svg',
      '`![inline code](../assets/code.svg)`',
      '```md',
      '![fenced code](../assets/fenced.svg)',
      '```',
    ].join('\n');

    const spans = imageDestinationSpans(markdown);
    expect(spans.map(({ url }) => url)).toEqual([
      '../assets/a(1).svg?raw#detail',
      '../assets/a b.svg',
    ]);
    expect(spans.map(({ start, end }) => markdown.slice(start, end))).toEqual([
      '../assets/a\\(1\\).svg?raw#detail',
      '../assets/a b.svg',
    ]);
  });

  it('test_parent_asset_cross_platform_paths: contains paths and emits URL separators', () => {
    expect(isPathInside('/book', '/book/assets/x.svg', path.posix)).toBe(true);
    expect(isPathInside('/book', '/outside/x.svg', path.posix)).toBe(false);
    expect(
      isPathInside('C:\\book', 'C:\\book\\assets\\x.svg', path.win32),
    ).toBe(true);
    expect(isPathInside('C:\\book', 'C:\\outside\\x.svg', path.win32)).toBe(
      false,
    );
    expect(isPathInside('C:\\book', 'D:\\assets\\x.svg', path.win32)).toBe(
      false,
    );
    expect(
      toMarkdownPath('..\\__tome_parent_assets__\\assets\\a b(1).svg'),
    ).toBe('../__tome_parent_assets__/assets/a%20b%281%29.svg');
  });
});

describe('parent asset preparation', () => {
  it('test_prepare_parent_asset_rewrites_root_and_nested: rewrites exact URL spans', async () => {
    const base = temp('tome-parent-assets-');
    const root = join(base, 'book');
    const sourceDir = join(root, 'src');
    const stagedTome = join(base, 'staged');
    const rootMarkdown =
      'Before π\n\n![Root](<../assets/plate (1).svg?raw#detail> "Root title")\n\nAfter\n';
    const nestedMarkdown =
      "# Deep\n\n![Deep](<../../assets/plate (1).svg> 'Deep title')\n";
    write(join(sourceDir, 'first.md'), rootMarkdown);
    write(join(sourceDir, 'guide', 'deep.md'), nestedMarkdown);
    write(
      join(root, 'assets', 'plate (1).svg'),
      '<svg xmlns="http://www.w3.org/2000/svg"/>',
    );
    write(
      join(root, 'assets', 'unreferenced.svg'),
      '<svg data-unused="true"/>',
    );
    cpSync(sourceDir, stagedTome, { recursive: true });

    await prepareParentAssets({ root, sourceDir, stagedTome });

    expect(readFileSync(join(stagedTome, 'first.md'), 'utf8')).toBe(
      rootMarkdown.replace(
        '../assets/plate (1).svg?raw#detail',
        './__tome_parent_assets__/assets/plate%20%281%29.svg?raw#detail',
      ),
    );
    expect(readFileSync(join(stagedTome, 'guide', 'deep.md'), 'utf8')).toBe(
      nestedMarkdown.replace(
        '../../assets/plate (1).svg',
        '../__tome_parent_assets__/assets/plate%20%281%29.svg',
      ),
    );
    expect(
      readFileSync(
        join(stagedTome, PARENT_ASSET_DIR, 'assets', 'plate (1).svg'),
        'utf8',
      ),
    ).toContain('<svg');
    expect(
      existsSync(
        join(stagedTome, PARENT_ASSET_DIR, 'assets', 'unreferenced.svg'),
      ),
    ).toBe(false);
  });

  it('test_prepare_parent_asset_preserves_non_targets: leaves other syntax byte-identical', async () => {
    const base = temp('tome-parent-preserve-');
    const root = join(base, 'book');
    const sourceDir = join(root, 'src');
    const stagedTome = join(base, 'staged');
    const markdown = [
      '![local](./img/x.svg)',
      '![web](https://example.com/x.svg)',
      '![data](data:image/svg+xml;base64,PHN2Zy8+)',
      '![root](/images/x.svg)',
      '[ordinary](../assets/x.svg)',
      '![reference][plate]',
      '[plate]: ../assets/x.svg',
      '\\![escaped](../assets/x.svg)',
      '`![inline](../assets/x.svg)`',
      '```md',
      '![fenced](../assets/x.svg)',
      '```',
      '',
    ].join('\n');
    const nested = '![still local](../img/x.svg)\n';
    write(join(sourceDir, 'first.md'), markdown);
    write(join(sourceDir, 'guide', 'deep.md'), nested);
    write(join(sourceDir, 'img', 'x.svg'), '<svg/>');
    cpSync(sourceDir, stagedTome, { recursive: true });

    await prepareParentAssets({ root, sourceDir, stagedTome });

    expect(readFileSync(join(stagedTome, 'first.md'), 'utf8')).toBe(markdown);
    expect(readFileSync(join(stagedTome, 'guide', 'deep.md'), 'utf8')).toBe(
      nested,
    );
    expect(existsSync(join(stagedTome, PARENT_ASSET_DIR))).toBe(false);
  });

  it('test_parent_asset_rejects_symlink_escape: rejects physical escape', async (context) => {
    const base = temp('tome-parent-symlink-');
    const root = join(base, 'book');
    const sourceDir = join(root, 'src');
    const stagedTome = join(base, 'staged');
    const outside = join(base, 'outside.svg');
    write(outside, '<svg/>');
    write(join(sourceDir, 'first.md'), '![Escape](../assets/link.svg)\n');
    mkdirSync(join(root, 'assets'), { recursive: true });
    try {
      symlinkSync(outside, join(root, 'assets', 'link.svg'));
    } catch {
      context.skip();
      return;
    }
    cpSync(sourceDir, stagedTome, { recursive: true });

    await expect(
      prepareParentAssets({ root, sourceDir, stagedTome }),
    ).rejects.toThrow(
      /parent asset "\.\.\/assets\/link\.svg" in first\.md resolves outside the configured book root/,
    );
  });
});
