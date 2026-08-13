import { defineConfig } from '@playwright/test';

// Default E2E builds and serves the bundled reader. The external-book gate
// selects an isolated mode after it has already built its fixture, so that mode
// serves the existing dist/ without mutating the shared content or build trees.
const externalBookMode = process.env.TOME_EXTERNAL_BOOK_E2E === '1';
const PORT = externalBookMode ? 4322 : 4321;

export default defineConfig({
  testDir: './e2e',
  testMatch: externalBookMode ? '**/external-book.spec.ts' : '**/reader.spec.ts',
  fullyParallel: !externalBookMode,
  workers: externalBookMode ? 1 : undefined,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  // `list` for readable console output; `html` produces `playwright-report/`
  // (never auto-opened) so CI can upload it as an artifact.
  reporter: externalBookMode ? [['list']] : [['list'], ['html', { open: 'never' }]],
  outputDir: externalBookMode ? 'test-results/external-book' : 'test-results',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'on-first-retry',
  },
  webServer: {
    // A foreground static server (not `astro preview`, which daemonizes and
    // races the readiness check). External mode consumes the fixture build
    // owned by check-external-build.mjs; default mode always builds fresh.
    command: externalBookMode
      ? 'node scripts/serve-dist.mjs'
      : 'npm run build && node scripts/serve-dist.mjs',
    url: `http://localhost:${PORT}`,
    env: { PORT: String(PORT) },
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
