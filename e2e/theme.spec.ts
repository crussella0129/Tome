import { test, expect, type Page } from '@playwright/test';

// INT-0022 — the Light · Dark · Other selector and the Black Door riddle.
const READER = '/tome/getting-started';
const LIBRARY = '/';

async function ready(page: Page, url: string) {
  await page.goto(url);
  await page.waitForSelector('html[data-theme-ready="true"]');
}

const picker = (page: Page) => page.getByRole('radiogroup', { name: 'Colour theme' });
const option = (page: Page, name: string) => picker(page).getByRole('radio', { name });

/** The computed colour of a CSS expression in the page's current theme. */
async function resolved(page: Page, background: string) {
  return page.evaluate((value) => {
    const probe = document.createElement('div');
    probe.style.background = value;
    document.body.append(probe);
    const colour = getComputedStyle(probe).backgroundColor;
    probe.remove();
    return colour;
  }, background);
}

async function openDoor(page: Page) {
  await option(page, 'Other…').click();
  const dialog = page.getByRole('dialog', { name: 'What is the color of Night?' });
  await expect(dialog).toBeVisible();
  return dialog;
}

async function speak(page: Page, words: string) {
  await page.getByLabel('Your answer').fill(words);
  await page.getByRole('button', { name: 'Answer' }).click();
}

test.describe('theme selector', () => {
  // T-055 — selector on both hosts; the dialog is drawn in the active theme.
  test('test_theme_selector_reader_and_bibliotheca', async ({ page }) => {
    for (const url of [READER, LIBRARY]) {
      await ready(page, url);
      await expect(picker(page)).toBeVisible();

      for (const [name, theme] of [
        ['Dark', 'theme-terminal-dark'],
        ['Light', 'theme-ink-paper'],
      ] as const) {
        await option(page, name).click();
        await expect(page.locator('body')).toHaveClass(new RegExp(theme));
        await expect(option(page, name)).toHaveAttribute('aria-checked', 'true');

        const dialog = await openDoor(page);
        const dialogBg = await dialog.evaluate((el) => getComputedStyle(el).backgroundColor);
        expect(dialogBg).toBe(await resolved(page, 'var(--theme-window-background)'));
        await page.keyboard.press('Escape');
        await expect(dialog).toBeHidden();
        await expect(option(page, 'Other…')).toBeFocused();
        await expect(page.locator('body')).toHaveClass(new RegExp(theme));
      }
    }
  });

  // T-055 — wrong answers and Skyrim's answer leave the theme alone.
  test('test_riddle_refused_and_silence_keep_theme', async ({ page }) => {
    await ready(page, READER);
    await openDoor(page);
    await speak(page, 'crimson');
    await expect(page.getByRole('status')).toHaveText('The door does not open.');
    await speak(page, 'Silence, my brother');
    await expect(page.getByRole('status')).toContainText('music of life');
    await expect(page.locator('body')).toHaveClass(/theme-ink-paper/);
    await expect(page.locator('body')).not.toHaveClass(/theme-sanguine-atonement/);
  });

  // T-055 / INT-0022 AC6 — tablet-sized touch targets.
  test('test_theme_controls_touch_targets', async ({ page }) => {
    await page.setViewportSize({ width: 820, height: 1180 });
    for (const url of [READER, LIBRARY]) {
      await ready(page, url);
      for (const name of ['Light', 'Dark', 'Other…']) {
        const box = await option(page, name).boundingBox();
        expect(box, name).not.toBeNull();
        expect(box!.width, `${name} width`).toBeGreaterThanOrEqual(44);
        expect(box!.height, `${name} height`).toBeGreaterThanOrEqual(44);
      }
      await openDoor(page);
      for (const control of [
        page.getByLabel('Your answer'),
        page.getByRole('button', { name: 'Answer' }),
        page.getByRole('button', { name: 'Leave' }),
      ]) {
        const box = await control.boundingBox();
        expect(box!.height).toBeGreaterThanOrEqual(44);
        expect(box!.width).toBeGreaterThanOrEqual(44);
      }
      await page.keyboard.press('Escape');
    }
  });
});
