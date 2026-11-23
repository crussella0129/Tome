import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import { visit } from 'unist-util-visit';
import remarkMathDollars from '../../../scripts/remark-math-dollars.mjs';
import rehypeMath from '../../../scripts/rehype-math.mjs';

// The mathematical font and the styles of a formula (INT-0030, T-080).

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), 'utf8');
const mathCss = read('src/styles/math.css');
const tokensCss = read('src/styles/tokens.css');
const printCss = read('src/styles/print.css');
const sanguineCss = read('src/styles/sanguine.css');
const temmlCss = read('node_modules/temml/dist/Temml-STIX2.css');

const withoutComments = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, '');
const squeeze = (css: string) => withoutComments(css).replace(/\s+/g, ' ').trim();
/** Every innermost `selector { declarations }` of a sheet. */
function blocks(css: string): { selector: string; body: string }[] {
  return [...withoutComments(css).matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((match) => ({
    selector: match[1]!.replace(/\s+/g, ' ').trim(),
    body: match[2]!.replace(/\s+/g, ' ').trim(),
  }));
}
/** The declarations of the rule with exactly this selector. */
function rule(css: string, selector: string): string {
  const found = blocks(css).filter((block) => block.selector === selector);
  expect(found, selector).toHaveLength(1);
  return found[0]!.body;
}

/** The tables of a WOFF2 file, read from its table directory. */
function woff2Tables(bytes: Buffer): string[] {
  const KNOWN = (
    'cmap head hhea hmtx maxp name OS/2 post cvt  fpgm glyf loca prep CFF  VORG EBDT EBLC gasp ' +
    'hdmx kern LTSH PCLT VDMX vhea vmtx BASE GDEF GPOS GSUB EBSC JSTF MATH CBDT CBLC COLR CPAL ' +
    'SVG  sbix acnt avar bdat bloc bsln cvar fdsc feat fmtx fvar gvar hsty just lcar mort morx ' +
    'opbd prop trak Zapf Silf Glat Gloc Feat Sill'
  )
    .match(/.{4}(?: |$)/g)!
    .map((tag) => tag.slice(0, 4));
  expect(bytes.toString('latin1', 0, 4)).toBe('wOF2');
  const count = bytes.readUInt16BE(12);
  let offset = 48;
  const base128 = () => {
    let value = 0;
    for (let index = 0; index < 5; index += 1) {
      const byte = bytes[offset]!;
      offset += 1;
      value = value * 128 + (byte & 0x7f);
      if ((byte & 0x80) === 0) break;
    }
    return value;
  };
  const tags: string[] = [];
  for (let table = 0; table < count; table += 1) {
    const flags = bytes[offset]!;
    offset += 1;
    let tag = KNOWN[flags & 0x3f];
    if ((flags & 0x3f) === 0x3f) {
      tag = bytes.toString('latin1', offset, offset + 4);
      offset += 4;
    }
    const version = flags >> 6;
    base128(); // the table's own length
    const transformed = tag === 'glyf' || tag === 'loca' ? version === 0 : version !== 0;
    if (transformed) base128();
    tags.push(tag!.trim());
  }
  return tags;
}

/** Every class Temml wrote into the two fixture pages. */
function fixtureClasses(): Set<string> {
  const found = new Set<string>();
  for (const name of ['1-proof.md', '2-more.md']) {
    const source = read(`fixtures/proofs/${name}`);
    const processor = unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkMathDollars)
      .use(remarkRehype)
      .use(rehypeMath);
    const tree = processor.runSync(processor.parse(source), { value: source });
    visit(tree as never, 'element', (node: { properties?: { className?: string[] } }) => {
      for (const className of node.properties?.className ?? []) found.add(className);
    });
  }
  return found;
}

