import { inflateSync } from 'node:zlib';
import { test, expect, type Locator, type Page } from '@playwright/test';

// INT-0030 — formulas laid out. Run by scripts/check-math.mjs against the site
// it has just built from fixtures/proofs/, in two projects: Chromium, and
// WebKit, which is Safari's engine. A formula is the browser's own mathematics,
// so each engine lays it out itself; every check here measures where things
// actually stand, and must hold in both.

const WIDE = { width: 1100, height: 900 };
const PHONE = { width: 390, height: 844 };
const THEMES = [
  ['Light', 'theme-ink-paper'],
  ['Dark', 'theme-terminal-dark'],
  ['Sanguine Atonement', 'theme-sanguine-atonement'],
] as const;

/** Open a page and wait until its theme is set and its fonts, the mathematical one among them, are in. */
async function open(
  page: Page,
  path: string,
  { theme, viewport = WIDE }: { theme?: string; viewport?: typeof WIDE } = {},
) {
  await page.setViewportSize(viewport);
  if (theme) await page.addInitScript((value) => localStorage.setItem('tome-theme', value), theme);
  await page.goto(path);
  await page.waitForSelector('html[data-theme-ready="true"]');
  // Wait for the page's own formulas to bring the font in. The test does not
  // fetch it: a face that no formula uses would never load, and this would
  // time out, which is the point.
  await page.waitForFunction(() =>
    [...document.fonts].some(
      (face) => face.family.replace(/["']/g, '') === 'Tome Math' && face.status === 'loaded',
    ),
  );
  await page.evaluate(() => document.fonts.ready);
}

/**
 * Which rows of a rectangle of the page an element paints: the first and the
 * last, counted from the rectangle's top. The rectangle is photographed with
 * the element and with it hidden.
 */
async function paintedRows(
  page: Page,
  target: Locator,
  clip: { x: number; y: number; width: number; height: number },
): Promise<{ first: number; last: number }> {
  const shown = pixels(await page.screenshot({ clip, animations: 'disabled' }));
  await target.evaluate((element) => ((element as HTMLElement).style.visibility = 'hidden'));
  const hidden = pixels(await page.screenshot({ clip, animations: 'disabled' }));
  await target.evaluate((element) => ((element as HTMLElement).style.visibility = ''));
  let first = -1;
  let last = -1;
  for (let y = 0; y < shown.height; y += 1) {
    for (let x = 0; x < shown.width; x += 1) {
      const index = (y * shown.width + x) * 4;
      const distance =
        Math.abs(shown.data[index]! - hidden.data[index]!) +
        Math.abs(shown.data[index + 1]! - hidden.data[index + 1]!) +
        Math.abs(shown.data[index + 2]! - hidden.data[index + 2]!);
      if (distance > 48) {
        if (first < 0) first = y;
        last = y;
        break;
      }
    }
  }
  return { first, last };
}

/** The set-apart formulas of a page, in order. */
const apart = (page: Page) => page.locator('article.tome-prose .tome-math');

type Box = {
  left: number;
  right: number;
  top: number;
  bottom: number;
  width: number;
  height: number;
};
/** The boxes of every element under `root` that matches `selector`. */
async function boxes(root: Locator, selector: string): Promise<Box[]> {
  return root.evaluate((element, query) => {
    return [...element.querySelectorAll(query)].map((each) => {
      const { left, right, top, bottom, width, height } = each.getBoundingClientRect();
      return { left, right, top, bottom, width, height };
    });
  }, selector);
}
/** The boxes of the direct children of the first element under `root` that matches `selector`. */
async function childBoxes(root: Locator, selector: string): Promise<Box[]> {
  return root.evaluate((element, query) => {
    const found = element.querySelector(query);
    if (!found) throw new Error(`no ${query}`);
    return [...found.children].map((each) => {
      const { left, right, top, bottom, width, height } = each.getBoundingClientRect();
      return { left, right, top, bottom, width, height };
    });
  }, selector);
}
/** The boxes of the `mo` elements under `root` whose text is `sign`. */
async function signs(root: Locator, sign: string): Promise<Box[]> {
  return root.evaluate((element, wanted) => {
    return [...element.querySelectorAll('mo')]
      .filter((each) => each.textContent === wanted)
      .map((each) => {
        const { left, right, top, bottom, width, height } = each.getBoundingClientRect();
        return { left, right, top, bottom, width, height };
      });
  }, sign);
}
const middle = (box: Box) => (box.top + box.bottom) / 2;
const centre = (box: Box) => (box.left + box.right) / 2;

/** A PNG's pixels, as RGBA. Playwright writes 8-bit RGB or RGBA, not interlaced. */
function pixels(png: Buffer): { width: number; height: number; data: Uint8Array } {
  let offset = 8;
  let width = 0;
  let height = 0;
  let channels = 4;
  const parts: Buffer[] = [];
  while (offset < png.length) {
    const length = png.readUInt32BE(offset);
    const type = png.toString('latin1', offset + 4, offset + 8);
    const body = png.subarray(offset + 8, offset + 8 + length);
    if (type === 'IHDR') {
      width = body.readUInt32BE(0);
      height = body.readUInt32BE(4);
      if (body[8] !== 8 || ![2, 6].includes(body[9]!) || body[12] !== 0) {
        throw new Error('a PNG of a kind this check does not read');
      }
      channels = body[9] === 6 ? 4 : 3;
    }
    if (type === 'IDAT') parts.push(body);
    offset += 12 + length;
  }
  const raw = inflateSync(Buffer.concat(parts));
  const stride = width * channels;
  const lines = new Uint8Array(height * stride);
  for (let y = 0; y < height; y += 1) {
    const filter = raw[y * (stride + 1)]!;
    for (let x = 0; x < stride; x += 1) {
      const value = raw[y * (stride + 1) + 1 + x]!;
      const a = x >= channels ? lines[y * stride + x - channels]! : 0;
      const b = y > 0 ? lines[(y - 1) * stride + x]! : 0;
      const c = x >= channels && y > 0 ? lines[(y - 1) * stride + x - channels]! : 0;
      const paeth = () => {
        const p = a + b - c;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - b);
        const pc = Math.abs(p - c);
        return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      };
      const predicted = [0, a, b, (a + b) >> 1, paeth()][filter]!;
      lines[y * stride + x] = (value + predicted) & 0xff;
    }
  }
  const data = new Uint8Array(width * height * 4);
  for (let index = 0; index < width * height; index += 1) {
    data[index * 4] = lines[index * channels]!;
    data[index * 4 + 1] = lines[index * channels + 1]!;
    data[index * 4 + 2] = lines[index * channels + 2]!;
    data[index * 4 + 3] = channels === 4 ? lines[index * channels + 3]! : 255;
  }
  return { width, height, data };
}

/**
 * The share of an element's box that it paints: its picture is compared with
 * the picture of the same place once the element is hidden, which is the
 * page's ground there, whatever the theme lays under it.
 */
async function paintedShare(page: Page, target: Locator): Promise<number> {
  await target.scrollIntoViewIfNeeded();
  // The same rectangle of the page, with the element and then without it (a
  // hidden element keeps its place, but cannot itself be photographed).
  const box = await target.boundingBox();
  if (!box) throw new Error('the element has no box');
  const clip = { x: box.x, y: box.y, width: Math.ceil(box.width), height: Math.ceil(box.height) };
  const shown = pixels(await page.screenshot({ clip, animations: 'disabled' }));
  await target.evaluate((element) => ((element as HTMLElement).style.visibility = 'hidden'));
  const hidden = pixels(await page.screenshot({ clip, animations: 'disabled' }));
  await target.evaluate((element) => ((element as HTMLElement).style.visibility = ''));
  expect([hidden.width, hidden.height]).toEqual([shown.width, shown.height]);
  let differing = 0;
  for (let index = 0; index < shown.width * shown.height; index += 1) {
    const distance =
      Math.abs(shown.data[index * 4]! - hidden.data[index * 4]!) +
      Math.abs(shown.data[index * 4 + 1]! - hidden.data[index * 4 + 1]!) +
      Math.abs(shown.data[index * 4 + 2]! - hidden.data[index * 4 + 2]!);
    if (distance > 48) differing += 1;
  }
  return differing / (shown.width * shown.height);
}

/** The equation numbers of a page with, for each, where it stands in its formula's box. */
async function equationNumbers(page: Page) {
  return apart(page).evaluateAll((wrappers) =>
    wrappers.flatMap((wrapper, index) =>
      [...wrapper.querySelectorAll('mtr')].flatMap((row) => {
        const cell = row.lastElementChild;
        const text = cell?.textContent?.trim() ?? '';
        if (!cell || !/^\([^()]+\)$/.test(text) || !cell.classList.contains('tml-right')) return [];
        const label = (cell.querySelector('mtext') ?? cell).getBoundingClientRect();
        const formula = [...row.children]
          .slice(0, -1)
          .flatMap((each) => [...each.querySelectorAll('mi, mo, mn')])
          .map((each) => each.getBoundingClientRect().right);
        const box = wrapper.getBoundingClientRect();
        return [
          {
            text,
            wrapper: index,
            fromRight: box.right - label.right,
            gap: label.left - Math.max(...formula),
            scrolls: wrapper.scrollWidth > wrapper.clientWidth,
          },
        ];
      }),
    ),
  );
}

test.describe('Formulas laid out', () => {
  // T-081 clause 5
  test('test_math_boxes', async ({ page }) => {
    for (const path of ['/1-proof', '/2-more']) {
      await open(page, path);
      const all = await boxes(page.locator('article.tome-prose'), 'math');
      expect(all.length, path).toBeGreaterThanOrEqual(8);
      for (const box of all) {
        expect(box.width, path).toBeGreaterThan(1);
        expect(box.height, path).toBeGreaterThan(1);
      }
    }
  });

  // T-081 clause 5
  test('test_math_positions', async ({ page }) => {
    await open(page, '/1-proof');
    const formulas = apart(page);

    // A fraction: the numerator wholly above the denominator.
    const [numerator, denominator] = await childBoxes(formulas.nth(0), 'mfrac');
    expect(numerator!.bottom).toBeLessThanOrEqual(denominator!.top + 0.5);

    // A root over a fraction: the radical sign itself stretches to what it
    // holds. Its ink is looked for in the strip left of the fraction (the
    // root's box would hold the fraction whether the sign stretched or not).
    await formulas.nth(2).scrollIntoViewIfNeeded();
    const [radical] = await boxes(formulas.nth(2), 'msqrt');
    const [held] = await boxes(formulas.nth(2), 'mfrac');
    expect(radical!.height).toBeGreaterThanOrEqual(held!.height);
    expect(held!.left - radical!.left).toBeGreaterThan(4);
    const ink = await paintedRows(page, formulas.nth(2).locator('msqrt'), {
      x: Math.floor(radical!.left),
      y: Math.floor(radical!.top),
      width: Math.floor(held!.left - radical!.left),
      height: Math.ceil(radical!.height),
    });
    expect(ink.first).toBeGreaterThanOrEqual(0);
    expect(ink.last - ink.first + 1).toBeGreaterThanOrEqual(held!.height * 0.9);

    // A sum with limits: one above the sign, one below.
    const [sign, lower, upper] = await childBoxes(formulas.nth(3), 'munderover');
    expect(upper!.bottom).toBeLessThanOrEqual(middle(sign!));
    expect(lower!.top).toBeGreaterThanOrEqual(middle(sign!));

    // A matrix: four cells, two by two.
    const cells = await boxes(formulas.nth(4), 'mtd');
    expect(cells).toHaveLength(4);
    expect(Math.abs(middle(cells[0]!) - middle(cells[1]!))).toBeLessThan(2);
    expect(Math.abs(middle(cells[2]!) - middle(cells[3]!))).toBeLessThan(2);
    expect(middle(cells[2]!)).toBeGreaterThan(middle(cells[0]!) + 5);
    expect(Math.abs(centre(cells[0]!) - centre(cells[2]!))).toBeLessThan(2);
    expect(Math.abs(centre(cells[1]!) - centre(cells[3]!))).toBeLessThan(2);
    expect(centre(cells[1]!)).toBeGreaterThan(centre(cells[0]!) + 5);
    // Its rows stand apart: each cell keeps the padding a formula's cell has
    // (Tome's reset once took it, and the rows ran together), and the letters
    // of the second row begin below the letters of the first.
    const rows = await formulas.nth(4).evaluate((wrapper) => {
      const cellsOf = [...wrapper.querySelectorAll('mtd')];
      const letters = cellsOf.map((cell) => cell.querySelector('mi')!.getBoundingClientRect());
      const style = getComputedStyle(cellsOf[0]!);
      return {
        paddingTop: parseFloat(style.paddingTop),
        paddingBottom: parseFloat(style.paddingBottom),
        firstRowBottom: letters[0]!.bottom,
        secondRowTop: letters[2]!.top,
      };
    });
    expect(rows.paddingTop).toBeGreaterThan(1);
    expect(rows.paddingBottom).toBeGreaterThan(1);
    expect(rows.secondRowTop).toBeGreaterThanOrEqual(rows.firstRowBottom + rows.paddingTop);

    // Its brackets stretch: at least half as tall again as a bracket in a line.
    const [stretched] = await signs(formulas.nth(4), '(');
    const [plain] = await signs(
      page.locator('article.tome-prose p', { hasText: 'A plain bracket in a line' }),
      '(',
    );
    expect(stretched!.height).toBeGreaterThanOrEqual(plain!.height * 1.5);

    // An aligned derivation: its two equals signs line up.
    const equals = await signs(formulas.nth(5), '=');
    expect(equals).toHaveLength(2);
    expect(Math.abs(equals[0]!.left - equals[1]!.left)).toBeLessThanOrEqual(1.5);
    expect(equals[1]!.top).toBeGreaterThan(equals[0]!.bottom - 1);

    // A sum set apart has a taller sign than one within a line.
    const [apartSum] = await signs(formulas.nth(3), '∑');
    const [inlineSum] = await signs(
      page.locator('article.tome-prose p', { hasText: 'A sum in a line' }),
      '∑',
    );
    expect(apartSum!.height).toBeGreaterThan(inlineSum!.height);

    // A long formula in its box keeps the line's baseline: on the line that
    // holds a short one too, their first letters stand at one height.
    await open(page, '/2-more');
    const line = page.locator('article.tome-prose p', { hasText: 'beside long' });
    await expect(line.locator('.tome-math-long')).toHaveCount(1);
    const letters = await line.evaluate((paragraph) =>
      [...paragraph.querySelectorAll('math')].map(
        (math) => math.querySelector('mi')!.getBoundingClientRect().top,
      ),
    );
    expect(letters).toHaveLength(2);
    expect(Math.abs(letters[0]! - letters[1]!)).toBeLessThanOrEqual(2);
  });

  // T-081 clause 6
  test('test_math_equation_numbers', async ({ page }) => {
    for (const viewport of [WIDE, PHONE]) {
      await open(page, '/1-proof', { viewport });
      const first = await equationNumbers(page);
      expect(first.map((number) => number.text)).toEqual(['(1)', '(2)', '(3)']);
      for (const number of first) {
        expect(
          Math.abs(number.fromRight),
          `${number.text} at ${viewport.width}`,
        ).toBeLessThanOrEqual(4);
        expect(number.gap, `${number.text} at ${viewport.width}`).toBeGreaterThanOrEqual(24);
      }

      await open(page, '/2-more', { viewport });
      // The wide numbered equation scrolls on a phone: bring its number into
      // view before measuring it.
      const wide = apart(page).nth(2);
      const scrolls = await wide.evaluate((box) => box.scrollWidth > box.clientWidth);
      expect(scrolls, `the wide numbered equation at ${viewport.width}`).toBe(viewport === PHONE);
      if (scrolls) await wide.evaluate((box) => (box.scrollLeft = box.scrollWidth));
      const second = await equationNumbers(page);
      expect(second.map((number) => number.text)).toEqual(['(1)', '(2)', '(7)']);
      for (const number of second) {
        expect(
          Math.abs(number.fromRight),
          `${number.text} at ${viewport.width}`,
        ).toBeLessThanOrEqual(4);
        if (!number.scrolls) {
          expect(number.gap, `${number.text} at ${viewport.width}`).toBeGreaterThanOrEqual(24);
        }
      }
    }
  });

  // T-081 clause 7
  test('test_math_font_and_requests', async ({ page, baseURL }) => {
    const requests: string[] = [];
    const errors: string[] = [];
    page.on('request', (request) => requests.push(request.url()));
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    page.on('pageerror', (error) => errors.push(String(error)));
    await open(page, '/1-proof');

    const faces = await page.evaluate(() =>
      [...document.fonts].map((face) => `${face.family.replace(/["']/g, '')}:${face.status}`),
    );
    // Loaded by the page itself (`open()` waits and does not fetch), and the
    // family every formula is set in.
    expect(faces).toContain('Tome Math:loaded');
    const families = await page
      .locator('article.tome-prose math')
      .evaluateAll((all) => [...new Set(all.map((math) => getComputedStyle(math).fontFamily))]);
    expect(families).toHaveLength(1);
    expect(families[0]).toMatch(/^["']?Tome Math["']?\s*,/);
    expect(await page.evaluate(() => document.fonts.check('16px "Tome Math"', '∑√α'))).toBe(true);

    const origin = new URL(baseURL!).origin;
    const fetched = requests.filter((url) => /^https?:/.test(url));
    expect(fetched.length).toBeGreaterThan(3);
    expect(fetched.filter((url) => new URL(url).origin !== origin)).toEqual([]);
    expect(fetched.some((url) => /stix-two-math[^/]*\.woff2$/.test(url))).toBe(true);
    expect(errors).toEqual([]);
  });

  // T-081 clause 8
  for (const [name, theme] of THEMES) {
    test(`test_math_theme_colour_and_paint: ${name}`, async ({ page }) => {
      await open(page, '/1-proof', { theme });
      await expect(page.locator('body')).toHaveClass(new RegExp(theme));
      const colours = await page.locator('article.tome-prose').evaluate((prose) => {
        const inline = prose.querySelector('p math')!;
        const set = prose.querySelector('.tome-math math')!;
        return {
          inline: getComputedStyle(inline).color,
          paragraph: getComputedStyle(inline.closest('p')!).color,
          apart: getComputedStyle(set).color,
          prose: getComputedStyle(prose).color,
        };
      });
      expect(colours.inline).toBe(colours.paragraph);
      expect(colours.apart).toBe(colours.prose);

      // Painted, not only coloured: a formula within a line, the tight box of
      // a set-apart one (its fraction), and one in a heading.
      expect(
        await paintedShare(page, page.locator('article.tome-prose p math').first()),
      ).toBeGreaterThanOrEqual(0.02);
      expect(await paintedShare(page, apart(page).nth(0).locator('mfrac'))).toBeGreaterThanOrEqual(
        0.02,
      );

      await open(page, '/2-more', { theme });
      expect(
        await paintedShare(page, page.locator('article.tome-prose h2 math').first()),
      ).toBeGreaterThanOrEqual(0.02);
    });
  }

  // T-081 clause 9
  test('test_math_phone_width', async ({ page }) => {
    for (const path of ['/1-proof', '/2-more']) {
      await open(page, path, { viewport: PHONE });
      const widths = await page.evaluate(() => ({
        document: document.documentElement.scrollWidth,
        window: window.innerWidth,
      }));
      expect(widths.document, path).toBeLessThanOrEqual(widths.window);
      const tall = await page
        .locator('.tome-math, .tome-math-long')
        .evaluateAll((each) => each.filter((box) => box.scrollHeight > box.clientHeight).length);
      expect(tall, path).toBe(0);
    }

    // What does not fit can be reached: the two wide boxes scroll sideways.
    for (const index of [1, 2]) {
      const box = await apart(page)
        .nth(index)
        .evaluate((each) => ({
          inner: each.scrollWidth,
          outer: each.clientWidth,
          overflow: getComputedStyle(each).overflowX,
        }));
      expect(box.inner, `set-apart formula ${index}`).toBeGreaterThan(box.outer);
      expect(box.overflow).toBe('auto');
    }
    // The long formula within a line is inside the column, or scrolls in its box.
    const long = await page
      .locator('article.tome-prose p', { hasText: 'A long one in a line' })
      .evaluate((paragraph) => {
        const box = paragraph.querySelector('.tome-math-long')!;
        return {
          right: box.getBoundingClientRect().right,
          column: paragraph.getBoundingClientRect().right,
          inner: box.scrollWidth,
          outer: box.clientWidth,
        };
      });
    expect(long.right).toBeLessThanOrEqual(long.column + 1);
    expect(long.inner > long.outer || long.right <= long.column + 1).toBe(true);
  });

  // T-081 clause 10
  test('test_math_rail', async ({ page }) => {
    await open(page, '/2-more');
    const rail = page.getByRole('navigation', { name: 'On this page' });
    const entry = rail.getByRole('link', { name: 'The E = mc² law', exact: true });
    await expect(entry).toBeVisible();
    await expect(entry).toHaveAttribute('href', '#the-emc2-law');
    await expect(rail.getByRole('link', { name: 'A wide formula', exact: true })).toBeVisible();
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await entry.click();
    await expect(page.locator('#the-emc2-law')).toBeInViewport();
  });

  // INT-0030 AC7, T-079 clauses 5 and 9, in a browser on the built site: a
  // formula in a heading is found by what it shows, and the result opens at
  // its section.
  test('test_math_search_opens_section', async ({ page }) => {
    await open(page, '/1-proof');
    await page.waitForSelector('html[data-search-ready="true"]');
    await page.keyboard.press('/');
    const input = page.getByRole('combobox');
    await expect(input).toBeFocused();
    await input.fill('mc2');
    const result = page.getByRole('option').getByRole('link').first();
    await expect(result).toHaveAttribute('href', '/2-more#the-emc2-law');
    await expect(page.getByRole('option').first()).toContainText('The E = mc² law');
    await result.click();
    await expect(page).toHaveURL(/\/2-more#the-emc2-law$/);
    await expect(page.locator('#the-emc2-law')).toBeInViewport();
    // A symbol is found by the name it was typed with.
    // (The page just opened is a new one; its search answers the key once it
    // is ready, so the key is pressed until the field is there.)
    await page.waitForSelector('html[data-search-ready="true"]');
    await expect(async () => {
      await page.keyboard.press('/');
      await expect(page.getByRole('combobox')).toBeVisible({ timeout: 1000 });
    }).toPass({ timeout: 15000 });
    await page.getByRole('combobox').fill('alpha');
    await expect(page.getByRole('option').getByRole('link').first()).toHaveAttribute(
      'href',
      /^\/1-proof/,
    );
  });

  // T-081 clause 11
  test('test_math_code_stays_code', async ({ page }) => {
    await open(page, '/1-proof');
    const article = page.locator('article.tome-prose');
    const inline = article.locator('p code:not(.tome-math-error)', { hasText: '$x$' });
    await expect(inline).toHaveCount(1);
    await expect(inline).toHaveText('$x$');
    await expect(inline.locator('math')).toHaveCount(0);
    const block = article.locator('pre code');
    await expect(block).toHaveCount(1);
    await expect(block).toContainText("'$5'");
    await expect(block.locator('math')).toHaveCount(0);
    // And the price is still a price.
    await expect(article).toContainText('It costs $5 and then $10 for two things.');
  });
});
