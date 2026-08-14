import { test, expect } from '@playwright/test';

test.describe('External book reader', () => {
  test('test_external_book_renders_in_browser', async ({ page }) => {
    await page.goto('/first');

    await expect(page).toHaveURL(/\/first\/?$/);
    const main = page.getByRole('main');
    await expect(
      main.getByRole('heading', {
        level: 1,
        name: 'First Chapter',
        exact: true,
      }),
    ).toBeVisible();
    await expect(main.locator('.tome-prose')).toContainText(
      'The first numbered chapter of the external handbook.',
    );

    const navigation = page.getByRole('navigation', {
      name: 'Table of contents',
    });
    const activeChapter = navigation.getByRole('link', {
      name: 'First Chapter',
      exact: true,
    });
    await expect(activeChapter).toHaveAttribute('aria-current', 'page');
    await expect(activeChapter).toHaveAttribute('href', /^\/first\/?$/);
    await expect(
      navigation.getByRole('link', { name: 'Getting Started', exact: true }),
    ).toHaveCount(0);
  });

  test('test_external_relative_image_loads', async ({ page }) => {
    await page.goto('/first');

    const image = page
      .getByRole('main')
      .locator('.tome-prose')
      .getByRole('img', { name: 'A sacred plate', exact: true });
    await expect(image).toBeVisible();
    const rendered = await image.evaluate(async (element) => {
      const img = element as HTMLImageElement;
      await img.decode();
      return {
        complete: img.complete,
        naturalWidth: img.naturalWidth,
        borderTopWidth: Number.parseFloat(getComputedStyle(img).borderTopWidth),
      };
    });

    expect(rendered.complete).toBe(true);
    expect(rendered.naturalWidth).toBeGreaterThan(0);
    expect(rendered.borderTopWidth).toBeGreaterThan(0);
  });

  test('test_external_parent_relative_image_loads', async ({ page }) => {
    await page.goto('/first');

    const image = page
      .getByRole('main')
      .locator('.tome-prose')
      .getByRole('img', { name: 'A parent-held plate', exact: true });
    await expect(image).toBeVisible();
    const rendered = await image.evaluate(async (element) => {
      const img = element as HTMLImageElement;
      await img.decode();
      return {
        complete: img.complete,
        naturalWidth: img.naturalWidth,
        currentSrc: new URL(img.currentSrc).pathname,
        borderTopWidth: Number.parseFloat(getComputedStyle(img).borderTopWidth),
      };
    });

    expect(rendered.complete).toBe(true);
    expect(rendered.naturalWidth).toBeGreaterThan(0);
    expect(rendered.currentSrc).toMatch(/^\/_astro\/parent-plate\.[^/]+\.svg$/);
    expect(rendered.borderTopWidth).toBeGreaterThan(0);
  });
});
