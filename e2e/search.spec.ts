import { test, expect } from '@playwright/test';

// INT-0008 criteria 2 + 4: the `/` shortcut opens the overlay, results list, and
// a result navigates to the right chapter — against the built single-tome site
// (search index served at /search-index.json, one idle island).
test.describe('Tome search', () => {
  test('test_search_shortcut_opens_and_navigates', async ({ page }) => {
    await page.goto('/');
    // Wait for the island to hydrate (deterministic signal, not a timeout).
    await page.waitForSelector('html[data-search-ready="true"]');

    // "/" opens the overlay and focuses the query field.
    await page.keyboard.press('/');
    const dialog = page.getByRole('dialog', { name: /search the library/i });
    await expect(dialog).toBeVisible();
    const input = page.getByRole('combobox');
    await expect(input).toBeFocused();

    // Typing lists results.
    await input.fill('components');
    await expect(page.getByRole('option').first()).toBeVisible();

    // Guard: "/" typed inside the field is text, not a re-trigger.
    await input.press('/');
    await expect(input).toHaveValue('components/');

    // Activating a result navigates to that chapter (with its heading anchor).
    await input.fill('panels');
    const result = page.getByRole('option').getByRole('link').first();
    await expect(result).toHaveAttribute('href', /\/components\/panels/);
    await result.click();
    await expect(page).toHaveURL(/\/components\/panels/);
  });
});
