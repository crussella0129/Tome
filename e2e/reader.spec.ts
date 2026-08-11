import { test, expect } from '@playwright/test';

// Colours from theme.ts, as the browser reports them.
const PARCHMENT = 'rgb(243, 233, 210)'; // #f3e9d2
const WARM_DARK = 'rgb(22, 19, 14)'; //   #16130e

test.describe('Tome reader', () => {
  // T-005 clause 1
  test('test_reader_renders_chapter_and_toc', async ({ page }) => {
    await page.goto('/');

    // Sidebar lists the sample book's chapters.
    const nav = page.getByRole('navigation', { name: 'Table of contents' });
    await expect(nav.getByRole('link', { name: 'Getting Started' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Sacred Components' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'About' })).toBeVisible();

    // The chapter's Markdown is rendered as HTML in the content region.
    await expect(
      page.getByRole('heading', { level: 1, name: 'Introduction' }),
    ).toBeVisible();
    await expect(page.locator('.tome-prose')).toContainText('machine for reading');
  });

  // T-005 clause 2
  test('test_chapter_code_block_styled', async ({ page }) => {
    await page.goto('/getting-started');
    const pre = page.locator('.tome-prose pre').first();
    await expect(pre).toBeVisible();

    const style = await pre.evaluate((el) => {
      const cs = getComputedStyle(el);
      return { font: cs.fontFamily, borderTop: cs.borderTopWidth };
    });
    // Monospace family and a real border (the sacred panel).
    expect(style.font.toLowerCase()).toMatch(/mek|mono/);
    expect(parseFloat(style.borderTop)).toBeGreaterThan(0);
  });

  // T-005 clause 3
  test('test_chapter_prose_elements_styled', async ({ page }) => {
    await page.goto('/getting-started');
    // h2 carries the sacred underline rule.
    const h2 = page.locator('.tome-prose h2').first();
    await expect(h2).toBeVisible();
    const borderBottom = await h2.evaluate(
      (el) => getComputedStyle(el).borderBottomWidth,
    );
    expect(parseFloat(borderBottom)).toBeGreaterThan(0);
    // Lists and inline code render.
    await expect(page.locator('.tome-prose ol').first()).toBeVisible();
    await expect(page.locator('.tome-prose code').first()).toBeVisible();

    // A table (in /components) is a bordered sacred panel; links render too.
    await page.goto('/components');
    await expect(page.locator('.tome-prose a').first()).toBeVisible();
    const th = page.locator('.tome-prose table th').first();
    await expect(th).toBeVisible();
    const thBorder = await th.evaluate((el) => getComputedStyle(el).borderTopWidth);
    expect(parseFloat(thBorder)).toBeGreaterThan(0);

    // A block quote (in /components/panels) has the accent rule.
    await page.goto('/components/panels');
    const quote = page.locator('.tome-prose blockquote').first();
    await expect(quote).toBeVisible();
    const quoteBorder = await quote.evaluate(
      (el) => getComputedStyle(el).borderLeftWidth,
    );
    expect(parseFloat(quoteBorder)).toBeGreaterThan(0);
  });

  // T-007 clause 1 (criterion 5 — images)
  test('test_chapter_image_styled', async ({ page }) => {
    await page.goto('/components/panels');
    const img = page.locator('.tome-prose img').first();
    await expect(img).toBeVisible();
    // Rendered as a bordered plate, and the asset actually loaded.
    const info = await img.evaluate((el) => {
      const image = el as HTMLImageElement;
      return {
        border: getComputedStyle(image).borderTopWidth,
        complete: image.complete && image.naturalWidth > 0,
      };
    });
    expect(parseFloat(info.border)).toBeGreaterThan(0);
    expect(info.complete).toBe(true);
  });

  // T-002 clause 3
  test('test_paper_theme_active', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('body')).toHaveClass(/theme-ink-paper/);
    const bg = await page.evaluate(
      () => getComputedStyle(document.body).backgroundColor,
    );
    expect(bg).toBe(PARCHMENT);
  });

  // T-002 clause 4
  test('test_dark_theme_active', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Switch colour theme' }).click();
    await expect(page.locator('body')).toHaveClass(/theme-terminal-dark/);
    const bg = await page.evaluate(
      () => getComputedStyle(document.body).backgroundColor,
    );
    expect(bg).toBe(WARM_DARK);
  });

  // T-004 clause 4
  test('test_sidebar_focus_visible', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Tab'); // first focusable is a sidebar anchor
    const focused = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      if (!el) return null;
      const cs = getComputedStyle(el);
      return {
        tag: el.tagName.toLowerCase(),
        inNav: !!el.closest('nav[aria-label="Table of contents"]'),
        outlineStyle: cs.outlineStyle,
        outlineWidth: cs.outlineWidth,
        focusVisible: el.matches(':focus-visible'),
      };
    });
    expect(focused?.inNav).toBe(true);
    expect(focused?.focusVisible).toBe(true);
    expect(focused?.outlineStyle).not.toBe('none');
    expect(parseFloat(focused?.outlineWidth ?? '0')).toBeGreaterThan(0);
  });
});
