import { defineConfig } from 'vitest/config';
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
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
});
