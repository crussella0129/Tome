import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
import solid from 'vite-plugin-solid';

// Solid component tests need the Solid Vite plugin plus the `development` +
// `browser` resolve conditions so `solid-js` loads its client build under
// jsdom. Pure `.ts` tests (the SUMMARY parser, contrast math) run the same way.
export default defineConfig({
  // `hot: false` disables solid-refresh, which is dev-only and errors under the
  // Vitest/SSR transform (`file:///@solid-refresh`).
  plugins: [solid({ hot: false })],
  resolve: {
    conditions: ['development', 'browser'],
    // The app reads the generated library through `@library`; tests read the
    // committed sample instead, whatever personal books a developer has loaded.
    alias: { '@library': fileURLToPath(new URL('./src/content/books', import.meta.url)) },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
});
