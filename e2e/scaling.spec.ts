import { test, expect } from '@playwright/test';

// INT-0013 (criteria 2–4, browser half): a responsive sweep guarding against the
// scaling defects the desktop shell surfaced. A viewport-width matrix from the
// shell's minimum up through ultrawide, over the reader, the Bibliotheca, and the
// open search overlay, asserting no horizontal overflow, the dialog stays within
// the viewport, and the layout mode matches the intended breakpoint. (The shell's
// zoom-lock — the other half of criterion 4 — is e2e/electron.spec.ts.)

const WIDTHS = [480, 600, 768, 800, 1024, 1280, 1920, 2560];
const HEIGHT = 900;
const CHAPTER = '/tome/getting-started'; // a chapter with H2s → the rail can appear

test.describe('scaling', () => {
  test('test_scaling_no_overflow', async ({ page }) => {
    for (const url of ['/', CHAPTER]) {
      await page.goto(url);
      for (const width of WIDTHS) {
        await page.setViewportSize({ width, height: HEIGHT });
        const { scrollW, innerW } = await page.evaluate(() => ({
          scrollW: document.documentElement.scrollWidth,
          innerW: window.innerWidth,
        }));
        // 1px slack for sub-pixel rounding.
        expect(scrollW, `${url} @ ${width}px: no horizontal overflow`).toBeLessThanOrEqual(
          innerW + 1,
        );
      }
    }
  });

  test('test_scaling_dialog_in_viewport', async ({ page }) => {
    await page.goto(CHAPTER);
    await page.waitForSelector('html[data-search-ready="true"]');
    for (const width of WIDTHS) {
      await page.setViewportSize({ width, height: HEIGHT });
      await page.keyboard.press('/');
      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();

      const box = await dialog.boundingBox();
      expect(box, `dialog present @ ${width}px`).not.toBeNull();
      expect(box!.x, `dialog left edge in view @ ${width}px`).toBeGreaterThanOrEqual(-1);
      expect(box!.x + box!.width, `dialog right edge in view @ ${width}px`).toBeLessThanOrEqual(
        width + 1,
      );
      expect(box!.y, `dialog top edge in view @ ${width}px`).toBeGreaterThanOrEqual(-1);

      // The overlay must not push the document wider than the viewport.
      const { scrollW, innerW } = await page.evaluate(() => ({
        scrollW: document.documentElement.scrollWidth,
        innerW: window.innerWidth,
      }));
      expect(scrollW, `search-open @ ${width}px: no horizontal overflow`).toBeLessThanOrEqual(
        innerW + 1,
      );

      await page.keyboard.press('Escape');
      await expect(dialog).toBeHidden();
    }
  });

  test('test_scaling_layout_mode', async ({ page }) => {
    await page.goto(CHAPTER);
    // Layout mode is CSS-grid driven (responds to width on resize): whether the
    // sidebar and content sit side-by-side, and whether the rail column shows.
    const mode = () =>
      page.evaluate(() => {
        const nav = document.querySelector('nav[aria-label="Table of contents"]')!;
        const content = document.querySelector('main.content')!;
        const rail = document.querySelector('.rail-col');
        const a = nav.getBoundingClientRect();
        const b = content.getBoundingClientRect();
        return {
          sideBySide: b.left >= a.right - 1,
          railVisible: !!rail && getComputedStyle(rail).display !== 'none',
        };
      });

    // Below the small breakpoint (769px): a single stacked column.
    await page.setViewportSize({ width: 600, height: HEIGHT });
    expect((await mode()).sideBySide, 'stacked below 769px').toBe(false);

    // Two columns at ≥ 769px, still no rail below 1024px.
    await page.setViewportSize({ width: 900, height: HEIGHT });
    let m = await mode();
    expect(m.sideBySide, 'two columns ≥ 769px').toBe(true);
    expect(m.railVisible, 'no rail below 1024px').toBe(false);

    // Three columns (with the rail) at ≥ 1024px.
    await page.setViewportSize({ width: 1280, height: HEIGHT });
    m = await mode();
    expect(m.sideBySide, 'side-by-side ≥ 1024px').toBe(true);
    expect(m.railVisible, 'rail present ≥ 1024px').toBe(true);
  });
});
