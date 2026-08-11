import { defineConfig } from '@playwright/test';

// E2E runs against the production build via `astro preview` (hydration and the
// static output match what ships), not the dev server.
const PORT = 4321;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  // `list` for readable console output; `html` produces `playwright-report/`
  // (never auto-opened) so CI can upload it as an artifact.
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'on-first-retry',
  },
  webServer: {
    // A foreground static server (not `astro preview`, which daemonizes and
    // races the readiness check). Always fresh — never reuse a stale build.
    command: 'npm run build && node scripts/serve-dist.mjs',
    url: `http://localhost:${PORT}`,
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
