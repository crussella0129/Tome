import { test, expect, _electron as electron, type ElectronApplication, type Page } from '@playwright/test';
import { join } from 'node:path';
import { existsSync } from 'node:fs';

// End-to-end proof of the Electron desktop shell (INT-0012 criterion 4). Drives
// the real app via `_electron.launch` against the built `dist/` — no dev server,
// no network. Run via `npm run check:electron` (which builds first) using the
// dedicated `playwright.electron.config.ts`.

const MAIN = join(process.cwd(), 'electron', 'main.cjs');
const ORIGIN = 'app://tome';

test.describe.configure({ mode: 'serial' });

test.describe('Tome desktop shell', () => {
  let app: ElectronApplication;
  let page: Page;

  test.beforeAll(async () => {
    // The shell serves the built site; `check:electron` runs `astro build` first.
    expect(existsSync(join(process.cwd(), 'dist', 'index.html')), 'dist/ must be built before the Electron E2E').toBe(true);
    app = await electron.launch({ args: [MAIN] });
    page = await app.firstWindow();
    await page.waitForLoadState('domcontentloaded');
  });

  test.afterAll(async () => {
    await app?.close();
  });

  // Criterion 1 + 4 — a chapter renders offline via the app:// protocol.
  test('test_electron_reader_offline', async () => {
    // Loaded through the custom protocol, not http/file.
    expect(page.url()).toContain(`${ORIGIN}/`);

    // The chapter heading is rendered from the built HTML.
    await expect(page.getByRole('heading', { level: 1, name: 'Introduction' })).toBeVisible();

    // The sidebar table of contents is present with chapter links.
    const nav = page.getByRole('navigation', { name: 'Table of contents' });
    await expect(nav.getByRole('link', { name: 'Getting Started' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'About' })).toBeVisible();
  });

  // Criterion 4 — the search index is reachable and searchable, offline.
  test('test_electron_search_index', async () => {
    const result = await page.evaluate(async () => {
      const res = await fetch('/search-index.json');
      const data = await res.json();
      const records = Array.isArray(data) ? data : (data.records ?? []);
      return { ok: res.ok, url: res.url, count: records.length };
    });
    expect(result.ok).toBe(true);
    // Resolved against the app origin, not a network host.
    expect(result.url).toBe(`${ORIGIN}/search-index.json`);
    expect(result.count).toBeGreaterThan(0);
  });

  // Criterion 3 — the window uses a secure configuration.
  test('test_electron_secure_config', async () => {
    const prefs = await app.evaluate(async ({ BrowserWindow }) => {
      const win = BrowserWindow.getAllWindows()[0];
      return win.webContents.getLastWebPreferences();
    });
    expect(prefs?.contextIsolation).toBe(true);
    expect(prefs?.nodeIntegration).toBe(false);
    expect(prefs?.sandbox).toBe(true);

    // Sandbox + isolation: the renderer has no Node primitives.
    const rendererLocked = await page.evaluate(
      () =>
        typeof (globalThis as Record<string, unknown>).require === 'undefined' &&
        typeof (globalThis as Record<string, unknown>).module === 'undefined' &&
        typeof (globalThis as Record<string, unknown>).process === 'undefined',
    );
    expect(rendererLocked).toBe(true);
  });

  // Criterion 2 — external http(s) links open in the OS browser, not in-app;
  // other schemes are denied; internal navigation stays in the window.
  test('test_electron_external_link', async () => {
    // Record openExternal calls in the main process instead of launching a browser.
    await app.evaluate(async ({ shell }) => {
      (globalThis as Record<string, unknown>).__opened = [];
      shell.openExternal = (u: string) => {
        ((globalThis as Record<string, unknown>).__opened as string[]).push(u);
        return Promise.resolve();
      };
    });

    await page.evaluate(() => window.open('https://example.com/'));
    await page.evaluate(() => window.open('mailto:someone@example.com'));

    const opened = await app.evaluate(
      async () => (globalThis as Record<string, unknown>).__opened as string[],
    );
    const windowCount = await app.evaluate(
      async ({ BrowserWindow }) => BrowserWindow.getAllWindows().length,
    );

    // The https link was handed to the OS browser…
    expect(opened).toContain('https://example.com/');
    // …the mailto (non-http) scheme was denied, not opened…
    expect(opened.some((u) => u.startsWith('mailto:'))).toBe(false);
    // …and no external target spawned an in-app window.
    expect(windowCount).toBe(1);
    expect(page.url()).toContain(`${ORIGIN}/`);
  });
});
