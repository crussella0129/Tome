import { test, expect, type Page } from '@playwright/test';

// INT-0029 — a folder of loose documents read as a tome. Run by
// scripts/check-documents.mjs against the site it has just built from two
// Markdown notes and two Word papers (no SUMMARY.md anywhere).
const imageLoaded = (page: Page, selector: string) =>
  page
    .locator(selector)
    .first()
    .evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0);

test.describe('Documents as a tome', () => {
  test('test_documents_root_and_sidebar', async ({ page }) => {
    // The folder has no README.md, so `/` shows its first document.
    await page.goto('/');
    const main = page.getByRole('main');
    await expect(
      main.getByRole('heading', { level: 1, name: 'First Note', exact: true }),
    ).toBeVisible();
    // The note's settings block is left out of the page.
    await expect(main).not.toContainText('Settings Title');
    await expect(main).not.toContainText('tags:');

    // One chapter per document: the folder's own first, in order (1 before 3),
    // then its subfolder as a part.
    const nav = page.getByRole('navigation', { name: 'Table of contents' });
    await expect(nav.locator('li a')).toHaveText([
      'First Note',
      'On the Weight of Obsidian',
      'A Letter',
      'A Second Paper',
    ]);
    await expect(nav.locator('li a')).toHaveCount(4);
    await expect(nav).toContainText('letters');
    const hrefs = await nav
      .locator('li a')
      .evaluateAll((links) => links.map((link) => link.getAttribute('href')));
    expect(hrefs).toEqual(['/1-first-note', '/3-paper', '/letters/2-letter', '/letters/paper']);
    await expect(nav.getByRole('link', { name: 'First Note', exact: true })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  test('test_documents_word_chapter', async ({ page }) => {
    await page.goto('/3-paper');
    const article = page.locator('article.tome-prose');

    // One top heading: the paper's Title.
    await expect(article.locator('h1')).toHaveCount(1);
    await expect(article.locator('h1')).toHaveText('On the Weight of Obsidian');

    // The rail lists Heading 1 and Heading 2, and not Heading 3 ("Links").
    const rail = page.getByRole('navigation', { name: 'On this page' });
    await expect(rail.getByRole('link')).toHaveText([
      'The Quarry',
      'Tools',
      'Washing in H2O',
      'The Measure',
    ]);
    await expect(article.locator('h4')).toHaveText('Links');

    // A footnote leads to its note, and the note back to its reference.
    const reference = article.locator('sup a[data-footnote-ref]').first();
    const target = (await reference.getAttribute('href'))!;
    expect(target).toMatch(/^#user-content-fn-/);
    await reference.click();
    const note = page.locator(target);
    await expect(note).toContainText('The quarry lies north of the river.');
    await expect(note).toBeInViewport();
    await note.locator('a.data-footnote-backref').first().click();
    await expect(reference).toBeInViewport();
    await expect(article.locator('section.footnotes li')).toHaveCount(2);

    // The table's first row is its header.
    await expect(article.locator('table thead th')).toHaveText(['Tablet', 'Weight']);
    await expect(article.locator('table tbody td')).toHaveText(['First', 'nine stone']);

    // The picture loads; superscript is kept; equations are marked.
    expect(await imageLoaded(page, 'article.tome-prose img')).toBe(true);
    await expect(article.locator('sup:not(:has(a))')).toHaveText('2');
    await expect(article.locator('sub')).toHaveText(['2', '2']);
    await expect(article.getByText('[equation not shown]')).toHaveCount(2);
    await expect(article).toContainText('Density is [equation not shown](see the table)');
  });

  test('test_documents_nested_word_image', async ({ page }) => {
    await page.goto('/letters/paper');
    await expect(page.locator('article.tome-prose h1')).toHaveText('A Second Paper');
    expect(await imageLoaded(page, 'article.tome-prose img')).toBe(true);
  });

  test('test_documents_no_unsafe_links', async ({ page }) => {
    await page.goto('/3-paper');
    const article = page.locator('article.tome-prose');
    await expect(page.locator('a[href^="javascript:"], a[href^="file:"]')).toHaveCount(0);
    for (const words of ['the trapdoor', 'the cellar', 'the quarry section']) {
      await expect(article.getByText(words)).toBeVisible();
      await expect(article.locator('a', { hasText: words })).toHaveCount(0);
    }
    // Web and mail addresses are still links.
    await expect(article.getByRole('link', { name: 'the source' })).toHaveAttribute(
      'href',
      'https://example.com/source',
    );
    await expect(article.getByRole('link', { name: 'the scribe' })).toHaveAttribute(
      'href',
      'mailto:scribe@example.com',
    );
  });

  test('test_documents_search', async ({ page }) => {
    await page.goto('/1-first-note');
    await page.waitForSelector('html[data-search-ready="true"]');
    await page.keyboard.press('/');
    const input = page.getByRole('combobox');
    await expect(input).toBeFocused();

    // A word that occurs only in the first Word paper.
    await input.fill('Zyzzyva');
    const result = page.getByRole('option').getByRole('link').first();
    await expect(result).toHaveAttribute('href', /^\/3-paper/);
    await expect(page.getByRole('option')).toHaveCount(1);
    await result.click();
    await expect(page).toHaveURL(/\/3-paper/);
    await expect(page.locator('article.tome-prose h1')).toHaveText('On the Weight of Obsidian');
  });

  test('test_documents_markdown_images', async ({ page }) => {
    await page.goto('/1-first-note');
    const article = page.locator('article.tome-prose');
    await expect(article.locator('img')).toHaveCount(1);
    expect(await imageLoaded(page, 'article.tome-prose img')).toBe(true);
    await expect(article.getByText('[image not shown]')).toBeVisible();
  });
});
