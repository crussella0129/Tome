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

// ---------------------------------------------------------------------------
// T-056 — the Sanguine Atonement visual system.
// ---------------------------------------------------------------------------

const SANGUINE = 'theme-sanguine-atonement';

async function inSanguine(page: Page, url: string) {
  await page.addInitScript((theme) => localStorage.setItem('tome-theme', theme), SANGUINE);
  await page.goto(url);
  await expect(page.locator('body')).toHaveClass(new RegExp(SANGUINE));
}

/** sRGB source-over of `top` at `alpha` on `base` (both `#rrggbb`). */
function over(base: string, top: string, alpha: number) {
  const ch = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [b, t] = [ch(base), ch(top)];
  return b.map((v, i) => Math.round(v + alpha * (t[i]! - v)));
}

function luminance([r, g, b]: number[]) {
  const lin = (v: number) => ((v /= 255) <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r!) + 0.7152 * lin(g!) + 0.0722 * lin(b!);
}

test.describe('Sanguine Atonement', () => {
  test('test_sanguine_surface_and_channels', async ({ page }) => {
    const { SANGUINE_ROLES } = await import('../src/styles/theme');
    await page.setViewportSize({ width: 1440, height: 900 });

    // Tokens, texture layering, and carved headings on a chapter.
    await inSanguine(page, READER);
    const look = await page.evaluate(() => {
      const body = getComputedStyle(document.body);
      const stone = getComputedStyle(document.body, '::before');
      const h1 = getComputedStyle(document.querySelector('.tome-prose h1')!);
      return {
        bg: body.backgroundColor,
        ink: body.color,
        stoneZ: stone.zIndex,
        stoneOpacity: stone.opacity,
        stoneImage: stone.backgroundImage,
        contentZ: getComputedStyle(document.querySelector('main.content')!).zIndex,
        clip: h1.getPropertyValue('-webkit-background-clip') || h1.backgroundClip,
        fill: h1.getPropertyValue('-webkit-text-fill-color'),
        gradient: h1.backgroundImage,
      };
    });
    expect(look.bg).toBe('rgb(10, 7, 8)');
    expect(look.ink).toBe('rgb(203, 181, 171)'); // bone: the interface ink
    expect(look.stoneZ).toBe('-1');
    expect(Number(look.stoneOpacity)).toBeCloseTo(SANGUINE_ROLES.surface.opacity, 5);
    expect(look.stoneImage).toContain('feSpecularLighting');
    expect(Number(look.contentZ)).toBeGreaterThan(Number(look.stoneZ));
    expect(look.clip).toBe('text');
    expect(look.fill).toBe('rgba(0, 0, 0, 0)');
    expect(look.gradient).toContain('linear-gradient');

    // The rendered stone never rises above the documented sheen, so the
    // tested contrast holds wherever text sits. Measure real pixels in the
    // Bibliotheca's empty margin.
    await inSanguine(page, LIBRARY);
    await page.waitForTimeout(600);
    const png = await page.screenshot({ clip: { x: 0, y: 0, width: 380, height: 900 } });
    const brightest = await page.evaluate(async (b64) => {
      const img = new Image();
      img.src = `data:image/png;base64,${b64}`;
      await img.decode();
      const c = document.createElement('canvas');
      c.width = img.width;
      c.height = img.height;
      const ctx = c.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      const d = ctx.getImageData(0, 0, img.width, img.height).data;
      const lin = (v: number) => ((v /= 255) <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
      let max = 0;
      for (let i = 0; i < d.length; i += 4) {
        max = Math.max(
          max,
          0.2126 * lin(d[i]!) + 0.7152 * lin(d[i + 1]!) + 0.0722 * lin(d[i + 2]!),
        );
      }
      return max;
    }, png.toString('base64'));
    const { surfaces, surface } = SANGUINE_ROLES;
    const glinted = over(surfaces.page, surface.highlight, surface.opacity);
    const sheen = over(
      '#' + glinted.map((v) => v.toString(16).padStart(2, '0')).join(''),
      surface.glow,
      surface.glowAlpha,
    );
    // The texture is visible (lighter than the bare page) yet bounded by the sheen.
    expect(brightest).toBeGreaterThan(luminance(over(surfaces.page, surfaces.page, 1)));
    expect(brightest).toBeLessThanOrEqual(luminance(sheen) + 1e-4);
  });

  // T-061 — chapter text is a crimson inscription at large-text size; small
  // things inside it, and the interface around it, speak in bone.
  test('test_sanguine_inscription_size_and_ink', async ({ page }) => {
    const { SANGUINE_ROLES } = await import('../src/styles/theme');
    await inSanguine(page, READER);
    const reader = await page.evaluate(() => {
      const css = (sel: string) => getComputedStyle(document.querySelector(sel)!);
      const p = css('.tome-prose > p');
      return {
        ink: p.color,
        size: parseFloat(p.fontSize),
        chip: css('.tome-prose :not(pre) > code').color,
        current: css('nav a[aria-current="page"]').color,
        brand: css('nav a').color,
      };
    });
    expect(reader.ink).toBe('rgb(213, 2, 16)');
    expect(reader.size).toBeGreaterThanOrEqual(SANGUINE_ROLES.inscriptionPx);
    expect(reader.chip).toBe('rgb(203, 181, 171)');
    expect(reader.current).toBe('rgb(255, 48, 48)');
    expect(reader.brand).toBe('rgb(203, 181, 171)');

    await inSanguine(page, '/tome/components');
    const cell = await page.evaluate(
      () => getComputedStyle(document.querySelector('.tome-prose td')!).color,
    );
    expect(cell).toBe('rgb(203, 181, 171)');
  });

  test('test_sanguine_sealed_drafts', async ({ page }) => {
    const draftLabel = () =>
      page.evaluate(() => {
        const draft = [...document.querySelectorAll('nav span')].find((el) =>
          el.textContent?.includes('Unwritten Chapter'),
        )!;
        return getComputedStyle(draft, '::after').content;
      });
    await ready(page, READER);
    expect(await draftLabel()).toBe('" (draft)"');
    await inSanguine(page, READER);
    expect(await draftLabel()).toBe('" (sealed)"');
  });

  test('test_sanguine_reduced_motion_static', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    for (const url of [READER, LIBRARY]) {
      await inSanguine(page, url);
      const running = await page.evaluate(() =>
        document
          .getAnimations()
          .filter((a) => a.playState === 'running')
          .map((a) => Number(a.effect?.getTiming().duration ?? 0))
          .filter((ms) => ms > 1),
      );
      expect(running, url).toEqual([]);
    }
  });

  test('test_sanguine_print_ink_on_white', async ({ page }) => {
    await inSanguine(page, READER);
    await page.emulateMedia({ media: 'print' });
    const printed = await page.evaluate(() => {
      const h1 = getComputedStyle(document.querySelector('.tome-prose h1')!);
      return {
        bg: getComputedStyle(document.body).backgroundColor,
        stone: getComputedStyle(document.body, '::before').display,
        candle: getComputedStyle(document.body, '::after').display,
        fill: h1.getPropertyValue('-webkit-text-fill-color'),
        image: h1.backgroundImage,
        animation: h1.animationName,
      };
    });
    expect(printed.bg).toBe('rgb(255, 255, 255)');
    expect(printed.stone).toBe('none');
    expect(printed.candle).toBe('none');
    expect(printed.fill).toBe('rgb(0, 0, 0)');
    expect(printed.image).toBe('none');
    expect(printed.animation).toBe('none');
  });
});

