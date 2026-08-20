import { test, expect } from "@playwright/test";

// INT-0013 (criteria 2–4, browser half): a responsive sweep guarding against the
// scaling defects the desktop shell surfaced. A viewport-width matrix from the
// shell's minimum up through ultrawide, over the reader, the Bibliotheca, and the
// open search overlay, asserting no horizontal overflow, the dialog stays within
// the viewport, and the layout mode matches the intended breakpoint. (The shell's
// zoom-lock — the other half of criterion 4 — is e2e/electron.spec.ts.)

const WIDTHS = [480, 600, 768, 800, 1024, 1280, 1920, 2560];
const HEIGHT = 900;
const CHAPTER = "/tome/getting-started"; // a chapter with H2s → the rail can appear
const CHAPTER_WITHOUT_RAIL = "/tome/about";
const WIDE_WIDTHS = [1280, 1920, 2560];

test.describe("scaling", () => {
  test("test_scaling_no_overflow", async ({ page }) => {
    for (const url of ["/", CHAPTER]) {
      await page.goto(url);
      for (const width of WIDTHS) {
        await page.setViewportSize({ width, height: HEIGHT });
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

  test("test_scaling_dialog_in_viewport", async ({ page }) => {
    await page.goto(CHAPTER);
    await page.waitForSelector('html[data-search-ready="true"]');
    for (const width of WIDTHS) {
      await page.setViewportSize({ width, height: HEIGHT });
      await page.keyboard.press("/");
      const dialog = page.getByRole("dialog");
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

      await page.keyboard.press("Escape");
      await expect(dialog).toBeHidden();
    }
  });

  test("test_scaling_layout_mode", async ({ page }) => {
    await page.goto(CHAPTER);
    // Layout mode is CSS-grid driven (responds to width on resize): whether the
    // sidebar and content sit side-by-side, and whether the rail column shows.
    const mode = () =>
      page.evaluate(() => {
        const nav = document.querySelector(
          'nav[aria-label="Table of contents"]',
        )!;
        const content = document.querySelector("main.content")!;
        const rail = document.querySelector(".rail-col");
        const a = nav.getBoundingClientRect();
        const b = content.getBoundingClientRect();
        return {
          sideBySide: b.left >= a.right - 1,
          railVisible: !!rail && getComputedStyle(rail).display !== "none",
        };
      });

    // Below the small breakpoint (769px): a single stacked column.
    await page.setViewportSize({ width: 600, height: HEIGHT });
    expect((await mode()).sideBySide, "stacked below 769px").toBe(false);

    // Two columns at ≥ 769px, still no rail below 1024px.
    await page.setViewportSize({ width: 900, height: HEIGHT });
    let m = await mode();
    expect(m.sideBySide, "two columns ≥ 769px").toBe(true);
    expect(m.railVisible, "no rail below 1024px").toBe(false);

    // Three columns (with the rail) at ≥ 1024px.
    await page.setViewportSize({ width: 1280, height: HEIGHT });
    m = await mode();
    expect(m.sideBySide, "side-by-side ≥ 1024px").toBe(true);
    expect(m.railVisible, "rail present ≥ 1024px").toBe(true);
  });

  test("test_scaling_reader_column_centered", async ({ page }) => {
    for (const url of [CHAPTER, CHAPTER_WITHOUT_RAIL]) {
      for (const width of WIDE_WIDTHS) {
        await page.setViewportSize({ width, height: HEIGHT });
        await page.goto(url);

        const geometry = await page.evaluate(() => {
          const content = document.querySelector<HTMLElement>("main.content")!;
          const column = content.querySelector<HTMLElement>(".reading-column")!;
          const prose = column.querySelector<HTMLElement>(".tome-prose")!;
          const pager = column.querySelector<HTMLElement>(
            'nav[aria-label="Chapter navigation"]',
          )!;
          const searchbar = column.querySelector<HTMLElement>(".searchbar")!;
          const trigger = searchbar.querySelector<HTMLElement>(
            'button[aria-haspopup="dialog"]',
          )!;
          const rail = document.querySelector<HTMLElement>(".rail-col");

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
            railVisible: !!rail && getComputedStyle(rail).display !== "none",
          };
        });

        const label = `${url} @ ${width}px`;
        expect(
          geometry.column.width,
          `${label}: column respects measure`,
        ).toBeLessThanOrEqual(geometry.columnMaxWidth + 1);
        for (const [name, box] of [
          ["column", geometry.column],
          ["prose", geometry.prose],
          ["pager", geometry.pager],
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

  test("test_scaling_reader_column_stable_with_mobile_nav", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 600, height: HEIGHT });
    await page.goto(CHAPTER);
    await page.waitForSelector("body.js-nav");

    const toggle = page.getByRole("button", {
      name: "Toggle table of contents",
    });
    const geometry = () =>
      page.evaluate(() => {
        const column = document.querySelector<HTMLElement>(".reading-column")!;
        const box = column.getBoundingClientRect();
        return {
          center: box.x + box.width / 2,
          scrollWidth: document.documentElement.scrollWidth,
          innerWidth: window.innerWidth,
        };
      });

    if ((await toggle.getAttribute("aria-expanded")) === "true") {
      await toggle.click();
      await expect(toggle).toHaveAttribute("aria-expanded", "false");
    } else {
      await expect(toggle).toHaveAttribute("aria-expanded", "false");
    }

    const closed = await geometry();
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    const open = await geometry();
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    const closedAgain = await geometry();

    for (const [name, state] of [
      ["closed", closed],
      ["open", open],
      ["closed again", closedAgain],
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
});
