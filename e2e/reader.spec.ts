import { test, expect } from '@playwright/test';

// Colours from theme.ts, as the browser reports them.
const PARCHMENT = 'rgb(243, 233, 210)'; // #f3e9d2
const WARM_DARK = 'rgb(22, 19, 14)'; //   #16130e

// The default library now ships two tomes (INT-0014), so `/` is the Bibliotheca
// and the sample "Tome" chapters are namespaced under `/tome`.
const TOME = '/tome';

test.describe('Tome reader', () => {
  // INT-0014 #1 — the default `/` is the Bibliotheca, listing both bundled tomes.
  test('test_reader_bibliotheca_default', async ({ page }) => {
    await page.goto('/');
    // Both tomes are catalogued as links to their entry points.
    await expect(page.locator('a[href="/tome"]')).toBeVisible();
    await expect(page.locator('a[href="/marginalia"]')).toBeVisible();
    await expect(page.getByText('Marginalia', { exact: true })).toBeVisible();
    await expect(page.getByText('Tome', { exact: true })).toBeVisible();
    // The masthead wordmark (the library owner / "Bibliotheca").
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  // INT-0014 #2 — cross-tome navigation: the switcher opens a sibling tome and the
  // Bibliotheca link returns to `/` (all SSR'd links, no JS required).
  test('test_reader_cross_tome_nav', async ({ page }) => {
    await page.goto(TOME);
    const nav = page.getByRole('navigation', { name: 'Table of contents' });
    await expect(nav.getByRole('link', { name: 'Bibliotheca' })).toHaveAttribute('href', '/');

    // Switch to the sibling tome via the switcher.
    await nav.getByRole('link', { name: 'Marginalia' }).click();
    await expect(page).toHaveURL(/\/marginalia$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Colophon' })).toBeVisible();

    // The Bibliotheca link returns to the library shelf.
    await page
      .getByRole('navigation', { name: 'Table of contents' })
      .getByRole('link', { name: 'Bibliotheca' })
      .click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator('a[href="/tome"]')).toBeVisible();
  });

  // T-005 clause 1
  test('test_reader_renders_chapter_and_toc', async ({ page }) => {
    await page.goto(TOME);

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
    await page.goto(`${TOME}/getting-started`);
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
    await page.goto(`${TOME}/getting-started`);
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
    await page.goto(`${TOME}/components`);
    await expect(page.locator('.tome-prose a').first()).toBeVisible();
    const th = page.locator('.tome-prose table th').first();
    await expect(th).toBeVisible();
    const thBorder = await th.evaluate((el) => getComputedStyle(el).borderTopWidth);
    expect(parseFloat(thBorder)).toBeGreaterThan(0);

    // A block quote (in /components/panels) has the accent rule.
    await page.goto(`${TOME}/components/panels`);
    const quote = page.locator('.tome-prose blockquote').first();
    await expect(quote).toBeVisible();
    const quoteBorder = await quote.evaluate(
      (el) => getComputedStyle(el).borderLeftWidth,
    );
    expect(parseFloat(quoteBorder)).toBeGreaterThan(0);
  });

  // T-007 clause 1 (criterion 5 — images)
  test('test_chapter_image_styled', async ({ page }) => {
    await page.goto(`${TOME}/components/panels`);
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
    await page.goto(TOME);
    await expect(page.locator('body')).toHaveClass(/theme-ink-paper/);
    const bg = await page.evaluate(
      () => getComputedStyle(document.body).backgroundColor,
    );
    expect(bg).toBe(PARCHMENT);
  });

  // T-002 clause 4
  test('test_dark_theme_active', async ({ page }) => {
    await page.goto(TOME);
    // Wait for the sidebar island to hydrate before clicking, so the toggle's
    // handler is attached (avoids the `client:idle` race — T-208). TocSidebar's
    // onMount adds `js-nav` to the body once running.
    await page.waitForSelector('body.js-nav');
    await page.getByRole('button', { name: 'Switch colour theme' }).click();
    await expect(page.locator('body')).toHaveClass(/theme-terminal-dark/);
    const bg = await page.evaluate(
      () => getComputedStyle(document.body).backgroundColor,
    );
    expect(bg).toBe(WARM_DARK);
  });

  // T-008 clause 1 (criterion 6 — honour prefers-reduced-motion)
  test('test_reduced_motion_honored', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(TOME);
    // A token-transitioned control (`.transition-token`) in the sidebar.
    const btn = page.getByRole('button', { name: 'Switch colour theme' });
    await expect(btn).toBeVisible();
    // Computed transition-duration is reported in seconds; the reduce media rule
    // collapses it to ~0. Take the max across the shorthand list.
    const durationSeconds = await btn.evaluate((el) =>
      getComputedStyle(el)
        .transitionDuration.split(',')
        .map((v) => parseFloat(v))
        .reduce((a, b) => Math.max(a, b), 0),
    );
    expect(durationSeconds).toBeLessThanOrEqual(0.001); // ≤ 1ms
  });

  // T-004 clause 4
  test('test_sidebar_focus_visible', async ({ page }) => {
    await page.goto(TOME);
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

  // INT-0010 criterion 1/4 — the "on this page" rail lists sections; anchors land.
  test('test_reader_on_this_page_anchor', async ({ page }) => {
    await page.goto(`${TOME}/components/panels`);
    await page.waitForSelector('body.js-nav');
    const rail = page.getByRole('navigation', { name: 'On this page' });
    await expect(rail).toBeVisible();
    const link = rail.getByRole('link', { name: 'Figures' });
    await expect(link).toHaveAttribute('href', '#figures');
    await link.click();
    await expect(page).toHaveURL(/#figures$/);
  });

  // INT-0010 criterion 3/4 — an arrow key moves to the next chapter; a key typed
  // in the open search field does not.
  test('test_reader_keyboard_next_chapter', async ({ page }) => {
    await page.goto(`${TOME}/getting-started`);
    await page.waitForSelector('html[data-reader-keys="true"]');
    await page.keyboard.press('ArrowRight');
    await expect(page).toHaveURL(/\/tome\/components$/);

    // Guard: "/" opens search; ArrowRight in its field must not navigate.
    await page.goto(`${TOME}/getting-started`);
    await page.waitForSelector('html[data-reader-keys="true"]');
    await page.waitForSelector('html[data-search-ready="true"]');
    await page.keyboard.press('/');
    await expect(page.getByRole('dialog', { name: /search/i })).toBeVisible();
    await page.getByRole('combobox').press('ArrowRight');
    await expect(page).toHaveURL(/\/tome\/getting-started$/);
  });

  // INT-0010 criterion 2 — the active section is scroll-synced (a short viewport
  // forces the chapter to scroll): the first section is active at the top and
  // stops being active once scrolled to the end.
  test('test_reader_on_this_page_scrollspy', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 420 });
    await page.goto(`${TOME}/components/panels`);
    await page.waitForSelector('html[data-on-this-page="true"]'); // rail scroll-sync live
    const rail = page.getByRole('navigation', { name: 'On this page' });
    const first = rail.getByRole('link', { name: 'Panels', exact: true });
    await expect(first).toHaveAttribute('aria-current', 'true'); // top → first active
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect(first).not.toHaveAttribute('aria-current', 'true'); // scrolled → moved on
  });

  // INT-0011 criterion 1/4 — admonitions render as titled sacred blocks.
  test('test_reader_admonition_rendered', async ({ page }) => {
    await page.goto(`${TOME}/getting-started`);
    const tip = page.locator('.admonition.admonition-tip');
    await expect(tip).toBeVisible();
    await expect(tip.locator('.admonition-title')).toHaveText('Tip');
    await expect(page.locator('.admonition.admonition-warning .admonition-title')).toHaveText(
      'Warning',
    );
  });

  // INT-0011 criterion 2 — footnotes link both ways and are styled sacredly.
  test('test_reader_footnote_links', async ({ page }) => {
    await page.goto(`${TOME}/getting-started`);
    const ref = page.locator('sup a[data-footnote-ref]').first();
    await expect(ref).toHaveAttribute('href', '#user-content-fn-spine');

    // Sacred styling applied (C-001): the footnotes section is set off with a top
    // border, and the reference renders superscript.
    const borderTop = await page
      .locator('section.footnotes')
      .evaluate((el) => getComputedStyle(el).borderTopWidth);
    expect(parseFloat(borderTop)).toBeGreaterThan(0);
    // The ref renders raised (superscript). Tailwind's reset uses relative
    // positioning (`top: -0.5em`) rather than `vertical-align`.
    const top = await page
      .locator('sup')
      .first()
      .evaluate((el) => parseFloat(getComputedStyle(el).top));
    expect(top).toBeLessThan(0);

    // The ref jumps to the note; the note's back-reference points back to the ref.
    await ref.click();
    await expect(page).toHaveURL(/#user-content-fn-spine$/);
    await expect(page.locator('a.data-footnote-backref').first()).toHaveAttribute(
      'href',
      '#user-content-fnref-spine',
    );
  });

  // INT-0011 criterion 3 — print media hides the app chrome.
  test('test_reader_print_hides_chrome', async ({ page }) => {
    await page.goto(`${TOME}/getting-started`);
    await page.emulateMedia({ media: 'print' });
    const display = (sel: string) =>
      page.locator(sel).first().evaluate((el) => getComputedStyle(el).display);
    expect(await display('nav[aria-label="Table of contents"]')).toBe('none');
    expect(await display('.searchbar')).toBe('none');
    expect(await display('.rail-col')).toBe('none');
    expect(await display('.pager')).toBe('none');
    // The chapter itself remains visible.
    expect(await display('article.tome-prose')).not.toBe('none');
  });
});
