// @ts-check
import { defineConfig } from 'astro/config';
import solid from '@astrojs/solid-js';
import tailwindcss from '@tailwindcss/vite';

// Static output: the chapter body is server-rendered HTML with zero JS by
// default; only the sidebar island hydrates. Tailwind v4 is wired through the
// Vite plugin (not a PostCSS step).
export default defineConfig({
  site: 'https://example.com',
  integrations: [solid()],
  vite: {
    plugins: [tailwindcss()],
  },
});
