import { defineConfig } from '@playwright/test';

// Standalone config for the Electron desktop-shell E2E. It is deliberately
// separate from the default `playwright.config.ts` (whose `testMatch` selects
// only the browser specs and whose `webServer` builds + serves `dist/` over
// HTTP): the Electron spec drives a real app via `_electron.launch`, needs no
// web server, and must not run inside the browser suite. Invoked by the
// `check:electron` npm script after `astro build`.
export default defineConfig({
  testDir: './e2e',
  testMatch: '**/electron.spec.ts',
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list']],
  outputDir: 'test-results/electron',
});
