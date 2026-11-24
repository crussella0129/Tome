import { test, expect, type Locator, type Page } from '@playwright/test';

// INT-0033 — a paper written in LaTeX and one written in Typst, read as a tome.
// Run by scripts/check-documents.mjs against the site it has just built from
// fixtures/latex/ and fixtures/typst/, in two projects: Chromium, and WebKit,
// which is Safari's engine. The papers' formulas are the browser's own
// mathematics, so each engine lays them out itself.

const LATEX = '/latex/paper';
const TYPST = '/typst/paper';
const REFUSED = '/typst/uses-a-package';

/** Open a page and wait until its theme is set and its fonts are in. */
async function open(page: Page, path: string, viewport = { width: 1100, height: 900 }) {
  await page.setViewportSize(viewport);
  await page.goto(path);
  await page.waitForSelector('html[data-theme-ready="true"]');
  await page.evaluate(() => document.fonts.ready);
}

const article = (page: Page) => page.locator('article.tome-prose');

/** Every `id` that stands more than once on the page. */
const repeatedIds = (page: Page) =>
  page.evaluate(() => {
    const seen = new Map<string, number>();
    for (const element of document.querySelectorAll('[id]')) {
      seen.set(element.id, (seen.get(element.id) ?? 0) + 1);
    }
    return [...seen].filter(([, count]) => count > 1).map(([id]) => id);
  });

/** Every link within the page whose address leads to no element of the page. */
const deadLinks = (page: Page) =>
  page.evaluate(() =>
    [...document.querySelectorAll<HTMLAnchorElement>('article a[href^="#"]')]
      .map((link) => link.getAttribute('href') ?? '')
      .filter((href) => {
        let id = href.slice(1);
        try {
          id = decodeURIComponent(id);
        } catch {
          /* as written */
        }
        return id !== '' && document.getElementById(id) === null;
      }),
  );

/** Follow a link within the page and say whether what it names is then in view. */
async function follow(page: Page, link: Locator): Promise<Locator> {
  const href = (await link.getAttribute('href')) ?? '';
  expect(href.startsWith('#')).toBe(true);
  await link.click();
  const target = page.locator(`[id="${decodeURIComponent(href.slice(1))}"]`);
  await expect(target).toHaveCount(1);
  return target;
}

/** Whether the element, or the block that follows an anchor, is inside the viewport. */
async function inView(page: Page, target: Locator): Promise<boolean> {
  return target.evaluate((element) => {
    // An anchor of Tome's own is an empty mark: what it names stands directly after it.
    const named =
      element.tagName === 'A' && element.textContent === ''
        ? (element.parentElement?.nextElementSibling ?? element)
        : element;
    const box = named.getBoundingClientRect();
    return box.bottom > 0 && box.top < window.innerHeight;
  });
}

async function pictureLoaded(page: Page, image: Locator): Promise<{ ok: boolean; origin: string }> {
  await image.scrollIntoViewIfNeeded();
  return image.evaluate(async (img: HTMLImageElement) => {
    await img.decode();
    return {
      ok: img.complete && img.naturalWidth > 0,
      origin: new URL(img.currentSrc || img.src).origin,
    };
  });
}

