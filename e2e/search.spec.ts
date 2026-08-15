import { test, expect } from '@playwright/test';

// INT-0008 criteria 2 + 4: the `/` shortcut opens the overlay, results list, and a
// result navigates to the right chapter. The default library now ships two tomes
// (INT-0014), so `/` is the Bibliotheca (which also carries the search control) and
// chapters are namespaced under their tome slug.
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

    // Activating a result navigates to that chapter (namespaced under its tome).
    await input.fill('panels');
    const result = page.getByRole('option').getByRole('link').first();
    await expect(result).toHaveAttribute('href', /\/tome\/components\/panels/);
    await result.click();
    await expect(page).toHaveURL(/\/tome\/components\/panels/);
  });

  // INT-0014 #4 — search is library-wide: a term present in both tomes returns
  // hits attributed to each tome.
  test('test_search_across_tomes', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('html[data-search-ready="true"]');
    await page.keyboard.press('/');
    const input = page.getByRole('combobox');
    await input.fill('reading'); // present in both "Tome" and "Marginalia"

    const listbox = page.getByRole('listbox');
    await expect(page.getByRole('option').first()).toBeVisible();
    // Results carry their tome's name; both tomes are represented.
    await expect(listbox).toContainText('Marginalia');
    await expect(listbox).toContainText('Tome');
  });
});