describe('the mathematical font', () => {
  // T-080 clause 1
  it('test_math_font_token: one token names the font, and the sheet is imported', () => {
    const declarations = [...tokensCss.matchAll(/--font-family-math:\s*([^;]+);/g)];
    expect(declarations).toHaveLength(1);
    const value = declarations[0]![1]!.trim();
    expect(value).toMatch(/^'Tome Math'/);
    expect(value).toMatch(/,\s*math$/);
    expect(tokensCss).toMatch(/@import '\.\/math\.css';/);
  });

  // T-080 clause 2
  it('test_math_font_from_package: one face, from the package’s whole-font file, no outside address', () => {
    const faces = [...withoutComments(mathCss).matchAll(/@font-face\s*\{([^}]*)\}/g)];
    expect(faces).toHaveLength(1);
    const face = faces[0]![1]!;
    expect(face).toMatch(/font-family:\s*'Tome Math'/);
    expect(face).not.toMatch(/unicode-range/);
    const source = face.match(/src:\s*url\('([^']+)'\)/)?.[1];
    expect(source).toMatch(/^@fontsource\/stix-two-math\/files\/[\w-]+\.woff2$/);
    const file = join(root, 'node_modules', source!);
    expect(existsSync(file)).toBe(true);
    expect(woff2Tables(readFileSync(file))).toContain('MATH');

    // Nothing is fetched from elsewhere: every `url()` is the package's file or
    // a `data:` picture written into the sheet. (Temml's strike-through arrow is
    // such a picture; its SVG names its namespace and points at its own marker,
    // `url(%23a)`, neither of which is an address.)
    const urls = [...withoutComments(mathCss).matchAll(/url\(\s*(['"]?)([^'")]*)/g)].map(
      (match) => match[2]!,
    );
    expect(urls.length).toBeGreaterThan(0);
    for (const url of urls) expect(url).toMatch(/^(@fontsource\/stix-two-math\/|data:|%23)/);
    expect(withoutComments(mathCss)).not.toMatch(/@import/);
    expect(
      withoutComments(mathCss).replaceAll("xmlns='http://www.w3.org/2000/svg'", ''),
    ).not.toMatch(/https?:/);
    expect(
      blocks(mathCss).some(
        (block) =>
          block.selector === 'math' && block.body === 'font-family: var(--font-family-math);',
      ),
    ).toBe(true);

    // No font file is committed.
    const tracked = execFileSync('git', ['ls-files', '--', 'src', 'public'], {
      cwd: root,
      encoding: 'utf8',
    });
    expect(tracked.split('\n').filter((path) => /\.(woff2?|ttf|otf)$/i.test(path))).toEqual([]);
  });
});

describe('the styles of a formula', () => {
  // T-080 clauses 3, 4, 6
  it('test_math_css_rules: boxes that scroll within themselves, Temml’s rules, no counter', () => {
    const apart = rule(mathCss, '.tome-math');
    expect(apart).toContain('container-type: inline-size');
    expect(apart).toContain('overflow-x: auto');
    expect(apart).toContain('overflow-y: hidden');
    expect(apart).toMatch(/padding-block: [\d.]+em/);

    const long = rule(mathCss, '.tome-math-long');
    expect(long).toContain('display: inline-flex');
    expect(long).toContain('max-width: 100%');
    expect(long).toContain('overflow-x: auto');
    expect(long).toContain('overflow-y: hidden');

    // A formula's cells keep their padding: Tome's reset takes it off every
    // element, and a matrix's rows then run together.
    expect(rule(mathCss, 'math mtd')).toMatch(/^padding: 0\.5ex 0\.4em;?$/);

    const error = rule(mathCss, '.tome-prose code.tome-math-error');
    expect(error).toContain('underline dashed');
    expect(error).not.toMatch(/(^|[;\s])color:/);

    // Every class Temml wrote into the fixture pages that its own sheet for
    // this font styles has the same rule here.
    const written = fixtureClasses();
    expect(written.has('tml-right')).toBe(true);
    const ours = squeeze(mathCss);
    let compared = 0;
    for (const block of blocks(temmlCss)) {
      const named = [...block.selector.matchAll(/\.([\w-]+)/g)].map((match) => match[1]!);
      if (!named.some((className) => written.has(className))) continue;
      if (block.selector.includes('tml-eqn')) continue; // the counter Tome does not use
      compared += 1;
      expect(ours, block.selector).toContain(
        `${block.selector} { ${block.body} }`.replace(/\s+/g, ' '),
      );
    }
    expect(compared).toBeGreaterThan(5);

    // The sheet's own font and its counter are left out.
    expect(withoutComments(mathCss)).not.toMatch(/STIX2/);
    expect(withoutComments(mathCss)).not.toMatch(/STIXTwoMath\.woff2/);
    expect(withoutComments(mathCss)).not.toMatch(/counter\(|counter-increment|counter-reset/);
    expect(withoutComments(mathCss)).not.toMatch(/tml-eqn/);

    const print = blocks(printCss).find(
      (block) => block.selector === '.tome-math, .tome-math-long',
    );
    expect(print?.body).toContain('break-inside: avoid');
    expect(print?.body).toContain('overflow: visible');
  });

  // T-080 clause 5
  it('test_math_sanguine_heading_rule: a formula in a Sanguine heading has a fill of its own', () => {
    const heading = blocks(sanguineCss).find(
      (block) =>
        block.selector.startsWith('body.theme-sanguine-atonement') &&
        /\bmath$/.test(block.selector),
    );
    expect(heading).toBeDefined();
    expect(heading!.selector).toMatch(/h1.*h2.*h3/);
    const fill = heading!.body.match(/-webkit-text-fill-color:\s*([^;]+)/)?.[1]?.trim();
    expect(fill).toBeDefined();
    expect(fill).not.toBe('transparent');
    expect(heading!.body).toMatch(/-webkit-text-stroke:\s*0/);
  });
});