test.describe('Papers read as a tome', () => {
  test('test_papers_latex', async ({ page }) => {
    await open(page, LATEX);
    const paper = article(page);

    // The title, the authors beneath it with no date, and the abstract.
    await expect(paper.locator('h1')).toHaveCount(1);
    await expect(paper.locator('h1')).toHaveText('A Short Paper on Sums');
    const byline = paper.locator('h1 + p');
    await expect(byline).toHaveText('A. Writer, B. Reader');
    await expect(byline.locator('em')).toHaveCount(1);
    await expect(paper.locator('h1 + p + p')).toHaveText('Abstract');
    await expect(paper.locator('h1 + p + p + p')).toContainText('We prove a closed form');
    await expect(paper).not.toContainText(String(new Date().getFullYear()));

    // The sections, on the page and in its own contents list.
    for (const name of ['Introduction', 'The result', 'Lists and a table', 'Appendix', 'Closing']) {
      await expect(paper.getByRole('heading', { name, exact: true })).toHaveCount(1);
    }
    const rail = page.getByRole('navigation', { name: 'On this page' });
    await expect(rail.getByRole('link')).toHaveText([
      'Introduction',
      'The result',
      'Lists and a table',
      'Appendix',
      'Closing',
      'References',
    ]);

    // The theorem and its proof.
    await expect(paper.locator('p', { hasText: 'Theorem 1' }).first()).toContainText(
      'Theorem 1 (Gauss).',
    );
    await expect(paper.locator('p', { hasText: 'Proof.' }).first()).toContainText('By induction.');

    // Every formula is laid out, and none was left out.
    expect(await paper.locator('math').count()).toBeGreaterThanOrEqual(16);
    await expect(paper).not.toContainText('[equation not shown]');
    await expect(paper.locator('code.tome-math-error')).toHaveCount(0);

    // The numbered equation: its number at the right edge of its box.
    const numbered = paper.locator('div.tome-math').first();
    const number = numbered.locator('mtd.tml-right', { hasText: '(1)' });
    await expect(number).toHaveCount(1);
    const fromRight = await numbered.evaluate((wrapper) => {
      const cell = [...wrapper.querySelectorAll('mtd.tml-right')].find(
        (each) => each.textContent?.trim() === '(1)',
      )!;
      const label = (cell.querySelector('mtext') ?? cell).getBoundingClientRect();
      return wrapper.getBoundingClientRect().right - label.right;
    });
    expect(Math.abs(fromRight)).toBeLessThanOrEqual(2);
    // The aligned derivation has one number, on its first row.
    await expect(paper.locator('div.tome-math').nth(1).locator('mtd.tml-right')).toContainText([
      '(2)',
    ]);

    // A reference to the equation shows its number and leads to it.
    const statement = paper.locator('p', { hasText: 'for its statement' });
    const toEquation = statement.locator('a', { hasText: '(1)' });
    await expect(toEquation).toHaveText('(1)');
    const row = await follow(page, toEquation);
    await expect(row).toContainText('(1)');
    expect(await inView(page, row)).toBe(true);
    await expect(numbered.locator('[id]')).toHaveCount(1);

    // A reference to a section shows its number and leads to it.
    const toSection = statement.locator('a', { hasText: /^2$/ });
    await expect(statement).toContainText('See Section 2 for the result');
    const anchor = await follow(page, toSection);
    expect(await inView(page, anchor)).toBe(true);
    expect(
      await anchor.evaluate((mark) => mark.parentElement?.nextElementSibling?.textContent),
    ).toBe('The result');

    // The table, with the number its reference shows.
    const table = paper.locator('table');
    await expect(table).toHaveCount(1);
    await expect(table.locator('tr')).toHaveCount(4);
    await expect(table.locator('tr').first().locator('th')).toHaveCount(3);
    await expect(table.locator('tr').nth(3).locator('td')).toHaveText(['3', '6', '9']);
    await expect(paper.locator('p', { hasText: 'The first three sums.' })).toHaveText(
      'Table 1. The first three sums.',
    );

    // The figure's picture, from Tome's own origin, and its caption.
    const picture = paper.locator('img');
    await expect(picture).toHaveCount(1);
    const loaded = await pictureLoaded(page, picture);
    expect(loaded.ok).toBe(true);
    expect(loaded.origin).toBe(new URL(page.url()).origin);
    await expect(paper.locator('p', { hasText: 'A triangle of dots.' })).toHaveText(
      'Figure 1. A triangle of dots.',
    );

    // The footnote's mark leads to its note.
    const mark = paper.locator('sup a[data-footnote-ref]').first();
    const note = await follow(page, mark);
    await expect(note).toContainText('A note at the foot');

    // A citation shows its entry's number and leads to the entry.
    const cited = paper.locator('p', { hasText: 'was known to Gauss' });
    await expect(cited).toContainText('[1].');
    // (The footnote's mark in the same paragraph is a link reading 1 as well.)
    const entry = await follow(
      page,
      cited.locator('a:not([data-footnote-ref])', { hasText: /^1$/ }),
    );
    expect(await inView(page, entry)).toBe(true);
    const references = paper.getByRole('heading', { name: 'References', exact: true });
    await expect(references).toHaveCount(1);
    await expect(paper.locator('h2:has-text("References") + ol > li')).toHaveText([
      'C. F. Gauss, Disquisitiones Arithmeticae, 1801.',
    ]);

    // What could not be carried over is marked, as text; a spacing command is not.
    const text = (await paper.innerText()).replace(/\s+/g, ' ');
    expect(text.split('[LaTeX not shown]').length - 1).toBe(3);
    expect(text).toContain('and set x y apart.');
    await expect(paper.locator('a', { hasText: 'LaTeX not shown' })).toHaveCount(0);
    // A reference and a citation that lead nowhere are shown as written.
    expect(text).toContain(
      'See [nowhere], the same book again [1, missing], and one page of it [1, p',
    );
    await expect(paper.locator('a', { hasText: 'nowhere' })).toHaveCount(0);
    await expect(paper.locator('a', { hasText: 'missing' })).toHaveCount(0);

    // The paper's own words are read as written.
    expect(text).toContain('It costs $5 to print this paper, and 50% of it is formulas.');

    expect(await repeatedIds(page)).toEqual([]);
    expect(await deadLinks(page)).toEqual([]);

    // On a phone the page is no wider than its window.
    await open(page, LATEX, { width: 412, height: 900 });
    const widths = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      client: document.documentElement.clientWidth,
    }));
    expect(widths.scroll).toBeLessThanOrEqual(widths.client);
  });

  test('test_papers_typst', async ({ page }) => {
    await open(page, TYPST);
    const paper = article(page);

    await expect(paper.locator('h1')).toHaveCount(1);
    await expect(paper.locator('h1')).toHaveText('A Short Paper on Sums');
    for (const name of ['Introduction', 'The result', 'Lists and a table', 'Appendix', 'Closing']) {
      await expect(paper.getByRole('heading', { name, exact: true })).toHaveCount(1);
    }
    // The authors stand once, as the paper sets them.
    const text = (await paper.innerText()).replace(/\s+/g, ' ');
    expect(text.split('A. Writer').length - 1).toBe(1);

    expect(await paper.locator('math').count()).toBeGreaterThanOrEqual(15);
    await expect(paper).not.toContainText('[equation not shown]');
    await expect(paper.locator('code.tome-math-error')).toHaveCount(0);
    await expect(paper.locator('ul > li').first()).toContainText('A first point');
    await expect(paper.locator('table tr')).toHaveCount(4);
    const picture = paper.locator('img');
    await expect(picture).toHaveCount(1);
    expect((await pictureLoaded(page, picture)).ok).toBe(true);
    const note = await follow(page, paper.locator('sup a[data-footnote-ref]').first());
    await expect(note).toContainText('A note at the foot');
    // The function an imported file defines is worked out.
    expect(text).toContain('the house says so, loudly!');

    // A reference shows the heading's own words and leads to it.
    const see = paper.locator('p', { hasText: 'for its statement' });
    const toHeading = see.locator('a', { hasText: 'The result' });
    await expect(toHeading).toHaveText('The result');
    const anchor = await follow(page, toHeading);
    expect(await inView(page, anchor)).toBe(true);
    expect(
      await anchor.evaluate((mark) => mark.parentElement?.nextElementSibling?.textContent),
    ).toBe('The result');
    await expect(see.locator('a', { hasText: 'the equation' })).toHaveCount(1);

    // A citation shows its entry and leads to it, under the one heading of that name.
    const cited = paper.locator('p', { hasText: 'was known to Gauss' });
    await expect(cited).toContainText('(Gauss 1801)');
    const entry = await follow(page, cited.locator('a', { hasText: 'Gauss 1801' }));
    expect(await inView(page, entry)).toBe(true);
    const references = paper.getByRole('heading', { name: 'References', exact: true });
    await expect(references).toHaveCount(1);
    expect(await references.evaluate((heading) => heading.tagName)).toBe('H2');
    await expect(paper).toContainText('Gauss, Carl Friedrich. 1801. Disquisitiones Arithmeticae.');

    await expect(paper).not.toContainText('not shown');
    expect(await repeatedIds(page)).toEqual([]);
    expect(await deadLinks(page)).toEqual([]);
  });

  test('test_papers_refused', async ({ page }) => {
    await open(page, REFUSED);
    const paper = article(page);
    await expect(paper.locator('h1')).toHaveText('uses-a-package');
    await expect(paper).toContainText(
      '[document not shown] uses-a-package.typ could not be read as a Typst document.',
    );
    const nav = page.getByRole('navigation', { name: 'Table of contents' });
    await expect(nav.getByRole('link', { name: 'uses-a-package', exact: true })).toHaveAttribute(
      'href',
      REFUSED,
    );
  });

  test('test_papers_search', async ({ page }) => {
    await open(page, TYPST);
    await page.waitForSelector('html[data-search-ready="true"]');
    await page.keyboard.press('/');
    const input = page.getByRole('combobox');
    await expect(input).toBeFocused();
    // A word that stands only in the LaTeX paper's second file: one result, that
    // paper. (Search opens a section for a match in a heading's own words, and
    // the chapter for a match in its text: INT-0008.)
    await input.fill('zymurgy');
    const result = page.getByRole('option').getByRole('link').first();
    await expect(result).toHaveAttribute('href', LATEX);
    await expect(page.getByRole('option')).toHaveCount(1);
    await result.click();
    await expect(page).toHaveURL(new RegExp(`${LATEX}$`));
    await expect(article(page)).toContainText('where the word zymurgy stands');

    // The heading of a section read from a file in a folder of its own: a
    // result for each paper, each opening at that section.
    await page.waitForSelector('html[data-search-ready="true"]');
    await expect(async () => {
      await page.keyboard.press('/');
      await expect(page.getByRole('combobox')).toBeFocused({ timeout: 1000 });
    }).toPass({ timeout: 15_000 });
    await page.getByRole('combobox').fill('Closing');
    const sections = page.getByRole('option').getByRole('link');
    await expect(sections).toHaveCount(2);
    const hrefs = await sections.evaluateAll((links) => links.map((a) => a.getAttribute('href')));
    expect([...hrefs].sort()).toEqual([`${LATEX}#closing`, `${TYPST}#closing`]);
    await page
      .getByRole('option')
      .getByRole('link', { name: /Closing/ })
      .first()
      .click();
    await expect(page).toHaveURL(/#closing$/);
    await expect(page.locator('#closing')).toBeInViewport();
    await expect(page.locator('#closing')).toHaveText('Closing');
  });

  test('test_papers_sidebar', async ({ page }) => {
    await open(page, LATEX);
    const nav = page.getByRole('navigation', { name: 'Table of contents' });
    await expect(nav.locator('li a')).toHaveText([
      'A Short Paper on Sums',
      'A Short Paper on Sums',
      'uses-a-package',
    ]);
    const hrefs = await nav
      .locator('li a')
      .evaluateAll((links) => links.map((link) => link.getAttribute('href')));
    expect(hrefs).toEqual([LATEX, TYPST, REFUSED]);
    await expect(nav).toContainText('latex');
    await expect(nav).toContainText('typst');
    // No chapter for a file that is part of a paper.
    for (const part of ['appendix', 'closing', 'house']) {
      expect(hrefs.join(' ')).not.toContain(part);
    }
  });
});