// ---------------------------------------------------------------------------
// T-057 — the transformation, and Sanguine from first paint thereafter.
// ---------------------------------------------------------------------------

/** Record the body's theme the moment the document is parsed (pre-hydration). */
async function watchFirstPaint(page: Page) {
  await page.addInitScript(() => {
    document.addEventListener('DOMContentLoaded', () => {
      (window as unknown as { __firstTheme: string }).__firstTheme = document.body.className;
    });
    // Note every wash that is ever mounted, however briefly.
    new MutationObserver((records) => {
      for (const r of records)
        for (const n of r.addedNodes)
          if (n instanceof HTMLElement && n.dataset.sanguineWash !== undefined)
            (window as unknown as { __washes: number }).__washes =
              ((window as unknown as { __washes?: number }).__washes ?? 0) + 1;
    }).observe(document, { childList: true, subtree: true });
  });
}

const firstTheme = (page: Page) =>
  page.evaluate(() => (window as unknown as { __firstTheme: string }).__firstTheme);
const washes = (page: Page) =>
  page.evaluate(() => (window as unknown as { __washes?: number }).__washes ?? 0);

test.describe('the rite', () => {
  test('test_sanguine_wash_and_persistence', async ({ page }) => {
    await watchFirstPaint(page);
    await ready(page, READER);
    await openDoor(page);
    await speak(page, 'Sanguine, my Brother');
    await expect(page.getByRole('status')).toHaveText('Welcome home.');

    const wash = page.locator('[data-sanguine-wash]');
    await expect(wash).toHaveCount(1, { timeout: 2_000 });
    await expect(page.locator('body')).toHaveClass(new RegExp(SANGUINE), { timeout: 2_000 });
    await expect(wash).toHaveCount(0, { timeout: 3_000 });
    expect(await washes(page)).toBe(1);

    // Persisted, and applied before any island hydrates.
    await page.reload();
    expect(await firstTheme(page)).toContain(SANGUINE);
    await page.goto(LIBRARY);
    expect(await firstTheme(page)).toContain(SANGUINE);
    await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#0a0708');
    await page.goto('/tome/about');
    expect(await firstTheme(page)).toContain(SANGUINE);
  });

  test('test_sanguine_reduced_motion_no_wash', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await watchFirstPaint(page);
    await ready(page, READER);
    await openDoor(page);
    await speak(page, 'sanguine');
    await expect(page.locator('body')).toHaveClass(new RegExp(SANGUINE), { timeout: 2_000 });
    expect(await washes(page)).toBe(0);
  });

  test('test_sanguine_exit_direct', async ({ page }) => {
    await page.addInitScript((theme) => localStorage.setItem('tome-theme', theme), SANGUINE);
    await watchFirstPaint(page);
    await ready(page, READER);
    await expect(option(page, 'Other…')).toHaveAttribute('aria-checked', 'true');
    await option(page, 'Dark').click();
    await expect(page.locator('body')).toHaveClass(/theme-terminal-dark/);
    await expect(page.locator('body')).not.toHaveClass(new RegExp(SANGUINE));
    await expect(page.getByRole('dialog')).toHaveCount(0);
    expect(await washes(page)).toBe(0);
    await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#16130e');
  });
});
