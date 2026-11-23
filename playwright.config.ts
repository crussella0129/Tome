import { defineConfig } from '@playwright/test';

// Default E2E builds and serves the bundled reader. A fixture gate selects an
// isolated mode after it has already built its fixture, so that mode serves the
// existing dist/ without mutating the shared content or build trees:
// check-external-build.mjs an external mdBook, check-documents.mjs a folder of
// loose documents (INT-0029).
const fixtureMode =
  process.env.TOME_EXTERNAL_BOOK_E2E === '1'
    ? { spec: '**/external-book.spec.ts', port: 4322, output: 'test-results/external-book' }
    : process.env.TOME_DOCUMENTS_E2E === '1'
      ? { spec: '**/documents.spec.ts', port: 4323, output: 'test-results/documents' }
      : null;
const PORT = fixtureMode?.port ?? 4321;

export default defineConfig({
  testDir: './e2e',
  testMatch: fixtureMode
    ? fixtureMode.spec
    : ['**/reader.spec.ts', '**/search.spec.ts', '**/scaling.spec.ts', '**/theme.spec.ts'],
  fullyParallel: !fixtureMode,
  workers: fixtureMode ? 1 : undefined,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  // `list` for readable console output; `html` produces `playwright-report/`
  // (never auto-opened) so CI can upload it as an artifact.
  reporter: fixtureMode ? [['list']] : [['list'], ['html', { open: 'never' }]],
  outputDir: fixtureMode?.output ?? 'test-results',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'on-first-retry',
  },
  webServer: {
    // A foreground static server (not `astro preview`, which daemonizes and
    // races the readiness check). A fixture mode consumes the build its gate
    // owns; default mode always builds fresh.
    command: fixtureMode
      ? 'node scripts/serve-dist.mjs'
      : 'npm run build && node scripts/serve-dist.mjs',
    url: `http://localhost:${PORT}`,
    // The default build always presents the committed sample: pin the empty
    // fixture manifest and clear the book env vars, so a developer's personal
    // tome.local.toml (or shell exports) can never change what the suite sees.
    env: fixtureMode
      ? { PORT: String(PORT) }
      : {
          PORT: String(PORT),
          TOME_CONFIG: 'fixtures/empty-library.toml',
          TOME_BOOK: '',
          TOME_BOOKS: '',
        },
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
