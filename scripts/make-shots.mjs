// Captures the README feature gallery: clean screenshots of the built reader,
// driven with Playwright against `dist/` (served by scripts/serve-dist.mjs). Run
// after `astro build`:
//
//   npm run build && node scripts/make-shots.mjs
//
// Writes docs/assets/shots/*.png. Reuses the e2e hydration signals
// (data-search-ready / js-nav) so the captures are deterministic.
import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'docs', 'assets', 'shots');
const PORT = 4399;
const BASE = `http://localhost:${PORT}`;

await mkdir(OUT, { recursive: true });

// Serve the built dist/ in the foreground child (same server the E2E uses).
const server = spawn(process.execPath, [join(ROOT, 'scripts', 'serve-dist.mjs')], {
  cwd: ROOT,
  env: { ...process.env, PORT: String(PORT) },
  stdio: 'ignore',
});

async function waitForServer() {
  for (let i = 0; i < 50; i++) {
    try {
      const res = await fetch(BASE + '/');
      if (res.ok) return;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error('serve-dist did not come up');
}

const browser = await chromium.launch();
try {
  await waitForServer();
  const page = await browser.newPage({ viewport: { width: 1280, height: 820 }, deviceScaleFactor: 2 });
  const shot = (name) => page.screenshot({ path: join(OUT, `${name}.png`) });

  // 1. The Bibliotheca (the library shelf) — the default landing.
  await page.goto(`${BASE}/`);
  await page.waitForSelector('[data-search-ready="true"]').catch(() => {});
  await shot('bibliotheca');

  // 2. The reader — sidebar + tome switcher + a chapter (3-column with the rail).
  await page.goto(`${BASE}/tome/getting-started`);
  await page.waitForSelector('body.js-nav');
  await shot('reader');

  // 3. The library-wide search overlay, open with results (over the Bibliotheca,
  // so the scrim reads cleanly).
  await page.goto(`${BASE}/`);
  await page.waitForSelector('[data-search-ready="true"]');
  await page.keyboard.press('/');
  await page.waitForSelector('[role="dialog"]');
  await page.getByRole('combobox').fill('reading');
  await page.waitForSelector('[role="option"]');
  await page.waitForTimeout(150);
  await shot('search');

  // 4. Rich content rendering — tables, figures, and blockquotes.
  await page.goto(`${BASE}/tome/components/panels`);
  await page.waitForSelector('body.js-nav');
  await page.locator('.tome-prose table, .tome-prose img').first().scrollIntoViewIfNeeded();
  await page.waitForTimeout(150);
  await shot('content');

  // 5. The warm-dark theme.
  await page.goto(`${BASE}/tome/getting-started`);
  await page.waitForSelector('body.js-nav');
  await page.getByRole('button', { name: 'Switch colour theme' }).click();
  await page.waitForSelector('body.theme-terminal-dark');
  await page.waitForTimeout(150);
  await shot('dark');

  // 6. The "on this page" rail (feature the rail column).
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${BASE}/tome/getting-started`);
  await page.waitForSelector('body.js-nav');
  const rail = page.getByRole('navigation', { name: 'On this page' });
  await rail.screenshot({ path: join(OUT, 'rail.png') });

  console.log(`shots → ${OUT} (bibliotheca, reader, search, content, dark, rail)`);
} finally {
  await browser.close();
  server.kill();
}
