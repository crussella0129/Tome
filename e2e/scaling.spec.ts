import { test, expect } from '@playwright/test';

// INT-0013 (criteria 2–4, browser half): a responsive sweep guarding against the
// scaling defects the desktop shell surfaced. A viewport-width matrix from the
// shell's minimum up through ultrawide, over the reader, the Bibliotheca, and the
// open search overlay, asserting no horizontal overflow, the dialog stays within
// the viewport, and the layout mode matches the intended breakpoint. (The shell's
// zoom-lock — the other half of criterion 4 — is e2e/electron.spec.ts.)

const WIDTHS = [
  320, 480, 600, 768, 769, 800, 1023, 1024, 1040, 1280, 1920, 2560,
];
const HEIGHT = 900;
const CHAPTER = '/tome/getting-started'; // a chapter with H2s → the rail can appear
const CHAPTER_WITHOUT_RAIL = '/tome/about';
const WIDE_WIDTHS = [1280, 1920, 2560];
const SEARCH_TRIGGER_WIDTHS = [480, 768, 769, 1023, 1024, 1040];
const NARROW_SEARCH_SIZES = [
  { width: 320, height: 360 },
  { width: 480, height: 360 },
];

test.describe('scaling', () => {
  test('test_scaling_no_overflow', async ({ page }) => {
    for (const url of ['/', CHAPTER]) {
      for (const width of WIDTHS) {
        await page.setViewportSize({ width, height: HEIGHT });
        await page.goto(url);
        const { scrollW, innerW } = await page.evaluate(() => ({
          scrollW: document.documentElement.scrollWidth,
          innerW: window.innerWidth,
        }));
        // 1px slack for sub-pixel rounding.
        expect(
          scrollW,
          `${url} @ ${width}px: no horizontal overflow`,
        ).toBeLessThanOrEqual(innerW + 1);
      }
    }
  });

  test('test_scaling_dialog_in_viewport', async ({ page }) => {
    for (const width of WIDTHS) {
      await page.setViewportSize({ width, height: HEIGHT });
      await page.goto(CHAPTER);
      await page.waitForSelector('html[data-search-ready="true"]');
      await page.keyboard.press('/');
      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();

      const box = await dialog.boundingBox();
      expect(box, `dialog present @ ${width}px`).not.toBeNull();
      expect(
        box!.x,
        `dialog left edge in view @ ${width}px`,
      ).toBeGreaterThanOrEqual(-1);
      expect(
        box!.x + box!.width,
        `dialog right edge in view @ ${width}px`,
      ).toBeLessThanOrEqual(width + 1);
      expect(
        box!.y,
        `dialog top edge in view @ ${width}px`,
      ).toBeGreaterThanOrEqual(-1);

      // The overlay must not push the document wider than the viewport.
      const { scrollW, innerW } = await page.evaluate(() => ({
        scrollW: document.documentElement.scrollWidth,
        innerW: window.innerWidth,
      }));
      expect(
        scrollW,
        `search-open @ ${width}px: no horizontal overflow`,
      ).toBeLessThanOrEqual(innerW + 1);

      await page.keyboard.press('Escape');
      await expect(dialog).toBeHidden();
    }
  });

  test('test_scaling_layout_mode', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: HEIGHT });
    await page.goto(CHAPTER);
    // Layout mode is CSS-grid driven (responds to width on resize): whether the
    // sidebar and content sit side-by-side, and whether the rail column shows.
    const mode = () =>
      page.evaluate(() => {
        const nav = document.querySelector(
          'nav[aria-label="Table of contents"]',
        )!;
        const content = document.querySelector('main.content')!;
        const rail = document.querySelector('.rail-col');
        const a = nav.getBoundingClientRect();
        const b = content.getBoundingClientRect();
        return {
          sideBySide: b.left >= a.right - 1,
          railVisible: !!rail && getComputedStyle(rail).display !== 'none',
        };
      });

    for (const expected of [
      { width: 768, sideBySide: false, railVisible: false },
      { width: 769, sideBySide: true, railVisible: false },
      { width: 1023, sideBySide: true, railVisible: false },
      { width: 1024, sideBySide: true, railVisible: true },
    ]) {
      await page.setViewportSize({ width: expected.width, height: HEIGHT });
      const actual = await mode();
      expect(
        actual.sideBySide,
        `${expected.width}px: intended sidebar/content mode`,
      ).toBe(expected.sideBySide);
      expect(
        actual.railVisible,
        `${expected.width}px: intended on-this-page rail mode`,
      ).toBe(expected.railVisible);
    }
  });

  test('test_scaling_reader_column_centered', async ({ page }) => {
    for (const url of [CHAPTER, CHAPTER_WITHOUT_RAIL]) {
      for (const width of WIDE_WIDTHS) {
        await page.setViewportSize({ width, height: HEIGHT });
        await page.goto(url);

        const geometry = await page.evaluate(() => {
          const content = document.querySelector<HTMLElement>('main.content')!;
          const column = content.querySelector<HTMLElement>('.reading-column')!;
          const prose = column.querySelector<HTMLElement>('.tome-prose')!;
          const pager = column.querySelector<HTMLElement>(
            'nav[aria-label="Chapter navigation"]',
          )!;
          const searchbar = column.querySelector<HTMLElement>('.searchbar')!;
          const trigger = searchbar.querySelector<HTMLElement>(
            'button[aria-haspopup="dialog"]',
          )!;
          const rail = document.querySelector<HTMLElement>('.rail-col');

          const toRect = (box: DOMRect) => ({
            x: box.x,
            width: box.width,
            center: box.x + box.width / 2,
            right: box.right,
          });

          return {
            content: toRect(content.getBoundingClientRect()),
            column: toRect(column.getBoundingClientRect()),
            prose: toRect(prose.getBoundingClientRect()),
            pager: toRect(pager.getBoundingClientRect()),
            searchbar: toRect(searchbar.getBoundingClientRect()),
            trigger: toRect(trigger.getBoundingClientRect()),
            columnMaxWidth: Number.parseFloat(
              getComputedStyle(column).maxWidth,
            ),
            railVisible: !!rail && getComputedStyle(rail).display !== 'none',
          };
        });

        const label = `${url} @ ${width}px`;
        expect(
          geometry.column.width,
          `${label}: column respects measure`,
        ).toBeLessThanOrEqual(geometry.columnMaxWidth + 1);
        for (const [name, box] of [
          ['column', geometry.column],
          ['prose', geometry.prose],
          ['pager', geometry.pager],
        ] as const) {
          expect(
            box.width,
            `${label}: ${name} respects measure`,
          ).toBeLessThanOrEqual(geometry.columnMaxWidth + 1);
          expect(
            Math.abs(box.center - geometry.content.center),
            `${label}: ${name} centered in main content`,
          ).toBeLessThanOrEqual(1);
        }

        expect(
          geometry.searchbar.x,
          `${label}: search host starts inside reading column`,
        ).toBeGreaterThanOrEqual(geometry.column.x - 1);
        expect(
          geometry.searchbar.right,
          `${label}: search host ends inside reading column`,
        ).toBeLessThanOrEqual(geometry.column.right + 1);
        expect(
          geometry.trigger.x,
          `${label}: search trigger starts inside reading column`,
        ).toBeGreaterThanOrEqual(geometry.column.x - 1);
        expect(
          Math.abs(geometry.trigger.right - geometry.column.right),
          `${label}: search trigger right-aligns with reading column`,
        ).toBeLessThanOrEqual(1);

        expect(geometry.railVisible, `${label}: expected rail mode`).toBe(
          url === CHAPTER,
        );
      }
    }
  });

  test('test_scaling_reader_column_stable_with_mobile_nav', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 600, height: HEIGHT });
    await page.goto(CHAPTER);
    await page.waitForSelector('body.js-nav');

    const toggle = page.getByRole('button', {
      name: 'Toggle table of contents',
    });
    const geometry = () =>
      page.evaluate(() => {
        const column = document.querySelector<HTMLElement>('.reading-column')!;
        const box = column.getBoundingClientRect();
        return {
          center: box.x + box.width / 2,
          scrollWidth: document.documentElement.scrollWidth,
          innerWidth: window.innerWidth,
        };
      });

    if ((await toggle.getAttribute('aria-expanded')) === 'true') {
      await toggle.click();
      await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    } else {
      await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    }

    const closed = await geometry();
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    const open = await geometry();
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    const closedAgain = await geometry();

    for (const [name, state] of [
      ['closed', closed],
      ['open', open],
      ['closed again', closedAgain],
    ] as const) {
      expect(
        Math.abs(state.center - closed.center),
        `${name}: reading column horizontal center is stable`,
      ).toBeLessThanOrEqual(1);
      expect(
        state.scrollWidth,
        `${name}: no horizontal overflow`,
      ).toBeLessThanOrEqual(state.innerWidth + 1);
    }
  });

  test('test_scaling_search_trigger_usable_across_hosts', async ({ page }) => {
    for (const url of ['/', CHAPTER]) {
      for (const width of SEARCH_TRIGGER_WIDTHS) {
        await page.setViewportSize({ width, height: HEIGHT });
        await page.goto(url);

        const trigger = page.locator('button[aria-haspopup="dialog"]');
        await expect(trigger).toBeVisible();
        const geometry = await trigger.evaluate((button) => {
          const root = button.parentElement!;
          const host = root.closest<HTMLElement>(
            '.searchbar, .masthead-search',
          )!;
          const label = button.querySelector<HTMLElement>(
            'span:nth-of-type(2)',
          )!;
          const rootStyle = getComputedStyle(root);
          const hostStyle = getComputedStyle(host);
          const labelStyle = getComputedStyle(label);
          const hostContentWidth =
            host.clientWidth -
            Number.parseFloat(hostStyle.paddingLeft) -
            Number.parseFloat(hostStyle.paddingRight);
          const textRange = document.createRange();
          textRange.selectNodeContents(label);

          return {
            rootWidth: root.getBoundingClientRect().width,
            triggerWidth: button.getBoundingClientRect().width,
            expectedWidth: Math.min(
              Number.parseFloat(rootStyle.maxWidth),
              hostContentWidth,
            ),
            labelWhiteSpace: labelStyle.whiteSpace,
            labelLineCount: textRange.getClientRects().length,
            scrollWidth: document.documentElement.scrollWidth,
            innerWidth: window.innerWidth,
          };
        });

        const label = `${url} @ ${width}px`;
        expect(
          Math.abs(geometry.rootWidth - geometry.triggerWidth),
          `${label}: root and trigger widths match`,
        ).toBeLessThanOrEqual(1);
        expect(
          Math.abs(geometry.rootWidth - geometry.expectedWidth),
          `${label}: root fills host up to 26rem`,
        ).toBeLessThanOrEqual(1);
        expect(
          geometry.labelWhiteSpace,
          `${label}: trigger copy stays on one line`,
        ).toBe('nowrap');
        expect(
          geometry.labelLineCount,
          `${label}: trigger copy has one text line`,
        ).toBe(1);
        expect(
          geometry.scrollWidth,
          `${label}: no horizontal overflow`,
        ).toBeLessThanOrEqual(geometry.innerWidth + 1);
      }
    }
  });

  test('test_scaling_search_dialog_controls_do_not_compress', async ({
    page,
  }) => {
    for (const url of ['/', CHAPTER]) {
      for (const size of NARROW_SEARCH_SIZES) {
        await page.setViewportSize(size);
        await page.goto(url);
        await page.waitForSelector('html[data-search-ready="true"]');
        await page.locator('button[aria-haspopup="dialog"]').click();

        const dialog = page.getByRole('dialog');
        const input = page.getByRole('combobox');
        await expect(dialog).toBeVisible();
        await expect(input).toBeFocused();

        const geometry = await input.evaluate((combobox) => {
          const field = combobox.parentElement!;
          const icon = combobox.previousElementSibling as HTMLElement;
          const close = combobox.nextElementSibling as HTMLElement;
          const dialog = field.closest<HTMLElement>('[role="dialog"]')!;
          const fieldStyle = getComputedStyle(field);
          const iconStyle = getComputedStyle(icon);
          const closeStyle = getComputedStyle(close);
          const toRect = (element: Element) => {
            if (element.getClientRects().length === 0) return null;
            const box = element.getBoundingClientRect();
            return {
              x: box.x,
              y: box.y,
              width: box.width,
              height: box.height,
              right: box.right,
              bottom: box.bottom,
            };
          };

          return {
            input: toRect(combobox)!,
            close: toRect(close)!,
            closeComputedWidth: Number.parseFloat(closeStyle.width),
            closeComputedHeight: Number.parseFloat(closeStyle.height),
            icon: toRect(icon),
            iconDisplay: iconStyle.display,
            fieldGap: Number.parseFloat(fieldStyle.columnGap),
            fieldPaddingLeft: Number.parseFloat(fieldStyle.paddingLeft),
            fieldPaddingRight: Number.parseFloat(fieldStyle.paddingRight),
            dialog: toRect(dialog)!,
            scrollWidth: document.documentElement.scrollWidth,
            innerWidth: window.innerWidth,
          };
        });

        const label = `${url} @ ${size.width}×${size.height}`;
        expect(
          geometry.input.width,
          `${label}: query input remains usable`,
        ).toBeGreaterThanOrEqual(192);
        expect(
          geometry.closeComputedWidth,
          `${label}: close target width`,
        ).toBeGreaterThanOrEqual(32);
        expect(
          geometry.closeComputedHeight,
          `${label}: close target height`,
        ).toBeGreaterThanOrEqual(32);
        expect(
          geometry.input.right,
          `${label}: input and close target do not overlap`,
        ).toBeLessThanOrEqual(geometry.close.x + 1);
        expect(
          geometry.dialog.x,
          `${label}: dialog left edge in viewport`,
        ).toBeGreaterThanOrEqual(-1);
        expect(
          geometry.dialog.right,
          `${label}: dialog right edge in viewport`,
        ).toBeLessThanOrEqual(size.width + 1);
        expect(
          geometry.dialog.y,
          `${label}: dialog top edge in viewport`,
        ).toBeGreaterThanOrEqual(-1);
        expect(
          geometry.dialog.bottom,
          `${label}: dialog bottom edge in viewport`,
        ).toBeLessThanOrEqual(size.height + 1);
        expect(
          geometry.scrollWidth,
          `${label}: no horizontal overflow`,
        ).toBeLessThanOrEqual(geometry.innerWidth + 1);

        if (size.width === 320) {
          expect(geometry.icon, `${label}: decorative icon yields`).toBeNull();
          expect(
            geometry.iconDisplay,
            `${label}: decorative icon is hidden`,
          ).toBe('none');
          expect(
            geometry.fieldGap,
            `${label}: narrow field gap`,
          ).toBeLessThanOrEqual(8);
          expect(
            geometry.fieldPaddingLeft,
            `${label}: narrow left padding`,
          ).toBeLessThanOrEqual(8);
          expect(
            geometry.fieldPaddingRight,
            `${label}: narrow right padding`,
          ).toBeLessThanOrEqual(8);
        } else {
          expect(
            geometry.icon,
            `${label}: decorative icon is visible`,
          ).not.toBeNull();
          expect(
            geometry.icon!.right,
            `${label}: icon and input do not overlap`,
          ).toBeLessThanOrEqual(geometry.input.x + 1);
        }

        await page.getByRole('button', { name: 'Close search' }).click();
        await expect(dialog).toBeHidden();
      }
    }
  });
});
